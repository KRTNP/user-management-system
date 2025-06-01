// In-memory user database with role-based access control
const { pool } = require('../config/db');

// Role definitions
const ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

// User model with MySQL implementation
const User = {
  // Get all users (without passwords)
  getAll: async () => {
    try {
      const [rows] = await pool.query('SELECT id, username, email, role, created_at AS createdAt, updated_at AS updatedAt FROM users');
      return rows;
    } catch (error) {
      console.error('Error getting all users:', error.message);
      return [];
    }
  },

  // Find a user by ID (without password)
  findById: async (id) => {
    try {
      const [rows] = await pool.query(
        'SELECT id, username, email, role, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE id = ?', 
        [id]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(`Error finding user with ID ${id}:`, error.message);
      return null;
    }
  },

  // Find a user by username (including password for auth)
  findByUsername: async (username) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM users WHERE username = ?', 
        [username]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(`Error finding user with username ${username}:`, error.message);
      return null;
    }
  },

  // Find a user by email (including password for auth)
  findByEmail: async (email) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM users WHERE email = ?', 
        [email]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(`Error finding user with email ${email}:`, error.message);
      return null;
    }
  },

  // Create a new user
  create: async ({ username, email, password, role = ROLES.USER }) => {
    try {
      const [result] = await pool.query(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [username, email, password, role]
      );
      
      if (result.insertId) {
        const [rows] = await pool.query(
          'SELECT id, username, email, role, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE id = ?',
          [result.insertId]
        );
        return rows.length > 0 ? rows[0] : null;
      }
      return null;
    } catch (error) {
      console.error('Error creating user:', error.message);
      return null;
    }
  },

  // Update a user
  update: async (id, updates) => {
    try {
      // Don't allow role updates here for security (should be a separate admin function)
      const { username, email, password } = updates;
      const updateFields = [];
      const values = [];
      
      if (username) {
        updateFields.push('username = ?');
        values.push(username);
      }
      
      if (email) {
        updateFields.push('email = ?');
        values.push(email);
      }
      
      if (password) {
        updateFields.push('password = ?');
        values.push(password);
      }
      
      if (updateFields.length === 0) {
        return null; // Nothing to update
      }
      
      values.push(id); // Add ID for WHERE clause
      
      const [result] = await pool.query(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );
      
      if (result.affectedRows > 0) {
        const [rows] = await pool.query(
          'SELECT id, username, email, role, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE id = ?',
          [id]
        );
        return rows.length > 0 ? rows[0] : null;
      }
      return null;
    } catch (error) {
      console.error(`Error updating user with ID ${id}:`, error.message);
      return null;
    }
  },

  // Update a user's role (admin only function)
  updateRole: async (id, role) => {
    try {
      const [result] = await pool.query(
        'UPDATE users SET role = ? WHERE id = ?',
        [role, id]
      );
      
      if (result.affectedRows > 0) {
        const [rows] = await pool.query(
          'SELECT id, username, email, role, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE id = ?',
          [id]
        );
        return rows.length > 0 ? rows[0] : null;
      }
      return null;
    } catch (error) {
      console.error(`Error updating role for user with ID ${id}:`, error.message);
      return null;
    }
  },

  // Delete a user
  delete: async (id) => {
    try {
      const [result] = await pool.query(
        'DELETE FROM users WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`Error deleting user with ID ${id}:`, error.message);
      return false;
    }
  },

  // For compatibility with existing code
  seedUsers: async () => {
    // This is now handled by db-init.js
    return true;
  }
};

module.exports = {
  User,
  ROLES
};
