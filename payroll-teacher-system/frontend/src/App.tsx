import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import 'antd/dist/reset.css';
import './App.css';

// Import Layout and Pages
import AppLayout from './components/Layout';
import { AcademicProvider } from './components/AcademicYearSemesterSelector';
import Dashboard from './pages/Dashboard';

// Teacher Management Pages (UC1)
import TeacherManagement from './pages/TeacherManagement';
import DegreeManagement from './pages/DegreeManagement';
import DepartmentManagement from './pages/DepartmentManagement';

// Class Management Pages (UC2)
import ClassManagement from './pages/ClassManagement';
import SubjectManagement from './pages/SubjectManagement';
import AcademicYearManagement from './pages/AcademicYearManagement';
import TeachingAssignmentManagement from './pages/TeachingAssignmentManagement';

// Salary Management Pages (UC3)
import SalaryCalculationManagement from './pages/SalaryCalculationManagement';
import RateSettingManagement from './pages/RateSettingManagement';

// Report Pages (UC4)
import IndividualReports from './pages/reports/IndividualReports';
import DepartmentReports from './pages/reports/DepartmentReports';
import UniversityReports from './pages/reports/UniversityReports';

// Statistics Pages
import ClassStatistics from './pages/ClassStatistics';

const App: React.FC = () => {
  return (
    <ConfigProvider locale={viVN}>
      <Router>
        <AcademicProvider>
        <AppLayout>
          <Routes>
            {/* Dashboard */}
            <Route path="/" element={<Dashboard />} />
            
            {/* Teacher Management Routes (UC1) */}
            <Route path="/degrees" element={<DegreeManagement />} />
            <Route path="/departments" element={<DepartmentManagement />} />
            <Route path="/teachers" element={<TeacherManagement />} />
            
            {/* Class Management Routes (UC2) */}
            <Route path="/subjects" element={<SubjectManagement />} />
            <Route path="/academic-years" element={<AcademicYearManagement />} />
            <Route path="/classes" element={<ClassManagement />} />
            <Route path="/teaching-assignments" element={<TeachingAssignmentManagement />} />
              
              {/* Statistics Routes */}
              <Route path="/class-statistics" element={<ClassStatistics />} />
            
            {/* Salary Management Routes (UC3) */}
            <Route path="/rate-settings" element={<RateSettingManagement />} />
            <Route path="/salary-calculations" element={<SalaryCalculationManagement />} />
            
            {/* Report Routes (UC4) */}
            <Route path="/reports/individual" element={<IndividualReports />} />
            <Route path="/reports/department" element={<DepartmentReports />} />
            <Route path="/reports/university" element={<UniversityReports />} />
            
            {/* Catch all route - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
        </AcademicProvider>
      </Router>
    </ConfigProvider>
  );
};

export default App;
