const Subject = require('../models/Subject');
const Department = require('../models/Department');
const { validationResult } = require('express-validator');

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Public
const getSubjects = async (req, res) => {
  try {
    const {
      departmentId,
      includeStats = false,
      page = 1,
      limit = 50,
      sort = 'code'
    } = req.query;

    // Build filter
    const filter = {};
    if (departmentId) filter.departmentId = departmentId;

    let query;
    
    if (includeStats === 'true') {
      // Use aggregation for statistics
      const subjects = await Subject.getWithStats();
      return res.json({
        success: true,
        count: subjects.length,
        data: subjects
      });
    }

    // Regular query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    query = Subject.find(filter)
      .populate('departmentId', 'code name')
      .populate('prerequisites', 'code name credits')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const subjects = await query;
    const total = await Subject.countDocuments(filter);

    res.json({
      success: true,
      count: subjects.length,
      total,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      },
      data: subjects
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách học phần',
      error: error.message
    });
  }
};

// @desc    Get single subject
// @route   GET /api/subjects/:id
// @access  Public
const getSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('departmentId', 'code name description')
      .populate('prerequisites', 'code name credits coefficient');

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học phần'
      });
    }

    res.json({
      success: true,
      data: subject
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin học phần',
      error: error.message
    });
  }
};

// @desc    Get subject by code
// @route   GET /api/subjects/code/:code
// @access  Public
const getSubjectByCode = async (req, res) => {
  try {
    const subject = await Subject.getByCode(req.params.code);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học phần'
      });
    }

    res.json({
      success: true,
      data: subject
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin học phần',
      error: error.message
    });
  }
};

// @desc    Create new subject
// @route   POST /api/subjects
// @access  Private
const createSubject = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const subject = await Subject.create(req.body);

    // Populate the created subject
    await subject.populate('departmentId', 'code name');
    
    res.status(201).json({
      success: true,
      message: 'Tạo học phần thành công',
      data: subject
    });
  } catch (error) {
    
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Mã học phần đã tồn tại'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo học phần',
      error: error.message
    });
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private
const updateSubject = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học phần'
      });
    }

    // Check if subject can be edited
    if (!subject.canDelete() && (req.body.code || req.body.departmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Không thể thay đổi mã học phần hoặc khoa quản lý khi đã có lớp học phần'
      });
    }

    const updatedSubject = await Subject.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('department', 'code name');

    res.json({
      success: true,
      message: 'Cập nhật học phần thành công',
      data: updatedSubject
    });
  } catch (error) {
    
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Mã học phần đã tồn tại'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật học phần',
      error: error.message
    });
  }
};

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private
const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học phần'
      });
    }

    // Check if subject can be deleted
    if (!subject.canDelete()) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa học phần này vì đã có lớp học phần sử dụng'
      });
    }

    await subject.deleteOne();

    res.json({
      success: true,
      message: 'Xóa học phần thành công'
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa học phần',
      error: error.message
    });
  }
};

// @desc    Get subjects by department
// @route   GET /api/subjects/department/:departmentId
// @access  Public
const getSubjectsByDepartment = async (req, res) => {
  try {
    const subjects = await Subject.getByDepartment(req.params.departmentId);

    res.json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách học phần theo khoa',
      error: error.message
    });
  }
};

// @desc    Get subject statistics
// @route   GET /api/subjects/statistics
// @access  Public
const getSubjectStatistics = async (req, res) => {
  try {
    const stats = await Subject.aggregate([
      {
        $group: {
          _id: null,
          totalSubjects: { $sum: 1 },
          totalCredits: { $sum: '$credits' },
          averageCredits: { $avg: '$credits' },
          averageCoefficient: { $avg: '$coefficient' },
          totalClasses: { $sum: '$metadata.totalClasses' },
          totalStudents: { $sum: '$metadata.totalStudents' }
        }
      }
    ]);

    const departmentStats = await Subject.aggregate([
      {
        $lookup: {
          from: 'departments',
          localField: 'departmentId',
          foreignField: '_id',
          as: 'department'
        }
      },
      {
        $group: {
          _id: '$departmentId',
          department: { $first: { $arrayElemAt: ['$department', 0] } },
          count: { $sum: 1 },
          totalCredits: { $sum: '$credits' },
          totalClasses: { $sum: '$metadata.totalClasses' },
          totalStudents: { $sum: '$metadata.totalStudents' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalSubjects: 0,
          totalCredits: 0,
          averageCredits: 0,
          averageCoefficient: 0,
          totalClasses: 0,
          totalStudents: 0
        },
        byDepartment: departmentStats
      }
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê học phần',
      error: error.message
    });
  }
};

module.exports = {
  getSubjects,
  getSubject,
  getSubjectByCode,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectsByDepartment,
  getSubjectStatistics
}; 
