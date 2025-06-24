import axios from 'axios';
import {
  ApiResponse,
  PaginatedResponse,
  Teacher,
  Department,
  Degree,
  Subject,
  Class,
  TeachingAssignment,
  RateSetting,
  PeriodRate,
  SalaryCalculation,
  AcademicYear,
  Semester,
  TeacherFormData,
  ClassFormData,
  PeriodRateFormData,
  SalaryCalculationFormData
} from '../types';

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Academic Years API
export const academicYearAPI = {
  getAll: (): Promise<PaginatedResponse<AcademicYear>> =>
    api.get('/academic-years').then(res => res.data),
  
  getById: (id: string): Promise<ApiResponse<AcademicYear>> =>
    api.get(`/academic-years/${id}`).then(res => res.data),
  
  getCurrent: (): Promise<ApiResponse<AcademicYear>> =>
    api.get('/academic-years/current').then(res => res.data),
    
  create: (data: Partial<AcademicYear>): Promise<ApiResponse<AcademicYear>> =>
    api.post('/academic-years', data).then(res => res.data),
    
  update: (id: string, data: Partial<AcademicYear>): Promise<ApiResponse<AcademicYear>> =>
    api.put(`/academic-years/${id}`, data).then(res => res.data),
    
  delete: (id: string): Promise<ApiResponse<void>> =>
    api.delete(`/academic-years/${id}`).then(res => res.data),
};

// Semesters API
export const semesterAPI = {
  getAll: (academicYearId?: string): Promise<PaginatedResponse<Semester>> =>
    api.get('/semesters', { params: { academicYearId } }).then(res => res.data),
  
  getById: (id: string): Promise<ApiResponse<Semester>> =>
    api.get(`/semesters/${id}`).then(res => res.data),
  
  getCurrent: (): Promise<ApiResponse<Semester>> =>
    api.get('/semesters/current').then(res => res.data),
    
  create: (data: Partial<Semester>): Promise<ApiResponse<Semester>> =>
    api.post('/semesters', data).then(res => res.data),
    
  update: (id: string, data: Partial<Semester>): Promise<ApiResponse<Semester>> =>
    api.put(`/semesters/${id}`, data).then(res => res.data),
    
  delete: (id: string): Promise<ApiResponse<void>> =>
    api.delete(`/semesters/${id}`).then(res => res.data),
};

// Degrees API
export const degreeAPI = {
  getAll: (): Promise<PaginatedResponse<Degree>> =>
    api.get('/degrees').then(res => res.data),
  
  getById: (id: string): Promise<ApiResponse<Degree>> =>
    api.get(`/degrees/${id}`).then(res => res.data),
  
  create: (data: Partial<Degree>): Promise<ApiResponse<Degree>> =>
    api.post('/degrees', data).then(res => res.data),
  
  update: (id: string, data: Partial<Degree>): Promise<ApiResponse<Degree>> =>
    api.put(`/degrees/${id}`, data).then(res => res.data),
  
  delete: (id: string): Promise<ApiResponse<void>> =>
    api.delete(`/degrees/${id}`).then(res => res.data),
};

// Departments API
export const departmentAPI = {
  getAll: (): Promise<PaginatedResponse<Department>> =>
    api.get('/departments').then(res => res.data),
  
  getById: (id: string): Promise<ApiResponse<Department>> =>
    api.get(`/departments/${id}`).then(res => res.data),
  
  create: (data: Partial<Department>): Promise<ApiResponse<Department>> =>
    api.post('/departments', data).then(res => res.data),
  
  update: (id: string, data: Partial<Department>): Promise<ApiResponse<Department>> =>
    api.put(`/departments/${id}`, data).then(res => res.data),
  
  delete: (id: string): Promise<ApiResponse<void>> =>
    api.delete(`/departments/${id}`).then(res => res.data),
  
  getStatistics: (id: string): Promise<ApiResponse<any>> =>
    api.get(`/departments/${id}/statistics`).then(res => res.data),
};

// Teachers API
export const teacherAPI = {
  getAll: (params?: any): Promise<PaginatedResponse<Teacher>> =>
    api.get('/teachers', { params }).then(res => res.data),
  
  getById: (id: string): Promise<ApiResponse<Teacher>> =>
    api.get(`/teachers/${id}`).then(res => res.data),
  
  create: (data: TeacherFormData): Promise<ApiResponse<Teacher>> =>
    api.post('/teachers', data).then(res => res.data),
  
  update: (id: string, data: Partial<TeacherFormData>): Promise<ApiResponse<Teacher>> =>
    api.put(`/teachers/${id}`, data).then(res => res.data),
  
  delete: (id: string): Promise<ApiResponse<void>> =>
    api.delete(`/teachers/${id}`).then(res => res.data),
  
  getByDepartment: (departmentId: string): Promise<PaginatedResponse<Teacher>> =>
    api.get(`/teachers/department/${departmentId}`).then(res => res.data),
  
  getStatistics: (): Promise<ApiResponse<any>> =>
    api.get('/teachers/statistics').then(res => res.data),
};

// Subjects API
export const subjectAPI = {
  getAll: (params?: any): Promise<PaginatedResponse<Subject>> =>
    api.get('/subjects', { params }).then(res => res.data),
  
  getById: (id: string): Promise<ApiResponse<Subject>> =>
    api.get(`/subjects/${id}`).then(res => res.data),
  
  create: (data: Partial<Subject>): Promise<ApiResponse<Subject>> =>
    api.post('/subjects', data).then(res => res.data),
  
  update: (id: string, data: Partial<Subject>): Promise<ApiResponse<Subject>> =>
    api.put(`/subjects/${id}`, data).then(res => res.data),
  
  delete: (id: string): Promise<ApiResponse<void>> =>
    api.delete(`/subjects/${id}`).then(res => res.data),
  
  getByDepartment: (departmentId: string): Promise<PaginatedResponse<Subject>> =>
    api.get(`/subjects/department/${departmentId}`).then(res => res.data),
};

// Classes API
export const classAPI = {
  getAll: (params?: any): Promise<PaginatedResponse<Class>> =>
    api.get('/classes', { params }).then(res => res.data),
  
  getById: (id: string): Promise<ApiResponse<Class>> =>
    api.get(`/classes/${id}`).then(res => res.data),
  
  create: (data: ClassFormData): Promise<ApiResponse<Class>> =>
    api.post('/classes', data).then(res => res.data),
  
  update: (id: string, data: Partial<ClassFormData>): Promise<ApiResponse<Class>> =>
    api.put(`/classes/${id}`, data).then(res => res.data),
  
  delete: (id: string): Promise<ApiResponse<void>> =>
    api.delete(`/classes/${id}`).then(res => res.data),
  
  getStatistics: (params?: any): Promise<ApiResponse<any>> =>
    api.get('/classes/statistics', { params }).then(res => res.data),
};

// Teaching Assignments API
export const teachingAssignmentAPI = {
  getAll: (params?: any): Promise<PaginatedResponse<TeachingAssignment>> =>
    api.get('/teaching-assignments', { params }).then(res => res.data),
  
  getById: (id: string): Promise<ApiResponse<TeachingAssignment>> =>
    api.get(`/teaching-assignments/${id}`).then(res => res.data),
  
  create: (data: Partial<TeachingAssignment>): Promise<ApiResponse<TeachingAssignment>> =>
    api.post('/teaching-assignments', data).then(res => res.data),
  
  update: (id: string, data: Partial<TeachingAssignment>): Promise<ApiResponse<TeachingAssignment>> =>
    api.put(`/teaching-assignments/${id}`, data).then(res => res.data),
  
  delete: (id: string): Promise<ApiResponse<void>> =>
    api.delete(`/teaching-assignments/${id}`).then(res => res.data),
  
  getByTeacher: (teacherId: string, params?: any): Promise<PaginatedResponse<TeachingAssignment>> =>
    api.get(`/teaching-assignments/teacher/${teacherId}`, { params }).then(res => res.data),
  
  getStatistics: (): Promise<ApiResponse<any>> =>
    api.get('/teaching-assignments/statistics').then(res => res.data),
};

// Rate Settings API
export const rateSettingAPI = {
  getAll: (params?: any): Promise<PaginatedResponse<RateSetting>> =>
    api.get('/rate-settings', { params }).then(res => res.data),
  
  getById: (id: string): Promise<ApiResponse<RateSetting>> =>
    api.get(`/rate-settings/${id}`).then(res => res.data),
  
  create: (data: Partial<RateSetting>): Promise<ApiResponse<RateSetting>> =>
    api.post('/rate-settings', data).then(res => res.data),
  
  update: (id: string, data: Partial<RateSetting>): Promise<ApiResponse<RateSetting>> =>
    api.put(`/rate-settings/${id}`, data).then(res => res.data),
  
  delete: (id: string): Promise<ApiResponse<void>> =>
    api.delete(`/rate-settings/${id}`).then(res => res.data),
  
  getActive: (): Promise<PaginatedResponse<RateSetting>> =>
    api.get('/rate-settings/active').then(res => res.data),
  
  getByScope: (scope: string): Promise<PaginatedResponse<RateSetting>> =>
    api.get(`/rate-settings/scope/${scope}`).then(res => res.data),
};

// Period Rates API
export const periodRateAPI = {
  getAll: (params?: any): Promise<PaginatedResponse<PeriodRate>> =>
    api.get('/period-rates', { params }).then(res => res.data),
  
  getById: (id: string): Promise<ApiResponse<PeriodRate>> =>
    api.get(`/period-rates/${id}`).then(res => res.data),
  
  getCurrent: (academicYearId: string): Promise<ApiResponse<PeriodRate>> =>
    api.get('/period-rates/current', { params: { academicYearId } }).then(res => res.data),
  
  getStatistics: (academicYearId: string): Promise<ApiResponse<any>> =>
    api.get('/period-rates/statistics', { params: { academicYearId } }).then(res => res.data),
  
  create: (data: PeriodRateFormData): Promise<ApiResponse<PeriodRate>> =>
    api.post('/period-rates', data).then(res => res.data),
  
  update: (id: string, data: Partial<PeriodRateFormData>): Promise<ApiResponse<PeriodRate>> =>
    api.put(`/period-rates/${id}`, data).then(res => res.data),
  
  delete: (id: string): Promise<ApiResponse<void>> =>
    api.delete(`/period-rates/${id}`).then(res => res.data),
  
  activate: (id: string): Promise<ApiResponse<PeriodRate>> =>
    api.put(`/period-rates/${id}/activate`).then(res => res.data),
  
  deactivate: (id: string): Promise<ApiResponse<PeriodRate>> =>
    api.put(`/period-rates/${id}/deactivate`).then(res => res.data),
};

// Salary Calculations API
export const salaryCalculationAPI = {
  getAll: (params?: any): Promise<PaginatedResponse<SalaryCalculation>> =>
    api.get('/salary-calculations', { params }).then(res => res.data),
  
  getById: (id: string): Promise<ApiResponse<SalaryCalculation>> =>
    api.get(`/salary-calculations/${id}`).then(res => res.data),
  
  create: (data: SalaryCalculationFormData): Promise<ApiResponse<SalaryCalculation>> =>
    api.post('/salary-calculations', data).then(res => res.data),
  
  update: (id: string, data: Partial<SalaryCalculationFormData>): Promise<ApiResponse<SalaryCalculation>> =>
    api.put(`/salary-calculations/${id}`, data).then(res => res.data),
  
  delete: (id: string): Promise<ApiResponse<void>> =>
    api.delete(`/salary-calculations/${id}`).then(res => res.data),
  
  calculate: (data: SalaryCalculationFormData): Promise<ApiResponse<SalaryCalculation>> =>
    api.post('/salary-calculations/calculate', data).then(res => res.data),
  
  getByTeacher: (teacherId: string, params?: any): Promise<PaginatedResponse<SalaryCalculation>> =>
    api.get(`/salary-calculations/teacher/${teacherId}`, { params }).then(res => res.data),
  
  getStatistics: (): Promise<ApiResponse<any>> =>
    api.get('/salary-calculations/statistics').then(res => res.data),
};

// Health check
export const healthAPI = {
  check: (): Promise<ApiResponse<any>> =>
    api.get('/health').then(res => res.data),
};

export default api; 