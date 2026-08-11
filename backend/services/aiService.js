const db = require('../config/db');
const axios = require('axios');

/**
 * AI Service for Kaarkun
 */
const AIService = {
    /**
     * Smart Job-Provider Matching Algorithm
     */
    getSmartMatchingJobs: async (providerId) => {
        // 1. Fetch provider details
        const [providers] = await db.execute(
            `SELECT p.category_id, p.rating, p.success_rate, u.latitude, u.longitude
             FROM provider_profiles p
             JOIN users u ON p.user_id = u.id
             WHERE p.user_id = ?`,
            [providerId]
        );

        if (providers.length === 0) {
            // Fallback: return standard open jobs
            const [jobs] = await db.execute(
                `SELECT j.*, c.name as category_name, u.full_name as customer_name
                 FROM jobs j
                 LEFT JOIN categories c ON j.category_id = c.id
                 JOIN users u ON j.customer_id = u.id
                 WHERE j.status = 'open'
                 ORDER BY j.created_at DESC`
            );
            return jobs.map(job => ({ ...job, match_score: 50, match_reasons: ['Profile incomplete. Showing general jobs.'] }));
        }

        const provider = providers[0];

        // 2. Fetch all open jobs
        const [jobs] = await db.execute(
            `SELECT j.*, c.name as category_name, u.full_name as customer_name, u.avatar as customer_avatar,
                    (SELECT COUNT(*) FROM bids WHERE job_id = j.id) as bid_count
             FROM jobs j
             LEFT JOIN categories c ON j.category_id = c.id
             JOIN users u ON j.customer_id = u.id
             WHERE j.status = 'open'`
        );

        // 3. Score each job
        const scoredJobs = jobs.map(job => {
            let score = 0;
            const reasons = [];

            // Category Match (Up to 45 points)
            if (job.category_id === provider.category_id) {
                score += 45;
                reasons.push('Matches your primary skill');
            }

            // Proximity Score (Up to 30 points)
            if (provider.latitude && provider.longitude && job.latitude && job.longitude) {
                const distance = AIService.calculateDistance(
                    provider.latitude, provider.longitude,
                    job.latitude, job.longitude
                );

                job.distance_km = parseFloat(distance.toFixed(1));

                if (distance <= 5) {
                    score += 30;
                    reasons.push('Very close to your location (< 5 km)');
                } else if (distance <= 15) {
                    score += 20;
                    reasons.push('Nearby location (< 15 km)');
                } else if (distance <= 30) {
                    score += 10;
                    reasons.push('Within work distance (< 30 km)');
                } else {
                    reasons.push('Far from your location');
                }
            } else {
                reasons.push('Location not set; generic scoring applied');
            }

            // Provider Quality Factors (Rating / Success Rate) (Up to 15 points)
            const ratingScore = Math.min((provider.rating || 0) * 2, 10);
            score += ratingScore;
            if (provider.rating >= 4.0) {
                reasons.push('Boosted due to your high ratings');
            }

            const successScore = Math.min((provider.success_rate || 0) * 0.05, 5);
            score += successScore;

            // Emergency / Priority Bonus (10 points)
            if (job.is_emergency) {
                score += 10;
                reasons.push('Emergency request matching your profile');
            }

            return {
                ...job,
                match_score: Math.round(score),
                match_reasons: reasons
            };
        });

        // 4. Sort by matching score descending
        return scoredJobs.sort((a, b) => b.match_score - a.match_score);
    },

    /**
     * Proximity calculator (Haversine formula in KM)
     */
    calculateDistance: (lat1, lon1, lat2, lon2) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    },

    /**
     * Bid Price Suggester Logic
     */
    getBidPriceSuggestion: async (jobId) => {
        // Fetch current job
        const [jobs] = await db.execute(
            'SELECT category_id, budget FROM jobs WHERE id = ?',
            [jobId]
        );

        if (jobs.length === 0) return null;
        const job = jobs[0];

        // Search for completed bids in the same category
        const [historicalBids] = await db.execute(
            `SELECT b.amount FROM bids b
             JOIN jobs j ON b.job_id = j.id
             WHERE j.category_id = ? AND b.status = 'accepted' AND j.status = 'completed'
             LIMIT 30`,
            [job.category_id]
        );

        let suggestedMin, suggestedMax, avgPrice;

        if (historicalBids.length >= 3) {
            const sum = historicalBids.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
            avgPrice = sum / historicalBids.length;
            suggestedMin = Math.round(avgPrice * 0.85);
            suggestedMax = Math.round(avgPrice * 1.15);
        } else {
            // Fallback to job budget
            const budgetVal = parseFloat(job.budget) || 1000; // default 1000 if not set
            avgPrice = budgetVal;
            suggestedMin = Math.round(budgetVal * 0.8);
            suggestedMax = Math.round(budgetVal * 1.1);
        }

        return {
            jobId,
            suggestedMin,
            suggestedMax,
            averagePrice: Math.round(avgPrice),
            hasHistoricalData: historicalBids.length >= 3
        };
    },

    /**
     * Fraud & Fake Review Detection
     */
    detectReviewFraud: async () => {
        const flags = [];

        // Check 1: Review posted too quickly after booking confirmation
        // Booking creation to Review creation is < 60 seconds
        const [quickReviews] = await db.execute(
            `SELECT r.id as review_id, r.comment, r.rating, r.customer_id, r.provider_id,
                    u_cust.full_name as customer_name, u_prov.full_name as provider_name,
                    r.created_at as review_time, b.created_at as booking_time,
                    TIMESTAMPDIFF(SECOND, b.created_at, r.created_at) as time_diff_seconds
             FROM reviews r
             JOIN bookings b ON r.booking_id = b.id
             JOIN users u_cust ON r.customer_id = u_cust.id
             JOIN users u_prov ON r.provider_id = u_prov.id
             WHERE TIMESTAMPDIFF(SECOND, b.created_at, r.created_at) < 120`
        );

        for (const review of quickReviews) {
            flags.push({
                type: 'VELOCITY_ANOMALY',
                severity: 'high',
                message: `Review posted extremely fast (${review.time_diff_seconds} seconds) after booking initialization.`,
                details: review
            });
        }

        // Check 2: High density of 5-star reviews between the exact same customer and provider
        const [repeatedRatings] = await db.execute(
            `SELECT r.customer_id, r.provider_id,
                    u_cust.full_name as customer_name, u_prov.full_name as provider_name,
                    COUNT(*) as review_count, AVG(r.rating) as avg_rating
             FROM reviews r
             JOIN users u_cust ON r.customer_id = u_cust.id
             JOIN users u_prov ON r.provider_id = u_prov.id
             GROUP BY r.customer_id, r.provider_id
             HAVING review_count >= 3 AND avg_rating >= 4.8`
        );

        for (const pattern of repeatedRatings) {
            flags.push({
                type: 'RECIPROCAL_RATING_COLLUSION',
                severity: 'medium',
                message: `Frequent high rating matches: ${pattern.customer_name} left ${pattern.review_count} reviews (avg ${pattern.avg_rating.toFixed(1)} stars) for ${pattern.provider_name}.`,
                details: pattern
            });
        }

        return flags;
    },

    /**
     * Job Description Autocomplete LLM API Wrapper
     */
    autocompleteJobDescription: async (partialText) => {
        if (!partialText || partialText.trim().length < 5) {
            return { completion: "", suggestions: [] };
        }

        // Fetch real categories from DB so the AI uses exact names
        let categoryList = 'Plumber, Electrician, Carpenter, Painter, Cleaning, AC Repair, Appliance Repair, Gardener';
        let dbCategories = [];
        try {
            const [rows] = await db.execute('SELECT id, name FROM categories ORDER BY name');
            if (rows.length > 0) {
                dbCategories = rows;
                categoryList = rows.map(c => c.name).join(', ');
            }
        } catch (e) {
            console.warn('[AI] Could not fetch categories from DB, using defaults:', e.message);
        }

        const fallbackTemplates = [
            {
                keywords: ['leak', 'pipe', 'water', 'plumber', 'tap', 'sink', 'drain', 'toilet'],
                completion: 'Fixing a leaking pipe/faucet under the kitchen counter. Need to replace the washer or seal to stop the slow drip. Should inspect surrounding joints for wear.',
                categoryKeyword: 'plumb',
                suggested_budget: '1500'
            },
            {
                keywords: ['fan', 'light', 'wire', 'switch', 'electricity', 'electrician', 'socket', 'wiring', 'power'],
                completion: 'Installing a new ceiling fan and replacing a faulty wall switch. The wiring is already in place, but need someone to mount it and check connections.',
                categoryKeyword: 'electri',
                suggested_budget: '2000'
            },
            {
                keywords: ['ac', 'cool', 'repair', 'split', 'gas', 'compressor', 'air condition'],
                completion: 'AC general cleaning and gas charging. The indoor unit is blowing air but not cooling properly. Need filter cleaning and pressure check.',
                categoryKeyword: 'ac',
                suggested_budget: '3500'
            },
            {
                keywords: ['door', 'wood', 'lock', 'hinge', 'cabinet', 'carpenter', 'furniture', 'shelf'],
                completion: 'Repairing a sagging kitchen cabinet door and fitting a new lock on the main bedroom door. Will need new hinges and screws.',
                categoryKeyword: 'carpen',
                suggested_budget: '1800'
            },
            {
                keywords: ['paint', 'wall', 'room', 'brush', 'color', 'whitewash'],
                completion: 'Minor touch-up paint job on one bedroom wall. There are water damage stains. Need scraping, primer coating, and two coats of off-white paint.',
                categoryKeyword: 'paint',
                suggested_budget: '4500'
            },
            {
                keywords: ['clean', 'sweep', 'mop', 'dust', 'wash', 'hygiene', 'sanitize'],
                completion: 'Deep cleaning of the living room and kitchen area. Need scrubbing of tiles, mopping floors, wiping surfaces and cleaning windows.',
                categoryKeyword: 'clean',
                suggested_budget: '2500'
            },
            {
                keywords: ['garden', 'plant', 'lawn', 'grass', 'trim', 'tree', 'hedge'],
                completion: 'Trimming overgrown hedges and mowing the front lawn. Also need to remove some dead branches from the garden trees.',
                categoryKeyword: 'garden',
                suggested_budget: '1200'
            },
            {
                keywords: ['washing machine', 'fridge', 'refrigerator', 'appliance', 'microwave', 'oven', 'dishwasher'],
                completion: 'Repairing a washing machine that is not spinning properly. Need to inspect the drum motor and belt for wear and replace if required.',
                categoryKeyword: 'appliance',
                suggested_budget: '2200'
            }
        ];

        // Helper: find best matching DB category by keyword
        const findCategoryByKeyword = (keyword) => {
            if (!keyword) return null;
            const kw = keyword.toLowerCase();
            return dbCategories.find(c =>
                c.name.toLowerCase().includes(kw) || kw.includes(c.name.toLowerCase())
            ) || null;
        };

        // Pre-screen: if the title exactly matches (or closely matches) a real
        // category name, lock that category before calling the LLM so it can't
        // hallucinate a different one (e.g. user types "Gardener" → lock "Gardener").
        let lockedCategory = null;
        if (dbCategories.length > 0) {
            const lowerInput = partialText.toLowerCase().trim();
            const directMatch = dbCategories.find(c => {
                const cn = c.name.toLowerCase();
                return cn === lowerInput || cn.includes(lowerInput) || lowerInput.includes(cn);
            });
            if (directMatch) lockedCategory = directMatch.name;
        }

        // Try LLM call — give it the exact category names from the DB
        const categoryInstruction = lockedCategory
            ? `The category is already determined to be "${lockedCategory}" — use it exactly.`
            : `Pick EXACTLY one category from this list: [${categoryList}]`;

        const systemPrompt = `You are a helpful AI assistant for Kaarkun, an on-demand home service app in Pakistan.
Given a partial job title or description, return:
1. A complete, professional job description (2-3 sentences) relevant to the identified service type
2. The most appropriate category — ${categoryInstruction}
3. A suggested budget in PKR (Pakistani Rupees)

Respond ONLY with a raw JSON object (no markdown, no code fences, no extra text):
{"completedDescription": "full description text...", "category": "ExactCategoryNameFromList", "suggestedBudget": 1500}`;

        const llmResult = await AIService.callLLM(systemPrompt, `Job title/description: "${partialText}"`);
        if (llmResult) {
            try {
                // Strip markdown code fences if LLM wraps JSON in ```json ... ```
                const cleaned = llmResult.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
                const data = JSON.parse(cleaned);

                // If we pre-locked a category, always use it regardless of what LLM returned
                let resolvedCategory = lockedCategory || data.category;

                if (!lockedCategory && dbCategories.length > 0) {
                    // Validate/fix LLM's choice against real DB names
                    const exactMatch = dbCategories.find(
                        c => c.name.toLowerCase() === (data.category || '').toLowerCase()
                    );
                    if (!exactMatch) {
                        const fuzzy = dbCategories.find(c => {
                            const cn = c.name.toLowerCase();
                            const ai = (data.category || '').toLowerCase();
                            return cn.includes(ai) || ai.includes(cn);
                        });
                        resolvedCategory = fuzzy ? fuzzy.name : null;
                    } else {
                        resolvedCategory = exactMatch.name; // use DB casing
                    }
                }

                return {
                    completion: data.completedDescription,
                    category: resolvedCategory,
                    suggestedBudget: data.suggestedBudget
                };
            } catch (e) {
                console.error("Failed to parse LLM JSON response. Raw:", llmResult, "Error:", e.message);
                return {
                    completion: llmResult.trim(),
                    category: null,
                    suggestedBudget: '1500'
                };
            }
        }

        // Offline rule-based fallback — match by keyword then find real DB category
        const lowerText = partialText.toLowerCase();
        for (const item of fallbackTemplates) {
            if (item.keywords.some(kw => lowerText.includes(kw))) {
                const dbCat = findCategoryByKeyword(item.categoryKeyword);
                return {
                    completion: item.completion,
                    category: dbCat ? dbCat.name : item.categoryKeyword,
                    suggestedBudget: item.suggested_budget
                };
            }
        }

        // Absolute generic fallback
        return {
            completion: partialText + ' — Please specify details like the specific issue, which room/area, tools or materials needed, and any time constraints so providers can bid accurately.',
            category: null,
            suggestedBudget: '1500'
        };
    },

    /**
     * General Support Chatbot API
     */
    supportChatbot: async (message, history = [], user = null) => {
        // ── 1. Fetch live platform stats from DB ─────────────────────────────
        let stats = { onlineProviders: 0, totalCustomers: 0, availableJobs: 0, categoryBreakdown: '', topProvidersStr: '' };
        let userContext = '';

        try {
            const [[{ onlineProviders }]] = await db.execute('SELECT COUNT(*) as onlineProviders FROM provider_profiles WHERE is_online = 1');
            const [[{ totalCustomers }]] = await db.execute('SELECT COUNT(*) as totalCustomers FROM users WHERE role = "customer"');
            const [[{ availableJobs }]] = await db.execute('SELECT COUNT(*) as availableJobs FROM jobs WHERE status = "open"');
            const [[{ totalJobs }]] = await db.execute('SELECT COUNT(*) as totalJobs FROM jobs');
            const [[{ completedJobs }]] = await db.execute('SELECT COUNT(*) as completedJobs FROM jobs WHERE status = "completed"');
            const [[{ totalProviders }]] = await db.execute('SELECT COUNT(*) as totalProviders FROM provider_profiles');

            const [categories] = await db.execute(`
                SELECT c.name, COUNT(p.user_id) as count
                FROM categories c
                JOIN provider_profiles p ON c.id = p.category_id
                GROUP BY c.id ORDER BY count DESC
            `);
            const [topProviders] = await db.execute(`
                SELECT u.full_name, p.rating, c.name as category
                FROM provider_profiles p
                JOIN users u ON p.user_id = u.id
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE u.status = 'active'
                ORDER BY p.rating DESC LIMIT 5
            `);

            stats = {
                onlineProviders,
                totalCustomers,
                availableJobs,
                totalJobs,
                completedJobs,
                totalProviders,
                categoryBreakdown: categories.map(c => `${c.name}: ${c.count} providers`).join(', '),
                topProvidersStr: topProviders.map(p => `${p.full_name} (${p.category || 'General'}, ★${p.rating})`).join('; '),
            };
        } catch (error) {
            console.error('[Chatbot] Error fetching stats:', error.message);
        }

        try {
            if (user && user.id) {
                const [userData] = await db.execute('SELECT full_name, email, role FROM users WHERE id = ?', [user.id]);
                if (userData.length > 0) {
                    const u = userData[0];
                    userContext = `\nCurrent user: ${u.full_name} (${u.role})`;
                    if (u.role === 'provider') {
                        const [profileData] = await db.execute(`
                            SELECT p.rating, p.total_jobs, c.name as category, p.is_online
                            FROM provider_profiles p LEFT JOIN categories c ON p.category_id = c.id
                            WHERE p.user_id = ?`, [user.id]);
                        if (profileData.length > 0) {
                            const p = profileData[0];
                            userContext += `, Category: ${p.category || 'Not set'}, Rating: ${p.rating}, Jobs done: ${p.total_jobs}, Online: ${p.is_online ? 'Yes' : 'No'}`;
                        }
                    } else {
                        const [[{ jobsPosted }]] = await db.execute('SELECT COUNT(*) as jobsPosted FROM jobs WHERE customer_id = ?', [user.id]);
                        userContext += `, Jobs posted: ${jobsPosted}`;
                    }
                }
            }
        } catch (error) {
            console.error('[Chatbot] Error fetching user context:', error.message);
        }

        // ── 2. Build system prompt with all live data ────────────────────────
        const systemPrompt = `You are Kaarkun AI Support, a helpful assistant embedded in the Kaarkun service marketplace app.

HOW KAARKUN WORKS:
- Customers post jobs (title, description, category, budget, location, preferred date/time).
- Service providers browse open jobs and submit price bids.
- The customer reviews bids and accepts one, creating a Booking.
- After the job is done, both parties confirm completion and leave reviews.
- New provider accounts are "pending" until an admin verifies their CNIC and certificates (usually 24-48 hours).
- Categories: Plumber, Electrician, Carpenter, Painter, Cleaner, Gardener, AC Repair, Appliance Repair.

LIVE PLATFORM STATISTICS (answer questions using these exact numbers):
- Active/Open jobs right now: ${stats.availableJobs}
- Total jobs ever posted: ${stats.totalJobs}
- Completed jobs: ${stats.completedJobs}
- Registered customers: ${stats.totalCustomers}
- Total service providers: ${stats.totalProviders}
- Providers currently online: ${stats.onlineProviders}
- Provider breakdown by category: ${stats.categoryBreakdown || 'Data unavailable'}
- Top rated providers: ${stats.topProvidersStr || 'None yet'}
${userContext}

INSTRUCTIONS:
- Always answer directly using the live statistics above when the user asks about numbers, counts, or availability.
- Be friendly, concise (2-4 sentences max), and specific to Kaarkun.
- Do NOT use markdown, asterisks, bullet points, or code blocks in your response.
- Do NOT make up numbers — use only the statistics provided above.
- If you cannot answer, say so honestly and suggest they contact support@kaarkun.com.`;

        // ── 3. Build proper multi-turn message array ─────────────────────────
        // Pass history as actual chat messages, not as JSON text — this gives
        // the LLM real conversation context so follow-up questions work.
        const chatMessages = [
            ...history.slice(-8).map(h => ({
                role: h.role === 'assistant' ? 'assistant' : 'user',
                content: String(h.content)
            })),
            { role: 'user', content: message }
        ];

        // ── 4. Call LLM with proper chat format ──────────────────────────────
        const llmResult = await AIService.callChatLLM(systemPrompt, chatMessages);
        if (llmResult) {
            return llmResult.replace(/^["'`]+|["'`]+$/g, '').replace(/\*\*/g, '').replace(/\*/g, '').trim();
        }

        // ── 5. Rule-based fallback when all LLMs are unavailable ─────────────
        const q = message.toLowerCase();

        // Stats questions
        if (q.match(/how many|number of|count of|total/) && q.match(/job|work|task/)) {
            return `There are currently ${stats.availableJobs} open jobs available on Kaarkun. A total of ${stats.totalJobs} jobs have been posted, of which ${stats.completedJobs} have been completed.`;
        }
        if (q.match(/how many|number of|count of|total/) && q.match(/provider|worker|service/)) {
            return `Kaarkun has ${stats.totalProviders} registered service providers, with ${stats.onlineProviders} currently online and ready to accept jobs.`;
        }
        if (q.match(/how many|number of|count of|total/) && q.match(/customer|user/)) {
            return `There are ${stats.totalCustomers} registered customers on Kaarkun right now.`;
        }
        if (q.match(/online|available|active/) && q.match(/provider|worker/)) {
            return `There are ${stats.onlineProviders} providers currently online on Kaarkun. You can post a job and they will be notified immediately.`;
        }

        // How-to questions
        if (q.includes('post') && q.includes('job')) {
            return "To post a job, open the app as a customer, tap 'Post a Job', fill in the title, description, category, and budget, then tap Submit to start receiving bids.";
        }
        if (q.includes('pending') || q.includes('verify') || q.includes('approve') || q.includes('rejected')) {
            return "Your account stays pending until an admin reviews your CNIC and certificates. This usually takes 24 to 48 hours. Please ensure your uploaded documents are clear and readable.";
        }
        if (q.includes('bid') || (q.includes('provider') && q.includes('job'))) {
            return "As a provider, go to 'Find Jobs', tap on a job that matches your skills, then tap 'Place Bid' to enter your price and estimated completion time.";
        }
        if (q.includes('cancel') || q.includes('booking')) {
            return "To cancel a booking, open the booking details and tap 'Cancel'. Note that cancellations close to the job start time may affect your rating.";
        }
        if (q.includes('rating') || q.includes('review') || q.includes('star')) {
            return "After a job is marked complete, both the customer and provider can leave a star rating and written review for each other. Ratings build trust on the platform.";
        }
        if (q.includes('fee') || q.includes('charge') || q.includes('free') || q.includes('price') || q.includes('cost')) {
            return "Kaarkun is free to download and use. A small platform fee is applied to completed bookings, which is shown transparently before you confirm.";
        }
        if (q.includes('password') || q.includes('forgot') || q.includes('reset')) {
            return "On the login screen, tap 'Forgot Password', enter your email address, and we will send you a 6-digit OTP code to reset your password.";
        }
        if (q.includes('category') || q.includes('service') || q.includes('type')) {
            return "Kaarkun supports: Plumber, Electrician, Carpenter, Painter, Cleaner, Gardener, AC Repair, and Appliance Repair. More categories are coming soon!";
        }
        if (q.includes('contact') || q.includes('support') || q.includes('help') || q.includes('email')) {
            return "For further support, email us at support@kaarkun.com. Our team is available Monday to Saturday, 9 AM to 6 PM PKT.";
        }

        return `I'm here to help with Kaarkun! Currently there are ${stats.availableJobs} open jobs and ${stats.onlineProviders} providers online. What would you like to know?`;
    },

    /**
     * KYC Document Verification
     */
    verifyDocument: async (imagePath, expectedData) => {
        try {
            const fs = require('fs');
            const path = require('path');

            // Resolve the actual file path
            let actualPath = imagePath;
            if (imagePath.startsWith('/uploads/')) {
                actualPath = path.join(__dirname, '..', imagePath);
            }

            if (!fs.existsSync(actualPath)) {
                return { confidence: 0, notes: "Image file not found locally." };
            }

            const imageBuffer = fs.readFileSync(actualPath);
            const base64Image = imageBuffer.toString('base64');
            const ext = path.extname(actualPath).toLowerCase().replace('.', '');
            const mimeType = ext === 'png' ? 'image/png' : (ext === 'webp' ? 'image/webp' : 'image/jpeg');

            const systemPrompt = `You are Kaarkun KYC AI. Your job is to verify identity documents (CNIC).
Analyze the provided document image.
Expected User Details:
- Name: ${expectedData.full_name}
- Email: ${expectedData.email}

Check if the name on the document matches the expected name (allow minor spelling differences).
Check if the document looks like a valid Pakistani CNIC (Computerized National Identity Card).
Is it clear and readable?
Return ONLY a JSON object:
{"confidence": 85, "notes": "Name matches. Document is clear and appears to be a valid CNIC."}`;

            const GEMINI_KEY = process.env.GEMINI_API_KEY;
            if (!GEMINI_KEY || GEMINI_KEY.includes('your_gemini_api_key')) {
                 return { confidence: 50, notes: "AI Vision API not configured." };
            }

            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;
            const response = await axios.post(url, {
                contents: [{
                    role: 'user',
                    parts: [
                        { text: systemPrompt },
                        { inline_data: { mime_type: mimeType, data: base64Image } }
                    ]
                }],
                generationConfig: { maxOutputTokens: 200, temperature: 0.1 }
            }, { timeout: 20000 });

            const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
                const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
                const data = JSON.parse(cleaned);
                return {
                    confidence: data.confidence || 0,
                    notes: data.notes || "No notes provided."
                };
            }
            return { confidence: 0, notes: "Failed to extract data." };

        } catch (error) {
            console.error('[AI] Vision API error:', error.response?.data || error.message);
            // Distinguish "service unavailable" (confidence: null) from "document looks fraudulent"
            // (confidence: 0) so the admin doesn't mistake a rate-limit/outage for a failed check.
            if (error.response?.status === 429) {
                return { confidence: null, notes: 'AI verification is temporarily rate-limited. Please try again shortly or verify this document manually.' };
            }
            return { confidence: null, notes: 'AI verification service is unavailable right now. Please verify this document manually.' };
        }
    },

    /**
     * One-Click Dispute Resolution Summarizer
     */
    summarizeDispute: async (jobId) => {
        try {
            // Fetch job info
            const [jobs] = await db.execute(
                `SELECT j.title, j.description, j.budget, j.status, c.full_name as customer_name 
                 FROM jobs j JOIN users c ON j.customer_id = c.id WHERE j.id = ?`,
                [jobId]
            );
            if (jobs.length === 0) return null;
            const job = jobs[0];

            // Fetch messages for the job
            const [messages] = await db.execute(
                `SELECT m.content, m.created_at, u.full_name as sender_name, u.role
                 FROM messages m
                 JOIN users u ON m.sender_id = u.id
                 WHERE m.job_id = ?
                 ORDER BY m.created_at ASC`,
                [jobId]
            );

            if (messages.length === 0) {
                return "No chat history found for this job. Cannot generate a summary.";
            }

            // Construct transcript
            let transcript = `Job Details:\nTitle: ${job.title}\nDescription: ${job.description}\nBudget: $${job.budget}\n\nChat Transcript:\n`;
            messages.forEach(m => {
                transcript += `[${new Date(m.created_at).toLocaleString()}] ${m.sender_name} (${m.role}): ${m.content}\n`;
            });

            const systemPrompt = `You are a neutral, objective AI assistant for the Kaarkun admin team.
Your task is to analyze a dispute between a customer and a service provider based on their chat history.
Please provide a 3-part summary using the exact structure below. Be concise and factual.

1. Customer's Claim: [Summarize what the customer is unhappy about or claiming]
2. Provider's Claim: [Summarize the provider's defense or point of view]
3. AI Recommendation: [Based ONLY on the chat evidence, who seems to be at fault? What is a fair resolution? If unclear, state that.]`;

            const summary = await AIService.callLLM(systemPrompt, transcript);
            return summary || "Failed to generate summary.";
        } catch (error) {
            console.error('[AI] Dispute summarization error:', error);
            throw new Error('Could not generate dispute summary');
        }
    },

    /**
     * Generic LLM Caller
     * Priority: 1. Groq (free, fast) → 2. Gemini → 3. Claude
     */
    callLLM: async (systemPrompt, userPrompt) => {
        const GROQ_KEY   = process.env.GROQ_API_KEY;
        const GEMINI_KEY = process.env.GEMINI_API_KEY;
        const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

        // ─── 1. Groq (Free tier — Llama 3.3 70B) ─────────────────────────────
        if (GROQ_KEY && !GROQ_KEY.includes('your_groq_api_key')) {
            try {
                console.log('[AI] Calling Groq API (llama-3.3-70b-versatile)...');
                const response = await axios.post(
                    'https://api.groq.com/openai/v1/chat/completions',
                    {
                        model: 'llama-3.3-70b-versatile',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user',   content: userPrompt }
                        ],
                        max_tokens: 600,
                        temperature: 0.7
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${GROQ_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 15000
                    }
                );

                const text = response.data?.choices?.[0]?.message?.content;
                if (text) {
                    console.log('[AI] Groq responded successfully.');
                    return text;
                }
            } catch (err) {
                const errDetail = err.response?.data || err.message;
                if (err.response?.status === 429) {
                    console.log('[AI] Groq rate-limited, trying Gemini...');
                } else {
                    console.error('[AI] Groq API error:', JSON.stringify(errDetail));
                }
            }
        }

        // ─── 2. Gemini (Google AI Studio free tier) ───────────────────────────
        if (GEMINI_KEY && !GEMINI_KEY.includes('your_gemini_api_key')) {
            const geminiModels = ['gemini-1.5-flash', 'gemini-2.0-flash-lite', 'gemini-2.0-flash'];
            for (const model of geminiModels) {
                try {
                    console.log(`[AI] Calling Gemini (${model})...`);
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
                    const response = await axios.post(url, {
                        contents: [
                            { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Question/Input:\n${userPrompt}` }] }
                        ],
                        generationConfig: { maxOutputTokens: 600, temperature: 0.7 }
                    }, { timeout: 15000 });

                    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                        console.log(`[AI] Gemini (${model}) responded successfully.`);
                        return text;
                    }
                } catch (err) {
                    if (err.response?.status === 429) {
                        console.log(`[AI] Gemini (${model}) quota exhausted, trying next...`);
                    } else {
                        console.error(`[AI] Gemini (${model}) error:`, JSON.stringify(err.response?.data || err.message));
                    }
                }
            }
        }

        // ─── 3. Claude (Anthropic — paid) ─────────────────────────────────────
        if (CLAUDE_KEY && !CLAUDE_KEY.includes('your_claude_api_key')) {
            try {
                console.log('[AI] Calling Claude API...');
                const response = await axios.post('https://api.anthropic.com/v1/messages', {
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 600,
                    system: systemPrompt,
                    messages: [{ role: 'user', content: userPrompt }]
                }, {
                    headers: {
                        'x-api-key': CLAUDE_KEY,
                        'anthropic-version': '2023-06-01',
                        'content-type': 'application/json'
                    },
                    timeout: 15000
                });

                const text = response.data?.content?.[0]?.text;
                if (text) {
                    console.log('[AI] Claude responded successfully.');
                    return text;
                }
            } catch (err) {
                console.error('[AI] Claude API error:', JSON.stringify(err.response?.data || err.message));
            }
        }

        console.log('[AI] No LLM available — using rule-based fallback.');
        return null;
    },

    /**
     * Multi-turn chat LLM caller.
     * Accepts a properly-formatted messages array (role/content pairs) so the
     * LLM has real conversation context rather than a JSON-encoded string.
     */
    callChatLLM: async (systemPrompt, messages) => {
        const GROQ_KEY   = process.env.GROQ_API_KEY;
        const GEMINI_KEY = process.env.GEMINI_API_KEY;
        const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

        // ─── 1. Groq — preferred for chat (multi-turn natively supported) ──────
        if (GROQ_KEY && !GROQ_KEY.includes('your_groq_api_key')) {
            try {
                console.log('[ChatBot] Calling Groq (llama-3.3-70b-versatile)...');
                const response = await axios.post(
                    'https://api.groq.com/openai/v1/chat/completions',
                    {
                        model: 'llama-3.3-70b-versatile',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            ...messages   // real conversation history
                        ],
                        max_tokens: 300,
                        temperature: 0.5
                    },
                    {
                        headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
                        timeout: 15000
                    }
                );
                const text = response.data?.choices?.[0]?.message?.content;
                if (text) { console.log('[ChatBot] Groq responded.'); return text; }
            } catch (err) {
                const status = err.response?.status;
                if (status === 429) console.log('[ChatBot] Groq rate-limited, trying Gemini...');
                else console.error('[ChatBot] Groq error:', JSON.stringify(err.response?.data || err.message));
            }
        }

        // ─── 2. Gemini — inject history into contents array ───────────────────
        if (GEMINI_KEY && !GEMINI_KEY.includes('your_gemini_api_key')) {
            const geminiModels = ['gemini-1.5-flash', 'gemini-2.0-flash-lite', 'gemini-2.0-flash'];
            for (const model of geminiModels) {
                try {
                    console.log(`[ChatBot] Calling Gemini (${model})...`);
                    // Gemini uses 'model' instead of 'assistant'
                    const contents = messages.map(m => ({
                        role: m.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: m.content }]
                    }));
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
                    const response = await axios.post(url, {
                        system_instruction: { parts: [{ text: systemPrompt }] },
                        contents,
                        generationConfig: { maxOutputTokens: 300, temperature: 0.5 }
                    }, { timeout: 15000 });
                    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) { console.log(`[ChatBot] Gemini (${model}) responded.`); return text; }
                } catch (err) {
                    if (err.response?.status === 429) console.log(`[ChatBot] Gemini (${model}) quota exhausted...`);
                    else console.error(`[ChatBot] Gemini (${model}) error:`, JSON.stringify(err.response?.data || err.message));
                }
            }
        }

        // ─── 3. Claude — multi-turn via messages array ────────────────────────
        if (CLAUDE_KEY && !CLAUDE_KEY.includes('your_claude_api_key')) {
            try {
                console.log('[ChatBot] Calling Claude...');
                const response = await axios.post('https://api.anthropic.com/v1/messages', {
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 300,
                    system: systemPrompt,
                    messages  // Claude accepts the same role/content array
                }, {
                    headers: {
                        'x-api-key': CLAUDE_KEY,
                        'anthropic-version': '2023-06-01',
                        'content-type': 'application/json'
                    },
                    timeout: 15000
                });
                const text = response.data?.content?.[0]?.text;
                if (text) { console.log('[ChatBot] Claude responded.'); return text; }
            } catch (err) {
                console.error('[ChatBot] Claude error:', JSON.stringify(err.response?.data || err.message));
            }
        }

        console.log('[ChatBot] All LLMs unavailable — using rule-based fallback.');
        return null;
    }
};

module.exports = AIService;
