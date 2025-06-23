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
  semesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: [true, 'Học kì là bắt buộc']
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
  status: {
    type: String,
    enum: {
      values: ['planning', 'open', 'full', 'in_progress', 'completed', 'cancelled'],
      message: 'Trạng thái lớp học không hợp lệ'
    },
    default: 'planning'
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
classSchema.index({ semesterId: 1, subjectId: 1, code: 1 }, { unique: true });
classSchema.index({ code: 1 });
classSchema.index({ semesterId: 1, status: 1 });
classSchema.index({ subjectId: 1, isActive: 1 });
classSchema.index({ 'schedule.dayOfWeek': 1, 'schedule.startPeriod': 1 });

// Virtual for semester info
classSchema.virtual('semester', {
  ref: 'Semester',
  localField: 'semesterId',
  foreignField: '_id',
  justOne: true
});

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

// Virtual for status display
classSchema.virtual('statusDisplay').get(function() {
  const statuses = {
    'planning': 'Đang lập kế hoạch',
    'open': 'Mở đăng ký',
    'full': 'Đã đầy',
    'in_progress': 'Đang diễn ra',
    'completed': 'Hoàn thành',
    'cancelled': 'Đã hủy'
  };
  return statuses[this.status] || this.status;
});

// Virtual for class type display
classSchema.virtual('classTypeDisplay').get(function() {
  const types = {
    'theory': 'Lý thuyết',
    'practice': 'Thực hành',
    'lab': 'Thí nghiệm',
    'seminar': 'Seminar',
    'online': 'Trực tuyến'
  };
  return types[this.classType] || this.classType;
});

// Virtual for teaching method display
classSchema.virtual('teachingMethodDisplay').get(function() {
  const methods = {
    'offline': 'Tại lớp',
    'online': 'Trực tuyến',
    'hybrid': 'Kết hợp'
  };
  return methods[this.teachingMethod] || this.teachingMethod;
});

// Virtual for day of week display
classSchema.virtual('dayOfWeekDisplay').get(function() {
  if (!this.schedule.dayOfWeek) return '';
  const days = {
    2: 'Thứ 2',
    3: 'Thứ 3',
    4: 'Thứ 4',
    5: 'Thứ 5',
    6: 'Thứ 6',
    7: 'Chủ nhật'
  };
  return days[this.schedule.dayOfWeek] || '';
});

// Virtual for schedule display
classSchema.virtual('scheduleDisplay').get(function() {
  if (!this.schedule.dayOfWeek || !this.schedule.startPeriod) return 'Chưa xếp lịch';
  
  const dayName = this.dayOfWeekDisplay;
  const endPeriod = this.schedule.startPeriod + (this.schedule.periodsCount || 2) - 1;
  const room = this.schedule.room ? ` - ${this.schedule.room}` : '';
  
  return `${dayName}, tiết ${this.schedule.startPeriod}-${endPeriod}${room}`;
});

// Virtual for total teaching periods (from subject)
classSchema.virtual('totalTeachingPeriods').get(function() {
  if (this.subject) {
    return this.subject.periods;
  }
  return 0;
});

// Virtual for semester total salary (will be calculated when TeachingAssignment is implemented)
classSchema.virtual('estimatedSalary').get(function() {
  if (this.subject) {
    return this.subject.salaryCoefficient * this.studentCount;
  }
  return 0;
});

// Methods
classSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

classSchema.methods.canEdit = function() {
  return this.status === 'planning' || this.status === 'open';
};

classSchema.methods.canDelete = function() {
  return this.status === 'planning' || this.status === 'cancelled';
};

classSchema.methods.canAddStudents = function() {
  return this.status === 'open' && this.studentCount < this.maxStudents;
};

classSchema.methods.updateStatus = function() {
  if (this.studentCount >= this.maxStudents) {
    this.status = 'full';
  } else if (this.status === 'full' && this.studentCount < this.maxStudents) {
    this.status = 'open';
  }
};

// Static methods
classSchema.statics.getActive = function() {
  return this.find({ isActive: true })
    .populate('semester', 'code name')
    .populate('subject', 'code name credits coefficient')
    .sort({ code: 1 });
};

classSchema.statics.getBySemester = function(semesterId) {
  return this.find({ semesterId, isActive: true })
    .populate('subject', 'code name credits coefficient periods departmentId')
    .populate({
      path: 'subject',
      populate: {
        path: 'departmentId',
        select: 'code name'
      }
    })
    .sort({ code: 1 });
};

classSchema.statics.getBySubject = function(subjectId) {
  return this.find({ subjectId, isActive: true })
    .populate('semester', 'code name')
    .sort({ code: 1 });
};

classSchema.statics.getByStatus = function(status) {
  return this.find({ status, isActive: true })
    .populate('semester', 'code name')
    .populate('subject', 'code name')
    .sort({ code: 1 });
};

classSchema.statics.getBySchedule = function(dayOfWeek, startPeriod) {
  return this.find({
    'schedule.dayOfWeek': dayOfWeek,
    'schedule.startPeriod': { $lte: startPeriod },
    $expr: {
      $gte: [
        startPeriod,
        { $add: ['$schedule.startPeriod', { $subtract: ['$schedule.periodsCount', 1] }] }
      ]
    },
    isActive: true
  })
    .populate('semester', 'code name')
    .populate('subject', 'code name')
    .sort({ 'schedule.startPeriod': 1 });
};

classSchema.statics.getWithStats = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: 'semesters',
        localField: 'semesterId',
        foreignField: '_id',
        as: 'semester'
      }
    },
    {
      $lookup: {
        from: 'subjects',
        localField: 'subjectId',
        foreignField: '_id',
        as: 'subject'
      }
    },
    {
      $lookup: {
        from: 'teachingassignments',
        localField: '_id',
        foreignField: 'classId',
        as: 'teachingAssignments'
      }
    },
    {
      $addFields: {
        semester: { $arrayElemAt: ['$semester', 0] },
        subject: { $arrayElemAt: ['$subject', 0] },
        teachingAssignmentCount: { $size: '$teachingAssignments' },
        enrollmentPercentage: {
          $multiply: [
            { $divide: ['$studentCount', '$maxStudents'] },
            100
          ]
        },
        remainingSlots: { $subtract: ['$maxStudents', '$studentCount'] },
        estimatedSalary: {
          $multiply: [
            { $multiply: [{ $arrayElemAt: ['$subject.credits', 0] }, { $arrayElemAt: ['$subject.coefficient', 0] }] },
            '$studentCount'
          ]
        }
      }
    },
    {
      $project: {
        teachingAssignments: 0
      }
    },
    { $sort: { code: 1 } }
  ]);
};

// Pre-save middleware
classSchema.pre('save', function(next) {
  if (this.isModified('code')) {
    this.code = this.code.toUpperCase();
  }
  
  // Auto-update status based on student count
  this.updateStatus();
  
  next();
});

// Pre-save validation
classSchema.pre('save', async function(next) {
  // Validate semester exists and is active
  if (this.isModified('semesterId')) {
    const Semester = mongoose.model('Semester');
    const semester = await Semester.findById(this.semesterId);
    if (!semester) {
      throw new Error('Học kì không tồn tại');
    }
    if (!semester.isActive) {
      throw new Error('Học kì đã bị vô hiệu hóa');
    }
  }

  // Validate subject exists and is active
  if (this.isModified('subjectId')) {
    const Subject = mongoose.model('Subject');
    const subject = await Subject.findById(this.subjectId);
    if (!subject) {
      throw new Error('Học phần không tồn tại');
    }
    if (!subject.isActive) {
      throw new Error('Học phần đã bị vô hiệu hóa');
    }
  }

  // Validate student count does not exceed max
  if (this.studentCount > this.maxStudents) {
    throw new Error('Số sinh viên không được vượt quá số sinh viên tối đa');
  }

  // Validate schedule conflicts (within same semester)
  if (this.schedule.dayOfWeek && this.schedule.startPeriod && this.schedule.periodsCount) {
    const endPeriod = this.schedule.startPeriod + this.schedule.periodsCount - 1;
    
    const conflictingClasses = await this.constructor.find({
      _id: { $ne: this._id },
      semesterId: this.semesterId,
      'schedule.dayOfWeek': this.schedule.dayOfWeek,
      'schedule.room': this.schedule.room,
      isActive: true,
      $or: [
        {
          'schedule.startPeriod': { $lte: this.schedule.startPeriod },
          $expr: {
            $gte: [
              this.schedule.startPeriod,
              { $add: ['$schedule.startPeriod', { $subtract: ['$schedule.periodsCount', 1] }] }
            ]
          }
        },
        {
          'schedule.startPeriod': { $lte: endPeriod },
          $expr: {
            $gte: [
              endPeriod,
              { $add: ['$schedule.startPeriod', { $subtract: ['$schedule.periodsCount', 1] }] }
            ]
          }
        }
      ]
    });

    if (conflictingClasses.length > 0) {
      throw new Error(`Lịch học bị trùng với lớp ${conflictingClasses[0].code} trong cùng phòng học`);
    }
  }

  next();
});

// Pre-remove middleware
classSchema.pre('deleteOne', { document: true, query: false }, async function() {
  // Check if class has teaching assignments
  const TeachingAssignment = mongoose.model('TeachingAssignment');
  const assignmentCount = await TeachingAssignment.countDocuments({ classId: this._id });
  
  if (assignmentCount > 0) {
    throw new Error(`Không thể xóa lớp học này vì có ${assignmentCount} phân công giảng dạy đang sử dụng`);
  }
});

// Post-save middleware to update subject metadata
classSchema.post('save', async function() {
  // Update subject statistics
  const Subject = mongoose.model('Subject');
  const classes = await this.constructor.find({ subjectId: this.subjectId });
  
  const totalClasses = classes.length;
  const totalStudents = classes.reduce((sum, cls) => sum + (cls.studentCount || 0), 0);
  const averageClassSize = totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0;
  
  await Subject.findByIdAndUpdate(this.subjectId, {
    'metadata.totalClasses': totalClasses,
    'metadata.totalStudents': totalStudents,
    'metadata.averageClassSize': averageClassSize
  });
});

const Class = mongoose.model('Class', classSchema);

module.exports = Class; 