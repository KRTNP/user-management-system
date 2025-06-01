const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const config = require('../config/default');
const { User, ROLES } = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// Cookie options for JWT
const cookieOptions = {
  httpOnly: true, // Prevent JavaScript access
  secure: process.env.NODE_ENV === 'production', // Require HTTPS in production
  sameSite: 'strict', // Prevent CSRF attacks
  maxAge: config.jwtExpiration * 1000, // Convert seconds to milliseconds
  path: '/' // Available across all routes
};

// @route   POST /api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', [
  // Validation
  check('username', 'Username is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    // Check if user already exists
    const userByUsername = await User.findByUsername(username);
    if (userByUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const userByEmail = await User.findByEmail(email);
    if (userByEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: ROLES.USER // Default role for new registrations
    });
    
    if (!user) {
      return res.status(500).json({ message: 'Failed to create user' });
    }

    // Create JWT payload
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    };

    // Generate JWT
    jwt.sign(
      payload,
      config.jwtSecret,
      { expiresIn: config.jwtExpiration },
      (err, token) => {
        if (err) throw err;
        
        // Set JWT as HTTP-only cookie
        res.cookie('auth_token', token, cookieOptions);
        
        // Return user info (but not the token directly)
        res.json({ user: { id: user.id, username: user.username, role: user.role } });
      }
    );
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
  // Validation
  check('username', 'Username is required').exists(),
  check('password', 'Password is required').exists()
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // // For debugging
    // console.log('Login successful for user:', username);

    // Create JWT payload
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    };

    // Generate JWT
    jwt.sign(
      payload,
      config.jwtSecret,
      { expiresIn: config.jwtExpiration },
      (err, token) => {
        if (err) throw err;
        
        // Set JWT as HTTP-only cookie
        res.cookie('auth_token', token, cookieOptions);
        
        // Return user info (but not the token directly)
        res.json({ user: { id: user.id, username: user.username, role: user.role } });
      }
    );
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // req.user is set from the middleware
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error getting user profile:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/check-auth
// @desc    Check if user is authenticated
// @access  Private
router.get('/check-auth', authenticateToken, (req, res) => {
  // If middleware passes, user is authenticated
  res.json({ isAuthenticated: true, user: { id: req.user.id, username: req.user.username, role: req.user.role } });
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Public
router.post('/logout', (req, res) => {
  // Clear the authentication cookie
  res.clearCookie('auth_token', { path: '/' });
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
