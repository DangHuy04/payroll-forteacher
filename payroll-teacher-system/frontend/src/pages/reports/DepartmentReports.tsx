import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Select,
  Row,
  Col,
  Typography,
  Statistic,
  Space,
  Button,
  message,
  Spin,
  Empty,
  Tag,
  Tooltip,
  Modal,
  Progress,
  Alert
} from 'antd';
import {
  ApartmentOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  DollarOutlined,
  BookOutlined,
  CalendarOutlined,
  SearchOutlined,
  UserOutlined,
  EyeOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { useAcademicContext } from '../../components/AcademicYearSemesterSelector';
import AcademicGuard from '../../components/AcademicGuard';
import api from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
}

interface TeacherSummary {
  teacherId: string;
  teacherCode: string;
  teacherName: string;
  email: string;
  totalClasses: number;
  totalPeriods: number;
  totalAmount: number;
  averageStudentsPerClass: number;
  totalCredits: number;
}

interface DepartmentSummary {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  totalTeachers: number;
  totalClasses: number;
  totalPeriods: number;
  totalAmount: number;
  averageAmountPerTeacher: number;
  teachers: TeacherSummary[];
}

const DepartmentReports: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [departmentData, setDepartmentData] = useState<DepartmentSummary | null>(null);
  const [selectedTeacherModal, setSelectedTeacherModal] = useState<TeacherSummary | null>(null);
  const [teacherDetailData, setTeacherDetailData] = useState<any[]>([]);
  const [teacherDetailLoading, setTeacherDetailLoading] = useState(false);

  // Academic context - automatically uses selected academic year/semester
  const { selectedAcademicYear, selectedSemester, isDataSelected } = useAcademicContext();

  // Fetch initial data
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Auto fetch report when department and academic context change
  useEffect(() => {
    if (selectedDepartment && isDataSelected()) {
      fetchDepartmentReport();
    }
  }, [selectedDepartment, selectedAcademicYear, selectedSemester]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      const data = response.data?.data || response.data || [];
      setDepartments(Array.isArray(data) ? data : []);
    } catch (error) {
      
      message.error('Lỗi khi tải danh sách khoa');
    }
  };

  const fetchDepartmentReport = async () => {
    if (!selectedDepartment || !isDataSelected()) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await api.get(`/departments/${selectedDepartment}/teaching-report`, {
        params: { 
          academicYearId: selectedAcademicYear?._id,
          semesterId: selectedSemester?._id
        }
      });
      
      const data = response.data?.data || null;
      setDepartmentData(data);
      
    } catch (error) {
      
      message.error('Lỗi khi tải báo cáo khoa');
      setDepartmentData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherDetail = async (teacherId: string) => {
    try {
      setTeacherDetailLoading(true);
      
      const response = await api.get(`/teachers/${teacherId}/teaching-report`, {
        params: { 
          academicYearId: selectedAcademicYear?._id,
          semesterId: selectedSemester?._id
        }
      });
      
      const data = response.data?.data || [];
      setTeacherDetailData(data);
      
    } catch (error) {
      
      message.error('Lỗi khi tải chi tiết giảng viên');
      setTeacherDetailData([]);
    } finally {
      setTeacherDetailLoading(false);
    }
  };

  const handleViewTeacherDetail = async (teacher: TeacherSummary) => {
    setSelectedTeacherModal(teacher);
    await fetchTeacherDetail(teacher.teacherId);
  };

  const handleExportExcel = () => {
    message.success('Tính năng xuất Excel sẽ được triển khai trong phiên bản tới');
  };

  const handleExportPDF = () => {
    message.success('Tính năng xuất PDF sẽ được triển khai trong phiên bản tới');
  };

  // Get top 5 teachers for chart
  const getTopTeachers = () => {
    if (!departmentData?.teachers) return [];
    return [...departmentData.teachers]
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);
  };

  // Table columns for teachers
  const teacherColumns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'Mã GV',
      dataIndex: 'teacherCode',
      key: 'teacherCode',
      width: 100,
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: 'Họ và tên',
      dataIndex: 'teacherName',
      key: 'teacherName',
      width: 200,
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (email: string) => (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {email}
        </Text>
      ),
    },
    {
      title: 'Số lớp',
      dataIndex: 'totalClasses',
      key: 'totalClasses',
      width: 80,
      align: 'center' as const,
      render: (count: number) => <Tag color="blue">{count}</Tag>,
    },
    {
      title: 'Số tiết',
      dataIndex: 'totalPeriods',
      key: 'totalPeriods',
      width: 80,
      align: 'center' as const,
    },
    {
      title: 'Số tín chỉ',
      dataIndex: 'totalCredits',
      key: 'totalCredits',
      width: 90,
      align: 'center' as const,
    },
    {
      title: 'Số tiền (VNĐ)',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => (
        <Text style={{ color: '#f5222d' }}>
          {amount?.toLocaleString('vi-VN') || 0}
        </Text>
      ),
    },
  ];

  const topTeachers = getTopTeachers();
  const maxAmount = topTeachers.length > 0 ? topTeachers[0].totalAmount : 0;

  return (
    <AcademicGuard
      title="Báo cáo tiền dạy theo khoa"
      icon={<ApartmentOutlined style={{ marginRight: '8px', color: '#1890ff' }} />}
    >
      <div style={{ backgroundColor: '#f5f5f5', minHeight: '70vh', marginTop: '-24px', padding: '24px', marginLeft: '-24px', marginRight: '-24px' }}>
        <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '24px' }}>
          Thống kê và phân tích tiền dạy của giảng viên trong khoa theo năm học
        </Text>

        {/* Filter Section - Only Department Filter */}
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
                  <ApartmentOutlined /> Chọn khoa:
                </Text>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Chọn khoa/bộ môn"
                  value={selectedDepartment}
                  onChange={setSelectedDepartment}
                  size="large"
                  showSearch
                  optionFilterProp="children"
                >
                  {departments.map(dept => (
                    <Option key={dept._id} value={dept._id}>
                      {dept.code} - {dept.name}
                    </Option>
                  ))}
                </Select>
              </Space>
            </Col>

            <Col xs={24} md={10}>
              <Alert
                message="Dữ liệu tự động cập nhật theo năm học và kỳ học đã chọn"
                description={`Hiện đang xem báo cáo cho ${selectedAcademicYear?.name} - ${selectedSemester?.displayName}. Chọn khoa để xem chi tiết.`}
                type="info"
                showIcon
                style={{ borderRadius: '6px' }}
              />
            </Col>

            <Col xs={24} md={6}>
              <Space style={{ marginTop: '8px' }}>
                <Tooltip title="Xuất Excel">
                  <Button
                    icon={<FileExcelOutlined />}
                    onClick={handleExportExcel}
                    disabled={!departmentData}
                    style={{ color: '#52c41a' }}
                  >
                    Excel
                  </Button>
                </Tooltip>
                <Tooltip title="Xuất PDF">
                  <Button
                    icon={<FilePdfOutlined />}
                    onClick={handleExportPDF}
                    disabled={!departmentData}
                    style={{ color: '#f5222d' }}
                  >
                    PDF
                  </Button>
                </Tooltip>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Department Summary */}
        {departmentData && (
          <>
            {/* Department Info Header */}
            <Card 
              style={{ 
                marginBottom: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                color: 'white'
              }}
            >
              <Row gutter={24} align="middle">
                <Col span={18}>
                  <Space direction="vertical" size="small">
                    <Title level={4} style={{ color: 'white', margin: 0 }}>
                      <ApartmentOutlined /> {departmentData.departmentName}
                    </Title>
                    <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                      Mã khoa: {departmentData.departmentCode}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                      Kỳ học: {selectedAcademicYear?.name} - {selectedSemester?.displayName}
                    </Text>
                  </Space>
                </Col>
                <Col span={6}>
                  <div style={{ textAlign: 'right' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>
                      Số giảng viên
                    </Text>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
                      {departmentData.totalTeachers}
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Summary Statistics */}
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col xs={12} sm={6}>
                <Card style={{ borderRadius: '8px', textAlign: 'center' }}>
                  <Statistic
                    title="Tổng số lớp"
                    value={departmentData.totalClasses}
                    prefix={<BookOutlined style={{ color: '#1890ff' }} />}
                    valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card style={{ borderRadius: '8px', textAlign: 'center' }}>
                  <Statistic
                    title="Tổng số tiết"
                    value={departmentData.totalPeriods}
                    prefix={<CalendarOutlined style={{ color: '#52c41a' }} />}
                    valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card style={{ borderRadius: '8px', textAlign: 'center' }}>
                  <Statistic
                    title="TB tiền/GV"
                    value={departmentData.averageAmountPerTeacher}
                    formatter={(value) => `${value?.toLocaleString('vi-VN')} VNĐ`}
                    valueStyle={{ color: '#fa8c16', fontSize: '20px' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card style={{ borderRadius: '8px', textAlign: 'center' }}>
                  <Statistic
                    title="Tổng tiền khoa"
                    value={departmentData.totalAmount}
                    formatter={(value) => `${value?.toLocaleString('vi-VN')} VNĐ`}
                    prefix={<DollarOutlined style={{ color: '#f5222d' }} />}
                    valueStyle={{ color: '#f5222d', fontSize: '20px', fontWeight: 'bold' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Top 5 Teachers Chart */}
            {topTeachers.length > 0 && (
              <Card 
                title={
                  <Space>
                    <BarChartOutlined />
                    <span>Top 5 giảng viên có tiền dạy cao nhất</span>
                  </Space>
                }
                style={{ 
                  marginBottom: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderRadius: '8px'
                }}
              >
                <div style={{ padding: '20px 0' }}>
                  {topTeachers.map((teacher, index) => (
                    <div key={teacher.teacherId} style={{ marginBottom: '16px' }}>
                      <Row align="middle" gutter={16}>
                        <Col span={1}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: ['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96'][index],
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            {index + 1}
                          </div>
                        </Col>
                        <Col span={6}>
                          <div>
                            <Text strong>{teacher.teacherName}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {teacher.teacherCode}
                            </Text>
                          </div>
                        </Col>
                        <Col span={12}>
                          <Progress
                            percent={maxAmount > 0 ? Math.round((teacher.totalAmount / maxAmount) * 100) : 0}
                            strokeColor={['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96'][index]}
                            showInfo={false}
                          />
                        </Col>
                        <Col span={5} style={{ textAlign: 'right' }}>
                          <Text strong style={{ color: '#f5222d' }}>
                            {teacher.totalAmount.toLocaleString('vi-VN')} VNĐ
                          </Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {teacher.totalClasses} lớp • {teacher.totalPeriods} tiết
                          </Text>
                        </Col>
                      </Row>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Teachers Table */}
            <Card 
              title={
                <Space>
                  <UserOutlined />
                  <span>Danh sách giảng viên ({departmentData.teachers?.length || 0})</span>
                </Space>
              }
              style={{
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderRadius: '8px'
              }}
              extra={
                <Space>
                  <Text type="secondary">
                    Tổng: {departmentData.totalAmount?.toLocaleString('vi-VN')} VNĐ
                  </Text>
                </Space>
              }
            >
              <Spin spinning={loading}>
                <Table
                  columns={teacherColumns}
                  dataSource={departmentData.teachers || []}
                  rowKey="teacherId"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => 
                      `${range[0]}-${range[1]} của ${total} giảng viên`,
                  }}
                  scroll={{ x: 800 }}
                  size="middle"
                  summary={(pageData) => {
                    const totalAmount = pageData.reduce((sum, record) => sum + (record.totalAmount || 0), 0);
                    const totalClasses = pageData.reduce((sum, record) => sum + (record.totalClasses || 0), 0);
                    const totalPeriods = pageData.reduce((sum, record) => sum + (record.totalPeriods || 0), 0);

                    return (
                      <Table.Summary.Row style={{ backgroundColor: '#fafafa' }}>
                        <Table.Summary.Cell index={0} colSpan={4}>
                          <Text strong>Tổng trang này:</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="center">
                          <Text strong>{totalClasses}</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} align="center">
                          <Text strong>{totalPeriods}</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3}>
                          <Text strong>-</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4} align="right">
                          <Text strong style={{ color: '#f5222d' }}>
                            {totalAmount.toLocaleString('vi-VN')} VNĐ
                          </Text>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    );
                  }}
                />
              </Spin>
            </Card>
          </>
        )}

        {/* Empty State */}
        {!loading && !departmentData && selectedDepartment && (
          <Card style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Empty
              description="Không có dữ liệu báo cáo cho khoa đã chọn"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Card>
        )}

        {/* Teacher Detail Modal */}
        <Modal
          title={
            <Space>
              <UserOutlined />
              <span>Chi tiết giảng dạy - {selectedTeacherModal?.teacherName}</span>
            </Space>
          }
          open={!!selectedTeacherModal}
          onCancel={() => {
            setSelectedTeacherModal(null);
            setTeacherDetailData([]);
          }}
          footer={null}
          width={1200}
        >
          {selectedTeacherModal && (
            <div>
              <Row gutter={16} style={{ marginBottom: '16px' }}>
                <Col span={8}>
                  <Card size="small">
                    <Statistic
                      title="Tổng số lớp"
                      value={selectedTeacherModal.totalClasses}
                      prefix={<BookOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small">
                    <Statistic
                      title="Tổng số tiết"
                      value={selectedTeacherModal.totalPeriods}
                      prefix={<CalendarOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small">
                    <Statistic
                      title="Tổng tiền"
                      value={selectedTeacherModal.totalAmount}
                      formatter={(value) => `${value?.toLocaleString('vi-VN')} VNĐ`}
                      prefix={<DollarOutlined />}
                      valueStyle={{ color: '#f5222d' }}
                    />
                  </Card>
                </Col>
              </Row>

              <Spin spinning={teacherDetailLoading}>
                <Table
                  columns={[
                    {
                      title: 'Mã lớp',
                      dataIndex: 'classCode',
                      key: 'classCode',
                    },
                    {
                      title: 'Tên lớp',
                      dataIndex: 'className',
                      key: 'className',
                    },
                    {
                      title: 'Học phần',
                      dataIndex: 'subjectName',
                      key: 'subject',
                      width: 150,
                    },
                    {
                      title: 'Số tiết',
                      dataIndex: 'periods',
                      key: 'periods',
                      align: 'center' as const,
                    },
                    {
                      title: 'Số SV',
                      dataIndex: 'studentCount',
                      key: 'studentCount',
                      align: 'center' as const,
                    },
                    {
                      title: 'Hệ số',
                      dataIndex: 'coefficient',
                      key: 'coefficient',
                      align: 'center' as const,
                      render: (value: number) => value?.toFixed(2),
                    },
                    {
                      title: 'Tiền (VNĐ)',
                      dataIndex: 'amount',
                      key: 'amount',
                      align: 'right' as const,
                      render: (value: number) => (
                        <Text style={{ color: '#f5222d' }}>
                          {value?.toLocaleString('vi-VN') || 0}
                        </Text>
                      ),
                    },
                  ]}
                  dataSource={teacherDetailData}
                  rowKey={(record, index) => `${record.classId || 'unknown'}-${index}`}
                  size="small"
                  pagination={false}
                  scroll={{ x: 600 }}
                />
              </Spin>
            </div>
          )}
        </Modal>
      </div>
    </AcademicGuard>
  );
};

export default DepartmentReports; 
