# IELTS Online Learning – FER202

Nền tảng học IELTS dùng React 19 và JSON Server mở rộng bằng `server.js`. Đây là dự án học tập FER202, không phải backend production. Luồng Auth dùng bcrypt và JWT thật, nhưng vẫn chịu giới hạn của database JSON một tiến trình.

## Công nghệ

- React 19, React Router DOM, React Bootstrap
- Axios, React Hook Form, Zod
- JSON Server/LowDB và custom routes trong `server.js`
- `bcryptjs`, `jsonwebtoken`, `dotenv`
- Jest và React Testing Library

## Cài đặt và chạy

Yêu cầu Node.js 18+ và npm.

```bash
npm ci
```

Copy `.env.example` thành `.env`, sau đó thay `JWT_SECRET` bằng một chuỗi bí mật dài chỉ dùng trên máy của bạn. Không commit `.env` hoặc JWT secret thật.

```dotenv
REACT_APP_API_URL=http://localhost:9999
JWT_SECRET=your-long-local-secret
JWT_EXPIRES_IN=2h
RESET_TOKEN_MINUTES=15
DEMO_RESET_MODE=true
```

Chạy frontend và mock backend cùng lúc:

```bash
npm start
```

Lưu ý: script `start` mặc định chạy cả React và server qua `concurrently`. Nếu muốn chạy riêng, dùng `npm run server` trong terminal thứ nhất và `npx react-scripts start` trong terminal thứ hai.

Không chạy `json-server --watch database.json --port 9999`: lệnh raw này không nạp `server.js`, vì vậy toàn bộ `/auth/*` sẽ trả 404. Có thể kiểm tra đúng backend bằng `GET http://localhost:9999/health`; response phải có `authRoutes: true`.

Frontend mặc định ở `http://localhost:3000`, API ở `http://localhost:9999`.

## Tài khoản demo

| Role | Email | Password | Trạng thái |
| --- | --- | --- | --- |
| Student | `manhnd@student.com` | `12345678` | Active, tài khoản seed cũ |
| Teacher | `teacher@ieltslearning.com` | `12345678` | Active, tài khoản seed cũ |
| Admin | `admin@ieltslearning.com` | `12345678` | Active, tài khoản seed cũ |
| Student | `locked.student@ieltslearning.com` | `LockedPass1` | Locked, dùng kiểm tra chặn đăng nhập |

Mật khẩu seed cũ vẫn được giữ để nhóm demo không mất quyền truy cập, nhưng trong `database.json` chỉ lưu bcrypt hash. Tài khoản tạo mới và mật khẩu mới phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số.

## Migration password seed

Nếu nhận một `database.json` cũ còn field `password`, sao lưu/commit dữ liệu cần giữ rồi chạy:

```bash
npm run migrate:passwords
```

Script có thể chạy lại: chỉ hash account chưa có `passwordHash`, xóa plaintext `password`, normalize email và bảo đảm collection `passwordResetTokens` tồn tại. Không sửa hash bằng tay.

## Forgot Password trong demo

1. Mở `/forgot-password` và nhập email.
2. Response luôn dùng thông báo chung, không xác nhận account có tồn tại.
3. Khi `DEMO_RESET_MODE=true` và không ở production, account hợp lệ nhận một link demo trên UI.
4. Mở link, nhập password mới và xác nhận. Token được tạo bằng `crypto.randomBytes`, chỉ lưu SHA-256 hash, có expiry và chỉ dùng một lần.

Đây không phải email reset production: dự án không gửi email thật. Ở `NODE_ENV=production`, server không trả link demo.

## Lệnh kiểm tra

```bash
npm ci
npm run build
CI=true npm test -- --watchAll=false
```

Trên PowerShell bị chặn execution policy, dùng `npm.cmd` thay cho `npm`.

## Tài liệu Auth/Admin

- `AUTH_ADMIN_AUDIT.md`: baseline và danh sách lỗi đã audit.
- `AUTH_ADMIN_IMPLEMENTATION.md`: kiến trúc, endpoints, rule quản trị và kịch bản test.

## Giới hạn

- JSON/LowDB không thay thế database có transaction, unique constraint và locking phân tán.
- Access token được lưu localStorage nên vẫn phụ thuộc an toàn XSS của frontend; dự án không triển khai refresh token hoặc cookie HttpOnly.
- Reset link chỉ hiển thị trực tiếp trong demo, không tích hợp email provider.
- JWT development fallback chỉ giúp chạy bài tập; luôn cấu hình `JWT_SECRET` trong `.env`.
