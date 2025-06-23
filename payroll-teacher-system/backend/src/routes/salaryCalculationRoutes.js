const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const {
  calculateSalary,
  calculateDepartmentSalaries,
  getSalaryStatistics
} = require('../controllers/salaryCalculationController');

// @route   POST /api/salaries/calculate
// @desc    Calculate salary for a teacher
// @access  Private
router.post(
  '/calculate',
  [
    check('teacherId', 'Giảng viên là bắt buộc').not().isEmpty(),
    check('semesterId', 'Học kỳ là bắt buộc').not().isEmpty()
  ],
  calculateSalary
);

// @route   POST /api/salaries/calculate/department
// @desc    Calculate salaries for all teachers in a department
// @access  Private
router.post(
  '/calculate/department',
  [
    check('departmentId', 'Khoa là bắt buộc').not().isEmpty(),
    check('semesterId', 'Học kỳ là bắt buộc').not().isEmpty()
  ],
  calculateDepartmentSalaries
);

// @route   GET /api/salaries/statistics
// @desc    Get salary statistics
// @access  Private
router.get('/statistics', getSalaryStatistics);

module.exports = router; 