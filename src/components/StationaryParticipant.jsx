//StationaryParticipant.jsx
// File: src/components/StationaryParticipant.jsx
// This file defines the StationaryParticipant component, which displays the details of a stationary participant after they have been matched.
import React from 'react';
import '../styles/global.css'; 
import '../styles/Participant.css';
import deskIcon from '../asserts/Stationary.svg';
import timerIcon from '../asserts/timer.svg';

function StationaryParticipant({ match, timeLeft, timerActive, toggleTimer }) {
  return (
    <div className="participant-container stationary">
      <div className="participant-card">
        <div className="participant-header">
          <img src={deskIcon} alt="Stationary" className="participant-icon" />
          <h1>Stationary Participant</h1>
        </div>
        
        <div className="participant-info">
          <div className="match-details">
            <div className="match-avatar">
              {match.name ? match.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="match-data">
              <h2>You are matched with {match.name}</h2>
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
            Either player can start or pause the timer for this conversation.
          </p>
          <div className="timer-controls">
            <button
              onClick={toggleTimer}
              className={timerActive ? "btn-warning btn-rounded" : "btn-success btn-rounded"}
            >
              {timerActive ? "Pause Timer" : "Start Interaction"}
            </button>
          </div>
          {timerActive && (
            <div className="timer-countdown">
              {Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? '0' : ''}{timeLeft % 60}
            </div>
          )}
          <div className="timer-status">
            Timer Status: <span className={timerActive ? "status-active" : "status-inactive"}>
              {timerActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <div className="instruction">
          <p>Your match will come to your table. Please stay at your position.</p>
          <p>After your conversation, you'll be asked to rate your interaction.</p>
          <p><strong>Once the timer ends, click "End Match" to make yourself available for the next match.</strong></p>
        </div>
      </div>
    </div>
  );
}

export default StationaryParticipant;
