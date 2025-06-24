const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teacher_payroll', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
  } catch (error) {
    process.exit(1);
  }
};

// Handle connection events (silent mode)
mongoose.connection.on('connected', () => {
  // Silent connection
});

mongoose.connection.on('error', (err) => {
  // Silent error handling
});

mongoose.connection.on('disconnected', () => {
  // Silent disconnection
});

// Gracefully close connection on app termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = connectDB; 