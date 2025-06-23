const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  getClassesBySemester,
  getClassStatistics
} = require('../controllers/classController');

const router = express.Router();

// Validation middleware
const validateClassCreation = [
  body('code')
    .notEmpty()
    .withMessage('Mã lớp học phần là bắt buộc')
    .isLength({ min: 2, max: 20 })
    .withMessage('Mã lớp học phần phải từ 2-20 ký tự')
    .matches(/^[A-Z0-9.-]+$/)
    .withMessage('Mã lớp học phần chỉ được chứa chữ cái hoa, số, dấu chấm và gạch ngang'),
  
  body('name')
    .notEmpty()
    .withMessage('Tên lớp học phần là bắt buộc')
    .isLength({ min: 2, max: 200 })
    .withMessage('Tên lớp học phần phải từ 2-200 ký tự'),
  
  body('semesterId')
    .notEmpty()
    .withMessage('Học kì là bắt buộc')
    .isMongoId()
    .withMessage('Học kì không hợp lệ'),
  
  body('subjectId')
    .notEmpty()
    .withMessage('Học phần là bắt buộc')
    .isMongoId()
    .withMessage('Học phần không hợp lệ'),
  
  body('studentCount')
    .isInt({ min: 1, max: 200 })
    .withMessage('Số sinh viên phải từ 1-200'),
  
  body('maxStudents')
    .optional()
    .isInt({ min: 5, max: 200 })
    .withMessage('Số sinh viên tối đa phải từ 5-200'),
  
  body('schedule.dayOfWeek')
    .optional()
    .isInt({ min: 2, max: 7 })
    .withMessage('Thứ trong tuần phải từ 2-7'),
  
  body('schedule.startPeriod')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Tiết bắt đầu phải từ 1-12'),
  
  body('schedule.periodsCount')
    .optional()
    .isInt({ min: 1, max: 6 })
    .withMessage('Số tiết phải từ 1-6'),
  
  body('schedule.room')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Tên phòng học không được quá 50 ký tự'),
  
  body('status')
    .optional()
    .isIn(['planning', 'open', 'full', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Trạng thái lớp học không hợp lệ'),
  
  body('classType')
    .optional()
    .isIn(['theory', 'practice', 'lab', 'seminar', 'online'])
    .withMessage('Loại lớp học không hợp lệ'),
  
  body('teachingMethod')
    .optional()
    .isIn(['offline', 'online', 'hybrid'])
    .withMessage('Phương thức giảng dạy không hợp lệ'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Mô tả không được quá 500 ký tự'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Ghi chú không được quá 1000 ký tự')
];

const validateClassUpdate = [
  body('code')
    .optional()
    .isLength({ min: 2, max: 20 })
    .withMessage('Mã lớp học phần phải từ 2-20 ký tự')
    .matches(/^[A-Z0-9.-]+$/)
    .withMessage('Mã lớp học phần chỉ được chứa chữ cái hoa, số, dấu chấm và gạch ngang'),
  
  body('name')
    .optional()
    .isLength({ min: 2, max: 200 })
    .withMessage('Tên lớp học phần phải từ 2-200 ký tự'),
  
  body('semesterId')
    .optional()
    .isMongoId()
    .withMessage('Học kì không hợp lệ'),
  
  body('subjectId')
    .optional()
    .isMongoId()
    .withMessage('Học phần không hợp lệ'),
  
  body('studentCount')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Số sinh viên phải từ 1-200'),
  
  body('maxStudents')
    .optional()
    .isInt({ min: 5, max: 200 })
    .withMessage('Số sinh viên tối đa phải từ 5-200'),
  
  body('schedule.dayOfWeek')
    .optional()
    .isInt({ min: 2, max: 7 })
    .withMessage('Thứ trong tuần phải từ 2-7'),
  
  body('schedule.startPeriod')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Tiết bắt đầu phải từ 1-12'),
  
  body('schedule.periodsCount')
    .optional()
    .isInt({ min: 1, max: 6 })
    .withMessage('Số tiết phải từ 1-6'),
  
  body('schedule.room')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Tên phòng học không được quá 50 ký tự'),
  
  body('status')
    .optional()
    .isIn(['planning', 'open', 'full', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Trạng thái lớp học không hợp lệ'),
  
  body('classType')
    .optional()
    .isIn(['theory', 'practice', 'lab', 'seminar', 'online'])
    .withMessage('Loại lớp học không hợp lệ'),
  
  body('teachingMethod')
    .optional()
    .isIn(['offline', 'online', 'hybrid'])
    .withMessage('Phương thức giảng dạy không hợp lệ'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Mô tả không được quá 500 ký tự'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Ghi chú không được quá 1000 ký tự')
];

const validateMongoId = [
  param('id')
    .isMongoId()
    .withMessage('ID không hợp lệ')
];

const validateSemesterId = [
  param('semesterId')
    .isMongoId()
    .withMessage('ID học kì không hợp lệ')
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

// @route   GET /api/classes/semester/:semesterId
// @desc    Get classes by semester
// @access  Public
router.get('/semester/:semesterId', validateSemesterId, getClassesBySemester);

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
router.post('/', validateClassCreation, validateSchedule, createClass);

// @route   PUT /api/classes/:id
// @desc    Update class
// @access  Private
router.put('/:id', validateMongoId, validateClassUpdate, validateSchedule, updateClass);

// @route   DELETE /api/classes/:id
// @desc    Delete class
// @access  Private
router.delete('/:id', validateMongoId, deleteClass);

module.exports = router; 