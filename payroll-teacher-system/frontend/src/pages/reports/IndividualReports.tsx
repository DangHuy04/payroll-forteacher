import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Select,
  AutoComplete,
  Row,
  Col,
  Typography,
  Statistic,
  Space,
  Button,
  DatePicker,
  message,
  Spin,
  Empty,
  Divider,
  Tag,
  Tooltip,
  Alert
} from 'antd';
import {
  UserOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  DollarOutlined,
  BookOutlined,
  CalendarOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useAcademicContext } from '../../components/AcademicYearSemesterSelector';
import AcademicGuard from '../../components/AcademicGuard';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface Teacher {
  _id: string;
  employeeId: string;
  fullName: string;
  email: string;
  departmentId: {
    _id: string;
    name: string;
    code: string;
  };
}

interface AcademicYear {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface TeachingReport {
  classId: string;
  classCode: string;
  className: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  coefficient: number;
  studentCount: number;
  totalPeriods: number;
  hourlyRate: number;
  totalAmount: number;
  semesterName: string;
  departmentName: string;
  teachingDate: string;
}

interface ReportSummary {
  totalClasses: number;
  totalPeriods: number;
  totalAmount: number;
  averageStudentsPerClass: number;
  totalCredits: number;
}

const IndividualReports: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [teacherSearchValue, setTeacherSearchValue] = useState<string>('');
  const [reportData, setReportData] = useState<TeachingReport[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [teacherInfo, setTeacherInfo] = useState<Teacher | null>(null);

  // Academic context - automatically uses selected academic year/semester
  const { selectedAcademicYear, selectedSemester, isDataSelected } = useAcademicContext();

  // Search teachers when input changes
  useEffect(() => {
    if (teacherSearchValue && teacherSearchValue.length >= 2) {
      searchTeachers(teacherSearchValue);
    }
  }, [teacherSearchValue]);

  const searchTeachers = async (searchText: string) => {
    if (!searchText) return;
    
    try {
      setSearchLoading(true);
      const response = await api.get('/teachers', {
        params: { search: searchText, limit: 20 }
      });
      const data = response.data?.data || response.data || [];
      setTeachers(Array.isArray(data) ? data : []);
    } catch (error) {
      
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchTeachingReport = async () => {
    if (!selectedTeacher || !selectedAcademicYear) {
      message.warning('Vui lòng chọn giảng viên');
      return;
    }

    try {
      setLoading(true);
      
      // Fetch teacher info
      const teacherResponse = await api.get(`/teachers/${selectedTeacher}`);
      setTeacherInfo(teacherResponse.data?.data);

      // Fetch teaching report using academic context
      const reportResponse = await api.get(`/teachers/${selectedTeacher}/teaching-report`, {
        params: { 
          academicYearId: selectedAcademicYear._id,
          semesterId: selectedSemester?._id
        }
      });
      
      const reportData = reportResponse.data?.data || [];
      setReportData(reportData);
      
      // Calculate summary
      if (reportData.length > 0) {
        const totalClasses = reportData.length;
        const totalPeriods = reportData.reduce((sum: number, item: TeachingReport) => sum + item.totalPeriods, 0);
        const totalAmount = reportData.reduce((sum: number, item: TeachingReport) => sum + item.totalAmount, 0);
        const totalStudents = reportData.reduce((sum: number, item: TeachingReport) => sum + item.studentCount, 0);
        const totalCredits = reportData.reduce((sum: number, item: TeachingReport) => sum + item.credits, 0);
        
        setSummary({
          totalClasses,
          totalPeriods,
          totalAmount,
          averageStudentsPerClass: totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0,
          totalCredits
        });
      } else {
        setSummary(null);
      }
      
    } catch (error) {
      
      message.error('Lỗi khi tải báo cáo giảng dạy');
      setReportData([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    message.success('Tính năng xuất Excel sẽ được triển khai trong phiên bản tới');
  };

  const handleExportPDF = () => {
    message.success('Tính năng xuất PDF sẽ được triển khai trong phiên bản tới');
  };

  // Teacher search options for AutoComplete
  const teacherOptions = teachers.map(teacher => ({
    value: teacher._id,
    label: `${teacher.employeeId} - ${teacher.fullName} (${teacher.departmentId?.name || 'N/A'})`,
    teacher: teacher
  }));

  // Table columns
  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'Mã lớp',
      dataIndex: 'classCode',
      key: 'classCode',
      width: 120,
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: 'Tên lớp học phần',
      dataIndex: 'className',
      key: 'className',
      ellipsis: true,
      render: (name: string, record: TeachingReport) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.subjectCode} - {record.subjectName}
          </Text>
        </div>
      ),
    },
    {
      title: 'Tín chỉ',
      dataIndex: 'credits',
      key: 'credits',
      width: 80,
      align: 'center' as const,
      render: (credits: number) => <Tag color="green">{credits}</Tag>,
    },
    {
      title: 'Hệ số',
      dataIndex: 'coefficient',
      key: 'coefficient',
      width: 80,
      align: 'center' as const,
      render: (coefficient: number) => <Tag color="orange">{coefficient}</Tag>,
    },
    {
      title: 'Số SV',
      dataIndex: 'studentCount',
      key: 'studentCount',
      width: 80,
      align: 'center' as const,
    },
    {
      title: 'Số tiết',
      dataIndex: 'totalPeriods',
      key: 'totalPeriods',
      width: 80,
      align: 'center' as const,
      render: (periods: number) => <strong>{periods}</strong>,
    },
    {
      title: 'Đơn giá (VNĐ)',
      dataIndex: 'hourlyRate',
      key: 'hourlyRate',
      width: 120,
      align: 'right' as const,
      render: (rate: number) => (
        <Text style={{ color: '#1890ff' }}>
          {rate?.toLocaleString('vi-VN') || 0}
        </Text>
      ),
    },
    {
      title: 'Tổng tiền (VNĐ)',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 150,
      align: 'right' as const,
      render: (amount: number) => (
        <Text strong style={{ color: '#f5222d', fontSize: '14px' }}>
          {amount?.toLocaleString('vi-VN') || 0}
        </Text>
      ),
    },
    {
      title: 'Học kỳ',
      dataIndex: 'semesterName',
      key: 'semesterName',
      width: 140,
      ellipsis: true,
    },
  ];

  return (
    <AcademicGuard
      title="Báo cáo tiền dạy cá nhân"
      icon={<UserOutlined style={{ marginRight: '8px', color: '#1890ff' }} />}
    >
      <div style={{ backgroundColor: '#f5f5f5', minHeight: '70vh', marginTop: '-24px', padding: '24px', marginLeft: '-24px', marginRight: '-24px' }}>
        <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '24px' }}>
          Tra cứu chi tiết tiền dạy của giảng viên theo năm học
        </Text>

      {/* Filter Section */}
      <Card 
        style={{ 
          marginBottom: '24px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: '8px'
        }}
      >
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} md={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong style={{ color: '#1890ff' }}>
                <SearchOutlined /> Chọn giảng viên:
              </Text>
              <AutoComplete
                style={{ width: '100%' }}
                placeholder="Nhập tên hoặc mã giảng viên để tìm kiếm..."
                value={teacherSearchValue}
                options={teacherOptions}
                onSearch={setTeacherSearchValue}
                onSelect={(value, option) => {
                  setSelectedTeacher(value);
                  setTeacherSearchValue(option.label);
                }}
                allowClear
                size="large"
                notFoundContent={searchLoading ? <Spin size="small" /> : 'Không tìm thấy giảng viên'}
              />
            </Space>
          </Col>

          <Col xs={24} md={6}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong style={{ color: '#1890ff' }}>
                <CalendarOutlined /> Năm học:
              </Text>
        <Alert
                message="Năm học và kỳ học đã được chọn tự động"
                description={`Đang xem báo cáo cho ${selectedAcademicYear?.name} - ${selectedSemester?.displayName}`}
          type="info"
          showIcon
                style={{ borderRadius: '6px' }}
              />
            </Space>
          </Col>

          <Col xs={24} md={6}>
            <Space style={{ marginTop: '24px' }}>
              <Button
                type="primary"
                size="large"
                icon={<SearchOutlined />}
                onClick={fetchTeachingReport}
                loading={loading}
                disabled={!selectedTeacher || !isDataSelected()}
              >
                Xem báo cáo
              </Button>
            </Space>
          </Col>

          <Col xs={24} md={4}>
            <Space style={{ marginTop: '24px' }}>
              <Tooltip title="Xuất Excel">
                <Button
                  icon={<FileExcelOutlined />}
                  onClick={handleExportExcel}
                  disabled={!reportData.length}
                  style={{ color: '#52c41a' }}
                />
              </Tooltip>
              <Tooltip title="Xuất PDF">
                <Button
                  icon={<FilePdfOutlined />}
                  onClick={handleExportPDF}
                  disabled={!reportData.length}
                  style={{ color: '#f5222d' }}
                />
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Teacher Info */}
      {teacherInfo && (
        <Card 
          style={{ 
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}
        >
          <Row gutter={24} align="middle">
            <Col span={18}>
              <Space direction="vertical" size="small">
                <Title level={4} style={{ color: 'white', margin: 0 }}>
                  <UserOutlined /> {teacherInfo.fullName}
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Mã GV: {teacherInfo.employeeId} • Email: {teacherInfo.email}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Khoa: {teacherInfo.departmentId?.name}
                </Text>
              </Space>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'right' }}>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>
                  Năm học báo cáo
                </Text>
                <div style={{ fontSize: '16px', fontWeight: 500, color: 'white' }}>
                  {selectedAcademicYear?.name}
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* Summary Statistics */}
      {summary && (
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col xs={12} sm={6}>
            <Card style={{ borderRadius: '8px', textAlign: 'center' }}>
              <Statistic
                title="Tổng số lớp"
                value={summary.totalClasses}
                prefix={<BookOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff', fontSize: '24px' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card style={{ borderRadius: '8px', textAlign: 'center' }}>
              <Statistic
                title="Tổng số tiết"
                value={summary.totalPeriods}
                prefix={<CalendarOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a', fontSize: '24px' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card style={{ borderRadius: '8px', textAlign: 'center' }}>
              <Statistic
                title="Tổng tín chỉ"
                value={summary.totalCredits}
                valueStyle={{ color: '#fa8c16', fontSize: '24px' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card style={{ borderRadius: '8px', textAlign: 'center' }}>
              <Statistic
                title="Tổng tiền dạy"
                value={summary.totalAmount}
                formatter={(value) => `${value?.toLocaleString('vi-VN')} VNĐ`}
                prefix={<DollarOutlined style={{ color: '#f5222d' }} />}
                valueStyle={{ color: '#f5222d', fontSize: '20px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Report Table */}
      <Card 
        title={
          <Space>
            <BookOutlined />
            <span>Chi tiết lớp học phần</span>
            {reportData.length > 0 && (
              <Tag color="blue">{reportData.length} lớp</Tag>
            )}
          </Space>
        }
        style={{ 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: '8px'
        }}
        extra={
          reportData.length > 0 && (
            <Space>
              <Button 
                type="primary" 
                icon={<FileExcelOutlined />}
                onClick={handleExportExcel}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              >
                Xuất Excel
              </Button>
              <Button 
                icon={<FilePdfOutlined />}
                onClick={handleExportPDF}
                style={{ color: '#f5222d', borderColor: '#f5222d' }}
              >
                Xuất PDF
              </Button>
            </Space>
          )
        }
      >
        <Spin spinning={loading}>
          {reportData.length > 0 ? (
            <>
              <Table
                columns={columns}
                dataSource={reportData}
                rowKey="classId"
                pagination={{
                  total: reportData.length,
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => 
                    `${range[0]}-${range[1]} của ${total} lớp học phần`,
                }}
                scroll={{ x: 1200 }}
                size="middle"
                summary={(data) => {
                  const totalPeriods = data.reduce((sum, record) => sum + record.totalPeriods, 0);
                  const totalAmount = data.reduce((sum, record) => sum + record.totalAmount, 0);
                  
                  return (
                    <Table.Summary fixed>
                      <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
                        <Table.Summary.Cell index={0} colSpan={6} align="center">
                          <Text strong>TỔNG CỘNG</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={6} align="center">
                          <Text strong style={{ color: '#1890ff' }}>{totalPeriods}</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={7}></Table.Summary.Cell>
                        <Table.Summary.Cell index={8} align="right">
                          <Text strong style={{ color: '#f5222d', fontSize: '16px' }}>
                            {totalAmount.toLocaleString('vi-VN')} VNĐ
                          </Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={9}></Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  );
                }}
              />
            </>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                selectedTeacher && selectedAcademicYear 
                  ? "Không tìm thấy dữ liệu giảng dạy trong năm học này"
                  : "Vui lòng chọn giảng viên và năm học để xem báo cáo"
              }
              style={{ margin: '40px 0' }}
            >
              {selectedTeacher && selectedAcademicYear && (
                <Button type="primary" onClick={() => {
                  setSelectedTeacher('');
                  setTeacherSearchValue('');
                }}>
                  Chọn giảng viên khác
                </Button>
              )}
            </Empty>
          )}
        </Spin>
      </Card>
    </div>
    </AcademicGuard>
  );
};

export default IndividualReports; 
