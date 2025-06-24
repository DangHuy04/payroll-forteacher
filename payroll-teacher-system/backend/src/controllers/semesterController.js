const Semester = require('../models/Semester');
const AcademicYear = require('../models/AcademicYear');
const Class = require('../models/Class');
const { validationResult } = require('express-validator');

// @desc    Get all semesters
// @route   GET /api/semesters
// @access  Public
const getAllSemesters = async (req, res) => {
  try {
    const {
      academicYearId,
      status,
      isActive = true,
      includeStats = false,
      page = 1,
      limit = 50,
      sort = '-startDate'
    } = req.query;

    // Build filter
    const filter = {};
    // Handle isActive filter - default to true if not specified
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true' || isActive === true;
    } else {
      filter.isActive = true; // Default to active semesters only
    }
    if (academicYearId) filter.academicYearId = academicYearId;
    if (status) filter.status = status;

    let query;
    
    if (includeStats === 'true') {
      // Use aggregation for statistics
      const semesters = await Semester.aggregate([
        {
          $lookup: {
            from: 'classes',
            localField: '_id',
            foreignField: 'semesterId',
            as: 'classes'
          }
        },
        {
          $lookup: {
            from: 'teachingassignments',
            localField: '_id',
            foreignField: 'semesterId',
            as: 'assignments'
          }
        },
        {
          $addFields: {
            classCount: { $size: '$classes' },
            assignmentCount: { $size: '$assignments' },
            totalStudents: { $sum: '$classes.studentCount' }
          }
        }
      ]);
      return res.json({
        success: true,
        count: semesters.length,
        data: semesters
      });
    }

    // Regular query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    query = Semester.find(filter)
      .populate('academicYearId', 'code name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const semesters = await query;
    const total = await Semester.countDocuments(filter);

    res.json({
      success: true,
      count: semesters.length,
      total,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      },
      data: semesters
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách học kỳ',
      error: error.message
    });
  }
};

// @desc    Get current semester
// @route   GET /api/semesters/current
// @access  Public
const getCurrentSemester = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentSemester = await Semester.findOne({
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
      isActive: true
    }).populate('academicYearId', 'code name');

    if (!currentSemester) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học kỳ hiện tại'
      });
    }

    res.json({
      success: true,
      data: currentSemester
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin học kỳ hiện tại',
      error: error.message
    });
  }
};

// @desc    Get semester by ID
// @route   GET /api/semesters/:id
// @access  Public
const getSemesterById = async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id)
      .populate('academicYearId', 'code name');

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học kỳ'
      });
    }

    res.json({
      success: true,
      data: semester
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin học kỳ',
      error: error.message
    });
  }
};

// @desc    Get semesters by academic year
// @route   GET /api/semesters/academic-year/:academicYearId
// @access  Public
const getSemestersByAcademicYear = async (req, res) => {
  try {
    const semesters = await Semester.find({
      academicYearId: req.params.academicYearId,
      isActive: true
    })
      .populate('academicYearId', 'code name')
      .sort('startDate');

    res.json({
      success: true,
      count: semesters.length,
      data: semesters
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách học kỳ theo năm học',
      error: error.message
    });
  }
};

// @desc    Get upcoming semesters
// @route   GET /api/semesters/upcoming
// @access  Public
const getUpcomingSemesters = async (req, res) => {
  try {
    const currentDate = new Date();
    const upcomingSemesters = await Semester.find({
      startDate: { $gt: currentDate },
      isActive: true
    })
      .populate('academicYear', 'code name')
      .sort('startDate')
      .limit(5);

    res.json({
      success: true,
      count: upcomingSemesters.length,
      data: upcomingSemesters
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách học kỳ sắp tới',
      error: error.message
    });
  }
};

// @desc    Create new semester
// @route   POST /api/semesters
// @access  Private
const createSemester = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { code, name, academicYearId, startDate, endDate } = req.body;

    // Check if semester already exists
    const existingSemester = await Semester.findOne({
      $or: [
        { code, academicYearId },
        {
          academicYearId,
          $or: [
            {
              startDate: { $lte: startDate },
              endDate: { $gte: startDate }
            },
            {
              startDate: { $lte: endDate },
              endDate: { $gte: endDate }
            }
          ]
        }
      ]
    });

    if (existingSemester) {
      return res.status(400).json({
        success: false,
        message: 'Học kỳ đã tồn tại hoặc thời gian bị trùng lặp'
      });
    }

    // Create new semester
    const semester = await Semester.create({
      code,
      name,
      academicYearId,
      startDate,
      endDate,
      status: 'planning',
      isActive: true
    });

    res.status(201).json({
      success: true,
      data: semester
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo học kỳ mới',
      error: error.message
    });
  }
};

// @desc    Update semester
// @route   PUT /api/semesters/:id
// @access  Private
const updateSemester = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, startDate, endDate } = req.body;

    const semester = await Semester.findById(req.params.id);
    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học kỳ'
      });
    }

    // Check if semester can be updated
    if (semester.status === 'completed' || semester.status === 'archived') {
      return res.status(400).json({
        success: false,
        message: 'Không thể cập nhật học kỳ đã hoàn thành hoặc lưu trữ'
      });
    }

    // Update fields
    semester.name = name || semester.name;
    semester.startDate = startDate || semester.startDate;
    semester.endDate = endDate || semester.endDate;

    const updatedSemester = await semester.save();

    res.json({
      success: true,
      data: updatedSemester
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật học kỳ',
      error: error.message
    });
  }
};

// @desc    Toggle semester status
// @route   PATCH /api/semesters/:id/toggle-status
// @access  Private
const toggleSemesterStatus = async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id);
    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học kỳ'
      });
    }

    semester.isActive = !semester.isActive;
    const updatedSemester = await semester.save();

    res.json({
      success: true,
      data: updatedSemester
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thay đổi trạng thái học kỳ',
      error: error.message
    });
  }
};

// @desc    Update semester status
// @route   PATCH /api/semesters/:id/status
// @access  Private
const updateSemesterStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const semester = await Semester.findById(req.params.id);
    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học kỳ'
      });
    }

    // Validate status transition
    const validTransitions = {
      planning: ['registration'],
      registration: ['active', 'planning'],
      active: ['exam', 'registration'],
      exam: ['completed', 'active'],
      completed: ['archived'],
      archived: []
    };

    if (!validTransitions[semester.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái mới không hợp lệ'
      });
    }

    semester.status = status;
    const updatedSemester = await semester.save();

    res.json({
      success: true,
      data: updatedSemester
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái học kỳ',
      error: error.message
    });
  }
};

// @desc    Delete semester
// @route   DELETE /api/semesters/:id
// @access  Private
const deleteSemester = async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id);
    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học kỳ'
      });
    }

    // Check if there are any classes associated with this semester
    const classCount = await Class.countDocuments({ semesterId: semester._id });
    if (classCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa học kỳ đã có lớp học'
      });
    }

    await semester.remove();

    res.json({
      success: true,
      message: 'Đã xóa học kỳ thành công'
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa học kỳ',
      error: error.message
    });
  }
};

// @desc    Get semester statistics
// @route   GET /api/semesters/statistics
// @access  Public
const getSemesterStatistics = async (req, res) => {
  try {
    const stats = await Semester.aggregate([
      {
        $lookup: {
          from: 'classes',
          localField: '_id',
          foreignField: 'semesterId',
          as: 'classes'
        }
      },
      {
        $lookup: {
          from: 'teachingassignments',
          localField: '_id',
          foreignField: 'semesterId',
          as: 'assignments'
        }
      },
      {
        $group: {
          _id: null,
          totalSemesters: { $sum: 1 },
          activeSemesters: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          totalClasses: { $sum: { $size: '$classes' } },
          totalAssignments: { $sum: { $size: '$assignments' } },
          totalStudents: { $sum: { $sum: '$classes.studentCount' } },
          averageClassesPerSemester: { $avg: { $size: '$classes' } },
          semestersByStatus: {
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
          totalSemesters: 1,
          activeSemesters: 1,
          totalClasses: 1,
          totalAssignments: 1,
          totalStudents: 1,
          averageClassesPerSemester: 1,
          semestersByStatus: {
            $reduce: {
              input: '$semestersByStatus',
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

    const statusStats = await Semester.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          activeSemesters: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        summary: stats[0] || {},
        statusStats
      }
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê học kỳ',
      error: error.message
    });
  }
};

module.exports = {
  getAllSemesters,
  getSemesterById,
  getCurrentSemester,
  getSemestersByAcademicYear,
  getUpcomingSemesters,
  createSemester,
  updateSemester,
  toggleSemesterStatus,
  updateSemesterStatus,
  deleteSemester,
  getSemesterStatistics
}; 
