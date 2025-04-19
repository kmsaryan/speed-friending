//MovingParticipant.jsx
// File: src/components/MovingParticipant.jsx
import React from 'react';
import '../styles/global.css';
import '../styles/Participant.css';
import walkIcon from '../asserts/walk.svg';
import timerIcon from '../asserts/timer.svg';
import IceBreakerDisplay from './IceBreakerDisplay';

function MovingParticipant({ match, timeLeft, timerActive, currentPlayerName, currentPlayerId }) {
  // Improved player name display
  const displayName = 
    currentPlayerName && currentPlayerName !== "mm" && currentPlayerName !== "undefined" 
      ? currentPlayerName 
      : "Current Player";

  // Add console logging when props change
  React.useEffect(() => {
    console.log(`[MovingParticipant] timeLeft updated: ${timeLeft}, timerActive: ${timerActive}`);
  }, [timeLeft, timerActive]);

  return (
    <div className="participant-container moving">
      <div className="participant-card">
        <div className="participant-header">
          <img src={walkIcon} alt="Moving" className="participant-icon" />
          <h1>Moving Participant</h1>
        </div>
        
        {/* Add current player info */}
        <div className="current-player-info">
          <div className="current-player-avatar">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="current-player-data">
            <h2>You: {displayName}</h2>
            <p className="participant-role">Role: Moving (You need to find your match's table)</p>
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
            The stationary player controls the conversation timer.
          </p>
          <div className="timer-status">
            Timer Status: <span className={timerActive ? "status-active" : "status-inactive"}>
              {timerActive ? "Active" : "Waiting for Start"}
            </span>
          </div>
          {/* Always display the timer, but make it more prominent when active */}
          <div className={`timer-countdown ${timerActive ? 'active' : ''}`}>
            {Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? '0' : ''}{timeLeft % 60}
          </div>
        </div>

        <IceBreakerDisplay matchId={match.matchId} />

        <div className="instruction">
          <p>Please approach table {match.tableNumber || '?'} to meet your match.</p>
          <p>After your conversation, you'll be asked to rate your interaction.</p>
        </div>
      </div>
    </div>
  );
}

export default MovingParticipant;
