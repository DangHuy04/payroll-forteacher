const mongoose = require('mongoose');
const AcademicYear = require('../models/AcademicYear');
const Semester = require('../models/Semester');
const Degree = require('../models/Degree');
const Department = require('../models/Department');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const TeachingAssignment = require('../models/TeachingAssignment');
const RateSetting = require('../models/RateSetting');
const PeriodRate = require('../models/PeriodRate');
const SalaryCalculation = require('../models/SalaryCalculation');

const connectDB = require('../config/database');

// Sample data
const sampleDegrees = [
  {
    code: 'TS',
    name: 'Tiến sĩ',
    coefficient: 2.0,
    description: 'Bằng Tiến sĩ'
  },
  {
    code: 'THS',
    name: 'Thạc sĩ',
    coefficient: 1.5,
    description: 'Bằng Thạc sĩ'
  },
  {
    code: 'CN',
    name: 'Cử nhân',
    coefficient: 1.0,
    description: 'Bằng Cử nhân'
  },
  {
    code: 'CD',
    name: 'Cao đẳng',
    coefficient: 0.8,
    description: 'Bằng Cao đẳng'
  }
];

const sampleDepartments = [
  {
    code: 'CNTT',
    name: 'Công nghệ thông tin',
    description: 'Khoa Công nghệ thông tin',
    phone: '0123456789',
    email: 'cntt@university.edu.vn'
  },
  {
    code: 'KTCK',
    name: 'Kế toán - Kiểm toán',
    description: 'Khoa Kế toán - Kiểm toán',
    phone: '0123456790',
    email: 'ktck@university.edu.vn'
  },
  {
    code: 'QTKD',
    name: 'Quản trị kinh doanh',
    description: 'Khoa Quản trị kinh doanh',
    phone: '0123456791',
    email: 'qtkd@university.edu.vn'
  },
  {
    code: 'NN',
    name: 'Ngoại ngữ',
    description: 'Khoa Ngoại ngữ',
    phone: '0123456792',
    email: 'nn@university.edu.vn'
  }
];

// Rate Settings Data - inspired by Payroll Engine's regulation system
const rateSettingsData = [
  // Base hourly rates by degree
  {
    code: 'BASE_TS_HOURLY',
    name: 'Lương cơ bản theo giờ - Tiến sĩ',
    rateType: 'base_hourly',
    applicableScope: 'degree',
    targetModel: 'Degree',
    rateValues: {
      baseAmount: 150000, // 150k VND per hour for PhD
      coefficient: 1.5,
      minimumRate: 100000,
      maximumRate: 300000,
      stepIncrement: 10000
    },
    conditions: {
      minimumExperience: 0,
      minimumHours: 1,
      maximumHours: 40
    },
    effectivePeriod: {
      startDate: new Date('2024-01-01'),
      endDate: null
    },
    priority: 10,
    calculationFormula: {
      formulaType: 'fixed'
    },
    status: 'active',
    metadata: {
      category: 'salary',
      tags: ['base', 'hourly', 'degree']
    },
    description: 'Mức lương cơ bản theo giờ cho giảng viên có bằng Tiến sĩ',
    approval: {
      isApproved: true,
      approvedAt: new Date('2024-01-01')
    }
  },
  {
    code: 'BASE_THS_HOURLY',
    name: 'Lương cơ bản theo giờ - Thạc sĩ',
    rateType: 'base_hourly',
    applicableScope: 'degree',
    targetModel: 'Degree',
    rateValues: {
      baseAmount: 120000, // 120k VND per hour for Master
      coefficient: 1.2,
      minimumRate: 80000,
      maximumRate: 250000,
      stepIncrement: 8000
    },
    conditions: {
      minimumExperience: 0,
      minimumHours: 1,
      maximumHours: 40
    },
    effectivePeriod: {
      startDate: new Date('2024-01-01'),
      endDate: null
    },
    priority: 8,
    calculationFormula: {
      formulaType: 'fixed'
    },
    status: 'active',
    metadata: {
      category: 'salary',
      tags: ['base', 'hourly', 'degree']
    },
    description: 'Mức lương cơ bản theo giờ cho giảng viên có bằng Thạc sĩ',
    approval: {
      isApproved: true,
      approvedAt: new Date('2024-01-01')
    }
  },
  {
    code: 'BASE_CN_HOURLY',
    name: 'Lương cơ bản theo giờ - Cử nhân',
    rateType: 'base_hourly',
    applicableScope: 'degree',
    targetModel: 'Degree',
    rateValues: {
      baseAmount: 100000, // 100k VND per hour for Bachelor
      coefficient: 1.0,
      minimumRate: 60000,
      maximumRate: 200000,
      stepIncrement: 5000
    },
    conditions: {
      minimumExperience: 0,
      minimumHours: 1,
      maximumHours: 40
    },
    effectivePeriod: {
      startDate: new Date('2024-01-01'),
      endDate: null
    },
    priority: 6,
    calculationFormula: {
      formulaType: 'fixed'
    },
    status: 'active',
    metadata: {
      category: 'salary',
      tags: ['base', 'hourly', 'degree']
    },
    description: 'Mức lương cơ bản theo giờ cho giảng viên có bằng Cử nhân',
    approval: {
      isApproved: true,
      approvedAt: new Date('2024-01-01')
    }
  },
  
  // Position-based bonus rates
  {
    code: 'BONUS_HEAD_DEPT',
    name: 'Phụ cấp Trưởng bộ môn',
    rateType: 'allowance',
    applicableScope: 'position',
    rateValues: {
      baseAmount: 2000000, // 2M VND monthly allowance
      coefficient: 1.0,
      minimumRate: 1500000,
      maximumRate: 3000000
    },
    conditions: {
      minimumExperience: 2,
      additionalCriteria: [{
        criteriaType: 'position',
        criteriaValue: 'Trưởng bộ môn',
        operator: 'equals'
      }]
    },
    effectivePeriod: {
      startDate: new Date('2024-01-01'),
      endDate: null
    },
    priority: 15,
    calculationFormula: {
      formulaType: 'fixed'
    },
    status: 'active',
    metadata: {
      category: 'allowance',
      tags: ['position', 'management', 'monthly']
    },
    description: 'Phụ cấp hàng tháng cho Trưởng bộ môn',
    approval: {
      isApproved: true,
      approvedAt: new Date('2024-01-01')
    }
  },
  
  // Overtime rates
  {
    code: 'OVERTIME_GENERAL',
    name: 'Lương làm thêm giờ',
    rateType: 'overtime',
    applicableScope: 'university',
    rateValues: {
      baseAmount: 50000, // 50k VND per overtime hour
      coefficient: 1.5, // 1.5x multiplier for overtime
      minimumRate: 40000,
      maximumRate: 100000
    },
    conditions: {
      minimumHours: 40, // Overtime after 40 base hours
      maximumHours: 60
    },
    effectivePeriod: {
      startDate: new Date('2024-01-01'),
      endDate: null
    },
    priority: 12,
    calculationFormula: {
      formulaType: 'percentage',
      formulaExpression: '$baseRate * 1.5'
    },
    status: 'active',
    metadata: {
      category: 'overtime',
      tags: ['overtime', 'hourly', 'multiplier']
    },
    description: 'Mức lương làm thêm giờ (1.5x lương cơ bản)',
    approval: {
      isApproved: true,
      approvedAt: new Date('2024-01-01')
    }
  },
  
  // Department-specific rates
  {
    code: 'CNTT_TECH_BONUS',
    name: 'Phụ cấp công nghệ - CNTT',
    rateType: 'bonus',
    applicableScope: 'department',
    targetModel: 'Department',
    rateValues: {
      baseAmount: 500000, // 500k VND monthly tech bonus
      coefficient: 1.0,
      minimumRate: 300000,
      maximumRate: 1000000
    },
    conditions: {
      minimumExperience: 1,
      additionalCriteria: [{
        criteriaType: 'department',
        criteriaValue: 'CNTT',
        operator: 'equals'
      }]
    },
    effectivePeriod: {
      startDate: new Date('2024-01-01'),
      endDate: null
    },
    priority: 7,
    calculationFormula: {
      formulaType: 'fixed'
    },
    status: 'active',
    metadata: {
      category: 'bonus',
      tags: ['department', 'technology', 'monthly']
    },
    description: 'Phụ cấp công nghệ cho giảng viên khoa CNTT',
    approval: {
      isApproved: true,
      approvedAt: new Date('2024-01-01')
    }
  }
];

// Sample Salary Calculations - will be created after rate settings
const createSampleSalaryCalculations = async () => {
  const academicYears = await AcademicYear.find().sort({ startYear: -1 });
  const semesters = await Semester.find().sort({ startDate: -1 });
  const teachers = await Teacher.find().populate('degreeId departmentId');
  
  if (academicYears.length === 0 || semesters.length === 0 || teachers.length === 0) {
    console.log('⚠️  Missing base data for salary calculations');
    return [];
  }
  
  const currentAcademicYear = academicYears[0];
  const currentSemester = semesters[0];
  
  const salaryCalculationsData = [];
  
  // Create salary calculations for each teacher
  for (const teacher of teachers.slice(0, 3)) { // First 3 teachers for demo
    const teachingAssignments = await TeachingAssignment.find({
      teacherId: teacher._id,
      semesterId: currentSemester._id,
      status: { $in: ['confirmed', 'in_progress', 'completed'] }
    }).populate('classId subjectId');
    
    if (teachingAssignments.length === 0) continue;
    
    const calculationData = {
      teacherId: teacher._id,
      calculationPeriod: {
        periodType: 'semester',
        startDate: currentSemester.startDate,
        endDate: currentSemester.endDate,
        academicYearId: currentAcademicYear._id,
        semesterId: currentSemester._id,
        year: currentAcademicYear.startYear
      },
      teachingAssignments: teachingAssignments.map(assignment => ({
        assignmentId: assignment._id,
        classId: assignment.classId._id,
        subjectId: assignment.subjectId._id,
        assignmentType: assignment.assignmentType,
        totalHours: assignment.workload.teachingHours,
        baseHours: assignment.workload.teachingHours,
        overtimeHours: assignment.workload.additionalHours || 0,
        appliedRates: [],
        assignmentTotal: {
          baseAmount: 0,
          overtimeAmount: 0,
          bonusAmount: 0,
          allowanceAmount: 0,
          totalAmount: 0
        }
      })),
      calculationResults: {
        baseSalary: { totalBaseHours: 0, averageHourlyRate: 0, totalBaseAmount: 0 },
        overtime: { totalOvertimeHours: 0, overtimeRate: 0, totalOvertimeAmount: 0 },
        additionalPayments: { totalBonusAmount: 0, totalAllowanceAmount: 0, totalDeductionAmount: 0 },
        totalGrossSalary: 0,
        totalNetSalary: 0
      },
      coefficients: {
        degreeCoefficient: {
          degreeId: teacher.degreeId._id,
          coefficientValue: teacher.degreeId.coefficient || 1.0,
          appliedAmount: 0
        },
        positionCoefficient: {
          position: teacher.position,
          coefficientValue: 1.0,
          appliedAmount: 0
        },
        experienceCoefficient: {
          yearsOfService: teacher.yearsOfService || 0,
          coefficientValue: 1.0,
          appliedAmount: 0
        }
      },
      calculationStatus: {
        status: 'draft'
      },
      calculationMetadata: {
        calculationMethod: 'automatic',
        dataSource: 'teaching_assignments'
      },
      auditTrail: [{
        action: 'created',
        performedAt: new Date(),
        notes: 'Tạo bản tính lương mẫu từ seed data'
      }]
    };
    
    salaryCalculationsData.push(calculationData);
  }
  
  return salaryCalculationsData;
};

// Create Period Rates sample data
const createPeriodRates = async (academicYears) => {
  const periodRatesData = [
    // Rates for academic year 2023-2024
    {
      name: 'Định mức cơ bản 2023-2024',
      ratePerPeriod: 150000,
      academicYearId: academicYears[0]._id,
      effectiveDate: new Date('2023-09-01'),
      isActive: false,
      description: 'Định mức tiền theo tiết học năm 2023-2024'
    },
    {
      name: 'Định mức điều chỉnh T10/2023',
      ratePerPeriod: 165000,
      academicYearId: academicYears[0]._id,
      effectiveDate: new Date('2023-10-01'),
      endDate: new Date('2023-12-31'),
      isActive: false,
      description: 'Định mức tăng từ tháng 10/2023'
    },
    {
      name: 'Định mức cuối năm 2023-2024',
      ratePerPeriod: 175000,
      academicYearId: academicYears[0]._id,
      effectiveDate: new Date('2024-01-01'),
      isActive: false,
      description: 'Định mức cuối năm học 2023-2024'
    },
    
    // Rates for academic year 2024-2025
    {
      name: 'Định mức đầu năm 2024-2025',
      ratePerPeriod: 180000,
      academicYearId: academicYears[1]._id,
      effectiveDate: new Date('2024-09-01'),
      endDate: new Date('2024-11-30'),
      isActive: false,
      description: 'Định mức đầu năm học 2024-2025'
    },
    {
      name: 'Định mức cải thiện T12/2024',
      ratePerPeriod: 195000,
      academicYearId: academicYears[1]._id,
      effectiveDate: new Date('2024-12-01'),
      isActive: true,
      description: 'Định mức cải thiện từ tháng 12/2024 - hiện đang áp dụng'
    }
  ];

  return periodRatesData;
};

const seedData = async () => {
  try {
    console.log('🌱 Bắt đầu seeding data...');

    // Connect to database
    await connectDB();

    // Clear existing data
    await Promise.all([
      AcademicYear.deleteMany({}),
      Semester.deleteMany({}),
      Degree.deleteMany({}),
      Department.deleteMany({}),
      Teacher.deleteMany({}),
      Subject.deleteMany({}),
      Class.deleteMany({}),
      TeachingAssignment.deleteMany({}),
      RateSetting.deleteMany({}),
      PeriodRate.deleteMany({}),
      SalaryCalculation.deleteMany({})
    ]);

    console.log('🗑️ Đã xóa dữ liệu cũ');

    // 1. Create Academic Years
    const academicYears = await AcademicYear.create([
      {
        code: '2023-2024',
        name: 'Năm học 2023-2024',
        startYear: 2023,
        endYear: 2024,
        startDate: new Date('2023-09-01'),
        endDate: new Date('2024-08-31'),
        status: 'completed',
        description: 'Năm học 2023-2024'
      },
      {
        code: '2024-2025',
        name: 'Năm học 2024-2025',
        startYear: 2024,
        endYear: 2025,
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-08-31'),
        status: 'active',
        description: 'Năm học 2024-2025'
      }
    ]);

    console.log('✅ Đã tạo năm học');

    // 2. Create Semesters
    const semesters = await Semester.create([
      // 2023-2024
      {
        code: '2023-2024.1',
        name: 'Học kì 1 năm 2023-2024',
        academicYearId: academicYears[0]._id,
        semesterNumber: 1,
        semesterType: 'regular',
        startDate: new Date('2023-09-01'),
        endDate: new Date('2024-01-15'),
        registrationStartDate: new Date('2023-08-15'),
        registrationEndDate: new Date('2023-08-30'),
        status: 'completed',
        maxCredits: 24,
        tuitionDeadline: new Date('2023-10-15'),
        description: 'Học kì 1 năm học 2023-2024'
      },
      {
        code: '2023-2024.2',
        name: 'Học kì 2 năm 2023-2024',
        academicYearId: academicYears[0]._id,
        semesterNumber: 2,
        semesterType: 'regular',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-06-15'),
        registrationStartDate: new Date('2024-01-20'),
        registrationEndDate: new Date('2024-01-31'),
        status: 'completed',
        maxCredits: 24,
        tuitionDeadline: new Date('2024-03-15'),
        description: 'Học kì 2 năm học 2023-2024'
      },
      // 2024-2025
      {
        code: '2024-2025.1',
        name: 'Học kì 1 năm 2024-2025',
        academicYearId: academicYears[1]._id,
        semesterNumber: 1,
        semesterType: 'regular',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-01-15'),
        registrationStartDate: new Date('2024-08-15'),
        registrationEndDate: new Date('2024-08-30'),
        status: 'active',
        maxCredits: 24,
        tuitionDeadline: new Date('2024-10-15'),
        description: 'Học kì 1 năm học 2024-2025'
      },
      {
        code: '2024-2025.2',
        name: 'Học kì 2 năm 2024-2025',
        academicYearId: academicYears[1]._id,
        semesterNumber: 2,
        semesterType: 'regular',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-06-15'),
        registrationStartDate: new Date('2025-01-20'),
        registrationEndDate: new Date('2025-01-31'),
        status: 'planning',
        maxCredits: 24,
        tuitionDeadline: new Date('2025-03-15'),
        description: 'Học kì 2 năm học 2024-2025'
      }
    ]);

    console.log('✅ Đã tạo học kì');

    // 3. Create Degrees
    const degrees = await Degree.create([
      {
        code: 'TS',
        name: 'Tiến sĩ',
        coefficient: 2.34,
        description: 'Bằng Tiến sĩ'
      },
      {
        code: 'THS',
        name: 'Thạc sĩ',
        coefficient: 1.86,
        description: 'Bằng Thạc sĩ'
      },
      {
        code: 'CN',
        name: 'Cử nhân',
        coefficient: 1.48,
        description: 'Bằng Cử nhân'
      },
      {
        code: 'CD',
        name: 'Cao đẳng',
        coefficient: 1.00,
        description: 'Bằng Cao đẳng'
      }
    ]);

    console.log('✅ Đã tạo bằng cấp');

    // 4. Create Departments
    const departments = await Department.create([
      {
        code: 'CNTT',
        name: 'Công nghệ thông tin',
        description: 'Khoa Công nghệ thông tin',
        establishedDate: new Date('2005-01-01'),
        phone: '0123456789',
        email: 'cntt@university.edu.vn'
      },
      {
        code: 'KTCK',
        name: 'Kỹ thuật cơ khí',
        description: 'Khoa Kỹ thuật cơ khí',
        establishedDate: new Date('2003-01-01'),
        phone: '0123456790',
        email: 'ktck@university.edu.vn'
      },
      {
        code: 'QTKD',
        name: 'Quản trị kinh doanh',
        description: 'Khoa Quản trị kinh doanh',
        establishedDate: new Date('2008-01-01'),
        phone: '0123456791',
        email: 'qtkd@university.edu.vn'
      },
      {
        code: 'NN',
        name: 'Ngoại ngữ',
        description: 'Khoa Ngoại ngữ',
        establishedDate: new Date('2006-01-01'),
        phone: '0123456792',
        email: 'nn@university.edu.vn'
      }
    ]);

    console.log('✅ Đã tạo khoa');

    // 5. Create Teachers
    const teachers = await Teacher.create([
      {
        code: 'GV001',
        fullName: 'Nguyễn Văn An',
        email: 'nvan@university.edu.vn',
        phone: '0987654321',
        departmentId: departments[0]._id, // CNTT
        degreeId: degrees[0]._id, // TS
        position: 'Trưởng bộ môn',
        gender: 'Nam',
        birthDate: new Date('1980-05-15'),
        hireDate: new Date('2010-09-01'),
        address: '123 Đường ABC, Quận 1, TP.HCM',
        identityNumber: '123456789012',
        notes: 'Giảng viên kinh nghiệm trong lĩnh vực CNTT'
      },
      {
        code: 'GV002',
        fullName: 'Trần Thị Bình',
        email: 'ttbinh@university.edu.vn',
        phone: '0987654323',
        departmentId: departments[0]._id, // CNTT
        degreeId: degrees[1]._id, // THS
        position: 'Giảng viên',
        gender: 'Nữ',
        birthDate: new Date('1985-08-20'),
        hireDate: new Date('2015-02-01'),
        address: '456 Đường DEF, Quận 3, TP.HCM',
        identityNumber: '123456789013',
        notes: 'Chuyên gia về phát triển web'
      },
      {
        code: 'GV003',
        fullName: 'Lê Hoàng Cường',
        email: 'lhcuong@university.edu.vn',
        phone: '0987654325',
        departmentId: departments[1]._id, // KTCK
        degreeId: degrees[0]._id, // TS
        position: 'Trưởng khoa',
        gender: 'Nam',
        birthDate: new Date('1975-12-10'),
        hireDate: new Date('2005-08-15'),
        address: '789 Đường GHI, Quận 5, TP.HCM',
        identityNumber: '123456789014',
        notes: 'Trưởng khoa Kỹ thuật cơ khí'
      },
      {
        code: 'GV004',
        fullName: 'Phạm Thị Dung',
        email: 'ptdung@university.edu.vn',
        phone: '0987654326',
        departmentId: departments[2]._id, // QTKD
        degreeId: degrees[1]._id, // THS
        position: 'Phó khoa',
        gender: 'Nữ',
        birthDate: new Date('1982-03-25'),
        hireDate: new Date('2012-01-10'),
        address: '321 Đường JKL, Quận 7, TP.HCM',
        identityNumber: '123456789015',
        notes: 'Phó khoa Quản trị kinh doanh'
      },
      {
        code: 'GV005',
        fullName: 'Võ Minh Tuấn',
        email: 'vmtuan@university.edu.vn',
        phone: '0987654327',
        departmentId: departments[3]._id, // NN
        degreeId: degrees[2]._id, // CN
        position: 'Giảng viên',
        gender: 'Nam',
        birthDate: new Date('1990-07-08'),
        hireDate: new Date('2018-06-01'),
        address: '654 Đường MNO, Quận 10, TP.HCM',
        identityNumber: '123456789016',
        notes: 'Giảng viên trẻ năng động'
      }
    ]);

    console.log('✅ Đã tạo giảng viên');

    // 6. Create Subjects
    const subjects = await Subject.create([
      // CNTT
      {
        code: 'CNTT101',
        name: 'Nhập môn lập trình',
        credits: 3,
        coefficient: 1.0,
        soTietLyThuyet: 30,
        soTietThucHanh: 15,
        departmentId: departments[0]._id,
        description: 'Học phần cơ bản về lập trình máy tính'
      },
      {
        code: 'CNTT201',
        name: 'Cấu trúc dữ liệu và giải thuật',
        credits: 4,
        coefficient: 1.2,
        soTietLyThuyet: 40,
        soTietThucHanh: 20,
        departmentId: departments[0]._id,
        prerequisites: [],
        description: 'Các cấu trúc dữ liệu cơ bản và giải thuật'
      },
      {
        code: 'CNTT301',
        name: 'Cơ sở dữ liệu',
        credits: 3,
        coefficient: 1.1,
        soTietLyThuyet: 25,
        soTietThucHanh: 20,
        departmentId: departments[0]._id,
        description: 'Thiết kế và quản lý cơ sở dữ liệu'
      },
      // KTCK
      {
        code: 'KTCK101',
        name: 'Cơ học kỹ thuật',
        credits: 3,
        coefficient: 1.0,
        soTietLyThuyet: 35,
        soTietThucHanh: 10,
        departmentId: departments[1]._id,
        description: 'Cơ sở cơ học trong kỹ thuật'
      },
      {
        code: 'KTCK201',
        name: 'Vật liệu kỹ thuật',
        credits: 2,
        coefficient: 0.8,
        soTietLyThuyet: 20,
        soTietThucHanh: 10,
        departmentId: departments[1]._id,
        description: 'Tính chất và ứng dụng vật liệu'
      },
      // QTKD
      {
        code: 'QTKD101',
        name: 'Nguyên lý quản trị',
        credits: 3,
        coefficient: 1.0,
        soTietLyThuyet: 30,
        soTietThucHanh: 15,
        departmentId: departments[2]._id,
        description: 'Các nguyên lý cơ bản trong quản trị'
      },
      {
        code: 'QTKD201',
        name: 'Marketing căn bản',
        credits: 3,
        coefficient: 1.0,
        soTietLyThuyet: 25,
        soTietThucHanh: 20,
        departmentId: departments[2]._id,
        description: 'Kiến thức cơ bản về marketing'
      },
      // NN
      {
        code: 'NN101',
        name: 'Tiếng Anh cơ bản',
        credits: 2,
        coefficient: 0.8,
        soTietLyThuyet: 20,
        soTietThucHanh: 10,
        departmentId: departments[3]._id,
        description: 'Tiếng Anh căn bản cho sinh viên'
      },
      {
        code: 'NN201',
        name: 'Tiếng Anh chuyên ngành',
        credits: 3,
        coefficient: 1.0,
        soTietLyThuyet: 25,
        soTietThucHanh: 20,
        departmentId: departments[3]._id,
        description: 'Tiếng Anh chuyên ngành kỹ thuật'
      }
    ]);

    console.log('✅ Đã tạo học phần');

    // Add prerequisites relationship
    await Subject.findByIdAndUpdate(subjects[1]._id, {
      prerequisites: [subjects[0]._id] // CNTT201 requires CNTT101
    });

    await Subject.findByIdAndUpdate(subjects[2]._id, {
      prerequisites: [subjects[1]._id] // CNTT301 requires CNTT201
    });

    await Subject.findByIdAndUpdate(subjects[8]._id, {
      prerequisites: [subjects[7]._id] // NN201 requires NN101
    });

    console.log('✅ Đã cập nhật điều kiện tiên quyết');

    // 7. Create Classes
    const classes = await Class.create([
      // Current semester classes
      {
        code: 'CNTT101.01',
        name: 'Lớp 1 - Nhập môn lập trình',
        subjectId: subjects[0]._id,
        academicYearId: academicYears[1]._id, // 2024-2025
        studentCount: 45,
        maxStudents: 50,
        schedule: {
          dayOfWeek: 2, // Thứ 2
          startPeriod: 1,
          periodsCount: 3,
          room: 'A101'
        },
        classType: 'theory',
        teachingMethod: 'offline',
        description: 'Lớp học phần nhập môn lập trình cho sinh viên năm nhất'
      },
      {
        code: 'CNTT101.02',
        name: 'Lớp 2 - Nhập môn lập trình',
        subjectId: subjects[0]._id,
        academicYearId: academicYears[1]._id, // 2024-2025
        studentCount: 48,
        maxStudents: 50,
        schedule: {
          dayOfWeek: 3, // Thứ 3
          startPeriod: 4,
          periodsCount: 3,
          room: 'A102'
        },
        classType: 'theory',
        teachingMethod: 'offline',
        description: 'Lớp học phần nhập môn lập trình cho sinh viên năm nhất'
      },
      {
        code: 'CNTT201.01',
        name: 'Lớp 1 - Cấu trúc dữ liệu',
        subjectId: subjects[1]._id,
        academicYearId: academicYears[1]._id, // 2024-2025
        studentCount: 38,
        maxStudents: 40,
        schedule: {
          dayOfWeek: 4, // Thứ 4
          startPeriod: 1,
          periodsCount: 4,
          room: 'A201'
        },
        classType: 'theory',
        teachingMethod: 'offline',
        description: 'Lớp học phần cấu trúc dữ liệu cho sinh viên năm hai'
      },
      {
        code: 'CNTT301.01',
        name: 'Lớp 1 - Cơ sở dữ liệu',
        subjectId: subjects[2]._id,
        academicYearId: academicYears[1]._id, // 2024-2025
        studentCount: 35,
        maxStudents: 40,
        schedule: {
          dayOfWeek: 5, // Thứ 5
          startPeriod: 7,
          periodsCount: 3,
          room: 'A301'
        },
        classType: 'theory',
        teachingMethod: 'hybrid',
        description: 'Lớp học phần cơ sở dữ liệu cho sinh viên năm ba'
      },
      {
        code: 'KTCK101.01',
        name: 'Lớp 1 - Cơ học kỹ thuật',
        subjectId: subjects[3]._id,
        academicYearId: academicYears[1]._id, // 2024-2025
        studentCount: 42,
        maxStudents: 45,
        schedule: {
          dayOfWeek: 2, // Thứ 2
          startPeriod: 7,
          periodsCount: 3,
          room: 'B101'
        },
        classType: 'theory',
        teachingMethod: 'offline',
        description: 'Lớp học phần cơ học kỹ thuật cho sinh viên năm nhất'
      },
      {
        code: 'QTKD101.01',
        name: 'Lớp 1 - Nguyên lý quản trị',
        subjectId: subjects[5]._id,
        academicYearId: academicYears[1]._id, // 2024-2025
        studentCount: 55,
        maxStudents: 60,
        schedule: {
          dayOfWeek: 3, // Thứ 3
          startPeriod: 1,
          periodsCount: 3,
          room: 'C101'
        },
        classType: 'theory',
        teachingMethod: 'offline',
        description: 'Lớp học phần nguyên lý quản trị cho sinh viên năm nhất'
      },
      {
        code: 'NN101.01',
        name: 'Lớp 1 - Tiếng Anh cơ bản',
        subjectId: subjects[7]._id,
        academicYearId: academicYears[1]._id, // 2024-2025
        studentCount: 25,
        maxStudents: 30,
        schedule: {
          dayOfWeek: 6, // Thứ 6
          startPeriod: 1,
          periodsCount: 2,
          room: 'D101'
        },
        classType: 'theory',
        teachingMethod: 'offline',
        description: 'Lớp học phần tiếng Anh cơ bản cho sinh viên năm nhất'
      },
      {
        code: 'CNTT101.03',
        name: 'Lớp 3 - Nhập môn lập trình',
        subjectId: subjects[0]._id,
        academicYearId: academicYears[1]._id, // 2024-2025
        studentCount: 44,
        maxStudents: 50,
        schedule: {
          dayOfWeek: 2,
          startPeriod: 4,
          periodsCount: 3,
          room: 'A103'
        },
        classType: 'theory',
        teachingMethod: 'offline',
        description: 'Lớp học phần nhập môn lập trình cho sinh viên năm nhất'
      },
      {
        code: 'KTCK201.01',
        name: 'Lớp 1 - Vật liệu kỹ thuật',
        subjectId: subjects[4]._id,
        academicYearId: academicYears[1]._id, // 2024-2025
        studentCount: 30,
        maxStudents: 35,
        schedule: {
          dayOfWeek: 4,
          startPeriod: 7,
          periodsCount: 2,
          room: 'B201'
        },
        classType: 'lab',
        teachingMethod: 'offline',
        description: 'Lớp học phần vật liệu kỹ thuật cho sinh viên năm hai'
      }
    ]);

    console.log('✅ Đã tạo lớp học phần');

    // 8. Create Teaching Assignments - inspired by Payroll Engine's employee assignments
    const teachingAssignments = await TeachingAssignment.create([
      // Current semester assignments (2024-2025.1)
      {
        code: `${teachers[0].code}_${classes[0].code}_1`,
        teacherId: teachers[0]._id, // Nguyễn Văn An (CNTT - TS)
        classId: classes[0]._id, // CNTT101.01
        academicYearId: academicYears[1]._id, // 2024-2025
        assignmentType: 'chính',
        periods: 45, // Required field
        teachingCoefficient: 1.2, // Hệ số cao do TS
        workloadDistribution: {
          lectureHours: 30,
          practiceHours: 15,
          labHours: 0,
          otherHours: 0
        },
        schedule: {
          startDate: new Date('2024-09-01'),
          endDate: new Date('2025-01-15')
        },
        compensation: {
          baseRate: 250000, // 250k/giờ
          additionalRate: 50000, // Phụ cấp trưởng bộ môn
          overtimeRate: 0
        },
        status: 'confirmed',
        approval: {
          isApproved: true,
          approvedAt: new Date('2024-08-25'),
          approvalNotes: 'Phê duyệt phân công giảng dạy học kì 1'
        },
        notes: 'Phân công chính - Giảng viên có kinh nghiệm'
      },
      {
        code: `${teachers[1].code}_${classes[1].code}_1`,
        teacherId: teachers[1]._id, // Trần Thị Bình (CNTT - THS)
        classId: classes[1]._id, // CNTT101.02
        academicYearId: academicYears[1]._id, // 2024-2025
        assignmentType: 'chính',
        periods: 45, // Required field
        teachingCoefficient: 1.0,
        workloadDistribution: {
          lectureHours: 30,
          practiceHours: 15,
          labHours: 0,
          otherHours: 0
        },
        schedule: {
          startDate: new Date('2024-09-01'),
          endDate: new Date('2025-01-15')
        },
        compensation: {
          baseRate: 200000, // 200k/giờ
          additionalRate: 0,
          overtimeRate: 0
        },
        status: 'confirmed',
        approval: {
          isApproved: true,
          approvedAt: new Date('2024-08-25'),
          approvalNotes: 'Phê duyệt phân công giảng dạy'
        },
        notes: 'Phân công chính - Chuyên gia web development'
      },
      {
        code: `${teachers[0].code}_${classes[2].code}_1`,
        teacherId: teachers[0]._id, // Nguyễn Văn An
        classId: classes[2]._id, // CNTT201.01 - Cấu trúc dữ liệu
        academicYearId: academicYears[1]._id, // 2024-2025
        assignmentType: 'chính',
        periods: 60, // Required field
        teachingCoefficient: 1.3, // Hệ số cao do môn khó
        workloadDistribution: {
          lectureHours: 40,
          practiceHours: 20,
          labHours: 0,
          otherHours: 0
        },
        schedule: {
          startDate: new Date('2024-09-01'),
          endDate: new Date('2025-01-15')
        },
        compensation: {
          baseRate: 250000,
          additionalRate: 50000,
          overtimeRate: 0
        },
        status: 'in_progress',
        approval: {
          isApproved: true,
          approvedAt: new Date('2024-08-25')
        },
        performance: {
          attendanceRate: 98,
          completionRate: 65
        },
        notes: 'Học phần nâng cao - Cần theo dõi tiến độ'
      },
      {
        code: `${teachers[1].code}_${classes[3].code}_1`,
        teacherId: teachers[1]._id, // Trần Thị Bình
        classId: classes[3]._id, // CNTT301.01 - Cơ sở dữ liệu
        academicYearId: academicYears[1]._id, // 2024-2025
        assignmentType: 'chính',
        periods: 45, // Required field
        teachingCoefficient: 1.1,
        workloadDistribution: {
          lectureHours: 25,
          practiceHours: 10,
          labHours: 10,
          otherHours: 0
        },
        schedule: {
          startDate: new Date('2024-09-01'),
          endDate: new Date('2025-01-15')
        },
        compensation: {
          baseRate: 200000,
          additionalRate: 0,
          overtimeRate: 0
        },
        status: 'in_progress',
        approval: {
          isApproved: true,
          approvedAt: new Date('2024-08-25')
        },
        performance: {
          attendanceRate: 100,
          completionRate: 70
        },
        notes: 'Môn thực hành nhiều - Phương pháp hybrid'
      },
      {
        code: `${teachers[2].code}_${classes[4].code}_1`,
        teacherId: teachers[2]._id, // Lê Hoàng Cường (KTCK - TS)
        classId: classes[4]._id, // KTCK101.01
        academicYearId: academicYears[1]._id, // 2024-2025
        assignmentType: 'chính',
        periods: 45, // Required field
        teachingCoefficient: 1.5, // Hệ số cao do trưởng khoa
        workloadDistribution: {
          lectureHours: 35,
          practiceHours: 10,
          labHours: 0,
          otherHours: 0
        },
        schedule: {
          startDate: new Date('2024-09-01'),
          endDate: new Date('2025-01-15')
        },
        compensation: {
          baseRate: 300000, // Mức lương cao
          additionalRate: 100000, // Phụ cấp trưởng khoa
          overtimeRate: 0
        },
        status: 'confirmed',
        approval: {
          isApproved: true,
          approvedAt: new Date('2024-08-20'),
          approvalNotes: 'Phê duyệt ưu tiên - Trưởng khoa'
        },
        notes: 'Trưởng khoa trực tiếp giảng dạy'
      },
      {
        code: `${teachers[3].code}_${classes[5].code}_1`,
        teacherId: teachers[3]._id, // Phạm Thị Dung (QTKD - THS)
        classId: classes[5]._id, // QTKD101.01
        academicYearId: academicYears[1]._id, // 2024-2025
        assignmentType: 'chính',
        periods: 45, // Required field
        teachingCoefficient: 1.2, // Hệ số phó khoa
        workloadDistribution: {
          lectureHours: 40,
          practiceHours: 5,
          labHours: 0,
          otherHours: 0
        },
        schedule: {
          startDate: new Date('2024-09-01'),
          endDate: new Date('2025-01-15')
        },
        compensation: {
          baseRate: 220000,
          additionalRate: 80000, // Phụ cấp phó khoa
          overtimeRate: 0
        },
        status: 'confirmed',
        approval: {
          isApproved: true,
          approvedAt: new Date('2024-08-22'),
          approvalNotes: 'Phê duyệt phân công phó khoa'
        },
        notes: 'Phó khoa kiêm giảng - Môn cơ bản'
      },
      {
        code: `${teachers[4].code}_${classes[6].code}_1`,
        teacherId: teachers[4]._id, // Võ Minh Tuấn (NN - CN)
        classId: classes[6]._id, // NN101.01
        academicYearId: academicYears[1]._id, // 2024-2025
        assignmentType: 'chính',
        periods: 30, // Required field
        teachingCoefficient: 0.9, // Hệ số thấp do cử nhân
        workloadDistribution: {
          lectureHours: 20,
          practiceHours: 10,
          labHours: 0,
          otherHours: 0
        },
        schedule: {
          startDate: new Date('2024-09-01'),
          endDate: new Date('2025-01-15')
        },
        compensation: {
          baseRate: 150000, // Mức lương thấp hơn
          additionalRate: 0,
          overtimeRate: 0
        },
        status: 'confirmed',
        approval: {
          isApproved: true,
          approvedAt: new Date('2024-08-28'),
          approvalNotes: 'Phê duyệt phân công giảng viên mới'
        },
        notes: 'Giảng viên mới - Cần hỗ trợ'
      },
      // Some assignments for previous semester (completed)
      {
        code: `${teachers[0].code}_${classes[7].code}_1`,
        teacherId: teachers[0]._id,
        classId: classes[7]._id, // CNTT101.03 (Spring 2024)
        academicYearId: academicYears[0]._id, // 2023-2024
        assignmentType: 'chính',
        periods: 45, // Required field
        teachingCoefficient: 1.2,
        workloadDistribution: {
          lectureHours: 30,
          practiceHours: 15,
          labHours: 0,
          otherHours: 0
        },
        schedule: {
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-06-15'),
          actualStartDate: new Date('2024-02-01'),
          actualEndDate: new Date('2024-06-15')
        },
        compensation: {
          baseRate: 250000,
          additionalRate: 50000,
          overtimeRate: 0
        },
        status: 'completed',
        approval: {
          isApproved: true,
          approvedAt: new Date('2024-01-20'),
          approvalNotes: 'Hoàn thành xuất sắc'
        },
        performance: {
          attendanceRate: 100,
          studentFeedback: 4.8,
          completionRate: 100
        },
        notes: 'Đã hoàn thành xuất sắc - Đánh giá cao từ sinh viên'
      },
      // Assignment with support role
      {
        code: `${teachers[4].code}_${classes[0].code}_2`,
        teacherId: teachers[4]._id, // Võ Minh Tuấn hỗ trợ
        classId: classes[0]._id, // CNTT101.01
        academicYearId: academicYears[1]._id, // 2024-2025
        assignmentType: 'hỗ_trợ',
        periods: 15, // Required field - Chỉ hỗ trợ thực hành
        teachingCoefficient: 0.8,
        workloadDistribution: {
          lectureHours: 0,
          practiceHours: 15,
          labHours: 0,
          otherHours: 0
        },
        schedule: {
          startDate: new Date('2024-09-01'),
          endDate: new Date('2025-01-15')
        },
        compensation: {
          baseRate: 150000, // Mức thấp hơn cho hỗ trợ
          additionalRate: 0,
          overtimeRate: 0
        },
        status: 'assigned',
        notes: 'Hỗ trợ thực hành cho giảng viên chính'
      }
    ]);

    console.log('✅ Đã tạo phân công giảng dạy');

    // Update head teacher for departments
    await Department.findByIdAndUpdate(departments[0]._id, {
      headTeacherId: teachers[0]._id // Nguyễn Văn An - CNTT
    });

    await Department.findByIdAndUpdate(departments[1]._id, {
      headTeacherId: teachers[2]._id // Lê Hoàng Cường - KTCK
    });

    await Department.findByIdAndUpdate(departments[2]._id, {
      headTeacherId: teachers[3]._id // Phạm Thị Dung - QTKD
    });

    console.log('✅ Đã cập nhật trưởng khoa');

    // 9. Create Period Rates
    const periodRatesData = await createPeriodRates(academicYears);
    const periodRates = await PeriodRate.create(periodRatesData);
    console.log('✅ Đã tạo định mức tiền theo tiết');
      
    // Skip RateSetting and SalaryCalculation for now to avoid validation errors
    console.log('⚠️  Bỏ qua tạo rate settings và salary calculations');
    const rateSettings = [];
    const salaryCalculationsData = [];

    console.log('🎉 Seeding data hoàn thành!');
    console.log(`
📊 Tổng kết:
- ${academicYears.length} năm học
- ${semesters.length} học kì
- ${degrees.length} bằng cấp
- ${departments.length} khoa
- ${teachers.length} giảng viên
- ${subjects.length} học phần
- ${classes.length} lớp học phần
- ${teachingAssignments.length} phân công giảng dạy
- ${periodRates.length} định mức tiền theo tiết
- ${rateSettings.length} rate settings
- ${salaryCalculationsData.length} salary calculations
    `);

  } catch (error) {
    console.error('❌ Lỗi khi seeding data:', error);
    throw error;
  }
};

module.exports = seedData;

// Execute seedData if this file is run directly
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('✅ Seed data completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error seeding data:', error);
      process.exit(1);
    });
} 