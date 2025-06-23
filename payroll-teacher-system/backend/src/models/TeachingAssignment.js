const mongoose = require('mongoose');

const teachingAssignmentSchema = new mongoose.Schema({
  // Basic Assignment Info
  code: {
    type: String,
    required: [true, 'Mã phân công là bắt buộc'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [20, 'Mã phân công không được quá 20 ký tự']
  },
  
  // References - inspired by Payroll Engine's Employee-Division-Payroll relationships
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: [true, 'Giảng viên là bắt buộc']
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Lớp học phần là bắt buộc']
  },
  semesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: [true, 'Học kì là bắt buộc']
  },
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: [true, 'Năm học là bắt buộc']
  },
  
  // Assignment Details - inspired by Payroll Engine's case values
  assignmentType: {
    type: String,
    enum: {
      values: ['chính', 'phụ', 'thay_thế', 'hỗ_trợ'],
      message: 'Loại phân công không hợp lệ'
    },
    default: 'chính',
    required: true
  },
  
  // Teaching Load - similar to Payroll Engine's calculation bases
  teachingHours: {
    type: Number,
    required: [true, 'Số giờ dạy là bắt buộc'],
    min: [0, 'Số giờ dạy không được âm'],
    max: [200, 'Số giờ dạy không được quá 200 giờ/học kì']
  },
  
  // Coefficient - inspired by Payroll Engine's rate calculations
  teachingCoefficient: {
    type: Number,
    default: 1.0,
    min: [0.1, 'Hệ số giảng dạy không được nhỏ hơn 0.1'],
    max: [3.0, 'Hệ số giảng dạy không được lớn hơn 3.0']
  },
  
  // Workload Distribution - inspired by Payroll Engine's division assignments
  workloadDistribution: {
    lectureHours: {
      type: Number,
      default: 0,
      min: [0, 'Giờ lý thuyết không được âm']
    },
    practiceHours: {
      type: Number,
      default: 0,
      min: [0, 'Giờ thực hành không được âm']
    },
    labHours: {
      type: Number,
      default: 0,
      min: [0, 'Giờ thí nghiệm không được âm']
    },
    otherHours: {
      type: Number,
      default: 0,
      min: [0, 'Giờ khác không được âm']
    }
  },
  
  // Status Management - inspired by Payroll Engine's payrun states
  status: {
    type: String,
    enum: {
      values: ['draft', 'assigned', 'confirmed', 'in_progress', 'completed', 'cancelled'],
      message: 'Trạng thái phân công không hợp lệ'
    },
    default: 'draft'
  },
  
  // Approval Workflow - similar to Payroll Engine's approval processes
  approval: {
    isApproved: {
      type: Boolean,
      default: false
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
    approvalNotes: {
      type: String,
      maxlength: [500, 'Ghi chú phê duyệt không được quá 500 ký tự']
    }
  },
  
  // Time Tracking - inspired by Payroll Engine's time-based calculations
  schedule: {
    startDate: {
      type: Date,
      required: [true, 'Ngày bắt đầu là bắt buộc']
    },
    endDate: {
      type: Date,
      required: [true, 'Ngày kết thúc là bắt buộc']
    },
    actualStartDate: {
      type: Date,
      default: null
    },
    actualEndDate: {
      type: Date,
      default: null
    }
  },
  
  // Compensation Settings - inspired by Payroll Engine's case calculations
  compensation: {
    baseRate: {
      type: Number,
      default: 0,
      min: [0, 'Mức lương cơ bản không được âm']
    },
    additionalRate: {
      type: Number,
      default: 0,
      min: [0, 'Phụ cấp không được âm']
    },
    overtimeRate: {
      type: Number,
      default: 0,
      min: [0, 'Mức lương làm thêm không được âm']
    }
  },
  
  // Performance Tracking
  performance: {
    attendanceRate: {
      type: Number,
      default: 100,
      min: [0, 'Tỷ lệ tham dự không được âm'],
      max: [100, 'Tỷ lệ tham dự không được quá 100%']
    },
    studentFeedback: {
      type: Number,
      default: null,
      min: [0, 'Điểm phản hồi không được âm'],
      max: [5, 'Điểm phản hồi không được quá 5']
    },
    completionRate: {
      type: Number,
      default: 0,
      min: [0, 'Tỷ lệ hoàn thành không được âm'],
      max: [100, 'Tỷ lệ hoàn thành không được quá 100%']
    }
  },
  
  // Metadata - inspired by Payroll Engine's versioning and tracking
  metadata: {
    version: {
      type: Number,
      default: 1
    },
    lastModified: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    tags: [{
      type: String,
      maxlength: [50, 'Tag không được quá 50 ký tự']
    }]
  },
  
  // Additional Information
  notes: {
    type: String,
    maxlength: [1000, 'Ghi chú không được quá 1000 ký tự']
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

// Indexes for performance
teachingAssignmentSchema.index({ code: 1 });
teachingAssignmentSchema.index({ teacherId: 1, semesterId: 1 });
teachingAssignmentSchema.index({ classId: 1 });
teachingAssignmentSchema.index({ semesterId: 1, status: 1 });
teachingAssignmentSchema.index({ 'schedule.startDate': 1, 'schedule.endDate': 1 });
teachingAssignmentSchema.index({ isActive: 1, status: 1 });

// Compound index for conflict detection
teachingAssignmentSchema.index({ 
  teacherId: 1, 
  'schedule.startDate': 1, 
  'schedule.endDate': 1,
  status: 1 
});

// Virtual for teacher info
teachingAssignmentSchema.virtual('teacher', {
  ref: 'Teacher',
  localField: 'teacherId',
  foreignField: '_id',
  justOne: true
});

// Virtual for class info
teachingAssignmentSchema.virtual('class', {
  ref: 'Class',
  localField: 'classId',
  foreignField: '_id',
  justOne: true
});

// Virtual for semester info
teachingAssignmentSchema.virtual('semester', {
  ref: 'Semester',
  localField: 'semesterId',
  foreignField: '_id',
  justOne: true
});

// Virtual for academic year info
teachingAssignmentSchema.virtual('academicYear', {
  ref: 'AcademicYear',
  localField: 'academicYearId',
  foreignField: '_id',
  justOne: true
});

// Virtual for total teaching hours
teachingAssignmentSchema.virtual('totalWorkloadHours').get(function() {
  const { lectureHours, practiceHours, labHours, otherHours } = this.workloadDistribution;
  return (lectureHours || 0) + (practiceHours || 0) + (labHours || 0) + (otherHours || 0);
});

// Virtual for estimated compensation
teachingAssignmentSchema.virtual('estimatedCompensation').get(function() {
  const baseAmount = this.teachingHours * this.compensation.baseRate * this.teachingCoefficient;
  const additionalAmount = this.compensation.additionalRate;
  const overtimeAmount = this.compensation.overtimeRate;
  return baseAmount + additionalAmount + overtimeAmount;
});

// Virtual for assignment duration
teachingAssignmentSchema.virtual('assignmentDuration').get(function() {
  if (this.schedule.startDate && this.schedule.endDate) {
    return Math.ceil((this.schedule.endDate - this.schedule.startDate) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Pre-save middleware
teachingAssignmentSchema.pre('save', function(next) {
  if (this.isModified('startDate') || this.isModified('endDate')) {
    if (this.endDate <= this.startDate) {
      return next(new Error('Ngày kết thúc phải sau ngày bắt đầu'));
    }
  }

  // Validate academic year matches with class's semester
  if (this.isModified('classId') || this.isModified('academicYearId')) {
    const Class = mongoose.model('Class');
    Class.findById(this.classId)
      .populate('semester')
      .then(class_ => {
        if (!class_) {
          return next(new Error('Lớp học phần không tồn tại'));
        }

        if (class_.semester.academicYearId.toString() !== this.academicYearId.toString()) {
          return next(new Error('Năm học không khớp với kỳ học của lớp'));
        }
        next();
      })
      .catch(err => next(err));
  } else {
    next();
  }
});

// Pre-update middleware
teachingAssignmentSchema.pre('findOneAndUpdate', function(next) {
  this.set({ 'metadata.lastModified': new Date() });
  next();
});

// Methods
teachingAssignmentSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

teachingAssignmentSchema.methods.approve = function(approvedBy, notes) {
  this.approval.isApproved = true;
  this.approval.approvedBy = approvedBy;
  this.approval.approvedAt = new Date();
  this.approval.approvalNotes = notes || '';
  this.status = 'confirmed';
  return this.save();
};

teachingAssignmentSchema.methods.cancel = function(reason) {
  this.status = 'cancelled';
  this.notes = (this.notes || '') + `\nCancelled: ${reason}`;
  return this.save();
};

teachingAssignmentSchema.methods.getBasicInfo = function() {
  return {
    _id: this._id,
    code: this.code,
    teacherId: this.teacherId,
    classId: this.classId,
    assignmentType: this.assignmentType,
    teachingHours: this.teachingHours,
    status: this.status,
    isActive: this.isActive
  };
};

// Static methods
teachingAssignmentSchema.statics.getActive = function() {
  return this.find({ isActive: true })
    .populate('teacher', 'code fullName email')
    .populate('class', 'code name')
    .populate('semester', 'code name')
    .sort({ 'schedule.startDate': -1 });
};

teachingAssignmentSchema.statics.findByTeacher = function(teacherId, semesterId = null) {
  const query = { teacherId, isActive: true };
  if (semesterId) query.semesterId = semesterId;
  
  return this.find(query)
    .populate('class', 'code name')
    .populate('semester', 'code name')
    .sort({ 'schedule.startDate': -1 });
};

teachingAssignmentSchema.statics.findBySemester = function(semesterId) {
  return this.find({ semesterId, isActive: true })
    .populate('teacher', 'code fullName')
    .populate('class', 'code name')
    .sort({ 'schedule.startDate': -1 });
};

teachingAssignmentSchema.statics.findByClass = function(classId) {
  return this.find({ classId, isActive: true })
    .populate('teacher', 'code fullName email')
    .populate('semester', 'code name')
    .sort({ assignmentType: 1 });
};

// Check for teaching conflicts
teachingAssignmentSchema.statics.checkConflicts = function(teacherId, startDate, endDate, excludeId = null) {
  const query = {
    teacherId,
    isActive: true,
    status: { $in: ['assigned', 'confirmed', 'in_progress'] },
    $or: [
      {
        'schedule.startDate': { $lte: endDate },
        'schedule.endDate': { $gte: startDate }
      }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.find(query)
    .populate('class', 'code name')
    .populate('semester', 'code name');
};

// Get teaching statistics
teachingAssignmentSchema.statics.getTeachingStats = function(filters = {}) {
  const matchStage = { isActive: true, ...filters };
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$teacherId',
        totalAssignments: { $sum: 1 },
        totalTeachingHours: { $sum: '$teachingHours' },
        averageCoefficient: { $avg: '$teachingCoefficient' },
        statusBreakdown: {
          $push: {
            status: '$status',
            hours: '$teachingHours'
          }
        }
      }
    },
    {
      $lookup: {
        from: 'teachers',
        localField: '_id',
        foreignField: '_id',
        as: 'teacher'
      }
    },
    {
      $unwind: '$teacher'
    },
    {
      $project: {
        teacherCode: '$teacher.code',
        teacherName: '$teacher.fullName',
        totalAssignments: 1,
        totalTeachingHours: 1,
        averageCoefficient: { $round: ['$averageCoefficient', 2] },
        statusBreakdown: 1
      }
    },
    {
      $sort: { totalTeachingHours: -1 }
    }
  ]);
};

module.exports = mongoose.model('TeachingAssignment', teachingAssignmentSchema); 