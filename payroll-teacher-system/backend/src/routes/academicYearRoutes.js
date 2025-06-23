const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getAllAcademicYears,
  getAcademicYearById,
  getAcademicYearByCode,
  getCurrentAcademicYear,
  createAcademicYear,
  updateAcademicYear,
  toggleAcademicYearStatus,
  deleteAcademicYear,
  getAcademicYearStatistics
} = require('../controllers/academicYearController');

const router = express.Router();

// Validation middleware
const createAcademicYearValidation = [
  body('startYear')
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Năm bắt đầu phải là số nguyên từ 2000 đến 2100'),
  body('endYear')
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Năm kết thúc phải là số nguyên từ 2000 đến 2100')
    .custom((value, { req }) => {
      if (value !== req.body.startYear + 1) {
        throw new Error('Năm kết thúc phải bằng năm bắt đầu + 1');
      }
      return true;
    }),
  body('startDate')
    .isISO8601()
    .withMessage('Ngày bắt đầu không hợp lệ')
    .toDate(),
  body('endDate')
    .isISO8601()
    .withMessage('Ngày kết thúc không hợp lệ')
    .toDate()
    .custom((value, { req }) => {
      if (value <= req.body.startDate) {
        throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
      }
      return true;
    }),
  body('status')
    .optional()
    .isIn(['planning', 'active', 'completed', 'archived'])
    .withMessage('Trạng thái không hợp lệ'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Mô tả không được quá 500 ký tự')
];

const updateAcademicYearValidation = [
  body('startYear')
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Năm bắt đầu phải là số nguyên từ 2000 đến 2100'),
  body('endYear')
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Năm kết thúc phải là số nguyên từ 2000 đến 2100'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày bắt đầu không hợp lệ')
    .toDate(),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày kết thúc không hợp lệ')
    .toDate(),
  body('status')
    .optional()
    .isIn(['planning', 'active', 'completed', 'archived'])
    .withMessage('Trạng thái không hợp lệ'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Mô tả không được quá 500 ký tự')
];

const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID không hợp lệ')
];

const codeValidation = [
  param('code')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Mã năm học phải có định dạng YYYY-YYYY')
];

// Routes
router.get('/', getAllAcademicYears);
router.get('/current', getCurrentAcademicYear);
router.get('/code/:code', codeValidation, getAcademicYearByCode);
router.get('/:id', idValidation, getAcademicYearById);
router.get('/:id/statistics', idValidation, getAcademicYearStatistics);

router.post('/', createAcademicYearValidation, createAcademicYear);
router.put('/:id', idValidation, updateAcademicYearValidation, updateAcademicYear);
router.patch('/:id/toggle-status', idValidation, toggleAcademicYearStatus);
router.delete('/:id', idValidation, deleteAcademicYear);

module.exports = router; 