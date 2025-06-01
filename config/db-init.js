const { pool } = require('./db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Initialize database tables and seed data
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    
    try {
      // Create users table if it doesn't exist
      await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role ENUM('admin', 'user') DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      console.log('Database tables created successfully');
      
      // Check if admin user exists
      const [adminRows] = await connection.query('SELECT * FROM users WHERE username = ?', ['admin']);
      
      // Seed admin user if it doesn't exist
      if (adminRows.length === 0) {
        const salt = await bcrypt.genSalt(10);
        // Use environment variable or a stronger default password
        const adminDefaultPwd = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin_Secure_Pwd_2025!';
        const adminPassword = await bcrypt.hash(adminDefaultPwd, salt);
        
        await connection.query(
          'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
          [
            process.env.ADMIN_USERNAME || 'admin', 
            process.env.ADMIN_EMAIL || 'admin@example.com', 
            adminPassword, 
            'admin'
          ]
        );
        
        console.log('Admin user seeded successfully');
        console.log('WARNING: Default admin account created. Change the password immediately!');
      }
      
      // Check if regular user exists
      const [userRows] = await connection.query('SELECT * FROM users WHERE username = ?', ['user']);
      
      // Seed regular user if it doesn't exist
      if (userRows.length === 0) {
        const salt = await bcrypt.genSalt(10);
        // Use environment variable or a stronger default password
        const userDefaultPwd = process.env.USER_DEFAULT_PASSWORD || 'User_Secure_Pwd_2025!';
        const userPassword = await bcrypt.hash(userDefaultPwd, salt);
        
        await connection.query(
          'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
          [
            process.env.TEST_USERNAME || 'user', 
            process.env.TEST_EMAIL || 'user@example.com', 
            userPassword, 
            'user'
          ]
        );
        
        console.log('Regular user seeded successfully');
        console.log('WARNING: Default test user account created. This should be removed in production!');
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing database:', error.message);
      return false;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error connecting to database:', error.message);
    return false;
  }
}

module.exports = {
  initializeDatabase
};

// Execute the initialization function when this file is run directly
if (require.main === module) {
  initializeDatabase()
    .then(success => {
      if (success) {
        console.log('Database initialization complete!');
      } else {
        console.error('Database initialization failed!');
      }
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Unhandled error during database initialization:', err);
      process.exit(1);
    });
}
