const Bid = require('../models/bidModel');
const Job = require('../models/jobModel');
const Booking = require('../models/bookingModel');
const db = require('../config/db');
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
    const connection = await db.getConnection();
    try {
        const bid = await Bid.findById(req.params.id);
        if (!bid) {
            connection.release();
            return res.status(404).json({ message: 'Bid not found' });
        }

        const job = await Job.findById(bid.job_id);
        if (!job) {
            connection.release();
            return res.status(404).json({ message: 'Job not found' });
        }
        if (job.customer_id !== req.user.id) {
            connection.release();
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await connection.beginTransaction();

        // Atomically claim the job — only succeeds if it's still 'open', so two
        // bids on the same job can never both be accepted (no race condition).
        const [claimResult] = await connection.execute(
            "UPDATE jobs SET status = 'active' WHERE id = ? AND status = 'open'",
            [job.id]
        );
        if (claimResult.affectedRows === 0) {
            await connection.rollback();
            connection.release();
            return res.status(409).json({ message: 'This job is no longer open — another bid may have already been accepted.' });
        }

        await connection.execute("UPDATE bids SET status = 'accepted' WHERE id = ?", [bid.id]);
        await connection.execute("UPDATE bids SET status = 'rejected' WHERE job_id = ? AND id != ?", [job.id, bid.id]);
        await connection.execute(
            'INSERT INTO bookings (job_id, bid_id, customer_id, provider_id) VALUES (?, ?, ?, ?)',
            [job.id, bid.id, job.customer_id, bid.provider_id]
        );

        await connection.commit();
        connection.release();

        // Notify Provider (after commit — not part of the atomic transaction)
        await createNotification(
            bid.provider_id,
            'Bid Accepted!',
            `Your bid on "${job.title}" has been accepted. You can now start working on the job.`,
            'bid_accepted'
        );

        res.json({ message: 'Bid accepted and booking created' });
    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error('Error accepting bid:', error);
        res.status(500).json({ message: 'Error accepting bid' });
    }
};

module.exports = { placeBid, getJobBids, getMyBids, acceptBid };
