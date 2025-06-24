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
  Tabs,
  Input,
  Slider,
  Divider,
  Progress,
  Alert
} from 'antd';
import {
  BankOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  DollarOutlined,
  BookOutlined,
  CalendarOutlined,
  SearchOutlined,
  UserOutlined,
  ApartmentOutlined,
  FilterOutlined,
  BarChartOutlined,
  PieChartOutlined,
  TrophyOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useAcademicContext } from '../../components/AcademicYearSemesterSelector';
import AcademicGuard from '../../components/AcademicGuard';
import api from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Search } = Input;

interface AcademicYear {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface Semester {
  _id: string;
  name: string;
  academicYearId: string;
  startDate: string;
  endDate: string;
}

interface Department {
  _id: string;
  name: string;
  code: string;
}

interface UniversityTeacher {
  teacherId: string;
  teacherCode: string;
  teacherName: string;
  email: string;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
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
  percentage: number;
}

interface UniversitySummary {
  totalTeachers: number;
  totalClasses: number;
  totalPeriods: number;
  totalAmount: number;
  averageAmountPerTeacher: number;
  totalDepartments: number;
  teachers: UniversityTeacher[];
  departmentSummaries: DepartmentSummary[];
}

const UniversityReports: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [universityData, setUniversityData] = useState<UniversitySummary | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchText, setSearchText] = useState<string>('');
  const [amountRange, setAmountRange] = useState<[number, number]>([0, 50000000]);

  // Academic context - automatically uses selected academic year/semester
  const { selectedAcademicYear, selectedSemester, isDataSelected } = useAcademicContext();

  // Fetch initial data
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Fetch university report when academic context changes
  useEffect(() => {
    if (isDataSelected()) {
      fetchUniversityReport();
    }
  }, [selectedAcademicYear, selectedSemester, selectedDepartments]);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      const data = response.data?.data || response.data || [];
      setDepartments(Array.isArray(data) ? data : []);
    } catch (error) {
      
      message.error('Lỗi khi tải danh sách khoa');
    }
  };

  const fetchUniversityReport = async () => {
    if (!isDataSelected()) {
      return;
    }

    try {
      setLoading(true);
      
      const params: any = { 
        academicYearId: selectedAcademicYear?._id,
        semesterId: selectedSemester?._id
      };
      if (selectedDepartments.length > 0) params.departmentIds = selectedDepartments.join(',');

      const response = await api.get('/university/teaching-report', { params });
      
      const data = response.data?.data || null;
      setUniversityData(data);
      
      // Update amount range based on data
      if (data?.teachers?.length > 0) {
        const amounts = data.teachers.map((t: UniversityTeacher) => t.totalAmount);
        const maxAmount = Math.max(...amounts);
        setAmountRange([0, maxAmount]);
      }
      
    } catch (error) {
      
      message.error('Lỗi khi tải báo cáo toàn trường');
      setUniversityData(null);
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

  // Get filtered data based on current tab and filters
  const getFilteredData = () => {
    if (!universityData) return [];

    let filteredTeachers = [...universityData.teachers];

    // Filter by search text
    if (searchText) {
      filteredTeachers = filteredTeachers.filter(teacher =>
        teacher.teacherName.toLowerCase().includes(searchText.toLowerCase()) ||
        teacher.teacherCode.toLowerCase().includes(searchText.toLowerCase()) ||
        teacher.departmentName.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filter by amount range
    filteredTeachers = filteredTeachers.filter(teacher =>
      teacher.totalAmount >= amountRange[0] && teacher.totalAmount <= amountRange[1]
    );

    // Sort by amount descending
    filteredTeachers.sort((a, b) => b.totalAmount - a.totalAmount);

    return filteredTeachers;
  };

  // Get data by tab
  const getTabData = () => {
    const filteredData = getFilteredData();

    switch (activeTab) {
      case 'top10':
        return filteredData.slice(0, 10);
      case 'byDepartment':
        return filteredData; // Will be grouped by department in display
      default:
        return filteredData;
    }
  };

  // Get top departments for pie chart
  const getTopDepartments = () => {
    if (!universityData?.departmentSummaries) return [];
    return [...universityData.departmentSummaries]
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 6);
  };

  // Table columns
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
      ellipsis: true,
      render: (name: string, record: UniversityTeacher) => (
        <div>
          <div style={{ fontWeight: 500 }}>{name}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.email}
          </Text>
        </div>
      ),
    },
    {
      title: 'Khoa',
      dataIndex: 'departmentName',
      key: 'departmentName',
      width: 150,
      ellipsis: true,
      render: (dept: string, record: UniversityTeacher) => (
        <div>
          <Tag color="green">{record.departmentCode}</Tag>
          <br />
          <Text style={{ fontSize: '12px' }}>{dept}</Text>
        </div>
      ),
    },
    {
      title: 'Số lớp',
      dataIndex: 'totalClasses',
      key: 'totalClasses',
      width: 80,
      align: 'center' as const,
      render: (classes: number) => <Tag color="orange">{classes}</Tag>,
      sorter: (a: UniversityTeacher, b: UniversityTeacher) => a.totalClasses - b.totalClasses,
    },
    {
      title: 'Tổng tiết',
      dataIndex: 'totalPeriods',
      key: 'totalPeriods',
      width: 90,
      align: 'center' as const,
      render: (periods: number) => <strong>{periods}</strong>,
      sorter: (a: UniversityTeacher, b: UniversityTeacher) => a.totalPeriods - b.totalPeriods,
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
      sorter: (a: UniversityTeacher, b: UniversityTeacher) => a.totalAmount - b.totalAmount,
      defaultSortOrder: 'descend' as const,
    },
  ];

  // Department summary columns
  const departmentColumns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'Mã khoa',
      dataIndex: 'departmentCode',
      key: 'departmentCode',
      width: 100,
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: 'Tên khoa',
      dataIndex: 'departmentName',
      key: 'departmentName',
      ellipsis: true,
    },
    {
      title: 'Số GV',
      dataIndex: 'totalTeachers',
      key: 'totalTeachers',
      width: 80,
      align: 'center' as const,
      render: (teachers: number) => <Tag color="green">{teachers}</Tag>,
    },
    {
      title: 'Số lớp',
      dataIndex: 'totalClasses',
      key: 'totalClasses',
      width: 80,
      align: 'center' as const,
    },
    {
      title: 'Tổng tiết',
      dataIndex: 'totalPeriods',
      key: 'totalPeriods',
      width: 90,
      align: 'center' as const,
      render: (periods: number) => <strong>{periods}</strong>,
    },
    {
      title: 'TB tiền/GV',
      dataIndex: 'averageAmountPerTeacher',
      key: 'averageAmountPerTeacher',
      width: 130,
      align: 'right' as const,
      render: (avg: number) => (
        <Text style={{ color: '#1890ff' }}>
          {avg?.toLocaleString('vi-VN') || 0}
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
      title: 'Tỷ lệ (%)',
      dataIndex: 'percentage',
      key: 'percentage',
      width: 100,
      align: 'center' as const,
      render: (percentage: number) => (
        <Progress
          type="circle"
          percent={Math.round(percentage)}
          width={40}
          format={(percent) => `${percent}%`}
        />
      ),
    },
  ];

  const tabData = getTabData();
  const topDepartments = getTopDepartments();
  const maxDeptAmount = topDepartments.length > 0 ? topDepartments[0].totalAmount : 0;

  return (
    <AcademicGuard
      title="Báo cáo tiền dạy toàn trường"
      icon={<BankOutlined style={{ marginRight: '8px', color: '#1890ff' }} />}
    >
      <div style={{ backgroundColor: '#f5f5f5', minHeight: '70vh', marginTop: '-24px', padding: '24px', marginLeft: '-24px', marginRight: '-24px' }}>
        <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '24px' }}>
          Thống kê tổng hợp và phân tích toàn diện tiền dạy của toàn trường
        </Text>

      {/* Filter Section - Only Department Filter */}
      <Card 
        style={{ 
          marginBottom: '24px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: '8px'
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong style={{ color: '#1890ff' }}>
                <ApartmentOutlined /> Lọc theo khoa (tuỳ chọn):
              </Text>
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="Tất cả khoa"
                value={selectedDepartments}
                onChange={setSelectedDepartments}
                size="large"
                allowClear
              >
                {departments.map(dept => (
                  <Option key={dept._id} value={dept._id}>
                    {dept.code} - {dept.name}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          
          <Col xs={24} md={16}>
            <Alert
              message="Dữ liệu tự động cập nhật theo năm học và kỳ học đã chọn"
              description={`Hiện đang xem báo cáo cho ${selectedAcademicYear?.name} - ${selectedSemester?.displayName}. Bạn có thể lọc thêm theo khoa nếu cần.`}
              type="info"
              showIcon
              style={{ borderRadius: '6px' }}
            />
          </Col>
        </Row>
      </Card>

      {/* University Summary */}
      {universityData && (
        <>
          {/* University Info Header */}
          <Card 
            style={{ 
              marginBottom: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)',
              color: 'white'
            }}
          >
            <Row gutter={24} align="middle">
              <Col span={18}>
                <Space direction="vertical" size="small">
                  <Title level={3} style={{ color: 'white', margin: 0 }}>
                    <BankOutlined /> TRƯỜNG ĐẠI HỌC 
                  </Title>
                  <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px' }}>
                    Báo cáo tiền dạy năm học: {selectedAcademicYear?.name}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                    Học kỳ: {selectedSemester?.displayName}
                  </Text>
                </Space>
              </Col>
              <Col span={6}>
                <div style={{ textAlign: 'right' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>
                    Tổng số khoa
                  </Text>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>
                    {universityData.totalDepartments}
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
                  title="Tổng giảng viên"
                  value={universityData.totalTeachers}
                  prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: '8px', textAlign: 'center' }}>
                <Statistic
                  title="Tổng số lớp"
                  value={universityData.totalClasses}
                  prefix={<BookOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: '8px', textAlign: 'center' }}>
                <Statistic
                  title="Tổng số tiết"
                  value={universityData.totalPeriods}
                  prefix={<CalendarOutlined style={{ color: '#fa8c16' }} />}
                  valueStyle={{ color: '#fa8c16', fontSize: '24px' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card style={{ borderRadius: '8px', textAlign: 'center' }}>
                <Statistic
                  title="Tổng tiền toàn trường"
                  value={universityData.totalAmount}
                  formatter={(value) => `${value?.toLocaleString('vi-VN')} VNĐ`}
                  prefix={<DollarOutlined style={{ color: '#f5222d' }} />}
                  valueStyle={{ color: '#f5222d', fontSize: '18px', fontWeight: 'bold' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Department Distribution Chart */}
          {topDepartments.length > 0 && (
            <Card 
              title={
                <Space>
                  <PieChartOutlined />
                  <span>Phân bố tiền dạy theo khoa</span>
                </Space>
              }
              style={{ 
                marginBottom: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderRadius: '8px'
              }}
            >
              <Alert
                message="Biểu đồ tròn sẽ được triển khai với thư viện chart"
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />
              <div style={{ padding: '20px 0' }}>
                {topDepartments.map((dept, index) => (
                  <div key={dept.departmentId} style={{ marginBottom: '16px' }}>
                    <Row align="middle" gutter={16}>
                      <Col span={1}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: ['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96', '#13c2c2'][index],
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
                      <Col span={5}>
                        <div>
                          <Text strong>{dept.departmentName}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {dept.departmentCode} • {dept.totalTeachers} GV
                          </Text>
                        </div>
                      </Col>
                      <Col span={12}>
                        <Progress
                          percent={maxDeptAmount > 0 ? Math.round((dept.totalAmount / maxDeptAmount) * 100) : 0}
                          strokeColor={['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96', '#13c2c2'][index]}
                          showInfo={false}
                        />
                      </Col>
                      <Col span={4} style={{ textAlign: 'right' }}>
                        <Text strong style={{ color: '#f5222d' }}>
                          {dept.totalAmount.toLocaleString('vi-VN')} VNĐ
                        </Text>
                      </Col>
                      <Col span={2} style={{ textAlign: 'center' }}>
                        <Text strong style={{ color: '#1890ff' }}>
                          {Math.round(dept.percentage)}%
                        </Text>
                      </Col>
                    </Row>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Advanced Filters */}
          <Card 
            title={
              <Space>
                <FilterOutlined />
                <span>Bộ lọc nâng cao</span>
              </Space>
            }
            style={{ 
              marginBottom: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderRadius: '8px'
            }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>Tìm kiếm giảng viên:</Text>
                  <Search
                    placeholder="Nhập tên, mã GV hoặc tên khoa..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ width: '100%' }}
                    allowClear
                  />
                </Space>
              </Col>
              <Col xs={24} md={12}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>Khoảng tiền dạy (VNĐ):</Text>
                                     <Slider
                     range
                     min={0}
                     max={universityData.totalAmount > 0 ? Math.max(...universityData.teachers.map(t => t.totalAmount)) : 50000000}
                     value={amountRange}
                     onChange={(value) => setAmountRange(value as [number, number])}
                     tooltip={{
                       formatter: (value) => `${value?.toLocaleString('vi-VN')} VNĐ`
                     }}
                   />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Từ {amountRange[0].toLocaleString('vi-VN')} đến {amountRange[1].toLocaleString('vi-VN')} VNĐ
                  </Text>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* Tabbed Data View */}
          <Card 
            style={{ 
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderRadius: '8px'
            }}
            extra={
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
            }
          >
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab}
              size="large"
            >
              <TabPane 
                tab={
                  <Space>
                    <TeamOutlined />
                    <span>Tất cả giảng viên</span>
                    <Tag color="blue">{getFilteredData().length}</Tag>
                  </Space>
                } 
                key="all"
              >
                <Table
                  columns={teacherColumns}
                  dataSource={tabData}
                  rowKey="teacherId"
                  pagination={{
                    total: tabData.length,
                    pageSize: 15,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => 
                      `${range[0]}-${range[1]} của ${total} giảng viên`,
                  }}
                  scroll={{ x: 1000 }}
                  size="middle"
                />
              </TabPane>

              <TabPane 
                tab={
                  <Space>
                    <ApartmentOutlined />
                    <span>Theo khoa</span>
                    <Tag color="green">{universityData.departmentSummaries?.length || 0}</Tag>
                  </Space>
                } 
                key="byDepartment"
              >
                <Table
                  columns={departmentColumns}
                  dataSource={universityData.departmentSummaries || []}
                  rowKey="departmentId"
                  pagination={{
                    total: universityData.departmentSummaries?.length || 0,
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => 
                      `${range[0]}-${range[1]} của ${total} khoa`,
                  }}
                  scroll={{ x: 1000 }}
                  size="middle"
                />
              </TabPane>

              <TabPane 
                tab={
                  <Space>
                    <TrophyOutlined />
                    <span>Top 10 giảng viên</span>
                    <Tag color="gold">10</Tag>
                  </Space>
                } 
                key="top10"
              >
                <Table
                  columns={[
                    {
                      title: 'Hạng',
                      key: 'rank',
                      width: 80,
                      align: 'center' as const,
                      render: (_: any, __: any, index: number) => (
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: index < 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][index] : '#1890ff',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          margin: '0 auto'
                        }}>
                          {index + 1}
                        </div>
                      ),
                    },
                    ...teacherColumns.slice(1)
                  ]}
                  dataSource={tabData}
                  rowKey="teacherId"
                  pagination={false}
                  scroll={{ x: 1000 }}
                  size="middle"
                />
              </TabPane>
            </Tabs>
          </Card>
        </>
      )}

      {/* No Data State */}
      {!universityData && !loading && (
        <Card style={{ textAlign: 'center', padding: '40px' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Không có dữ liệu báo cáo"
          />
        </Card>
      )}
      </div>
    </AcademicGuard>
  );
};

export default UniversityReports; 
