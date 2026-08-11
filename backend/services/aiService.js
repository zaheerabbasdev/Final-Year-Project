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
        let statsContext = '';
        let userContext = '';
        try {
            const [[{ onlineProviders }]] = await db.execute('SELECT COUNT(*) as onlineProviders FROM provider_profiles WHERE is_online = 1');
            const [[{ totalCustomers }]] = await db.execute('SELECT COUNT(*) as totalCustomers FROM users WHERE role = "customer"');
            const [[{ availableJobs }]] = await db.execute('SELECT COUNT(*) as availableJobs FROM jobs WHERE status = "open"');
            
            const [categories] = await db.execute(`
                SELECT c.name, COUNT(p.user_id) as count 
                FROM categories c 
                JOIN provider_profiles p ON c.id = p.category_id 
                GROUP BY c.id
            `);
            const categoryBreakdown = categories.map(c => `${c.name}s: ${c.count}`).join(', ');

            // Fetch Top 5 providers
            const [topProviders] = await db.execute(`
                SELECT u.full_name, p.rating, c.name as category 
                FROM provider_profiles p 
                JOIN users u ON p.user_id = u.id 
                LEFT JOIN categories c ON p.category_id = c.id 
                ORDER BY p.rating DESC LIMIT 5
            `);
            const topProvidersStr = topProviders.map(p => `- ${p.full_name} (${p.category || 'No Category'}, Rating: ${p.rating})`).join('\n');

            statsContext = `\nReal-time App Statistics:
- Online Providers: ${onlineProviders}
- Registered Customers: ${totalCustomers}
- Available Open Jobs: ${availableJobs}
- Provider Breakdown: ${categoryBreakdown}
- Top Rated Providers:\n${topProvidersStr}`;

            if (user && user.id) {
                const [userData] = await db.execute('SELECT full_name, email, role FROM users WHERE id = ?', [user.id]);
                if (userData.length > 0) {
                    const u = userData[0];
                    userContext = `\n\nInformation about the current user you are chatting with:
- Name: ${u.full_name}
- Email: ${u.email}
- Role: ${u.role}`;

                    if (u.role === 'provider') {
                        const [profileData] = await db.execute(`
                            SELECT p.rating, p.total_jobs, c.name as category, p.is_online
                            FROM provider_profiles p
                            LEFT JOIN categories c ON p.category_id = c.id
                            WHERE p.user_id = ?
                        `, [user.id]);
                        if (profileData.length > 0) {
                            const p = profileData[0];
                            userContext += `\n- Category: ${p.category || 'Not set'}
- Rating: ${p.rating}
- Total Jobs Done: ${p.total_jobs}
- Currently Online: ${p.is_online ? 'Yes' : 'No'}`;
                        }
                    } else if (u.role === 'customer') {
                        const [[{ jobsPosted }]] = await db.execute('SELECT COUNT(*) as jobsPosted FROM jobs WHERE customer_id = ?', [user.id]);
                        userContext += `\n- Total Jobs Posted: ${jobsPosted}`;
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching stats for AI:', error);
        }

        const systemPrompt = `You are Kaarkun Support AI, a friendly customer helper for the Kaarkun app.
Kaarkun is a mobile marketplace matching customers with local service providers (Plumbers, Electricians, Carpenters, Painters, etc.).
- Customers post jobs with details and budgets.
- Providers place bids on jobs with price estimates.
- Once accepted, a Booking is formed.
- Users verify booking completion and write reviews.
- Accounts are marked "pending" until admin approves CNIC and certificates.${statsContext}${userContext}
Keep your answers brief, friendly, helpful and directly related to Kaarkun. Maximum 3 sentences. Do NOT use markdown, bullet points or asterisks.`;

        // Only send last 6 messages to avoid huge prompts
        const recentHistory = history.slice(-6);
        const llmResult = await AIService.callLLM(systemPrompt, `User message: "${message}"\nRecent conversation: ${JSON.stringify(recentHistory)}`);
        if (llmResult) {
            // Strip any surrounding quotes and markdown artifacts
            return llmResult.replace(/^["'`]+|["'`]+$/g, '').replace(/\*\*/g, '').trim();
        }

        // Rule-based offline support FAQ responder
        const query = message.toLowerCase();
        if (query.includes('pending') || query.includes('verify') || query.includes('approve')) {
            return "Your account stays pending until an administrator reviews your uploaded CNIC and certificates. This usually takes 24 to 48 hours. Thank you for your patience!";
        }
        if (query.includes('post') || query.includes('book') || query.includes('customer')) {
            return "To post a job, open the Kaarkun app as a customer, click 'Post a Job', fill in the title, description, category, and budget, then click submit to receive bids.";
        }
        if (query.includes('bid') || query.includes('provider') || query.includes('earn')) {
            return "As a service provider, you can browse open jobs matching your skills, tap on a job details screen, enter your price bid with an estimated time, and submit it.";
        }
        if (query.includes('charge') || query.includes('free') || query.includes('fee')) {
            return "Kaarkun is free to download! We charge a minimal platform commission on completed bookings to maintain the service, which is automatically calculated.";
        }

        return "Welcome to Kaarkun! You can post jobs as a customer, place competitive bids as a provider, and build trusted relationships through ratings. How else can I assist you today?";
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
    }
};

module.exports = AIService;
