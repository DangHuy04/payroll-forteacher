const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Mã giáo viên là bắt buộc'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [20, 'Mã giáo viên không được quá 20 ký tự']
  },
  fullName: {
    type: String,
    required: [true, 'Họ tên là bắt buộc'],
    trim: true,
    maxlength: [100, 'Họ tên không được quá 100 ký tự']
  },
  email: {
    type: String,
    required: [true, 'Email là bắt buộc'],
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: [100, 'Email không được quá 100 ký tự'],
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Số điện thoại không được quá 20 ký tự'],
    match: [/^[0-9+\-\s()]+$/, 'Số điện thoại không hợp lệ']
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Khoa là bắt buộc']
  },
  degreeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Degree',
    required: [true, 'Bằng cấp là bắt buộc']
  },
  hireDate: {
    type: Date,
    required: [true, 'Ngày vào làm là bắt buộc'],
    default: Date.now
  },
  position: {
    type: String,
    enum: {
      values: ['Giảng viên', 'Trưởng khoa', 'Phó khoa', 'Trưởng bộ môn', 'Phó trưởng bộ môn'],
      message: 'Chức vụ không hợp lệ'
    },
    default: 'Giảng viên'
  },
  birthDate: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value < new Date();
      },
      message: 'Ngày sinh không được trong tương lai'
    }
  },
  gender: {
    type: String,
    enum: {
      values: ['Nam', 'Nữ', 'Khác'],
      message: 'Giới tính không hợp lệ'
    }
  },
  address: {
    type: String,
    maxlength: [500, 'Địa chỉ không được quá 500 ký tự']
  },
  identityNumber: {
    type: String,
    trim: true,
    maxlength: [20, 'Số CMND/CCCD không được quá 20 ký tự']
  },

  avatar: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    maxlength: [1000, 'Ghi chú không được quá 1000 ký tự']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for performance
teacherSchema.index({ code: 1 });
teacherSchema.index({ email: 1 });
teacherSchema.index({ departmentId: 1 });
teacherSchema.index({ degreeId: 1 });
teacherSchema.index({ isActive: 1, fullName: 1 });

// Virtual for department info
teacherSchema.virtual('department', {
  ref: 'Department',
  localField: 'departmentId',
  foreignField: '_id',
  justOne: true
});

// Virtual for degree info
teacherSchema.virtual('degree', {
  ref: 'Degree',
  localField: 'degreeId',
  foreignField: '_id',
  justOne: true
});

// Virtual for age
teacherSchema.virtual('age').get(function() {
  if (!this.birthDate) return null;
  const today = new Date();
  const birthDate = new Date(this.birthDate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Virtual for years of service
teacherSchema.virtual('yearsOfService').get(function() {
  if (!this.hireDate) return 0;
  const today = new Date();
  const hireDate = new Date(this.hireDate);
  return Math.floor((today - hireDate) / (365.25 * 24 * 60 * 60 * 1000));
});

// Virtual for full info display
teacherSchema.virtual('displayName').get(function() {
  return `${this.code} - ${this.fullName}`;
});

// Methods
teacherSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

teacherSchema.methods.getBasicInfo = function() {
  return {
    _id: this._id,
    code: this.code,
    fullName: this.fullName,
    email: this.email,
    phone: this.phone,
    position: this.position,
    isActive: this.isActive
  };
};

// Static methods
teacherSchema.statics.getActive = function() {
  return this.find({ isActive: true })
    .populate('department', 'name code')
    .populate('degree', 'name code coefficient')
    .sort({ fullName: 1 });
};

teacherSchema.statics.findByCode = function(code) {
  return this.findOne({ code: code.toUpperCase(), isActive: true })
    .populate('department', 'name code')
    .populate('degree', 'name code coefficient');
};

teacherSchema.statics.findByDepartment = function(departmentId) {
  return this.find({ departmentId, isActive: true })
    .populate('degree', 'name code coefficient')
    .sort({ fullName: 1 });
};

teacherSchema.statics.getWithStats = function() {
  return this.aggregate([
    { $match: { isActive: true } },
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
        from: 'degrees',
        localField: 'degreeId',
        foreignField: '_id',
        as: 'degree'
      }
    },
    {
      $unwind: '$department'
    },
    {
      $unwind: '$degree'
    },
    {
      $addFields: {
        age: {
          $cond: {
            if: { $ne: ['$birthDate', null] },
            then: {
              $floor: {
                $divide: [
                  { $subtract: [new Date(), '$birthDate'] },
                  1000 * 60 * 60 * 24 * 365.25
                ]
              }
            },
            else: null
          }
        },
        yearsOfService: {
          $floor: {
            $divide: [
              { $subtract: [new Date(), '$hireDate'] },
              1000 * 60 * 60 * 24 * 365.25
            ]
          }
        }
      }
    },
    { $sort: { fullName: 1 } }
  ]);
};

// Pre-save middleware
teacherSchema.pre('save', function(next) {
  if (this.isModified('code')) {
    this.code = this.code.toUpperCase();
  }
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  next();
});

// Pre-remove middleware
teacherSchema.pre('deleteOne', { document: true, query: false }, async function() {
  const Class = mongoose.model('Class');
  const TeachingAssignment = mongoose.model('TeachingAssignment');
  
  const classCount = await Class.countDocuments({ teacherId: this._id });
  const assignmentCount = await TeachingAssignment.countDocuments({ teacherId: this._id });
  
  if (classCount > 0 || assignmentCount > 0) {
    throw new Error(`Không thể xóa giáo viên này vì có ${classCount} lớp và ${assignmentCount} phân công giảng dạy`);
  }
});

const Teacher = mongoose.model('Teacher', teacherSchema);

module.exports = Teacher; 