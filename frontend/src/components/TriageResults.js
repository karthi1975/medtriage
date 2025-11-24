/**
 * Triage Results Component
 * Displays triage assessment results and recommendations
 */
import React from 'react';
import '../styles/TriageResults.css';

const TriageResults = ({ triageData }) => {
  if (!triageData) {
    return null;
  }

  const {
    priority,
    reasoning,
    confidence,
    red_flags,
    recommendations,
    extracted_symptoms,
    patient_context,
  } = triageData;

  // Extract patient allergies and conditions from extensions
  const patientData = patient_context?.patient;
  const allergiesFromExtensions = patientData?.allergies_from_extensions || [];
  const conditionsFromExtensions = patientData?.conditions_from_extensions || [];

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'emergency':
        return '#dc3545';
      case 'urgent':
        return '#fd7e14';
      case 'semi-urgent':
        return '#ffc107';
      case 'non-urgent':
        return '#28a745';
      default:
        return '#6c757d';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'emergency':
        return '🚨';
      case 'urgent':
        return '⚠️';
      case 'semi-urgent':
        return '⏰';
      case 'non-urgent':
        return '✓';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="triage-results">
      <h2>Triage Assessment</h2>

      <div
        className="priority-badge"
        style={{ backgroundColor: getPriorityColor(priority) }}
      >
        <span className="priority-icon">{getPriorityIcon(priority)}</span>
        <span className="priority-text">
          {priority?.toUpperCase().replace('-', ' ')}
        </span>
      </div>

      <div className="confidence-indicator">
        <strong>Confidence:</strong>{' '}
        <span className={`confidence-${confidence}`}>
          {confidence?.toUpperCase()}
        </span>
      </div>

      <div className="section">
        <h3>Assessment Reasoning</h3>
        <p>{reasoning}</p>
      </div>

      {patientData && (
        <div className="section patient-info">
          <h3>Patient Information</h3>
          <div className="patient-details">
            {patientData.name && (
              <p><strong>Name:</strong> {patientData.name}</p>
            )}
            {patientData.gender && (
              <p><strong>Gender:</strong> {patientData.gender}</p>
            )}
            {patientData.birthDate && (
              <p><strong>Birth Date:</strong> {patientData.birthDate}</p>
            )}
          </div>

          {conditionsFromExtensions.length > 0 && (
            <div className="patient-conditions">
              <h4>⚕️ Known Conditions</h4>
              <ul className="conditions-list">
                {conditionsFromExtensions.map((condition, index) => (
                  <li key={index} className="condition-item">
                    {condition}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {allergiesFromExtensions.length > 0 && (
            <div className="patient-allergies">
              <h4>🚫 Known Allergies</h4>
              <ul className="allergies-list">
                {allergiesFromExtensions.map((allergy, index) => (
                  <li key={index} className="allergy-item">
                    {allergy}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {extracted_symptoms && extracted_symptoms.length > 0 && (
        <div className="section">
          <h3>Identified Symptoms</h3>
          <ul className="symptoms-list">
            {extracted_symptoms.map((symptom, index) => (
              <li key={index}>
                <strong>{symptom.symptom}</strong>
                {symptom.severity && (
                  <span className={`severity-badge severity-${symptom.severity}`}>
                    {symptom.severity}
                  </span>
                )}
                {symptom.duration && (
                  <span className="symptom-detail">Duration: {symptom.duration}</span>
                )}
                {symptom.location && (
                  <span className="symptom-detail">Location: {symptom.location}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {red_flags && red_flags.length > 0 && (
        <div className="section red-flags">
          <h3>⚠️ Red Flags</h3>
          <ul>
            {red_flags.map((flag, index) => (
              <li key={index}>{flag}</li>
            ))}
          </ul>
        </div>
      )}

      {recommendations && (
        <div className="section recommendations">
          <h3>Care Recommendations</h3>

          {recommendations.immediate_action && (
            <div className="recommendation-item">
              <h4>Immediate Action</h4>
              <p>{recommendations.immediate_action}</p>
            </div>
          )}

          {recommendations.care_level && (
            <div className="recommendation-item">
              <h4>Recommended Care Level</h4>
              <p className="care-level">{recommendations.care_level}</p>
            </div>
          )}

          {recommendations.timeframe && (
            <div className="recommendation-item">
              <h4>Timeframe</h4>
              <p>{recommendations.timeframe}</p>
            </div>
          )}

          {recommendations.self_care_tips && recommendations.self_care_tips.length > 0 && (
            <div className="recommendation-item">
              <h4>Self-Care Tips</h4>
              <ul>
                {recommendations.self_care_tips.map((tip, index) => (
                  <li key={index}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {recommendations.warning_signs && recommendations.warning_signs.length > 0 && (
            <div className="recommendation-item warning-signs">
              <h4>Warning Signs - Seek Immediate Care If:</h4>
              <ul>
                {recommendations.warning_signs.map((sign, index) => (
                  <li key={index}>{sign}</li>
                ))}
              </ul>
            </div>
          )}

          {recommendations.follow_up && (
            <div className="recommendation-item">
              <h4>Follow-Up</h4>
              <p>{recommendations.follow_up}</p>
            </div>
          )}
        </div>
      )}

      <div className="disclaimer">
        <strong>Disclaimer:</strong> This is an AI-powered assessment tool and should not
        replace professional medical advice. Always consult with a healthcare provider for
        proper diagnosis and treatment.
      </div>
    </div>
  );
};

export default TriageResults;
