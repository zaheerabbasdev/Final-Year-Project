const Job = require('../models/jobModel');
const User = require('../models/userModel');
const ProviderProfile = require('../models/providerModel');
const Booking = require('../models/bookingModel');
const db = require('../config/db');
const { createNotification } = require('../services/notificationService');
const { uploadToS3 } = require('../utils/s3');

// ... rest of imports if any ...

const createJob = async (req, res) => {
    try {
        const jobData = { ...req.body, customer_id: req.user.id };
        console.log('DEBUG: Received jobData:', JSON.stringify(jobData, null, 2));

        // Sanitize formData string "null" values
        ['category_id', 'budget', 'location', 'preferred_date', 'preferred_time', 'latitude', 'longitude'].forEach(field => {
            if (jobData[field] === 'null' || jobData[field] === '') {
                jobData[field] = null;
            }
        });

        // Convert booleans from string or number if it came from FormData
        ['is_negotiable', 'is_emergency'].forEach(field => {
            if (jobData[field] === 'true' || jobData[field] === '1' || jobData[field] === 1) {
                jobData[field] = true;
            } else if (jobData[field] === 'false' || jobData[field] === '0' || jobData[field] === 0) {
                jobData[field] = false;
            }
        });

        // If images were uploaded, stream them to S3
        if (req.files && req.files.length > 0) {
            jobData.images = await Promise.all(
                req.files.map(file => uploadToS3(file.buffer, file.originalname, 'job'))
            );
        }
        
        const jobId = await Job.create(jobData);

        // Notify Providers in the same category
        if (jobData.category_id) {
            try {
                const providers = await ProviderProfile.findByCategory(jobData.category_id);
                console.log(`DEBUG: Found ${providers.length} providers for category ${jobData.category_id}. Providers:`, JSON.stringify(providers));
                
                for (const p of providers) {
                    console.log(`DEBUG: Sending notification to provider user_id: ${p.user_id}`);
                    await createNotification(
                        p.user_id,
                        jobData.is_emergency ? '⚠️ EMERGENCY JOB' : 'New Job Opportunity',
                        jobData.is_emergency 
                            ? `URGENT: A new emergency job was posted: "${jobData.title}". Accept now!`
                            : `A new job matching your skill was posted: "${jobData.title}"`,
                        jobData.is_emergency ? 'emergency_job_posted' : 'new_job_posted'
                    );
                }
            } catch (notifError) {
                console.error("Error notifying providers:", notifError);
            }
        }

        res.status(201).json({ message: 'Job posted successfully', jobId });
    } catch (error) {
        console.error("DEBUG createJob error:", error);
        res.status(500).json({ message: 'Error posting job' });
    }
};

const getJobs = async (req, res) => {
    try {
        const filters = { ...req.query };

        // Proximity Fallback for Providers
        if (req.user && req.user.role === 'provider') {
            // Priority 1: Current GPS coordinates sent from Mobile app
            if (!filters.lat || !filters.lng) {
                // Priority 2: Fallback to saved location in user profile
                const user = await User.findById(req.user.id);
                if (user && user.latitude && user.longitude) {
                    filters.lat = user.latitude;
                    filters.lng = user.longitude;
                }
            }
            
            // Apply default 20km radius if proximity logic is triggered
            if (filters.lat && filters.lng && !filters.radius) {
                filters.radius = 20;
            }
        }

        const jobs = await Job.findAll(filters);
        res.json(jobs);
    } catch (error) {
        console.error("DEBUG getJobs error:", error);
        res.status(500).json({ message: 'Error fetching jobs' });
    }
};

const getJobById = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        res.json(job);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching job details' });
    }
};

const UPDATABLE_JOB_FIELDS = [
    'title', 'description', 'category_id', 'budget', 'location',
    'preferred_date', 'preferred_time', 'latitude', 'longitude',
    'is_negotiable', 'is_emergency'
];

const updateJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        if (job.customer_id !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

        const updates = {};
        for (const field of UPDATABLE_JOB_FIELDS) {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        }

        await Job.update(req.params.id, updates);
        res.json({ message: 'Job updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating job' });
    }
};

const deleteJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (job.customer_id !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

        await Job.delete(req.params.id);
        res.json({ message: 'Job deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting job' });
    }
};

const getMyJobs = async (req, res) => {
    try {
        const jobs = await Job.findAll({ customer_id: req.user.id });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching your jobs' });
    }
};

const expressAccept = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const jobId = req.params.id;
        const providerId = req.user.id;

        const job = await Job.findById(jobId);
        if (!job) {
            connection.release();
            return res.status(404).json({ message: 'Job not found' });
        }

        if (!job.is_emergency) {
            connection.release();
            return res.status(400).json({ message: 'Only emergency jobs can be accepted instantly' });
        }

        await connection.beginTransaction();

        // Atomically claim the job — only succeeds if still 'open', so two
        // providers can never both express-accept the same emergency job.
        const [claimResult] = await connection.execute(
            "UPDATE jobs SET status = 'active' WHERE id = ? AND status = 'open'",
            [jobId]
        );
        if (claimResult.affectedRows === 0) {
            await connection.rollback();
            connection.release();
            return res.status(409).json({ message: 'Job is already taken or closed' });
        }

        const [bookingResult] = await connection.execute(
            'INSERT INTO bookings (job_id, bid_id, customer_id, provider_id, status) VALUES (?, NULL, ?, ?, ?)',
            [jobId, job.customer_id, providerId, 'confirmed']
        );

        await connection.commit();
        connection.release();

        // Notify Customer (after commit — not part of the atomic transaction)
        await createNotification(
            job.customer_id,
            'Job Accepted Instantly!',
            `A provider has accepted your emergency request: "${job.title}". They are on their way!`,
            'emergency_job_accepted'
        );

        res.json({ message: 'You have accepted the emergency job!', bookingId: bookingResult.insertId });
    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error("DEBUG expressAccept error:", error);
        res.status(500).json({ message: 'Error accepting job' });
    }
};

module.exports = { createJob, getJobs, getJobById, updateJob, deleteJob, getMyJobs, expressAccept };
