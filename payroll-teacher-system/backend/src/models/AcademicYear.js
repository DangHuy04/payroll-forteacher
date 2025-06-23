const mongoose = require('mongoose');

const academicYearSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Mã năm học là bắt buộc'],
    unique: true,
    trim: true,
    maxlength: [20, 'Mã năm học không được quá 20 ký tự'],
    match: [/^\d{4}-\d{4}$/, 'Mã năm học phải có định dạng YYYY-YYYY (VD: 2023-2024)']
  },
  name: {
    type: String,
    required: [true, 'Tên năm học là bắt buộc'],
    trim: true,
    maxlength: [100, 'Tên năm học không được quá 100 ký tự']
  },
  startYear: {
    type: Number,
    required: [true, 'Năm bắt đầu là bắt buộc'],
    min: [2000, 'Năm bắt đầu phải từ 2000'],
    max: [2100, 'Năm bắt đầu không được quá 2100']
  },
  endYear: {
    type: Number,
    required: [true, 'Năm kết thúc là bắt buộc'],
    min: [2000, 'Năm kết thúc phải từ 2000'],
    max: [2100, 'Năm kết thúc không được quá 2100'],
    validate: {
      validator: function(value) {
        return value === this.startYear + 1;
      },
      message: 'Năm kết thúc phải bằng năm bắt đầu + 1'
    }
  },
  startDate: {
    type: Date,
    required: [true, 'Ngày bắt đầu năm học là bắt buộc']
  },
  endDate: {
    type: Date,
    required: [true, 'Ngày kết thúc năm học là bắt buộc'],
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'Ngày kết thúc phải sau ngày bắt đầu'
    }
  },
  status: {
    type: String,
    enum: {
      values: ['planning', 'active', 'completed', 'archived'],
      message: 'Trạng thái không hợp lệ'
    },
    default: 'planning'
  },
  description: {
    type: String,
    maxlength: [500, 'Mô tả không được quá 500 ký tự']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for performance
academicYearSchema.index({ code: 1 });
academicYearSchema.index({ status: 1, isActive: 1 });
academicYearSchema.index({ startYear: 1, endYear: 1 });

// Virtual for semester count
academicYearSchema.virtual('semesterCount', {
  ref: 'Semester',
  localField: '_id',
  foreignField: 'academicYearId',
  count: true
});

// Virtual for duration in months
academicYearSchema.virtual('durationMonths').get(function() {
  if (!this.startDate || !this.endDate) return 0;
  const diffTime = Math.abs(this.endDate - this.startDate);
  const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Average days per month
  return diffMonths;
});

// Virtual for display name
academicYearSchema.virtual('displayName').get(function() {
  return `${this.code} - ${this.name}`;
});

// Methods
academicYearSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

academicYearSchema.methods.isCurrentYear = function() {
  const now = new Date();
  return now >= this.startDate && now <= this.endDate;
};

academicYearSchema.methods.canEdit = function() {
  return this.status === 'planning' || this.status === 'active';
};

// Static methods
academicYearSchema.statics.getActive = function() {
  return this.find({ isActive: true }).sort({ startYear: -1 });
};

academicYearSchema.statics.getCurrent = function() {
  const now = new Date();
  return this.findOne({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  });
};

academicYearSchema.statics.getByCode = function(code) {
  return this.findOne({ code, isActive: true });
};

academicYearSchema.statics.getByStatus = function(status) {
  return this.find({ status, isActive: true }).sort({ startYear: -1 });
};

// Pre-save middleware
academicYearSchema.pre('save', function(next) {
  if (this.isModified('startYear') || this.isModified('endYear')) {
    this.code = `${this.startYear}-${this.endYear}`;
    this.name = `Năm học ${this.startYear}-${this.endYear}`;
  }
  next();
});

// Pre-save validation
academicYearSchema.pre('save', async function(next) {
  // Check for overlapping academic years
  if (this.isNew || this.isModified('startDate') || this.isModified('endDate')) {
    const overlapping = await this.constructor.findOne({
      _id: { $ne: this._id },
      isActive: true,
      $or: [
        {
          startDate: { $lte: this.endDate },
          endDate: { $gte: this.startDate }
        }
      ]
    });
    
    if (overlapping) {
      throw new Error(`Năm học bị trùng lặp với năm học ${overlapping.code}`);
    }
  }
  next();
});

// Pre-remove middleware
academicYearSchema.pre('deleteOne', { document: true, query: false }, async function() {
  const Semester = mongoose.model('Semester');
  const semesterCount = await Semester.countDocuments({ academicYearId: this._id });
  
  if (semesterCount > 0) {
    throw new Error(`Không thể xóa năm học này vì có ${semesterCount} học kì đang sử dụng`);
  }
});

const AcademicYear = mongoose.model('AcademicYear', academicYearSchema);

module.exports = AcademicYear; 