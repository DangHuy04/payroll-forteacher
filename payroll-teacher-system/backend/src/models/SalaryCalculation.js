const mongoose = require('mongoose');

const salaryCalculationSchema = new mongoose.Schema({
  // Basic Identification - inspired by Payroll Engine's calculation structure
  calculationId: {
    type: String,
    required: [true, 'Mã tính lương là bắt buộc'],
    unique: true,
    uppercase: true,
    trim: true
  },
  
  // Calculation Period
  calculationPeriod: {
    periodType: {
      type: String,
      enum: {
        values: ['monthly', 'semester', 'academic_year', 'custom'],
        message: 'Loại kỳ tính lương không hợp lệ'
      },
      required: [true, 'Loại kỳ tính lương là bắt buộc']
    },
    
    startDate: {
      type: Date,
      required: [true, 'Ngày bắt đầu kỳ tính lương là bắt buộc']
    },
    
    endDate: {
      type: Date,
      required: [true, 'Ngày kết thúc kỳ tính lương là bắt buộc']
    },
    
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
      required: [true, 'Năm học là bắt buộc']
    },
    
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Semester',
      required: [true, 'Học kỳ là bắt buộc']
    },
    
    month: {
      type: Number,
      min: [1, 'Tháng phải từ 1-12'],
      max: [12, 'Tháng phải từ 1-12'],
      default: null
    },
    
    year: {
      type: Number,
      min: [2020, 'Năm không hợp lệ'],
      required: [true, 'Năm là bắt buộc']
    }
  },
  
  // Teacher Information
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: [true, 'Giảng viên là bắt buộc']
  },
  
  // Teaching Assignments - inspired by Payroll Engine's assignment-based calculations
  teachingAssignments: [{
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeachingAssignment',
      required: true
    },
    
    // Assignment details for calculation
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true
    },
    
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    
    assignmentType: {
      type: String,
      enum: ['primary', 'support', 'substitute', 'additional'],
      required: true
    },
    
    // Hours and workload
    totalHours: {
      type: Number,
      required: [true, 'Tổng số giờ là bắt buộc'],
      min: [0, 'Số giờ không được âm']
    },
    
    baseHours: {
      type: Number,
      default: 0,
      min: [0, 'Số giờ cơ bản không được âm']
    },
    
    overtimeHours: {
      type: Number,
      default: 0,
      min: [0, 'Số giờ làm thêm không được âm']
    },
    
    // Rate information applied
    appliedRates: [{
      rateSettingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RateSetting',
        required: true
      },
      
      rateType: {
        type: String,
        enum: ['base_hourly', 'base_monthly', 'overtime', 'bonus', 'allowance', 'coefficient'],
        required: true
      },
      
      rateAmount: {
        type: Number,
        required: [true, 'Mức lương áp dụng là bắt buộc'],
        min: [0, 'Mức lương không được âm']
      },
      
      coefficient: {
        type: Number,
        default: 1.0,
        min: [0.1, 'Hệ số không được nhỏ hơn 0.1']
      },
      
      hoursApplied: {
        type: Number,
        default: 0,
        min: [0, 'Số giờ áp dụng không được âm']
      },
      
      calculatedAmount: {
        type: Number,
        required: [true, 'Số tiền tính được là bắt buộc'],
        min: [0, 'Số tiền không được âm']
      }
    }],
    
    // Assignment-level totals
    assignmentTotal: {
      baseAmount: {
        type: Number,
        default: 0,
        min: [0, 'Lương cơ bản không được âm']
      },
      
      overtimeAmount: {
        type: Number,
        default: 0,
        min: [0, 'Lương làm thêm không được âm']
      },
      
      bonusAmount: {
        type: Number,
        default: 0,
        min: [0, 'Tiền thưởng không được âm']
      },
      
      allowanceAmount: {
        type: Number,
        default: 0,
        min: [0, 'Phụ cấp không được âm']
      },
      
      totalAmount: {
        type: Number,
        default: 0,
        min: [0, 'Tổng tiền không được âm']
      }
    }
  }],
  
  // Overall Calculation Results - inspired by Payroll Engine's summary calculations
  calculationResults: {
    // Base salary components
    baseSalary: {
      totalBaseHours: {
        type: Number,
        default: 0,
        min: [0, 'Tổng giờ cơ bản không được âm']
      },
      
      averageHourlyRate: {
        type: Number,
        default: 0,
        min: [0, 'Mức lương trung bình không được âm']
      },
      
      totalBaseAmount: {
        type: Number,
        default: 0,
        min: [0, 'Tổng lương cơ bản không được âm']
      }
    },
    
    // Overtime calculations
    overtime: {
      totalOvertimeHours: {
        type: Number,
        default: 0,
        min: [0, 'Tổng giờ làm thêm không được âm']
      },
      
      overtimeRate: {
        type: Number,
        default: 0,
        min: [0, 'Mức lương làm thêm không được âm']
      },
      
      totalOvertimeAmount: {
        type: Number,
        default: 0,
        min: [0, 'Tổng tiền làm thêm không được âm']
      }
    },
    
    // Additional components
    additionalPayments: {
      totalBonusAmount: {
        type: Number,
        default: 0,
        min: [0, 'Tổng tiền thưởng không được âm']
      },
      
      totalAllowanceAmount: {
        type: Number,
        default: 0,
        min: [0, 'Tổng phụ cấp không được âm']
      },
      
      totalDeductionAmount: {
        type: Number,
        default: 0,
        min: [0, 'Tổng khấu trừ không được âm']
      }
    },
    
    // Final totals
    totalGrossSalary: {
      type: Number,
      default: 0,
      min: [0, 'Tổng lương gộp không được âm']
    },
    
    totalNetSalary: {
      type: Number,
      default: 0,
      min: [0, 'Tổng lương thực nhận không được âm']
    }
  },
  
  // Degree and Position Coefficients - inspired by Payroll Engine's coefficient system
  coefficients: {
    degreeCoefficient: {
      degreeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Degree',
        required: true
      },
      
      coefficientValue: {
        type: Number,
        required: [true, 'Hệ số bằng cấp là bắt buộc'],
        min: [0.1, 'Hệ số bằng cấp không được nhỏ hơn 0.1']
      },
      
      appliedAmount: {
        type: Number,
        default: 0,
        min: [0, 'Số tiền áp dụng hệ số không được âm']
      }
    },
    
    positionCoefficient: {
      position: {
        type: String,
        enum: ['Trưởng bộ môn', 'Phó trưởng bộ môn', 'Giảng viên chính', 'Giảng viên', 'Trợ giảng'],
        required: true
      },
      
      coefficientValue: {
        type: Number,
        default: 1.0,
        min: [0.1, 'Hệ số chức vụ không được nhỏ hơn 0.1']
      },
      
      appliedAmount: {
        type: Number,
        default: 0,
        min: [0, 'Số tiền áp dụng hệ số không được âm']
      }
    },
    
    experienceCoefficient: {
      yearsOfService: {
        type: Number,
        default: 0,
        min: [0, 'Số năm kinh nghiệm không được âm']
      },
      
      coefficientValue: {
        type: Number,
        default: 1.0,
        min: [0.1, 'Hệ số kinh nghiệm không được nhỏ hơn 0.1']
      },
      
      appliedAmount: {
        type: Number,
        default: 0,
        min: [0, 'Số tiền áp dụng hệ số không được âm']
      }
    }
  },
  
  // Calculation Status and Workflow - inspired by Payroll Engine's workflow
  calculationStatus: {
    status: {
      type: String,
      enum: {
        values: ['draft', 'calculating', 'calculated', 'reviewing', 'approved', 'paid', 'archived'],
        message: 'Trạng thái tính lương không hợp lệ'
      },
      default: 'draft'
    },
    
    calculatedAt: {
      type: Date,
      default: null
    },
    
    calculatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    
    approvedAt: {
      type: Date,
      default: null
    },
    
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    
    paidAt: {
      type: Date,
      default: null
    },
    
    notes: {
      type: String,
      maxlength: [1000, 'Ghi chú không được quá 1000 ký tự']
    }
  },
  
  // Calculation Metadata - inspired by Payroll Engine's audit features
  calculationMetadata: {
    version: {
      type: Number,
      default: 1
    },
    
    recalculationCount: {
      type: Number,
      default: 0
    },
    
    lastRecalculatedAt: {
      type: Date,
      default: null
    },
    
    calculationMethod: {
      type: String,
      enum: ['automatic', 'manual', 'batch'],
      default: 'automatic'
    },
    
    dataSource: {
      type: String,
      enum: ['teaching_assignments', 'manual_entry', 'imported'],
      default: 'teaching_assignments'
    },
    
    validationErrors: [{
      field: String,
      message: String,
      value: mongoose.Schema.Types.Mixed
    }],
    
    warnings: [{
      type: String,
      message: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      }
    }]
  },
  
  // Audit Trail
  auditTrail: [{
    action: {
      type: String,
      enum: ['created', 'calculated', 'recalculated', 'approved', 'modified', 'paid'],
      required: true
    },
    
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    performedAt: {
      type: Date,
      default: Date.now
    },
    
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    
    notes: {
      type: String,
      maxlength: [500, 'Ghi chú audit không được quá 500 ký tự']
    }
  }],
  
  // Additional Information
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance and uniqueness
salaryCalculationSchema.index({ calculationId: 1 });
salaryCalculationSchema.index({ teacherId: 1, 'calculationPeriod.academicYearId': 1, 'calculationPeriod.semesterId': 1 });
salaryCalculationSchema.index({ 'calculationPeriod.startDate': 1, 'calculationPeriod.endDate': 1 });
salaryCalculationSchema.index({ 'calculationStatus.status': 1 });
salaryCalculationSchema.index({ 'calculationPeriod.year': 1, 'calculationPeriod.month': 1 });
salaryCalculationSchema.index({ isActive: 1 });

// Compound index for period-based queries
salaryCalculationSchema.index({
  teacherId: 1,
  'calculationPeriod.periodType': 1,
  'calculationPeriod.startDate': 1,
  'calculationStatus.status': 1
});

// Virtual fields
salaryCalculationSchema.virtual('teacher', {
  ref: 'Teacher',
  localField: 'teacherId',
  foreignField: '_id',
  justOne: true
});

salaryCalculationSchema.virtual('academicYear', {
  ref: 'AcademicYear',
  localField: 'calculationPeriod.academicYearId',
  foreignField: '_id',
  justOne: true
});

salaryCalculationSchema.virtual('semester', {
  ref: 'Semester',
  localField: 'calculationPeriod.semesterId',
  foreignField: '_id',
  justOne: true
});

// Virtual for calculation summary
salaryCalculationSchema.virtual('calculationSummary').get(function() {
  return {
    totalAssignments: this.teachingAssignments.length,
    totalHours: this.teachingAssignments.reduce((sum, assignment) => sum + assignment.totalHours, 0),
    grossSalary: this.calculationResults.totalGrossSalary,
    netSalary: this.calculationResults.totalNetSalary,
    status: this.calculationStatus.status
  };
});

// Pre-save middleware
salaryCalculationSchema.pre('save', function(next) {
  // Auto-generate calculationId if not provided
  if (!this.calculationId) {
    const year = this.calculationPeriod.year;
    const month = this.calculationPeriod.month || 'XX';
    const timestamp = Date.now().toString().slice(-4);
    this.calculationId = `SAL${year}${month}${timestamp}`;
  }
  
  // Validate calculation period
  if (this.calculationPeriod.startDate >= this.calculationPeriod.endDate) {
    return next(new Error('Ngày kết thúc phải sau ngày bắt đầu'));
  }
  
  // Update calculation metadata
  if (this.isModified('calculationResults')) {
    this.calculationMetadata.version += 1;
    this.calculationMetadata.lastRecalculatedAt = new Date();
    this.calculationMetadata.recalculationCount += 1;
  }
  
  next();
});

// Methods
salaryCalculationSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

// Calculate salary based on teaching assignments and rate settings
salaryCalculationSchema.methods.calculateSalary = async function() {
  try {
    // Reset calculation results
    this.calculationResults = {
      baseSalary: { totalBaseHours: 0, averageHourlyRate: 0, totalBaseAmount: 0 },
      overtime: { totalOvertimeHours: 0, overtimeRate: 0, totalOvertimeAmount: 0 },
      additionalPayments: { totalBonusAmount: 0, totalAllowanceAmount: 0, totalDeductionAmount: 0 },
      totalGrossSalary: 0,
      totalNetSalary: 0
    };
    
    // Populate teacher and related data
    await this.populate([
      { path: 'teacherId', populate: { path: 'degreeId departmentId' } },
      { path: 'teachingAssignments.assignmentId' },
      { path: 'teachingAssignments.classId' },
      { path: 'teachingAssignments.subjectId' }
    ]);
    
    const teacher = this.teacherId;
    const RateSetting = mongoose.model('RateSetting');
    
    // Process each teaching assignment
    for (let assignmentIndex = 0; assignmentIndex < this.teachingAssignments.length; assignmentIndex++) {
      const assignment = this.teachingAssignments[assignmentIndex];
      
      // Find applicable rate settings
      const teacherData = {
        _id: teacher._id,
        degree: teacher.degreeId,
        department: teacher.departmentId,
        position: teacher.position,
        yearsOfService: teacher.yearsOfService || 0
      };
      
      const assignmentData = {
        teachingHours: assignment.totalHours,
        assignmentType: assignment.assignmentType,
        class: assignment.classId,
        subject: assignment.subjectId
      };
      
      // Get applicable rates
      const applicableRates = await RateSetting.findApplicableRates(teacherData, assignmentData);
      
      // Reset assignment applied rates
      assignment.appliedRates = [];
      assignment.assignmentTotal = {
        baseAmount: 0,
        overtimeAmount: 0,
        bonusAmount: 0,
        allowanceAmount: 0,
        totalAmount: 0
      };
      
      // Apply rates to assignment
      for (const rateSetting of applicableRates) {
        const calculatedAmount = rateSetting.calculateRate(
          assignment.totalHours,
          { 
            experienceYears: teacher.yearsOfService,
            hours: assignment.totalHours
          }
        );
        
        const appliedRate = {
          rateSettingId: rateSetting._id,
          rateType: rateSetting.rateType,
          rateAmount: rateSetting.rateValues.baseAmount,
          coefficient: rateSetting.rateValues.coefficient,
          hoursApplied: assignment.totalHours,
          calculatedAmount
        };
        
        assignment.appliedRates.push(appliedRate);
        
        // Add to assignment totals based on rate type
        switch (rateSetting.rateType) {
          case 'base_hourly':
          case 'base_monthly':
            assignment.assignmentTotal.baseAmount += calculatedAmount;
            break;
          case 'overtime':
            assignment.assignmentTotal.overtimeAmount += calculatedAmount;
            break;
          case 'bonus':
            assignment.assignmentTotal.bonusAmount += calculatedAmount;
            break;
          case 'allowance':
            assignment.assignmentTotal.allowanceAmount += calculatedAmount;
            break;
        }
      }
      
      // Calculate assignment total
      assignment.assignmentTotal.totalAmount = 
        assignment.assignmentTotal.baseAmount +
        assignment.assignmentTotal.overtimeAmount +
        assignment.assignmentTotal.bonusAmount +
        assignment.assignmentTotal.allowanceAmount;
    }
    
    // Aggregate results
    this.teachingAssignments.forEach(assignment => {
      this.calculationResults.baseSalary.totalBaseHours += assignment.baseHours;
      this.calculationResults.baseSalary.totalBaseAmount += assignment.assignmentTotal.baseAmount;
      
      this.calculationResults.overtime.totalOvertimeHours += assignment.overtimeHours;
      this.calculationResults.overtime.totalOvertimeAmount += assignment.assignmentTotal.overtimeAmount;
      
      this.calculationResults.additionalPayments.totalBonusAmount += assignment.assignmentTotal.bonusAmount;
      this.calculationResults.additionalPayments.totalAllowanceAmount += assignment.assignmentTotal.allowanceAmount;
    });
    
    // Calculate coefficients
    await this.calculateCoefficients();
    
    // Calculate final totals
    this.calculationResults.totalGrossSalary = 
      this.calculationResults.baseSalary.totalBaseAmount +
      this.calculationResults.overtime.totalOvertimeAmount +
      this.calculationResults.additionalPayments.totalBonusAmount +
      this.calculationResults.additionalPayments.totalAllowanceAmount +
      this.coefficients.degreeCoefficient.appliedAmount +
      this.coefficients.positionCoefficient.appliedAmount +
      this.coefficients.experienceCoefficient.appliedAmount;
    
    this.calculationResults.totalNetSalary = 
      this.calculationResults.totalGrossSalary - 
      this.calculationResults.additionalPayments.totalDeductionAmount;
    
    // Update status and metadata
    this.calculationStatus.status = 'calculated';
    this.calculationStatus.calculatedAt = new Date();
    
    // Add audit trail
    this.auditTrail.push({
      action: 'calculated',
      performedBy: this.calculationStatus.calculatedBy,
      performedAt: new Date(),
      notes: 'Tính lương tự động từ phân công giảng dạy'
    });
    
    return await this.save();
  } catch (error) {
    this.calculationStatus.status = 'draft';
    this.calculationMetadata.validationErrors.push({
      field: 'calculation',
      message: error.message,
      value: null
    });
    throw error;
  }
};

// Calculate degree, position, and experience coefficients
salaryCalculationSchema.methods.calculateCoefficients = async function() {
  const teacher = this.teacherId;
  
  // Degree coefficient
  if (teacher.degreeId) {
    this.coefficients.degreeCoefficient = {
      degreeId: teacher.degreeId._id,
      coefficientValue: teacher.degreeId.coefficient || 1.0,
      appliedAmount: this.calculationResults.baseSalary.totalBaseAmount * (teacher.degreeId.coefficient || 1.0) - this.calculationResults.baseSalary.totalBaseAmount
    };
  }
  
  // Position coefficient (simplified)
  const positionCoefficients = {
    'Trưởng bộ môn': 1.5,
    'Phó trưởng bộ môn': 1.3,
    'Giảng viên chính': 1.2,
    'Giảng viên': 1.0,
    'Trợ giảng': 0.8
  };
  
  const positionCoeff = positionCoefficients[teacher.position] || 1.0;
  this.coefficients.positionCoefficient = {
    position: teacher.position,
    coefficientValue: positionCoeff,
    appliedAmount: this.calculationResults.baseSalary.totalBaseAmount * positionCoeff - this.calculationResults.baseSalary.totalBaseAmount
  };
  
  // Experience coefficient
  const yearsOfService = teacher.yearsOfService || 0;
  const experienceCoeff = 1.0 + (Math.floor(yearsOfService / 5) * 0.05); // 5% per 5 years
  this.coefficients.experienceCoefficient = {
    yearsOfService,
    coefficientValue: experienceCoeff,
    appliedAmount: this.calculationResults.baseSalary.totalBaseAmount * experienceCoeff - this.calculationResults.baseSalary.totalBaseAmount
  };
};

// Approve calculation
salaryCalculationSchema.methods.approve = function(approvedBy, notes) {
  this.calculationStatus.status = 'approved';
  this.calculationStatus.approvedBy = approvedBy;
  this.calculationStatus.approvedAt = new Date();
  this.calculationStatus.notes = notes || '';
  
  this.auditTrail.push({
    action: 'approved',
    performedBy: approvedBy,
    performedAt: new Date(),
    notes: notes || 'Phê duyệt tính lương'
  });
  
  return this.save();
};

// Mark as paid
salaryCalculationSchema.methods.markAsPaid = function(paidBy, notes) {
  this.calculationStatus.status = 'paid';
  this.calculationStatus.paidAt = new Date();
  
  this.auditTrail.push({
    action: 'paid',
    performedBy: paidBy,
    performedAt: new Date(),
    notes: notes || 'Đã thanh toán lương'
  });
  
  return this.save();
};

// Static methods
salaryCalculationSchema.statics.getByPeriod = function(periodType, startDate, endDate) {
  return this.find({
    'calculationPeriod.periodType': periodType,
    'calculationPeriod.startDate': { $gte: startDate },
    'calculationPeriod.endDate': { $lte: endDate },
    isActive: true
  }).populate('teacherId', 'fullName code departmentId');
};

salaryCalculationSchema.statics.getByTeacher = function(teacherId, academicYearId, semesterId) {
  const filter = {
    teacherId,
    isActive: true
  };
  
  if (academicYearId) {
    filter['calculationPeriod.academicYearId'] = academicYearId;
  }
  
  if (semesterId) {
    filter['calculationPeriod.semesterId'] = semesterId;
  }
  
  return this.find(filter)
    .populate('teacherId', 'fullName code')
    .populate('calculationPeriod.academicYearId', 'name code')
    .populate('calculationPeriod.semesterId', 'name code')
    .sort({ 'calculationPeriod.startDate': -1 });
};

salaryCalculationSchema.statics.getSummaryByDepartment = function(departmentId, academicYearId, semesterId) {
  const matchStage = {
    isActive: true,
    'calculationStatus.status': { $in: ['calculated', 'approved', 'paid'] }
  };
  
  if (academicYearId) {
    matchStage['calculationPeriod.academicYearId'] = mongoose.Types.ObjectId(academicYearId);
  }
  
  if (semesterId) {
    matchStage['calculationPeriod.semesterId'] = mongoose.Types.ObjectId(semesterId);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: 'teachers',
        localField: 'teacherId',
        foreignField: '_id',
        as: 'teacher'
      }
    },
    { $unwind: '$teacher' },
    { $match: { 'teacher.departmentId': mongoose.Types.ObjectId(departmentId) } },
    {
      $group: {
        _id: '$teacher.departmentId',
        totalCalculations: { $sum: 1 },
        totalGrossSalary: { $sum: '$calculationResults.totalGrossSalary' },
        totalNetSalary: { $sum: '$calculationResults.totalNetSalary' },
        averageGrossSalary: { $avg: '$calculationResults.totalGrossSalary' },
        averageNetSalary: { $avg: '$calculationResults.totalNetSalary' },
        totalTeachingHours: { $sum: { $sum: '$teachingAssignments.totalHours' } }
      }
    }
  ]);
};

module.exports = mongoose.model('SalaryCalculation', salaryCalculationSchema); 