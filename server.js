const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
require("dotenv").config();
const { User } = require("./models/User");

// Route imports
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");

const app = express();
const port = process.env.PORT || 3000;

// Security middleware
// Configure Helmet with custom Content Security Policy to allow Chart.js from CDN
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
      },
    },
  })
); // Adds various HTTP headers for security

// Rate limiting to prevent brute force attacks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs (increased from 100)
  message: { message: "Too many requests, please try again later." },
});

// Apply rate limiting to authentication routes
app.use("/api/auth/", apiLimiter);

// Properly configured CORS
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? ["https://yourdomain.com"] // Whitelist domains in production
      : "http://localhost:3000", // Allow localhost in development
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "x-auth-token"],
  credentials: true,
};

// Middleware
app.use(express.json({ limit: "1mb" })); // Limit request body size
app.use(cors(corsOptions));
app.use(cookieParser()); // Parse cookies

// CSRF protection middleware - configure to work with cookie-based authentication
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  },
});

// Add CSRF protection to all state-changing routes
app.use("/api/auth/login", csrfProtection);
app.use("/api/auth/register", csrfProtection);
app.use("/api/auth/logout", csrfProtection);
app.use("/api/users", csrfProtection);

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// CSRF token endpoint
app.get("/api/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Seed users for demo
User.seedUsers();

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// API health check route
app.get("/api", (req, res) => {
  res.json({
    message: "User Management API is running",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
    },
  });
});

// Dashboard data route
app.get("/api/dashboard", async (req, res) => {
  try {
    const users = await User.getAll(); // wait for the promise to resolve

    res.json({
      stats: {
        activeUsers: Math.floor(Math.random() * 50) + 10,
        newUsers: Math.floor(Math.random() * 10),
        users: users.length,
      },
      recentActivity: [
        {
          action: "User login",
          timestamp: new Date(Date.now() - 120000).toISOString(),
        },
        {
          action: "Profile updated",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          action: "New user registered",
          timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
      ],
    });
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Malformed JSON" });
  }
  res.status(500).json({ message: "Internal server error" });
});

// Handle SPA routing - serve index.html for any other routes
// Note: This needs to be after all other routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
