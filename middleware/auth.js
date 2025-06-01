const jwt = require('jsonwebtoken');
const config = require('../config/default');
const { ROLES } = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  // Get token from cookie or header (cookie takes precedence for better security)
  const token = req.cookies?.auth_token || req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Add user info to request
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user exists in request (set by authenticateToken)
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Forbidden: You do not have permission to access this resource' 
      });
    }
    
    next();
  };
};

// Middleware that checks if user is admin
const isAdmin = (req, res, next) => {
  authorize(ROLES.ADMIN)(req, res, next);
};

module.exports = {
  authenticateToken,
  authorize,
  isAdmin
};
