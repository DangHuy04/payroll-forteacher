const AcademicYear = require('../models/AcademicYear');
const Semester = require('../models/Semester');
const { validationResult } = require('express-validator');

// @desc    Get all academic years
// @route   GET /api/academic-years
// @access  Public
const getAllAcademicYears = async (req, res) => {
  try {
    const {
      isActive = true,
      includeStats = false,
      page = 1,
      limit = 50,
      sort = '-startYear'
    } = req.query;

    // Build filter
    const filter = {};
    // Handle isActive filter - default to true if not specified
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true' || isActive === true;
    } else {
      filter.isActive = true; // Default to active academic years only
    }

    let query;
    
    if (includeStats === 'true') {
      // Use aggregation for statistics
      const academicYears = await AcademicYear.aggregate([
        {
          $lookup: {
            from: 'semesters',
            localField: '_id',
            foreignField: 'academicYearId',
            as: 'semesters'
          }
        },
        {
          $addFields: {
            semesterCount: { $size: '$semesters' },
            activeSemesters: {
              $size: {
                $filter: {
                  input: '$semesters',
                  as: 'semester',
                  cond: { $eq: ['$$semester.isActive', true] }
                }
              }
            }
          }
        }
      ]);
      return res.json({
        success: true,
        count: academicYears.length,
        data: academicYears
      });
    }

    // Regular query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    query = AcademicYear.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const academicYears = await query;
    const total = await AcademicYear.countDocuments(filter);

    res.json({
      success: true,
      count: academicYears.length,
      total,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      },
      data: academicYears
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách năm học',
      error: error.message
    });
  }
};

// @desc    Get current academic year
// @route   GET /api/academic-years/current
// @access  Public
const getCurrentAcademicYear = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentAcademicYear = await AcademicYear.findOne({
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
      isActive: true
    }).populate('currentSemester');

    if (!currentAcademicYear) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy năm học hiện tại'
      });
    }

    res.json({
      success: true,
      data: currentAcademicYear
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin năm học hiện tại',
      error: error.message
    });
  }
};

// @desc    Get academic year by ID
// @route   GET /api/academic-years/:id
// @access  Public
const getAcademicYearById = async (req, res) => {
  try {
    const academicYear = await AcademicYear.findById(req.params.id)
      .populate({
        path: 'semesters',
        select: 'code name startDate endDate status isActive',
        options: { sort: { startDate: 1 } }
      });

    if (!academicYear) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy năm học'
      });
    }

    res.json({
      success: true,
      data: academicYear
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin năm học',
      error: error.message
    });
  }
};

// @desc    Get academic year by code
// @route   GET /api/academic-years/code/:code
// @access  Public
const getAcademicYearByCode = async (req, res) => {
  try {
    const academicYear = await AcademicYear.findOne({ code: req.params.code })
      .populate({
        path: 'semesters',
        select: 'code name startDate endDate status isActive',
        options: { sort: { startDate: 1 } }
      });

    if (!academicYear) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy năm học'
      });
    }

    res.json({
      success: true,
      data: academicYear
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin năm học',
      error: error.message
    });
  }
};

// @desc    Create new academic year
// @route   POST /api/academic-years
// @access  Private
const createAcademicYear = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { code, name, startDate, endDate } = req.body;

    // Check if academic year already exists
    const existingYear = await AcademicYear.findOne({ code });
    if (existingYear) {
      return res.status(400).json({
        success: false,
        message: 'Năm học đã tồn tại'
      });
    }

    // Create new academic year
    const academicYear = await AcademicYear.create({
      code,
      name,
      startDate,
      endDate,
      isActive: true
    });

    res.status(201).json({
      success: true,
      data: academicYear
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo năm học mới',
      error: error.message
    });
  }
};

// @desc    Update academic year
// @route   PUT /api/academic-years/:id
// @access  Private
const updateAcademicYear = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, startDate, endDate } = req.body;

    const academicYear = await AcademicYear.findById(req.params.id);
    if (!academicYear) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy năm học'
      });
    }

    // Update fields
    academicYear.name = name || academicYear.name;
    academicYear.startDate = startDate || academicYear.startDate;
    academicYear.endDate = endDate || academicYear.endDate;

    const updatedAcademicYear = await academicYear.save();

    res.json({
      success: true,
      data: updatedAcademicYear
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật năm học',
      error: error.message
    });
  }
};

// @desc    Toggle academic year status
// @route   PATCH /api/academic-years/:id/toggle-status
// @access  Private
const toggleAcademicYearStatus = async (req, res) => {
  try {
    const academicYear = await AcademicYear.findById(req.params.id);
    if (!academicYear) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy năm học'
      });
    }

    academicYear.isActive = !academicYear.isActive;
    const updatedAcademicYear = await academicYear.save();

    res.json({
      success: true,
      data: updatedAcademicYear
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thay đổi trạng thái năm học',
      error: error.message
    });
  }
};

// @desc    Delete academic year
// @route   DELETE /api/academic-years/:id
// @access  Private
const deleteAcademicYear = async (req, res) => {
  try {
    const academicYear = await AcademicYear.findById(req.params.id);
    if (!academicYear) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy năm học'
      });
    }

    // Check if there are any semesters associated with this academic year
    const semesterCount = await Semester.countDocuments({ academicYearId: academicYear._id });
    if (semesterCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa năm học đã có học kỳ'
      });
    }

    await academicYear.remove();

    res.json({
      success: true,
      message: 'Đã xóa năm học thành công'
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa năm học',
      error: error.message
    });
  }
};

// @desc    Get academic year statistics
// @route   GET /api/academic-years/statistics
// @access  Public
const getAcademicYearStatistics = async (req, res) => {
  try {
    const stats = await AcademicYear.aggregate([
      {
        $lookup: {
          from: 'semesters',
          localField: '_id',
          foreignField: 'academicYearId',
          as: 'semesters'
        }
      },
      {
        $group: {
          _id: null,
          totalYears: { $sum: 1 },
          activeYears: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          totalSemesters: { $sum: { $size: '$semesters' } },
          activeSemesters: {
            $sum: {
              $size: {
                $filter: {
                  input: '$semesters',
                  as: 'semester',
                  cond: { $eq: ['$$semester.isActive', true] }
                }
              }
            }
          },
          averageSemestersPerYear: { $avg: { $size: '$semesters' } }
        }
      }
    ]);

    const yearlyStats = await AcademicYear.aggregate([
      {
        $lookup: {
          from: 'semesters',
          localField: '_id',
          foreignField: 'academicYearId',
          as: 'semesters'
        }
      },
      {
        $project: {
          _id: 1,
          code: 1,
          name: 1,
          isActive: 1,
          semesterCount: { $size: '$semesters' },
          activeSemesters: {
            $size: {
              $filter: {
                input: '$semesters',
                as: 'semester',
                cond: { $eq: ['$$semester.isActive', true] }
              }
            }
          }
        }
      },
      { $sort: { code: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        summary: stats[0] || {},
        yearlyStats
      }
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê năm học',
      error: error.message
    });
  }
};

module.exports = {
  getAllAcademicYears,
  getAcademicYearById,
  getAcademicYearByCode,
  getCurrentAcademicYear,
  createAcademicYear,
  updateAcademicYear,
  toggleAcademicYearStatus,
  deleteAcademicYear,
  getAcademicYearStatistics
}; 
