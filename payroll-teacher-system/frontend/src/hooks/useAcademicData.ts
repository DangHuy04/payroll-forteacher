import { useState, useEffect, useCallback } from 'react';
import { useAcademicContext } from '../components/AcademicYearSemesterSelector';
import api from '../services/api';

interface UseAcademicDataOptions {
  endpoint: string;
  enabled?: boolean;
  dependencies?: any[];
}

interface UseAcademicDataReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAcademicData<T = any>(
  options: UseAcademicDataOptions
): UseAcademicDataReturn<T> {
  const { endpoint, enabled = true, dependencies = [] } = options;
  const { selectedAcademicYear, selectedSemester, isDataSelected } = useAcademicContext();
  
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled || !isDataSelected()) {
      setData([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      if (selectedAcademicYear) {
        params.append('academicYearId', selectedAcademicYear._id);
      }
      // Note: No longer using semesterId since we removed semester filtering
      // Classes are now filtered by academicYearId only

      const queryString = params.toString();
      const url = queryString ? `${endpoint}?${queryString}` : endpoint;
      
      const response = await api.get(url);
      const responseData = Array.isArray(response.data?.data) 
        ? response.data.data 
        : Array.isArray(response.data) 
        ? response.data 
        : [];
      
      setData(responseData);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi tải dữ liệu');
      setData([]);
      console.error(`Error fetching ${endpoint}:`, err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, enabled, selectedAcademicYear, selectedSemester, isDataSelected, ...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}

// Specialized hooks for common entities
export function useClasses() {
  return useAcademicData({
    endpoint: '/classes',
    enabled: true
  });
}

export function useTeachingAssignments() {
  return useAcademicData({
    endpoint: '/teaching-assignments'
  });
}

export function useSalaryCalculations() {
  return useAcademicData({
    endpoint: '/salary-calculations'
  });
}

// Hook for teachers (usually not filtered by semester)
export function useTeachers() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/teachers');
      const responseData = Array.isArray(response.data?.data) 
        ? response.data.data 
        : Array.isArray(response.data) 
        ? response.data 
        : [];
      
      setData(responseData);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi tải dữ liệu giảng viên');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}

export default useAcademicData; 