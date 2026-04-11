const Job = require('../models/jobModel');

const createJob = async (req, res) => {
    try {
        const jobData = { ...req.body, customer_id: req.user.id };

        // Sanitize formData string "null" values
        ['category_id', 'budget', 'location', 'preferred_date', 'preferred_time'].forEach(field => {
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
        const jobs = await Job.findAll(req.query);
        res.json(jobs);
    } catch (error) {
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
