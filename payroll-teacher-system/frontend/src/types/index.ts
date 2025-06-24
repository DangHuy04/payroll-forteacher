// Academic Year & Semester Types
export interface AcademicYear {
  _id: string;
  name: string;
  code: string;
  startYear: number;
  endYear: number;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'planned';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Semester {
  _id: string;
  name: string;
  code: string;
  semesterType: 'HK1' | 'HK2' | 'HK3';
  academicYearId: string | AcademicYear;
  startDate: Date;
  endDate: Date;
  registrationDeadline: Date;
  status: 'planned' | 'registration_open' | 'in_progress' | 'exam_period' | 'completed';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Degree & Department Types
export interface Degree {
  _id: string;
  name: string;
  code: string;
  coefficient: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  headOfDepartment?: string;
  headTeacherId?: string | Teacher;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Teacher Types
export interface Teacher {
  _id: string;
  code: string;
  fullName: string;
  email: string;
  phone: string;
  departmentId: string | Department;
  degreeId: string | Degree;
  position: 'Trưởng bộ môn' | 'Phó trưởng bộ môn' | 'Giảng viên chính' | 'Giảng viên' | 'Trợ giảng';
  gender: 'Nam' | 'Nữ';
  birthDate: Date;
  hireDate: Date;
  address?: string;
  identityNumber: string;
  yearsOfService?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Subject & Class Types
export interface Subject {
  _id: string;
  name: string;
  code: string;
  credits: number;
  coefficient: number;
  soTietLyThuyet: number;
  soTietThucHanh: number;
  departmentId: string | Department;
  description?: string;
  prerequisites: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Class {
  _id: string;
  code: string;
  name: string;
  subjectId: string | Subject;
  studentCount: number;
  maxStudents: number;
  classCoefficient: number;
  schedule: {
    dayOfWeek: number;
    startPeriod: number;
    periodsCount: number;
    room?: string;
  };
  classType: 'theory' | 'practice' | 'lab' | 'seminar' | 'online';
  teachingMethod: 'offline' | 'online' | 'hybrid';
  description?: string;
  notes?: string;
  isActive: boolean;
  metadata: {
    teacherAssignments: number;
    totalTeachingHours: number;
    totalSalaryAmount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Teaching Assignment Types
export interface TeachingAssignment {
  _id: string;
  code: string;
  teacherId: string | Teacher;
  classId: string | Class;
  academicYearId: string | AcademicYear;
  assignmentType: 'chính' | 'phụ' | 'thay_thế' | 'hỗ_trợ';
    teachingHours: number;
  teachingCoefficient: number;
  workloadDistribution: {
    lectureHours: number;
    practiceHours: number;
    labHours: number;
    otherHours: number;
  };
  status: 'draft' | 'assigned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  schedule: {
    startDate: Date;
    endDate: Date;
    actualStartDate?: Date;
    actualEndDate?: Date;
  };
  compensation: {
    baseRate: number;
    additionalRate: number;
    overtimeRate: number;
  };
  performance?: {
    attendanceRate: number;
    studentFeedback?: number;
    completionRate: number;
  };
  approval: {
    isApproved: boolean;
    approvedBy?: string;
    approvedAt?: Date;
    approvalNotes?: string;
  };
  notes?: string;
  isActive: boolean;
  metadata: {
    version: number;
    lastModified: Date;
    createdBy?: string;
    tags: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// Rate Setting Types
export interface RateSetting {
  _id: string;
  code: string;
  name: string;
  rateType: 'base_hourly' | 'base_monthly' | 'overtime' | 'bonus' | 'allowance' | 'coefficient';
  applicableScope: 'university' | 'department' | 'position' | 'degree' | 'subject_type' | 'class_type';
  targetId?: string;
  targetModel?: 'Department' | 'Degree' | 'Subject';
  rateValues: {
    baseAmount: number;
    minimumRate: number;
    maximumRate?: number;
    coefficient: number;
    stepIncrement: number;
  };
  conditions: {
    minimumExperience: number;
    minimumHours: number;
    maximumHours?: number;
    minimumRating: number;
  };
  effectivePeriod: {
    startDate: Date;
    endDate?: Date;
    academicYearId?: string;
    semesterId?: string;
  };
  priority: number;
  status: 'draft' | 'pending_approval' | 'approved' | 'active' | 'inactive' | 'superseded';
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Period Rate Types
export interface PeriodRate {
  _id: string;
  name: string;
  ratePerPeriod: number;
  academicYearId: string | AcademicYear;
  effectiveDate: Date;
  endDate?: Date;
  description?: string;
  isActive: boolean;
  approvalStatus: 'draft' | 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  formattedRate?: string;
}

// Salary Calculation Types
export interface SalaryCalculation {
  _id: string;
  calculationId: string;
  teacherId: string | Teacher;
  calculationPeriod: {
    periodType: 'monthly' | 'semester' | 'academic_year' | 'custom';
    startDate: Date;
    endDate: Date;
    academicYearId: string | AcademicYear;
    semesterId: string | Semester;
    month?: number;
    year: number;
  };
  teachingAssignments: {
    assignmentId: string;
    classId: string;
    subjectId: string;
    assignmentType: string;
    totalHours: number;
    baseHours: number;
    overtimeHours: number;
    assignmentTotal: {
      baseAmount: number;
      overtimeAmount: number;
      bonusAmount: number;
      allowanceAmount: number;
      totalAmount: number;
    };
  }[];
  calculationResults: {
    baseSalary: {
      totalBaseHours: number;
      averageHourlyRate: number;
      totalBaseAmount: number;
    };
    overtime: {
      totalOvertimeHours: number;
      overtimeRate: number;
      totalOvertimeAmount: number;
    };
    additionalPayments: {
      totalBonusAmount: number;
      totalAllowanceAmount: number;
      totalDeductionAmount: number;
    };
    totalGrossSalary: number;
    totalNetSalary: number;
  };
  calculationStatus: {
    status: 'draft' | 'calculating' | 'calculated' | 'reviewing' | 'approved' | 'paid' | 'archived';
    calculatedAt?: Date;
    calculatedBy?: string;
    approvedAt?: Date;
    approvedBy?: string;
    paidAt?: Date;
    notes?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form Types
export interface TeacherFormData {
  code: string;
  fullName: string;
  email: string;
  phone: string;
  departmentId: string;
  degreeId: string;
  position: string;
  gender: string;
  birthDate: string;
  hireDate: string;
  address?: string;
  identityNumber: string;
  isActive?: boolean;
}

export interface ClassFormData {
  code?: string;
  name: string;
  subjectId: string;
  studentCount: number;
  maxStudents: number;
  schedule: {
    dayOfWeek: number;
    startPeriod: number;
    periodsCount: number;
    room?: string;
  };
  classType: 'theory' | 'practice' | 'lab' | 'seminar' | 'online';
  teachingMethod: 'offline' | 'online' | 'hybrid';
  description?: string;
  notes?: string;
}

export interface SalaryCalculationFormData {
  teacherId: string;
  calculationPeriod: {
    periodType: string;
    startDate: string;
    endDate: string;
    academicYearId: string;
    semesterId: string;
    year: number;
    month?: number;
  };
  teachingAssignmentIds?: string[];
  calculationMethod?: string;
}

export interface PeriodRateFormData {
  name: string;
  ratePerPeriod: number;
  academicYearId: string;
  effectiveDate: string;
  endDate?: string;
  description?: string;
  isActive?: boolean;
} 