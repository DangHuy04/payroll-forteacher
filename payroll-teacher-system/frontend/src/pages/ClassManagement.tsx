import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Card,
  Typography,
  message,
  Tag,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Spin,
  TimePicker,
  Alert
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ScheduleOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { classAPI, subjectAPI } from '../services/api';
import { Class, Subject } from '../types';
import { useAcademicContext } from '../components/AcademicYearSemesterSelector';
import { useClasses } from '../hooks/useAcademicData';
import AcademicGuard from '../components/AcademicGuard';
import moment from 'moment';

const { Title } = Typography;
const { Option } = Select;

interface ClassFormData {
  code: string;
    name: string;
  subjectId: string;
  studentCount: number;
  maxStudents: number;
  schedule: {
    dayOfWeek: number;
    startPeriod: number;
    periodsCount: number;
    room?: string;
  };
  classType: 'theory' | 'practice' | 'lab' | 'seminar' | 'online';
  teachingMethod: 'offline' | 'online' | 'hybrid';
  description?: string;
  notes?: string;
}

const ClassManagement: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [viewingClass, setViewingClass] = useState<Class | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [statistics, setStatistics] = useState({
    total: 0,
    averageStudents: 0,
    averageCoefficient: 0,
    totalTeachingHours: 0
  });

  // Academic context
  const { selectedAcademicYear, selectedSemester, isDataSelected } = useAcademicContext();
  
  // Use hooks for automatic data fetching
  const { data: classes, loading, error: classError, refetch: refetchClasses } = useClasses();

  useEffect(() => {
    if (isDataSelected()) {
      fetchSubjects();
      fetchStatistics();
    }
  }, [selectedAcademicYear, selectedSemester]);

  // Update statistics when classes change
  useEffect(() => {
    fetchStatistics();
  }, [classes]);

  const fetchSubjects = async () => {
    try {
      const response = await subjectAPI.getAll();
      setSubjects(response.data || []);
    } catch (error) {
      
    }
  };

  const fetchStatistics = async () => {
    try {
      const data = classes || [];
      const avgStudents = data.length > 0 
        ? data.reduce((sum, cls) => sum + cls.studentCount, 0) / data.length 
        : 0;
      const avgCoefficient = data.length > 0 
        ? data.reduce((sum, cls) => sum + cls.classCoefficient, 0) / data.length 
        : 0;
      const totalTeachingHours = data.reduce((sum, cls) => sum + (cls.metadata?.totalTeachingHours || 0), 0);
        
      setStatistics({
        total: data.length,
        averageStudents: parseFloat(avgStudents.toFixed(1)),
        averageCoefficient: parseFloat(avgCoefficient.toFixed(2)),
        totalTeachingHours: parseFloat(totalTeachingHours.toFixed(1))
      });
    } catch (error) {
      
    }
  };

  const handleCreate = () => {
    setEditingClass(null);
    setModalVisible(true);
    form.resetFields();
  };

  const handleEdit = (classItem: Class) => {
    setEditingClass(classItem);
    setModalVisible(true);
    form.setFieldsValue({
      ...classItem,
      subjectId: typeof classItem.subjectId === 'object' ? classItem.subjectId._id : classItem.subjectId
    });
  };

  const handleView = (classItem: Class) => {
    setViewingClass(classItem);
    setViewModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await classAPI.delete(id);
      message.success('Xóa lớp học phần thành công');
      refetchClasses();
      fetchStatistics();
    } catch (error) {
      message.error('Không thể xóa lớp học phần');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingClass) {
        await classAPI.update(editingClass._id, values);
        message.success('Cập nhật lớp học phần thành công');
    } else {
        await classAPI.create(values);
        message.success('Thêm lớp học phần thành công');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingClass(null);
      refetchClasses();
      fetchStatistics();
    } catch (error) {
      message.error(editingClass ? 'Không thể cập nhật lớp học phần' : 'Không thể thêm lớp học phần');
    }
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['', '', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Chủ nhật'];
    return days[dayOfWeek] || 'N/A';
  };

  const getClassTypeColor = (classType: string) => {
    const typeColors: { [key: string]: string } = {
      'theory': 'blue',
      'practice': 'green',
      'lab': 'orange',
      'seminar': 'purple',
      'online': 'cyan'
    };
    return typeColors[classType] || 'default';
  };

  const getClassTypeText = (classType: string) => {
    const typeTexts: { [key: string]: string } = {
      'theory': 'Lý thuyết',
      'practice': 'Thực hành',
      'lab': 'Phòng thí nghiệm',
      'seminar': 'Seminar',
      'online': 'Trực tuyến'
    };
    return typeTexts[classType] || classType;
  };

  const getTeachingMethodText = (method: string) => {
    const methodTexts: { [key: string]: string } = {
      'offline': 'Trực tiếp',
      'online': 'Trực tuyến',
      'hybrid': 'Kết hợp'
    };
    return methodTexts[method] || method;
  };

  const getCoefficientColor = (coefficient: number) => {
    if (coefficient <= 1.0) return 'green';
    if (coefficient <= 1.2) return 'orange';
    if (coefficient <= 1.3) return 'red';
    return 'purple';
  };

  const columns = [
    {
      title: 'Mã lớp',
      dataIndex: 'code',
      key: 'code',
      width: 100,
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: Class) =>
        record.code.toLowerCase().includes(value.toLowerCase()) ||
        record.name.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: 'Tên lớp',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: 'Học phần',
      dataIndex: 'subjectId',
      key: 'subject',
      width: 150,
      render: (subject: any) => 
        typeof subject === 'object' ? subject.name : 'N/A'
    },
    {
      title: 'Sĩ số',
      dataIndex: 'studentCount',
      key: 'studentCount',
      width: 100,
      render: (_: any, record: Class) => (
        <span>
          {record.studentCount}/{record.maxStudents}
        </span>
      ),
      sorter: (a: Class, b: Class) => a.studentCount - b.studentCount,
    },
    {
      title: 'Hệ số lớp',
      dataIndex: 'classCoefficient',
      key: 'classCoefficient',
      width: 100,
      render: (coefficient: number) => (
        <Tag color={getCoefficientColor(coefficient)}>
          {coefficient}
        </Tag>
      ),
      sorter: (a: Class, b: Class) => a.classCoefficient - b.classCoefficient,
    },
    {
      title: 'Lịch học',
      dataIndex: 'schedule',
      key: 'schedule',
      width: 150,
      render: (schedule: any) => {
        if (!schedule || !schedule.dayOfWeek) return 'Chưa xếp lịch';
        return (
          <div>
            <div>{getDayName(schedule.dayOfWeek)}</div>
            <div>Tiết {schedule.startPeriod} - {schedule.startPeriod + schedule.periodsCount - 1}</div>
            <div>Phòng: {schedule.room || 'N/A'}</div>
          </div>
        );
      },
    },
    {
      title: 'Loại lớp',
      dataIndex: 'classType',
      key: 'classType',
      width: 120,
      render: (classType: string) => (
        <Tag color={getClassTypeColor(classType)}>
          {getClassTypeText(classType)}
        </Tag>
      ),
    },
    {
      title: 'Phương pháp giảng dạy',
      dataIndex: 'teachingMethod',
      key: 'teachingMethod',
      width: 120,
      render: (method: string) => (
        <Tag color={getClassTypeColor(method)}>
          {getTeachingMethodText(method)}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 200,
      render: (_: any, record: Class) => (
        <Space size="middle">
          <Button
            type="primary"
            ghost
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleView(record)}
          >
            Xem
          </Button>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa lớp học này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Có"
            cancelText="Không"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredData = classes.filter(cls =>
    cls.code.toLowerCase().includes(searchText.toLowerCase()) ||
    cls.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <AcademicGuard 
      title="Quản lý Lớp học phần"
      icon={<ScheduleOutlined style={{ marginRight: '8px', color: '#1890ff' }} />}
    >
      
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng số lớp"
              value={statistics.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Sĩ số trung bình"
              value={statistics.averageStudents}
              precision={1}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Hệ số trung bình"
              value={statistics.averageCoefficient}
              precision={2}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng giờ giảng"
              value={statistics.totalTeachingHours}
              precision={1}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Actions */}
      <Card>
        <Row justify="space-between" style={{ marginBottom: 16 }}>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Thêm lớp học
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={refetchClasses}
                loading={loading}
              >
                Làm mới
              </Button>
            </Space>
          </Col>
          <Col>
            <Input
              placeholder="Tìm kiếm theo mã hoặc tên..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
            />
          </Col>
        </Row>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="_id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} mục`,
            }}
            scroll={{ x: 1400 }}
          />
        </Spin>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingClass ? 'Chỉnh sửa lớp học' : 'Thêm lớp học mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="Mã lớp học"
                rules={[
                  { required: true, message: 'Vui lòng nhập mã lớp học!' },
                  { max: 20, message: 'Mã lớp học không được quá 20 ký tự!' }
                ]}
              >
                <Input placeholder="Nhập mã lớp học" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maxStudents"
                label="Sĩ số tối đa"
                rules={[
                  { required: true, message: 'Vui lòng nhập sĩ số tối đa!' },
                  { type: 'number', min: 5, max: 200, message: 'Sĩ số tối đa phải từ 5 đến 200!' }
                ]}
              >
                <InputNumber
                  placeholder="Nhập sĩ số tối đa"
                  min={5}
                  max={200}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="name"
            label="Tên lớp học"
            rules={[
              { required: true, message: 'Vui lòng nhập tên lớp học!' },
              { max: 200, message: 'Tên lớp học không được quá 200 ký tự!' }
            ]}
          >
            <Input placeholder="Nhập tên lớp học" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="subjectId"
                label="Học phần"
                rules={[{ required: true, message: 'Vui lòng chọn học phần!' }]}
              >
                <Select placeholder="Chọn học phần">
                  {subjects.map(subject => (
                    <Option key={subject._id} value={subject._id}>
                      {subject.code} - {subject.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="studentCount"
                label="Sĩ số"
                rules={[
                  { required: true, message: 'Vui lòng nhập sĩ số!' },
                  { type: 'number', min: 1, max: 200, message: 'Sĩ số phải từ 1 đến 200!' }
                ]}
              >
                <InputNumber
                  placeholder="Nhập sĩ số"
                  min={1}
                  max={200}
                  style={{ width: '100%' }}
                  onChange={(value) => {
                    // Calculate and display class coefficient
                    if (value) {
                      let coefficient = 1.0;
                      if (value <= 30) coefficient = 1.0;
                      else if (value <= 50) coefficient = 1.1;
                      else if (value <= 70) coefficient = 1.2;
                      else if (value <= 100) coefficient = 1.3;
                      else coefficient = 1.4;
                      
                      form.setFieldsValue({ classCoefficient: coefficient });
                    }
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="classCoefficient"
                label="Hệ số lớp"
              >
                <InputNumber
                  placeholder="Tự động tính"
                  min={1.0}
                  max={1.4}
                  step={0.1}
                  style={{ width: '100%' }}
                  disabled
                  formatter={(value) => `${value || 0} (${(value || 0) <= 1.0 ? 'Bình thường' : (value || 0) <= 1.2 ? 'Trung bình' : (value || 0) <= 1.3 ? 'Cao' : 'Rất cao'})`}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maxStudents"
                label="Sĩ số tối đa"
                rules={[
                  { required: true, message: 'Vui lòng nhập sĩ số tối đa!' },
                  { type: 'number', min: 5, max: 200, message: 'Sĩ số tối đa phải từ 5 đến 200!' }
                ]}
              >
                <InputNumber
                  placeholder="Nhập sĩ số tối đa"
                  min={5}
                  max={200}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name={['schedule', 'dayOfWeek']}
                label="Thứ"
                rules={[{ required: true, message: 'Vui lòng chọn thứ!' }]}
              >
                <Select placeholder="Chọn thứ">
                  <Option value={2}>Thứ 2</Option>
                  <Option value={3}>Thứ 3</Option>
                  <Option value={4}>Thứ 4</Option>
                  <Option value={5}>Thứ 5</Option>
                  <Option value={6}>Thứ 6</Option>
                  <Option value={7}>Chủ nhật</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name={['schedule', 'startPeriod']}
                label="Tiết bắt đầu"
                rules={[
                  { required: true, message: 'Vui lòng nhập tiết bắt đầu!' },
                  { type: 'number', min: 1, max: 12, message: 'Tiết bắt đầu phải từ 1 đến 12!' }
                ]}
              >
                <InputNumber
                  placeholder="Tiết bắt đầu"
                  min={1}
                  max={12}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name={['schedule', 'periodsCount']}
                label="Số tiết"
                rules={[
                  { required: true, message: 'Vui lòng nhập số tiết!' },
                  { type: 'number', min: 1, max: 6, message: 'Số tiết phải từ 1 đến 6!' }
                ]}
              >
                <InputNumber
                  placeholder="Số tiết"
                  min={1}
                  max={6}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name={['schedule', 'room']}
            label="Phòng học"
          >
            <Input placeholder="Nhập phòng học" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="classType"
                label="Loại lớp"
                rules={[
                  { required: true, message: 'Vui lòng chọn loại lớp!' }
                ]}
              >
                <Select placeholder="Chọn loại lớp">
                  <Option value="theory">Lý thuyết</Option>
                  <Option value="practice">Thực hành</Option>
                  <Option value="lab">Phòng thí nghiệm</Option>
                  <Option value="seminar">Seminar</Option>
                  <Option value="online">Trực tuyến</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="teachingMethod"
                label="Phương pháp giảng dạy"
                rules={[
                  { required: true, message: 'Vui lòng chọn phương pháp giảng dạy!' }
                ]}
              >
                <Select placeholder="Chọn phương pháp giảng dạy">
                  <Option value="offline">Trực tiếp</Option>
                  <Option value="online">Trực tuyến</Option>
                  <Option value="hybrid">Kết hợp</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea
              placeholder="Nhập mô tả về lớp học"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* View Modal */}
      <Modal
        title="Chi tiết lớp học"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={null}
        width={600}
      >
          {viewingClass && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <p><strong>Mã lớp:</strong> {viewingClass.code}</p>
                <p><strong>Tên lớp:</strong> {viewingClass.name}</p>
                <p><strong>Sĩ số:</strong> {viewingClass.studentCount}/{viewingClass.maxStudents}</p>
              </Col>
              <Col span={12}>
                <p><strong>Học phần:</strong> {typeof viewingClass.subjectId === 'object' ? viewingClass.subjectId.name : 'N/A'}</p>
                <p><strong>Loại lớp:</strong> <Tag color={getClassTypeColor(viewingClass.classType)}>{getClassTypeText(viewingClass.classType)}</Tag></p>
                <p><strong>Phương pháp giảng dạy:</strong> <Tag color={getClassTypeColor(viewingClass.teachingMethod)}>{getTeachingMethodText(viewingClass.teachingMethod)}</Tag></p>
                <p><strong>Hệ số lớp:</strong> <Tag color={getCoefficientColor(viewingClass.classCoefficient)}>{viewingClass.classCoefficient}</Tag></p>
              </Col>
            </Row>
            
            <div style={{ marginTop: 16 }}>
              <Title level={5}>Lịch học:</Title>
              {viewingClass.schedule && (
                <div>
                  <div>{getDayName(viewingClass.schedule.dayOfWeek)}</div>
                  <div>Tiết {viewingClass.schedule.startPeriod} - {viewingClass.schedule.startPeriod + viewingClass.schedule.periodsCount - 1}</div>
                  <div>Phòng: {viewingClass.schedule.room || 'N/A'}</div>
                </div>
              )}
            </div>
            
            {viewingClass.description && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>Mô tả:</Title>
                <p>{viewingClass.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AcademicGuard>
  );
};

export default ClassManagement; 
