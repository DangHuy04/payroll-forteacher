const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getAllDepartments,
  getDepartmentById,
  getDepartmentByCode,
  createDepartment,
  updateDepartment,
  toggleDepartmentStatus,
  deleteDepartment,
  getDepartmentStatistics,
  getTeachersByDepartment
} = require('../controllers/departmentController');

const router = express.Router();

// Validation middleware
const createDepartmentValidation = [
  body('code')
    .notEmpty()
    .withMessage('Mã khoa là bắt buộc')
    .isLength({ min: 2, max: 10 })
    .withMessage('Mã khoa phải có độ dài từ 2-10 ký tự')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Mã khoa chỉ được chứa chữ cái hoa và số'),
  body('name')
    .notEmpty()
    .withMessage('Tên khoa là bắt buộc')
    .isLength({ min: 2, max: 200 })
    .withMessage('Tên khoa phải có độ dài từ 2-200 ký tự'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Mô tả không được quá 1000 ký tự'),
  body('headTeacherId')
    .optional()
    .isMongoId()
    .withMessage('ID trưởng khoa không hợp lệ'),
  body('establishedDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày thành lập không hợp lệ')
    .toDate(),
  body('phone')
    .optional()
    .isMobilePhone('vi-VN')
    .withMessage('Số điện thoại không hợp lệ'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Địa chỉ không được quá 500 ký tự')
];

const updateDepartmentValidation = [
  body('code')
    .optional()
    .isLength({ min: 2, max: 10 })
    .withMessage('Mã khoa phải có độ dài từ 2-10 ký tự')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Mã khoa chỉ được chứa chữ cái hoa và số'),
  body('name')
    .optional()
    .isLength({ min: 2, max: 200 })
    .withMessage('Tên khoa phải có độ dài từ 2-200 ký tự'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Mô tả không được quá 1000 ký tự'),
  body('headTeacherId')
    .optional()
    .isMongoId()
    .withMessage('ID trưởng khoa không hợp lệ'),
  body('establishedDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày thành lập không hợp lệ')
    .toDate(),
  body('phone')
    .optional()
    .isMobilePhone('vi-VN')
    .withMessage('Số điện thoại không hợp lệ'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Địa chỉ không được quá 500 ký tự')
];

const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID không hợp lệ')
];

const codeValidation = [
  param('code')
    .isLength({ min: 2, max: 10 })
    .withMessage('Mã khoa không hợp lệ')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Mã khoa chỉ được chứa chữ cái hoa và số')
];

// Routes
router.get('/', getAllDepartments);
router.get('/code/:code', codeValidation, getDepartmentByCode);
router.get('/:id', idValidation, getDepartmentById);
router.get('/:id/statistics', idValidation, getDepartmentStatistics);
router.get('/:id/teachers', idValidation, getTeachersByDepartment);

router.post('/', createDepartmentValidation, createDepartment);
router.put('/:id', idValidation, updateDepartmentValidation, updateDepartment);
router.patch('/:id/toggle-status', idValidation, toggleDepartmentStatus);
router.delete('/:id', idValidation, deleteDepartment);

module.exports = router; 