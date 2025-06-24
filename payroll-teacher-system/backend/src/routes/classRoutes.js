const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  getClassesByAcademicYear,
  getClassStatistics
} = require('../controllers/classController');


const router = express.Router();

// Validation middleware
const validateClassCreation = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Mã lớp học là bắt buộc')
    .isLength({ min: 3, max: 20 })
    .withMessage('Mã lớp học phải có độ dài từ 3-20 ký tự')
    .matches(/^[A-Z0-9_-]+$/i)
    .withMessage('Mã lớp học chỉ được chứa chữ cái, số, gạch dưới và gạch ngang'),
  
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Tên lớp học là bắt buộc')
    .isLength({ min: 5, max: 200 })
    .withMessage('Tên lớp học phải có độ dài từ 5-200 ký tự'),
  
  body('subjectId')
    .isMongoId()
    .withMessage('ID học phần không hợp lệ'),
  
  body('academicYearId')
    .isMongoId()
    .withMessage('ID năm học không hợp lệ'),
  
  body('studentCount')
    .isInt({ min: 1, max: 200 })
    .withMessage('Số lượng sinh viên phải từ 1-200'),
  
  body('maxStudents')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Số lượng sinh viên tối đa phải từ 1-200'),
  
  body('classType')
    .isIn(['theory', 'practice', 'lab', 'mixed'])
    .withMessage('Loại lớp không hợp lệ'),
  
  body('teachingMethod')
    .optional()
    .isIn(['offline', 'online', 'hybrid'])
    .withMessage('Phương thức giảng dạy không hợp lệ')
];

const validateClassUpdate = [
  body('code')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Mã lớp học phải có độ dài từ 3-20 ký tự')
    .matches(/^[A-Z0-9_-]+$/i)
    .withMessage('Mã lớp học chỉ được chứa chữ cái, số, gạch dưới và gạch ngang'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Tên lớp học phải có độ dài từ 5-200 ký tự'),
  
  body('subjectId')
    .optional()
    .isMongoId()
    .withMessage('ID học phần không hợp lệ'),
  
  body('academicYearId')
    .optional()
    .isMongoId()
    .withMessage('ID năm học không hợp lệ'),
  
  body('studentCount')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Số lượng sinh viên phải từ 1-200'),
  
  body('maxStudents')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Số lượng sinh viên tối đa phải từ 1-200'),
  
  body('classType')
    .optional()
    .isIn(['theory', 'practice', 'lab', 'mixed'])
    .withMessage('Loại lớp không hợp lệ'),
  
  body('teachingMethod')
    .optional()
    .isIn(['offline', 'online', 'hybrid'])
    .withMessage('Phương thức giảng dạy không hợp lệ')
];

const validateMongoId = [
  param('id').isMongoId().withMessage('ID không hợp lệ')
];

const validateAcademicYearId = [
  param('academicYearId').isMongoId().withMessage('Academic Year ID không hợp lệ')
];

// Custom validation for schedule conflicts
const validateSchedule = [
  body('schedule')
    .optional()
    .custom((schedule) => {
      if (schedule && schedule.dayOfWeek && schedule.startPeriod && schedule.periodsCount) {
        const endPeriod = schedule.startPeriod + schedule.periodsCount - 1;
        if (endPeriod > 12) {
          throw new Error('Lịch học vượt quá 12 tiết trong ngày');
        }
      }
      return true;
    })
];

// Routes

// @route   GET /api/classes/statistics
// @desc    Get class statistics
// @access  Public
router.get('/statistics', getClassStatistics);

// @route   GET /api/classes/academic-year/:academicYearId
// @desc    Get classes by academic year
// @access  Public
router.get('/academic-year/:academicYearId', validateAcademicYearId, getClassesByAcademicYear);

// @route   GET /api/classes/:id
// @desc    Get single class
// @access  Public
router.get('/:id', validateMongoId, getClass);

// @route   GET /api/classes
// @desc    Get all classes
// @access  Public
router.get('/', getClasses);

// @route   POST /api/classes
// @desc    Create new class
// @access  Private
router.post('/', validateClassCreation, createClass);

// @route   PUT /api/classes/:id
// @desc    Update class
// @access  Private
router.put('/:id', validateMongoId, validateClassUpdate, updateClass);

// @route   DELETE /api/classes/:id
// @desc    Delete class
// @access  Private
router.delete('/:id', validateMongoId, deleteClass);

module.exports = router; 