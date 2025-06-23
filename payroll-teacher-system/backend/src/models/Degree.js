const mongoose = require('mongoose');

const degreeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Mã bằng cấp là bắt buộc'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [10, 'Mã bằng cấp không được quá 10 ký tự']
  },
  name: {
    type: String,
    required: [true, 'Tên bằng cấp là bắt buộc'],
    trim: true,
    maxlength: [100, 'Tên bằng cấp không được quá 100 ký tự']
  },
  coefficient: {
    type: Number,
    required: [true, 'Hệ số bằng cấp là bắt buộc'],
    min: [0.5, 'Hệ số phải lớn hơn 0.5'],
    max: [5.0, 'Hệ số không được quá 5.0'],
    default: 1.0
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
degreeSchema.index({ code: 1 });
degreeSchema.index({ isActive: 1, name: 1 });

// Virtual for teacher count
degreeSchema.virtual('teacherCount', {
  ref: 'Teacher',
  localField: '_id',
  foreignField: 'degreeId',
  count: true
});

// Methods
degreeSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

// Static methods
degreeSchema.statics.getActive = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

degreeSchema.statics.findByCode = function(code) {
  return this.findOne({ code: code.toUpperCase(), isActive: true });
};

// Pre-save middleware
degreeSchema.pre('save', function(next) {
  if (this.isModified('code')) {
    this.code = this.code.toUpperCase();
  }
  next();
});

// Pre-remove middleware
degreeSchema.pre('deleteOne', { document: true, query: false }, async function() {
  const Teacher = mongoose.model('Teacher');
  const teacherCount = await Teacher.countDocuments({ degreeId: this._id });
  
  if (teacherCount > 0) {
    throw new Error(`Không thể xóa bằng cấp này vì có ${teacherCount} giáo viên đang sử dụng`);
  }
});

const Degree = mongoose.model('Degree', degreeSchema);

module.exports = Degree; 