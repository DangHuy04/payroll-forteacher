const mongoose = require('mongoose');

const rateSchema = new mongoose.Schema({
  rateType: {
    type: String,
    required: true,
    enum: ['base', 'overtime', 'holiday']
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  effectiveDate: {
    type: Date,
    required: true
  },
  semesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true
  },
  description: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
rateSchema.index({ rateType: 1, semesterId: 1, effectiveDate: -1 });

module.exports = mongoose.model('Rate', rateSchema); 