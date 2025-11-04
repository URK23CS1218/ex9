const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware - Fix CORS issues
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001','https://ex9-9q7t.onrender.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Handle preflight requests
app.options('*', cors());

console.log('🚀 Starting Movie Ticket API Server...');

// Simple in-memory storage (fallback if MongoDB fails)
const users = [];
const bookings = [];

// Create a test user for development
const createTestUser = async () => {
  const testEmail = 'test@example.com';
  const testUserExists = users.find(user => user.email === testEmail);
  
  if (!testUserExists) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    users.push({
      id: '1762264233536', // Use a fixed ID for testing
      username: 'jeremiah',
      email: testEmail,
      password: hashedPassword,
      createdAt: new Date()
    });
    console.log('✅ Test user created: test@example.com / password123');
  }
};

// Call this when server starts
createTestUser();

// Basic routes for testing
app.get('/', (req, res) => {
  res.json({ 
    message: '🎬 Movie Ticket API is running!',
    status: 'OK',
    timestamp: new Date().toISOString(),
    usersCount: users.length,
    bookingsCount: bookings.length
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is healthy',
    usersCount: users.length,
    bookingsCount: bookings.length,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API test successful!',
    timestamp: new Date().toISOString()
  });
});

// Debug route to see all users (without passwords)
app.get('/api/debug/users', (req, res) => {
  const usersWithoutPasswords = users.map(user => {
    const { password, ...safeUser } = user;
    return safeUser;
  });
  
  res.json({
    success: true,
    count: users.length,
    users: usersWithoutPasswords,
    timestamp: new Date().toISOString()
  });
});

// Debug route to see all bookings
app.get('/api/debug/bookings', (req, res) => {
  res.json({
    success: true,
    count: bookings.length,
    bookings: bookings,
    timestamp: new Date().toISOString()
  });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('📝 Register request received:', req.body);
    
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: username, email, password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user exists
    const existingUser = users.find(user => user.email === email || user.username === username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or username'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: Date.now().toString(),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date()
    };

    users.push(user);

    // Create token
    const token = jwt.sign(
      { userId: user.id }, 
      'dev-secret-key-12345',
      { expiresIn: '24h' }
    );

    console.log('✅ User registered successfully:', email);

    res.status(201).json({
      success: true,
      message: 'User registered successfully!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 Login request received:', req.body);
    
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      console.log('❌ Login failed: User not found with email:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('❌ Login failed: Invalid password for email:', email);
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Create token
    const token = jwt.sign(
      { userId: user.id },
      'dev-secret-key-12345',
      { expiresIn: '24h' }
    );

    console.log('✅ User logged in successfully:', email);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
});

// Movies route
app.get('/api/movies', (req, res) => {
  const movies = [
    {
      id: 1,
      title: 'Avengers: Endgame',
      genre: 'Action',
      duration: '3h 1m',
      rating: 'PG-13',
      description: 'The epic conclusion to the Infinity Saga.',
      price: 12.99
    },
    {
      id: 2,
      title: 'The Batman',
      genre: 'Action, Crime',
      duration: '2h 56m',
      rating: 'PG-13',
      description: 'The Dark Knight of Gotham City begins his war on crime.',
      price: 11.99
    },
    {
      id: 3,
      title: 'Spider-Man: No Way Home',
      genre: 'Action, Adventure',
      duration: '2h 28m',
      rating: 'PG-13',
      description: 'Spider-Man seeks the help of Doctor Strange when his secret identity is revealed.',
      price: 13.99
    },
    {
      id: 4,
      title: 'Dune',
      genre: 'Sci-Fi',
      duration: '2h 35m',
      rating: 'PG-13',
      description: 'A noble family becomes embroiled in a war for control over the galaxy\'s most valuable asset.',
      price: 12.49
    }
  ];
  
  res.json({
    success: true,
    data: movies,
    count: movies.length
  });
});

// BOOKING ROUTES - FIXED

// Create a new booking
app.post('/api/bookings', async (req, res) => {
  try {
    console.log('📦 Booking request received:', req.body);
    
    const { userId, userName, userEmail, movieTitle, movieId, theater, showTime, seats, totalAmount } = req.body;

    // Generate reference number
    const referenceNumber = 'REF' + Date.now().toString().slice(-6);

    const booking = {
      _id: 'booking_' + Date.now(),
      referenceNumber,
      userId,
      userName: userName || 'Guest User',
      userEmail: userEmail || 'guest@example.com',
      movieTitle,
      movieId,
      theater: theater || 'PVR Cinemas',
      showTime: showTime ? new Date(showTime) : new Date(Date.now() + 24 * 60 * 60 * 1000),
      seats: seats || ['A1', 'A2'],
      totalAmount: totalAmount || 1200,
      status: 'confirmed',
      bookingDate: new Date(),
      paymentStatus: 'paid'
    };

    bookings.push(booking);

    console.log('✅ Booking created:', referenceNumber);
    console.log('📊 Total bookings:', bookings.length);

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully! 🎉',
      booking: booking
    });

  } catch (error) {
    console.error('❌ Booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Booking failed',
      error: error.message
    });
  }
});

// Get user bookings - FIXED ROUTE
app.get('/api/bookings/user/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📋 Fetching bookings for user:', userId);
    
    const userBookings = bookings.filter(booking => booking.userId === userId);
    
    console.log('✅ Found bookings:', userBookings.length);

    res.json({
      success: true,
      data: userBookings,
      count: userBookings.length
    });

  } catch (error) {
    console.error('❌ Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bookings',
      error: error.message
    });
  }
});

// Search booking by reference number - FIXED ROUTE
app.get('/api/bookings/search/:referenceNumber', (req, res) => {
  try {
    const { referenceNumber } = req.params;
    console.log('🔍 Searching booking:', referenceNumber);
    
    const booking = bookings.find(b => b.referenceNumber === referenceNumber);

    if (!booking) {
      console.log('❌ Booking not found:', referenceNumber);
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    console.log('✅ Booking found:', booking.referenceNumber);

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('❌ Search booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

// Cancel booking - FIXED ROUTE
app.put('/api/bookings/cancel/:referenceNumber', (req, res) => {
  try {
    const { referenceNumber } = req.params;
    const { userId } = req.body;

    console.log('❌ Cancel booking request:', referenceNumber, 'for user:', userId);

    const bookingIndex = bookings.findIndex(b => 
      b.referenceNumber === referenceNumber && 
      (!userId || b.userId === userId)
    );

    if (bookingIndex === -1) {
      console.log('❌ Booking not found for cancellation:', referenceNumber);
      return res.status(404).json({
        success: false,
        message: 'Booking not found or already cancelled'
      });
    }

    bookings[bookingIndex].status = 'cancelled';
    bookings[bookingIndex].cancelledAt = new Date();
    bookings[bookingIndex].updatedAt = new Date();

    console.log('✅ Booking cancelled:', referenceNumber);

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: bookings[bookingIndex]
    });

  } catch (error) {
    console.error('❌ Cancel booking error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// User profile route
app.get('/api/auth/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, 'dev-secret-key-12345');
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    res.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(401).json({ 
      success: false,
      message: 'Invalid token' 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('🚨 Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('❌ Route not found:', req.originalUrl);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎬 Movie Ticket API Server started!`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🔗 URL: https://ex9-9q7t.onrender.com`);
  console.log(`🌐 Network: http://0.0.0.0:${PORT}`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
  console.log('\n📋 Available endpoints:');
  console.log(`   GET  https://ex9-9q7t.onrender.com/health`);
  console.log(`   GET  https://ex9-9q7t.onrender.com/api/test`);
  console.log(`   GET https://ex9-9q7t.onrender.com/api/movies`);
  console.log(`   GET  https://ex9-9q7t.onrender.com/api/debug/users`);
  console.log(`   GET  https://ex9-9q7t.onrender.com/debug/bookings`);
  console.log(`   POST https://ex9-9q7t.onrender.com/auth/register`);
  console.log(`   POST https://ex9-9q7t.onrender.com/auth/login`);
  console.log(`   POST https://ex9-9q7t.onrender.com/bookings`);
  console.log(`   GET  https://ex9-9q7t.onrender.com/bookings/user/:userId`);
  console.log(`   GET https://ex9-9q7t.onrender.com/bookings/search/:refNumber`);
  console.log(`   PUT  https://ex9-9q7t.onrender.com/bookings/cancel/:refNumber`);
  console.log(`   GET  https://ex9-9q7t.onrender.com/api/auth/profile`);
  console.log('\n👤 Test user credentials:');
  console.log(`   Email: test@example.com`);
  console.log(`   Password: password123`);
  console.log(`   User ID: 1762264233536`);
  console.log('\n✅ Server is ready to accept connections!');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Server shutting down gracefully...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);   
});
