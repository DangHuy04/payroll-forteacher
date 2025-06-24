const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Mã học phần là bắt buộc'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [15, 'Mã học phần không được quá 15 ký tự'],
    match: [/^[A-Z0-9]+$/, 'Mã học phần chỉ được chứa chữ cái hoa và số']
  },
  name: {
    type: String,
    required: [true, 'Tên học phần là bắt buộc'],
    trim: true,
    maxlength: [200, 'Tên học phần không được quá 200 ký tự']
  },
  credits: {
    type: Number,
    required: [true, 'Số tín chỉ là bắt buộc'],
    min: [1, 'Số tín chỉ phải lớn hơn 0'],
    max: [10, 'Số tín chỉ không được quá 10'],
    validate: {
      validator: function(value) {
        return Number.isInteger(value) || value % 0.5 === 0;
      },
      message: 'Số tín chỉ phải là số nguyên hoặc số thập phân với bước 0.5'
    }
  },
  coefficient: {
    type: Number,
    required: [true, 'Hệ số học phần là bắt buộc'],
    min: [0.5, 'Hệ số học phần phải từ 0.5'],
    max: [3.0, 'Hệ số học phần không được quá 3.0'],
    default: 1.0
  },
  soTietLyThuyet: {
    type: Number,
    required: [true, 'Số tiết lý thuyết là bắt buộc'],
    min: [0, 'Số tiết lý thuyết phải >= 0'],
    max: [150, 'Số tiết lý thuyết không được quá 150'],
    validate: {
      validator: function(value) {
        return Number.isInteger(value);
      },
      message: 'Số tiết lý thuyết phải là số nguyên'
    }
  },
  soTietThucHanh: {
    type: Number,
    required: [true, 'Số tiết thực hành là bắt buộc'],
    min: [0, 'Số tiết thực hành phải >= 0'],
    max: [150, 'Số tiết thực hành không được quá 150'],
    validate: {
      validator: function(value) {
        return Number.isInteger(value);
      },
      message: 'Số tiết thực hành phải là số nguyên'
    }
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Khoa quản lý là bắt buộc']
  },
  description: {
    type: String,
    maxlength: [1000, 'Mô tả không được quá 1000 ký tự']
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  subjectType: {
    type: String,
    enum: {
      values: ['general', 'major', 'specialization', 'elective', 'internship'],
      message: 'Loại học phần không hợp lệ'
    },
    default: 'major'
  },
  level: {
    type: String,
    enum: {
      values: ['undergraduate', 'graduate', 'postgraduate'],
      message: 'Cấp độ học phần không hợp lệ'
    },
    default: 'undergraduate'
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
    averageClassSize: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for performance
subjectSchema.index({ code: 1 });
subjectSchema.index({ departmentId: 1 });
subjectSchema.index({ credits: 1, coefficient: 1 });

// Virtual for department info
subjectSchema.virtual('department', {
  ref: 'Department',
  localField: 'departmentId',
  foreignField: '_id',
  justOne: true
});

// Virtual for class count
subjectSchema.virtual('classCount', {
  ref: 'Class',
  localField: '_id',
  foreignField: 'subjectId',
  count: true
});

// Virtual for prerequisite subjects
subjectSchema.virtual('prerequisiteSubjects', {
  ref: 'Subject',
  localField: 'prerequisites',
  foreignField: '_id'
});

// Virtual for total periods (ly thuyet + thuc hanh)
subjectSchema.virtual('totalPeriods').get(function() {
  return this.soTietLyThuyet + this.soTietThucHanh;
});

// Virtual for total teaching hours
subjectSchema.virtual('totalTeachingHours').get(function() {
  return this.totalPeriods * this.coefficient;
});

// Virtual for salary coefficient (based on credits and coefficient)
subjectSchema.virtual('salaryCoefficient').get(function() {
  return this.credits * this.coefficient;
});

// Virtual for display name
subjectSchema.virtual('displayName').get(function() {
  return `${this.code} - ${this.name}`;
});

// Methods
subjectSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

subjectSchema.methods.canDelete = function() {
  return this.metadata.totalClasses === 0;
};

subjectSchema.methods.isPrerequisiteFor = async function() {
  return await this.constructor.find({ prerequisites: this._id });
};

// Static methods
subjectSchema.statics.getByDepartment = function(departmentId) {
  return this.find({ departmentId })
    .populate('department', 'code name')
    .sort({ code: 1 });
};

subjectSchema.statics.getByCode = function(code) {
  return this.findOne({ code: code.toUpperCase() })
    .populate('department', 'code name')
    .populate('prerequisiteSubjects', 'code name credits');
};

subjectSchema.statics.getWithStats = function() {
  return this.aggregate([
    {
      $lookup: {
        from: 'departments',
        localField: 'departmentId',
        foreignField: '_id',
        as: 'department'
      }
    },
    {
      $lookup: {
        from: 'classes',
        localField: '_id',
        foreignField: 'subjectId',
        as: 'classes'
      }
    },
    {
      $addFields: {
        department: { $arrayElemAt: ['$department', 0] },
        totalClasses: { $size: '$classes' },
        totalStudents: { $sum: '$classes.studentCount' },
        averageClassSize: {
          $cond: [
            { $gt: [{ $size: '$classes' }, 0] },
            { $divide: [{ $sum: '$classes.studentCount' }, { $size: '$classes' }] },
            0
          ]
        },
        totalTeachingHours: { $multiply: [{ $add: ['$soTietLyThuyet', '$soTietThucHanh'] }, '$coefficient'] },
        salaryCoefficient: { $multiply: ['$credits', '$coefficient'] }
      }
    },
    {
      $project: {
        classes: 0
      }
    },
    { $sort: { code: 1 } }
  ]);
};

// Pre-save middleware
subjectSchema.pre('save', function(next) {
  if (this.isModified('code')) {
    this.code = this.code.toUpperCase();
  }
  next();
});

// Pre-save validation
subjectSchema.pre('save', async function(next) {
  // Validate department exists
  if (this.isModified('departmentId')) {
    const Department = mongoose.model('Department');
    const department = await Department.findById(this.departmentId);
    if (!department) {
      throw new Error('Khoa không tồn tại');
    }
  }

  // Validate prerequisites (no circular dependencies)
  if (this.isModified('prerequisites') && this.prerequisites.length > 0) {
    const hasCircular = await this.constructor.findOne({
      _id: { $in: this.prerequisites },
      prerequisites: this._id
    });
    
    if (hasCircular) {
      throw new Error('Không thể tạo phụ thuộc vòng tròn giữa các học phần');
    }
  }

  // Calculate periods based on credits if not provided
  if (this.isModified('credits') && !this.isModified('soTietLyThuyet') && !this.isModified('soTietThucHanh')) {
    this.soTietLyThuyet = Math.round(this.credits * 15); // Mặc định 15 tiết/tín chỉ
    this.soTietThucHanh = Math.round(this.credits * 15); // Mặc định 15 tiết/tín chỉ
  }

  // Validate total periods
  if (this.soTietLyThuyet + this.soTietThucHanh < 1) {
    return next(new Error('Tổng số tiết phải >= 1'));
  }

  next();
});

// Pre-remove middleware
subjectSchema.pre('deleteOne', { document: true, query: false }, async function() {
  const Class = mongoose.model('Class');
  const classCount = await Class.countDocuments({ subjectId: this._id });
  
  if (classCount > 0) {
    throw new Error(`Không thể xóa học phần này vì có ${classCount} lớp học phần đang sử dụng`);
  }

  // Check if this subject is a prerequisite for other subjects
  const dependentSubjects = await this.constructor.find({ prerequisites: this._id });
  if (dependentSubjects.length > 0) {
    const subjectNames = dependentSubjects.map(s => s.code).join(', ');
    throw new Error(`Không thể xóa học phần này vì là tiên quyết của: ${subjectNames}`);
  }
});

// Post-save middleware to update metadata
subjectSchema.post('save', async function() {
  // Update class count and student statistics
  const Class = mongoose.model('Class');
  const classes = await Class.find({ subjectId: this._id });
  
  const totalClasses = classes.length;
  const totalStudents = classes.reduce((sum, cls) => sum + (cls.studentCount || 0), 0);
  const averageClassSize = totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0;
  
  await this.constructor.findByIdAndUpdate(this._id, {
    'metadata.totalClasses': totalClasses,
    'metadata.totalStudents': totalStudents,
    'metadata.averageClassSize': averageClassSize
  });
});

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject; 