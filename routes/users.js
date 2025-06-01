const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');

const { User, ROLES } = require('../models/User');
const { authenticateToken, authorize } = require('../middleware/auth');

// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', authenticateToken, authorize(ROLES.ADMIN), async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (err) {
    console.error('Error getting all users:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private/Admin
router.get('/:id', authenticateToken, authorize(ROLES.ADMIN), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(`Error getting user ${req.params.id}:`, err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users
// @desc    Create a new user (admin only)
// @access  Private/Admin
router.post('/', [
  authenticateToken, 
  authorize(ROLES.ADMIN),
  // Validation
  check('username', 'Username is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  check('role', 'Role is required').not().isEmpty()
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, role } = req.body;

  // Validate role
  if (role !== ROLES.ADMIN && role !== ROLES.USER) {
    return res.status(400).json({ message: 'Invalid role' });
  }

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
      role
    });
    
    if (!user) {
      return res.status(500).json({ message: 'Failed to create user' });
    }

    res.status(201).json(user);
  } catch (err) {
    console.error('Error creating user:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update a user
// @access  Private/Admin
router.put('/:id', [
  authenticateToken, 
  authorize(ROLES.ADMIN),
  // Validation (optional fields)
  check('username').optional(),
  check('email').optional().isEmail().withMessage('Please include a valid email'),
  check('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  check('role').optional()
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const userId = req.params.id;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't allow admin to delete themselves
    if (user.id === req.user.id && req.body.role && req.body.role !== ROLES.ADMIN) {
      return res.status(400).json({ message: 'Admin cannot remove their own admin status' });
    }

    const updates = {};
    
    // Add fields to update
    if (req.body.username) updates.username = req.body.username;
    if (req.body.email) updates.email = req.body.email;
    
    // Hash password if provided
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(req.body.password, salt);
    }

    // Update user (basic info first)
    const updatedUser = await User.update(userId, updates);
    if (!updatedUser) {
      return res.status(500).json({ message: 'Failed to update user' });
    }
    
    // Update role if provided (using separate method)
    if (req.body.role) {
      // Validate role
      if (req.body.role !== ROLES.ADMIN && req.body.role !== ROLES.USER) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      
      const updatedUserWithRole = await User.updateRole(userId, req.body.role);
      if (!updatedUserWithRole) {
        return res.status(500).json({ message: 'Failed to update user role' });
      }
      
      return res.json(updatedUserWithRole);
    }

    res.json(updatedUser);
  } catch (err) {
    console.error('Error updating user:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete a user
// @access  Private/Admin
router.delete('/:id', authenticateToken, authorize(ROLES.ADMIN), async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't allow admin to delete themselves
    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'Admin cannot delete themselves' });
    }

    // Delete user
    const deleted = await User.delete(userId);
    if (!deleted) {
      return res.status(500).json({ message: 'Failed to delete user' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
