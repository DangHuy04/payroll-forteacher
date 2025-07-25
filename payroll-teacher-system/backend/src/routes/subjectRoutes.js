const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getSubjects,
  getSubject,
  getSubjectByCode,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectsByDepartment,
  getSubjectStatistics
} = require('../controllers/subjectController');

const router = express.Router();

// Validation middleware
const validateSubjectCreation = [
  body('code')
    .notEmpty()
    .withMessage('Mã học phần là bắt buộc')
    .isLength({ min: 2, max: 15 })
    .withMessage('Mã học phần phải từ 2-15 ký tự')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Mã học phần chỉ được chứa chữ cái hoa và số'),
  
  body('name')
    .notEmpty()
    .withMessage('Tên học phần là bắt buộc')
    .isLength({ min: 2, max: 200 })
    .withMessage('Tên học phần phải từ 2-200 ký tự'),
  
  body('credits')
    .isFloat({ min: 1, max: 10 })
    .withMessage('Số tín chỉ phải từ 1-10')
    .custom((value) => {
      if (Number.isInteger(value) || value % 0.5 === 0) {
        return true;
      }
      throw new Error('Số tín chỉ phải là số nguyên hoặc số thập phân với bước 0.5');
    }),
  
  body('coefficient')
    .isFloat({ min: 0.5, max: 3.0 })
    .withMessage('Hệ số học phần phải từ 0.5-3.0'),
  
  body('soTietLyThuyet')
    .isInt({ min: 0, max: 150 })
    .withMessage('Số tiết lý thuyết phải từ 0-150'),
  
  body('soTietThucHanh')
    .isInt({ min: 0, max: 150 })
    .withMessage('Số tiết thực hành phải từ 0-150'),
  
  body('departmentId')
    .notEmpty()
    .withMessage('Khoa quản lý là bắt buộc')
    .isMongoId()
    .withMessage('Khoa quản lý không hợp lệ'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Mô tả không được quá 1000 ký tự'),
  
  body('prerequisites')
    .optional()
    .isArray()
    .withMessage('Học phần tiên quyết phải là mảng'),
  
  body('prerequisites.*')
    .optional()
    .isMongoId()
    .withMessage('Học phần tiên quyết không hợp lệ')
];

const validateSubjectUpdate = [
  body('code')
    .optional()
    .isLength({ min: 2, max: 15 })
    .withMessage('Mã học phần phải từ 2-15 ký tự')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Mã học phần chỉ được chứa chữ cái hoa và số'),
  
  body('name')
    .optional()
    .isLength({ min: 2, max: 200 })
    .withMessage('Tên học phần phải từ 2-200 ký tự'),
  
  body('credits')
    .optional()
    .isFloat({ min: 1, max: 10 })
    .withMessage('Số tín chỉ phải từ 1-10')
    .custom((value) => {
      if (Number.isInteger(value) || value % 0.5 === 0) {
        return true;
      }
      throw new Error('Số tín chỉ phải là số nguyên hoặc số thập phân với bước 0.5');
    }),
  
  body('coefficient')
    .optional()
    .isFloat({ min: 0.5, max: 3.0 })
    .withMessage('Hệ số học phần phải từ 0.5-3.0'),
  
  body('soTietLyThuyet')
    .optional()
    .isInt({ min: 0, max: 150 })
    .withMessage('Số tiết lý thuyết phải từ 0-150'),
  
  body('soTietThucHanh')
    .optional()
    .isInt({ min: 0, max: 150 })
    .withMessage('Số tiết thực hành phải từ 0-150'),
  
  body('departmentId')
    .optional()
    .isMongoId()
    .withMessage('Khoa quản lý không hợp lệ'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Mô tả không được quá 1000 ký tự'),
  
  body('prerequisites')
    .optional()
    .isArray()
    .withMessage('Học phần tiên quyết phải là mảng'),
  
  body('prerequisites.*')
    .optional()
    .isMongoId()
    .withMessage('Học phần tiên quyết không hợp lệ')
];

const validateMongoId = [
  param('id')
    .isMongoId()
    .withMessage('ID không hợp lệ')
];

const validateSubjectCode = [
  param('code')
    .notEmpty()
    .withMessage('Mã học phần là bắt buộc')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Mã học phần chỉ được chứa chữ cái hoa và số')
];

const validateDepartmentId = [
  param('departmentId')
    .isMongoId()
    .withMessage('ID khoa không hợp lệ')
];

// Routes

// @route   GET /api/subjects/statistics
// @desc    Get subject statistics
// @access  Public
router.get('/statistics', getSubjectStatistics);

// @route   GET /api/subjects/code/:code
// @desc    Get subject by code
// @access  Public
router.get('/code/:code', validateSubjectCode, getSubjectByCode);

// @route   GET /api/subjects/department/:departmentId
// @desc    Get subjects by department
// @access  Public
router.get('/department/:departmentId', validateDepartmentId, getSubjectsByDepartment);

// @route   GET /api/subjects/:id
// @desc    Get single subject
// @access  Public  
router.get('/:id', validateMongoId, getSubject);

// @route   GET /api/subjects
// @desc    Get all subjects
// @access  Public
router.get('/', getSubjects);

// @route   POST /api/subjects
// @desc    Create new subject
// @access  Private
router.post('/', validateSubjectCreation, createSubject);

// @route   PUT /api/subjects/:id
// @desc    Update subject
// @access  Private
router.put('/:id', validateMongoId, validateSubjectUpdate, updateSubject);

// @route   DELETE /api/subjects/:id
// @desc    Delete subject
// @access  Private
router.delete('/:id', validateMongoId, deleteSubject);

module.exports = router; 