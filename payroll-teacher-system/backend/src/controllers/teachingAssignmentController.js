const mongoose = require('mongoose');
const TeachingAssignment = require('../models/TeachingAssignment');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Semester = require('../models/Semester');
const { validationResult } = require('express-validator');

// @desc    Get all teaching assignments
// @route   GET /api/teaching-assignments
// @access  Public
const getTeachingAssignments = async (req, res) => {
  try {
    const {
      semesterId,
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
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (semesterId) filter.semesterId = semesterId;
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
            from: 'semesters',
            localField: 'semesterId',
            foreignField: '_id',
            as: 'semester'
          }
        },
        {
          $addFields: {
            class: { $arrayElemAt: ['$class', 0] },
            teacher: { $arrayElemAt: ['$teacher', 0] },
            semester: { $arrayElemAt: ['$semester', 0] }
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
      .populate('class', 'code name subjectId')
      .populate({
        path: 'class',
        populate: {
          path: 'subject',
          select: 'code name credits'
        }
      })
      .populate('teacher', 'code fullName email')
      .populate('semester', 'code name')
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
    console.error('Get teaching assignments error:', error);
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
      .populate('class', 'code name subjectId schedule')
      .populate({
        path: 'class',
        populate: {
          path: 'subject',
          select: 'code name credits coefficient'
        }
      })
      .populate('teacher', 'code fullName email phone')
      .populate('semester', 'code name startDate endDate');

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
    console.error('Get teaching assignment error:', error);
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
      .populate('class', 'code name subjectId schedule')
      .populate({
        path: 'class',
        populate: {
          path: 'subject',
          select: 'code name credits'
        }
      })
      .populate('semester', 'code name')
      .sort('-createdAt');

    res.json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    console.error('Get assignments by teacher error:', error);
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
    console.error('Get assignments by class error:', error);
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
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { classId, teacherId, semesterId, assignmentType, hoursAssigned } = req.body;

    // Check if class exists
    const classExists = await Class.findById(classId);
    if (!classExists) {
      return res.status(404).json({ msg: 'Lớp học không tồn tại' });
    }

    // Check if teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ msg: 'Giảng viên không tồn tại' });
    }

    // Check for schedule conflicts
    const existingAssignments = await TeachingAssignment.find({
      teacherId,
      semesterId,
      status: { $ne: 'cancelled' }
    }).populate('classId', 'schedule');

    // Create new assignment
    const newAssignment = new TeachingAssignment({
      classId,
      teacherId,
      semesterId,
      assignmentType,
      hoursAssigned,
      status: 'assigned'
    });

    const assignment = await newAssignment.save();
    res.json(assignment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi server');
  }
};

// @desc    Update teaching assignment
// @route   PUT /api/teaching-assignments/:id
// @access  Private
const updateTeachingAssignment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const assignment = await TeachingAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ msg: 'Không tìm thấy phân công' });
    }

    // Update fields
    const updateFields = {};
    if (req.body.hoursAssigned) updateFields.hoursAssigned = req.body.hoursAssigned;
    if (req.body.status) updateFields.status = req.body.status;

    const updatedAssignment = await TeachingAssignment.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    res.json(updatedAssignment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi server');
  }
};

// @desc    Delete teaching assignment
// @route   DELETE /api/teaching-assignments/:id
// @access  Private
const deleteTeachingAssignment = async (req, res) => {
  try {
    const assignment = await TeachingAssignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ msg: 'Không tìm thấy phân công' });
    }

    await assignment.remove();
    res.json({ msg: 'Đã xóa phân công' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Lỗi server');
  }
};

// @desc    Check teacher availability
// @route   GET /api/teaching-assignments/availability/check
// @access  Public
const checkTeacherAvailability = async (teacherId, semesterId, classId, excludeAssignmentId = null) => {
  // Get the class schedule
  const classToCheck = await Class.findById(classId).select('schedule');
  if (!classToCheck || !classToCheck.schedule) return false;

  // Get all classes assigned to the teacher in the semester
  const filter = {
    teacherId,
    semesterId,
    isActive: true
  };
  if (excludeAssignmentId) {
    filter._id = { $ne: excludeAssignmentId };
  }

  const teacherAssignments = await TeachingAssignment.find(filter)
    .populate('class', 'schedule');

  // Check for schedule conflicts
  for (const assignment of teacherAssignments) {
    if (!assignment.class || !assignment.class.schedule) continue;

    for (const existingSlot of assignment.class.schedule) {
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
    console.error(err.message);
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
    console.error(err.message);
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