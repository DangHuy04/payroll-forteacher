const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const TeachingAssignment = require('../models/TeachingAssignment');
const { validationResult } = require('express-validator');

// @desc    Get all classes
// @route   GET /api/classes
// @access  Public
const getClasses = async (req, res) => {
  try {
    const {
      semesterId,
      subjectId,
      teacherId,
      status,
      classType,
      isActive = true,
      includeStats = false,
      page = 1,
      limit = 50,
      sort = 'code'
    } = req.query;

    // Build filter
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (semesterId) filter.semesterId = semesterId;
    if (subjectId) filter.subjectId = subjectId;
    if (teacherId) filter.teacherId = teacherId;
    if (status) filter.status = status;
    if (classType) filter.classType = classType;

    let query;
    
    if (includeStats === 'true') {
      // Use aggregation for statistics
      const classes = await Class.aggregate([
        {
          $lookup: {
            from: 'subjects',
            localField: 'subjectId',
            foreignField: '_id',
            as: 'subject'
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
            from: 'teachingassignments',
            localField: '_id',
            foreignField: 'classId',
            as: 'assignments'
          }
        },
        {
          $addFields: {
            subject: { $arrayElemAt: ['$subject', 0] },
            teacher: { $arrayElemAt: ['$teacher', 0] },
            assignmentCount: { $size: '$assignments' }
          }
        }
      ]);
      return res.json({
        success: true,
        count: classes.length,
        data: classes
      });
    }

    // Regular query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    query = Class.find(filter)
      .populate('semester', 'code name')
      .populate('subject', 'code name credits coefficient')
      .populate('teacher', 'code fullName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const classes = await query;
    const total = await Class.countDocuments(filter);

    res.json({
      success: true,
      count: classes.length,
      total,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      },
      data: classes
    });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách lớp học',
      error: error.message
    });
  }
};

// @desc    Get class by ID
// @route   GET /api/classes/:id
// @access  Public
const getClass = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id)
      .populate('semester', 'code name startDate endDate')
      .populate('subject', 'code name credits coefficient periods departmentId')
      .populate('teacher', 'code fullName email phone')
      .populate({
        path: 'assignments',
        select: 'teacherId assignmentType hoursAssigned status',
        populate: {
          path: 'teacher',
          select: 'code fullName'
        }
      });

    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học'
      });
    }

    res.json({
      success: true,
      data: classItem
    });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin lớp học',
      error: error.message
    });
  }
};

// @desc    Get classes by semester
// @route   GET /api/classes/semester/:semesterId
// @access  Public
const getClassesBySemester = async (req, res) => {
  try {
    const classes = await Class.find({
      semesterId: req.params.semesterId,
      isActive: true
    })
      .populate('subject', 'code name credits')
      .populate('teacher', 'code fullName')
      .sort('code');

    res.json({
      success: true,
      count: classes.length,
      data: classes
    });
  } catch (error) {
    console.error('Get classes by semester error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách lớp học theo học kỳ',
      error: error.message
    });
  }
};

// @desc    Create new class
// @route   POST /api/classes
// @access  Private
const createClass = async (req, res) => {
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
      name,
      semesterId,
      subjectId,
      teacherId,
      studentCount,
      maxStudents,
      classType,
      schedule
    } = req.body;

    // Check if class code already exists in the semester
    const existingClass = await Class.findOne({
      code,
      semesterId
    });

    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: 'Mã lớp học đã tồn tại trong học kỳ này'
      });
    }

    // Check schedule conflicts
    if (schedule && schedule.length > 0) {
      const hasConflict = await checkScheduleConflicts(schedule, semesterId, teacherId);
      if (hasConflict) {
        return res.status(400).json({
          success: false,
          message: 'Lịch học bị trùng với lớp khác'
        });
      }
    }

    // Create new class
    const classItem = await Class.create({
      code,
      name,
      semesterId,
      subjectId,
      teacherId,
      studentCount,
      maxStudents,
      classType,
      schedule,
      status: 'planning',
      isActive: true
    });

    // Create main teaching assignment
    await TeachingAssignment.create({
      classId: classItem._id,
      teacherId,
      semesterId,
      assignmentType: 'main',
      status: 'assigned'
    });

    res.status(201).json({
      success: true,
      data: classItem
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo lớp học mới',
      error: error.message
    });
  }
};

// @desc    Update class
// @route   PUT /api/classes/:id
// @access  Private
const updateClass = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      name,
      teacherId,
      studentCount,
      maxStudents,
      classType,
      schedule,
      status
    } = req.body;

    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học'
      });
    }

    // Check if class can be updated
    if (classItem.status === 'completed' || classItem.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Không thể cập nhật lớp học đã hoàn thành hoặc đã hủy'
      });
    }

    // Check schedule conflicts if schedule is being updated
    if (schedule && schedule.length > 0) {
      const hasConflict = await checkScheduleConflicts(
        schedule,
        classItem.semesterId,
        teacherId || classItem.teacherId,
        classItem._id
      );
      if (hasConflict) {
        return res.status(400).json({
          success: false,
          message: 'Lịch học bị trùng với lớp khác'
        });
      }
    }

    // Update fields
    classItem.name = name || classItem.name;
    if (teacherId && teacherId !== classItem.teacherId.toString()) {
      classItem.teacherId = teacherId;
      // Update main teaching assignment
      await TeachingAssignment.findOneAndUpdate(
        {
          classId: classItem._id,
          assignmentType: 'main'
        },
        {
          teacherId,
          status: 'assigned'
        }
      );
    }
    if (studentCount !== undefined) classItem.studentCount = studentCount;
    if (maxStudents !== undefined) classItem.maxStudents = maxStudents;
    if (classType) classItem.classType = classType;
    if (schedule) classItem.schedule = schedule;
    if (status) classItem.status = status;

    const updatedClass = await classItem.save();

    res.json({
      success: true,
      data: updatedClass
    });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật lớp học',
      error: error.message
    });
  }
};

// @desc    Delete class
// @route   DELETE /api/classes/:id
// @access  Private
const deleteClass = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học'
      });
    }

    // Check if class can be deleted
    if (classItem.status !== 'planning') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể xóa lớp học đang trong giai đoạn lập kế hoạch'
      });
    }

    // Delete associated teaching assignments
    await TeachingAssignment.deleteMany({ classId: classItem._id });

    await classItem.remove();

    res.json({
      success: true,
      message: 'Đã xóa lớp học thành công'
    });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa lớp học',
      error: error.message
    });
  }
};

// @desc    Get class statistics
// @route   GET /api/classes/statistics
// @access  Public
const getClassStatistics = async (req, res) => {
  try {
    const stats = await Class.aggregate([
      {
        $lookup: {
          from: 'subjects',
          localField: 'subjectId',
          foreignField: '_id',
          as: 'subject'
        }
      },
      {
        $lookup: {
          from: 'teachingassignments',
          localField: '_id',
          foreignField: 'classId',
          as: 'assignments'
        }
      },
      {
        $group: {
          _id: null,
          totalClasses: { $sum: 1 },
          activeClasses: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          totalStudents: { $sum: '$studentCount' },
          averageStudentsPerClass: { $avg: '$studentCount' },
          totalAssignments: { $sum: { $size: '$assignments' } },
          classesByType: {
            $push: {
              type: '$classType',
              count: 1
            }
          },
          classesByStatus: {
            $push: {
              status: '$status',
              count: 1
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalClasses: 1,
          activeClasses: 1,
          totalStudents: 1,
          averageStudentsPerClass: 1,
          totalAssignments: 1,
          classesByType: {
            $reduce: {
              input: '$classesByType',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  { $literal: { ['$$this.type']: { $sum: '$$this.count' } } }
                ]
              }
            }
          },
          classesByStatus: {
            $reduce: {
              input: '$classesByStatus',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  { $literal: { ['$$this.status']: { $sum: '$$this.count' } } }
                ]
              }
            }
          }
        }
      }
    ]);

    const typeStats = await Class.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$classType',
          count: { $sum: 1 },
          totalStudents: { $sum: '$studentCount' },
          averageStudents: { $avg: '$studentCount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        summary: stats[0] || {},
        typeStats
      }
    });
  } catch (error) {
    console.error('Get class statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê lớp học',
      error: error.message
    });
  }
};

// Helper function to check schedule conflicts
const checkScheduleConflicts = async (newSchedule, semesterId, teacherId, excludeClassId = null) => {
  const filter = {
    semesterId,
    teacherId,
    isActive: true
  };
  if (excludeClassId) {
    filter._id = { $ne: excludeClassId };
  }

  const existingClasses = await Class.find(filter);

  for (const existingClass of existingClasses) {
    for (const existingSlot of existingClass.schedule) {
      for (const newSlot of newSchedule) {
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

module.exports = {
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  getClassesBySemester,
  getClassStatistics
}; 