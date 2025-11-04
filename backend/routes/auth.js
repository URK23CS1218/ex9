const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Simple in-memory storage
const users = [];

// Register route
router.post('/register', async (req, res) => {
  try {
    console.log('📝 Register request:', req.body);
    
    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user exists
    const existingUser = users.find(user => 
      user.email === email || user.username === username
    );
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
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
    console.log('✅ User registered:', user.email);

    // Create token
    const token = jwt.sign(
      { userId: user.id }, 
      'development-secret-key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
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

// Login route
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login request:', req.body);
    
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create token
    const token = jwt.sign(
      { userId: user.id },
      'development-secret-key',
      { expiresIn: '24h' }
    );

    console.log('✅ User logged in:', user.email);

    res.json({
      success: true,
      message: 'Login successful',
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

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes are working!',
    usersCount: users.length
  });
});

module.exports = router;