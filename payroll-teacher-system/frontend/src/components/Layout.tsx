import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography, Breadcrumb, Button, Avatar, Dropdown, Badge, Space, Drawer } from 'antd';
import type { MenuProps } from 'antd';
import {
  UserOutlined,
  BookOutlined,
  CalculatorOutlined,
  FileTextOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  TeamOutlined,
  ApartmentOutlined,
  ScheduleOutlined,
  DollarOutlined,
  LogoutOutlined,
  ProfileOutlined,
  BellOutlined,
  SearchOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  BankOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { AcademicYearSemesterSelector, useAcademicContext } from './AcademicYearSemesterSelector';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

interface LayoutProps {
  children: React.ReactNode;
}

type MenuItem = Required<MenuProps>['items'][number];

const AppLayout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [academicDrawerVisible, setAcademicDrawerVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDataSelected, getDisplayText } = useAcademicContext();

  // Check for mobile screen
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Initialize open keys based on current route
  useEffect(() => {
    const initialOpenKeys = getOpenKeys();
    setOpenKeys(initialOpenKeys);
  }, [location.pathname]);

  function getItem(
    label: React.ReactNode,
    key: React.Key,
    icon?: React.ReactNode,
    children?: MenuItem[],
    type?: 'group',
  ): MenuItem {
    return {
      key,
      icon,
      children,
      label,
      type,
    } as MenuItem;
  }

  // Enhanced menu items with better icons and organization
  const menuItems: MenuItem[] = [
    getItem('Trang chủ', '/', <HomeOutlined />),
    { type: 'divider' },
    getItem('Quản lý Giảng viên', 'teacher-management', <TeamOutlined />, [
      getItem('Bằng cấp', '/degrees', <DatabaseOutlined />),
      getItem('Khoa/Bộ môn', '/departments', <ApartmentOutlined />),
      getItem('Giảng viên', '/teachers', <UserOutlined />),
    ]),
    getItem('Quản lý Học phần & Lớp học', 'class-management', <BookOutlined />, [
      getItem('Học phần', '/subjects', <BookOutlined />),
      getItem('Năm học & Học kỳ', '/academic-years', <ScheduleOutlined />),
      getItem('Lớp học phần', '/classes', <ScheduleOutlined />),
      getItem('Phân công Giảng dạy', '/teaching-assignments', <ScheduleOutlined />),
      getItem('Thống kê Lớp học phần', '/class-statistics', <BarChartOutlined />),
    ]),
    getItem('Quản lý Lương', 'salary-management', <CalculatorOutlined />, [
      getItem('Thiết lập Mức lương', '/rate-settings', <SettingOutlined />),
      getItem('Tính lương', '/salary-calculations', <DollarOutlined />),
    ]),
    getItem('Báo cáo Tiền dạy', 'reports', <FileTextOutlined />, [
      getItem('Báo cáo Cá nhân', '/reports/individual', <ProfileOutlined />),
      getItem('Báo cáo Khoa/Bộ môn', '/reports/department', <ApartmentOutlined />),
      getItem('Báo cáo Tổng hợp', '/reports/university', <BankOutlined />),
    ]),
  ];

  // Get current selected keys based on pathname
  const getSelectedKeys = (): string[] => {
    const pathname = location.pathname;
    if (pathname === '/') return ['/'];
    return [pathname];
  };

  // Get open keys for collapsed menu
  const getOpenKeys = (): string[] => {
    if (collapsed) return []; // Don't auto-open when collapsed
    
    const pathname = location.pathname;
    const openKeys: string[] = [];
    
    if (pathname.startsWith('/degrees') || pathname.startsWith('/departments') || pathname.startsWith('/teachers')) {
      openKeys.push('teacher-management');
    } else if (pathname.startsWith('/subjects') || pathname.startsWith('/academic-years') || 
               pathname.startsWith('/classes') || pathname.startsWith('/teaching-assignments') || 
               pathname.startsWith('/class-statistics')) {
      openKeys.push('class-management');
    } else if (pathname.startsWith('/rate-settings') || pathname.startsWith('/salary-calculations')) {
      openKeys.push('salary-management');
    } else if (pathname.startsWith('/reports')) {
      openKeys.push('reports');
    }
    
    return openKeys;
  };

  // Generate breadcrumb items with better styling
  const getBreadcrumbItems = () => {
    const pathname = location.pathname;
    const items = [{ 
      title: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <HomeOutlined />
          <span>Trang chủ</span>
        </span>
      )
    }];
    
    if (pathname === '/') {
      return items;
    }

    // Add breadcrumb items based on path
    if (pathname.startsWith('/degrees')) {
      items.push({ title: <span>Quản lý Giảng viên</span> });
      items.push({ title: <span style={{ fontWeight: 500 }}>Bằng cấp</span> });
    } else if (pathname.startsWith('/departments')) {
      items.push({ title: <span>Quản lý Giảng viên</span> });
      items.push({ title: <span style={{ fontWeight: 500 }}>Khoa/Bộ môn</span> });
    } else if (pathname.startsWith('/teachers')) {
      items.push({ title: <span>Quản lý Giảng viên</span> });
      items.push({ title: <span style={{ fontWeight: 500 }}>Giảng viên</span> });
    } else if (pathname.startsWith('/subjects')) {
      items.push({ title: <span>Quản lý Học phần & Lớp học</span> });
      items.push({ title: <span style={{ fontWeight: 500 }}>Học phần</span> });
    } else if (pathname.startsWith('/academic-years')) {
      items.push({ title: <span>Quản lý Học phần & Lớp học</span> });
      items.push({ title: <span style={{ fontWeight: 500 }}>Năm học & Học kỳ</span> });
    } else if (pathname.startsWith('/classes')) {
      items.push({ title: <span>Quản lý Học phần & Lớp học</span> });
      items.push({ title: <span style={{ fontWeight: 500 }}>Lớp học phần</span> });
    } else if (pathname.startsWith('/teaching-assignments')) {
      items.push({ title: <span>Quản lý Học phần & Lớp học</span> });
      items.push({ title: <span style={{ fontWeight: 500 }}>Phân công Giảng dạy</span> });
    } else if (pathname.startsWith('/class-statistics')) {
      items.push({ title: <span>Quản lý Học phần & Lớp học</span> });
      items.push({ title: <span style={{ fontWeight: 500 }}>Thống kê Lớp học phần</span> });
    } else if (pathname.startsWith('/rate-settings')) {
      items.push({ title: <span>Quản lý Lương</span> });
      items.push({ title: <span style={{ fontWeight: 500 }}>Thiết lập Mức lương</span> });
    } else if (pathname.startsWith('/salary-calculations')) {
      items.push({ title: <span>Quản lý Lương</span> });
      items.push({ title: <span style={{ fontWeight: 500 }}>Tính lương</span> });
    } else if (pathname.startsWith('/reports/individual')) {
      items.push({ title: <span>Báo cáo Tiền dạy</span> });
      items.push({ title: <span style={{ fontWeight: 500 }}>Báo cáo Cá nhân</span> });
    } else if (pathname.startsWith('/reports/department')) {
      items.push({ title: <span>Báo cáo Tiền dạy</span> });
      items.push({ title: <span style={{ fontWeight: 500 }}>Báo cáo Khoa/Bộ môn</span> });
    } else if (pathname.startsWith('/reports/university')) {
      items.push({ title: <span>Báo cáo Tiền dạy</span> });
      items.push({ title: <span style={{ fontWeight: 500 }}>Báo cáo Tổng hợp</span> });
    }
    
    return items;
  };

  // Enhanced user dropdown menu
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Hồ sơ cá nhân',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt hệ thống',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
    },
  ];

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key && key !== 'teacher-management' && key !== 'class-management' && 
        key !== 'salary-management' && key !== 'reports') {
      navigate(key);
      // Auto collapse on mobile after navigation
      if (isMobile) {
        setCollapsed(true);
      }
    }
  };

  const handleUserMenuClick: MenuProps['onClick'] = ({ key }) => {
    switch (key) {
      case 'logout':
        localStorage.removeItem('authToken');
        navigate('/login');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'settings':
        navigate('/settings');
        break;
    }
  };

  // Handle submenu open/close with accordion behavior
  const handleOpenChange = (keys: string[]) => {
    // Get the latest opened key
    const latestOpenKey = keys.find(key => openKeys.indexOf(key) === -1);
    
    // Get all root keys (parent menu keys)
    const rootSubmenuKeys = ['teacher-management', 'class-management', 'salary-management', 'reports'];
    
    // If opening a new submenu
    if (latestOpenKey && rootSubmenuKeys.includes(latestOpenKey)) {
      // Close all other submenus and open only the new one (accordion behavior)
      setOpenKeys([latestOpenKey]);
    } else {
      // If closing current submenu or no new submenu opened
      setOpenKeys(keys);
    }
  };

  // Custom styles for modern sidebar
  const siderStyle: React.CSSProperties = {
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 1000,
    background: 'linear-gradient(145deg, #1a1d29 0%, #2c3142 100%)',
    boxShadow: '4px 0 24px rgba(0, 0, 0, 0.12)',
    borderRight: '1px solid rgba(255, 255, 255, 0.06)',
  };

  const logoStyle: React.CSSProperties = {
    height: '64px',
    margin: '16px 12px 24px 12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
    position: 'relative',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    padding: '0 24px',
    background: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    borderBottom: '1px solid #f0f0f0',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        width={260}
        collapsedWidth={isMobile ? 0 : 80}
        style={siderStyle}
        className="modern-sidebar"
      >
        {/* Logo Section */}
        <div style={logoStyle}>
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '200%',
            height: '200%',
            background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)',
            transform: 'rotate(45deg)',
            animation: collapsed ? 'none' : 'shimmer 3s infinite',
          }} />
          <Title level={collapsed ? 3 : 4} style={{ 
            color: 'white', 
            margin: 0,
            fontWeight: 600,
            letterSpacing: '0.5px',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            {collapsed ? '💼' : '💼 Teacher Payroll'}
          </Title>
        </div>
        
        {/* Menu */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
          items={menuItems}
          onClick={handleMenuClick}
          inlineCollapsed={collapsed}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '14px',
          }}
          className="modern-menu"
        />


      </Sider>

      <Layout style={{ 
        marginLeft: isMobile ? 0 : (collapsed ? 80 : 260), 
        transition: 'margin-left 0.3s ease',
        minHeight: '100vh'
      }}>
        <Header style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => {
                setCollapsed(!collapsed);
                // Clear open keys when collapsing to avoid UI issues
                if (!collapsed) {
                  setOpenKeys([]);
                }
              }}
              style={{ 
                fontSize: '16px', 
                width: 64, 
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
              }}
              className="toggle-button"
            />
            
            <Breadcrumb 
              items={getBreadcrumbItems()}
              style={{ 
                marginLeft: '16px',
                fontSize: '14px'
              }}
              separator="/"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Academic Year & Semester Selector - Inline */}
            {!isMobile && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '4px 12px',
                background: isDataSelected() ? '#f6ffed' : '#fff1f0',
                border: `1px solid ${isDataSelected() ? '#52c41a' : '#ff7875'}`,
                borderRadius: '6px'
              }}>
                <CalendarOutlined style={{ 
                  color: isDataSelected() ? '#52c41a' : '#ff7875',
                  fontSize: '14px'
                }} />
                <Typography.Text style={{ 
                  fontSize: '13px',
                  color: isDataSelected() ? '#52c41a' : '#ff7875',
                  fontWeight: 500
                }}>
                  {isDataSelected() ? getDisplayText() : 'Chưa chọn năm học/kỳ'}
                </Typography.Text>
                <Button
                  type="text"
                  size="small"
                  onClick={() => setAcademicDrawerVisible(true)}
                  style={{ 
                    height: '24px',
                    padding: '0 6px',
                    fontSize: '12px',
                    color: isDataSelected() ? '#52c41a' : '#ff7875'
                  }}
                >
                  Thay đổi
                </Button>
              </div>
            )}
            
            {/* Mobile selector button */}
            {isMobile && (
              <Button
                type={isDataSelected() ? "default" : "primary"}
                icon={<CalendarOutlined />}
                onClick={() => setAcademicDrawerVisible(true)}
                style={{ 
                  borderRadius: '8px',
                  height: '36px',
                  background: isDataSelected() ? '#f6ffed' : undefined,
                  borderColor: isDataSelected() ? '#52c41a' : undefined,
                  color: isDataSelected() ? '#52c41a' : undefined
                }}
              />
            )}

            <Button
              type="text"
              icon={<SearchOutlined />}
              style={{ 
                borderRadius: '20px',
                height: '36px',
                width: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />

            <Badge count={3} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                style={{ 
                  borderRadius: '20px',
                  height: '36px',
                  width: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              />
            </Badge>

            <div style={{
              height: '32px',
              width: '1px',
              background: '#e8e8e8',
              margin: '0 8px'
            }} />
            
            <Space align="center">
              <div style={{ textAlign: 'right', lineHeight: '1.2' }}>
                <Text style={{ 
                  display: 'block',
                  fontWeight: 500,
                  fontSize: '14px',
                  color: '#262626'
                }}>
                  Admin User
                </Text>
                <Text type="secondary" style={{ 
                  fontSize: '12px',
                  color: '#8c8c8c'
                }}>
                  Quản trị viên
                </Text>
              </div>
              
              <Dropdown
                menu={{
                  items: userMenuItems,
                  onClick: handleUserMenuClick,
                }}
                placement="bottomRight"
                trigger={['click']}
              >
                <Avatar 
                  style={{ 
                    backgroundColor: '#667eea',
                    cursor: 'pointer',
                    border: '2px solid #e6f7ff',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                  }}
                  icon={<UserOutlined />}
                  size="large"
                />
              </Dropdown>
            </Space>
          </div>
        </Header>

        <Content style={{ 
          margin: '24px',
          padding: 0,
          minHeight: 'calc(100vh - 112px)',
          background: 'transparent'
        }}>
          {children}
        </Content>
      </Layout>

      {/* Academic Year & Semester Drawer */}
      <Drawer
        title="Chọn Năm học và Kỳ học"
        placement="right"
        onClose={() => setAcademicDrawerVisible(false)}
        open={academicDrawerVisible}
        width={isMobile ? '100%' : 600}
        bodyStyle={{ padding: '24px' }}
      >
        <AcademicYearSemesterSelector showAlert={true} compact={false} />
        <div style={{ marginTop: 24, padding: 16, background: '#f9f9f9', borderRadius: 8 }}>
          <Typography.Title level={5}>📌 Lưu ý quan trọng:</Typography.Title>
          <Typography.Paragraph>
            • Tất cả dữ liệu sẽ được lọc theo <strong>năm học</strong> và <strong>kỳ học</strong> đã chọn.<br/>
            • Việc thay đổi lựa chọn sẽ làm tải lại dữ liệu trên tất cả các trang.<br/>
            • Đảm bảo chọn đúng năm học và kỳ học trước khi thực hiện các thao tác quan trọng.
          </Typography.Paragraph>
        </div>
      </Drawer>

      {/* Mobile Overlay */}
      {isMobile && !collapsed && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            zIndex: 999,
          }}
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Custom CSS */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }

        .modern-sidebar .ant-menu-dark {
          background: transparent !important;
          user-select: none !important;
        }

        .modern-sidebar {
          user-select: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
        }

        .modern-sidebar .ant-menu-dark .ant-menu-item,
        .modern-sidebar .ant-menu-dark .ant-menu-submenu-title {
          margin: 4px 8px !important;
          width: calc(100% - 16px) !important;
          border-radius: 8px !important;
          transition: all 0.3s ease !important;
          position: relative !important;
          overflow: hidden !important;
          cursor: pointer !important;
          user-select: none !important;
        }

        .modern-sidebar .ant-menu-dark .ant-menu-item:hover,
        .modern-sidebar .ant-menu-dark .ant-menu-submenu-title:hover {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%) !important;
          transform: translateX(2px) !important;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2) !important;
        }

        .modern-sidebar .ant-menu-dark .ant-menu-item-selected {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4) !important;
          transform: translateX(4px) !important;
        }

        .modern-sidebar .ant-menu-dark .ant-menu-item-selected::before {
          display: none !important;
        }

        .modern-sidebar .ant-menu-dark .ant-menu-submenu-open .ant-menu-submenu-title {
          background: rgba(102, 126, 234, 0.1) !important;
        }

        .modern-sidebar .ant-menu-dark .ant-menu-sub {
          background: rgba(0, 0, 0, 0.2) !important;
          margin: 4px 8px !important;
          border-radius: 8px !important;
          backdrop-filter: blur(10px) !important;
        }

        .modern-sidebar .ant-menu-dark .ant-menu-sub .ant-menu-item {
          margin: 2px 4px !important;
          width: calc(100% - 8px) !important;
          padding-left: 48px !important;
          position: relative !important;
          font-size: 13px !important;
          opacity: 0.9 !important;
          cursor: pointer !important;
          user-select: none !important;
        }

        .modern-sidebar .ant-menu-dark .ant-menu-sub .ant-menu-item::before {
          content: '•';
          position: absolute;
          left: 28px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          font-weight: bold;
        }

        .modern-sidebar .ant-menu-dark .ant-menu-sub .ant-menu-item:hover {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%) !important;
          opacity: 1 !important;
          transform: translateX(4px) !important;
        }

        .modern-sidebar .ant-menu-dark .ant-menu-sub .ant-menu-item-selected {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 100%) !important;
          opacity: 1 !important;
          transform: translateX(6px) !important;
        }

        .modern-sidebar .ant-menu-dark .ant-menu-sub .ant-menu-item-selected::before {
          display: none !important;
        }

        /* Smooth accordion animation */
        .modern-sidebar .ant-menu-submenu > .ant-menu {
          transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1) !important;
        }

        .modern-sidebar .ant-menu-submenu-title {
          transition: all 0.3s ease !important;
        }

        /* Enhanced visual feedback for submenu states */
        .modern-sidebar .ant-menu-submenu-active > .ant-menu-submenu-title {
          background: rgba(102, 126, 234, 0.15) !important;
          color: #fff !important;
        }

        .toggle-button:hover {
          background: #f5f5f5 !important;
          transform: scale(1.05) !important;
        }

        .ant-breadcrumb a {
          color: #1890ff !important;
          transition: color 0.3s ease !important;
        }

        .ant-breadcrumb a:hover {
          color: #40a9ff !important;
        }

        /* Scrollbar Styling */
        .modern-sidebar .ant-menu-root::-webkit-scrollbar {
          width: 4px;
        }

        .modern-sidebar .ant-menu-root::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }

        .modern-sidebar .ant-menu-root::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
        }

        .modern-sidebar .ant-menu-root::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* Collapsed sidebar submenu positioning */
        .modern-sidebar .ant-menu-inline-collapsed > .ant-menu-submenu > .ant-menu-submenu-title {
          padding: 0 calc(50% - 8px) !important;
          text-align: center !important;
        }

        .modern-sidebar .ant-menu-submenu-popup {
          margin-left: 8px !important;
          border-radius: 8px !important;
          box-shadow: 0 6px 16px -8px rgba(0, 0, 0, 0.08), 0 9px 28px 0 rgba(0, 0, 0, 0.05), 0 3px 6px -4px rgba(0, 0, 0, 0.12) !important;
        }

        .modern-sidebar .ant-menu-submenu-popup .ant-menu {
          background: linear-gradient(145deg, #1a1d29 0%, #2c3142 100%) !important;
          border-radius: 8px !important;
          padding: 8px !important;
          min-width: 200px !important;
        }

        .modern-sidebar .ant-menu-submenu-popup .ant-menu-item {
          margin: 2px 0 !important;
          border-radius: 6px !important;
          transition: all 0.2s ease !important;
        }

        .modern-sidebar .ant-menu-submenu-popup .ant-menu-item:hover {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%) !important;
          transform: translateX(2px) !important;
        }

        .modern-sidebar .ant-menu-submenu-popup .ant-menu-item-selected {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          transform: translateX(4px) !important;
        }

        /* Collapsed state icon centering */
        .modern-sidebar .ant-menu-inline-collapsed .ant-menu-submenu-title .anticon {
          margin: 0 !important;
          font-size: 16px !important;
        }

        .modern-sidebar .ant-menu-inline-collapsed .ant-menu-item {
          padding: 0 calc(50% - 8px) !important;
          text-align: center !important;
        }

        .modern-sidebar .ant-menu-inline-collapsed .ant-menu-item .anticon {
          margin: 0 !important;
          font-size: 16px !important;
        }

        /* Mobile Responsiveness */
        @media (max-width: 768px) {
          .modern-sidebar {
            transform: translateX(${collapsed ? '-100%' : '0'}) !important;
            transition: transform 0.3s ease !important;
          }
        }
      `}</style>
    </Layout>
  );
};

export default AppLayout; 
