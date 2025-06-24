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
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { useAcademicContext } from '../components/AcademicYearSemesterSelector';
import AcademicGuard from '../components/AcademicGuard';
import { periodRateAPI } from '../services/api';
import { PeriodRate } from '../types';

interface FormData {
  name: string;
  ratePerPeriod: number;
  effectiveDate: string;
  description: string;
}

const RateSettingManagement: React.FC = () => {
  const [rates, setRates] = useState<PeriodRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { selectedAcademicYear } = useAcademicContext();
  
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRate, setEditingRate] = useState<PeriodRate | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    ratePerPeriod: 0,
    effectiveDate: '',
    description: ''
  });

  useEffect(() => {
    if (selectedAcademicYear) {
      fetchRates();
    }
  }, [selectedAcademicYear]);

  const fetchRates = async () => {
    if (!selectedAcademicYear) return;
    
    try {
      setLoading(true);
      const response = await periodRateAPI.getAll({ academicYearId: selectedAcademicYear._id });
      setRates(response.data || []);
      setError(null);
    } catch (err: any) {
      setError('Lỗi khi tải danh sách định mức');
      setRates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAcademicYear || !formData.name.trim() || formData.ratePerPeriod <= 0) {
      setError('Vui lòng điền đầy đủ thông tin hợp lệ');
      return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        academicYearId: selectedAcademicYear._id
      };
      
      if (editingRate) {
        await periodRateAPI.update(editingRate._id, submitData);
        setSuccess('Cập nhật thành công!');
      } else {
        await periodRateAPI.create(submitData);
        setSuccess('Tạo mới thành công!');
      }
      
        await fetchRates();
        handleCloseDialog();
        setError(null);
    } catch (err: any) {
      setError('Lỗi khi lưu định mức');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xác nhận xóa định mức này?')) return;

    try {
      setLoading(true);
      await periodRateAPI.delete(id);
      setSuccess('Xóa thành công!');
        await fetchRates();
        setError(null);
    } catch (err: any) {
      setError('Lỗi khi xóa định mức');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (rate?: PeriodRate) => {
    if (rate) {
      setEditingRate(rate);
      const effectiveDate = new Date(rate.effectiveDate).toISOString().split('T')[0];
      
      setFormData({
        name: rate.name,
        ratePerPeriod: rate.ratePerPeriod,
        effectiveDate,
        description: rate.description || ''
      });
    } else {
      setEditingRate(null);
      setFormData({
        name: '',
        ratePerPeriod: 0,
        effectiveDate: new Date().toISOString().split('T')[0],
        description: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRate(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const currentRate = rates.find(r => r.isActive);

  return (
    <AcademicGuard
      title="Thiết lập định mức tiền theo tiết"
      icon={<SchoolIcon style={{ marginRight: '8px', color: '#1890ff' }} />}
    >
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Thiết lập định mức tiền cho một tiết giảng dạy chuẩn trong năm học này
      </Typography>

      {currentRate && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Định mức hiện tại: {formatCurrency(currentRate.ratePerPeriod)}/tiết
          </Typography>
          <Typography variant="body2">
            {currentRate.name} - Có hiệu lực từ {new Date(currentRate.effectiveDate).toLocaleDateString('vi-VN')}
          </Typography>
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Thiết lập định mức tiền theo tiết
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={loading}
        >
          Thêm định mức mới
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

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tổng định mức
              </Typography>
              <Typography variant="h4">
                {rates.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Đang áp dụng
              </Typography>
              <Typography variant="h4">
                {rates.filter(r => r.isActive).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Định mức hiện tại
              </Typography>
              <Typography variant="h4">
                {formatCurrency(currentRate?.ratePerPeriod || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Định mức cao nhất
              </Typography>
              <Typography variant="h4">
                {formatCurrency(Math.max(...rates.map(r => r.ratePerPeriod), 0))}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
              <TableCell>Tên định mức</TableCell>
              <TableCell>Giá tiền/tiết</TableCell>
                <TableCell>Ngày hiệu lực</TableCell>
              <TableCell>Trạng thái</TableCell>
                <TableCell>Mô tả</TableCell>
              <TableCell align="center">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : rates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="textSecondary">
                    Chưa có định mức nào
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rates.map((rate) => (
                <TableRow key={rate._id}>
                  <TableCell>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {rate.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(rate.ratePerPeriod)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(rate.effectiveDate).toLocaleDateString('vi-VN')}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={rate.isActive ? 'Đang áp dụng' : 'Không áp dụng'} 
                      color={rate.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {rate.description || 'Không có mô tả'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" gap={1} justifyContent="center">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(rate)}
                        title="Chỉnh sửa"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(rate._id)}
                        title="Xóa"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
            </TableBody>
          </Table>
        </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingRate ? 'Chỉnh sửa định mức' : 'Thêm định mức mới'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tên định mức"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Định mức chuẩn 2024"
                helperText="Tên gọi để phân biệt với các định mức khác"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Giá tiền mỗi tiết (VNĐ)"
                type="number"
                value={formData.ratePerPeriod}
                onChange={(e) => setFormData({ ...formData, ratePerPeriod: Number(e.target.value) })}
                placeholder="VD: 150000"
                helperText="Số tiền trả cho một tiết giảng dạy chuẩn"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ngày hiệu lực"
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                helperText="Ngày bắt đầu áp dụng định mức này"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mô tả"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả về định mức này..."
                helperText="Thông tin bổ sung về định mức (không bắt buộc)"
              />
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
            {loading ? <CircularProgress size={20} /> : (editingRate ? 'Cập nhật' : 'Tạo mới')}
          </Button>
        </DialogActions>
      </Dialog>
    </AcademicGuard>
  );
};

export default RateSettingManagement; 