const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

// Import database connection
const connectDB = require('./src/config/database');

// Import routes
const academicYearRoutes = require('./src/routes/academicYearRoutes');
const semesterRoutes = require('./src/routes/semesterRoutes');
const degreeRoutes = require('./src/routes/degreeRoutes');
const departmentRoutes = require('./src/routes/departmentRoutes');
const teacherRoutes = require('./src/routes/teacherRoutes');
const subjectRoutes = require('./src/routes/subjectRoutes');
const classRoutes = require('./src/routes/classRoutes');
const teachingAssignmentRoutes = require('./src/routes/teachingAssignmentRoutes');
const rateSettingRoutes = require('./src/routes/rateSettingRoutes');
const periodRateRoutes = require('./src/routes/periodRateRoutes');
const salaryCalculationRoutes = require('./src/routes/salaryCalculationRoutes');
const reportRoutes = require('./src/routes/reportRoutes');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json({ limit: '10mb' })); // Body parser for JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Body parser for URL encoded data

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/academic-years', academicYearRoutes);
app.use('/api/semesters', semesterRoutes);
app.use('/api/degrees', degreeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/teaching-assignments', teachingAssignmentRoutes);
app.use('/api/rate-settings', rateSettingRoutes);
app.use('/api/period-rates', periodRateRoutes);
app.use('/api/salary-calculations', salaryCalculationRoutes);
app.use('/api/reports', reportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Teacher Payroll Management System API',
    version: '1.0.0',
    docs: '/api/health'
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler (silent mode)
app.use((err, req, res, next) => {
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
      error: `Duplicate value for ${field}`
    });
  }

  // Mongoose CastError
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      error: err.message
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: err.message
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
      error: err.message
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

// Handle unhandled promise rejections (silent)
process.on('unhandledRejection', (err, promise) => {
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions (silent)
process.on('uncaughtException', (err) => {
  process.exit(1);
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  // Silent startup - no console logs
});

module.exports = app; 