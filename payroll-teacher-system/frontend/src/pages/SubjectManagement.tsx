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
  Spin
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { subjectAPI, departmentAPI } from '../services/api';
import { Subject, Department } from '../types';

const { Title } = Typography;
const { Option } = Select;

const SubjectManagement: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [statistics, setStatistics] = useState({
    total: 0,
    averageCredits: 0,
    averageCoefficient: 0,
    averagePeriods: 0
  });

  useEffect(() => {
    fetchSubjects();
    fetchDepartments();
    fetchStatistics();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await subjectAPI.getAll();
      setSubjects(response.data || []);
    } catch (error) {
      message.error('Không thể tải danh sách học phần');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentAPI.getAll();
      setDepartments(response.data || []);
    } catch (error) {
      
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await subjectAPI.getAll();
      const data = response.data || [];
      const avgCredits = data.length > 0 
        ? data.reduce((sum, subject) => sum + subject.credits, 0) / data.length 
        : 0;
      const avgCoefficient = data.length > 0 
        ? data.reduce((sum, subject) => sum + subject.coefficient, 0) / data.length 
        : 0;
      const avgPeriods = data.length > 0 
        ? data.reduce((sum, subject) => sum + (subject.soTietLyThuyet + subject.soTietThucHanh), 0) / data.length 
        : 0;
        
      setStatistics({
        total: data.length,
        averageCredits: parseFloat(avgCredits.toFixed(1)),
        averageCoefficient: parseFloat(avgCoefficient.toFixed(1)),
        averagePeriods: parseFloat(avgPeriods.toFixed(0))
      });
    } catch (error) {
      
    }
  };

  const handleCreate = () => {
    setEditingSubject(null);
    setModalVisible(true);
    form.resetFields();
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setModalVisible(true);
    form.setFieldsValue({
      ...subject,
      departmentId: typeof subject.departmentId === 'object' ? subject.departmentId._id : subject.departmentId
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await subjectAPI.delete(id);
      message.success('Xóa học phần thành công');
      fetchSubjects();
      fetchStatistics();
    } catch (error) {
      message.error('Không thể xóa học phần');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      // Validate total teaching hours
      const totalHours = (values.soTietLyThuyet || 0) + (values.soTietThucHanh || 0);
      if (totalHours < 1) {
        message.error('Tổng số tiết phải >= 1');
        return;
      }

      if (editingSubject) {
        await subjectAPI.update(editingSubject._id, values);
        message.success('Cập nhật học phần thành công');
      } else {
        await subjectAPI.create(values);
        message.success('Thêm học phần thành công');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingSubject(null);
      fetchSubjects();
      fetchStatistics();
    } catch (error) {
      message.error(editingSubject ? 'Không thể cập nhật học phần' : 'Không thể thêm học phần');
    }
  };

  const columns = [
    {
      title: 'Mã học phần',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: Subject) =>
        record.code.toLowerCase().includes(value.toLowerCase()) ||
        record.name.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: 'Tên học phần',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'Số tín chỉ',
      dataIndex: 'credits',
      key: 'credits',
      width: 100,
      render: (credits: number) => (
        <Tag color="blue">{credits}</Tag>
      ),
      sorter: (a: Subject, b: Subject) => a.credits - b.credits,
    },
    {
      title: 'Hệ số',
      dataIndex: 'coefficient',
      key: 'coefficient',
      width: 80,
      render: (coefficient: number) => (
        <Tag color="green">{coefficient}</Tag>
      ),
      sorter: (a: Subject, b: Subject) => a.coefficient - b.coefficient,
    },
    {
      title: 'Tiết LT',
      dataIndex: 'soTietLyThuyet',
      key: 'soTietLyThuyet',
      width: 80,
      render: (soTietLyThuyet: number) => (
        <Tag color="orange">{soTietLyThuyet}</Tag>
      ),
      sorter: (a: Subject, b: Subject) => a.soTietLyThuyet - b.soTietLyThuyet,
    },
    {
      title: 'Tiết TH',
      dataIndex: 'soTietThucHanh',
      key: 'soTietThucHanh',
      width: 80,
      render: (soTietThucHanh: number) => (
        <Tag color="purple">{soTietThucHanh}</Tag>
      ),
      sorter: (a: Subject, b: Subject) => a.soTietThucHanh - b.soTietThucHanh,
    },
    {
      title: 'Tổng tiết',
      key: 'totalPeriods',
      width: 100,
      render: (record: Subject) => {
        const total = record.soTietLyThuyet + record.soTietThucHanh;
        return <Tag color="red">{total}</Tag>;
      },
      sorter: (a: Subject, b: Subject) => 
        (a.soTietLyThuyet + a.soTietThucHanh) - (b.soTietLyThuyet + b.soTietThucHanh),
    },
    {
      title: 'Khoa/Bộ môn',
      dataIndex: 'departmentId',
      key: 'department',
      width: 150,
      render: (department: any) => 
        typeof department === 'object' ? department.name : 'N/A'
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 150,
      render: (_: any, record: Subject) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa học phần này?"
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

  const filteredData = subjects.filter(subject =>
    subject.code.toLowerCase().includes(searchText.toLowerCase()) ||
    subject.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <Title level={2}>
        <BookOutlined /> Học phần
      </Title>
      
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng số học phần"
              value={statistics.total}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tín chỉ trung bình"
              value={statistics.averageCredits}
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
              precision={1}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tiết trung bình/môn"
              value={statistics.averagePeriods}
              precision={0}
              valueStyle={{ color: '#722ed1' }}
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
                Thêm học phần
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchSubjects}
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
            scroll={{ x: 1200 }}
          />
        </Spin>
      </Card>

      {/* Modal Form */}
      <Modal
        title={editingSubject ? 'Chỉnh sửa học phần' : 'Thêm học phần mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
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
                label="Mã học phần"
                rules={[
                  { required: true, message: 'Vui lòng nhập mã học phần!' },
                  { max: 20, message: 'Mã học phần không được quá 20 ký tự!' }
                ]}
              >
                <Input placeholder="Nhập mã học phần" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="credits"
                label="Số tín chỉ"
                rules={[
                  { required: true, message: 'Vui lòng nhập số tín chỉ!' },
                  { type: 'number', min: 1, max: 10, message: 'Số tín chỉ phải từ 1 đến 10!' }
                ]}
              >
                <InputNumber
                  placeholder="Nhập số tín chỉ"
                  min={1}
                  max={10}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="name"
            label="Tên học phần"
            rules={[
              { required: true, message: 'Vui lòng nhập tên học phần!' },
              { max: 200, message: 'Tên học phần không được quá 200 ký tự!' }
            ]}
          >
            <Input placeholder="Nhập tên học phần" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="coefficient"
                label="Hệ số"
                rules={[
                  { required: true, message: 'Vui lòng nhập hệ số!' },
                  { type: 'number', min: 0.5, max: 3.0, message: 'Hệ số phải từ 0.5 đến 3.0!' }
                ]}
              >
                <InputNumber
                  placeholder="Nhập hệ số"
                  min={0.5}
                  max={3.0}
                  step={0.1}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="soTietLyThuyet"
                label="Số tiết lý thuyết"
                rules={[
                  { required: true, message: 'Vui lòng nhập số tiết lý thuyết!' },
                  { type: 'number', min: 0, max: 150, message: 'Số tiết lý thuyết phải từ 0 đến 150!' }
                ]}
              >
                <InputNumber
                  placeholder="Nhập số tiết LT"
                  min={0}
                  max={150}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="soTietThucHanh"
                label="Số tiết thực hành"
                rules={[
                  { required: true, message: 'Vui lòng nhập số tiết thực hành!' },
                  { type: 'number', min: 0, max: 150, message: 'Số tiết thực hành phải từ 0 đến 150!' }
                ]}
              >
                <InputNumber
                  placeholder="Nhập số tiết TH"
                  min={0}
                  max={150}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="departmentId"
                label="Khoa/Bộ môn"
                rules={[{ required: true, message: 'Vui lòng chọn khoa/bộ môn!' }]}
              >
                <Select placeholder="Chọn khoa/bộ môn">
                  {departments.map(dept => (
                    <Option key={dept._id} value={dept._id}>
                      {dept.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea
              placeholder="Nhập mô tả về học phần"
              rows={4}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SubjectManagement; 
