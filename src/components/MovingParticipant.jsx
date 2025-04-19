//MovingParticipant.jsx
// File: src/components/MovingParticipant.jsx
import React, { useEffect, useState } from 'react';
import '../styles/global.css';
import '../styles/Participant.css';
import walkIcon from '../asserts/walk.svg';
import timerIcon from '../asserts/timer.svg';
import timerSyncService from '../utils/timerSyncService';

function MovingParticipant({ match, timeLeft, timerActive }) {
  const [currentTimeLeft, setCurrentTimeLeft] = useState(timeLeft);
  const [localTimerActive, setLocalTimerActive] = useState(timerActive);

  // Listen for timer updates directly from the timer service
  useEffect(() => {
    const unsubscribe = timerSyncService.addListener(timerState => {
      setCurrentTimeLeft(timerState.timeLeft);
      setLocalTimerActive(timerState.isActive);
    });
    
    // Always initialize with current values
    setCurrentTimeLeft(timeLeft);
    setLocalTimerActive(timerActive);
    
    return () => unsubscribe();
  }, [match.matchId]);
  
  // Also update when props change (as a fallback)
  useEffect(() => {
    setCurrentTimeLeft(timeLeft);
    setLocalTimerActive(timerActive);
  }, [timeLeft, timerActive]);

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
          <div className="timer-status">
            Timer Status: <span className={localTimerActive ? "status-active" : "status-inactive"}>
              {localTimerActive ? "Active" : "Waiting for Start"}
            </span>
          </div>
          <div className="timer-countdown">
            {Math.floor(currentTimeLeft / 60)}:{currentTimeLeft % 60 < 10 ? '0' : ''}{currentTimeLeft % 60}
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
