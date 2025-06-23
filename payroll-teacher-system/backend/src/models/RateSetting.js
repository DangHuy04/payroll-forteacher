const mongoose = require('mongoose');

const rateSettingSchema = new mongoose.Schema({
  // Basic Info - inspired by Payroll Engine's regulation structure
  code: {
    type: String,
    required: [true, 'Mã thiết lập lương là bắt buộc'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [20, 'Mã thiết lập lương không được quá 20 ký tự']
  },
  
  name: {
    type: String,
    required: [true, 'Tên thiết lập lương là bắt buộc'],
    trim: true,
    maxlength: [200, 'Tên thiết lập lương không được quá 200 ký tự']
  },
  
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

  // Validity Period
  validFrom: {
    type: Date,
    required: [true, 'Ngày bắt đầu hiệu lực là bắt buộc']
  },

  validTo: {
    type: Date,
    default: null
  },
  
  // Rate Type - inspired by Payroll Engine's case types
  rateType: {
    type: String,
    enum: {
      values: ['base_hourly', 'base_monthly', 'overtime', 'bonus', 'allowance', 'coefficient'],
      message: 'Loại lương không hợp lệ'
    },
    required: [true, 'Loại lương là bắt buộc']
  },
  
  // Applicable Scope - inspired by Payroll Engine's regulation scope
  applicableScope: {
    type: String,
    enum: {
      values: ['university', 'department', 'position', 'degree', 'subject_type', 'class_type'],
      message: 'Phạm vi áp dụng không hợp lệ'
    },
    default: 'university'
  },
  
  // Target Reference - for specific scope applications
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    refPath: 'targetModel'
  },
  
  targetModel: {
    type: String,
    enum: ['Department', 'Degree', 'Subject'],
    default: null
  },
  
  // Rate Values - inspired by Payroll Engine's calculation bases
  rateValues: {
    baseAmount: {
      type: Number,
      required: [true, 'Mức lương cơ bản là bắt buộc'],
      min: [0, 'Mức lương không được âm']
    },
    
    // Different rate tiers
    minimumRate: {
      type: Number,
      default: 0,
      min: [0, 'Mức tối thiểu không được âm']
    },
    
    maximumRate: {
      type: Number,
      default: null,
      min: [0, 'Mức tối đa không được âm']
    },
    
    // Coefficient multipliers
    coefficient: {
      type: Number,
      default: 1.0,
      min: [0.1, 'Hệ số không được nhỏ hơn 0.1'],
      max: [5.0, 'Hệ số không được lớn hơn 5.0']
    },
    
    // Step increases
    stepIncrement: {
      type: Number,
      default: 0,
      min: [0, 'Bước tăng không được âm']
    }
  },
  
  // Conditions for application - inspired by Payroll Engine's case conditions
  conditions: {
    // Experience requirements
    minimumExperience: {
      type: Number,
      default: 0,
      min: [0, 'Kinh nghiệm tối thiểu không được âm']
    },
    
    // Workload requirements
    minimumHours: {
      type: Number,
      default: 0,
      min: [0, 'Số giờ tối thiểu không được âm']
    },
    
    maximumHours: {
      type: Number,
      default: null,
      min: [0, 'Số giờ tối đa không được âm']
    },
    
    // Performance requirements
    minimumRating: {
      type: Number,
      default: 0,
      min: [0, 'Đánh giá tối thiểu không được âm'],
      max: [5, 'Đánh giá tối thiểu không được quá 5']
    },
    
    // Additional conditions
    additionalCriteria: [{
      criteriaType: {
        type: String,
        enum: ['position', 'degree', 'department', 'subject_type', 'class_size', 'teaching_method']
      },
      criteriaValue: String,
      operator: {
        type: String,
        enum: ['equals', 'greater_than', 'less_than', 'contains'],
        default: 'equals'
      }
    }]
  },
  
  // Effective Period - inspired by Payroll Engine's versioning
  effectivePeriod: {
    startDate: {
      type: Date,
      required: [true, 'Ngày hiệu lực là bắt buộc'],
      default: Date.now
    },
    
    endDate: {
      type: Date,
      default: null
    },
    
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      default: null
    },
    
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Semester',
      default: null
    }
  },
  
  // Priority and Ordering - for conflict resolution
  priority: {
    type: Number,
    default: 0,
    min: [0, 'Độ ưu tiên không được âm']
  },
  
  // Calculation Formula - inspired by Payroll Engine's scripts
  calculationFormula: {
    formulaType: {
      type: String,
      enum: ['fixed', 'percentage', 'tiered', 'custom'],
      default: 'fixed'
    },
    
    formulaExpression: {
      type: String,
      default: null,
      maxlength: [1000, 'Công thức không được quá 1000 ký tự']
    },
    
    variables: [{
      name: String,
      description: String,
      dataType: {
        type: String,
        enum: ['number', 'string', 'boolean', 'date'],
        default: 'number'
      }
    }]
  },
  
  // Approval and Workflow - inspired by Payroll Engine's approval processes  
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
  
  // Status Management
  status: {
    type: String,
    enum: {
      values: ['draft', 'pending_approval', 'approved', 'active', 'inactive', 'superseded'],
      message: 'Trạng thái không hợp lệ'
    },
    default: 'draft'
  },
  
  // Metadata - inspired by Payroll Engine's regulation metadata
  metadata: {
    version: {
      type: Number,
      default: 1
    },
    
    supersededBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RateSetting',
      default: null
    },
    
    supersedes: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RateSetting',
      default: null
    },
    
    category: {
      type: String,
      enum: ['salary', 'bonus', 'allowance', 'overtime', 'penalty'],
      default: 'salary'
    },
    
    tags: [{
      type: String,
      maxlength: [50, 'Tag không được quá 50 ký tự']
    }],
    
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    
    lastModified: {
      type: Date,
      default: Date.now
    }
  },
  
  // Additional Information
  description: {
    type: String,
    maxlength: [1000, 'Mô tả không được quá 1000 ký tự']
  },
  
  notes: {
    type: String,
    maxlength: [2000, 'Ghi chú không được quá 2000 ký tự']
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
rateSettingSchema.index({ code: 1 });
rateSettingSchema.index({ academicYearId: 1 });
rateSettingSchema.index({ semesterId: 1 });
rateSettingSchema.index({ validFrom: 1, validTo: 1 });
rateSettingSchema.index({ rateType: 1, applicableScope: 1 });
rateSettingSchema.index({ 'effectivePeriod.startDate': 1, 'effectivePeriod.endDate': 1 });
rateSettingSchema.index({ status: 1, isActive: 1 });
rateSettingSchema.index({ priority: -1 });
rateSettingSchema.index({ targetId: 1, targetModel: 1 });

// Compound index for rate lookups
rateSettingSchema.index({
  rateType: 1,
  applicableScope: 1,
  'effectivePeriod.startDate': 1,
  'effectivePeriod.endDate': 1,
  status: 1,
  priority: -1
});

// Virtual for effective status
rateSettingSchema.virtual('isCurrentlyEffective').get(function() {
  const now = new Date();
  const startDate = this.effectivePeriod.startDate;
  const endDate = this.effectivePeriod.endDate;
  
  return this.status === 'active' && 
         startDate <= now && 
         (!endDate || endDate >= now);
});

// Virtual for rate calculation
rateSettingSchema.virtual('effectiveRate').get(function() {
  return this.rateValues.baseAmount * this.rateValues.coefficient;
});

// Virtual for target reference
rateSettingSchema.virtual('target', {
  refPath: 'targetModel',
  localField: 'targetId',
  foreignField: '_id',
  justOne: true
});

// Virtuals
rateSettingSchema.virtual('academicYear', {
  ref: 'AcademicYear',
  localField: 'academicYearId',
  foreignField: '_id',
  justOne: true
});

rateSettingSchema.virtual('semester', {
  ref: 'Semester',
  localField: 'semesterId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware for validation and auto-updates
rateSettingSchema.pre('save', async function(next) {
  // Validate effective period
  if (this.effectivePeriod.endDate && 
      this.effectivePeriod.startDate >= this.effectivePeriod.endDate) {
    return next(new Error('Ngày kết thúc phải sau ngày bắt đầu'));
  }
  
  // Validate rate values
  if (this.rateValues.maximumRate && 
      this.rateValues.minimumRate > this.rateValues.maximumRate) {
    return next(new Error('Mức tối thiểu không được lớn hơn mức tối đa'));
  }

  // Validate dates
  if (this.isModified('validFrom') || this.isModified('validTo')) {
    if (this.validTo && this.validTo <= this.validFrom) {
      throw new Error('Ngày kết thúc hiệu lực phải sau ngày bắt đầu');
    }
  }

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
  
  // Auto-generate code if not provided
  if (!this.code) {
    const timestamp = Date.now().toString().slice(-6);
    this.code = `RATE${timestamp}`;
  }
  
  // Update metadata
  this.metadata.lastModified = new Date();
  if (this.isModified() && !this.isNew) {
    this.metadata.version += 1;
  }
  
  next();
});

// Methods
rateSettingSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

rateSettingSchema.methods.approve = function(approvedBy, notes) {
  this.approval.isApproved = true;
  this.approval.approvedBy = approvedBy;
  this.approval.approvedAt = new Date();
  this.approval.approvalNotes = notes || '';
  this.status = 'approved';
  return this.save();
};

rateSettingSchema.methods.activate = function() {
  if (this.status !== 'approved') {
    throw new Error('Chỉ có thể kích hoạt thiết lập lương đã được phê duyệt');
  }
  this.status = 'active';
  return this.save();
};

rateSettingSchema.methods.calculateRate = function(baseHours, additionalFactors = {}) {
  const { baseAmount, coefficient, stepIncrement } = this.rateValues;
  let calculatedRate = baseAmount * coefficient;
  
  // Apply step increments based on experience or other factors
  if (additionalFactors.experienceYears && stepIncrement > 0) {
    const steps = Math.floor(additionalFactors.experienceYears / 2); // Every 2 years
    calculatedRate += (steps * stepIncrement);
  }
  
  // Apply hours-based calculation
  if (this.rateType === 'base_hourly') {
    calculatedRate *= (baseHours || 1);
  }
  
  // Apply min/max constraints
  if (this.rateValues.minimumRate) {
    calculatedRate = Math.max(calculatedRate, this.rateValues.minimumRate);
  }
  if (this.rateValues.maximumRate) {
    calculatedRate = Math.min(calculatedRate, this.rateValues.maximumRate);
  }
  
  return Math.round(calculatedRate);
};

rateSettingSchema.methods.checkConditions = function(teacherData, assignmentData) {
  const conditions = this.conditions;
  
  // Check experience requirements
  if (conditions.minimumExperience > 0) {
    const experience = teacherData.yearsOfService || 0;
    if (experience < conditions.minimumExperience) {
      return false;
    }
  }
  
  // Check hour requirements
  if (conditions.minimumHours > 0) {
    const hours = assignmentData.teachingHours || 0;
    if (hours < conditions.minimumHours) {
      return false;
    }
  }
  
  if (conditions.maximumHours > 0) {
    const hours = assignmentData.teachingHours || 0;
    if (hours > conditions.maximumHours) {
      return false;
    }
  }
  
  return true;
};

// Static methods
rateSettingSchema.statics.getActive = function(academicYearId, semesterId) {
  return this.find({
    academicYearId,
    semesterId,
    status: 'active',
    isActive: true,
    validFrom: { $lte: new Date() },
    $or: [
      { validTo: null },
      { validTo: { $gt: new Date() } }
    ]
  }).sort({ validFrom: -1 });
};

rateSettingSchema.statics.getByType = function(rateType, academicYearId, semesterId) {
  return this.find({
    rateType,
    academicYearId,
    semesterId,
    status: 'active',
    isActive: true
  }).sort({ validFrom: -1 });
};

rateSettingSchema.statics.getByScope = function(scope, targetId, academicYearId, semesterId) {
  return this.find({
    applicableScope: scope,
    targetId,
    academicYearId,
    semesterId,
    status: 'active',
    isActive: true
  }).sort({ validFrom: -1 });
};

module.exports = mongoose.model('RateSetting', rateSettingSchema); 