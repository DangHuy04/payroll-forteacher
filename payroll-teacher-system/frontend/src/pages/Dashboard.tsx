import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Space,
  Alert,
  Spin,
  Button,
  Progress,
  List,
  Avatar,
  Tag
} from 'antd';
import {
  UserOutlined,
  BookOutlined,
  ScheduleOutlined,
  DollarOutlined,
  TeamOutlined,
  CalendarOutlined,
  TrophyOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useAcademicContext } from '../components/AcademicYearSemesterSelector';
import api from '../services/api';

const { Title, Text } = Typography;

interface DashboardStats {
  totalTeachers: number;
  totalSubjects: number;
  totalClasses: number;
  totalAssignments: number;
  completedAssignments: number;
  pendingAssignments: number;
  totalStudents: number;
  averageClassSize: number;
}

interface RecentActivity {
  id: string;
  type: 'assignment' | 'class' | 'salary';
  title: string;
  description: string;
  time: string;
  status: 'success' | 'warning' | 'info';
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalTeachers: 0,
    totalSubjects: 0,
    totalClasses: 0,
    totalAssignments: 0,
    completedAssignments: 0,
    pendingAssignments: 0,
    totalStudents: 0,
    averageClassSize: 0
  });
  
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { selectedAcademicYear, selectedSemester, isDataSelected, getDisplayText } = useAcademicContext();

  const fetchDashboardData = async () => {
    if (!isDataSelected()) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch data with semester filter
      const [teachersRes, classesRes, assignmentsRes] = await Promise.all([
        api.get('/teachers'),
        api.get(`/classes?semesterId=${selectedSemester?._id}`),
        api.get(`/teaching-assignments?semesterId=${selectedSemester?._id}`)
      ]);

      const teachers = Array.isArray(teachersRes.data?.data) ? teachersRes.data.data : [];
      const classes = Array.isArray(classesRes.data?.data) ? classesRes.data.data : [];
      const assignments = Array.isArray(assignmentsRes.data?.data) ? assignmentsRes.data.data : [];

      // Calculate statistics
      const totalStudents = classes.reduce((sum: number, cls: any) => sum + (cls.studentCount || 0), 0);
      const completedAssignments = assignments.filter((a: any) => a.status === 'completed').length;
      const pendingAssignments = assignments.filter((a: any) => a.status === 'assigned' || a.status === 'in_progress').length;

      setStats({
        totalTeachers: teachers.length,
        totalSubjects: new Set(classes.map((cls: any) => cls.subjectId?._id || cls.subjectId)).size,
        totalClasses: classes.length,
        totalAssignments: assignments.length,
        completedAssignments,
        pendingAssignments,
        totalStudents,
        averageClassSize: classes.length > 0 ? Math.round(totalStudents / classes.length) : 0
      });

      // Generate recent activities
      const activities: RecentActivity[] = [
        {
          id: '1',
          type: 'assignment',
          title: `${assignments.length} phân công giảng dạy`,
          description: `Trong kỳ ${selectedSemester?.displayName}`,
          time: 'Hôm nay',
          status: 'info'
        },
        {
          id: '2',
          type: 'class',
          title: `${classes.length} lớp học phần`,
          description: `Đang hoạt động trong kỳ này`,
          time: 'Hôm nay',
          status: 'success'
        },
        {
          id: '3',
          type: 'salary',
          title: `${completedAssignments}/${assignments.length} phân công hoàn thành`,
          description: 'Tiến độ giảng dạy trong kỳ',
          time: 'Cập nhật gần nhất',
          status: completedAssignments === assignments.length ? 'success' : 'warning'
        }
      ];

      setRecentActivities(activities);

    } catch (err: any) {
      setError('Không thể tải dữ liệu dashboard');
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedAcademicYear, selectedSemester]);

  // Render warning if no academic year/semester selected
  if (!isDataSelected()) {
    return (
      <div style={{ padding: '24px' }}>
        <Title level={2} style={{ marginBottom: 24 }}>
          <BarChartOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          Dashboard Hệ thống Payroll Giảng viên
        </Title>
        
        <Alert
          message="Chào mừng đến với hệ thống quản lý payroll giảng viên!"
          description={
            <div>
              <p>Để xem thống kê và quản lý dữ liệu, vui lòng chọn <strong>Năm học</strong> và <strong>Kỳ học</strong> cụ thể.</p>
              <p>👆 Nhấn vào nút <strong>"Chọn Năm học - Kỳ học"</strong> ở góc trên bên phải để bắt đầu.</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic
                title="Chức năng"
                value="Quản lý Giảng viên"
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic
                title="Chức năng"
                value="Quản lý Lớp học"
                prefix={<BookOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic
                title="Chức năng"
                value="Tính lương"
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Card>
              <Statistic
                title="Chức năng"
                value="Báo cáo"
                prefix={<BarChartOutlined />}
                valueStyle={{ color: '#fa541c' }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Lỗi tải dữ liệu"
          description={error}
          type="error"
          showIcon
          action={
            <Button onClick={fetchDashboardData} type="primary" size="small">
              Thử lại
            </Button>
          }
        />
      </div>
    );
  }

  const completionRate = stats.totalAssignments > 0 
    ? Math.round((stats.completedAssignments / stats.totalAssignments) * 100)
    : 0;

  return (
    <Spin spinning={loading}>
      <div style={{ padding: '24px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div>
            <Title level={2} style={{ marginBottom: 8 }}>
              <BarChartOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              Dashboard Hệ thống Payroll Giảng viên
            </Title>
            <Space>
              <CalendarOutlined style={{ color: '#52c41a' }} />
              <Text strong>{getDisplayText()}</Text>
            </Space>
          </div>

          {/* Main Statistics */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card>
                <Statistic
                  title="Tổng số giảng viên"
                  value={stats.totalTeachers}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card>
                <Statistic
                  title="Học phần đang mở"
                  value={stats.totalSubjects}
                  prefix={<BookOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card>
                <Statistic
                  title="Lớp học phần"
                  value={stats.totalClasses}
                  prefix={<ScheduleOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Card>
                <Statistic
                  title="Phân công giảng dạy"
                  value={stats.totalAssignments}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#fa541c' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Secondary Statistics */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Tổng sinh viên"
                  value={stats.totalStudents}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#13c2c2' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Sĩ số TB/lớp"
                  value={stats.averageClassSize}
                  prefix={<TeamOutlined />}
                  suffix="sv"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Hoàn thành"
                  value={stats.completedAssignments}
                  suffix={`/${stats.totalAssignments}`}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Đang thực hiện"
                  value={stats.pendingAssignments}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Progress and Activities */}
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title={<><TrophyOutlined /> Tiến độ giảng dạy</>}>
                <div style={{ padding: '16px 0' }}>
                  <Text>Tỷ lệ hoàn thành phân công giảng dạy</Text>
                  <Progress
                    percent={completionRate}
                    status={completionRate === 100 ? 'success' : 'active'}
                    strokeColor={completionRate === 100 ? '#52c41a' : '#1890ff'}
                    style={{ marginTop: 8 }}
                  />
                  <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">
                      {stats.completedAssignments} hoàn thành
                    </Text>
                    <Text type="secondary">
                      {stats.pendingAssignments} đang thực hiện
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card title={<><ClockCircleOutlined /> Hoạt động gần đây</>}>
                <List
                  dataSource={recentActivities}
                  renderItem={(activity) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            style={{
                              backgroundColor: 
                                activity.status === 'success' ? '#52c41a' :
                                activity.status === 'warning' ? '#faad14' : '#1890ff'
                            }}
                            icon={
                              activity.type === 'assignment' ? <UserOutlined /> :
                              activity.type === 'class' ? <BookOutlined /> : <DollarOutlined />
                            }
                          />
                        }
                        title={activity.title}
                        description={
                          <Space direction="vertical" size={4}>
                            <Text type="secondary">{activity.description}</Text>
                            <Tag color={activity.status === 'success' ? 'green' : activity.status === 'warning' ? 'orange' : 'blue'}>
                              {activity.time}
                            </Tag>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </Space>
      </div>
    </Spin>
  );
};

export default Dashboard; 
