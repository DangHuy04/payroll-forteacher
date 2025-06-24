import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Card,
  Typography,
  message,
  Tag,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Spin,
  Select
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
  SearchOutlined,
  ReloadOutlined,
  UserOutlined
} from '@ant-design/icons';
import { departmentAPI, teacherAPI } from '../services/api';
import { Department, Teacher } from '../types';

const { Title } = Typography;
const { Option } = Select;

const DepartmentManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [statistics, setStatistics] = useState({
    total: 0
  });

  useEffect(() => {
    fetchDepartments();
    fetchStatistics();
    fetchTeachers();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await departmentAPI.getAll();
      setDepartments(response.data || []);
    } catch (error) {
      message.error('Không thể tải danh sách khoa');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      setTeachersLoading(true);
      const response = await teacherAPI.getAll({ active: true });
      setTeachers(response.data || []);
    } catch (error) {
      
      message.error('Không thể tải danh sách giáo viên');
    } finally {
      setTeachersLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await departmentAPI.getAll();
      const data = response.data || [];
      setStatistics({
        total: data.length
      });
    } catch (error) {
      
    }
  };

  const handleCreate = () => {
    setEditingDepartment(null);
    setModalVisible(true);
    form.resetFields();
    form.setFieldsValue({
      isActive: true
    });
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setModalVisible(true);
    form.setFieldsValue({
      ...department,
      isActive: department.isActive
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await departmentAPI.delete(id);
      message.success('Xóa khoa thành công');
      fetchDepartments();
      fetchStatistics();
    } catch (error) {
      message.error('Không thể xóa khoa');
    }
  };

  const validateHeadOfDepartment = async (_: any, value: string) => {
    if (!value) {
      return Promise.resolve(); // Required validation handled by required rule
    }

    // Check if teacher exists
    const teacher = teachers.find(t => t._id === value);
    if (!teacher) {
      return Promise.reject(new Error('Giáo viên được chọn không tồn tại!'));
    }

    // Check if teacher is active
    if (!teacher.isActive) {
      return Promise.reject(new Error('Giáo viên này đã ngưng hoạt động!'));
    }

    // Check if teacher is already head of another department (excluding current department)
    const isAlreadyHead = departments.some(dept => 
      dept.headTeacherId === value && 
      dept._id !== editingDepartment?._id
    );
    
    if (isAlreadyHead) {
      return Promise.reject(new Error('Giáo viên này đã là trưởng khoa của khoa khác!'));
    }

    return Promise.resolve();
  };

  const validateDepartmentCode = async (_: any, value: string) => {
    if (!value) {
      return Promise.resolve();
    }

    // Check format
    if (!/^[A-Z0-9]+$/.test(value.toUpperCase())) {
      return Promise.reject(new Error('Mã khoa chỉ được chứa chữ cái hoa và số!'));
    }

    // Check if code already exists (excluding current department)
    const isExisting = departments.some(dept => 
      dept.code.toUpperCase() === value.toUpperCase() && 
      dept._id !== editingDepartment?._id
    );
    
    if (isExisting) {
      return Promise.reject(new Error('Mã khoa đã tồn tại!'));
    }

    return Promise.resolve();
  };

  const validateDepartmentName = async (_: any, value: string) => {
    if (!value) {
      return Promise.resolve();
    }

    // Check if name already exists (excluding current department)
    const isExisting = departments.some(dept => 
      dept.name.toLowerCase() === value.toLowerCase() && 
      dept._id !== editingDepartment?._id
    );
    
    if (isExisting) {
      return Promise.reject(new Error('Tên khoa đã tồn tại!'));
    }

    return Promise.resolve();
  };

  const handleSubmit = async (values: any) => {
    try {
      // Clean and prepare data
      const submitData = {
        code: values.code?.trim().toUpperCase(),
        name: values.name?.trim(),
        description: values.description?.trim() || '',
        headTeacherId: values.headTeacherId || null,
        isActive: true
      };
      
      if (editingDepartment) {
        await departmentAPI.update(editingDepartment._id, submitData);
        message.success('Cập nhật khoa thành công');
      } else {
        await departmentAPI.create(submitData);
        message.success('Thêm khoa thành công');
      }
      
      setModalVisible(false);
      form.resetFields();
      await fetchDepartments();
      await fetchStatistics();
    } catch (error: any) {
      
      // Handle network errors
      if (!error.response) {
        message.error('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.');
        return;
      }

      // Handle timeout errors
      if (error.code === 'ECONNABORTED') {
        message.error('Yêu cầu bị timeout. Vui lòng thử lại.');
        return;
      }
      
      // Handle specific API errors
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else if (error.response?.data?.errors) {
        if (Array.isArray(error.response.data.errors)) {
          const errorMessages = error.response.data.errors.join(', ');
          message.error(errorMessages);
        } else {
          message.error('Dữ liệu không hợp lệ');
        }
      } else if (error.response?.status === 400) {
        message.error('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.');
      } else if (error.response?.status === 401) {
        message.error('Bạn không có quyền thực hiện thao tác này.');
      } else if (error.response?.status === 403) {
        message.error('Truy cập bị từ chối.');
      } else if (error.response?.status === 404) {
        message.error('Không tìm thấy tài nguyên.');
      } else if (error.response?.status >= 500) {
        message.error('Lỗi server. Vui lòng thử lại sau.');
      } else {
        message.error(editingDepartment ? 'Không thể cập nhật khoa' : 'Không thể thêm khoa');
      }
    }
  };

  const getTeacherDisplayName = (teacherId: string | Teacher) => {
    if (typeof teacherId === 'string') {
      const teacher = teachers.find(t => t._id === teacherId);
      return teacher ? `${teacher.fullName} (${teacher.code})` : 'Không tìm thấy';
    }
    return teacherId ? `${teacherId.fullName} (${teacherId.code})` : 'Chưa có';
  };

  const columns = [
    {
      title: 'Mã khoa',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: Department) =>
        record.code.toLowerCase().includes(value.toLowerCase()) ||
        record.name.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: 'Tên khoa',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'Trưởng khoa',
      dataIndex: 'headTeacherId',
      key: 'headTeacherId',
      width: 200,
      render: (teacherId: string | Teacher, record: Department) => {
        if (teacherId) {
          return (
            <div>
              <UserOutlined style={{ marginRight: '4px', color: '#1890ff' }} />
              {getTeacherDisplayName(teacherId)}
            </div>
          );
        }
        return <Tag color="orange">Chưa có</Tag>;
      },
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => text || 'Không có mô tả',
    },

    {
      title: 'Hành động',
      key: 'action',
      width: 150,
      render: (_: any, record: Department) => (
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
            title="Bạn có chắc chắn muốn xóa khoa này?"
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

  const filteredData = departments.filter(dept =>
    dept.code.toLowerCase().includes(searchText.toLowerCase()) ||
    dept.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <Title level={2}>
        <ApartmentOutlined /> Khoa/Bộ môn
      </Title>
      
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng số khoa"
              value={statistics.total}
              prefix={<ApartmentOutlined />}
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
                Thêm khoa
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchDepartments}
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
          />
        </Spin>
      </Card>

      {/* Modal Form */}
      <Modal
        title={editingDepartment ? 'Chỉnh sửa khoa' : 'Thêm khoa mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="code"
            label="Mã khoa"
            rules={[
              { required: true, message: 'Vui lòng nhập mã khoa!' },
              { max: 20, message: 'Mã khoa không được quá 20 ký tự!' },
              { validator: validateDepartmentCode }
            ]}
          >
            <Input placeholder="Nhập mã khoa" />
          </Form.Item>
          
          <Form.Item
            name="name"
            label="Tên khoa"
            rules={[
              { required: true, message: 'Vui lòng nhập tên khoa!' },
              { max: 100, message: 'Tên khoa không được quá 100 ký tự!' },
              { validator: validateDepartmentName }
            ]}
          >
            <Input placeholder="Nhập tên khoa" />
          </Form.Item>
          
          <Form.Item
            name="headTeacherId"
            label="Trưởng khoa"
            rules={[
              { required: true, message: 'Vui lòng chọn trưởng khoa!' },
              { validator: validateHeadOfDepartment }
            ]}
          >
            <Select
              placeholder="Chọn trưởng khoa"
              showSearch
              loading={teachersLoading}
              filterOption={(input, option) =>
                option?.children?.toString().toLowerCase().includes(input.toLowerCase()) || false
              }
              style={{ width: '100%' }}
            >
              {teachers.map(teacher => (
                <Option key={teacher._id} value={teacher._id}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <UserOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                    <span>{teacher.fullName}</span>
                    <Tag color="blue" style={{ marginLeft: '8px' }}>
                      {teacher.code}
                    </Tag>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea
              placeholder="Nhập mô tả về khoa"
              rows={4}
            />
          </Form.Item>
          

        </Form>
      </Modal>
    </div>
  );
};

export default DepartmentManagement; 
