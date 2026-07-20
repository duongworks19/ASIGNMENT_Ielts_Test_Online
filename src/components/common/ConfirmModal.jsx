import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from 'react-bootstrap';

/**
 * Modal xác nhận dùng chung cho các hành động nguy hiểm.
 */
const ConfirmModal = ({ isOpen, title, message, onConfirm, onClose, variant = 'danger' }) => {
  // EARS[Event]: WHEN user clicks the confirm button, THE system SHALL trigger the onConfirm callback.
  const handleConfirm = () => {
    onConfirm();
  };

  // EARS[Event]: WHEN user clicks cancel or closes modal, THE system SHALL trigger the onClose callback.
  const handleClose = () => {
    onClose();
  };

  // EARS[Unwanted]: WHERE variant is not supported, fallback to danger.
  const getButtonVariant = () => {
    if (variant === 'warning') return 'warning';
    return 'danger'; // default for destructive actions
  };

  return (
    <Modal show={isOpen} onHide={handleClose} centered backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title className={`text-${getButtonVariant()}`}>
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-0">{message}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" className="rounded-pill px-4" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant={getButtonVariant()} className="rounded-pill px-4" onClick={handleConfirm}>
          Confirm
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

ConfirmModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['danger', 'warning']),
};

export default ConfirmModal;
