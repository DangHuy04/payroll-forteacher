const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getAllSemesters,
  getSemesterById,
  getCurrentSemester,
  getSemestersByAcademicYear,
  getUpcomingSemesters,
  createSemester,
  updateSemester,
  toggleSemesterStatus,
  updateSemesterStatus,
  deleteSemester,
  getSemesterStatistics
} = require('../controllers/semesterController');

const router = express.Router();

// Validation middleware
const createSemesterValidation = [
  body('academicYearId')
    .isMongoId()
    .withMessage('ID năm học không hợp lệ'),
  body('semesterNumber')
    .isInt({ min: 1, max: 3 })
    .withMessage('Số thứ tự học kì phải là 1, 2 hoặc 3'),
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
  body('registrationStartDate')
    .isISO8601()
    .withMessage('Ngày bắt đầu đăng ký không hợp lệ')
    .toDate(),
  body('registrationEndDate')
    .isISO8601()
    .withMessage('Ngày kết thúc đăng ký không hợp lệ')
    .toDate()
    .custom((value, { req }) => {
      if (value <= req.body.registrationStartDate) {
        throw new Error('Ngày kết thúc đăng ký phải sau ngày bắt đầu đăng ký');
      }
      if (value > req.body.startDate) {
        throw new Error('Ngày kết thúc đăng ký phải trước ngày bắt đầu học kì');
      }
      return true;
    }),
  body('status')
    .optional()
    .isIn(['planning', 'registration', 'active', 'exam', 'completed', 'archived'])
    .withMessage('Trạng thái không hợp lệ'),
  body('maxCredits')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Số tín chỉ tối đa phải từ 1 đến 50'),
  body('tuitionDeadline')
    .optional()
    .isISO8601()
    .withMessage('Hạn nộp học phí không hợp lệ')
    .toDate(),
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

const academicYearIdValidation = [
  param('academicYearId')
    .isMongoId()
    .withMessage('ID năm học không hợp lệ')
];

// Routes
router.get('/', getAllSemesters);
router.get('/current', getCurrentSemester);
router.get('/upcoming', getUpcomingSemesters);
router.get('/academic-year/:academicYearId', academicYearIdValidation, getSemestersByAcademicYear);
router.get('/:id', idValidation, getSemesterById);
router.get('/:id/statistics', idValidation, getSemesterStatistics);

router.post('/', createSemesterValidation, createSemester);
router.put('/:id', idValidation, updateSemester);
router.patch('/:id/toggle-status', idValidation, toggleSemesterStatus);
router.patch('/:id/status', idValidation, updateSemesterStatus);
router.delete('/:id', idValidation, deleteSemester);

module.exports = router; 