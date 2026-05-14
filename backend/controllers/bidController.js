const Bid = require('../models/bidModel');
const Job = require('../models/jobModel');
const Booking = require('../models/bookingModel');
const { createNotification } = require('../services/notificationService');

const placeBid = async (req, res) => {
    try {
        const { job_id, amount, estimated_time, cover_letter } = req.body;
        
        // check if job is open
        const job = await Job.findById(job_id);
        if (!job) return res.status(404).json({ message: 'Job not found' });
        if (job.status !== 'open') return res.status(400).json({ message: 'This job is no longer open for bidding.' });

        if (job.is_emergency) {
            return res.status(400).json({ message: 'This is an emergency job. Please use the "Accept Instantly" option instead of bidding.' });
        }

        // check if provider already placed a bid on this job
        const existingBid = await Bid.findByJobAndProvider(job_id, req.user.id);
        if (existingBid) return res.status(400).json({ message: 'You have already placed a bid on this job' });

        const bidId = await Bid.create({
            job_id,
            provider_id: req.user.id,
            amount,
            estimated_time,
            cover_letter
        });

        // Notify Customer
        await createNotification(
            job.customer_id,
            'New Bid Received',
            `A service provider has placed a bid of Rs. ${amount} on your job: ${job.title}`,
            'new_bid'
        );

        res.status(201).json({ message: 'Bid placed successfully', bidId });
    } catch (error) {
        console.error('DEBUG placeBid error:', error);
        res.status(500).json({ message: 'Error placing bid' });
    }
};

const getJobBids = async (req, res) => {
    try {
        const bids = await Bid.findByJobId(req.params.jobId);
        res.json(bids);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bids' });
    }
};

const getMyBids = async (req, res) => {
    try {
        const bids = await Bid.findByProviderId(req.user.id);
        res.json(bids);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching your bids' });
    }
};

const acceptBid = async (req, res) => {
    try {
        const bid = await Bid.findById(req.params.id);
        if (!bid) return res.status(404).json({ message: 'Bid not found' });

        const job = await Job.findById(bid.job_id);
        if (job.customer_id !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

        // Update bid status
        await Bid.updateStatus(req.params.id, 'accepted');
        // Update job status
        await Job.update(job.id, { status: 'active' });
        // Reject all other bids for this job
        await Bid.rejectOthers(job.id, req.params.id);

        // Create booking
        await Booking.create({
            job_id: job.id,
            bid_id: bid.id,
            customer_id: job.customer_id,
            provider_id: bid.provider_id
        });

        // Notify Provider
        await createNotification(
            bid.provider_id,
            'Bid Accepted!',
            `Your bid on "${job.title}" has been accepted. You can now start working on the job.`,
            'bid_accepted'
        );

        res.json({ message: 'Bid accepted and booking created' });
    } catch (error) {
        res.status(500).json({ message: 'Error accepting bid' });
    }
};

module.exports = { placeBid, getJobBids, getMyBids, acceptBid };
