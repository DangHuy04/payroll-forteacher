const mongoose = require('mongoose');
const SalaryCalculation = require('../models/SalaryCalculation');
const Teacher = require('../models/Teacher');
const TeachingAssignment = require('../models/TeachingAssignment');
const AcademicYear = require('../models/AcademicYear');
const Semester = require('../models/Semester');
const RateSetting = require('../models/RateSetting');
const Class = require('../models/Class');
const { validationResult } = require('express-validator');
const Rate = require('../models/Rate');

// Get all salary calculations with filtering
exports.getAllSalaryCalculations = async (req, res) => {
  try {
    const { 
      teacherId,
      academicYearId,
      semesterId,
      status,
      periodType,
      year,
      month,
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    if (teacherId) filter.teacherId = teacherId;
    if (academicYearId) filter['calculationPeriod.academicYearId'] = academicYearId;
    if (semesterId) filter['calculationPeriod.semesterId'] = semesterId;
    if (status) filter['calculationStatus.status'] = status;
    if (periodType) filter['calculationPeriod.periodType'] = periodType;
    if (year) filter['calculationPeriod.year'] = parseInt(year);
    if (month) filter['calculationPeriod.month'] = parseInt(month);

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with population
    const calculations = await SalaryCalculation.find(filter)
      .populate('teacherId', 'fullName code email departmentId')
      .populate('calculationPeriod.academicYearId', 'name code startYear endYear')
      .populate('calculationPeriod.semesterId', 'name code startDate endDate')
      .populate('calculationStatus.calculatedBy', 'name email')
      .populate('calculationStatus.approvedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await SalaryCalculation.countDocuments(filter);

    res.json({
      success: true,
      data: calculations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách tính lương',
      error: error.message
    });
  }
};

// Get single salary calculation
exports.getSalaryCalculationById = async (req, res) => {
  try {
    const calculation = await SalaryCalculation.findById(req.params.id)
      .populate('teacherId')
      .populate('calculationPeriod.academicYearId')
      .populate('calculationPeriod.semesterId')
      .populate('teachingAssignments.assignmentId')
      .populate('teachingAssignments.classId')
      .populate('teachingAssignments.subjectId')
      .populate('teachingAssignments.appliedRates.rateSettingId')
      .populate('coefficients.degreeCoefficient.degreeId')
      .populate('calculationStatus.calculatedBy', 'name email')
      .populate('calculationStatus.approvedBy', 'name email')
      .populate('auditTrail.performedBy', 'name email');

    if (!calculation) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản tính lương'
      });
    }

    res.json({
      success: true,
      data: calculation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin tính lương',
      error: error.message
    });
  }
};

// Create new salary calculation
exports.createSalaryCalculation = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu đầu vào không hợp lệ',
        errors: errors.array()
      });
    }

    const {
      teacherId,
      calculationPeriod,
      teachingAssignmentIds,
      calculationMethod = 'automatic'
    } = req.body;

    // Validate teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giảng viên'
      });
    }

    // Validate academic year and semester
    const academicYear = await AcademicYear.findById(calculationPeriod.academicYearId);
    const semester = await Semester.findById(calculationPeriod.semesterId);
    
    if (!academicYear || !semester) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy năm học hoặc học kỳ'
      });
    }

    // Check for duplicate calculations
    const existingCalculation = await SalaryCalculation.findOne({
      teacherId,
      'calculationPeriod.academicYearId': calculationPeriod.academicYearId,
      'calculationPeriod.semesterId': calculationPeriod.semesterId,
      'calculationPeriod.periodType': calculationPeriod.periodType,
      isActive: true
    });

    if (existingCalculation) {
      return res.status(409).json({
        success: false,
        message: 'Đã tồn tại bản tính lương cho giảng viên trong kỳ này',
        existingCalculation: {
          id: existingCalculation._id,
          calculationId: existingCalculation.calculationId
        }
      });
    }

    // Get teaching assignments for the period
    let teachingAssignments = [];
    
    if (teachingAssignmentIds && teachingAssignmentIds.length > 0) {
      // Use specified assignments
      const assignments = await TeachingAssignment.find({
        _id: { $in: teachingAssignmentIds },
        teacherId,
        isActive: true
      }).populate('classId subjectId');
      
      teachingAssignments = assignments.map(assignment => ({
        assignmentId: assignment._id,
        classId: assignment.classId._id,
        subjectId: assignment.subjectId._id,
        assignmentType: assignment.assignmentType,
        totalHours: assignment.workload.teachingHours,
        baseHours: assignment.workload.teachingHours,
        overtimeHours: assignment.workload.additionalHours || 0,
        appliedRates: [],
        assignmentTotal: {
          baseAmount: 0,
          overtimeAmount: 0,
          bonusAmount: 0,
          allowanceAmount: 0,
          totalAmount: 0
        }
      }));
    } else {
      // Find all active assignments for the teacher in the period
      const assignments = await TeachingAssignment.find({
        teacherId,
        semesterId: calculationPeriod.semesterId,
        status: { $in: ['confirmed', 'in_progress', 'completed'] },
        isActive: true
      }).populate('classId subjectId');
      
      teachingAssignments = assignments.map(assignment => ({
        assignmentId: assignment._id,
        classId: assignment.classId._id,
        subjectId: assignment.subjectId._id,
        assignmentType: assignment.assignmentType,
        totalHours: assignment.workload.teachingHours,
        baseHours: assignment.workload.teachingHours,
        overtimeHours: assignment.workload.additionalHours || 0,
        appliedRates: [],
        assignmentTotal: {
          baseAmount: 0,
          overtimeAmount: 0,
          bonusAmount: 0,
          allowanceAmount: 0,
          totalAmount: 0
        }
      }));
    }

    if (teachingAssignments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không tìm thấy phân công giảng dạy cho giảng viên trong kỳ này'
      });
    }

    // Create salary calculation
    const calculationData = {
      teacherId,
      calculationPeriod,
      teachingAssignments,
      calculationStatus: {
        status: 'draft',
        calculatedBy: req.user?.id || null
      },
      calculationMetadata: {
        calculationMethod,
        dataSource: teachingAssignmentIds ? 'manual_entry' : 'teaching_assignments'
      },
      coefficients: {
        degreeCoefficient: {
          degreeId: teacher.degreeId,
          coefficientValue: 1.0,
          appliedAmount: 0
        },
        positionCoefficient: {
          position: teacher.position,
          coefficientValue: 1.0,
          appliedAmount: 0
        },
        experienceCoefficient: {
          yearsOfService: teacher.yearsOfService || 0,
          coefficientValue: 1.0,
          appliedAmount: 0
        }
      },
      auditTrail: [{
        action: 'created',
        performedBy: req.user?.id || null,
        performedAt: new Date(),
        notes: 'Tạo bản tính lương mới'
      }]
    };

    const calculation = new SalaryCalculation(calculationData);
    await calculation.save();

    // Populate for response
    await calculation.populate([
      { path: 'teacherId', select: 'fullName code email' },
      { path: 'calculationPeriod.academicYearId', select: 'name code' },
      { path: 'calculationPeriod.semesterId', select: 'name code' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Tạo bản tính lương thành công',
      data: calculation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo bản tính lương',
      error: error.message
    });
  }
};

// @desc    Calculate salary for a teacher
// @route   POST /api/salaries/calculate
const calculateSalary = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { teacherId, semesterId } = req.body;

    // Get all assignments for the teacher in the semester
    const assignments = await TeachingAssignment.find({
      teacherId,
      semesterId,
      status: 'completed'
    }).populate('classId', 'name schedule');

    if (!assignments.length) {
      return res.status(404).json({ msg: 'Không tìm thấy phân công giảng dạy hoàn thành' });
    }

    // Get applicable rates
    const rates = await Rate.find({
      semesterId,
      isActive: true
    });

    if (!rates.length) {
      return res.status(404).json({ msg: 'Không tìm thấy hệ số lương áp dụng' });
    }

    // Calculate salary components
    let totalSalary = 0;
    let salaryComponents = {
      base: 0,
      overtime: 0,
      holiday: 0
    };

    for (const assignment of assignments) {
      const { assignmentType, hoursAssigned } = assignment;
      const applicableRate = rates.find(rate => rate.rateType === assignmentType);
      
      if (applicableRate) {
        const amount = hoursAssigned * applicableRate.value;
        salaryComponents[assignmentType] += amount;
        totalSalary += amount;
      }
    }

    res.json({
      teacherId,
      semesterId,
      totalSalary,
      salaryComponents,
      assignmentCount: assignments.length,
      totalHours: assignments.reduce((sum, a) => sum + a.hoursAssigned, 0)
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi server');
  }
};

// Approve salary calculation
exports.approveSalaryCalculation = async (req, res) => {
  try {
    const { approvalNotes } = req.body;
    const calculation = await SalaryCalculation.findById(req.params.id);

    if (!calculation) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản tính lương'
      });
    }

    if (calculation.calculationStatus.status !== 'calculated') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể phê duyệt bản tính lương đã được tính toán'
      });
    }

    await calculation.approve(req.user?.id, approvalNotes);

    await calculation.populate([
      { path: 'teacherId', select: 'fullName code email' },
      { path: 'calculationStatus.approvedBy', select: 'name email' }
    ]);

    res.json({
      success: true,
      message: 'Phê duyệt bản tính lương thành công',
      data: calculation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi phê duyệt bản tính lương',
      error: error.message
    });
  }
};

// Mark salary calculation as paid
exports.markAsPaid = async (req, res) => {
  try {
    const { paymentNotes } = req.body;
    const calculation = await SalaryCalculation.findById(req.params.id);

    if (!calculation) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản tính lương'
      });
    }

    if (calculation.calculationStatus.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể thanh toán cho bản tính lương đã được phê duyệt'
      });
    }

    await calculation.markAsPaid(req.user?.id, paymentNotes);

    await calculation.populate([
      { path: 'teacherId', select: 'fullName code email' }
    ]);

    res.json({
      success: true,
      message: 'Đánh dấu đã thanh toán thành công',
      data: calculation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đánh dấu thanh toán',
      error: error.message
    });
  }
};

// Update salary calculation
exports.updateSalaryCalculation = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu đầu vào không hợp lệ',
        errors: errors.array()
      });
    }

    const calculation = await SalaryCalculation.findById(req.params.id);
    if (!calculation) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản tính lương'
      });
    }

    // Check if calculation can be updated
    if (calculation.calculationStatus.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Không thể cập nhật bản tính lương đã thanh toán'
      });
    }

    // Add to audit trail
    calculation.auditTrail.push({
      action: 'modified',
      performedBy: req.user?.id || null,
      performedAt: new Date(),
      changes: req.body,
      notes: 'Cập nhật thông tin tính lương'
    });

    // Update calculation
    const updatedCalculation = await SalaryCalculation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate([
      { path: 'teacherId', select: 'fullName code email' },
      { path: 'calculationPeriod.academicYearId', select: 'name code' },
      { path: 'calculationPeriod.semesterId', select: 'name code' }
    ]);

    res.json({
      success: true,
      message: 'Cập nhật bản tính lương thành công',
      data: updatedCalculation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật bản tính lương',
      error: error.message
    });
  }
};

// Delete salary calculation
exports.deleteSalaryCalculation = async (req, res) => {
  try {
    const calculation = await SalaryCalculation.findById(req.params.id);
    if (!calculation) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bản tính lương'
      });
    }

    // Check if calculation can be deleted
    if (calculation.calculationStatus.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa bản tính lương đã thanh toán'
      });
    }

    // Soft delete
    await SalaryCalculation.findByIdAndUpdate(req.params.id, {
      isActive: false,
      'calculationStatus.status': 'archived'
    });

    res.json({
      success: true,
      message: 'Xóa bản tính lương thành công'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa bản tính lương',
      error: error.message
    });
  }
};

// Get salary calculations by teacher
exports.getSalaryCalculationsByTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { academicYearId, semesterId } = req.query;

    const calculations = await SalaryCalculation.getByTeacher(
      teacherId, 
      academicYearId, 
      semesterId
    );

    res.json({
      success: true,
      data: calculations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách tính lương của giảng viên',
      error: error.message
    });
  }
};

// Get salary calculations by period
exports.getSalaryCalculationsByPeriod = async (req, res) => {
  try {
    const { periodType, startDate, endDate } = req.query;

    if (!periodType || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin kỳ tính lương'
      });
    }

    const calculations = await SalaryCalculation.getByPeriod(
      periodType,
      new Date(startDate),
      new Date(endDate)
    );

    res.json({
      success: true,
      data: calculations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách tính lương theo kỳ',
      error: error.message
    });
  }
};

// Get salary calculation statistics
exports.getSalaryCalculationStatistics = async (req, res) => {
  try {
    const { academicYearId, semesterId, departmentId } = req.query;

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

    // Overall statistics
    const overallStats = await SalaryCalculation.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalCalculations: { $sum: 1 },
          totalGrossSalary: { $sum: '$calculationResults.totalGrossSalary' },
          totalNetSalary: { $sum: '$calculationResults.totalNetSalary' },
          averageGrossSalary: { $avg: '$calculationResults.totalGrossSalary' },
          averageNetSalary: { $avg: '$calculationResults.totalNetSalary' },
          totalTeachingHours: { $sum: { $sum: '$teachingAssignments.totalHours' } },
          statusBreakdown: {
            $push: '$calculationStatus.status'
          }
        }
      }
    ]);

    // Status breakdown
    const statusStats = await SalaryCalculation.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$calculationStatus.status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$calculationResults.totalGrossSalary' }
        }
      }
    ]);

    // Department statistics (if requested)
    let departmentStats = null;
    if (departmentId) {
      departmentStats = await SalaryCalculation.getSummaryByDepartment(
        departmentId,
        academicYearId,
        semesterId
      );
    }

    res.json({
      success: true,
      data: {
        overall: overallStats[0] || {
          totalCalculations: 0,
          totalGrossSalary: 0,
          totalNetSalary: 0,
          averageGrossSalary: 0,
          averageNetSalary: 0,
          totalTeachingHours: 0
        },
        statusBreakdown: statusStats,
        departmentSummary: departmentStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê tính lương',
      error: error.message
    });
  }
};

// Batch calculate salaries
exports.batchCalculateSalaries = async (req, res) => {
  try {
    const { calculationIds } = req.body;

    if (!calculationIds || calculationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Danh sách ID tính lương không được rỗng'
      });
    }

    const results = {
      successful: [],
      failed: []
    };

    for (const calculationId of calculationIds) {
      try {
        const calculation = await SalaryCalculation.findById(calculationId);
        if (!calculation) {
          results.failed.push({
            calculationId,
            error: 'Không tìm thấy bản tính lương'
          });
          continue;
        }

        if (calculation.calculationStatus.status === 'approved' || 
            calculation.calculationStatus.status === 'paid') {
          results.failed.push({
            calculationId,
            error: 'Bản tính lương đã được phê duyệt hoặc đã thanh toán'
          });
          continue;
        }

        calculation.calculationStatus.calculatedBy = req.user?.id || null;
        await calculation.calculateSalary();
        
        results.successful.push({
          calculationId,
          calculationCode: calculation.calculationId,
          totalGrossSalary: calculation.calculationResults.totalGrossSalary
        });
      } catch (error) {
        results.failed.push({
          calculationId,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Tính lương hàng loạt hoàn thành. Thành công: ${results.successful.length}, Thất bại: ${results.failed.length}`,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tính lương hàng loạt',
      error: error.message
    });
  }
};

// @desc    Calculate salaries for all teachers in a department
// @route   POST /api/salaries/calculate/department
const calculateDepartmentSalaries = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { departmentId, semesterId } = req.body;

    // Get all completed assignments for teachers in the department
    const assignments = await TeachingAssignment.find({
      semesterId,
      status: 'completed'
    })
    .populate('teacherId', 'name department')
    .populate('classId', 'name schedule');

    if (!assignments.length) {
      return res.status(404).json({ msg: 'Không tìm thấy phân công giảng dạy hoàn thành' });
    }

    // Get applicable rates
    const rates = await Rate.find({
      semesterId,
      isActive: true
    });

    if (!rates.length) {
      return res.status(404).json({ msg: 'Không tìm thấy hệ số lương áp dụng' });
    }

    // Calculate salaries by teacher
    const salariesByTeacher = {};
    for (const assignment of assignments) {
      const teacherId = assignment.teacherId._id.toString();
      
      if (!salariesByTeacher[teacherId]) {
        salariesByTeacher[teacherId] = {
          teacherName: assignment.teacherId.name,
          totalSalary: 0,
          salaryComponents: {
            base: 0,
            overtime: 0,
            holiday: 0
          },
          assignmentCount: 0,
          totalHours: 0
        };
      }

      const { assignmentType, hoursAssigned } = assignment;
      const applicableRate = rates.find(rate => rate.rateType === assignmentType);
      
      if (applicableRate) {
        const amount = hoursAssigned * applicableRate.value;
        salariesByTeacher[teacherId].salaryComponents[assignmentType] += amount;
        salariesByTeacher[teacherId].totalSalary += amount;
        salariesByTeacher[teacherId].assignmentCount++;
        salariesByTeacher[teacherId].totalHours += hoursAssigned;
      }
    }

    res.json({
      departmentId,
      semesterId,
      teacherCount: Object.keys(salariesByTeacher).length,
      totalSalary: Object.values(salariesByTeacher).reduce((sum, t) => sum + t.totalSalary, 0),
      salariesByTeacher
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi server');
  }
};

// @desc    Get salary statistics
// @route   GET /api/salaries/statistics
const getSalaryStatistics = async (req, res) => {
  try {
    const { semesterId } = req.query;

    const assignments = await TeachingAssignment.find({
      semesterId,
      status: 'completed'
    });

    const rates = await Rate.find({
      semesterId,
      isActive: true
    });

    if (!assignments.length || !rates.length) {
      return res.status(404).json({ msg: 'Không đủ dữ liệu để tính thống kê' });
    }

    // Calculate statistics
    let totalSalary = 0;
    let salaryByType = {
      base: 0,
      overtime: 0,
      holiday: 0
    };
    let assignmentStats = {
      totalAssignments: assignments.length,
      totalHours: 0,
      averageHoursPerAssignment: 0
    };

    for (const assignment of assignments) {
      const { assignmentType, hoursAssigned } = assignment;
      const applicableRate = rates.find(rate => rate.rateType === assignmentType);
      
      if (applicableRate) {
        const amount = hoursAssigned * applicableRate.value;
        salaryByType[assignmentType] += amount;
        totalSalary += amount;
        assignmentStats.totalHours += hoursAssigned;
      }
    }

    assignmentStats.averageHoursPerAssignment = 
      assignmentStats.totalHours / assignmentStats.totalAssignments;

    res.json({
      semesterId,
      totalSalary,
      salaryByType,
      assignmentStats,
      averageSalaryPerAssignment: totalSalary / assignmentStats.totalAssignments,
      averageSalaryPerHour: totalSalary / assignmentStats.totalHours
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi server');
  }
};

module.exports = {
  calculateSalary,
  calculateDepartmentSalaries,
  getSalaryStatistics
}; 