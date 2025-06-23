const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const {
  getDegrees,
  getDegree,
  createDegree,
  updateDegree,
  deleteDegree,
  getDegreeByCode,
  toggleDegreeStatus
} = require('../controllers/degreeController');

// Validation rules
const degreeValidation = [
  body('code')
    .notEmpty()
    .withMessage('Mã bằng cấp là bắt buộc')
    .isLength({ min: 1, max: 10 })
    .withMessage('Mã bằng cấp phải từ 1-10 ký tự')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Mã bằng cấp chỉ chứa chữ cái viết hoa và số'),
  
  body('name')
    .notEmpty()
    .withMessage('Tên bằng cấp là bắt buộc')
    .isLength({ min: 1, max: 100 })
    .withMessage('Tên bằng cấp phải từ 1-100 ký tự'),
  
  body('coefficient')
    .isFloat({ min: 0.5, max: 5.0 })
    .withMessage('Hệ số phải từ 0.5 đến 5.0'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Mô tả không được quá 500 ký tự')
];

const degreeUpdateValidation = [
  body('code')
    .optional()
    .isLength({ min: 1, max: 10 })
    .withMessage('Mã bằng cấp phải từ 1-10 ký tự')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Mã bằng cấp chỉ chứa chữ cái viết hoa và số'),
  
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Tên bằng cấp phải từ 1-100 ký tự'),
  
  body('coefficient')
    .optional()
    .isFloat({ min: 0.5, max: 5.0 })
    .withMessage('Hệ số phải từ 0.5 đến 5.0'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Mô tả không được quá 500 ký tự'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Trạng thái phải là boolean')
];

// Routes
router.route('/')
  .get(getDegrees)
  .post(degreeValidation, createDegree);

router.route('/:id')
  .get(getDegree)
  .put(degreeUpdateValidation, updateDegree)
  .delete(deleteDegree);

router.get('/code/:code', getDegreeByCode);
router.patch('/:id/toggle-status', toggleDegreeStatus);

module.exports = router; 