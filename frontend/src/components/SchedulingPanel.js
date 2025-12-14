/**
 * Scheduling Panel Component
 * Displays after triage assessment to schedule appointments
 */
import React, { useState } from 'react';
import SlotRecommendations from './SlotRecommendations';
import AppointmentConfirmation from './AppointmentConfirmation';
import { getSchedulingRecommendations } from '../services/api';
import '../styles/SchedulingPanel.css';

const SchedulingPanel = ({ triageData, patientId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [error, setError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [schedulingStarted, setSchedulingStarted] = useState(false);

  // Specialty mapping (based on triage reasoning or manual selection)
  const getSpecialtyId = () => {
    const reasoning = triageData?.reasoning?.toLowerCase() || '';

    if (reasoning.includes('heart') || reasoning.includes('cardio') || reasoning.includes('chest pain')) {
      return 2; // Cardiology
    } else if (reasoning.includes('bone') || reasoning.includes('fracture') || reasoning.includes('joint') || reasoning.includes('ankle') || reasoning.includes('knee')) {
      return 3; // Orthopedics
    } else if (reasoning.includes('skin') || reasoning.includes('rash') || reasoning.includes('derma')) {
      return 4; // Dermatology
    } else if (reasoning.includes('mental') || reasoning.includes('anxiety') || reasoning.includes('depression')) {
      return 5; // Mental Health
    } else {
      return 1; // Family Medicine (default)
    }
  };

  // Get patient region from patient context
  const getPatientRegion = () => {
    const address = triageData?.patient_context?.patient?.address?.[0];
    if (!address) return null;

    const city = address.city || '';

    // Map cities to Utah regions
    if (city.toLowerCase().includes('salt lake')) return 'Salt Lake Valley';
    if (city.toLowerCase().includes('provo') || city.toLowerCase().includes('orem')) return 'Utah County';
    if (city.toLowerCase().includes('ogden') || city.toLowerCase().includes('layton')) return 'Davis/Weber';
    if (city.toLowerCase().includes('logan')) return 'Cache Valley';
    if (city.toLowerCase().includes('st. george') || city.toLowerCase().includes('st george')) return 'Washington County';
    if (city.toLowerCase().includes('price') || city.toLowerCase().includes('helper')) return 'Central Utah';
    if (city.toLowerCase().includes('vernal')) return 'Uintah Basin';

    return 'Salt Lake Valley'; // Default
  };

  const handleFindSlots = async () => {
    setLoading(true);
    setError(null);
    setSchedulingStarted(true);

    try {
      const specialtyId = getSpecialtyId();
      const patientRegion = getPatientRegion();
      const priority = triageData?.priority || 'non-urgent';

      console.log('Finding slots:', { specialtyId, priority, patientRegion });

      const response = await getSchedulingRecommendations(
        specialtyId,
        priority,
        patientId,
        patientRegion,
        null, // Let backend determine date range based on urgency
        null  // triage session ID
      );

      setRecommendations(response);
    } catch (err) {
      console.error('Error getting recommendations:', err);
      setError(err.response?.data?.detail || 'Failed to find available slots. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setShowConfirmation(true);
  };

  const handleBookingComplete = () => {
    setShowConfirmation(false);
    setSelectedSlot(null);
    setRecommendations(null);
    setSchedulingStarted(false);
    if (onClose) {
      onClose();
    }
  };

  const handleBookingCancel = () => {
    setShowConfirmation(false);
    setSelectedSlot(null);
  };

  const getSpecialtyName = (id) => {
    const specialties = {
      1: 'Family Medicine',
      2: 'Cardiology',
      3: 'Orthopedics',
      4: 'Dermatology',
      5: 'Mental Health',
    };
    return specialties[id] || 'General Care';
  };

  if (!triageData) {
    return null;
  }

  const isEmergency = triageData.priority === 'emergency';

  return (
    <div className="scheduling-panel">
      <div className="scheduling-header">
        <h2>Schedule Appointment</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        )}
      </div>

      {isEmergency ? (
        <div className="emergency-warning">
          <h3>⚠️ Emergency Care Required</h3>
          <p>
            Based on the triage assessment, this patient requires emergency care.
            <strong> Please call 911 or direct the patient to the nearest emergency room.</strong>
          </p>
          <p className="emergency-note">
            Do not delay emergency care to schedule an appointment.
          </p>
        </div>
      ) : (
        <>
          {!schedulingStarted ? (
            <div className="scheduling-intro">
              <div className="triage-summary">
                <h3>Triage Summary</h3>
                <p><strong>Priority:</strong> <span className={`priority-${triageData.priority}`}>{triageData.priority}</span></p>
                <p><strong>Recommended Specialty:</strong> {getSpecialtyName(getSpecialtyId())}</p>
                {triageData.patient_context?.patient && (
                  <p><strong>Patient:</strong> {triageData.patient_context.patient.name}</p>
                )}
              </div>

              <button
                className="btn-primary btn-large"
                onClick={handleFindSlots}
                disabled={loading}
              >
                {loading ? 'Finding Available Slots...' : 'Find Available Appointment Slots'}
              </button>
            </div>
          ) : (
            <>
              {loading && (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <p>Searching for available appointment slots...</p>
                </div>
              )}

              {error && (
                <div className="error-message">
                  <p>{error}</p>
                  <button className="btn-secondary" onClick={handleFindSlots}>
                    Try Again
                  </button>
                </div>
              )}

              {recommendations && !loading && (
                <SlotRecommendations
                  recommendations={recommendations}
                  onSlotSelect={handleSlotSelect}
                  onBack={() => setSchedulingStarted(false)}
                />
              )}
            </>
          )}
        </>
      )}

      {showConfirmation && selectedSlot && (
        <AppointmentConfirmation
          slot={selectedSlot}
          patientId={patientId}
          triageData={triageData}
          specialtyId={getSpecialtyId()}
          onConfirm={handleBookingComplete}
          onCancel={handleBookingCancel}
        />
      )}
    </div>
  );
};

export default SchedulingPanel;
