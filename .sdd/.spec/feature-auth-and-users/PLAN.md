# PLAN.md - Feature: Auth & Users

## Nguyen tac trien khai

- Lay `DESIGN.md` lam design source of truth.
- Bat buoc dung Bootstrap 5 cho UI/layout.
- Chi trien khai Google login, khong tao lai email/password/register/forgot password.
- Tach ro UI, auth service, route guard va session storage.
- Moi giai doan hoan thanh phai cap nhat `.sdd/agents_changelog.md`.

## Phase 1 - Discovery & Alignment

Muc tieu: xac nhan hien trang project va khoa pham vi Google-only auth.

Cong viec:
- Kiem tra Bootstrap 5 trong `package.json` va entry import trong `src/index.js`.
- Kiem tra route `/login`, layouts va nav hien co.
- Kiem tra `db.json` de xem user/role mock data.
- Doi chieu UI voi `DESIGN.md` va anh tham chieu.

Deliverables:
- Auth scope khong con placeholder.
- Tai lieu CONTEXT/SPEC/PLAN/TASKS duoc cap nhat.

## Phase 2 - Auth Service & State

Muc tieu: tao nen tang auth co the dung mock truoc, thay bang Google OAuth that sau.

Cong viec:
- Tao/cap nhat auth service trong `src/services`.
- Dinh nghia storage key `ielts_auth_user`.
- Tao helper `loginWithGoogle`, `logout`, `getCurrentUser`.
- Map Google profile sang role.
- Xu ly fallback role la `student`.

Deliverables:
- Auth service co API on dinh.
- Session luu/xoa duoc bang localStorage.

## Phase 3 - Login UI Bootstrap 5

Muc tieu: xay trang login Google-only theo anh tham chieu va `DESIGN.md`.

Cong viec:
- Viet lai `src/pages/guest/Login.jsx`.
- Dung Bootstrap 5 `.container`, `.row`, `.col`, `.btn`, `.spinner-border`, `.alert`, spacing utilities.
- Thiet ke logo/title/Google CTA canh giua.
- Loai bo email/password/register/social buttons khac.
- Dam bao mobile va desktop khong vo layout.

Deliverables:
- Trang login hoan chinh voi Google CTA duy nhat.
- Khong them CSS rieng cho auth-user.

## Phase 4 - Routing & Guards

Muc tieu: ket noi login voi route va protected areas.

Cong viec:
- Kiem tra/cap nhat `src/routes/AppRoutes.jsx`.
- Dieu huong sau login theo role.
- Them guard neu project chua co.
- Cap nhat Header/Navbar de hien login/logout phu hop neu can.

Deliverables:
- Guest vao `/login` dang nhap duoc.
- User da dang nhap vao dung dashboard.
- Logout xoa session va quay ve public route.

## Phase 5 - Validation & Polish

Muc tieu: dam bao tinh dung, responsive va de cham diem.

Cong viec:
- Chay build/test/lint neu script san co.
- Kiem tra desktop va mobile.
- Kiem tra trang thai loading/error.
- Kiem tra khong con UI email/password/register trong auth page.
- Cap nhat changelog voi file da thay doi.

Deliverables:
- Build thanh cong.
- Checklist TASKS duoc cap nhat.
- `.sdd/agents_changelog.md` co log moi.

## Rui ro & Giam thieu

- Google OAuth production can client id/redirect URI: dung mock login trong milestone dau, tach service de thay sau.
- Bootstrap theme primary mac dinh khac `#0052ff`: uu tien bien theme/toan cuc thay vi CSS rieng cho auth.
- Role mapping chua ro: fallback `student` va ghi ro open question.
