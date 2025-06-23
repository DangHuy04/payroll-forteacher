const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Mã khoa là bắt buộc'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [10, 'Mã khoa không được quá 10 ký tự']
  },
  name: {
    type: String,
    required: [true, 'Tên khoa là bắt buộc'],
    trim: true,
    maxlength: [200, 'Tên khoa không được quá 200 ký tự']
  },
  description: {
    type: String,
    maxlength: [1000, 'Mô tả không được quá 1000 ký tự']
  },
  headTeacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    default: null
  },
  establishedDate: {
    type: Date,
    default: Date.now
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Số điện thoại không được quá 20 ký tự']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [100, 'Email không được quá 100 ký tự'],
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
  },
  address: {
    type: String,
    maxlength: [500, 'Địa chỉ không được quá 500 ký tự']
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
departmentSchema.index({ code: 1 });
departmentSchema.index({ isActive: 1, name: 1 });
departmentSchema.index({ headTeacherId: 1 });

// Virtual for teacher count
departmentSchema.virtual('teacherCount', {
  ref: 'Teacher',
  localField: '_id',
  foreignField: 'departmentId',
  count: true
});

// Virtual for subject count
departmentSchema.virtual('subjectCount', {
  ref: 'Subject',
  localField: '_id',
  foreignField: 'departmentId',
  count: true
});

// Virtual for head teacher info
departmentSchema.virtual('headTeacher', {
  ref: 'Teacher',
  localField: 'headTeacherId',
  foreignField: '_id',
  justOne: true
});

// Methods
departmentSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

// Static methods
departmentSchema.statics.getActive = function() {
  return this.find({ isActive: true })
    .populate('headTeacher', 'fullName code')
    .sort({ name: 1 });
};

departmentSchema.statics.findByCode = function(code) {
  return this.findOne({ code: code.toUpperCase(), isActive: true })
    .populate('headTeacher', 'fullName code email');
};

departmentSchema.statics.getWithStats = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: 'teachers',
        localField: '_id',
        foreignField: 'departmentId',
        as: 'teachers'
      }
    },
    {
      $lookup: {
        from: 'subjects',
        localField: '_id',
        foreignField: 'departmentId',
        as: 'subjects'
      }
    },
    {
      $addFields: {
        teacherCount: { $size: '$teachers' },
        subjectCount: { $size: '$subjects' },
        activeTeacherCount: {
          $size: {
            $filter: {
              input: '$teachers',
              cond: { $eq: ['$$this.isActive', true] }
            }
          }
        }
      }
    },
    {
      $project: {
        teachers: 0,
        subjects: 0
      }
    },
    { $sort: { name: 1 } }
  ]);
};

// Pre-save middleware
departmentSchema.pre('save', function(next) {
  if (this.isModified('code')) {
    this.code = this.code.toUpperCase();
  }
  if (this.isModified('email') && this.email) {
    this.email = this.email.toLowerCase();
  }
  next();
});

// Pre-remove middleware
departmentSchema.pre('deleteOne', { document: true, query: false }, async function() {
  const Teacher = mongoose.model('Teacher');
  const Subject = mongoose.model('Subject');
  
  const teacherCount = await Teacher.countDocuments({ departmentId: this._id });
  const subjectCount = await Subject.countDocuments({ departmentId: this._id });
  
  if (teacherCount > 0 || subjectCount > 0) {
    throw new Error(`Không thể xóa khoa này vì có ${teacherCount} giáo viên và ${subjectCount} học phần đang sử dụng`);
  }
});

const Department = mongoose.model('Department', departmentSchema);

module.exports = Department; 