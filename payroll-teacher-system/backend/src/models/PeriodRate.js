const mongoose = require('mongoose');

const periodRateSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: [true, 'Tên định mức là bắt buộc'],
    trim: true,
    maxlength: [200, 'Tên định mức không được quá 200 ký tự']
  },
  
  // Rate per period (VND per teaching period)
  ratePerPeriod: {
    type: Number,
    required: [true, 'Giá tiền mỗi tiết là bắt buộc'],
    min: [0, 'Giá tiền mỗi tiết không được âm'],
    max: [10000000, 'Giá tiền mỗi tiết không được quá 10 triệu VNĐ']
  },
  
  // Academic Context
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: [true, 'Năm học là bắt buộc']
  },
  
  // Effective date
  effectiveDate: {
    type: Date,
    required: [true, 'Ngày hiệu lực là bắt buộc'],
    default: Date.now
  },
  
  // End date (optional - for when rate is no longer active)
  endDate: {
    type: Date,
    default: null
  },
  
  // Description
  description: {
    type: String,
    maxlength: [1000, 'Mô tả không được quá 1000 ký tự'],
    trim: true
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Approval workflow
  approvalStatus: {
    type: String,
    enum: {
      values: ['draft', 'pending', 'approved', 'rejected'],
      message: 'Trạng thái phê duyệt không hợp lệ'
    },
    default: 'draft'
  },
  
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  approvedAt: {
    type: Date,
    default: null
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
periodRateSchema.index({ academicYearId: 1, isActive: 1 });
periodRateSchema.index({ effectiveDate: -1 });
periodRateSchema.index({ ratePerPeriod: 1 });

// Virtual for formatted rate
periodRateSchema.virtual('formattedRate').get(function() {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(this.ratePerPeriod);
});

// Instance method to check if rate is currently active
periodRateSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  return this.isActive && 
         this.effectiveDate <= now && 
         (!this.endDate || this.endDate >= now);
};

// Static method to get current active rate for academic year
periodRateSchema.statics.getCurrentRate = async function(academicYearId) {
  const now = new Date();
  return this.findOne({
    academicYearId,
    isActive: true,
    effectiveDate: { $lte: now },
    $or: [
      { endDate: { $gte: now } },
      { endDate: null }
    ]
  }).sort({ effectiveDate: -1 });
};

// Static method to get all rates for academic year
periodRateSchema.statics.getByAcademicYear = async function(academicYearId) {
  return this.find({ academicYearId })
    .populate('academicYearId', 'name code')
    .sort({ effectiveDate: -1 });
};

// Pre-save middleware to handle activation logic
periodRateSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('isActive')) {
    // If this rate is being activated, deactivate other rates for the same academic year
    if (this.isActive) {
      await this.constructor.updateMany(
        { 
          academicYearId: this.academicYearId,
          _id: { $ne: this._id }
        },
        { isActive: false }
      );
    }
  }
  next();
});

// Pre-remove middleware
periodRateSchema.pre('remove', async function(next) {
  // Check if this rate is being used in any salary calculations
  const SalaryCalculation = mongoose.model('SalaryCalculation');
  const usageCount = await SalaryCalculation.countDocuments({
    periodRateId: this._id
  });
  
  if (usageCount > 0) {
    throw new Error('Không thể xóa định mức đang được sử dụng trong tính lương');
  }
  
  next();
});

module.exports = mongoose.model('PeriodRate', periodRateSchema); 