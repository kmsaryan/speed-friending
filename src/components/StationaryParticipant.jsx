//StationaryParticipant.jsx
// File: src/components/StationaryParticipant.jsx
// This file defines the StationaryParticipant component, which displays the details of a stationary participant after they have been matched.
import React from 'react';
import '../styles/global.css'; 
import '../styles/Participant.css';
import deskIcon from '../asserts/Stationary.svg';
import timerIcon from '../asserts/timer.svg';
import IceBreakerDisplay from './IceBreakerDisplay';
import LoadingSpinner from '../components/LoadingSpinner'; // Import LoadingSpinner

function StationaryParticipant({ match, timeLeft, timerActive, currentPlayerName, currentPlayerId }) {
  // Improved player name display
  const displayName = 
    currentPlayerName && currentPlayerName !== "mm" && currentPlayerName !== "undefined" 
      ? currentPlayerName 
      : "Current Player";

  if (!match) {
    return <LoadingSpinner message="Loading match details..." />;
  }

  return (
    <div className="participant-container stationary">
      <div className="participant-card">
        <div className="participant-header">
          <img src={deskIcon} alt="Stationary" className="participant-icon" />
          <h1>Stationary Participant</h1>
        </div>
        
        {/* Add current player info */}
        <div className="current-player-info">
          <div className="current-player-avatar">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="current-player-data">
            <h2>You: {displayName}</h2>
            <p className="participant-role">Role: Stationary (Please stay at your table)</p>
            <p className="participant-id">ID: {currentPlayerId || 'Unknown'}</p>
          </div>
        </div>
        
        {/* Add visual separator */}
        <div className="participant-separator">
          <span>Matched With</span>
        </div>
        
        <div className="participant-info">
          <div className="match-details">
            <div className="match-avatar">
              {match.name ? match.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="match-data">
              <h2>Your match: {match.name}</h2>
              <p><strong>Gender:</strong> {match.gender || 'Not specified'}</p>
              <p><strong>Interests:</strong> {match.interests || 'Not specified'}</p>
              {match.preferences && <p><strong>Preferences:</strong> {match.preferences}</p>}
            </div>
          </div>
        </div>

        <div className="timer-status-container">
          <div className="timer-icon-container">
            <img src={timerIcon} alt="Timer" className="timer-icon" />
          </div>
          <p className="timer-instruction">
            As the stationary player, you control the conversation timer.
          </p>
          <div className="timer-status">
            Timer Status: <span className={timerActive ? "status-active" : "status-inactive"}>
              {timerActive ? "Active" : "Inactive"}
            </span>
          </div>
          {timerActive && (
            <div className="timer-countdown">
              {Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? '0' : ''}{timeLeft % 60}
            </div>
          )}
        </div>

        <IceBreakerDisplay matchId={match.matchId} />

        <div className="instruction">
          <p>Your match will come to your table. Please stay at your position.</p>
          <p>After your conversation, you'll be asked to rate your interaction.</p>
        </div>
      </div>
    </div>
  );
}

export default StationaryParticipant;
