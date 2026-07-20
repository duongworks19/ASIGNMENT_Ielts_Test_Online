# TASKS.md - Feature: Auth & Users

## Phase 1 - Discovery & Documentation

- [x] Doc: Read `DESIGN.md` root project lam mau chung.
- [x] Doc: Rewrite auth CONTEXT.md theo Google-only auth.
- [x] Doc: Rewrite auth SPEC.md theo Bootstrap 5 va anh tham chieu.
- [x] Doc: Generate PLAN.md theo cac giai doan.
- [x] Doc: Generate TASKS.md theo cac giai doan.
- [x] Doc: Ghi log thay doi vao `.sdd/agents_changelog.md`.

## Phase 2 - Bootstrap 5 Readiness

- [x] Check: Xac nhan `bootstrap` da co trong `package.json`.
- [x] Check: Xac nhan Bootstrap CSS duoc import trong app entry.
- [x] Setup: Neu thieu, cai dat/import Bootstrap 5 theo cach project dang dung.
- [x] Guardrail: Khong tao CSS rieng cho auth-user.

## Phase 3 - Auth Service

- [x] Implement: Tao/cap nhat `src/services/authService.js`.
- [x] Implement: Them `loginWithGoogle`.
- [x] Implement: Them `logout`.
- [x] Implement: Them `getCurrentUser`.
- [x] Implement: Luu session vao localStorage key `ielts_auth_user`.
- [x] Implement: Map role tu mock user data hoac fallback `student`.

## Phase 4 - Login UI

- [x] Implement: Viet lai `src/pages/guest/Login.jsx`.
- [x] UI: Chi hien Google login CTA duy nhat.
- [x] UI: Loai bo email/password/phone/register/forgot password/social khac.
- [x] UI: Dung Bootstrap 5 grid, spacing, button, alert, spinner.
- [x] UI: Bam `DESIGN.md` cho mau, typography, radius va spacing.
- [x] UX: Them loading state va disable double click.
- [x] UX: Them error alert khi login that bai.

## Phase 5 - Routing & Authorization

- [x] Implement: Cap nhat route `/login` neu can.
- [x] Implement: Them/cap nhat protected route guard.
- [x] Implement: Dieu huong theo role sau login.
- [x] Implement: Cap nhat Navbar/Header de hien login/logout theo session neu can.

## Phase 6 - Verification

- [x] Test: Chay `npm run build`.
- [ ] Test: Kiem tra login page tren desktop.
- [ ] Test: Kiem tra login page tren mobile.
- [ ] Test: Kiem tra login success theo role.
- [ ] Test: Kiem tra logout xoa session.
- [ ] Audit: Xac nhan khong con UI auth ngoai Google.
- [ ] Doc: Cap nhat changelog sau khi code implementation hoan thanh.
