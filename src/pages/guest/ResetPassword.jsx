import React, { useMemo, useState } from 'react';
import { Alert, Button, Card, Container, Form, Spinner } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../../services/authService';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.newPassword)) {
      setError('Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await resetPassword({ token, ...form });
      setSuccess(response.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return <Container className="py-5"><Alert variant="danger">Liên kết đặt lại mật khẩu không hợp lệ.</Alert></Container>;
  }

  return (
    <Container className="py-5" style={{ maxWidth: 560 }}>
      <Card className="border-0 shadow-sm p-4"><Card.Body>
        <h1 className="h3 fw-bold">Đặt lại mật khẩu</h1>
        <p className="text-muted">Mật khẩu mới cần ít nhất 8 ký tự, có chữ hoa, chữ thường và số.</p>
        {error && <Alert variant="danger">{error}</Alert>}
        {success ? (
          <Alert variant="success">{success} <Link to="/login">Đăng nhập</Link></Alert>
        ) : (
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="newPassword">
              <Form.Label>Mật khẩu mới</Form.Label>
              <Form.Control type="password" autoComplete="new-password" value={form.newPassword} onChange={(event) => setForm((old) => ({ ...old, newPassword: event.target.value }))} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="confirmPassword">
              <Form.Label>Xác nhận mật khẩu mới</Form.Label>
              <Form.Control type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(event) => setForm((old) => ({ ...old, confirmPassword: event.target.value }))} />
            </Form.Group>
            <Button type="submit" className="w-100" disabled={submitting}>
              {submitting ? <><Spinner size="sm" className="me-2" />Đang lưu...</> : 'Đặt lại mật khẩu'}
            </Button>
          </Form>
        )}
      </Card.Body></Card>
    </Container>
  );
}
