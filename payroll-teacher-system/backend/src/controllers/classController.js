const Class = require('../models/Class');
const Subject = require('../models/Subject');
const TeachingAssignment = require('../models/TeachingAssignment');
const { validationResult } = require('express-validator');

// @desc    Get all classes
// @route   GET /api/classes
// @access  Public
const getClasses = async (req, res) => {
  try {
    const {
      subjectId,
      teacherId,
      classType,
      isActive,
      includeStats = false,
      page = 1,
      limit = 50,
      sort = 'code'
    } = req.query;

    // Build filter
    const filter = {};
    if (isActive !== undefined && isActive !== '') filter.isActive = isActive === 'true';
    if (subjectId) filter.subjectId = subjectId;
    if (teacherId) filter.teacherId = teacherId;
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
            from: 'teachingassignments',
            localField: '_id',
            foreignField: 'classId',
            as: 'assignments'
          }
        },
        {
          $addFields: {
            subject: { $arrayElemAt: ['$subject', 0] },
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
      .populate('subjectId', 'code name credits coefficient soTietLyThuyet soTietThucHanh')
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
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách lớp học phần',
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
      .populate('subjectId', 'code name credits coefficient soTietLyThuyet soTietThucHanh departmentId')
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
        message: 'Không tìm thấy lớp học phần'
      });
    }

    res.json({
      success: true,
      data: classItem
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin lớp học phần',
      error: error.message
    });
  }
};

// @desc    Get classes by academic year
// @route   GET /api/classes/academic-year/:academicYearId
// @access  Public
const getClassesByAcademicYear = async (req, res) => {
  try {
    const classes = await Class.find({
      academicYearId: req.params.academicYearId,
      isActive: true
    })
      .populate('subjectId', 'code name credits soTietLyThuyet soTietThucHanh coefficient')
      .sort('code');

    res.json({
      success: true,
      count: classes.length,
      data: classes
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách lớp học theo năm học',
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
      subjectId,
      studentCount,
      maxStudents,
      schedule,
      classType,
      teachingMethod,
      description,
      notes
    } = req.body;

    // Auto-generate code if not provided
    let finalCode = code;
    if (!finalCode) {
      const subject = await Subject.findById(subjectId);
      if (subject) {
        const existingClasses = await Class.find({ subjectId });
        const classNumber = existingClasses.length + 1;
        finalCode = `${subject.code}.${classNumber.toString().padStart(2, '0')}`;
      }
    }

    const classData = {
      code: finalCode,
      name,
      subjectId,
      studentCount,
      maxStudents,
      schedule,
      classType,
      teachingMethod,
      description,
      notes
    };

    const newClass = await Class.create(classData);
    
    // Populate the created class
    await newClass.populate('subjectId', 'code name credits coefficient soTietLyThuyet soTietThucHanh');

    res.status(201).json({
      success: true,
      message: 'Tạo lớp học phần thành công',
      data: newClass
    });
  } catch (error) {
    
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Mã lớp học phần đã tồn tại'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo lớp học phần',
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
    const { academicYearId } = req.query;
    
    // Build filter
    const filter = { isActive: true };
    if (academicYearId) {
      filter.academicYearId = academicYearId;
    }

    // Get all classes with populated subject data
    const classes = await Class.find(filter)
      .populate({
        path: 'subjectId',
        select: 'code name credits departmentId',
        populate: {
          path: 'departmentId',
          select: 'name code'
        }
      })
      .sort('code');

    res.json({
      success: true,
      data: classes
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê lớp học',
      error: error.message
    });
  }
};

// Helper function to check schedule conflicts
const checkScheduleConflicts = async (newSchedule, academicYearId, teacherId, excludeClassId = null) => {
  const filter = {
    academicYearId,
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
  getClassesByAcademicYear,
  getClassStatistics
}; 
