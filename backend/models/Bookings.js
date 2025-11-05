const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  movie: {
    type: String,
    required: true
  },
  movieId: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  seats: [{
    type: String
  }],
  total: {
    type: Number,
    required: true
  },
  bookingId: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Booking', BookingSchema);