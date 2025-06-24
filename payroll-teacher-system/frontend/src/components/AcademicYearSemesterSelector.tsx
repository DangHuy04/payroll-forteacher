import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Select, Space, Alert, Spin, Typography } from 'antd';
import { CalendarOutlined, BookOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Text } = Typography;

// Types
interface AcademicYear {
  _id: string;
  code: string;
  name: string;
  startYear: number;
  endYear: number;
  status: string;
  isActive: boolean;
}

interface Semester {
  _id: string;
  code: string;
  name: string;
  academicYearId: string;
  semesterNumber: number;
  semesterType: string;
  status: string;
  isActive: boolean;
  displayName: string;
}

interface AcademicContextType {
  selectedAcademicYear: AcademicYear | null;
  selectedSemester: Semester | null;
  academicYears: AcademicYear[];
  semesters: Semester[];
  loading: boolean;
  error: string | null;
  setSelectedAcademicYear: (year: AcademicYear | null) => void;
  setSelectedSemester: (semester: Semester | null) => void;
  refreshData: () => Promise<void>;
  isDataSelected: () => boolean;
  getDisplayText: () => string;
}

// Context
const AcademicContext = createContext<AcademicContextType | undefined>(undefined);

// Hook để sử dụng context
export const useAcademicContext = () => {
  const context = useContext(AcademicContext);
  if (context === undefined) {
    throw new Error('useAcademicContext must be used within an AcademicProvider');
  }
  return context;
};

// Provider component
interface AcademicProviderProps {
  children: ReactNode;
}

export const AcademicProvider: React.FC<AcademicProviderProps> = ({ children }) => {
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<AcademicYear | null>(() => {
    // Load from localStorage on initialization
    const saved = localStorage.getItem('selectedAcademicYear');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(() => {
    // Load from localStorage on initialization
    const saved = localStorage.getItem('selectedSemester');
    return saved ? JSON.parse(saved) : null;
  });
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load academic years
  const loadAcademicYears = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/academic-years');
      const years = Array.isArray(response.data?.data) ? response.data.data : 
                   Array.isArray(response.data) ? response.data : [];
      setAcademicYears(years);
      
      // Auto select current or most recent academic year (only if nothing saved)
      if (years.length > 0 && !selectedAcademicYear) {
        const currentYear = years.find((year: AcademicYear) => year.status === 'active') || years[0];
        handleAcademicYearChange(currentYear);
      }
    } catch (err: any) {
      setError('Không thể tải danh sách năm học');
      
    } finally {
      setLoading(false);
    }
  };

  // Load semesters for selected academic year
  const loadSemesters = async (academicYearId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/semesters?academicYearId=${academicYearId}`);
      const semesterData = Array.isArray(response.data?.data) ? response.data.data : 
                          Array.isArray(response.data) ? response.data : [];
      setSemesters(semesterData);
      
      // Auto select current or first semester (only if nothing saved)
      if (semesterData.length > 0 && !selectedSemester) {
        const currentSemester = semesterData.find((sem: Semester) => sem.status === 'active') || semesterData[0];
        handleSemesterChange(currentSemester);
      }
    } catch (err: any) {
      setError('Không thể tải danh sách kỳ học');
      
    } finally {
      setLoading(false);
    }
  };

  // Handle academic year change
  const handleAcademicYearChange = (year: AcademicYear | null) => {
    setSelectedAcademicYear(year);
    setSelectedSemester(null); // Reset semester when year changes
    setSemesters([]); // Clear semester list
    
    // Save to localStorage
    if (year) {
      localStorage.setItem('selectedAcademicYear', JSON.stringify(year));
      loadSemesters(year._id);
    } else {
      localStorage.removeItem('selectedAcademicYear');
    }
    localStorage.removeItem('selectedSemester'); // Clear semester from storage
  };

  // Handle semester change
  const handleSemesterChange = (semester: Semester | null) => {
    setSelectedSemester(semester);
    
    // Save to localStorage
    if (semester) {
      localStorage.setItem('selectedSemester', JSON.stringify(semester));
    } else {
      localStorage.removeItem('selectedSemester');
    }
  };

  // Refresh all data
  const refreshData = async () => {
    await loadAcademicYears();
    if (selectedAcademicYear) {
      await loadSemesters(selectedAcademicYear._id);
    }
  };

  // Check if both year and semester are selected
  const isDataSelected = () => {
    return selectedAcademicYear !== null && selectedSemester !== null;
  };

  // Get display text for current selection
  const getDisplayText = () => {
    if (selectedAcademicYear && selectedSemester) {
      return `${selectedAcademicYear.code} - ${selectedSemester.displayName}`;
    }
    if (selectedAcademicYear) {
      return selectedAcademicYear.code;
    }
    return 'Chưa chọn';
  };

  // Load initial data
  useEffect(() => {
    loadAcademicYears();
  }, []);

  // Load semesters when academic year changes
  useEffect(() => {
    if (selectedAcademicYear) {
      loadSemesters(selectedAcademicYear._id);
    }
  }, [selectedAcademicYear]);

  const contextValue: AcademicContextType = {
    selectedAcademicYear,
    selectedSemester,
    academicYears,
    semesters,
    loading,
    error,
    setSelectedAcademicYear: handleAcademicYearChange,
    setSelectedSemester: handleSemesterChange,
    refreshData,
    isDataSelected,
    getDisplayText,
  };

  return (
    <AcademicContext.Provider value={contextValue}>
      {children}
    </AcademicContext.Provider>
  );
};

// Selector component
interface AcademicYearSemesterSelectorProps {
  showAlert?: boolean;
  compact?: boolean;
  style?: React.CSSProperties;
}

export const AcademicYearSemesterSelector: React.FC<AcademicYearSemesterSelectorProps> = ({
  showAlert = true,
  compact = false,
  style
}) => {
  const {
    selectedAcademicYear,
    selectedSemester,
    academicYears,
    semesters,
    loading,
    error,
    setSelectedAcademicYear,
    setSelectedSemester,
    isDataSelected
  } = useAcademicContext();

  if (error) {
    return (
      <Alert
        message="Lỗi tải dữ liệu"
        description={error}
        type="error"
        showIcon
        style={{ marginBottom: 16, ...style }}
      />
    );
  }

  return (
    <div style={{ marginBottom: showAlert ? 16 : 0, ...style }}>
      <Space direction={compact ? 'horizontal' : 'vertical'} size="middle" style={{ width: '100%' }}>
        <Space wrap>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarOutlined style={{ color: '#1890ff' }} />
            <Text strong>Năm học:</Text>
            <Select
              value={selectedAcademicYear?._id}
              placeholder="Chọn năm học"
              style={{ minWidth: 180 }}
              loading={loading}
              onChange={(value) => {
                const year = academicYears.find(y => y._id === value) || null;
                setSelectedAcademicYear(year);
              }}
              options={academicYears.map(year => ({
                value: year._id,
                label: (
                  <div>
                    <Text strong>{year.code}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {year.status === 'active' ? '🟢 Đang hoạt động' : 
                       year.status === 'completed' ? '⚪ Đã hoàn thành' : 
                       year.status === 'planning' ? '🟡 Đang lập kế hoạch' : year.status}
                    </Text>
                  </div>
                )
              }))}
              filterOption={(input, option) =>
                (option?.label as any)?.props?.children?.[0]?.props?.children?.toLowerCase().includes(input.toLowerCase())
              }
              showSearch
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOutlined style={{ color: '#52c41a' }} />
            <Text strong>Kỳ học:</Text>
            <Select
              value={selectedSemester?._id}
              placeholder="Chọn kỳ học"
              style={{ minWidth: 200 }}
              loading={loading}
              disabled={!selectedAcademicYear}
              onChange={(value) => {
                const semester = semesters.find(s => s._id === value) || null;
                setSelectedSemester(semester);
              }}
              options={semesters.map(semester => ({
                value: semester._id,
                label: (
                  <div>
                    <Text strong>{semester.displayName}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {semester.status === 'active' ? '🟢 Đang diễn ra' : 
                       semester.status === 'completed' ? '⚪ Đã hoàn thành' : 
                       semester.status === 'planning' ? '🟡 Đang lập kế hoạch' : 
                       semester.status === 'registration' ? '🔵 Đăng ký' : semester.status}
                    </Text>
                  </div>
                )
              }))}
              filterOption={(input, option) =>
                (option?.label as any)?.props?.children?.[0]?.props?.children?.toLowerCase().includes(input.toLowerCase())
              }
              showSearch
            />
          </div>

          {loading && <Spin size="small" />}
        </Space>

        {showAlert && !isDataSelected() && (
          <Alert
            message="Vui lòng chọn năm học và kỳ học"
            description="Tất cả các chức năng quản lý đều cần được thực hiện theo năm học và kỳ học cụ thể để đảm bảo tính chính xác của dữ liệu."
            type="warning"
            showIcon
            style={{ marginTop: 8 }}
          />
        )}

        {isDataSelected() && showAlert && (
          <Alert
            message={`Đã chọn: ${selectedAcademicYear?.code} - ${selectedSemester?.displayName}`}
            type="success"
            showIcon
            style={{ marginTop: 8 }}
          />
        )}
      </Space>
    </div>
  );
};

export default AcademicYearSemesterSelector; 
