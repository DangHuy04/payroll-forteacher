const mongoose = require('mongoose');

const teachingStatisticsSchema = new mongoose.Schema({
  // Academic Context
  academicYearId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: [true, 'Năm học là bắt buộc']
  },

  semesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: [true, 'Học kì là bắt buộc']
  },

  // Teacher Info
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: [true, 'Giáo viên là bắt buộc']
  },

  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Khoa là bắt buộc']
  },

  // Teaching Hours Statistics
  totalTeachingHours: {
    type: Number,
    default: 0
  },

  theoryHours: {
    type: Number,
    default: 0
  },

  practiceHours: {
    type: Number,
    default: 0
  },

  overtimeHours: {
    type: Number,
    default: 0
  },

  // Class Statistics
  totalClasses: {
    type: Number,
    default: 0
  },

  classTypes: [{
    type: {
      type: String,
      enum: ['theory', 'practice', 'project', 'thesis']
    },
    count: Number,
    hours: Number
  }],

  // Subject Statistics
  totalSubjects: {
    type: Number,
    default: 0
  },

  subjects: [{
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    classCount: Number,
    totalHours: Number
  }],

  // Status
  status: {
    type: String,
    enum: {
      values: ['draft', 'pending_approval', 'approved', 'rejected'],
      message: 'Trạng thái không hợp lệ'
    },
    default: 'draft'
  },

  // Approval Info
  approval: {
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    notes: String
  },

  // Metadata
  metadata: {
    lastCalculated: {
      type: Date,
      default: Date.now
    },
    version: {
      type: Number,
      default: 1
    }
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

// Indexes
teachingStatisticsSchema.index({ academicYearId: 1, semesterId: 1, teacherId: 1 }, { unique: true });
teachingStatisticsSchema.index({ departmentId: 1 });
teachingStatisticsSchema.index({ status: 1 });

// Virtuals
teachingStatisticsSchema.virtual('academicYear', {
  ref: 'AcademicYear',
  localField: 'academicYearId',
  foreignField: '_id',
  justOne: true
});

teachingStatisticsSchema.virtual('semester', {
  ref: 'Semester',
  localField: 'semesterId',
  foreignField: '_id',
  justOne: true
});

teachingStatisticsSchema.virtual('teacher', {
  ref: 'Teacher',
  localField: 'teacherId',
  foreignField: '_id',
  justOne: true
});

teachingStatisticsSchema.virtual('department', {
  ref: 'Department',
  localField: 'departmentId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware
teachingStatisticsSchema.pre('save', async function(next) {
  // Validate semester belongs to academic year
  if (this.isModified('academicYearId') || this.isModified('semesterId')) {
    const Semester = mongoose.model('Semester');
    const semester = await Semester.findById(this.semesterId);
    
    if (!semester) {
      throw new Error('Học kì không tồn tại');
    }

    if (semester.academicYearId.toString() !== this.academicYearId.toString()) {
      throw new Error('Học kì không thuộc năm học đã chọn');
    }
  }

  // Validate teacher belongs to department
  if (this.isModified('teacherId') || this.isModified('departmentId')) {
    const Teacher = mongoose.model('Teacher');
    const teacher = await Teacher.findById(this.teacherId);
    
    if (!teacher) {
      throw new Error('Giáo viên không tồn tại');
    }

    if (teacher.departmentId.toString() !== this.departmentId.toString()) {
      throw new Error('Giáo viên không thuộc khoa đã chọn');
    }
  }

  // Auto-increment version
  if (!this.isNew) {
    this.metadata.version += 1;
    this.metadata.lastCalculated = new Date();
  }

  next();
});

// Methods
teachingStatisticsSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

teachingStatisticsSchema.methods.canEdit = function() {
  return this.status === 'draft' || this.status === 'rejected';
};

// Static methods
teachingStatisticsSchema.statics.getByTeacher = function(teacherId, academicYearId, semesterId) {
  return this.findOne({
    teacherId,
    academicYearId,
    semesterId,
    isActive: true
  })
  .populate('teacher')
  .populate('department')
  .populate('semester')
  .populate('academicYear');
};

teachingStatisticsSchema.statics.getByDepartment = function(departmentId, academicYearId, semesterId) {
  return this.find({
    departmentId,
    academicYearId,
    semesterId,
    isActive: true
  })
  .populate('teacher')
  .sort({ 'teacher.fullName': 1 });
};

teachingStatisticsSchema.statics.getByStatus = function(status, academicYearId, semesterId) {
  return this.find({
    status,
    academicYearId,
    semesterId,
    isActive: true
  })
  .populate('teacher')
  .populate('department')
  .sort({ createdAt: -1 });
};

const TeachingStatistics = mongoose.model('TeachingStatistics', teachingStatisticsSchema);

module.exports = TeachingStatistics; 