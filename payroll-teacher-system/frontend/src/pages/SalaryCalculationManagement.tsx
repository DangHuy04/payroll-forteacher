import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Group as GroupIcon
} from '@mui/icons-material';

interface SalaryCalculation {
  teacherId: string;
  teacherName: string;
  semesterId: string;
  semesterName: string;
  totalSalary: number;
  salaryComponents: {
    base: number;
    overtime: number;
    holiday: number;
  };
  assignmentCount: number;
  totalHours: number;
}

interface DepartmentSalary {
  departmentId: string;
  semesterId: string;
  teacherCount: number;
  totalSalary: number;
  salariesByTeacher: Record<string, {
    teacherName: string;
    totalSalary: number;
    salaryComponents: {
      base: number;
      overtime: number;
      holiday: number;
    };
    assignmentCount: number;
    totalHours: number;
  }>;
}

interface Teacher {
  _id: string;
  name: string;
  department: string;
}

interface Semester {
  _id: string;
  name: string;
}

const SalaryCalculationManagement: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [openCalculateDialog, setOpenCalculateDialog] = useState(false);
  const [openResultDialog, setOpenResultDialog] = useState(false);
  const [openDepartmentDialog, setOpenDepartmentDialog] = useState(false);
  const [openDepartmentResultDialog, setOpenDepartmentResultDialog] = useState(false);
  
  // Calculation results
  const [salaryResult, setSalaryResult] = useState<SalaryCalculation | null>(null);
  const [departmentResult, setDepartmentResult] = useState<DepartmentSalary | null>(null);
  
  // Form state
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');

  // Get unique departments
  const departments = Array.from(new Set(teachers.map(t => t.department))).filter(Boolean);

  // Fetch data
  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/teachers');
      const data = await response.json();
      setTeachers(data);
    } catch (err: any) {
      
    }
  };

  const fetchSemesters = async () => {
    try {
      const response = await fetch('/api/academic-years');
      const data = await response.json();
      const allSemesters: Semester[] = [];
      data.forEach((year: any) => {
        if (year.semesters) {
          allSemesters.push(...year.semesters);
        }
      });
      setSemesters(allSemesters);
    } catch (err: any) {
      
    }
  };

  useEffect(() => {
    fetchTeachers();
    fetchSemesters();
  }, []);

  // Handle individual salary calculation
  const handleCalculateIndividual = async () => {
    if (!selectedTeacher || !selectedSemester) {
      setError('Vui lòng chọn giảng viên và học kỳ');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/salaries/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacherId: selectedTeacher,
          semesterId: selectedSemester,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const teacher = teachers.find(t => t._id === selectedTeacher);
        const semester = semesters.find(s => s._id === selectedSemester);
        
        setSalaryResult({
          ...data,
          teacherName: teacher?.name || '',
          semesterName: semester?.name || ''
        });
        setOpenCalculateDialog(false);
        setOpenResultDialog(true);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.msg || 'Lỗi khi tính lương');
      }
    } catch (err: any) {
      setError('Lỗi khi tính lương');
    } finally {
      setLoading(false);
    }
  };

  // Handle department salary calculation
  const handleCalculateDepartment = async () => {
    if (!selectedDepartment || !selectedSemester) {
      setError('Vui lòng chọn khoa và học kỳ');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/salaries/calculate/department', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          departmentId: selectedDepartment,
          semesterId: selectedSemester,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDepartmentResult(data);
        setOpenDepartmentDialog(false);
        setOpenDepartmentResultDialog(true);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.msg || 'Lỗi khi tính lương khoa');
      }
    } catch (err: any) {
      setError('Lỗi khi tính lương khoa');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Tính lương Giảng viên
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<CalculateIcon />}
            onClick={() => setOpenCalculateDialog(true)}
            sx={{ mr: 2 }}
          >
            Tính lương cá nhân
          </Button>
          <Button
            variant="outlined"
            startIcon={<GroupIcon />}
            onClick={() => setOpenDepartmentDialog(true)}
          >
            Tính lương khoa
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Information Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tổng giảng viên
              </Typography>
              <Typography variant="h4">
                {teachers.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Số khoa
              </Typography>
              <Typography variant="h4" color="primary.main">
                {departments.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Học kỳ hiện tại
              </Typography>
              <Typography variant="h6" color="success.main">
                {semesters.find(s => s.name.includes('2024'))?.name || 'Chưa có'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Instructions */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Hướng dẫn sử dụng
        </Typography>
        <Typography variant="body1" paragraph>
          Hệ thống tính lương giảng viên dựa trên các phân công giảng dạy đã hoàn thành và hệ số lương được thiết lập.
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Tính lương cá nhân:
            </Typography>
            <Typography variant="body2" color="textSecondary">
              • Chọn giảng viên và học kỳ cần tính lương<br/>
              • Hệ thống sẽ tính toán dựa trên các phân công đã hoàn thành<br/>
              • Kết quả bao gồm chi tiết từng loại hệ số
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Tính lương theo khoa:
            </Typography>
            <Typography variant="body2" color="textSecondary">
              • Chọn khoa và học kỳ cần tính lương<br/>
              • Hệ thống sẽ tính toán cho tất cả giảng viên trong khoa<br/>
              • Có thể xuất báo cáo tổng hợp
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Individual Calculation Dialog */}
      <Dialog open={openCalculateDialog} onClose={() => setOpenCalculateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tính lương cá nhân</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Chọn giảng viên</InputLabel>
                <Select
                  value={selectedTeacher}
                  onChange={(e: SelectChangeEvent) => setSelectedTeacher(e.target.value)}
                  label="Chọn giảng viên"
                >
                  {teachers.map((teacher) => (
                    <MenuItem key={teacher._id} value={teacher._id}>
                      {teacher.name} - {teacher.department}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Chọn học kỳ</InputLabel>
                <Select
                  value={selectedSemester}
                  onChange={(e: SelectChangeEvent) => setSelectedSemester(e.target.value)}
                  label="Chọn học kỳ"
                >
                  {semesters.map((semester) => (
                    <MenuItem key={semester._id} value={semester._id}>
                      {semester.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCalculateDialog(false)}>Hủy</Button>
          <Button 
            onClick={handleCalculateIndividual} 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CalculateIcon />}
          >
            Tính lương
          </Button>
        </DialogActions>
      </Dialog>

      {/* Department Calculation Dialog */}
      <Dialog open={openDepartmentDialog} onClose={() => setOpenDepartmentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tính lương theo khoa</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Chọn khoa</InputLabel>
                <Select
                  value={selectedDepartment}
                  onChange={(e: SelectChangeEvent) => setSelectedDepartment(e.target.value)}
                  label="Chọn khoa"
                >
                  {departments.map((department) => (
                    <MenuItem key={department} value={department}>
                      {department}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Chọn học kỳ</InputLabel>
                <Select
                  value={selectedSemester}
                  onChange={(e: SelectChangeEvent) => setSelectedSemester(e.target.value)}
                  label="Chọn học kỳ"
                >
                  {semesters.map((semester) => (
                    <MenuItem key={semester._id} value={semester._id}>
                      {semester.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDepartmentDialog(false)}>Hủy</Button>
          <Button 
            onClick={handleCalculateDepartment} 
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CalculateIcon />}
          >
            Tính lương khoa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Individual Result Dialog */}
      <Dialog open={openResultDialog} onClose={() => setOpenResultDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Kết quả tính lương</DialogTitle>
        <DialogContent>
          {salaryResult && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Thông tin giảng viên
                </Typography>
                <Typography><strong>Họ tên:</strong> {salaryResult.teacherName}</Typography>
                <Typography><strong>Học kỳ:</strong> {salaryResult.semesterName}</Typography>
                <Typography><strong>Số phân công:</strong> {salaryResult.assignmentCount}</Typography>
                <Typography><strong>Tổng giờ giảng:</strong> {salaryResult.totalHours} giờ</Typography>
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Chi tiết lương
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Lương cơ bản
                        </Typography>
                        <Typography variant="h6" color="primary.main">
                          {formatCurrency(salaryResult.salaryComponents.base)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Lương ngoài giờ
                        </Typography>
                        <Typography variant="h6" color="warning.main">
                          {formatCurrency(salaryResult.salaryComponents.overtime)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography color="textSecondary" gutterBottom>
                          Lương ngày lễ
                        </Typography>
                        <Typography variant="h6" color="error.main">
                          {formatCurrency(salaryResult.salaryComponents.holiday)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item xs={12}>
                <Box textAlign="center" py={2}>
                  <Typography variant="h5" gutterBottom>
                    Tổng lương
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {formatCurrency(salaryResult.totalSalary)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button startIcon={<DownloadIcon />}>Xuất PDF</Button>
          <Button onClick={() => setOpenResultDialog(false)} variant="contained">Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Department Result Dialog */}
      <Dialog open={openDepartmentResultDialog} onClose={() => setOpenDepartmentResultDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Kết quả tính lương khoa</DialogTitle>
        <DialogContent>
          {departmentResult && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Thông tin tổng quan
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={3}>
                    <Typography><strong>Số giảng viên:</strong> {departmentResult.teacherCount}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography><strong>Tổng lương:</strong> {formatCurrency(departmentResult.totalSalary)}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography><strong>Lương TB/người:</strong> {formatCurrency(departmentResult.totalSalary / departmentResult.teacherCount)}</Typography>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Chi tiết theo giảng viên
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Giảng viên</TableCell>
                        <TableCell align="right">Lương cơ bản</TableCell>
                        <TableCell align="right">Ngoài giờ</TableCell>
                        <TableCell align="right">Ngày lễ</TableCell>
                        <TableCell align="right">Tổng lương</TableCell>
                        <TableCell align="center">Số giờ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(departmentResult.salariesByTeacher).map(([teacherId, salary]) => (
                        <TableRow key={teacherId}>
                          <TableCell>{salary.teacherName}</TableCell>
                          <TableCell align="right">{formatCurrency(salary.salaryComponents.base)}</TableCell>
                          <TableCell align="right">{formatCurrency(salary.salaryComponents.overtime)}</TableCell>
                          <TableCell align="right">{formatCurrency(salary.salaryComponents.holiday)}</TableCell>
                          <TableCell align="right">
                            <Typography variant="subtitle2" color="primary.main">
                              {formatCurrency(salary.totalSalary)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">{salary.totalHours}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button startIcon={<DownloadIcon />}>Xuất Excel</Button>
          <Button onClick={() => setOpenDepartmentResultDialog(false)} variant="contained">Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalaryCalculationManagement; 
