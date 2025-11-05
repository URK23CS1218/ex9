const express = require('express');
const router = express.Router();
const db = require('./db');

// Get all bookings for a user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const bookings = await db.getUserBookings(userId);
        
        res.json({
            success: true,
            data: bookings,
            count: bookings.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings',
            error: error.message
        });
    }
});

// Search booking by reference number
router.get('/search/:referenceNumber', async (req, res) => {
    try {
        const { referenceNumber } = req.params;
        const booking = await db.getBookingByReference(referenceNumber.toUpperCase());
        
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Search failed',
            error: error.message
        });
    }
});

// Cancel a booking
router.put('/cancel/:referenceNumber', async (req, res) => {
    try {
        const { referenceNumber } = req.params;
        const { userId } = req.body; // Optional: for user-specific cancellation

        const result = await db.cancelBooking(referenceNumber.toUpperCase(), userId);
        
        res.json({
            success: true,
            message: 'Booking cancelled successfully',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// Create a new booking
router.post('/create', async (req, res) => {
    try {
        const bookingData = req.body;
        const booking = await db.createBooking(bookingData);
        
        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create booking',
            error: error.message
        });
    }
});

// Search bookings with multiple filters
router.post('/search', async (req, res) => {
    try {
        const filters = req.body;
        const bookings = await db.searchBookings(filters);
        
        res.json({
            success: true,
            data: bookings,
            count: bookings.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Search failed',
            error: error.message
        });
    }
});

// Get booking details by ID
router.get('/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;
        const collection = db.getCollection('bookings');
        const booking = await collection.findOne({ _id: new ObjectId(bookingId) });
        
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch booking',
            error: error.message
        });
    }
});

module.exports = router;