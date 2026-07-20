# CONTEXT.md - Feature: Auth & Users

## Tong quan

Feature Auth & Users cung cap luong xac thuc duy nhat cho du an IELTS Online Learning: **dang nhap bang Google**. Pham vi nay thay the cac placeholder cu ve dang ky, email/password, quen mat khau va social login khac.

Thiet ke tham chieu anh login cua ieltsonlinetests.com: man hinh dang nhap tap trung o giua, logo/brand tren dau, tieu de lon, nut Google noi bat, footer thong tin o duoi. Khi ap dung vao du an nay, giao dien phai bam theo `DESIGN.md` o root du an lam mau chung: canvas trang, typography Inter thay the CoinbaseSans/CoinbaseDisplay, primary CTA mau `#0052ff`, button dang pill, card radius lon va spacing rong.

## Rang buoc bat buoc

- Chi ho tro Google authentication.
- Khong hien thi form Email/Password, Login by phone, Login by email, Forgot password, Create account, WeChat, Facebook, Twitter.
- Bat buoc dung Bootstrap 5 classes/components cho layout va UI.
- Khong viet CSS3 rieng cho feature auth-user, tru khi can override cuc nho da duoc phe duyet sau nay.
- Khong tu tao he thong design moi; moi mau sac, spacing, radius, typography phai tham chieu `DESIGN.md`.
- Moi thay doi cua AI Agent phai ghi vao `.sdd/agents_changelog.md`.

## Nguoi dung muc tieu

- Guest: truy cap trang login va bam "Continue with Google".
- Student/Teacher/Admin: duoc dieu huong sau khi Google login thanh cong dua tren role trong mock user data hoac API sau nay.

## Pham vi chuc nang

- Trang `/login` hoac auth route tuong duong.
- Nut dang nhap Google la CTA duy nhat.
- Xu ly loading khi dang chuyen huong Google.
- Xu ly loi khi Google login that bai.
- Luu session user sau login bang co che hien co cua du an, uu tien localStorage/mock API trong giai doan FER202.
- Dieu huong theo role sau login.
- Dang xuat va xoa session.

## Ngoai pham vi

- Dang ky bang email/password.
- Quen mat khau/reset password.
- Login bang phone/email/password.
- Login bang WeChat/Facebook/Twitter.
- Quan ly profile chi tiet.
- Backend OAuth production day du; giai doan dau co the mock Google OAuth response.

## Phu thuoc

- React/CRA hien co.
- React Router hien co.
- Bootstrap 5 da co trong du an hoac can cai dat neu thieu.
- JSON Server/mock API neu can map Google profile voi role.
- `DESIGN.md` lam design source of truth.
