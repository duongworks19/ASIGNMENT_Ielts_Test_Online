# 🎓 IELTS Online Learning Platform

<div align="center">
  <img alt="React" src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img alt="CSS3" src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" />
  <img alt="JSON Server" src="https://img.shields.io/badge/JSON_Server-339933?style=for-the-badge&logo=json&logoColor=white" />
</div>

## 📌 Giới thiệu dự án (Introduction)

Dự án **IELTS Online Learning** là một nền tảng web học tiếng Anh trực tuyến được phát triển trong khuôn khổ bài tập nhóm môn học **FER202 (Front-End with React)**.
Hệ thống mang đến một môi trường học tập hiện đại cho học viên, cung cấp công cụ quản lý khóa học mạnh mẽ cho giáo viên và bảng điều khiển tổng quan cho quản trị viên (Admin).

## ✨ Chức năng chính (Features)

### 👨‍🎓 Dành cho Học viên (Student)

- Khám phá, xem thông tin chi tiết và đăng ký các khóa học IELTS.
- Tham gia học tập qua giao diện bài giảng trực quan (Lessons & Flashcards).
- Làm bài kiểm tra, thi thử thực chiến (Quiz & Practice Tests).
- Theo dõi tiến độ học tập và quản lý profile cá nhân.

### 👨‍🏫 Dành cho Giáo viên (Teacher)

- Bảng điều khiển (Dashboard) thống kê tình hình lớp học.
- Đăng tải, chỉnh sửa và quản lý nội dung bài giảng, khóa học.
- Quản lý ngân hàng câu hỏi và bài thi trắc nghiệm.

### 🛡️ Dành cho Quản trị viên (Admin)

- Quản lý toàn bộ hệ thống tài khoản (Học viên, Giáo viên).
- Phê duyệt các khóa học mới trước khi hiển thị (Approval System).
- Theo dõi và thống kê các giao dịch mua khóa học.

## 🚀 Công nghệ sử dụng (Tech Stack)

- **Frontend:** ReactJS, React Router DOM, **Bootstrap 5** (Hệ thống Grid và Component).
  > **⚠️ LƯU Ý CHO TEAM (FER202):** Tất cả các trang bắt buộc phải sử dụng class của Bootstrap (`container`, `row`, `col-*`, `card`, `btn`...) để dựng Layout. Hạn chế tối đa việc tự viết CSS `display: flex` hay `grid` thủ công để tránh bị trừ điểm form layout nhé!
  >
- **Backend/Database (Mock):** JSON Server (Giả lập RESTful API).
- **Quản lý source code:** Git & GitHub.

## 🛠️ Hướng dẫn chạy dự án (Getting Started)

Làm theo các bước sau để chạy dự án trên máy tính của bạn:

1. **Clone dự án về máy:**

   ```bash
   git clone https://github.com/TdatVn-fpt/FER202_Project.git
   cd FER202_Project/ielts-online-learning
   ```
2. **Cài đặt các thư viện cần thiết:**

   ```bash
   npm install
   ```
3. **Thiết lập biến môi trường:**
   Tạo một file `.env` ở thư mục gốc (ngang hàng với `package.json`) và copy nội dung từ file `.env.example` sang nếu có.
4. **Chạy Mock Database (JSON Server):**
   *(Mở một terminal thứ nhất)*

   ```bash
   npm run start:db  # Hoặc lệnh tương ứng bạn cài đặt để chạy file db.json
   ```
5. **Chạy ứng dụng React:**
   *(Mở terminal thứ hai)*

   ```bash
   npm start
   ```

   Ứng dụng sẽ tự động mở trên trình duyệt tại địa chỉ: `http://localhost:3000`

## 👥 Thành viên nhóm (Team Members)

| STT | Họ và Tên                 | Mã sinh viên | Vai trò           |
| :-: | :--------------------------- | :------------- | :----------------- |
|  1  | Nguyễn Tiến Đạt          | [Mã SV]       | Frontend Developer |
|  2  | [Điền Tên Thành Viên 2] | [Mã SV]       | Frontend Developer |
|  3  | [Điền Tên Thành Viên 3] | [Mã SV]       | Frontend Developer |
|  4  | [Điền Tên Thành Viên 4] | [Mã SV]       | Frontend Developer |

---

*Dự án được thực hiện nhằm mục đích học tập môn FER202 tại Đại học FPT.*
