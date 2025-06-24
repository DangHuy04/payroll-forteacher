import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Card,
  Typography,
  message,
  Tag,
  Popconfirm,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { teacherAPI, departmentAPI, degreeAPI } from '../services/api';
import { Teacher, Department, Degree, TeacherFormData } from '../types';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const TeacherManagement: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [degrees, setDegrees] = useState<Degree[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [statistics, setStatistics] = useState({
    total: 0
  });

  useEffect(() => {
    fetchTeachers();
    fetchDepartments();
    fetchDegrees();
  }, []);

  useEffect(() => {
    updateStatistics();
  }, [teachers]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await teacherAPI.getAll();
      setTeachers(response.data || []);
    } catch (error) {
      message.error('Không thể tải danh sách giảng viên');
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

  const fetchDegrees = async () => {
    try {
      const response = await degreeAPI.getAll();
      setDegrees(response.data || []);
    } catch (error) {
      
    }
  };

  const updateStatistics = () => {
        setStatistics({
      total: teachers.length
        });
  };

  const handleCreate = () => {
    setEditingTeacher(null);
    setModalVisible(true);
    form.resetFields();
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setModalVisible(true);
    
    const formData = {
      code: teacher.code,
      fullName: teacher.fullName,
      email: teacher.email,
      phone: teacher.phone,
      departmentId: typeof teacher.departmentId === 'object' ? teacher.departmentId._id : teacher.departmentId,
      degreeId: typeof teacher.degreeId === 'object' ? teacher.degreeId._id : teacher.degreeId,
      position: teacher.position,
      gender: teacher.gender,
      birthDate: teacher.birthDate ? dayjs(teacher.birthDate) : null,
      hireDate: teacher.hireDate ? dayjs(teacher.hireDate) : null,
      address: teacher.address,
      identityNumber: teacher.identityNumber
    };
    
    form.setFieldsValue(formData);
  };

  const handleDelete = async (id: string) => {
    try {
      await teacherAPI.delete(id);
      message.success('Xóa giảng viên thành công');
      fetchTeachers();
    } catch (error) {
      message.error('Không thể xóa giảng viên');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const formattedValues: TeacherFormData = {
        ...values,
        birthDate: values.birthDate?.format('YYYY-MM-DD'),
        hireDate: values.hireDate?.format('YYYY-MM-DD'),
        isActive: true
      };

      console.log('Form values:', values);
      console.log('Formatted values:', formattedValues);
      console.log('Editing teacher:', editingTeacher);

      if (editingTeacher) {
        console.log('Calling update API with ID:', editingTeacher._id);
        await teacherAPI.update(editingTeacher._id, formattedValues);
        message.success('Cập nhật giảng viên thành công');
      } else {
        console.log('Calling create API');
        await teacherAPI.create(formattedValues);
        message.success('Thêm giảng viên thành công');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingTeacher(null);
      fetchTeachers();
    } catch (error: any) {
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      // Detailed error handling
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else if (error.response?.data?.errors) {
        const errorMsg = Array.isArray(error.response.data.errors) 
          ? error.response.data.errors.join(', ')
          : error.response.data.errors;
        message.error(errorMsg);
      } else if (error.response?.status === 400) {
        message.error('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.');
      } else if (error.response?.status === 404) {
        message.error('Không tìm thấy giảng viên.');
      } else if (error.response?.status === 500) {
        message.error('Lỗi server. Vui lòng thử lại sau.');
      } else {
      message.error(editingTeacher ? 'Không thể cập nhật giảng viên' : 'Không thể thêm giảng viên');
      }
    }
  };

  const columns = [
    {
      title: 'Mã GV',
      dataIndex: 'code',
      key: 'code',
      width: 100,
      fixed: 'left' as const,
    },
    {
      title: 'Họ và tên',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 180,
      fixed: 'left' as const,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
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
      title: 'Bằng cấp',
      dataIndex: 'degreeId',
      key: 'degree',
      width: 100,
      render: (degree: any) => 
        typeof degree === 'object' ? degree.name : 'N/A'
    },
    {
      title: 'Chức vụ',
      dataIndex: 'position',
      key: 'position',
      width: 150,
    },
    {
      title: 'Giới tính',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
    },

    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: Teacher) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa giảng viên này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Có"
            cancelText="Không"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredTeachers = teachers.filter(teacher =>
    teacher.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
    teacher.code.toLowerCase().includes(searchText.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <Title level={2}>
        <UserOutlined /> Giảng viên
      </Title>
      
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng số Giảng viên"
              value={statistics.total}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Thêm Giảng viên
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchTeachers}
          >
            Làm mới
          </Button>
          <Input.Search
            placeholder="Tìm kiếm theo tên, mã GV, email..."
            allowClear
            style={{ width: 300 }}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={filteredTeachers}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            total: filteredTeachers.length,
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} của ${total} giảng viên`
          }}
        />
      </Card>

      <Modal
        title={editingTeacher ? 'Cập nhật Giảng viên' : 'Thêm Giảng viên'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
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
                label="Mã Giảng viên"
                rules={[{ required: true, message: 'Vui lòng nhập mã giảng viên' }]}
              >
                <Input placeholder="GV001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="fullName"
                label="Họ và tên"
                rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
              >
                <Input placeholder="Nguyễn Văn A" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không đúng định dạng' }
                ]}
              >
                <Input placeholder="example@university.edu.vn" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
              >
                <Input placeholder="0987654321" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="departmentId"
                label="Khoa/Bộ môn"
                rules={[{ required: true, message: 'Vui lòng chọn khoa/bộ môn' }]}
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
            <Col span={12}>
              <Form.Item
                name="degreeId"
                label="Bằng cấp"
                rules={[{ required: true, message: 'Vui lòng chọn bằng cấp' }]}
              >
                <Select placeholder="Chọn bằng cấp">
                  {degrees.map(degree => (
                    <Option key={degree._id} value={degree._id}>
                      {degree.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="position"
                label="Chức vụ"
                rules={[{ required: true, message: 'Vui lòng chọn chức vụ' }]}
              >
                <Select placeholder="Chọn chức vụ">
                  <Option value="Trưởng bộ môn">Trưởng bộ môn</Option>
                  <Option value="Phó trưởng bộ môn">Phó trưởng bộ môn</Option>
                  <Option value="Giảng viên chính">Giảng viên chính</Option>
                  <Option value="Giảng viên">Giảng viên</Option>
                  <Option value="Trợ giảng">Trợ giảng</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="gender"
                label="Giới tính"
                rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}
              >
                <Select placeholder="Chọn giới tính">
                  <Option value="Nam">Nam</Option>
                  <Option value="Nữ">Nữ</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="birthDate"
                label="Ngày sinh"
                rules={[{ required: true, message: 'Vui lòng chọn ngày sinh' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày sinh"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="hireDate"
                label="Ngày vào làm"
                rules={[{ required: true, message: 'Vui lòng chọn ngày vào làm' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="DD/MM/YYYY"
                  placeholder="Chọn ngày vào làm"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="identityNumber"
                label="CCCD/CMND"
                rules={[{ required: true, message: 'Vui lòng nhập số CCCD/CMND' }]}
              >
                <Input placeholder="123456789" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="address" label="Địa chỉ">
                <Input placeholder="123 Đường ABC, Quận XYZ, TP HCM" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                {editingTeacher ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TeacherManagement; 
