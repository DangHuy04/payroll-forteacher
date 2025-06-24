const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Mã lớp học phần là bắt buộc'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [20, 'Mã lớp học phần không được quá 20 ký tự'],
    match: [/^[A-Z0-9.-]+$/, 'Mã lớp học phần chỉ được chứa chữ cái hoa, số, dấu chấm và gạch ngang']
  },
  name: {
    type: String,
    required: [true, 'Tên lớp học phần là bắt buộc'],
    trim: true,
    maxlength: [200, 'Tên lớp học phần không được quá 200 ký tự']
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Học phần là bắt buộc']
  },
  studentCount: {
    type: Number,
    required: [true, 'Số sinh viên là bắt buộc'],
    min: [1, 'Số sinh viên phải lớn hơn 0'],
    max: [200, 'Số sinh viên không được quá 200'],
    validate: {
      validator: function(value) {
        return Number.isInteger(value);
      },
      message: 'Số sinh viên phải là số nguyên'
    }
  },
  maxStudents: {
    type: Number,
    default: 50,
    min: [5, 'Số sinh viên tối đa phải từ 5'],
    max: [200, 'Số sinh viên tối đa không được quá 200']
  },
  classCoefficient: {
    type: Number,
    default: 1.0,
    min: [1.0, 'Hệ số lớp phải từ 1.0'],
    max: [1.4, 'Hệ số lớp không được quá 1.4']
  },
  schedule: {
    dayOfWeek: {
      type: Number,
      enum: {
        values: [2, 3, 4, 5, 6, 7],
        message: 'Thứ trong tuần phải từ 2-7 (Thứ 2 đến Chủ nhật)'
      }
    },
    startPeriod: {
      type: Number,
      min: [1, 'Tiết bắt đầu phải từ 1'],
      max: [12, 'Tiết bắt đầu không được quá 12']
    },
    periodsCount: {
      type: Number,
      min: [1, 'Số tiết phải từ 1'],
      max: [6, 'Số tiết không được quá 6'],
      default: 2
    },
    room: {
      type: String,
      maxlength: [50, 'Tên phòng học không được quá 50 ký tự']
    }
  },
  classType: {
    type: String,
    enum: {
      values: ['theory', 'practice', 'lab', 'seminar', 'online'],
      message: 'Loại lớp học không hợp lệ'
    },
    default: 'theory'
  },
  teachingMethod: {
    type: String,
    enum: {
      values: ['offline', 'online', 'hybrid'],
      message: 'Phương thức giảng dạy không hợp lệ'
    },
    default: 'offline'
  },
  description: {
    type: String,
    maxlength: [500, 'Mô tả không được quá 500 ký tự']
  },
  notes: {
    type: String,
    maxlength: [1000, 'Ghi chú không được quá 1000 ký tự']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    teacherAssignments: {
      type: Number,
      default: 0
    },
    totalTeachingHours: {
      type: Number,
      default: 0
    },
    totalSalaryAmount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for uniqueness within semester
classSchema.index({ subjectId: 1, code: 1 }, { unique: true });
classSchema.index({ code: 1 });
classSchema.index({ subjectId: 1, isActive: 1 });
classSchema.index({ 'schedule.dayOfWeek': 1, 'schedule.startPeriod': 1 });

// Virtual for subject info
classSchema.virtual('subject', {
  ref: 'Subject',
  localField: 'subjectId',
  foreignField: '_id',
  justOne: true
});

// Virtual for teaching assignments
classSchema.virtual('teachingAssignments', {
  ref: 'TeachingAssignment',
  localField: '_id',
  foreignField: 'classId'
});

// Virtual for teaching assignment count
classSchema.virtual('teachingAssignmentCount', {
  ref: 'TeachingAssignment',
  localField: '_id',
  foreignField: 'classId',
  count: true
});

// Virtual for enrollment percentage
classSchema.virtual('enrollmentPercentage').get(function() {
  if (!this.maxStudents || this.maxStudents === 0) return 0;
  return Math.round((this.studentCount / this.maxStudents) * 100);
});

// Virtual for remaining slots
classSchema.virtual('remainingSlots').get(function() {
  return Math.max(0, this.maxStudents - this.studentCount);
});

// Virtual for display name
classSchema.virtual('displayName').get(function() {
  return `${this.code} - ${this.name}`;
});

// Virtual for full name with subject
classSchema.virtual('fullDisplayName').get(function() {
  if (this.subject) {
    return `${this.code} - ${this.subject.name} (${this.name})`;
  }
  return `${this.code} - ${this.name}`;
});

// Virtual for class type display
classSchema.virtual('classTypeDisplay').get(function() {
  const types = {
    'theory': 'Lý thuyết',
    'practice': 'Thực hành',
    'lab': 'Phòng thí nghiệm',
    'seminar': 'Seminar',
    'online': 'Trực tuyến'
  };
  return types[this.classType] || this.classType;
});

// Virtual for teaching method display
classSchema.virtual('teachingMethodDisplay').get(function() {
  const methods = {
    'offline': 'Trực tiếp',
    'online': 'Trực tuyến',
    'hybrid': 'Kết hợp'
  };
  return methods[this.teachingMethod] || this.teachingMethod;
});

// Methods
classSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

classSchema.methods.canDelete = function() {
  return this.metadata.teacherAssignments === 0;
};

// Static methods
classSchema.statics.getBySubject = function(subjectId) {
  return this.find({ subjectId, isActive: true })
    .populate('subjectId', 'code name credits coefficient soTietLyThuyet soTietThucHanh')
    .sort({ code: 1 });
};

classSchema.statics.getByCode = function(code) {
  return this.findOne({ code: code.toUpperCase(), isActive: true })
    .populate('subjectId', 'code name credits coefficient soTietLyThuyet soTietThucHanh');
};

// Pre-save middleware to calculate class coefficient
classSchema.pre('save', function(next) {
  // Calculate class coefficient based on student count
  if (this.isModified('studentCount')) {
    if (this.studentCount <= 30) {
      this.classCoefficient = 1.0;
    } else if (this.studentCount <= 50) {
      this.classCoefficient = 1.1;
    } else if (this.studentCount <= 70) {
      this.classCoefficient = 1.2;
    } else if (this.studentCount <= 100) {
      this.classCoefficient = 1.3;
    } else {
      this.classCoefficient = 1.4;
    }
  }

  // Auto-generate code if not provided
  if (this.isModified('subjectId') && !this.isModified('code')) {
    // This will be handled in the controller with proper subject info
  }
  
  next();
});

// Pre-save validation
classSchema.pre('save', async function(next) {
  // Validate subject exists
  if (this.isModified('subjectId')) {
    const Subject = mongoose.model('Subject');
    const subject = await Subject.findById(this.subjectId);
    if (!subject) {
      throw new Error('Học phần không tồn tại');
    }
  }

  // Validate student count doesn't exceed max
  if (this.studentCount > this.maxStudents) {
    throw new Error('Số sinh viên không được vượt quá số sinh viên tối đa');
  }

  next();
});

// Pre-remove middleware
classSchema.pre('deleteOne', { document: true, query: false }, async function() {
  const TeachingAssignment = mongoose.model('TeachingAssignment');
  const assignmentCount = await TeachingAssignment.countDocuments({ classId: this._id });
  
  if (assignmentCount > 0) {
    throw new Error(`Không thể xóa lớp học phần này vì có ${assignmentCount} phân công giảng dạy đang sử dụng`);
  }
});

// Post-save middleware to update metadata
classSchema.post('save', async function() {
  // Update teaching assignment count
  const TeachingAssignment = mongoose.model('TeachingAssignment');
  const assignmentCount = await TeachingAssignment.countDocuments({ classId: this._id });
  
  // Calculate total teaching hours and salary amount
  const assignments = await TeachingAssignment.find({ classId: this._id })
    .populate('teacherId', 'degreeId')
    .populate('classId', 'subjectId classCoefficient')
    .populate('classId.subjectId', 'soTietLyThuyet soTietThucHanh coefficient');
  
  let totalTeachingHours = 0;
  let totalSalaryAmount = 0;
  
  for (const assignment of assignments) {
    if (assignment.classId && assignment.classId.subjectId) {
      const subject = assignment.classId.subjectId;
      const totalPeriods = subject.soTietLyThuyet + subject.soTietThucHanh;
      const teachingHours = totalPeriods * subject.coefficient * assignment.classId.classCoefficient;
      totalTeachingHours += teachingHours;
      
      // Calculate salary (this would need rate settings)
      // totalSalaryAmount += teachingHours * ratePerHour * teacherCoefficient;
    }
  }
  
  await this.constructor.findByIdAndUpdate(this._id, {
    'metadata.teacherAssignments': assignmentCount,
    'metadata.totalTeachingHours': totalTeachingHours,
    'metadata.totalSalaryAmount': totalSalaryAmount
  });
});

const Class = mongoose.model('Class', classSchema);

module.exports = Class; 