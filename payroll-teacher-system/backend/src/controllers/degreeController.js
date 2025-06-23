const Degree = require('../models/Degree');
const { validationResult } = require('express-validator');

// @desc    Get all degrees
// @route   GET /api/degrees
// @access  Public
const getDegrees = async (req, res) => {
  try {
    const { active } = req.query;
    
    let degrees;
    if (active === 'true') {
      degrees = await Degree.getActive();
    } else {
      degrees = await Degree.find().sort({ priority: -1, name: 1 });
    }

    res.json({
      success: true,
      count: degrees.length,
      data: degrees
    });
  } catch (error) {
    console.error('Get degrees error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách bằng cấp',
      error: error.message
    });
  }
};

// @desc    Get single degree
// @route   GET /api/degrees/:id
// @access  Public
const getDegree = async (req, res) => {
  try {
    const degree = await Degree.findById(req.params.id).populate('teacherCount');
    
    if (!degree) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bằng cấp'
      });
    }

    res.json({
      success: true,
      data: degree
    });
  } catch (error) {
    console.error('Get degree error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bằng cấp'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin bằng cấp',
      error: error.message
    });
  }
};

// @desc    Create new degree
// @route   POST /api/degrees
// @access  Private
const createDegree = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const { code, name, coefficient, description } = req.body;

    // Check if degree code already exists
    const existingDegree = await Degree.findOne({ code: code.toUpperCase() });
    if (existingDegree) {
      return res.status(400).json({
        success: false,
        message: 'Mã bằng cấp đã tồn tại'
      });
    }

    const degree = await Degree.create({
      code,
      name,
      coefficient,
      description
    });

    res.status(201).json({
      success: true,
      message: 'Tạo bằng cấp thành công',
      data: degree
    });
  } catch (error) {
    console.error('Create degree error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Mã bằng cấp đã tồn tại'
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo bằng cấp',
      error: error.message
    });
  }
};

// @desc    Update degree
// @route   PUT /api/degrees/:id
// @access  Private
const updateDegree = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const { code, name, coefficient, description, isActive } = req.body;

    let degree = await Degree.findById(req.params.id);
    
    if (!degree) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bằng cấp'
      });
    }

    // Check if new code already exists (excluding current degree)
    if (code && code.toUpperCase() !== degree.code) {
      const existingDegree = await Degree.findOne({ 
        code: code.toUpperCase(),
        _id: { $ne: req.params.id }
      });
      
      if (existingDegree) {
        return res.status(400).json({
          success: false,
          message: 'Mã bằng cấp đã tồn tại'
        });
      }
    }

    // Update fields
    degree.code = code || degree.code;
    degree.name = name || degree.name;
    degree.coefficient = coefficient !== undefined ? coefficient : degree.coefficient;
    degree.description = description !== undefined ? description : degree.description;
    degree.isActive = isActive !== undefined ? isActive : degree.isActive;

    await degree.save();

    res.json({
      success: true,
      message: 'Cập nhật bằng cấp thành công',
      data: degree
    });
  } catch (error) {
    console.error('Update degree error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bằng cấp'
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật bằng cấp',
      error: error.message
    });
  }
};

// @desc    Delete degree
// @route   DELETE /api/degrees/:id
// @access  Private
const deleteDegree = async (req, res) => {
  try {
    const degree = await Degree.findById(req.params.id);
    
    if (!degree) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bằng cấp'
      });
    }

    await degree.deleteOne();

    res.json({
      success: true,
      message: 'Xóa bằng cấp thành công'
    });
  } catch (error) {
    console.error('Delete degree error:', error);
    
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bằng cấp'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi xóa bằng cấp'
    });
  }
};

// @desc    Get degree by code
// @route   GET /api/degrees/code/:code
// @access  Public
const getDegreeByCode = async (req, res) => {
  try {
    const degree = await Degree.findByCode(req.params.code);
    
    if (!degree) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bằng cấp'
      });
    }

    res.json({
      success: true,
      data: degree
    });
  } catch (error) {
    console.error('Get degree by code error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin bằng cấp',
      error: error.message
    });
  }
};

// @desc    Toggle degree status
// @route   PATCH /api/degrees/:id/toggle-status
// @access  Private
const toggleDegreeStatus = async (req, res) => {
  try {
    const degree = await Degree.findById(req.params.id);
    
    if (!degree) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bằng cấp'
      });
    }

    degree.isActive = !degree.isActive;
    await degree.save();

    res.json({
      success: true,
      message: `${degree.isActive ? 'Kích hoạt' : 'Vô hiệu hóa'} bằng cấp thành công`,
      data: degree
    });
  } catch (error) {
    console.error('Toggle degree status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thay đổi trạng thái bằng cấp',
      error: error.message
    });
  }
};

module.exports = {
  getDegrees,
  getDegree,
  createDegree,
  updateDegree,
  deleteDegree,
  getDegreeByCode,
  toggleDegreeStatus
}; 