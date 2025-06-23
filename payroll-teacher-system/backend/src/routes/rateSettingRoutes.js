const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const {
  getRates,
  getRate,
  createRate,
  updateRate,
  deleteRate,
  getRatesByPeriod,
  getRateStatistics
} = require('../controllers/rateSettingController');

// Validation middleware for creating rate settings
const validateCreateRateSetting = [
  body('code')
    .notEmpty()
    .withMessage('Mã thiết lập lương là bắt buộc')
    .isLength({ max: 20 })
    .withMessage('Mã thiết lập lương không được quá 20 ký tự')
    .isAlphanumeric()
    .withMessage('Mã thiết lập lương chỉ được chứa ký tự và số'),
  
  body('name')
    .notEmpty()
    .withMessage('Tên thiết lập lương là bắt buộc')
    .isLength({ max: 200 })
    .withMessage('Tên thiết lập lương không được quá 200 ký tự'),
  
  body('rateType')
    .notEmpty()
    .withMessage('Loại lương là bắt buộc')
    .isIn(['base_hourly', 'base_monthly', 'overtime', 'bonus', 'allowance', 'coefficient'])
    .withMessage('Loại lương không hợp lệ'),
  
  body('applicableScope')
    .optional()
    .isIn(['university', 'department', 'position', 'degree', 'subject_type', 'class_type'])
    .withMessage('Phạm vi áp dụng không hợp lệ'),
  
  body('targetModel')
    .optional()
    .isIn(['Department', 'Degree', 'Subject'])
    .withMessage('Model đích không hợp lệ'),
  
  body('targetId')
    .optional()
    .isMongoId()
    .withMessage('ID đích không hợp lệ'),
  
  body('rateValues.baseAmount')
    .notEmpty()
    .withMessage('Mức lương cơ bản là bắt buộc')
    .isFloat({ min: 0 })
    .withMessage('Mức lương cơ bản phải là số dương'),
  
  body('rateValues.minimumRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Mức tối thiểu phải là số dương'),
  
  body('rateValues.maximumRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Mức tối đa phải là số dương'),
  
  body('rateValues.coefficient')
    .optional()
    .isFloat({ min: 0.1, max: 5.0 })
    .withMessage('Hệ số phải từ 0.1 đến 5.0'),
  
  body('rateValues.stepIncrement')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Bước tăng phải là số dương'),
  
  body('conditions.minimumExperience')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Kinh nghiệm tối thiểu phải là số nguyên dương'),
  
  body('conditions.minimumHours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Số giờ tối thiểu phải là số dương'),
  
  body('conditions.maximumHours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Số giờ tối đa phải là số dương'),
  
  body('conditions.minimumRating')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Đánh giá tối thiểu phải từ 0 đến 5'),
  
  body('effectivePeriod.startDate')
    .notEmpty()
    .withMessage('Ngày hiệu lực là bắt buộc')
    .isISO8601()
    .withMessage('Ngày hiệu lực không hợp lệ'),
  
  body('effectivePeriod.endDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày kết thúc không hợp lệ'),
  
  body('effectivePeriod.academicYearId')
    .optional()
    .isMongoId()
    .withMessage('ID năm học không hợp lệ'),
  
  body('effectivePeriod.semesterId')
    .optional()
    .isMongoId()
    .withMessage('ID học kỳ không hợp lệ'),
  
  body('priority')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Độ ưu tiên phải là số nguyên dương'),
  
  body('calculationFormula.formulaType')
    .optional()
    .isIn(['fixed', 'percentage', 'tiered', 'custom'])
    .withMessage('Loại công thức không hợp lệ'),
  
  body('calculationFormula.formulaExpression')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Biểu thức công thức không được quá 1000 ký tự'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Mô tả không được quá 1000 ký tự'),
  
  body('notes')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Ghi chú không được quá 2000 ký tự')
];

// Validation middleware for updating rate settings
const validateUpdateRateSetting = [
  body('name')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Tên thiết lập lương không được quá 200 ký tự'),
  
  body('rateType')
    .optional()
    .isIn(['base_hourly', 'base_monthly', 'overtime', 'bonus', 'allowance', 'coefficient'])
    .withMessage('Loại lương không hợp lệ'),
  
  body('applicableScope')
    .optional()
    .isIn(['university', 'department', 'position', 'degree', 'subject_type', 'class_type'])
    .withMessage('Phạm vi áp dụng không hợp lệ'),
  
  body('rateValues.baseAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Mức lương cơ bản phải là số dương'),
  
  body('rateValues.coefficient')
    .optional()
    .isFloat({ min: 0.1, max: 5.0 })
    .withMessage('Hệ số phải từ 0.1 đến 5.0'),
  
  body('effectivePeriod.startDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày hiệu lực không hợp lệ'),
  
  body('effectivePeriod.endDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày kết thúc không hợp lệ'),
  
  body('priority')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Độ ưu tiên phải là số nguyên dương')
];

// Validation middleware for MongoDB ObjectId parameters
const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('ID không hợp lệ')
];

// Validation middleware for rate calculation
const validateRateCalculation = [
  body('teacherData')
    .notEmpty()
    .withMessage('Thông tin giảng viên là bắt buộc')
    .isObject()
    .withMessage('Thông tin giảng viên phải là object'),
  
  body('assignmentData')
    .notEmpty()
    .withMessage('Thông tin phân công là bắt buộc')
    .isObject()
    .withMessage('Thông tin phân công phải là object'),
  
  body('assignmentData.teachingHours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Số giờ giảng dạy phải là số dương'),
  
  body('rateType')
    .optional()
    .isIn(['base_hourly', 'base_monthly', 'overtime', 'bonus', 'allowance', 'coefficient'])
    .withMessage('Loại lương không hợp lệ')
];

// Validation middleware for approval
const validateApproval = [
  body('approvalNotes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Ghi chú phê duyệt không được quá 500 ký tự')
];

// Validation middleware for query parameters
const validateQueryParams = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Trang phải là số nguyên dương'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Giới hạn phải từ 1 đến 100'),
  
  query('rateType')
    .optional()
    .isIn(['base_hourly', 'base_monthly', 'overtime', 'bonus', 'allowance', 'coefficient'])
    .withMessage('Loại lương không hợp lệ'),
  
  query('applicableScope')
    .optional()
    .isIn(['university', 'department', 'position', 'degree', 'subject_type', 'class_type'])
    .withMessage('Phạm vi áp dụng không hợp lệ'),
  
  query('status')
    .optional()
    .isIn(['draft', 'pending_approval', 'approved', 'active', 'inactive', 'superseded'])
    .withMessage('Trạng thái không hợp lệ'),
  
  query('sortBy')
    .optional()
    .isIn(['priority', 'createdAt', 'name', 'rateType', 'effectivePeriod.startDate'])
    .withMessage('Tiêu chí sắp xếp không hợp lệ'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Thứ tự sắp xếp không hợp lệ')
];

// Routes

// GET /api/rates - Get all rates
router.get('/', getRates);

// GET /api/rates/:id - Get rate by ID
router.get('/:id', getRate);

// GET /api/rates/period/:semesterId - Get rates by semester
router.get('/period/:semesterId', getRatesByPeriod);

// GET /api/rates/statistics - Get rate statistics
router.get('/statistics', getRateStatistics);

// POST /api/rates - Create new rate
router.post('/', validateCreateRateSetting, createRate);

// PUT /api/rates/:id - Update rate
router.put('/:id', validateObjectId, validateUpdateRateSetting, updateRate);

// DELETE /api/rates/:id - Delete rate
router.delete('/:id', validateObjectId, deleteRate);

module.exports = router; 