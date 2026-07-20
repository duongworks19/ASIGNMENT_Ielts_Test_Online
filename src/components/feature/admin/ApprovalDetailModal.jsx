import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, Button, Form, Spinner, Alert, Badge } from 'react-bootstrap';
// Import from service that may not exist yet, it's mocked in testing.
import { approveRequest, rejectRequest } from '../../../services/adminService';

/**
 * Modal xem chi tiết nội dung cần kiểm duyệt (course/lesson).
 */
const ApprovalDetailModal = ({ request, isOpen, onClose, onActionSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rejectMode, setRejectMode] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  // Reset state when modal opens/closes or request changes
  useEffect(() => {
    if (isOpen) {
      setLoading(false);
      setError('');
      setRejectMode(false);
      setAdminNote('');
    }
  }, [isOpen, request]);

  if (!request) return null;

  // EARS[Event]: WHEN Admin approves content, THE system SHALL call approveRequest API.
  const handleApprove = async () => {
    setLoading(true);
    setError('');
    try {
      // Get admin ID from local storage
      const authUserStr = localStorage.getItem('ielts_auth_user');
      const authUser = authUserStr ? JSON.parse(authUserStr) : {};
      const adminId = authUser.id || 'u-admin-001';

      await approveRequest(request.id, request.targetType, request.targetId, adminId);

      onActionSuccess('approve');
    } catch (err) {
      // EARS[Unwanted]: WHERE an invalid approval action is attempted or API fails, THE system SHALL report an error.
      setError(err.response?.data?.message || err.message || 'Failed to approve request.');
    } finally {
      setLoading(false);
    }
  };

  // EARS[Event]: WHEN Admin rejects content, THE system SHALL call rejectRequest API with adminNote.
  const handleReject = async () => {
    if (!rejectMode) {
      setRejectMode(true);
      return;
    }

    if (!adminNote.trim()) {
      setError('Please provide a reason for rejection.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const authUserStr = localStorage.getItem('ielts_auth_user');
      const authUser = authUserStr ? JSON.parse(authUserStr) : {};
      const adminId = authUser.id || 'u-admin-001';

      await rejectRequest(request.id, request.targetType, request.targetId, adminId, adminNote);

      onActionSuccess('reject');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reject request.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Modal show={isOpen} onHide={handleClose} size="lg" centered backdrop="static" keyboard={false}>
      <Modal.Header closeButton={!loading}>
        <Modal.Title className="text-primary">Review Content Request</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}

        <div className="mb-4">
          <h5 className="mb-3">Request Information</h5>
          <table className="table table-bordered">
            <tbody>
              <tr>
                <th style={{ width: '30%' }}>Target Type</th>
                <td className="text-capitalize">{request.targetType}</td>
              </tr>
              <tr>
                <th>Target ID</th>
                <td>{request.targetId}</td>
              </tr>
              <tr>
                <th>Teacher ID</th>
                <td>{request.teacherId}</td>
              </tr>
              <tr>
                <th>Submission Date</th>
                <td>{request.createdAt ? new Date(request.createdAt).toLocaleString() : 'N/A'}</td>
              </tr>
              <tr>
                <th>Status</th>
                <td>
                  <Badge bg="warning" text="dark" pill>{request.status}</Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-4">
          <h5 className="mb-2">Message from Teacher</h5>
          <div className="p-3 bg-light rounded border">
            {request.message || 'No message provided.'}
          </div>
        </div>

        {rejectMode && (
          <div className="mb-3 animate__animated animate__fadeIn">
            <Form.Group>
              <Form.Label className="fw-bold text-danger">Reason for Rejection <span className="text-danger">*</span></Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Explain why this content is rejected..."
                disabled={loading}
                autoFocus
              />
            </Form.Group>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" className="rounded-pill px-4" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>

        {!rejectMode ? (
          <>
            <Button variant="danger" className="rounded-pill px-4" onClick={handleReject} disabled={loading}>
              Reject...
            </Button>
            <Button variant="success" className="rounded-pill px-4" onClick={handleApprove} disabled={loading}>
              {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Approve'}
            </Button>
          </>
        ) : (
          <Button variant="danger" className="rounded-pill px-4" onClick={handleReject} disabled={loading}>
            {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Confirm Reject'}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

ApprovalDetailModal.propTypes = {
  request: PropTypes.shape({
    id: PropTypes.string,
    targetType: PropTypes.string,
    targetId: PropTypes.string,
    teacherId: PropTypes.string,
    message: PropTypes.string,
    status: PropTypes.string,
    createdAt: PropTypes.string,
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onActionSuccess: PropTypes.func.isRequired,
};

export default ApprovalDetailModal;
