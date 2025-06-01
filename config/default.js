require('dotenv').config();

module.exports = {
  jwtSecret: process.env.JWT_SECRET || "user-management-secret-2025",
  jwtExpiration: process.env.JWT_EXPIRATION ? parseInt(process.env.JWT_EXPIRATION) : 3600 // Default: 1 hour in seconds
};
