const mongoose = require('mongoose');
const TeachingAssignment = require('../models/TeachingAssignment');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const AcademicYear = require('../models/AcademicYear');
const { validationResult } = require('express-validator');

// @desc    Get all teaching assignments
// @route   GET /api/teaching-assignments
// @access  Public
const getTeachingAssignments = async (req, res) => {
  try {
    const {
      teacherId,
      classId,
      assignmentType,
      status,
      isActive = true,
      includeStats = false,
      page = 1,
      limit = 50,
      sort = '-createdAt'
    } = req.query;

    // Build filter
    const filter = {};
    // Handle isActive filter - default to true if not specified
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true' || isActive === true;
    } else {
      filter.isActive = true; // Default to active assignments only
    }
    if (teacherId) filter.teacherId = teacherId;
    if (classId) filter.classId = classId;
    if (assignmentType) filter.assignmentType = assignmentType;
    if (status) filter.status = status;

    let query;
    
    if (includeStats === 'true') {
      // Use aggregation for statistics
      const assignments = await TeachingAssignment.aggregate([
        {
          $lookup: {
            from: 'classes',
            localField: 'classId',
            foreignField: '_id',
            as: 'class'
          }
        },
        {
          $lookup: {
            from: 'teachers',
            localField: 'teacherId',
            foreignField: '_id',
            as: 'teacher'
          }
        },
        {
          $lookup: {
            from: 'academicyears',
            localField: 'academicYearId',
            foreignField: '_id',
            as: 'academicYear'
          }
        },
        {
          $addFields: {
            class: { $arrayElemAt: ['$class', 0] },
            teacher: { $arrayElemAt: ['$teacher', 0] },
            academicYear: { $arrayElemAt: ['$academicYear', 0] }
          }
        }
      ]);
      return res.json({
        success: true,
        count: assignments.length,
        data: assignments
      });
    }

    // Regular query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    query = TeachingAssignment.find(filter)
      .populate('classId', 'code name subjectId')
      .populate({
        path: 'classId',
        populate: {
          path: 'subjectId',
          select: 'code name credits soTietLyThuyet soTietThucHanh coefficient'
        }
      })
      .populate('teacherId', 'code fullName email')
      .populate('academicYearId', 'code name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const assignments = await query;
    const total = await TeachingAssignment.countDocuments(filter);

    res.json({
      success: true,
      count: assignments.length,
      total,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      },
      data: assignments
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách phân công giảng dạy',
      error: error.message
    });
  }
};

// @desc    Get teaching assignment by ID
// @route   GET /api/teaching-assignments/:id
// @access  Public
const getTeachingAssignment = async (req, res) => {
  try {
    const assignment = await TeachingAssignment.findById(req.params.id)
      .populate('classId', 'code name subjectId schedule')
      .populate({
        path: 'classId',
        populate: {
          path: 'subjectId',
          select: 'code name credits coefficient'
        }
      })
      .populate('teacherId', 'employeeId fullName email phone')
      .populate('academicYearId', 'code name startDate endDate');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phân công giảng dạy'
      });
    }

    res.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin phân công giảng dạy',
      error: error.message
    });
  }
};

// @desc    Get assignments by teacher
// @route   GET /api/teaching-assignments/teacher/:teacherId
// @access  Public
const getAssignmentsByTeacher = async (req, res) => {
  try {
    const assignments = await TeachingAssignment.find({
      teacherId: req.params.teacherId,
      isActive: true
    })
      .populate('classId', 'code name subjectId schedule')
      .populate({
        path: 'classId',
        populate: {
          path: 'subjectId',
          select: 'code name credits'
        }
      })
      .populate('academicYearId', 'code name')
      .sort('-createdAt');

    res.json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách phân công theo giảng viên',
      error: error.message
    });
  }
};

// @desc    Get assignments by class
// @route   GET /api/teaching-assignments/class/:classId
// @access  Public
const getAssignmentsByClass = async (req, res) => {
  try {
    const assignments = await TeachingAssignment.find({
      classId: req.params.classId,
      isActive: true
    })
      .populate('teacher', 'code fullName email')
      .populate('semester', 'code name')
      .sort('assignmentType');

    res.json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách phân công theo lớp học',
      error: error.message
    });
  }
};

// @desc    Create new teaching assignment
// @route   POST /api/teaching-assignments
// @access  Private
const createTeachingAssignment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      code,
      teacherId,
      classId,
      academicYearId,
      status,
      notes
    } = req.body;

    // Check if class exists and get subject info
    const classExists = await Class.findById(classId).populate('subjectId', 'code name soTietLyThuyet soTietThucHanh coefficient');
    if (!classExists) {
      return res.status(404).json({
        success: false,
        message: 'Lớp học phần không tồn tại'
      });
    }

    // Calculate total periods from subject
    const totalPeriods = classExists.subjectId.soTietLyThuyet + classExists.subjectId.soTietThucHanh;

    // Check if teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Giảng viên không tồn tại'
      });
    }

    // Check if academic year exists
    const academicYear = await AcademicYear.findById(academicYearId);
    if (!academicYear) {
      return res.status(404).json({
        success: false,
        message: 'Năm học không tồn tại'
      });
    }

    // Auto-generate code if not provided
    let finalCode = code;
    if (!finalCode) {
      const assignmentCount = await TeachingAssignment.countDocuments({
        teacherId,
        academicYearId
      });
      finalCode = `${teacher.code}_${classExists.code}_${assignmentCount + 1}`;
    }

    // Create new assignment
    const assignmentData = {
      code: finalCode,
      teacherId,
      classId,
      academicYearId,
      periods: totalPeriods, // Use periods from subject
      status: status || 'assigned',
      notes
    };

    const newAssignment = await TeachingAssignment.create(assignmentData);
    
    // Populate the created assignment
    const populatedAssignment = await TeachingAssignment.findById(newAssignment._id)
      .populate('teacherId', 'code fullName email')
      .populate('classId', 'code name')
      .populate('academicYearId', 'code name');

    res.status(201).json({
      success: true,
      message: 'Tạo phân công giảng dạy thành công',
      data: populatedAssignment
    });
  } catch (error) {
    console.error('Error creating teaching assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo phân công giảng dạy',
      error: error.message
    });
  }
};

// @desc    Update teaching assignment
// @route   PUT /api/teaching-assignments/:id
// @access  Private
const updateTeachingAssignment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const assignment = await TeachingAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phân công'
      });
    }

    const {
      teacherId,
      classId,
      academicYearId,
      status,
      hoursAssigned,
      notes
    } = req.body;

    // Validate teacher exists
    if (teacherId) {
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Giảng viên không tồn tại'
        });
      }
    }

    // Validate class exists
    if (classId) {
      const classExists = await Class.findById(classId);
      if (!classExists) {
        return res.status(404).json({
          success: false,
          message: 'Lớp học phần không tồn tại'
        });
      }
    }

    // Validate academic year exists
    if (academicYearId) {
      const academicYear = await AcademicYear.findById(academicYearId);
      if (!academicYear) {
        return res.status(404).json({
          success: false,
          message: 'Năm học không tồn tại'
        });
      }
    }

    // Update fields
    const updateFields = {};
    if (teacherId) updateFields.teacherId = teacherId;
    if (classId) updateFields.classId = classId;
    if (academicYearId) updateFields.academicYearId = academicYearId;
    if (status) updateFields.status = status;
    if (hoursAssigned !== undefined) updateFields.hoursAssigned = hoursAssigned;
    if (notes !== undefined) updateFields.notes = notes;

    const updatedAssignment = await TeachingAssignment.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    )
      .populate('teacherId', 'code fullName email')
      .populate({
        path: 'classId',
        select: 'code name subjectId',
        populate: {
          path: 'subjectId',
          select: 'code name credits soTietLyThuyet soTietThucHanh coefficient'
        }
      })
      .populate('academicYearId', 'code name');

    res.json({
      success: true,
      message: 'Cập nhật phân công thành công',
      data: updatedAssignment
    });
  } catch (error) {
    console.error('Error updating teaching assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật phân công giảng dạy',
      error: error.message
    });
  }
};

// @desc    Delete teaching assignment
// @route   DELETE /api/teaching-assignments/:id
// @access  Private
const deleteTeachingAssignment = async (req, res) => {
  try {
    const assignment = await TeachingAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phân công'
      });
    }

    await TeachingAssignment.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Đã xóa phân công thành công'
    });
  } catch (error) {
    console.error('Error deleting teaching assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa phân công giảng dạy',
      error: error.message
    });
  }
};

// @desc    Check teacher availability
// @route   GET /api/teaching-assignments/availability/check
// @access  Public
const checkTeacherAvailability = async (teacherId, academicYearId, classId, excludeAssignmentId = null) => {
  // Get the class schedule
  const classToCheck = await Class.findById(classId).select('schedule');
  if (!classToCheck || !classToCheck.schedule) return false;

  // Get all classes assigned to the teacher in the academic year
  const filter = {
    teacherId,
    academicYearId,
    isActive: true
  };
  if (excludeAssignmentId) {
    filter._id = { $ne: excludeAssignmentId };
  }

  const teacherAssignments = await TeachingAssignment.find(filter)
    .populate('classId', 'schedule');

  // Check for schedule conflicts
  for (const assignment of teacherAssignments) {
    if (!assignment.classId || !assignment.classId.schedule) continue;

    for (const existingSlot of assignment.classId.schedule) {
      for (const newSlot of classToCheck.schedule) {
        if (existingSlot.dayOfWeek === newSlot.dayOfWeek) {
          // Check if time slots overlap
          const existingStart = existingSlot.startPeriod;
          const existingEnd = existingSlot.startPeriod + existingSlot.periodsCount - 1;
          const newStart = newSlot.startPeriod;
          const newEnd = newSlot.startPeriod + newSlot.periodsCount - 1;

          if (
            (newStart >= existingStart && newStart <= existingEnd) ||
            (newEnd >= existingStart && newEnd <= existingEnd) ||
            (newStart <= existingStart && newEnd >= existingEnd)
          ) {
            return true; // Conflict found
          }
        }
      }
    }
  }

  return false; // No conflicts
};

// @desc    Bulk assign teachers
// @route   POST /api/teaching-assignments/bulk/assign
// @access  Private
const bulkAssignTeachers = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { assignments } = req.body;
    const createdAssignments = [];

    for (let assignment of assignments) {
      const newAssignment = new TeachingAssignment({
        ...assignment,
        status: 'assigned'
      });
      const saved = await newAssignment.save();
      createdAssignments.push(saved);
    }

    res.json(createdAssignments);
  } catch (err) {
    
    res.status(500).send('Lỗi server');
  }
};

// @desc    Get teaching assignment statistics
// @route   GET /api/teaching-assignments/statistics
// @access  Public
const getTeachingAssignmentStatistics = async (req, res) => {
  try {
    const totalAssignments = await TeachingAssignment.countDocuments();
    const assignmentsByStatus = await TeachingAssignment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const assignmentsByType = await TeachingAssignment.aggregate([
      {
        $group: {
          _id: '$assignmentType',
          count: { $sum: 1 },
          totalHours: { $sum: '$hoursAssigned' }
        }
      }
    ]);

    res.json({
      totalAssignments,
      assignmentsByStatus,
      assignmentsByType
    });
  } catch (err) {
    
    res.status(500).send('Lỗi server');
  }
};

module.exports = {
  getTeachingAssignments,
  getTeachingAssignment,
  createTeachingAssignment,
  updateTeachingAssignment,
  deleteTeachingAssignment,
  getAssignmentsByTeacher,
  getAssignmentsByClass,
  bulkAssignTeachers,
  getTeachingAssignmentStatistics
}; 
