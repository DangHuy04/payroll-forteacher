const mongoose = require('mongoose');
const RateSetting = require('../models/RateSetting');
const Department = require('../models/Department');
const Degree = require('../models/Degree');
const Subject = require('../models/Subject');
const { validationResult } = require('express-validator');
const Rate = require('../models/Rate');

// @desc    Get all rate settings
// @route   GET /api/rate-settings
// @access  Public
const getRateSettings = async (req, res) => {
  try {
    const {
      academicYearId,
      semesterId,
      rateType,
      isActive = true,
      page = 1,
      limit = 50,
      sort = '-effectiveDate'
    } = req.query;

    // Build filter
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (academicYearId) filter.academicYearId = academicYearId;
    if (semesterId) filter.semesterId = semesterId;
    if (rateType) filter.rateType = rateType;

    // Regular query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const query = RateSetting.find(filter)
      .populate('academicYear', 'code name')
      .populate('semester', 'code name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const rateSettings = await query;
    const total = await RateSetting.countDocuments(filter);

    res.json({
      success: true,
      count: rateSettings.length,
      total,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      },
      data: rateSettings
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách cài đặt đơn giá',
      error: error.message
    });
  }
};

// @desc    Get rate setting by ID
// @route   GET /api/rate-settings/:id
// @access  Public
const getRateSetting = async (req, res) => {
  try {
    const rateSetting = await RateSetting.findById(req.params.id)
      .populate('academicYear', 'code name startYear endYear')
      .populate('semester', 'code name startDate endDate');

    if (!rateSetting) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cài đặt đơn giá'
      });
    }

    res.json({
      success: true,
      data: rateSetting
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin cài đặt đơn giá',
      error: error.message
    });
  }
};

// @desc    Create new rate setting
// @route   POST /api/rate-settings
// @access  Private
const createRateSetting = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      academicYearId,
      semesterId,
      rateType,
      baseRate,
      overtimeRate,
      holidayRate,
      effectiveDate,
      description
    } = req.body;

    // Check if there's an existing active rate setting for the same type and period
    const existingRate = await RateSetting.findOne({
      academicYearId,
      semesterId,
      rateType,
      isActive: true,
      effectiveDate: { $lte: new Date(effectiveDate) }
    });

    if (existingRate) {
      return res.status(400).json({
        success: false,
        message: 'Đã tồn tại cài đặt đơn giá cho loại và thời gian này'
      });
    }

    // Create new rate setting
    const rateSetting = await RateSetting.create({
      academicYearId,
      semesterId,
      rateType,
      baseRate,
      overtimeRate,
      holidayRate,
      effectiveDate,
      description,
      isActive: true
    });

    res.status(201).json({
      success: true,
      data: rateSetting
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo cài đặt đơn giá mới',
      error: error.message
    });
  }
};

// @desc    Update rate setting
// @route   PUT /api/rate-settings/:id
// @access  Private
const updateRateSetting = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      baseRate,
      overtimeRate,
      holidayRate,
      effectiveDate,
      description,
      isActive
    } = req.body;

    const rateSetting = await RateSetting.findById(req.params.id);
    if (!rateSetting) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cài đặt đơn giá'
      });
    }

    // Check if there's another active rate setting for the same type and period
    if (effectiveDate) {
      const existingRate = await RateSetting.findOne({
        academicYearId: rateSetting.academicYearId,
        semesterId: rateSetting.semesterId,
        rateType: rateSetting.rateType,
        _id: { $ne: rateSetting._id },
        isActive: true,
        effectiveDate: { $lte: new Date(effectiveDate) }
      });

      if (existingRate) {
        return res.status(400).json({
          success: false,
          message: 'Đã tồn tại cài đặt đơn giá cho loại và thời gian này'
        });
      }
    }

    // Update fields
    if (baseRate !== undefined) rateSetting.baseRate = baseRate;
    if (overtimeRate !== undefined) rateSetting.overtimeRate = overtimeRate;
    if (holidayRate !== undefined) rateSetting.holidayRate = holidayRate;
    if (effectiveDate) rateSetting.effectiveDate = effectiveDate;
    if (description !== undefined) rateSetting.description = description;
    if (isActive !== undefined) rateSetting.isActive = isActive;

    const updatedRateSetting = await rateSetting.save();

    res.json({
      success: true,
      data: updatedRateSetting
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật cài đặt đơn giá',
      error: error.message
    });
  }
};

// @desc    Delete rate setting
// @route   DELETE /api/rate-settings/:id
// @access  Private
const deleteRateSetting = async (req, res) => {
  try {
    const rateSetting = await RateSetting.findById(req.params.id);
    if (!rateSetting) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cài đặt đơn giá'
      });
    }

    // Check if rate setting is being used
    // TODO: Add check for salary calculations using this rate

    await rateSetting.remove();

    res.json({
      success: true,
      message: 'Đã xóa cài đặt đơn giá thành công'
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa cài đặt đơn giá',
      error: error.message
    });
  }
};

// @desc    Get active rate by type
// @route   GET /api/rate-settings/active/:rateType
// @access  Public
const getActiveRate = async (req, res) => {
  try {
    const { rateType } = req.params;
    const { academicYearId, semesterId, date = new Date() } = req.query;

    const rateSetting = await RateSetting.findOne({
      academicYearId,
      semesterId,
      rateType,
      isActive: true,
      effectiveDate: { $lte: new Date(date) }
    })
      .sort('-effectiveDate')
      .populate('academicYear', 'code name')
      .populate('semester', 'code name');

    if (!rateSetting) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cài đặt đơn giá đang có hiệu lực'
      });
    }

    res.json({
      success: true,
      data: rateSetting
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy đơn giá đang có hiệu lực',
      error: error.message
    });
  }
};

// @desc    Get rate settings by academic year
// @route   GET /api/rate-settings/academic-year/:academicYearId
// @access  Public
const getRatesByAcademicYear = async (req, res) => {
  try {
    const { academicYearId } = req.params;
    const { isActive = true } = req.query;

    const filter = {
      academicYearId,
      isActive: isActive === 'true'
    };

    const rateSettings = await RateSetting.find(filter)
      .populate('academicYear', 'code name')
      .populate('semester', 'code name')
      .sort('-effectiveDate');

    res.json({
      success: true,
      count: rateSettings.length,
      data: rateSettings
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách đơn giá theo năm học',
      error: error.message
    });
  }
};

// @desc    Get rate settings by semester
// @route   GET /api/rate-settings/semester/:semesterId
// @access  Public
const getRatesBySemester = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const { isActive = true } = req.query;

    const filter = {
      semesterId,
      isActive: isActive === 'true'
    };

    const rateSettings = await RateSetting.find(filter)
      .populate('academicYear', 'code name')
      .populate('semester', 'code name')
      .sort('-effectiveDate');

    res.json({
      success: true,
      count: rateSettings.length,
      data: rateSettings
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách đơn giá theo học kỳ',
      error: error.message
    });
  }
};

// @desc    Get all rates
// @route   GET /api/rates
const getRates = async (req, res) => {
  try {
    const rates = await Rate.find()
      .populate('semesterId', 'name startDate endDate');
    res.json(rates);
  } catch (err) {
    
    res.status(500).send('Lỗi server');
  }
};

// @desc    Get rate by ID
// @route   GET /api/rates/:id
const getRate = async (req, res) => {
  try {
    const rate = await Rate.findById(req.params.id)
      .populate('semesterId', 'name startDate endDate');
    
    if (!rate) {
      return res.status(404).json({ msg: 'Không tìm thấy hệ số' });
    }
    
    res.json(rate);
  } catch (err) {
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Không tìm thấy hệ số' });
    }
    res.status(500).send('Lỗi server');
  }
};

// @desc    Create new rate
// @route   POST /api/rates
const createRate = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { rateType, value, effectiveDate, semesterId } = req.body;

    // Check for existing rate of same type in semester
    const existingRate = await Rate.findOne({
      rateType,
      semesterId,
      effectiveDate: {
        $lte: new Date(effectiveDate)
      }
    });

    if (existingRate) {
      return res.status(400).json({ msg: 'Hệ số này đã tồn tại trong học kỳ' });
    }

    const newRate = new Rate({
      rateType,
      value,
      effectiveDate,
      semesterId
    });

    const rate = await newRate.save();
    res.json(rate);
  } catch (err) {
    
    res.status(500).send('Lỗi server');
  }
};

// @desc    Update rate
// @route   PUT /api/rates/:id
const updateRate = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const rate = await Rate.findById(req.params.id);
    if (!rate) {
      return res.status(404).json({ msg: 'Không tìm thấy hệ số' });
    }

    // Update fields
    const updateFields = {};
    if (req.body.value) updateFields.value = req.body.value;
    if (req.body.effectiveDate) updateFields.effectiveDate = req.body.effectiveDate;

    const updatedRate = await Rate.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    res.json(updatedRate);
  } catch (err) {
    
    res.status(500).send('Lỗi server');
  }
};

// @desc    Delete rate
// @route   DELETE /api/rates/:id
const deleteRate = async (req, res) => {
  try {
    const rate = await Rate.findById(req.params.id);
    if (!rate) {
      return res.status(404).json({ msg: 'Không tìm thấy hệ số' });
    }

    await rate.remove();
    res.json({ msg: 'Đã xóa hệ số' });
  } catch (err) {
    
    res.status(500).send('Lỗi server');
  }
};

// @desc    Get rates by period
// @route   GET /api/rates/period/:semesterId
const getRatesByPeriod = async (req, res) => {
  try {
    const rates = await Rate.find({ semesterId: req.params.semesterId })
      .populate('semesterId', 'name startDate endDate')
      .sort({ effectiveDate: -1 });
    res.json(rates);
  } catch (err) {
    
    res.status(500).send('Lỗi server');
  }
};

// @desc    Get rate statistics
// @route   GET /api/rates/statistics
const getRateStatistics = async (req, res) => {
  try {
    const totalRates = await Rate.countDocuments();
    const ratesByType = await Rate.aggregate([
      {
        $group: {
          _id: '$rateType',
          count: { $sum: 1 },
          avgValue: { $avg: '$value' },
          minValue: { $min: '$value' },
          maxValue: { $max: '$value' }
        }
      }
    ]);

    res.json({
      totalRates,
      ratesByType
    });
  } catch (err) {
    
    res.status(500).send('Lỗi server');
  }
};

module.exports = {
  getRateSettings,
  getRateSetting,
  createRateSetting,
  updateRateSetting,
  deleteRateSetting,
  getActiveRate,
  getRatesByAcademicYear,
  getRatesBySemester,
  getRates,
  getRate,
  createRate,
  updateRate,
  deleteRate,
  getRatesByPeriod,
  getRateStatistics
}; 
