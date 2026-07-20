# SPEC.md - Feature: Auth & Users

## Muc tieu

Xay dung auth-user experience gon, tin cay va dung dinh huong UI cua du an: nguoi dung chi dang nhap bang Google. Trang auth lay cam hung tu anh ieltsonlinetests.com o bo cuc login trung tam, nhung loai bo moi lua chon khong can thiet va chuan hoa theo `DESIGN.md`.

## User Stories

### US-01 - Guest dang nhap bang Google

La Guest, toi muon thay mot trang login ro rang voi nut "Continue with Google" duy nhat de dang nhap nhanh vao he thong.

Acceptance criteria:
- Trang login hien logo/ten du an, tieu de "Log in to your account" va nut Google duy nhat.
- Khong co input email, password, phone, forgot password, register link hoac social button khac.
- Nut Google dung Bootstrap 5 button/layout classes va co icon Google.
- Khi bam nut, UI chuyen sang trang thai loading va ngan double click.

### US-02 - Xu ly Google login thanh cong

La nguoi dung da co tai khoan, toi muon sau khi Google login thanh cong thi vao dung khu vuc theo role.

Acceptance criteria:
- Session user duoc luu vao localStorage hoac auth store hien co.
- Role `student`, `teacher`, `admin` duoc dieu huong lan luot ve dashboard tuong ung.
- Neu khong co role, mac dinh dua ve student dashboard hoac trang home theo quy uoc project.

### US-03 - Xu ly login that bai

La Guest, toi muon thay thong bao loi de biet dang nhap Google khong thanh cong va co the thu lai.

Acceptance criteria:
- Loi hien bang Bootstrap 5 alert.
- Nut Google quay lai trang thai enabled sau khi loi xay ra.
- Khong lam mat layout hoac gay nhay trang tren mobile.

### US-04 - Dang xuat

La user da dang nhap, toi muon dang xuat de xoa session va quay lai public area.

Acceptance criteria:
- Dang xuat xoa auth session trong localStorage/store.
- Header/Nav cap nhat trang thai user.
- Dieu huong ve `/` hoac `/login` theo route hien co.

## Functional Requirements

- FR-01: Auth UI chi co Google login.
- FR-02: Component login phai dung Bootstrap 5 grid, spacing utilities, buttons, alerts, spinner va responsive helpers.
- FR-03: Mau primary CTA uu tien `#0052ff` theo `DESIGN.md`; neu dung Bootstrap class co san, can map qua Bootstrap theme variable hoac class project-wide, khong viet CSS rieng cho auth.
- FR-04: Login page can responsive: mobile 1 cot, desktop canh giua voi max width hop ly.
- FR-05: UI can co footer/brand context nhe theo style du an, khong copy day du footer dai trong anh neu lam giam tap trung.
- FR-06: Auth service gom ham loginWithGoogle, handleGoogleCallback/mockGoogleLogin, logout, getCurrentUser.
- FR-07: Google profile toi thieu gom id/email/name/avatar.
- FR-08: User role lay tu mock API/db.json neu co; fallback mac dinh la `student`.

## Non-Functional Requirements

- NFR-01: Bootstrap 5 la bat buoc; khong dung CSS3 rieng cho auth-user.
- NFR-02: Giao dien dat WCAG co ban: button co accessible name, focus state ro, alert co role phu hop.
- NFR-03: Khong luu token that production trong repo; mock token chi dung cho dev.
- NFR-04: Khong hard-code secret OAuth client trong source.
- NFR-05: Code tach service auth va UI de de thay mock bang OAuth that.

## UI Specification

- Page background: white canvas theo `DESIGN.md`.
- Container: Bootstrap `.container`, vertical spacing lon, noi dung canh giua.
- Login panel: su dung Bootstrap utilities/card neu can, radius theo design system; khong nested card.
- Heading: Inter/system font, weight 400/600, khong dung hero-scale qua lon.
- CTA: pill button, full width tren mobile, width co dinh hop ly tren desktop.
- Google button text: "Continue with Google" hoac "Login with Google".
- Footer auth nho: copyright/legal link neu can, dung Bootstrap spacing va text-muted.

## Data & State

- `authUser`: `{ id, email, name, avatar, role, provider: "google" }`.
- `authStatus`: `idle | loading | authenticated | error`.
- `authError`: message than thien voi nguoi dung.
- Storage key de xuat: `ielts_auth_user`.

## Route & Navigation

- `/login`: Google-only login page.
- Protected routes kiem tra session.
- Sau login:
  - `admin` -> `/admin`
  - `teacher` -> `/teacher`
  - `student` -> `/student`
  - fallback -> `/student` hoac `/`

## Open Questions

- Du an se dung Google OAuth that hay mock OAuth cho milestone FER202?
- Role mapping nam trong `db.json`, localStorage hay API rieng?
- Logo/brand asset chinh thuc cua IELTS Online Learning nam o dau?
