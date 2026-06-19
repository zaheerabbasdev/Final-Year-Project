const Review = require('../models/reviewModel');
const Booking = require('../models/bookingModel');

const submitReview = async (req, res) => {
    try {
        const { booking_id, rating, comment } = req.body;
        const customer_id = req.user.id;

        if (!booking_id || !Number.isInteger(Number(rating)) || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'A valid booking_id and rating (1-5) are required' });
        }

        // Verify the booking exists, belongs to this customer, and is completed
        const booking = await Booking.findById(booking_id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.customer_id !== customer_id) {
            return res.status(403).json({ message: 'You can only review your own bookings' });
        }
        if (booking.status !== 'completed') {
            return res.status(400).json({ message: 'You can only review completed bookings' });
        }

        const hasReviewed = await Review.hasReviewed(booking_id);
        if (hasReviewed) {
            return res.status(409).json({ message: 'A review for this booking already exists.' });
        }

        const reviewId = await Review.create({
            job_id: booking.job_id,
            booking_id,
            customer_id,
            provider_id: booking.provider_id,
            rating,
            comment
        });

        res.status(201).json({ message: 'Review submitted successfully', id: reviewId });
    } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).json({ message: 'Error submitting review' });
    }
};

const getProviderReviews = async (req, res) => {
    try {
        const { providerId } = req.params;
        const { limit, offset } = req.query;
        console.log(`DEBUG: Fetching reviews for provider ID: ${providerId}`);
        
        const reviews = await Review.findByProvider(providerId, limit, offset);
        console.log(`DEBUG: Found ${reviews.length} reviews for provider ${providerId}`);
        
        res.json(reviews);
    } catch (error) {
        console.error('DEBUG: Error in getProviderReviews:', error);
        res.status(500).json({ message: 'Error fetching provider reviews' });
    }
};

const getBookingReview = async (req, res) => {
    try {
        const review = await Review.findByBooking(req.params.bookingId);
        if (!review) return res.status(404).json({ message: 'Review not found' });
        res.json(review);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching booking review' });
    }
};

module.exports = { submitReview, getProviderReviews, getBookingReview };
