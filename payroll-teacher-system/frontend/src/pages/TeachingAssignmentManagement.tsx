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
  Grid,
  IconButton,
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
  Snackbar,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import api from '../services/api';
import { useAcademicContext } from '../components/AcademicYearSemesterSelector';
import { useTeachingAssignments, useTeachers, useClasses } from '../hooks/useAcademicData';
import AcademicGuard from '../components/AcademicGuard';
import SafeDialog from '../components/SafeDialog';

interface TeachingAssignment {
  _id: string;
  code: string;
  classId: {
    _id: string;
    name: string;
    code: string;
    subjectId: {
      _id: string;
      code: string;
      name: string;
      soTietLyThuyet: number;
      soTietThucHanh: number;
      credits: number;
      coefficient: number;
    };
    schedule?: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      room: string;
    };
  };
  teacherId: {
    _id: string;
    code: string;
    fullName: string;
    email: string;
  };
  academicYearId: {
    _id: string;
    code: string;
    name: string;
  };
  periods: number;
  status: 'draft' | 'assigned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  classId: string;
  teacherId: string;
  status: 'draft' | 'assigned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
}

interface Teacher {
  _id: string;
  code: string;
  fullName: string;
  email: string;
}

interface Class {
  _id: string;
  name: string;
  code: string;
  subjectId: {
    _id: string;
    code: string;
    name: string;
    soTietLyThuyet: number;
    soTietThucHanh: number;
    credits: number;
    coefficient: number;
  };
}

interface AcademicYear {
  _id: string;
  code: string;
  name: string;
}

const TeachingAssignmentManagement: React.FC = () => {
  // Use hooks for data fetching
  const { data: assignments, loading: assignmentsLoading, error: assignmentsError, refetch: refetchAssignments } = useTeachingAssignments();
  const { data: teachers, loading: teachersLoading } = useTeachers();
  const { data: classes, loading: classesLoading } = useClasses();

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Academic context
  const { selectedAcademicYear, isDataSelected } = useAcademicContext();
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<TeachingAssignment | null>(null);
  const [viewingAssignment, setViewingAssignment] = useState<TeachingAssignment | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    classId: '',
    teacherId: '',
    status: 'assigned'
  });

  // Combined loading state
  const loading = assignmentsLoading || teachersLoading || classesLoading;
      
  // Handle error from hooks
  useEffect(() => {
    if (assignmentsError) {
      setError(assignmentsError);
    }
  }, [assignmentsError]);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Add selectedAcademicYear to form data
      const submitData = {
        ...formData,
        academicYearId: selectedAcademicYear?._id
      };
      
      if (editingAssignment) {
        // Update
        await api.put(`/teaching-assignments/${editingAssignment._id}`, submitData);
        setSuccess('Cập nhật phân công thành công!');
      } else {
        // Create
        await api.post('/teaching-assignments', submitData);
        setSuccess('Tạo phân công mới thành công!');
      }
      
      await refetchAssignments();
      handleCloseDialog();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi lưu phân công');
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phân công này?')) return;

    try {
      await api.delete(`/teaching-assignments/${id}`);
      await refetchAssignments();
      setSuccess('Xóa phân công thành công!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi xóa phân công');
    }
  };

  // Dialog handlers
  const handleOpenDialog = (assignment?: TeachingAssignment) => {
    // Delay opening dialog to ensure DOM is ready
    setTimeout(() => {
    if (assignment) {
      setEditingAssignment(assignment);
      setFormData({
        classId: assignment.classId._id,
        teacherId: assignment.teacherId._id,
        status: assignment.status
      });
    } else {
      setEditingAssignment(null);
      setFormData({
        classId: '',
        teacherId: '',
        status: 'assigned'
      });
    }
    setOpenDialog(true);
    }, 0);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAssignment(null);
  };

  const handleViewAssignment = (assignment: TeachingAssignment) => {
    setViewingAssignment(assignment);
    setOpenViewDialog(true);
  };

  // Utility functions
  const getDayName = (dayOfWeek: number) => {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return days[dayOfWeek];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'assigned': return 'info';
      case 'confirmed': return 'primary';
      case 'in_progress': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Nháp';
      case 'assigned': return 'Đã phân công';
      case 'confirmed': return 'Đã xác nhận';
      case 'in_progress': return 'Đang thực hiện';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  // Get total periods from subject
  const getTotalPeriods = (assignment: TeachingAssignment) => {
    if (assignment.classId.subjectId) {
      return assignment.classId.subjectId.soTietLyThuyet + assignment.classId.subjectId.soTietThucHanh;
    }
    return assignment.periods || 0;
  };

  const getSelectedClassPeriods = () => {
    if (!formData.classId) return 0;
    const selectedClass = classes.find(c => c._id === formData.classId);
    if (selectedClass?.subjectId) {
      return selectedClass.subjectId.soTietLyThuyet + selectedClass.subjectId.soTietThucHanh;
    }
    return 0;
  };

  // Filter assignments by tab
  const getFilteredAssignments = () => {
    if (!Array.isArray(assignments)) return [];
    
    switch (tabValue) {
      case 1: return assignments.filter(a => a.status === 'assigned');
      case 2: return assignments.filter(a => a.status === 'in_progress');
      case 3: return assignments.filter(a => a.status === 'completed');
      default: return assignments;
    }
  };

  return (
    <AcademicGuard
      title="Quản lý Phân công giảng dạy"
      icon={<AssignmentIcon style={{ marginRight: '8px', color: '#1890ff' }} />}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Quản lý Phân công giảng dạy
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={loading}
        >
          Thêm phân công
        </Button>
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

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tổng phân công
              </Typography>
              <Typography variant="h4">
                {Array.isArray(assignments) ? assignments.length : 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Đang thực hiện
              </Typography>
              <Typography variant="h4" color="warning.main">
                {Array.isArray(assignments) ? assignments.filter(a => a.status === 'in_progress').length : 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Hoàn thành
              </Typography>
              <Typography variant="h4" color="success.main">
                {Array.isArray(assignments) ? assignments.filter(a => a.status === 'completed').length : 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tổng số tiết
              </Typography>
              <Typography variant="h4" color="primary.main">
                {Array.isArray(assignments) ? assignments.reduce((sum, a) => sum + getTotalPeriods(a), 0) : 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(e: React.SyntheticEvent, newValue: number) => setTabValue(newValue)}>
          <Tab label="Tất cả" />
          <Tab label="Đã phân công" />
          <Tab label="Đang thực hiện" />
          <Tab label="Hoàn thành" />
        </Tabs>
      </Paper>

      {/* Assignments Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mã phân công</TableCell>
                <TableCell>Giảng viên</TableCell>
                <TableCell>Lớp học phần</TableCell>
                <TableCell>Học phần</TableCell>
                <TableCell>Số tiết</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : getFilteredAssignments().length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="textSecondary">
                      Không có phân công nào
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                getFilteredAssignments().map((assignment) => (
                  <TableRow key={assignment._id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {assignment.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{assignment.teacherId.fullName}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {assignment.teacherId.code}
                        </Typography>
                      </Box>
                  </TableCell>
                  <TableCell>
                      <Box>
                    <Typography variant="subtitle2">{assignment.classId.name}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {assignment.classId.code}
                    </Typography>
                      </Box>
                  </TableCell>
                  <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{assignment.classId.subjectId?.name || 'N/A'}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {assignment.classId.subjectId?.code || 'N/A'} - {assignment.classId.subjectId?.credits || 0} TC
                        </Typography>
                      </Box>
                  </TableCell>
                  <TableCell>
                      <Box>
                        <Typography variant="subtitle2">{getTotalPeriods(assignment)} tiết</Typography>
                    <Typography variant="caption" color="textSecondary">
                          LT: {assignment.classId.subjectId?.soTietLyThuyet || 0} - TH: {assignment.classId.subjectId?.soTietThucHanh || 0}
                    </Typography>
                      </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusText(assignment.status)} 
                      color={getStatusColor(assignment.status) as any}
                      size="small"
                    />
                  </TableCell>
                    <TableCell>
                    <IconButton
                        onClick={() => handleViewAssignment(assignment)}
                      size="small"
                        title="Xem chi tiết"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                        onClick={() => handleOpenDialog(assignment)}
                      size="small"
                        title="Chỉnh sửa"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                        onClick={() => handleDelete(assignment._id)}
                      size="small"
                        title="Xóa"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Dialog */}
      <SafeDialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingAssignment ? 'Chỉnh sửa phân công' : 'Thêm phân công mới'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Giảng viên</InputLabel>
                <Select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
                  label="Giảng viên"
                >
                  {teachers.map((teacher) => (
                    <MenuItem key={teacher._id} value={teacher._id}>
                      {teacher.fullName} - {teacher.code}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Lớp học phần</InputLabel>
                <Select
                  value={formData.classId}
                  onChange={(e) => setFormData({...formData, classId: e.target.value})}
                  label="Lớp học phần"
                >
                  {classes.map((classItem) => (
                    <MenuItem key={classItem._id} value={classItem._id}>
                      {classItem.code} - {classItem.name}
                      {classItem.subjectId && (
                        <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                          ({classItem.subjectId.soTietLyThuyet + classItem.subjectId.soTietThucHanh} tiết)
                        </Typography>
                      )}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  label="Trạng thái"
                >
                  <MenuItem value="draft">Nháp</MenuItem>
                  <MenuItem value="assigned">Đã phân công</MenuItem>
                  <MenuItem value="confirmed">Đã xác nhận</MenuItem>
                  <MenuItem value="in_progress">Đang thực hiện</MenuItem>
                  <MenuItem value="completed">Hoàn thành</MenuItem>
                  <MenuItem value="cancelled">Đã hủy</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Display selected academic year and class periods */}
            {selectedAcademicYear && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Năm học: {selectedAcademicYear.name}</strong>
                    {formData.classId && (
                      <>
                        <br />
                        <strong>Số tiết của học phần đã chọn: {getSelectedClassPeriods()} tiết</strong>
                        {(() => {
                          const selectedClass = classes.find(c => c._id === formData.classId);
                          if (selectedClass?.subjectId) {
                            return ` (LT: ${selectedClass.subjectId.soTietLyThuyet} - TH: ${selectedClass.subjectId.soTietThucHanh})`;
                          }
                          return '';
                        })()}
                      </>
                    )}
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading || !selectedAcademicYear}>
            {loading ? <CircularProgress size={24} /> : (editingAssignment ? 'Cập nhật' : 'Tạo mới')}
          </Button>
        </DialogActions>
      </SafeDialog>

      {/* View Dialog */}
      <SafeDialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Chi tiết phân công</DialogTitle>
        <DialogContent>
          {viewingAssignment && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Mã phân công</Typography>
                <Typography>{viewingAssignment.code}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Giảng viên</Typography>
                <Typography>{viewingAssignment.teacherId.fullName}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Email</Typography>
                <Typography>{viewingAssignment.teacherId.email}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Lớp học phần</Typography>
                <Typography>{viewingAssignment.classId.name}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Mã lớp</Typography>
                <Typography>{viewingAssignment.classId.code}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Học phần</Typography>
                <Typography>{viewingAssignment.classId.subjectId?.name || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Mã học phần</Typography>
                <Typography>{viewingAssignment.classId.subjectId?.code || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Năm học</Typography>
                <Typography>{viewingAssignment.academicYearId.name}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Số tiết</Typography>
                <Typography>{getTotalPeriods(viewingAssignment)} tiết</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Chi tiết tiết học</Typography>
                <Typography>
                  LT: {viewingAssignment.classId.subjectId?.soTietLyThuyet || 0} tiết - 
                  TH: {viewingAssignment.classId.subjectId?.soTietThucHanh || 0} tiết
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Trạng thái</Typography>
                <Chip 
                  label={getStatusText(viewingAssignment.status)} 
                  color={getStatusColor(viewingAssignment.status) as any}
                  size="small"
                />
              </Grid>
              {viewingAssignment.classId.schedule && (
              <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Lịch học</Typography>
                <Typography>
                    {getDayName(viewingAssignment.classId.schedule.dayOfWeek)} - {' '}
                  {viewingAssignment.classId.schedule.startTime} - {viewingAssignment.classId.schedule.endTime}
                    {viewingAssignment.classId.schedule.room && ` - Phòng: ${viewingAssignment.classId.schedule.room}`}
                </Typography>
              </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Đóng</Button>
        </DialogActions>
      </SafeDialog>
    </AcademicGuard>
  );
};

export default TeachingAssignmentManagement; 
