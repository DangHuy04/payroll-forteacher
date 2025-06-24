import React from 'react';
import { Alert, Card, Typography } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import { useAcademicContext } from './AcademicYearSemesterSelector';

const { Title } = Typography;

interface AcademicGuardProps {
  children: React.ReactNode;
  title: string;
  icon?: React.ReactNode;
}

const AcademicGuard: React.FC<AcademicGuardProps> = ({ children, title, icon }) => {
  const { selectedAcademicYear, selectedSemester, isDataSelected, getDisplayText } = useAcademicContext();

  // Show warning if no academic year/semester selected
  if (!isDataSelected()) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <Title level={2} style={{ margin: 0, marginBottom: 16 }}>
            {icon}
            {title}
          </Title>
          
          <Alert
            message="Vui lòng chọn Năm học và Kỳ học"
            description={
              <div>
                <p>Để sử dụng chức năng <strong>{title}</strong>, bạn cần chọn <strong>Năm học</strong> và <strong>Kỳ học</strong> cụ thể.</p>
                <p>👆 Nhấn vào <strong>"Thay đổi"</strong> bên cạnh thông tin năm học ở góc trên bên phải để tiếp tục.</p>
              </div>
            }
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Card>
      </div>
    );
  }

  // Show content with academic info when selected
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0, marginBottom: 8 }}>
          {icon}
          {title}
        </Title>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          padding: '6px 12px',
          background: '#f6ffed',
          border: '1px solid #52c41a',
          borderRadius: '6px',
          width: 'fit-content'
        }}>
          <CalendarOutlined style={{ color: '#52c41a', fontSize: '14px' }} />
          <Typography.Text style={{ 
            fontSize: '13px',
            color: '#52c41a',
            fontWeight: 500
          }}>
            📅 {getDisplayText()}
          </Typography.Text>
        </div>
      </div>
      {children}
    </div>
  );
};

export default AcademicGuard; 
