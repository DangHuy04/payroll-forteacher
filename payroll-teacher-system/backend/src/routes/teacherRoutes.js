const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeacherStatistics
} = require('../controllers/teacherController');

const router = express.Router();

// Validation middleware
const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('ID không hợp lệ')
];

const createTeacherValidation = [
  body('code')
    .notEmpty()
    .withMessage('Mã giáo viên là bắt buộc')
    .isLength({ min: 2, max: 20 })
    .withMessage('Mã giáo viên phải có độ dài từ 2-20 ký tự')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Mã giáo viên chỉ được chứa chữ cái hoa và số'),
  body('fullName')
    .notEmpty()
    .withMessage('Họ tên là bắt buộc')
    .isLength({ min: 2, max: 100 })
    .withMessage('Họ tên phải có độ dài từ 2-100 ký tự'),
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  body('phone')
    .isMobilePhone('vi-VN')
    .withMessage('Số điện thoại không hợp lệ'),
  body('departmentId')
    .isMongoId()
    .withMessage('ID khoa không hợp lệ'),
  body('degreeId')
    .isMongoId()
    .withMessage('ID bằng cấp không hợp lệ'),
  body('position')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Chức vụ không được quá 100 ký tự'),
  body('gender')
    .isIn(['Nam', 'Nữ', 'Khác'])
    .withMessage('Giới tính không hợp lệ'),
  body('birthDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày sinh không hợp lệ')
    .toDate(),
  body('hireDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày vào làm không hợp lệ')
    .toDate(),
  body('identityNumber')
    .optional()
    .isLength({ min: 9, max: 12 })
    .withMessage('CCCD/CMND phải có độ dài từ 9-12 ký tự')
    .isNumeric()
    .withMessage('CCCD/CMND chỉ được chứa số'),
  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Địa chỉ không được quá 500 ký tự')
];

// Routes
router.get('/', getAllTeachers);
router.get('/statistics', getTeacherStatistics);
router.get('/:id', idValidation, getTeacherById);

router.post('/', createTeacherValidation, createTeacher);
router.put('/:id', idValidation, updateTeacher);
router.delete('/:id', idValidation, deleteTeacher);

module.exports = router; 