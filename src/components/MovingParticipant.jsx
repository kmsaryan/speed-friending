//MovingParticipant.jsx
// File: src/components/MovingParticipant.jsx
import React from 'react';
import '../styles/global.css'; // Replace colors.css import with global.css
import '../styles/Participant.css';
import walkIcon from '../asserts/walk.svg';
import timerIcon from '../asserts/timer.svg'; // Add timer icon import

function MovingParticipant({ match, timeLeft, timerActive }) {
  return (
    <div className="participant-container moving">
      <div className="participant-card">
        <div className="participant-header">
          <img src={walkIcon} alt="Moving" className="participant-icon" />
          <h1>Moving Participant</h1>
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
              
              <div className="table-info">
                <p><strong>Find this person at table:</strong> {match.tableNumber || 'Table number not specified'}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="timer-status-container">
          <div className="timer-icon-container">
            <img src={timerIcon} alt="Timer" className="timer-icon" />
          </div>
          <p className="timer-instruction">
            The stationary player will control the timer for this conversation.
          </p>
          <div className="timer-status">
            Timer Status: <span className={timerActive ? "status-active" : "status-inactive"}>
              {timerActive ? "Active" : "Waiting to Start"}
            </span>
          </div>
        </div>

        <div className="instruction">
          <p>Please approach table {match.tableNumber || '?'} to meet your match.</p>
          <p>After your conversation, you'll be asked to rate your interaction.</p>
        </div>
      </div>
    </div>
  );
}

export default MovingParticipant;
