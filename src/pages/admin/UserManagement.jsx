import React, { useState, useEffect, useCallback } from 'react';
import { Table, Form, Button, Dropdown, Spinner, Alert, Card, Container } from 'react-bootstrap';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmModal from '../../components/common/ConfirmModal';
import { getUsers, updateUserRole, updateUserStatus, deleteUser } from '../../services/adminService';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ role: '', status: '', q: '' });
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0); 
  
  // For Confirm Modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger',
    actionData: null,
    actionType: '', // 'role', 'status', 'delete'
  });

  const authUserStr = localStorage.getItem('ielts_auth_user');
  const currentAdmin = authUserStr ? JSON.parse(authUserStr) : {};

  // Fetch users logic
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // EARS[Event]: WHEN Admin fetches the user list, THE system SHALL support filtering
      const params = { _page: page, _per_page: 10 };
      if (filters.q) params.q = filters.q;
      if (filters.role) params.role = filters.role;
      if (filters.status) params.status = filters.status;
      
      const response = await getUsers(params);
      const resData = response?.data || response;
      
      // json-server v1+ returns { items: N, data: [...] } when using pagination
      if (resData && typeof resData === 'object' && !Array.isArray(resData) && resData.data) {
        setUsers(Array.isArray(resData.data) ? resData.data : []);
        setTotalUsers(resData.items !== undefined ? resData.items : (resData.data.length || 0));
      } else {
        // fallback for older json-server
        setUsers(Array.isArray(resData) ? resData : []);
        setTotalUsers(response?.headers?.['x-total-count'] || resData?.length || 0);
      }
    } catch (err) {
      setError('Failed to fetch users. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1); // reset to first page
  };

  const openConfirmModal = (actionType, user, newValue) => {
    // EARS[Unwanted]: WHERE Admin attempts to change their own role or status, THE system SHALL block the action
    if (user.id === currentAdmin.id) {
      setError("You cannot modify your own account.");
      return;
    }

    let title = '';
    let message = '';
    let variant = 'danger';

    if (actionType === 'role') {
      title = 'Change User Role';
      message = `Are you sure you want to change role of ${user.name || user.fullName} to ${newValue}?`;
      variant = 'warning';
    } else if (actionType === 'status') {
      title = 'Change User Status';
      message = `Are you sure you want to change status of ${user.name || user.fullName} to ${newValue}?`;
      variant = newValue === 'banned' ? 'danger' : 'warning';
    } else if (actionType === 'delete') {
      title = 'Delete User';
      message = `Are you sure you want to permanently delete ${user.name || user.fullName}? This action cannot be undone.`;
      variant = 'danger';
    }

    setConfirmModal({
      isOpen: true,
      title,
      message,
      variant,
      actionData: { userId: user.id, newValue },
      actionType,
    });
  };

  const handleConfirmAction = async () => {
    const { actionType, actionData } = confirmModal;
    const { userId, newValue } = actionData;
    
    try {
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
      setLoading(true);

      if (actionType === 'role') {
        // EARS[Event]: WHEN Admin changes a user's role, THE system SHALL update users.role
        await updateUserRole(userId, newValue);
      } else if (actionType === 'status') {
        // EARS[Event]: WHEN Admin changes a user's status, THE system SHALL update users.status
        let lockedUntil = null;
        if (newValue === 'locked') {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1); // Mock 1 day lock
          lockedUntil = tomorrow.toISOString();
        }
        await updateUserStatus(userId, newValue, lockedUntil);
      } else if (actionType === 'delete') {
        // EARS[Event]: WHEN Admin deletes a user, THE system SHALL remove them
        await deleteUser(userId);
      }
      
      // Refresh list
      fetchUsers();
    } catch (err) {
      setError(`Action failed: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div style={{ margin: '-16px -24px 0', background: 'var(--tp-page-bg)', minHeight: '100vh' }}>
      <div className="tp-page-header">
        <div className="tp-page-header-inner">
          <div>
            <div className="tp-page-badge"><i className="bi bi-people-fill"></i> Quản lý</div>
            <h1 className="tp-page-title">Người dùng</h1>
            <p className="tp-page-sub">Quản lý toàn bộ người dùng trong hệ thống (Học viên, Giáo viên, Admin)</p>
          </div>
        </div>
      </div>

      <div className="tp-main-content">
        <Container fluid="xxl" className="px-4">

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

      <Card className="studio-filter-card mb-4">
          <Form className="row g-3">
            <div className="col-md-4">
              <Form.Control 
                type="text" 
                placeholder="Search by name or email..." 
                name="q"
                value={filters.q}
                onChange={handleFilterChange}
                className="tp-input"
              />
            </div>
            <div className="col-md-3">
              <Form.Select name="role" value={filters.role} onChange={handleFilterChange} className="tp-input">
                <option value="">All Roles</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </Form.Select>
            </div>
            <div className="col-md-3">
              <Form.Select name="status" value={filters.status} onChange={handleFilterChange} className="tp-input">
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="locked">Locked</option>
                <option value="banned">Banned</option>
              </Form.Select>
            </div>
            <div className="col-md-2">
              <Button variant="outline-secondary" className="w-100 rounded-pill" onClick={() => setFilters({ role: '', status: '', q: '' })}>
                Clear Filter
              </Button>
            </div>
          </Form>
      </Card>

      <Card className="studio-table-card">
          <div className="table-responsive">
            <Table responsive hover className="align-middle">
            <thead>
              <tr>
                <th className="ps-4">Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created At</th>
                <th className="text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                users.map(user => {
                  const isSelf = user.id === currentAdmin.id;
                  return (
                    <tr key={user.id}>
                      <td className="ps-4 fw-medium">{user.name || user.fullName}</td>
                      <td className="text-muted">{user.email}</td>
                      <td className="text-capitalize">{user.role}</td>
                      <td><StatusBadge status={user.status} /></td>
                      <td className="text-muted">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                      <td className="text-end pe-4">
                        <Dropdown align="end">
                          <Dropdown.Toggle 
                            variant="light" 
                            size="sm" 
                            className="rounded-pill border-0 action-toggle"
                            disabled={isSelf}
                            title={isSelf ? "Cannot modify your own account" : "Actions"}
                          >
                            Manage
                          </Dropdown.Toggle>
                          
                          <Dropdown.Menu className="shadow-sm border-0">
                            <Dropdown.Header>Change Role</Dropdown.Header>
                            {user.role !== 'admin' && <Dropdown.Item onClick={() => openConfirmModal('role', user, 'admin')}>Make Admin</Dropdown.Item>}
                            {user.role !== 'teacher' && <Dropdown.Item onClick={() => openConfirmModal('role', user, 'teacher')}>Make Teacher</Dropdown.Item>}
                            {user.role !== 'student' && <Dropdown.Item onClick={() => openConfirmModal('role', user, 'student')}>Make Student</Dropdown.Item>}
                            
                            <Dropdown.Divider />
                            <Dropdown.Header>Change Status</Dropdown.Header>
                            {user.status !== 'active' && <Dropdown.Item className="text-success" onClick={() => openConfirmModal('status', user, 'active')}>Set Active</Dropdown.Item>}
                            {user.status !== 'locked' && <Dropdown.Item className="text-warning" onClick={() => openConfirmModal('status', user, 'locked')}>Lock Account</Dropdown.Item>}
                            {user.status !== 'banned' && <Dropdown.Item className="text-danger" onClick={() => openConfirmModal('status', user, 'banned')}>Ban Account</Dropdown.Item>}
                            
                            <Dropdown.Divider />
                            <Dropdown.Item className="text-danger fw-bold" onClick={() => openConfirmModal('delete', user, null)}>
                              Delete User
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
              </Table>
            </div>
          </Card>
        </Container>
      </div>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        onConfirm={handleConfirmAction}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default UserManagement;
