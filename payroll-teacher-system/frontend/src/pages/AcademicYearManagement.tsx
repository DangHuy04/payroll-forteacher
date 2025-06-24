import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
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
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import api from '../services/api';

interface Semester {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
}

interface AcademicYear {
  _id: string;
  name: string;
  startYear: number;
  endYear: number;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
  isActive: boolean;
  semesters: Semester[];
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  startYear: number;
  endYear: number;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
}

const AcademicYearManagement: React.FC = () => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [viewingYear, setViewingYear] = useState<AcademicYear | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear() + 1,
    startDate: '',
    endDate: '',
    status: 'upcoming'
  });

  // Fetch academic years
  const fetchAcademicYears = async () => {
    try {
      setLoading(true);
      const response = await api.get('/academic-years');
      // Ensure we always get an array
      const data = response.data?.data || response.data || [];
      setAcademicYears(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Lỗi khi tải danh sách năm học');
      setAcademicYears([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      if (editingYear) {
        // Update
        await api.put(`/academic-years/${editingYear._id}`, formData);
        setSuccess('Cập nhật năm học thành công!');
      } else {
        // Create
        await api.post('/academic-years', formData);
        setSuccess('Tạo năm học mới thành công!');
      }
      
      await fetchAcademicYears();
      handleCloseDialog();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Lỗi khi lưu năm học');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa năm học này?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/academic-years/${id}`);
      setSuccess('Xóa năm học thành công!');
      await fetchAcademicYears();
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.msg || 'Lỗi khi xóa năm học');
    } finally {
      setLoading(false);
    }
  };

  // Dialog handlers
  const handleOpenDialog = (year?: AcademicYear) => {
    if (year) {
      setEditingYear(year);
      setFormData({
        name: year.name,
        startYear: year.startYear,
        endYear: year.endYear,
        startDate: year.startDate.split('T')[0],
        endDate: year.endDate.split('T')[0],
        status: year.status
      });
    } else {
      setEditingYear(null);
      setFormData({
        name: '',
        startYear: new Date().getFullYear(),
        endYear: new Date().getFullYear() + 1,
        startDate: '',
        endDate: '',
        status: 'upcoming'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingYear(null);
  };

  const handleViewYear = (year: AcademicYear) => {
    setViewingYear(year);
    setOpenViewDialog(true);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'default';
      case 'upcoming': return 'info';
      default: return 'default';
    }
  };

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Đang diễn ra';
      case 'completed': return 'Đã kết thúc';
      case 'upcoming': return 'Sắp tới';
      default: return status;
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Quản lý Năm học
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={loading}
        >
          Thêm năm học
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
                Tổng năm học
              </Typography>
              <Typography variant="h4">
                {Array.isArray(academicYears) ? academicYears.length : 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Đang diễn ra
              </Typography>
              <Typography variant="h4" color="success.main">
                {Array.isArray(academicYears) ? academicYears.filter(year => year.status === 'active').length : 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Sắp tới
              </Typography>
              <Typography variant="h4" color="info.main">
                {Array.isArray(academicYears) ? academicYears.filter(year => year.status === 'upcoming').length : 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Đã kết thúc
              </Typography>
              <Typography variant="h4" color="text.secondary">
                {Array.isArray(academicYears) ? academicYears.filter(year => year.status === 'completed').length : 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Academic Years Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tên năm học</TableCell>
                <TableCell>Năm bắt đầu</TableCell>
                <TableCell>Năm kết thúc</TableCell>
                <TableCell>Ngày bắt đầu</TableCell>
                <TableCell>Ngày kết thúc</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Số học kỳ</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(academicYears) ? academicYears.map((year) => (
                <TableRow key={year._id}>
                  <TableCell>{year.name}</TableCell>
                  <TableCell>{year.startYear}</TableCell>
                  <TableCell>{year.endYear}</TableCell>
                  <TableCell>
                    {new Date(year.startDate).toLocaleDateString('vi-VN')}
                  </TableCell>
                  <TableCell>
                    {new Date(year.endDate).toLocaleDateString('vi-VN')}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusText(year.status)} 
                      color={getStatusColor(year.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{year.semesters?.length || 0}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleViewYear(year)}
                      color="info"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(year)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(year._id)}
                      color="error"
                      disabled={year.status === 'active'}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingYear ? 'Cập nhật năm học' : 'Tạo năm học mới'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tên năm học"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Năm bắt đầu"
                type="number"
                value={formData.startYear}
                onChange={(e) => setFormData({ ...formData, startYear: parseInt(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Năm kết thúc"
                type="number"
                value={formData.endYear}
                onChange={(e) => setFormData({ ...formData, endYear: parseInt(e.target.value) })}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Ngày bắt đầu"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Ngày kết thúc"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  label="Trạng thái"
                >
                  <MenuItem value="upcoming">Sắp tới</MenuItem>
                  <MenuItem value="active">Đang diễn ra</MenuItem>
                  <MenuItem value="completed">Đã kết thúc</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={loading}
          >
            {editingYear ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Chi tiết năm học</DialogTitle>
        <DialogContent>
          {viewingYear && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6">{viewingYear.name}</Typography>
                <Typography color="textSecondary">
                  {viewingYear.startYear} - {viewingYear.endYear}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Ngày bắt đầu:</Typography>
                <Typography>{new Date(viewingYear.startDate).toLocaleDateString('vi-VN')}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Ngày kết thúc:</Typography>
                <Typography>{new Date(viewingYear.endDate).toLocaleDateString('vi-VN')}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Trạng thái:</Typography>
                <Chip 
                  label={getStatusText(viewingYear.status)} 
                  color={getStatusColor(viewingYear.status) as any}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Số học kỳ:</Typography>
                <Typography>{viewingYear.semesters?.length || 0}</Typography>
              </Grid>
              {viewingYear.semesters && viewingYear.semesters.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Danh sách học kỳ:</Typography>
                  {viewingYear.semesters.map((semester) => (
                    <Box key={semester._id} sx={{ mb: 1, p: 1, border: 1, borderColor: 'grey.300', borderRadius: 1 }}>
                      <Typography variant="subtitle2">{semester.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {new Date(semester.startDate).toLocaleDateString('vi-VN')} - {new Date(semester.endDate).toLocaleDateString('vi-VN')}
                      </Typography>
                      <Chip 
                        label={getStatusText(semester.status)} 
                        color={getStatusColor(semester.status) as any}
                        size="small"
                      />
                    </Box>
                  ))}
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AcademicYearManagement; 
