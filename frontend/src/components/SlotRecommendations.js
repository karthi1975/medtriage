/**
 * Slot Recommendations Component
 * Displays top recommended appointment slots
 */
import React from 'react';
import '../styles/SlotRecommendations.css';

const SlotRecommendations = ({ recommendations, onSlotSelect, onBack }) => {
  if (!recommendations || recommendations.recommendations.length === 0) {
    return (
      <div className="no-slots">
        <h3>No Available Slots Found</h3>
        <p>We couldn't find any available appointment slots matching your criteria.</p>
        <p>Please try:</p>
        <ul>
          <li>Contacting the facility directly</li>
          <li>Checking back later</li>
          <li>Selecting a different date range</li>
        </ul>
        {onBack && (
          <button className="btn-secondary" onClick={onBack}>
            Go Back
          </button>
        )}
      </div>
    );
  }

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

  const formatTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getMatchScoreColor = (score) => {
    if (score >= 0.8) return 'score-excellent';
    if (score >= 0.6) return 'score-good';
    if (score >= 0.4) return 'score-fair';
    return 'score-low';
  };

  const getRankBadge = (index) => {
    const ranks = ['🥇 Best Match', '🥈 2nd Best', '🥉 3rd Best'];
    return ranks[index] || `#${index + 1}`;
  };

  return (
    <div className="slot-recommendations">
      <div className="recommendations-header">
        <h3>Recommended Appointment Slots</h3>
        <p className="results-count">
          Found {recommendations.total_options_found} available {recommendations.total_options_found === 1 ? 'slot' : 'slots'}
        </p>
      </div>

      <div className="slots-list">
        {recommendations.recommendations.map((slot, index) => (
          <div key={index} className="slot-card">
            <div className="slot-rank">
              <span className="rank-badge">{getRankBadge(index)}</span>
              <span className={`match-score ${getMatchScoreColor(slot.match_score)}`}>
                {Math.round(slot.match_score * 100)}% Match
              </span>
            </div>

            <div className="slot-content">
              <div className="slot-datetime">
                <div className="date-large">{formatDate(slot.slot_datetime)}</div>
                <div className="time-large">{formatTime(slot.slot_datetime)}</div>
                <div className="duration">{slot.duration_minutes} minutes</div>
              </div>

              <div className="provider-info">
                <h4>{slot.provider.name}</h4>
                <div className="provider-details">
                  <span className="specialty">{slot.provider.specialty}</span>
                  <span className="credentials">{slot.provider.credentials}</span>
                  <span className="experience">{slot.provider.years_experience} years exp.</span>
                </div>
                {slot.provider.languages && slot.provider.languages.length > 0 && (
                  <div className="languages">
                    <strong>Languages:</strong> {slot.provider.languages.join(', ')}
                  </div>
                )}
                <div className="npi">NPI: {slot.provider.npi}</div>
              </div>

              <div className="facility-info">
                <h5>📍 {slot.facility.name}</h5>
                <p className="address">{slot.facility.address}</p>
                <p className="city-region">
                  {slot.facility.city}, {slot.facility.region}
                </p>
                <p className="phone">📞 {slot.facility.phone}</p>
                {slot.distance_miles !== null && slot.distance_miles > 0 && (
                  <p className="distance">🚗 Approximately {slot.distance_miles} miles away</p>
                )}
              </div>

              {slot.reasoning && (
                <div className="slot-reasoning">
                  <strong>Why this slot:</strong>
                  <p>{slot.reasoning}</p>
                </div>
              )}

              <button
                className="btn-primary btn-book"
                onClick={() => onSlotSelect(slot)}
              >
                Select This Appointment
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="recommendations-footer">
        {onBack && (
          <button className="btn-secondary" onClick={onBack}>
            ← Search Again
          </button>
        )}
      </div>

      <div className="scheduling-note">
        <p>
          <strong>Note:</strong> Appointment slots are held for 5 minutes during booking.
          After selection, you'll have a chance to review and confirm.
        </p>
      </div>
    </div>
  );
};

export default SlotRecommendations;
