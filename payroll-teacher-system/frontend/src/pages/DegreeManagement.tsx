import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Card,
  Typography,
  message,
  Tag,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Spin,
  Switch
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TrophyOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { degreeAPI } from '../services/api';
import { Degree } from '../types';

const { Title } = Typography;

const DegreeManagement: React.FC = () => {
  const [degrees, setDegrees] = useState<Degree[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDegree, setEditingDegree] = useState<Degree | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    averageCoefficient: 0
  });

  useEffect(() => {
    fetchDegrees();
    fetchStatistics();
  }, []);

  const fetchDegrees = async () => {
    try {
      setLoading(true);
      const response = await degreeAPI.getAll();
      setDegrees(response.data || []);
    } catch (error) {
      message.error('Không thể tải danh sách bằng cấp');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await degreeAPI.getAll();
      const data = response.data || [];
      const activeDegrees = data.filter(degree => degree.isActive);
      const avgCoefficient = activeDegrees.length > 0 
        ? activeDegrees.reduce((sum, degree) => sum + degree.coefficient, 0) / activeDegrees.length 
        : 0;
        
      setStatistics({
        total: data.length,
        active: activeDegrees.length,
        inactive: data.filter(degree => !degree.isActive).length,
        averageCoefficient: parseFloat(avgCoefficient.toFixed(2))
      });
    } catch (error) {
      
    }
  };

  const handleCreate = () => {
    setEditingDegree(null);
    setModalVisible(true);
    form.resetFields();
    form.setFieldsValue({
      isActive: true
    });
  };

  const handleEdit = (degree: Degree) => {
    setEditingDegree(degree);
    setModalVisible(true);
    form.setFieldsValue({
      ...degree,
      isActive: degree.isActive
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await degreeAPI.delete(id);
      message.success('Xóa bằng cấp thành công');
      fetchDegrees();
      fetchStatistics();
    } catch (error) {
      message.error('Không thể xóa bằng cấp');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingDegree) {
        await degreeAPI.update(editingDegree._id, values);
        message.success('Cập nhật bằng cấp thành công');
      } else {
        await degreeAPI.create(values);
        message.success('Thêm bằng cấp thành công');
      }
      setModalVisible(false);
      fetchDegrees();
      fetchStatistics();
    } catch (error) {
      message.error(editingDegree ? 'Không thể cập nhật bằng cấp' : 'Không thể thêm bằng cấp');
    }
  };

  const columns = [
    {
      title: 'Mã bằng cấp',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: any, record: Degree) =>
        record.code.toLowerCase().includes(value.toLowerCase()) ||
        record.name.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: 'Tên bằng cấp',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'Hệ số lương',
      dataIndex: 'coefficient',
      key: 'coefficient',
      width: 120,
      render: (coefficient: number) => (
        <Tag color="blue">{coefficient}</Tag>
      ),
      sorter: (a: Degree, b: Degree) => a.coefficient - b.coefficient,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => text || 'Không có mô tả',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Ngưng hoạt động'}
        </Tag>
      ),
      filters: [
        { text: 'Hoạt động', value: true },
        { text: 'Ngưng hoạt động', value: false },
      ],
      onFilter: (value: any, record: Degree) => record.isActive === value,
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 150,
      render: (_: any, record: Degree) => (
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
            title="Bạn có chắc chắn muốn xóa bằng cấp này?"
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

  const filteredData = degrees.filter(degree =>
    degree.code.toLowerCase().includes(searchText.toLowerCase()) ||
    degree.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <Title level={2}>
        <TrophyOutlined /> Quản lý Bằng cấp
      </Title>
      
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng số bằng cấp"
              value={statistics.total}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đang hoạt động"
              value={statistics.active}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Ngưng hoạt động"
              value={statistics.inactive}
              valueStyle={{ color: '#cf1322' }}
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
                Thêm bằng cấp
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchDegrees}
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
        title={editingDegree ? 'Chỉnh sửa bằng cấp' : 'Thêm bằng cấp mới'}
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
            label="Mã bằng cấp"
            rules={[
              { required: true, message: 'Vui lòng nhập mã bằng cấp!' },
              { max: 20, message: 'Mã bằng cấp không được quá 20 ký tự!' }
            ]}
          >
            <Input placeholder="Nhập mã bằng cấp" />
          </Form.Item>
          
          <Form.Item
            name="name"
            label="Tên bằng cấp"
            rules={[
              { required: true, message: 'Vui lòng nhập tên bằng cấp!' },
              { max: 100, message: 'Tên bằng cấp không được quá 100 ký tự!' }
            ]}
          >
            <Input placeholder="Nhập tên bằng cấp" />
          </Form.Item>
          
          <Form.Item
            name="coefficient"
            label="Hệ số lương"
            rules={[
              { required: true, message: 'Vui lòng nhập hệ số lương!' },
              { type: 'number', min: 0.1, max: 10, message: 'Hệ số lương phải từ 0.1 đến 10!' }
            ]}
          >
            <InputNumber
              placeholder="Nhập hệ số lương"
              min={0.1}
              max={10}
              step={0.1}
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea
              placeholder="Nhập mô tả về bằng cấp"
              rows={4}
            />
          </Form.Item>
          
          <Form.Item
            name="isActive"
            label="Trạng thái"
            initialValue={true}
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Hoạt động"
              unCheckedChildren="Ngưng"
              defaultChecked={true}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DegreeManagement; 
