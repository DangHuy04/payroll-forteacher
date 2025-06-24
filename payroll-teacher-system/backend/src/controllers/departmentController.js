const Department = require('../models/Department');
const Teacher = require('../models/Teacher');
const { validationResult } = require('express-validator');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Public
const getAllDepartments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      isActive,
      withStats = false,
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Use aggregation if withStats is true
    if (withStats === 'true') {
      const pipeline = [
        { $match: query },
        {
          $lookup: {
            from: 'teachers',
            localField: '_id',
            foreignField: 'departmentId',
            as: 'teachers'
          }
        },
        {
          $lookup: {
            from: 'subjects',
            localField: '_id',
            foreignField: 'departmentId',
            as: 'subjects'
          }
        },
        {
          $lookup: {
            from: 'teachers',
            localField: 'headTeacherId',
            foreignField: '_id',
            as: 'headTeacher'
          }
        },
        {
          $addFields: {
            teacherCount: { $size: '$teachers' },
            subjectCount: { $size: '$subjects' },
            activeTeacherCount: {
              $size: {
                $filter: {
                  input: '$teachers',
                  cond: { $eq: ['$$this.isActive', true] }
                }
              }
            },
            headTeacher: { $arrayElemAt: ['$headTeacher', 0] }
          }
        },
        {
          $project: {
            teachers: 0,
            subjects: 0
          }
        }
      ];

      // Add sorting
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      pipeline.push({ $sort: sort });

      // Add pagination
      pipeline.push({ $skip: (page - 1) * limit });
      pipeline.push({ $limit: parseInt(limit) });

      const departments = await Department.aggregate(pipeline);
      const total = await Department.countDocuments(query);

      return res.json({
        success: true,
        data: departments,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      });
    }

    // Regular query without stats
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const departments = await Department.find(query)
      .populate('headTeacher', 'fullName code email')
      .populate('teacherCount')
      .populate('subjectCount')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Department.countDocuments(query);

    res.json({
      success: true,
      data: departments,
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
      message: 'Lỗi server khi lấy danh sách khoa',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get department by ID
// @route   GET /api/departments/:id
// @access  Public
const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('headTeacher', 'fullName code email phone')
      .populate('teacherCount')
      .populate('subjectCount');

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khoa'
      });
    }

    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID khoa không hợp lệ'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin khoa',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get department by code
// @route   GET /api/departments/code/:code
// @access  Public
const getDepartmentByCode = async (req, res) => {
  try {
    const department = await Department.findByCode(req.params.code);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khoa với mã này'
      });
    }

    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin khoa',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create new department
// @route   POST /api/departments
// @access  Private
const createDepartment = async (req, res) => {
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
      name,
      description,
      headTeacherId,
      establishedDate,
      phone,
      email,
      address
    } = req.body;

    // Check if department already exists
    const existingDepartment = await Department.findOne({
      $or: [
        { code: code.toUpperCase() },
        { name }
      ]
    });

    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Khoa với mã hoặc tên này đã tồn tại'
      });
    }

    // Validate head teacher if provided
    if (headTeacherId) {
      const headTeacher = await Teacher.findById(headTeacherId);
      if (!headTeacher) {
        return res.status(400).json({
          success: false,
          message: 'Trưởng khoa không tồn tại'
        });
      }
      if (!headTeacher.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Trưởng khoa đã bị vô hiệu hóa'
        });
      }
    }

    // Create department
    const department = new Department({
      code: code.toUpperCase(),
      name,
      description,
      headTeacherId,
      establishedDate: establishedDate ? new Date(establishedDate) : undefined,
      phone,
      email,
      address
    });

    await department.save();

    // Populate head teacher info
    await department.populate('headTeacher', 'fullName code email');

    res.status(201).json({
      success: true,
      message: 'Tạo khoa thành công',
      data: department
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
      return res.status(400).json({
        success: false,
        message: 'Mã khoa đã tồn tại'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo khoa',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private
const updateDepartment = async (req, res) => {
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

    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khoa'
      });
    }

    const {
      code,
      name,
      description,
      headTeacherId,
      establishedDate,
      phone,
      email,
      address
    } = req.body;

    // Check if code/name conflicts with other departments
    if (code || name) {
      const conflictQuery = { _id: { $ne: department._id } };
      const orConditions = [];
      
      if (code) orConditions.push({ code: code.toUpperCase() });
      if (name) orConditions.push({ name });
      
      if (orConditions.length > 0) {
        conflictQuery.$or = orConditions;
        const existingDepartment = await Department.findOne(conflictQuery);
        
        if (existingDepartment) {
          return res.status(400).json({
            success: false,
            message: 'Khoa với mã hoặc tên này đã tồn tại'
          });
        }
      }
    }

    // Validate head teacher if provided
    if (headTeacherId) {
      const headTeacher = await Teacher.findById(headTeacherId);
      if (!headTeacher) {
        return res.status(400).json({
          success: false,
          message: 'Trưởng khoa không tồn tại'
        });
      }
      if (!headTeacher.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Trưởng khoa đã bị vô hiệu hóa'
        });
      }
    }

    // Update fields
    if (code !== undefined) department.code = code.toUpperCase();
    if (name !== undefined) department.name = name;
    if (description !== undefined) department.description = description;
    if (headTeacherId !== undefined) department.headTeacherId = headTeacherId;
    if (establishedDate !== undefined) department.establishedDate = establishedDate ? new Date(establishedDate) : null;
    if (phone !== undefined) department.phone = phone;
    if (email !== undefined) department.email = email;
    if (address !== undefined) department.address = address;

    await department.save();

    // Populate head teacher info
    await department.populate('headTeacher', 'fullName code email');

    res.json({
      success: true,
      message: 'Cập nhật khoa thành công',
      data: department
    });
  } catch (error) {
    

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID khoa không hợp lệ'
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
      return res.status(400).json({
        success: false,
        message: 'Mã khoa đã tồn tại'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật khoa',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Toggle department status
// @route   PATCH /api/departments/:id/toggle-status
// @access  Private
const toggleDepartmentStatus = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khoa'
      });
    }

    department.isActive = !department.isActive;
    await department.save();

    res.json({
      success: true,
      message: `${department.isActive ? 'Kích hoạt' : 'Vô hiệu hóa'} khoa thành công`,
      data: department
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thay đổi trạng thái khoa',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private
const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khoa'
      });
    }

    await department.deleteOne();

    res.json({
      success: true,
      message: 'Xóa khoa thành công'
    });
  } catch (error) {
    

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'ID khoa không hợp lệ'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi xóa khoa',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get department statistics
// @route   GET /api/departments/:id/statistics
// @access  Public
const getDepartmentStatistics = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khoa'
      });
    }

    // Get detailed statistics
    const statistics = await Department.aggregate([
      { $match: { _id: department._id } },
      {
        $lookup: {
          from: 'teachers',
          localField: '_id',
          foreignField: 'departmentId',
          as: 'teachers'
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: '_id',
          foreignField: 'departmentId',
          as: 'subjects'
        }
      },
      {
        $addFields: {
          totalTeachers: { $size: '$teachers' },
          activeTeachers: {
            $size: {
              $filter: {
                input: '$teachers',
                cond: { $eq: ['$$this.isActive', true] }
              }
            }
          },
          inactiveTeachers: {
            $size: {
              $filter: {
                input: '$teachers',
                cond: { $eq: ['$$this.isActive', false] }
              }
            }
          },
          totalSubjects: { $size: '$subjects' },
          activeSubjects: {
            $size: {
              $filter: {
                input: '$subjects',
                cond: { $eq: ['$$this.isActive', true] }
              }
            }
          },
          teachersByDegree: {
            $reduce: {
              input: '$teachers',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $let: {
                      vars: {
                        degree: '$$this.degreeId'
                      },
                      in: {
                        $cond: [
                          { $ne: ['$$degree', null] },
                          {
                            $arrayToObject: [
                              [{
                                k: { $toString: '$$degree' },
                                v: {
                                  $add: [
                                    { $ifNull: [{ $getField: { field: { $toString: '$$degree' }, input: '$$value' } }, 0] },
                                    1
                                  ]
                                }
                              }]
                            ]
                          },
                          '$$value'
                        ]
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      }
    ]);

    const stats = statistics[0];

    res.json({
      success: true,
      data: {
        department: {
          _id: department._id,
          code: department.code,
          name: department.name,
          description: department.description,
          isActive: department.isActive
        },
        statistics: {
          totalTeachers: stats.totalTeachers,
          activeTeachers: stats.activeTeachers,
          inactiveTeachers: stats.inactiveTeachers,
          totalSubjects: stats.totalSubjects,
          activeSubjects: stats.activeSubjects,
          teachersByDegree: stats.teachersByDegree
        }
      }
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê khoa',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get teachers by department
// @route   GET /api/departments/:id/teachers
// @access  Public
const getTeachersByDepartment = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      isActive,
      sortBy = 'fullName',
      sortOrder = 'asc'
    } = req.query;

    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khoa'
      });
    }

    // Build query
    const query = { departmentId: department._id };
    if (isActive !== undefined) query.isActive = isActive === 'true';

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const teachers = await Teacher.find(query)
      .populate('degreeId', 'code name coefficient')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Teacher.countDocuments(query);

    res.json({
      success: true,
      data: {
        department: {
          _id: department._id,
          code: department.code,
          name: department.name
        },
        teachers,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách giáo viên theo khoa',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAllDepartments,
  getDepartmentById,
  getDepartmentByCode,
  createDepartment,
  updateDepartment,
  toggleDepartmentStatus,
  deleteDepartment,
  getDepartmentStatistics,
  getTeachersByDepartment
}; 
