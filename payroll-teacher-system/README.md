# 💰 Hệ thống tính tiền dạy cho giáo viên

Hệ thống quản lý và tính toán tiền dạy cho giáo viên đại học, được xây dựng với **ReactJS + NodeJS + MongoDB**.

## 📋 Các chức năng chính

### 1. Quản lý giáo viên
- **UC1.1** - Quản lý danh mục bằng cấp ✅
- **UC1.2** - Quản lý khoa 
- **UC1.4** - Quản lý giáo viên 
- **UC1.5** - Thống kê giáo viên 

### 2. Quản lý lớp học phần
- **UC2.1** - Quản lý học phần
- **UC2.2** - Quản lý kì học
- **UC2.3** - Quản lý TKB/lớp học phần
- **UC2.4** - Phân công giảng viên
- **UC2.5** - Thống kê số lớp mở

### 3. Tính tiền dạy
- **UC3.1** - Thiết lập định mức tiền theo tiết
- **UC3.2** - Thiết lập hệ số giáo viên (theo bằng cấp)
- **UC3.3** - Thiết lập hệ số lớp
- **UC3.4** - Tính tiền dạy cho giáo viên trong một kì

### 4. Báo cáo
- **UC4.1** - Báo cáo tiền dạy của giáo viên trong một năm
- **UC4.2** - Báo cáo tiền dạy của giáo viên một khoa
- **UC4.3** - Báo cáo tiền dạy của giáo viên toàn trường

## 🛠️ Tech Stack

### Backend
- **Node.js** + Express.js
- **MongoDB** + Mongoose
- **JWT** Authentication
- **Express Validator** - Validation
- **Helmet** + **Morgan** - Security & Logging

### Frontend (Sắp tới)
- **React 18** + TypeScript
- **Material-UI** Components
- **React Query** - Data fetching
- **React Hook Form** - Form handling

## 🚀 Cài đặt và chạy

### 1. Clone project
```bash
git clone <repository-url>
cd payroll-teacher-system
```

### 2. Backend Setup
```bash
cd backend

# Cài đặt dependencies
npm install

# Tạo file .env (copy từ .env.example)
cp .env.example .env

# Chỉnh sửa .env với thông tin database của bạn
# MONGODB_URI=mongodb://localhost:27017/teacher_payroll

# Chạy server
npm run dev
```

### 3. Tạo dữ liệu mẫu (Optional)
```bash
# Từ thư mục backend
node src/utils/seedData.js
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Health Check
```http
GET /api/health
```

### Degrees (Bằng cấp) - ✅ Hoàn thành
```http
GET    /api/degrees          # Lấy danh sách bằng cấp
GET    /api/degrees/:id      # Lấy bằng cấp theo ID
POST   /api/degrees          # Tạo bằng cấp mới
PUT    /api/degrees/:id      # Cập nhật bằng cấp
DELETE /api/degrees/:id      # Xóa bằng cấp
GET    /api/degrees/code/:code  # Lấy bằng cấp theo mã
PATCH  /api/degrees/:id/toggle-status  # Bật/tắt trạng thái
```

### Departments (Khoa) - 🔄 Đang phát triển
```http
GET    /api/departments      # Lấy danh sách khoa
POST   /api/departments      # Tạo khoa mới
...
```

### Teachers (Giáo viên) - 🔄 Đang phát triển
```http
GET    /api/teachers         # Lấy danh sách giáo viên  
POST   /api/teachers         # Tạo giáo viên mới
...
```

## 📊 Database Schema

### Degrees (Bằng cấp)
```javascript
{
  code: "TS",               // Mã bằng cấp
  name: "Tiến sĩ",         // Tên bằng cấp
  coefficient: 2.0,        // Hệ số lương
  priority: 4,             // Thứ tự ưu tiên
  isActive: true          // Trạng thái
}
```

### Departments (Khoa)
```javascript
{
  code: "CNTT",                    // Mã khoa
  name: "Công nghệ thông tin",    // Tên khoa
  headTeacherId: ObjectId,        // Trưởng khoa
  isActive: true                 // Trạng thái
}
```

### Teachers (Giáo viên)
```javascript
{
  code: "GV001",              // Mã giáo viên
  fullName: "Nguyễn Văn A",   // Họ tên
  email: "email@domain.com",  // Email
  departmentId: ObjectId,     // Khoa
  degreeId: ObjectId,         // Bằng cấp
  position: "Giảng viên",     // Chức vụ
  isActive: true             // Trạng thái
}
```

## 🧪 Testing

### Test API với curl
```bash
# Health check
curl http://localhost:5000/api/health

# Lấy danh sách bằng cấp
curl http://localhost:5000/api/degrees

# Tạo bằng cấp mới
curl -X POST http://localhost:5000/api/degrees \
  -H "Content-Type: application/json" \
  -d '{
    "code": "KS",
    "name": "Kỹ sư",
    "coefficient": 1.2,
    "priority": 2
  }'
```

## 📝 Development Status

- ✅ **Hoàn thành**: UC1.1 - Quản lý danh mục bằng cấp
- 🔄 **Đang phát triển**: UC1.2 - Quản lý khoa
- ⏳ **Kế hoạch**: Các UC còn lại

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Contact

- **Developer**: [Your Name]
- **Email**: your.email@example.com
- **Project Link**: [Repository URL]

---

**🎯 Mục tiêu**: Xây dựng hệ thống tính lương giáo viên hoàn chỉnh, dễ sử dụng và có thể mở rộng cho các trường đại học tại Việt Nam. 