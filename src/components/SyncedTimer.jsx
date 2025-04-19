import React, { useState, useEffect } from 'react';
import timerSyncService from '../utils/timerSyncService';
import '../styles/SyncedTimer.css';

const SyncedTimer = ({ matchId, showControls = false, onTimerEnd = null }) => {
  const [timeLeft, setTimeLeft] = useState(180);
  const [isActive, setIsActive] = useState(false);
  const [syncStatus, setSyncStatus] = useState('synced'); // synced, syncing, drifting
  const [timeDrift, setTimeDrift] = useState(0);

  useEffect(() => {
    if (!matchId) return;
    
    // Initialize the timer service with the match ID
    timerSyncService.initializeTimer(matchId, 180);
    
    // Subscribe to timer updates
    const unsubscribe = timerSyncService.addListener(timerState => {
      setTimeLeft(timerState.timeLeft);
      setIsActive(timerState.isActive);
      setTimeDrift(timerState.drift || 0);
      
      // Determine sync status based on drift
      if (Math.abs(timerState.drift) > 2000) {
        setSyncStatus('drifting');
      } else if (Math.abs(timerState.drift) > 500) {
        setSyncStatus('syncing');
      } else {
        setSyncStatus('synced');
      }
      
      // If timer has ended, notify parent component
      if (timerState.timedOut && onTimerEnd) {
        onTimerEnd();
      }
    });
    
    // Clean up when unmounting or when matchId changes
    return () => {
      unsubscribe();
    };
  }, [matchId, onTimerEnd]);

  // Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle timer toggle
  const handleToggleTimer = () => {
    timerSyncService.toggleTimer();
  };

  // Handle manual sync request
  const handleSyncNow = () => {
    timerSyncService.requestSync();
    setSyncStatus('syncing');
  };

  return (
    <div className="synced-timer">
      <div className={`timer-display ${isActive ? 'active' : 'paused'}`}>
        <span className="time">{formatTime(timeLeft)}</span>
        <div className={`sync-indicator ${syncStatus}`}>
          <div className="sync-dot"></div>
          <span className="sync-text">
            {syncStatus === 'synced' ? 'Synced' : 
             syncStatus === 'syncing' ? 'Syncing...' : 
             'Out of sync'}
          </span>
        </div>
      </div>
      
      {showControls && (
        <div className="timer-controls">
          <button 
            className={`timer-button ${isActive ? 'pause' : 'start'}`}
            onClick={handleToggleTimer}
          >
            {isActive ? 'Pause' : 'Start'}
          </button>
          <button 
            className="sync-button" 
            onClick={handleSyncNow}
            disabled={syncStatus === 'syncing'}
          >
            Sync Now
          </button>
        </div>
      )}
      
      {process.env.NODE_ENV !== 'production' && (
        <div className="timer-debug">
          <small>Drift: {Math.round(timeDrift)}ms</small>
        </div>
      )}
    </div>
  );
};

export default SyncedTimer;
