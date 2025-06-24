const PeriodRate = require('../models/PeriodRate');
const AcademicYear = require('../models/AcademicYear');

// @desc    Get all period rates for academic year
// @route   GET /api/period-rates
// @access  Private
const getPeriodRates = async (req, res) => {
  try {
    const { academicYearId } = req.query;
    
    if (!academicYearId) {
      return res.status(400).json({
        success: false,
        message: 'Năm học là bắt buộc'
      });
    }

    const rates = await PeriodRate.getByAcademicYear(academicYearId);
    
    res.json({
      success: true,
      data: rates,
      count: rates.length
    });
  } catch (error) {
    console.error('Error getting period rates:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách định mức'
    });
  }
};

// @desc    Get current active period rate
// @route   GET /api/period-rates/current
// @access  Private
const getCurrentRate = async (req, res) => {
  try {
    const { academicYearId } = req.query;
    
    if (!academicYearId) {
      return res.status(400).json({
        success: false,
        message: 'Năm học là bắt buộc'
      });
    }

    const currentRate = await PeriodRate.getCurrentRate(academicYearId);
    
    res.json({
      success: true,
      data: currentRate
    });
  } catch (error) {
    console.error('Error getting current rate:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy định mức hiện tại'
    });
  }
};

// @desc    Get period rate statistics
// @route   GET /api/period-rates/statistics
// @access  Private
const getStatistics = async (req, res) => {
  try {
    const { academicYearId } = req.query;
    
    if (!academicYearId) {
      return res.status(400).json({
        success: false,
        message: 'Năm học là bắt buộc'
      });
    }

    const [totalRates, activeRates, currentRate, highestRate] = await Promise.all([
      PeriodRate.countDocuments({ academicYearId }),
      PeriodRate.countDocuments({ academicYearId, isActive: true }),
      PeriodRate.getCurrentRate(academicYearId),
      PeriodRate.findOne({ academicYearId }).sort({ ratePerPeriod: -1 })
    ]);

    const statistics = {
      totalRates,
      activeRates,
      currentRate: currentRate ? currentRate.ratePerPeriod : 0,
      highestRate: highestRate ? highestRate.ratePerPeriod : 0
    };

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê'
    });
  }
};

// @desc    Get single period rate
// @route   GET /api/period-rates/:id
// @access  Private
const getPeriodRate = async (req, res) => {
  try {
    const rate = await PeriodRate.findById(req.params.id)
      .populate('academicYearId', 'name code');

    if (!rate) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy định mức'
      });
    }

    res.json({
      success: true,
      data: rate
    });
  } catch (error) {
    console.error('Error getting period rate:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin định mức'
    });
  }
};

// @desc    Create new period rate
// @route   POST /api/period-rates
// @access  Private
const createPeriodRate = async (req, res) => {
  try {
    const { name, ratePerPeriod, academicYearId, effectiveDate, description } = req.body;

    // Validate required fields
    if (!name || !ratePerPeriod || !academicYearId) {
      return res.status(400).json({
        success: false,
        message: 'Tên, giá tiền mỗi tiết và năm học là bắt buộc'
      });
    }

    // Validate academic year exists
    const academicYear = await AcademicYear.findById(academicYearId);
    if (!academicYear) {
      return res.status(400).json({
        success: false,
        message: 'Năm học không tồn tại'
      });
    }

    // Create period rate
    const rate = await PeriodRate.create({
      name,
      ratePerPeriod,
      academicYearId,
      effectiveDate: effectiveDate || new Date(),
      description,
      createdBy: req.user ? req.user._id : null
    });

    // Populate academic year info
    await rate.populate('academicYearId', 'name code');

    res.status(201).json({
      success: true,
      data: rate,
      message: 'Tạo định mức thành công'
    });
  } catch (error) {
    console.error('Error creating period rate:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo định mức'
    });
  }
};

// @desc    Update period rate
// @route   PUT /api/period-rates/:id
// @access  Private
const updatePeriodRate = async (req, res) => {
  try {
    const { name, ratePerPeriod, effectiveDate, endDate, description, isActive } = req.body;

    const rate = await PeriodRate.findById(req.params.id);

    if (!rate) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy định mức'
      });
    }

    // Update fields
    if (name !== undefined) rate.name = name;
    if (ratePerPeriod !== undefined) rate.ratePerPeriod = ratePerPeriod;
    if (effectiveDate !== undefined) rate.effectiveDate = effectiveDate;
    if (endDate !== undefined) rate.endDate = endDate;
    if (description !== undefined) rate.description = description;
    if (isActive !== undefined) rate.isActive = isActive;
    
    rate.updatedBy = req.user ? req.user._id : null;

    await rate.save();
    await rate.populate('academicYearId', 'name code');

    res.json({
      success: true,
      data: rate,
      message: 'Cập nhật định mức thành công'
    });
  } catch (error) {
    console.error('Error updating period rate:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật định mức'
    });
  }
};

// @desc    Delete period rate
// @route   DELETE /api/period-rates/:id
// @access  Private
const deletePeriodRate = async (req, res) => {
  try {
    const rate = await PeriodRate.findById(req.params.id);

    if (!rate) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy định mức'
      });
    }

    await rate.remove();

    res.json({
      success: true,
      message: 'Xóa định mức thành công'
    });
  } catch (error) {
    console.error('Error deleting period rate:', error);
    
    if (error.message.includes('đang được sử dụng')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa định mức'
    });
  }
};

// @desc    Activate period rate
// @route   PUT /api/period-rates/:id/activate
// @access  Private
const activatePeriodRate = async (req, res) => {
  try {
    const rate = await PeriodRate.findById(req.params.id);

    if (!rate) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy định mức'
      });
    }

    rate.isActive = true;
    rate.updatedBy = req.user ? req.user._id : null;
    
    await rate.save();
    await rate.populate('academicYearId', 'name code');

    res.json({
      success: true,
      data: rate,
      message: 'Kích hoạt định mức thành công'
    });
  } catch (error) {
    console.error('Error activating period rate:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi kích hoạt định mức'
    });
  }
};

// @desc    Deactivate period rate
// @route   PUT /api/period-rates/:id/deactivate
// @access  Private
const deactivatePeriodRate = async (req, res) => {
  try {
    const rate = await PeriodRate.findById(req.params.id);

    if (!rate) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy định mức'
      });
    }

    rate.isActive = false;
    rate.endDate = new Date();
    rate.updatedBy = req.user ? req.user._id : null;
    
    await rate.save();
    await rate.populate('academicYearId', 'name code');

    res.json({
      success: true,
      data: rate,
      message: 'Ngừng kích hoạt định mức thành công'
    });
  } catch (error) {
    console.error('Error deactivating period rate:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi ngừng kích hoạt định mức'
    });
  }
};

module.exports = {
  getPeriodRates,
  getCurrentRate,
  getStatistics,
  getPeriodRate,
  createPeriodRate,
  updatePeriodRate,
  deletePeriodRate,
  activatePeriodRate,
  deactivatePeriodRate
}; 