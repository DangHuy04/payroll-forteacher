const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Mã học kì là bắt buộc'],
    unique: true,
    trim: true,
    maxlength: [20, 'Mã học kì không được quá 20 ký tự'],
    match: [/^\d{4}-\d{4}\.[1-3]$/, 'Mã học kì phải có định dạng YYYY-YYYY.X (VD: 2023-2024.1)']
  },
  name: {
    type: String,
    required: [true, 'Tên học kì là bắt buộc'],
    trim: true,
    maxlength: [100, 'Tên học kì không được quá 100 ký tự']
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: [true, 'Năm học là bắt buộc']
  },
  semesterNumber: {
    type: Number,
    required: [true, 'Số thứ tự học kì là bắt buộc'],
    enum: {
      values: [1, 2, 3],
      message: 'Số thứ tự học kì phải là 1, 2 hoặc 3 (1: HK1, 2: HK2, 3: HK Hè)'
    }
  },
  semesterType: {
    type: String,
    enum: {
      values: ['regular', 'summer', 'special'],
      message: 'Loại học kì không hợp lệ'
    },
    default: 'regular'
  },
  startDate: {
    type: Date,
    required: [true, 'Ngày bắt đầu học kì là bắt buộc']
  },
  endDate: {
    type: Date,
    required: [true, 'Ngày kết thúc học kì là bắt buộc'],
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'Ngày kết thúc phải sau ngày bắt đầu'
    }
  },
  registrationStartDate: {
    type: Date,
    required: [true, 'Ngày bắt đầu đăng ký là bắt buộc']
  },
  registrationEndDate: {
    type: Date,
    required: [true, 'Ngày kết thúc đăng ký là bắt buộc'],
    validate: {
      validator: function(value) {
        return value > this.registrationStartDate && value <= this.startDate;
      },
      message: 'Ngày kết thúc đăng ký phải sau ngày bắt đầu đăng ký và trước ngày bắt đầu học kì'
    }
  },
  status: {
    type: String,
    enum: {
      values: ['planning', 'registration', 'active', 'exam', 'completed', 'archived'],
      message: 'Trạng thái không hợp lệ'
    },
    default: 'planning'
  },
  maxCredits: {
    type: Number,
    default: 24,
    min: [1, 'Số tín chỉ tối đa phải lớn hơn 0'],
    max: [50, 'Số tín chỉ tối đa không được quá 50']
  },
  tuitionDeadline: {
    type: Date
  },
  description: {
    type: String,
    maxlength: [500, 'Mô tả không được quá 500 ký tự']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    totalClasses: {
      type: Number,
      default: 0
    },
    totalStudents: {
      type: Number,
      default: 0
    },
    totalTeachers: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure unique semester within academic year
semesterSchema.index({ academicYearId: 1, semesterNumber: 1 }, { unique: true });
semesterSchema.index({ code: 1 });
semesterSchema.index({ status: 1, isActive: 1 });
semesterSchema.index({ startDate: 1, endDate: 1 });

// Virtual for academic year info
semesterSchema.virtual('academicYear', {
  ref: 'AcademicYear',
  localField: 'academicYearId',
  foreignField: '_id',
  justOne: true
});

// Virtual for class count
semesterSchema.virtual('classCount', {
  ref: 'Class',
  localField: '_id',
  foreignField: 'semesterId',
  count: true
});

// Virtual for duration in weeks
semesterSchema.virtual('durationWeeks').get(function() {
  if (!this.startDate || !this.endDate) return 0;
  const diffTime = Math.abs(this.endDate - this.startDate);
  const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
  return diffWeeks;
});

// Virtual for display name
semesterSchema.virtual('displayName').get(function() {
  const semesterNames = {
    1: 'Học kì 1',
    2: 'Học kì 2', 
    3: 'Học kì hè'
  };
  return `${semesterNames[this.semesterNumber]} năm ${this.code.split('.')[0]}`;
});

// Virtual for semester type display
semesterSchema.virtual('semesterTypeDisplay').get(function() {
  const types = {
    'regular': 'Học kì chính quy',
    'summer': 'Học kì hè',
    'special': 'Học kì đặc biệt'
  };
  return types[this.semesterType] || this.semesterType;
});

// Methods
semesterSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

semesterSchema.methods.isCurrentSemester = function() {
  const now = new Date();
  return now >= this.startDate && now <= this.endDate;
};

semesterSchema.methods.isRegistrationOpen = function() {
  const now = new Date();
  return now >= this.registrationStartDate && now <= this.registrationEndDate;
};

semesterSchema.methods.canEdit = function() {
  return this.status === 'planning' || this.status === 'registration';
};

semesterSchema.methods.getStatusDisplay = function() {
  const statusMap = {
    'planning': 'Đang lập kế hoạch',
    'registration': 'Đang đăng ký',
    'active': 'Đang diễn ra',
    'exam': 'Thi cử',
    'completed': 'Hoàn thành',
    'archived': 'Lưu trữ'
  };
  return statusMap[this.status] || this.status;
};

// Static methods
semesterSchema.statics.getActive = function() {
  return this.find({ isActive: true })
    .populate('academicYear', 'code name')
    .sort({ 'academicYear.startYear': -1, semesterNumber: 1 });
};

semesterSchema.statics.getCurrent = function() {
  const now = new Date();
  return this.findOne({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).populate('academicYear', 'code name');
};

semesterSchema.statics.getByAcademicYear = function(academicYearId) {
  return this.find({ academicYearId, isActive: true })
    .sort({ semesterNumber: 1 });
};

semesterSchema.statics.getByStatus = function(status) {
  return this.find({ status, isActive: true })
    .populate('academicYear', 'code name')
    .sort({ startDate: -1 });
};

semesterSchema.statics.getUpcoming = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    startDate: { $gt: now }
  })
    .populate('academicYear', 'code name')
    .sort({ startDate: 1 })
    .limit(5);
};

// Pre-save middleware
semesterSchema.pre('save', async function(next) {
  if (this.isModified('academicYearId') || this.isModified('semesterNumber')) {
    // Get academic year info to generate code
    const AcademicYear = mongoose.model('AcademicYear');
    const academicYear = await AcademicYear.findById(this.academicYearId);
    
    if (!academicYear) {
      throw new Error('Năm học không tồn tại');
    }
    
    this.code = `${academicYear.code}.${this.semesterNumber}`;
    
    const semesterNames = {
      1: `Học kì 1 năm ${academicYear.code}`,
      2: `Học kì 2 năm ${academicYear.code}`,
      3: `Học kì hè năm ${academicYear.code}`
    };
    this.name = semesterNames[this.semesterNumber];
    
    // Set semester type based on number
    if (this.semesterNumber === 3) {
      this.semesterType = 'summer';
    } else {
      this.semesterType = 'regular';
    }
  }
  next();
});

// Pre-save validation
semesterSchema.pre('save', async function(next) {
  // Validate dates are within academic year
  if (this.academicYearId && (this.isModified('startDate') || this.isModified('endDate'))) {
    const AcademicYear = mongoose.model('AcademicYear');
    const academicYear = await AcademicYear.findById(this.academicYearId);
    
    if (academicYear) {
      if (this.startDate < academicYear.startDate || this.endDate > academicYear.endDate) {
        throw new Error('Ngày học kì phải nằm trong khoảng thời gian của năm học');
      }
    }
  }
  
  // Check for overlapping semesters in same academic year
  if (this.isNew || this.isModified('startDate') || this.isModified('endDate')) {
    const overlapping = await this.constructor.findOne({
      _id: { $ne: this._id },
      academicYearId: this.academicYearId,
      isActive: true,
      $or: [
        {
          startDate: { $lte: this.endDate },
          endDate: { $gte: this.startDate }
        }
      ]
    });
    
    if (overlapping) {
      throw new Error(`Học kì bị trùng lặp với học kì ${overlapping.name}`);
    }
  }
  
  next();
});

// Pre-remove middleware
semesterSchema.pre('deleteOne', { document: true, query: false }, async function() {
  const Class = mongoose.model('Class');
  const classCount = await Class.countDocuments({ semesterId: this._id });
  
  if (classCount > 0) {
    throw new Error(`Không thể xóa học kì này vì có ${classCount} lớp học phần đang sử dụng`);
  }
});

const Semester = mongoose.model('Semester', semesterSchema);

module.exports = Semester; 