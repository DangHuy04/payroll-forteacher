const Teacher = require('../models/Teacher');
const Department = require('../models/Department');
const Degree = require('../models/Degree');
const Semester = require('../models/Semester');
const AcademicYear = require('../models/AcademicYear');
const { validationResult } = require('express-validator');

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Public
const getAllTeachers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      departmentId,
      degreeId,
      isActive,
      search,
      position,
      semesterId, // Filter by active semester
      academicYearId, // Filter by academic year
      sortBy = 'fullName',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = {};
    if (departmentId) query.departmentId = departmentId;
    if (degreeId) query.degreeId = degreeId;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (position) query.position = { $regex: position, $options: 'i' };
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    let teachersQuery = Teacher.find(query)
      .populate('departmentId', 'code name')
      .populate('degreeId', 'code name coefficient')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const teachers = await teachersQuery.lean();
    const total = await Teacher.countDocuments(query);

    // Add teaching context if semester/academic year is specified
    let contextInfo = {};
    if (semesterId) {
      const semester = await Semester.findById(semesterId).populate('academicYear');
      contextInfo.semester = semester;
    }
    if (academicYearId) {
      const academicYear = await AcademicYear.findById(academicYearId);
      contextInfo.academicYear = academicYear;
    }

    res.json({
      success: true,
      data: teachers,
      context: contextInfo,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách giáo viên',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get teacher by ID
// @route   GET /api/teachers/:id
// @access  Public
const getTeacherById = async (req, res) => {
  try {
    const { semesterId, academicYearId } = req.query;

    const teacher = await Teacher.findById(req.params.id)
      .populate('departmentId', 'code name phone email')
      .populate('degreeId', 'code name coefficient');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giáo viên'
      });
    }

    // Add context information
    let contextInfo = {};
    if (semesterId) {
      const semester = await Semester.findById(semesterId).populate('academicYear');
      contextInfo.semester = semester;
    }
    if (academicYearId) {
      const academicYear = await AcademicYear.findById(academicYearId);
      contextInfo.academicYear = academicYear;
    }

    res.json({
      success: true,
      data: teacher,
      context: contextInfo
    });
  } catch (error) {
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID giáo viên không hợp lệ'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin giáo viên',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get teacher by code
// @route   GET /api/teachers/code/:code
// @access  Public
const getTeacherByCode = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ 
      code: req.params.code.toUpperCase(),
      isActive: true 
    })
      .populate('departmentId', 'code name')
      .populate('degreeId', 'code name coefficient');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giáo viên với mã này'
      });
    }

    res.json({
      success: true,
      data: teacher
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin giáo viên',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create new teacher
// @route   POST /api/teachers
// @access  Private
const createTeacher = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const {
      code,
      fullName,
      email,
      phone,
      departmentId,
      degreeId,
      position,
      gender,
      birthDate,
      hireDate,
      address,
      citizenId,
      taxCode,
      emergencyContact
    } = req.body;

    // Check if teacher already exists
    const existingTeacher = await Teacher.findOne({
      $or: [
        { code: code.toUpperCase() },
        { email: email.toLowerCase() },
        ...(citizenId ? [{ identityNumber: citizenId }] : []),
        ...(identityNumber ? [{ identityNumber }] : [])
      ]
    });

    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        message: 'Giáo viên với mã, email hoặc CCCD này đã tồn tại'
      });
    }

    // Validate department and degree
    const [department, degree] = await Promise.all([
      Department.findById(departmentId),
      Degree.findById(degreeId)
    ]);

    if (!department) {
      return res.status(400).json({
        success: false,
        message: 'Khoa không tồn tại'
      });
    }

    if (!degree) {
      return res.status(400).json({
        success: false,
        message: 'Bằng cấp không tồn tại'
      });
    }

    // Create teacher
    const teacher = new Teacher({
      code: code.toUpperCase(),
      fullName,
      email: email.toLowerCase(),
      phone,
      departmentId,
      degreeId,
      position,
      gender,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      hireDate: hireDate ? new Date(hireDate) : new Date(),
      address,
      identityNumber: citizenId || identityNumber,
      taxCode,
      emergencyContact
    });

    await teacher.save();

    // Populate department and degree info
    await teacher.populate([
      { path: 'departmentId', select: 'code name' },
      { path: 'degreeId', select: 'code name coefficient' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Tạo giáo viên thành công',
      data: teacher
    });
  } catch (error) {
    
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: messages
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const fieldNames = {
        code: 'mã giáo viên',
        email: 'email',
        identityNumber: 'CCCD'
      };
      return res.status(400).json({
        success: false,
        message: `${fieldNames[field] || 'Thông tin'} đã tồn tại`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo giáo viên',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update teacher
// @route   PUT /api/teachers/:id
// @access  Private
const updateTeacher = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giáo viên'
      });
    }

    const {
      code,
      fullName,
      email,
      phone,
      departmentId,
      degreeId,
      position,
      gender,
      birthDate,
      hireDate,
      address,
      citizenId,
      identityNumber,
      taxCode,
      emergencyContact
    } = req.body;

    // Check for conflicts with other teachers
    if (code || email || citizenId || identityNumber) {
      const conflictQuery = { _id: { $ne: teacher._id } };
      const orConditions = [];
      
      if (code) orConditions.push({ code: code.toUpperCase() });
      if (email) orConditions.push({ email: email.toLowerCase() });
      if (citizenId) orConditions.push({ identityNumber: citizenId });
      if (identityNumber) orConditions.push({ identityNumber });
      
      if (orConditions.length > 0) {
        conflictQuery.$or = orConditions;
        const existingTeacher = await Teacher.findOne(conflictQuery);
        
        if (existingTeacher) {
          return res.status(400).json({
            success: false,
            message: 'Giáo viên với mã, email hoặc CCCD này đã tồn tại'
          });
        }
      }
    }

    // Validate department and degree if changing
    if (departmentId && departmentId !== teacher.departmentId.toString()) {
      const department = await Department.findById(departmentId);
      if (!department) {
        return res.status(400).json({
          success: false,
          message: 'Khoa không tồn tại'
        });
      }
    }

    if (degreeId && degreeId !== teacher.degreeId.toString()) {
      const degree = await Degree.findById(degreeId);
      if (!degree) {
        return res.status(400).json({
          success: false,
          message: 'Bằng cấp không tồn tại'
        });
      }
    }

    // Update fields
    if (code !== undefined) teacher.code = code.toUpperCase();
    if (fullName !== undefined) teacher.fullName = fullName;
    if (email !== undefined) teacher.email = email.toLowerCase();
    if (phone !== undefined) teacher.phone = phone;
    if (departmentId !== undefined) teacher.departmentId = departmentId;
    if (degreeId !== undefined) teacher.degreeId = degreeId;
    if (position !== undefined) teacher.position = position;
    if (gender !== undefined) teacher.gender = gender;
    if (birthDate !== undefined) teacher.birthDate = birthDate ? new Date(birthDate) : null;
    if (hireDate !== undefined) teacher.hireDate = hireDate ? new Date(hireDate) : null;
    if (address !== undefined) teacher.address = address;
    if (citizenId !== undefined) teacher.identityNumber = citizenId;
    if (identityNumber !== undefined) teacher.identityNumber = identityNumber;
    if (taxCode !== undefined) teacher.taxCode = taxCode;
    if (emergencyContact !== undefined) teacher.emergencyContact = emergencyContact;

    await teacher.save();

    // Populate department and degree info
    await teacher.populate([
      { path: 'departmentId', select: 'code name' },
      { path: 'degreeId', select: 'code name coefficient' }
    ]);

    res.json({
      success: true,
      message: 'Cập nhật giáo viên thành công',
      data: teacher
    });
  } catch (error) {
    

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID giáo viên không hợp lệ'
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: messages
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const fieldNames = {
        code: 'mã giáo viên',
        email: 'email',
        identityNumber: 'CCCD'
      };
      return res.status(400).json({
        success: false,
        message: `${fieldNames[field] || 'Thông tin'} đã tồn tại`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật giáo viên',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Toggle teacher status
// @route   PATCH /api/teachers/:id/toggle-status
// @access  Private
const toggleTeacherStatus = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giáo viên'
      });
    }

    teacher.isActive = !teacher.isActive;
    await teacher.save();

    res.json({
      success: true,
      message: `${teacher.isActive ? 'Kích hoạt' : 'Vô hiệu hóa'} giáo viên thành công`,
      data: teacher
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thay đổi trạng thái giáo viên',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete teacher
// @route   DELETE /api/teachers/:id
// @access  Private
const deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giáo viên'
      });
    }

    await teacher.deleteOne();

    res.json({
      success: true,
      message: 'Xóa giáo viên thành công'
    });
  } catch (error) {
    

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID giáo viên không hợp lệ'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi xóa giáo viên',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get teacher statistics
// @route   GET /api/teachers/:id/statistics
// @access  Public
const getTeacherStatistics = async (req, res) => {
  try {
    const { semesterId, academicYearId } = req.query;

    const teacher = await Teacher.findById(req.params.id)
      .populate('departmentId', 'code name')
      .populate('degreeId', 'code name coefficient');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giáo viên'
      });
    }

    // Basic statistics
    const statistics = {
      workingYears: teacher.workingYears,
      age: teacher.age,
      isActive: teacher.isActive,
      // Future: Add teaching assignments, salary history, etc.
      teachingAssignments: {
        total: 0,
        currentSemester: 0,
        currentAcademicYear: 0
      },
      salaryHistory: {
        total: 0,
        averagePerSemester: 0
      }
    };

    // Add context information
    let contextInfo = {};
    if (semesterId) {
      const semester = await Semester.findById(semesterId).populate('academicYear');
      contextInfo.semester = semester;
      // Future: Add specific semester statistics
    }
    if (academicYearId) {
      const academicYear = await AcademicYear.findById(academicYearId);
      contextInfo.academicYear = academicYear;
      // Future: Add specific academic year statistics
    }

    res.json({
      success: true,
      data: {
        teacher,
        statistics,
        context: contextInfo
      }
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê giáo viên',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get teachers summary statistics
// @route   GET /api/teachers/statistics/summary
// @access  Public
const getTeachersSummaryStatistics = async (req, res) => {
  try {
    const { departmentId, semesterId, academicYearId } = req.query;

    // Build match conditions
    const matchConditions = {};
    if (departmentId) matchConditions.departmentId = mongoose.Types.ObjectId(departmentId);

    const statistics = await Teacher.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: 'departments',
          localField: 'departmentId',
          foreignField: '_id',
          as: 'department'
        }
      },
      {
        $lookup: {
          from: 'degrees',
          localField: 'degreeId',
          foreignField: '_id',
          as: 'degree'
        }
      },
      {
        $group: {
          _id: null,
          totalTeachers: { $sum: 1 },
          activeTeachers: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          inactiveTeachers: {
            $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
          },
          byDepartment: {
            $push: {
              department: { $arrayElemAt: ['$department.name', 0] },
              departmentCode: { $arrayElemAt: ['$department.code', 0] },
              isActive: '$isActive'
            }
          },
          byDegree: {
            $push: {
              degree: { $arrayElemAt: ['$degree.name', 0] },
              degreeCode: { $arrayElemAt: ['$degree.code', 0] },
              isActive: '$isActive'
            }
          },
          byGender: {
            $push: {
              gender: '$gender',
              isActive: '$isActive'
            }
          },
          averageAge: {
            $avg: {
              $subtract: [
                { $year: new Date() },
                { $year: '$birthDate' }
              ]
            }
          }
        }
      }
    ]);

    const summary = statistics[0] || {
      totalTeachers: 0,
      activeTeachers: 0,
      inactiveTeachers: 0,
      byDepartment: [],
      byDegree: [],
      byGender: [],
      averageAge: 0
    };

    // Add context information
    let contextInfo = {};
    if (semesterId) {
      const semester = await Semester.findById(semesterId).populate('academicYear');
      contextInfo.semester = semester;
    }
    if (academicYearId) {
      const academicYear = await AcademicYear.findById(academicYearId);
      contextInfo.academicYear = academicYear;
    }
    if (departmentId) {
      const department = await Department.findById(departmentId);
      contextInfo.department = department;
    }

    res.json({
      success: true,
      data: {
        summary,
        context: contextInfo
      }
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê tổng quan giáo viên',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAllTeachers,
  getTeacherById,
  getTeacherByCode,
  createTeacher,
  updateTeacher,
  toggleTeacherStatus,
  deleteTeacher,
  getTeacherStatistics,
  getTeachersSummaryStatistics
}; 
