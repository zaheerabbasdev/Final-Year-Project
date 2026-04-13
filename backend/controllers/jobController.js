const Job = require('../models/jobModel');
const User = require('../models/userModel');

// ... rest of imports if any ...

const createJob = async (req, res) => {
    try {
        const jobData = { ...req.body, customer_id: req.user.id };

        // Sanitize formData string "null" values
        ['category_id', 'budget', 'location', 'preferred_date', 'preferred_time', 'latitude', 'longitude'].forEach(field => {
            if (jobData[field] === 'null' || jobData[field] === '') {
                jobData[field] = null;
            }
        });

        // If images were uploaded, add them to jobData
        if (req.files) {
            jobData.images = req.files.map(file => `/uploads/${file.filename}`);
        }
        
        const jobId = await Job.create(jobData);
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

const updateJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (job.customer_id !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

        await Job.update(req.params.id, req.body);
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

module.exports = { createJob, getJobs, getJobById, updateJob, deleteJob, getMyJobs };
