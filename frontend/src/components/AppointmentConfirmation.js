/**
 * Appointment Confirmation Component
 * Modal for confirming and booking an appointment
 */
import React, { useState } from 'react';
import { bookAppointment } from '../services/api';
import '../styles/AppointmentConfirmation.css';

const AppointmentConfirmation = ({
  slot,
  patientId,
  triageData,
  specialtyId,
  onConfirm,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);
  const [reasonForVisit, setReasonForVisit] = useState('');

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const handleConfirmBooking = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await bookAppointment(
        slot.provider.provider_id,
        slot.facility.facility_id,
        specialtyId,
        patientId,
        slot.slot_datetime,
        slot.duration_minutes,
        triageData.priority,
        reasonForVisit || `Triage: ${triageData.reasoning?.substring(0, 100)}`,
        null // triage session ID
      );

      if (response.success) {
        setSuccess(true);
        setConfirmationData(response);
      } else {
        setError(response.error || 'Booking failed');
      }
    } catch (err) {
      console.error('Booking error:', err);

      if (err.response?.status === 409) {
        setError('This slot is no longer available. Please select another slot.');
      } else {
        setError(err.response?.data?.detail || 'Failed to book appointment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (success) {
      onConfirm();
    } else {
      onCancel();
    }
  };

  return (
    <div className="appointment-confirmation-overlay">
      <div className="appointment-confirmation-modal">
        {!success ? (
          <>
            <div className="modal-header">
              <h2>Confirm Appointment</h2>
              <button className="close-btn" onClick={onCancel} aria-label="Close">
                ✕
              </button>
            </div>

            <div className="modal-content">
              <div className="confirmation-summary">
                <h3>Appointment Details</h3>

                <div className="detail-row">
                  <strong>Date & Time:</strong>
                  <span>{formatDateTime(slot.slot_datetime)}</span>
                </div>

                <div className="detail-row">
                  <strong>Duration:</strong>
                  <span>{slot.duration_minutes} minutes</span>
                </div>

                <div className="detail-row">
                  <strong>Provider:</strong>
                  <span>{slot.provider.name}, {slot.provider.credentials}</span>
                </div>

                <div className="detail-row">
                  <strong>Specialty:</strong>
                  <span>{slot.provider.specialty}</span>
                </div>

                <div className="detail-row">
                  <strong>Facility:</strong>
                  <span>{slot.facility.name}</span>
                </div>

                <div className="detail-row">
                  <strong>Address:</strong>
                  <span>{slot.facility.address}</span>
                </div>

                <div className="detail-row">
                  <strong>Phone:</strong>
                  <span>{slot.facility.phone}</span>
                </div>

                <div className="detail-row">
                  <strong>Priority:</strong>
                  <span className={`priority-badge priority-${triageData.priority}`}>
                    {triageData.priority}
                  </span>
                </div>
              </div>

              <div className="reason-for-visit">
                <label htmlFor="reasonForVisit">
                  <strong>Reason for Visit (Optional):</strong>
                </label>
                <textarea
                  id="reasonForVisit"
                  value={reasonForVisit}
                  onChange={(e) => setReasonForVisit(e.target.value)}
                  placeholder="Enter specific reason for this visit..."
                  rows="3"
                  maxLength="200"
                />
                <small>{reasonForVisit.length}/200 characters</small>
              </div>

              {error && (
                <div className="error-message">
                  <p>{error}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleConfirmBooking}
                disabled={loading}
              >
                {loading ? 'Booking...' : 'Confirm & Book Appointment'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="modal-header success-header">
              <h2>✓ Appointment Confirmed!</h2>
            </div>

            <div className="modal-content success-content">
              <div className="success-icon">
                <div className="checkmark-circle">✓</div>
              </div>

              <div className="confirmation-details">
                <h3>Your appointment has been successfully booked</h3>

                <div className="confirmation-number">
                  <strong>Confirmation Number:</strong>
                  <span className="conf-number">{confirmationData.confirmation_number}</span>
                </div>

                <div className="appointment-summary">
                  <p><strong>When:</strong> {formatDateTime(slot.slot_datetime)}</p>
                  <p><strong>Provider:</strong> {slot.provider.name}</p>
                  <p><strong>Location:</strong> {slot.facility.name}</p>
                  <p><strong>Address:</strong> {slot.facility.address}</p>
                  <p><strong>Phone:</strong> {slot.facility.phone}</p>
                </div>

                <div className="next-steps">
                  <h4>What to bring:</h4>
                  <ul>
                    <li>Photo ID</li>
                    <li>Insurance card</li>
                    <li>List of current medications</li>
                    <li>Any relevant medical records</li>
                  </ul>

                  <h4>Important:</h4>
                  <ul>
                    <li>Please arrive 15 minutes early</li>
                    <li>Call {slot.facility.phone} if you need to cancel or reschedule</li>
                    <li>A confirmation email will be sent to the patient's email address</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-primary btn-large" onClick={handleClose}>
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AppointmentConfirmation;
