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
  DatePicker,
  message,
  Spin,
  Empty,
  Tag,
  Tooltip
} from 'antd';
import {
  FileTextOutlined,
  DownloadOutlined,
  BarChartOutlined,
  BookOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { useAcademicContext } from '../components/AcademicYearSemesterSelector';
import AcademicGuard from '../components/AcademicGuard';
import api, { classAPI } from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

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
  code: string;
  startDate: string;
  endDate: string;
  status: string;
  academicYearId: string;
}

interface Subject {
  _id: string;
  code: string;
  name: string;
  credits: number;
  departmentId: {
    _id: string;
    name: string;
    code: string;
  };
}

interface ClassStatistic {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  subjectCredits: number;
  departmentName: string;
  classCount: number;
  totalStudents: number;
  averageStudentsPerClass: number;
  classes: Array<{
    _id: string;
    code: string;
    name: string;
    studentCount: number;
    semesterName: string;
    status: string;
  }>;
}

const ClassStatistics: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<ClassStatistic[]>([]);
  const [showChart, setShowChart] = useState(false);

  // Academic context - automatically uses selected academic year/semester
  const { selectedAcademicYear, selectedSemester, isDataSelected } = useAcademicContext();

  // Fetch statistics when academic context changes
  useEffect(() => {
    if (selectedAcademicYear) {
      fetchStatistics();
    }
  }, [selectedAcademicYear]);

  const fetchStatistics = async () => {
    if (!selectedAcademicYear) return;

    try {
      setLoading(true);
      
      // Build query parameters
      const params: any = { 
        academicYearId: selectedAcademicYear._id
      };

      // Fetch classes for statistics
      const response = await classAPI.getAll(params);
      const data = response.data || [];
      
      console.log('Classes data:', data); // Debug log
      
      // Process statistics
      const processedStats = await processClassStatistics(data);
      setStatistics(processedStats);
      
    } catch (error) {
      console.error('Error fetching statistics:', error);
      message.error('Lỗi khi tải thống kê');
      setStatistics([]);
    } finally {
      setLoading(false);
    }
  };

  const processClassStatistics = async (classes: any[]): Promise<ClassStatistic[]> => {
    if (!classes || classes.length === 0) {
      console.log('No classes data found');
      return [];
    }
    
    // Group classes by subject
    const subjectMap = new Map<string, ClassStatistic>();

    for (const classItem of classes) {
      if (!classItem || !classItem.subjectId) {
        console.warn('Invalid class item:', classItem);
        continue;
      }
      
      const subjectId = classItem.subjectId?._id || classItem.subjectId;
      const subjectCode = classItem.subjectId?.code || 'N/A';
      const subjectName = classItem.subjectId?.name || 'N/A';
      const subjectCredits = classItem.subjectId?.credits || 0;
      const departmentName = classItem.subjectId?.departmentId?.name || 'N/A';

      if (subjectMap.has(subjectId)) {
        const existing = subjectMap.get(subjectId)!;
        existing.classCount++;
        existing.totalStudents += classItem.studentCount || 0;
        existing.classes.push({
          _id: classItem._id,
          code: classItem.code,
          name: classItem.name,
          studentCount: classItem.studentCount || 0,
          semesterName: 'N/A',
          status: classItem.status || 'active'
        });
      } else {
        subjectMap.set(subjectId, {
          subjectId,
          subjectCode,
          subjectName,
          subjectCredits,
          departmentName,
          classCount: 1,
          totalStudents: classItem.studentCount || 0,
          averageStudentsPerClass: 0,
          classes: [{
            _id: classItem._id,
            code: classItem.code,
            name: classItem.name,
            studentCount: classItem.studentCount || 0,
            semesterName: 'N/A',
            status: classItem.status || 'active'
          }]
        });
      }
    }

    // Calculate averages
    const result = Array.from(subjectMap.values()).map(stat => ({
      ...stat,
      averageStudentsPerClass: stat.classCount > 0 ? Math.round(stat.totalStudents / stat.classCount) : 0
    }));

    // Sort by class count descending
    return result.sort((a, b) => b.classCount - a.classCount);
  };

  const handleExportExcel = async () => {
    try {
      message.success('Tính năng xuất Excel sẽ được triển khai trong phiên bản tới');
    } catch (error) {
      message.error('Lỗi khi xuất Excel');
    }
  };

  // Table columns
  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'Mã học phần',
      dataIndex: 'subjectCode',
      key: 'subjectCode',
      width: 120,
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: 'Tên học phần',
      dataIndex: 'subjectName',
      key: 'subjectName',
      ellipsis: true,
      render: (name: string, record: ClassStatistic) => (
        <Tooltip title={name}>
          <div>
            <div>{name}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.subjectCredits} tín chỉ • {record.departmentName}
            </Text>
          </div>
        </Tooltip>
      ),
    },
    {
      title: 'Khoa/Bộ môn',
      dataIndex: 'departmentName',
      key: 'departmentName',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Số lớp đã mở',
      dataIndex: 'classCount',
      key: 'classCount',
      width: 120,
      align: 'center' as const,
      render: (count: number) => <Tag color="green">{count}</Tag>,
      sorter: (a: ClassStatistic, b: ClassStatistic) => a.classCount - b.classCount,
    },
    {
      title: 'Tổng sinh viên',
      dataIndex: 'totalStudents',
      key: 'totalStudents',
      width: 120,
      align: 'center' as const,
      render: (total: number) => <Statistic value={total} valueStyle={{ fontSize: '14px' }} />,
      sorter: (a: ClassStatistic, b: ClassStatistic) => a.totalStudents - b.totalStudents,
    },
    {
      title: 'TB SV/lớp',
      dataIndex: 'averageStudentsPerClass',
      key: 'averageStudentsPerClass',
      width: 100,
      align: 'center' as const,
      render: (avg: number) => <Tag color="orange">{avg}</Tag>,
      sorter: (a: ClassStatistic, b: ClassStatistic) => a.averageStudentsPerClass - b.averageStudentsPerClass,
    },
    {
      title: 'Chi tiết lớp',
      key: 'classes',
      width: 120,
      render: (record: ClassStatistic) => (
        <Tooltip title={`Xem ${record.classCount} lớp`}>
          <Button type="link" size="small" onClick={() => showClassDetails(record)}>
            Xem chi tiết
          </Button>
        </Tooltip>
      ),
    },
  ];

  const showClassDetails = (record: ClassStatistic) => {
    // Show modal with class details
    message.info(`Chi tiết ${record.classCount} lớp của học phần ${record.subjectName}`);
  };

  // Chart data
  const chartData = statistics.slice(0, 10).map(stat => ({
    subject: stat.subjectCode,
    count: stat.classCount,
    name: stat.subjectName
  }));

  // Summary statistics
  const totalSubjects = statistics.length;
  const totalClasses = statistics.reduce((sum, stat) => sum + stat.classCount, 0);
  const totalStudents = statistics.reduce((sum, stat) => sum + stat.totalStudents, 0);
  const averageClassesPerSubject = totalSubjects > 0 ? Math.round(totalClasses / totalSubjects) : 0;

  return (
    <AcademicGuard
      title="Thống kê Lớp học phần"
      icon={<FileTextOutlined style={{ marginRight: '8px', color: '#1890ff' }} />}
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
        Tra cứu và thống kê số lượng lớp học phần đã mở cho từng học phần
      </Text>
      
      {/* Action Bar */}
      <Card style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Typography.Title level={4} style={{ margin: 0 }}>
              📊 Thống kê chi tiết
            </Typography.Title>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<BarChartOutlined />}
                onClick={() => setShowChart(!showChart)}
              >
                {showChart ? 'Ẩn biểu đồ' : 'Hiện biểu đồ'}
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExportExcel}
              >
                Xuất Excel
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Summary Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Tổng số học phần"
              value={totalSubjects}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Tổng số lớp"
              value={totalClasses}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Tổng sinh viên"
              value={totalStudents}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="TB lớp/học phần"
              value={averageClassesPerSubject}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Chart */}
      {showChart && chartData.length > 0 && (
        <Card title="Top 10 học phần có nhiều lớp nhất" style={{ marginBottom: '24px' }}>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <Text type="secondary">Biểu đồ sẽ được triển khai trong phiên bản tới</Text>
            <br />
            <Text type="secondary">Hiện tại bạn có thể xem thống kê dưới dạng bảng</Text>
          </div>
        </Card>
      )}

      {/* Statistics Table */}
      <Card title={`Thống kê chi tiết (${statistics.length} học phần)`}>
        <Spin spinning={loading}>
          {statistics.length > 0 ? (
            <Table
              columns={columns}
              dataSource={statistics}
              rowKey="subjectId"
              pagination={{
                total: statistics.length,
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} của ${total} học phần`,
              }}
              scroll={{ x: 1000 }}
              size="middle"
            />
          ) : (
            <Empty
              description="Không có dữ liệu thống kê"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </Spin>
      </Card>
    </AcademicGuard>
  );
};

export default ClassStatistics; 
 