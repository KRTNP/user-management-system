# User Management System

## Overview
This is a practice lab project implementing a user management system with authentication and authorization features. It's built with Node.js and Express, using MySQL as the database.

**IMPORTANT**: This project is intended for educational and practice purposes only. It may contain security vulnerabilities or implementation issues and is not recommended for production use without thorough security review.

## Features
- User registration and authentication
- JWT-based authentication
- Role-based access control
- API rate limiting
- Security headers with Helmet
- CSRF protection

## Tech Stack
- Node.js
- Express.js
- MySQL
- JSON Web Tokens (JWT)
- bcrypt for password hashing

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MySQL database

### Installation
1. Clone the repository
```
git clone https://github.com/yourusername/user-management-system.git
cd user-management-system
```

2. Install dependencies
```
npm install
```

3. Create .env file (use .env.example as a template)
```
cp .env.example .env
```

4. Update .env with your database credentials and JWT secret

5. Initialize the database
```
npm run db:init
```

6. Run the application
```
npm run dev
```

The server will start at http://localhost:3000 (or the port specified in your .env file)

## API Routes
- POST /api/users/register - Register a new user
- POST /api/users/login - Login a user
- GET /api/users/me - Get current user information
- PUT /api/users/:id - Update user information
- DELETE /api/users/:id - Delete a user

## Disclaimer
This application is created for educational purposes. It may contain security vulnerabilities or implementation flaws as it's designed for learning and practice. Use at your own risk.

## License
ISC License
