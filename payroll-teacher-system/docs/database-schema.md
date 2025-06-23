# DATABASE SCHEMA - Hệ thống tính tiền dạy giáo viên

## 📋 Collections chính

### 1. **degrees** (UC1.1 - Danh mục bằng cấp)
```javascript
{
  _id: ObjectId,
  code: String,           // "TS", "ThS", "CN", "CD"
  name: String,           // "Tiến sĩ", "Thạc sĩ", "Cử nhân", "Cao đẳng"
  coefficient: Number,    // Hệ số lương theo bằng cấp (1.0, 1.2, 1.5, 2.0)
  priority: Number,       // Thứ tự ưu tiên
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 2. **departments** (UC1.2 - Khoa)
```javascript
{
  _id: ObjectId,
  code: String,           // "CNTT", "KTCK", "QTKD"
  name: String,           // "Công nghệ thông tin", "Kế toán - Kiểm toán"
  description: String,
  headTeacherId: ObjectId, // Trưởng khoa
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 3. **teachers** (UC1.4 - Giáo viên)
```javascript
{
  _id: ObjectId,
  code: String,           // Mã giáo viên "GV001"
  fullName: String,       // Họ tên đầy đủ
  email: String,
  phone: String,
  departmentId: ObjectId, // Khoa
  degreeId: ObjectId,     // Bằng cấp cao nhất
  hireDate: Date,         // Ngày vào làm
  position: String,       // "Giảng viên", "Trưởng khoa", "Phó khoa"
  isActive: Boolean,
  avatar: String,         // URL ảnh đại diện
  createdAt: Date,
  updatedAt: Date
}
```

### 4. **subjects** (UC2.1 - Học phần)
```javascript
{
  _id: ObjectId,
  code: String,           // "CNTT101", "TOAN102"
  name: String,           // "Lập trình căn bản", "Toán cao cấp 1"
  credits: Number,        // Số tín chỉ (2, 3, 4...)
  theoryHours: Number,    // Tiết lý thuyết
  practiceHours: Number,  // Tiết thực hành
  departmentId: ObjectId, // Khoa phụ trách
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 5. **semesters** (UC2.2 - Kì học)
```javascript
{
  _id: ObjectId,
  code: String,           // "2024.1", "2024.2", "2024.3"
  name: String,           // "Học kì 1 năm 2024", "Học kì hè 2024"
  academicYear: String,   // "2023-2024", "2024-2025"
  startDate: Date,
  endDate: Date,
  status: String,         // "planning", "active", "completed"
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 6. **classes** (UC2.3 - Lớp học phần)
```javascript
{
  _id: ObjectId,
  code: String,           // "CNTT101.01", "CNTT101.02"
  subjectId: ObjectId,    // Học phần
  semesterId: ObjectId,   // Kì học
  teacherId: ObjectId,    // Giáo viên phụ trách
  studentCount: Number,   // Số sinh viên đăng ký
  maxStudents: Number,    // Sĩ số tối đa
  classType: String,      // "theory", "practice", "mixed"
  
  // Thời khóa biểu
  schedule: [{
    dayOfWeek: Number,    // 2-8 (Thứ 2 - Chủ nhật)
    startPeriod: Number,  // Tiết bắt đầu (1-12)
    endPeriod: Number,    // Tiết kết thúc
    room: String          // Phòng học
  }],
  
  totalHours: Number,     // Tổng số tiết trong kì
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 7. **teaching_assignments** (UC2.4 - Phân công giảng dạy)
```javascript
{
  _id: ObjectId,
  classId: ObjectId,      // Lớp học phần
  teacherId: ObjectId,    // Giáo viên
  semesterId: ObjectId,   // Kì học
  assignmentType: String, // "main", "assistant", "substitute"
  hoursAssigned: Number,  // Số tiết được phân công
  assignedDate: Date,
  status: String,         // "assigned", "confirmed", "completed"
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 8. **rate_settings** (UC3.1, UC3.2, UC3.3 - Thiết lập định mức)
```javascript
{
  _id: ObjectId,
  type: String,           // "base_rate", "degree_coefficient", "class_coefficient"
  
  // Định mức tiền theo tiết (UC3.1)
  baseRate: Number,       // Tiền cho 1 tiết chuẩn (VD: 200,000 VND)
  
  // Hệ số theo bằng cấp (UC3.2)
  degreeCoefficients: [{
    degreeId: ObjectId,
    coefficient: Number   // TS: 2.0, ThS: 1.5, CN: 1.0
  }],
  
  // Hệ số theo lớp (UC3.3)
  classCoefficients: [{
    minStudents: Number,  // Từ bao nhiêu SV
    maxStudents: Number,  // Đến bao nhiêu SV
    coefficient: Number   // 0-30 SV: 1.0, 31-50 SV: 1.1, >50 SV: 1.2
  }],
  
  effectiveDate: Date,    // Ngày hiệu lực
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 9. **salary_calculations** (UC3.4 - Kết quả tính tiền dạy)
```javascript
{
  _id: ObjectId,
  teacherId: ObjectId,
  semesterId: ObjectId,
  
  // Chi tiết từng lớp
  classDetails: [{
    classId: ObjectId,
    className: String,
    subjectName: String,
    studentCount: Number,
    totalHours: Number,
    baseRate: Number,
    degreeCoefficient: Number,
    classCoefficient: Number,
    amount: Number        // Tiền của lớp này
  }],
  
  // Tổng kết
  totalHours: Number,     // Tổng số tiết dạy
  totalAmount: Number,    // Tổng tiền dạy
  
  // Metadata
  calculatedDate: Date,   // Ngày tính
  calculatedBy: ObjectId, // Người tính
  status: String,         // "draft", "approved", "paid"
  approvedBy: ObjectId,   // Người duyệt
  approvedDate: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

### 10. **users** (Hệ thống đăng nhập)
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String,       // Hashed
  role: String,           // "admin", "manager", "teacher"
  teacherId: ObjectId,    // Link đến teacher nếu là GV
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔗 Relationships

```javascript
// Teacher belongs to Department and has Degree
teachers.departmentId → departments._id
teachers.degreeId → degrees._id

// Class belongs to Subject and Semester
classes.subjectId → subjects._id
classes.semesterId → semesters._id
classes.teacherId → teachers._id

// Teaching Assignment connects Teacher and Class
teaching_assignments.teacherId → teachers._id
teaching_assignments.classId → classes._id
teaching_assignments.semesterId → semesters._id

// Salary Calculation for Teacher in Semester
salary_calculations.teacherId → teachers._id
salary_calculations.semesterId → semesters._id
```

## 🎯 Indexes for Performance

```javascript
// Teachers
db.teachers.createIndex({ "code": 1 }, { unique: true })
db.teachers.createIndex({ "departmentId": 1 })
db.teachers.createIndex({ "degreeId": 1 })

// Classes
db.classes.createIndex({ "code": 1 }, { unique: true })
db.classes.createIndex({ "semesterId": 1, "teacherId": 1 })
db.classes.createIndex({ "subjectId": 1 })

// Teaching Assignments
db.teaching_assignments.createIndex({ "teacherId": 1, "semesterId": 1 })
db.teaching_assignments.createIndex({ "classId": 1 })

// Salary Calculations
db.salary_calculations.createIndex({ "teacherId": 1, "semesterId": 1 }, { unique: true })
``` 