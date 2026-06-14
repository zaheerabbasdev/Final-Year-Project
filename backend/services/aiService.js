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

        const fallbackTemplates = [
            {
                keywords: ['leak', 'pipe', 'water', 'plumber', 'tap', 'sink'],
                completion: 'Fixing a leaking pipe/faucet under the kitchen counter. Need to replace the washer or seal to stop the slow drip. Should inspect surrounding joints for wear.',
                category: 'Plumber',
                suggested_budget: '1500'
            },
            {
                keywords: ['fan', 'light', 'wire', 'switch', 'electricity', 'electrician'],
                completion: 'Installing a new ceiling fan and replacing a faulty wall switch. The wiring is already in place, but need someone to mount it and check connections.',
                category: 'Electrician',
                suggested_budget: '2000'
            },
            {
                keywords: ['ac', 'cool', 'repair', 'split', 'gas', 'compressor'],
                completion: 'AC general cleaning and gas charging. The indoor unit is blowing air but not cooling properly. Need filter cleaning and pressure check.',
                category: 'AC Repair',
                suggested_budget: '3500'
            },
            {
                keywords: ['door', 'wood', 'lock', 'hinge', 'cabinet', 'carpenter'],
                completion: 'Repairing a sagging kitchen cabinet door and fitting a new lock on the main bedroom door. Will need new hinges and screws.',
                category: 'Carpenter',
                suggested_budget: '1800'
            },
            {
                keywords: ['paint', 'wall', 'room', 'brush', 'color'],
                completion: 'Minor touch-up paint job on one bedroom wall. There are water damage stains. Need scraping, primer coating, and two coats of off-white paint.',
                category: 'Painter',
                suggested_budget: '4500'
            }
        ];

        // Try LLM call if environment key is defined
        const systemPrompt = `You are a helpful AI assistant for Kaarkun, an on-demand home service app.
Given a partial job description, return a complete, professional version of the job description, recommend the category (e.g. Plumber, Electrician, Carpenter, Painter, Cleaner, Gardener, AC Repair, Appliance Repair), and a suggested budget in PKR. Respond ONLY with a raw JSON object (no markdown, no code fences):
{"completedDescription": "full description text...", "category": "categoryName", "suggestedBudget": 1500}`;

        const llmResult = await AIService.callLLM(systemPrompt, `Partial description: "${partialText}"`);
        if (llmResult) {
            try {
                // Strip markdown code fences if LLM wraps JSON in ```json ... ```
                const cleaned = llmResult.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
                const data = JSON.parse(cleaned);
                return {
                    completion: data.completedDescription,
                    category: data.category,
                    suggestedBudget: data.suggestedBudget
                };
            } catch (e) {
                console.error("Failed to parse LLM JSON response. Raw:", llmResult, "Error:", e.message);
                // Return raw text as completion if JSON parsing fails
                return {
                    completion: llmResult.trim(),
                    category: 'Other',
                    suggestedBudget: '1500'
                };
            }
        }

        // Offline Rule-based search fallback
        const lowerText = partialText.toLowerCase();
        for (const item of fallbackTemplates) {
            if (item.keywords.some(kw => lowerText.includes(kw))) {
                return {
                    completion: item.completion,
                    category: item.category,
                    suggestedBudget: item.suggested_budget
                };
            }
        }

        // Absolute generic fallback
        return {
            completion: partialText + ' (Please specify details like specific issues, location inside property, tools needed, and material availability to help providers bid accurately.)',
            category: 'Other',
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
            console.error('[AI] Vision API error:', error.message);
            return { confidence: 0, notes: `Error: ${error.message}` };
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
