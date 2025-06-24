const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const {
  getTeachingAssignments,
  getTeachingAssignment,
  createTeachingAssignment,
  updateTeachingAssignment,
  deleteTeachingAssignment,
  getAssignmentsByTeacher,
  getAssignmentsByClass,
  bulkAssignTeachers,
  getTeachingAssignmentStatistics
} = require('../controllers/teachingAssignmentController');

// Validation middleware
const validateAssignmentCreation = [
  body('teacherId')
    .notEmpty()
    .withMessage('ID giảng viên là bắt buộc')
    .isMongoId()
    .withMessage('ID giảng viên không hợp lệ'),
  
  body('classId')
    .notEmpty()
    .withMessage('ID lớp học phần là bắt buộc')
    .isMongoId()
    .withMessage('ID lớp học phần không hợp lệ'),
  
  body('academicYearId')
    .notEmpty()
    .withMessage('ID năm học là bắt buộc')
    .isMongoId()
    .withMessage('ID năm học không hợp lệ'),
  
  body('assignmentType')
    .optional()
    .isIn(['chính', 'phụ', 'thay_thế', 'hỗ_trợ'])
    .withMessage('Loại phân công không hợp lệ'),
  
  body('teachingHours')
    .notEmpty()
    .withMessage('Số giờ dạy là bắt buộc')
    .isNumeric()
    .withMessage('Số giờ dạy phải là số')
    .custom((value) => {
      if (value < 0 || value > 200) {
        throw new Error('Số giờ dạy phải từ 0 đến 200');
      }
      return true;
    }),
  
  body('teachingCoefficient')
    .optional()
    .isNumeric()
    .withMessage('Hệ số giảng dạy phải là số')
    .custom((value) => {
      if (value < 0.1 || value > 3.0) {
        throw new Error('Hệ số giảng dạy phải từ 0.1 đến 3.0');
      }
      return true;
    }),
  
  body('schedule.startDate')
    .notEmpty()
    .withMessage('Ngày bắt đầu là bắt buộc')
    .isISO8601()
    .withMessage('Ngày bắt đầu không hợp lệ'),
  
  body('schedule.endDate')
    .notEmpty()
    .withMessage('Ngày kết thúc là bắt buộc')
    .isISO8601()
    .withMessage('Ngày kết thúc không hợp lệ')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.schedule?.startDate)) {
        throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
      }
      return true;
    }),
  
  body('workloadDistribution.lectureHours')
    .optional()
    .isNumeric()
    .withMessage('Giờ lý thuyết phải là số')
    .custom((value) => {
      if (value < 0) {
        throw new Error('Giờ lý thuyết không được âm');
      }
      return true;
    }),
  
  body('workloadDistribution.practiceHours')
    .optional()
    .isNumeric()
    .withMessage('Giờ thực hành phải là số')
    .custom((value) => {
      if (value < 0) {
        throw new Error('Giờ thực hành không được âm');
      }
      return true;
    }),
  
  body('workloadDistribution.labHours')
    .optional()
    .isNumeric()
    .withMessage('Giờ thí nghiệm phải là số')
    .custom((value) => {
      if (value < 0) {
        throw new Error('Giờ thí nghiệm không được âm');
      }
      return true;
    }),
  
  body('workloadDistribution.otherHours')
    .optional()
    .isNumeric()
    .withMessage('Giờ khác phải là số')
    .custom((value) => {
      if (value < 0) {
        throw new Error('Giờ khác không được âm');
      }
      return true;
    }),
  
  body('compensation.baseRate')
    .optional()
    .isNumeric()
    .withMessage('Mức lương cơ bản phải là số')
    .custom((value) => {
      if (value < 0) {
        throw new Error('Mức lương cơ bản không được âm');
      }
      return true;
    }),
  
  body('compensation.additionalRate')
    .optional()
    .isNumeric()
    .withMessage('Phụ cấp phải là số')
    .custom((value) => {
      if (value < 0) {
        throw new Error('Phụ cấp không được âm');
      }
      return true;
    }),
  
  body('compensation.overtimeRate')
    .optional()
    .isNumeric()
    .withMessage('Mức lương làm thêm phải là số')
    .custom((value) => {
      if (value < 0) {
        throw new Error('Mức lương làm thêm không được âm');
      }
      return true;
    }),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Ghi chú không được quá 1000 ký tự')
];

const validateAssignmentUpdate = [
  body('teacherId')
    .optional()
    .isMongoId()
    .withMessage('ID giảng viên không hợp lệ'),
  
  body('classId')
    .optional()
    .isMongoId()
    .withMessage('ID lớp học phần không hợp lệ'),
  
  body('academicYearId')
    .optional()
    .isMongoId()
    .withMessage('ID năm học không hợp lệ'),
  
  body('assignmentType')
    .optional()
    .isIn(['chính', 'phụ', 'thay_thế', 'hỗ_trợ'])
    .withMessage('Loại phân công không hợp lệ'),
  
  body('teachingHours')
    .optional()
    .isNumeric()
    .withMessage('Số giờ dạy phải là số')
    .custom((value) => {
      if (value < 0 || value > 200) {
        throw new Error('Số giờ dạy phải từ 0 đến 200');
      }
      return true;
    }),
  
  body('teachingCoefficient')
    .optional()
    .isNumeric()
    .withMessage('Hệ số giảng dạy phải là số')
    .custom((value) => {
      if (value < 0.1 || value > 3.0) {
        throw new Error('Hệ số giảng dạy phải từ 0.1 đến 3.0');
      }
      return true;
    }),
  
  body('schedule.startDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày bắt đầu không hợp lệ'),
  
  body('schedule.endDate')
    .optional()
    .isISO8601()
    .withMessage('Ngày kết thúc không hợp lệ'),
  
  body('status')
    .optional()
    .isIn(['draft', 'assigned', 'confirmed', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Trạng thái không hợp lệ'),
  
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

const validateTeacherId = [
  param('teacherId')
    .isMongoId()
    .withMessage('ID giảng viên không hợp lệ')
];

const validateAcademicYearId = [
  param('academicYearId')
    .isMongoId()
    .withMessage('ID năm học không hợp lệ')
];

const validateClassId = [
  param('classId')
    .isMongoId()
    .withMessage('ID lớp học phần không hợp lệ')
];

const validateQueryFilters = [
  query('academicYearId')
    .optional()
    .isMongoId()
    .withMessage('ID năm học không hợp lệ'),
  
  query('teacherId')
    .optional()
    .isMongoId()
    .withMessage('ID giảng viên không hợp lệ'),
  
  query('classId')
    .optional()
    .isMongoId()
    .withMessage('ID lớp học phần không hợp lệ'),
  
  query('status')
    .optional()
    .isIn(['draft', 'assigned', 'confirmed', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Trạng thái không hợp lệ'),
  
  query('assignmentType')
    .optional()
    .isIn(['chính', 'phụ', 'thay_thế', 'hỗ_trợ'])
    .withMessage('Loại phân công không hợp lệ'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Số trang phải là số nguyên dương'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Số lượng kết quả phải từ 1 đến 100'),
  
  query('sortBy')
    .optional()
    .isIn(['schedule.startDate', 'schedule.endDate', 'teachingHours', 'status', 'assignmentType', 'createdAt'])
    .withMessage('Trường sắp xếp không hợp lệ'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Thứ tự sắp xếp phải là asc hoặc desc')
];

const validateAvailabilityCheck = [
  query('teacherId')
    .notEmpty()
    .withMessage('ID giảng viên là bắt buộc')
    .isMongoId()
    .withMessage('ID giảng viên không hợp lệ'),
  
  query('startDate')
    .notEmpty()
    .withMessage('Ngày bắt đầu là bắt buộc')
    .isISO8601()
    .withMessage('Ngày bắt đầu không hợp lệ'),
  
  query('endDate')
    .notEmpty()
    .withMessage('Ngày kết thúc là bắt buộc')
    .isISO8601()
    .withMessage('Ngày kết thúc không hợp lệ')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.query.startDate)) {
        throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
      }
      return true;
    })
];

const validateBulkAssignment = [
  body('assignments')
    .isArray({ min: 1 })
    .withMessage('Danh sách phân công phải là mảng và không được rỗng'),
  
  body('assignments.*.teacherId')
    .notEmpty()
    .withMessage('ID giảng viên là bắt buộc')
    .isMongoId()
    .withMessage('ID giảng viên không hợp lệ'),
  
  body('assignments.*.classId')
    .notEmpty()
    .withMessage('ID lớp học phần là bắt buộc')
    .isMongoId()
    .withMessage('ID lớp học phần không hợp lệ'),
  
  body('assignments.*.academicYearId')
    .notEmpty()
    .withMessage('ID năm học là bắt buộc')
    .isMongoId()
    .withMessage('ID năm học không hợp lệ'),
  
  body('assignments.*.teachingHours')
    .notEmpty()
    .withMessage('Số giờ dạy là bắt buộc')
    .isNumeric()
    .withMessage('Số giờ dạy phải là số')
];

const validateApproval = [
  body('approvalNotes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Ghi chú phê duyệt không được quá 500 ký tự')
];

const validateCancellation = [
  body('reason')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Lý do hủy không được quá 500 ký tự')
];

// Routes

// Basic CRUD operations
router.get('/', validateQueryFilters, getTeachingAssignments);
router.get('/:id', validateMongoId, getTeachingAssignment);
router.post('/', validateAssignmentCreation, createTeachingAssignment);
router.put('/:id', validateMongoId, validateAssignmentUpdate, updateTeachingAssignment);
router.delete('/:id', validateMongoId, deleteTeachingAssignment);

// Workflow operations - inspired by Payroll Engine's approval processes
router.post('/:id/approve', validateMongoId, validateApproval, updateTeachingAssignment);
router.post('/:id/cancel', validateMongoId, validateCancellation, deleteTeachingAssignment);

// Query operations by different entities
router.get('/teacher/:teacherId', validateTeacherId, getAssignmentsByTeacher);
router.get('/academicYear/:academicYearId', validateAcademicYearId, getTeachingAssignments);
router.get('/class/:classId', validateClassId, getAssignmentsByClass);

// Statistics and reporting - inspired by Payroll Engine's analytics
router.get('/statistics', getTeachingAssignmentStatistics);

// Bulk operations - inspired by Payroll Engine's bulk processing
router.post('/bulk/assign', validateBulkAssignment, bulkAssignTeachers);

// Utility operations
router.get('/availability/check', validateAvailabilityCheck, getTeachingAssignments);

module.exports = router; 