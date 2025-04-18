import React, { useEffect, useState } from 'react';
import '../styles/GameControl.css';
import AdminApiService from '../services/AdminApiService';

function GameControl({ gameStatus, round, onStatusChange, onRoundChange, onMessage }) {
  const [loading, setLoading] = useState(false);

  // Fetch initial game status on component mount
  useEffect(() => {
    const fetchGameStatus = async () => {
      setLoading(true);
      try {
        const status = await AdminApiService.getGameStatus();
        console.log('Initial game status:', status);
        
        if (status) {
          onStatusChange(status.status);
          if (status.round) onRoundChange(status.round);
        }
      } catch (error) {
        console.error('Error fetching initial game status:', error);
        onMessage('Failed to fetch game status');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGameStatus();
  }, [onStatusChange, onRoundChange, onMessage]);

  const handleStartGame = async () => {
    setLoading(true);
    try {
      const result = await AdminApiService.startGame(round);
      onStatusChange('running');
      onMessage('Game started successfully! Players can now be matched.');
      console.log('Game started:', result);
    } catch (error) {
      console.error('Error starting game:', error);
      onMessage(error.message || 'Failed to start game.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleStopGame = async () => {
    setLoading(true);
    try {
      const result = await AdminApiService.stopGame();
      onStatusChange('stopped');
      onMessage('Game stopped successfully! Matching is now disabled.');
      console.log('Game stopped:', result);
    } catch (error) {
      console.error('Error stopping game:', error);
      onMessage(error.message || 'Failed to stop game.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleNextRound = async () => {
    setLoading(true);
    try {
      const result = await AdminApiService.nextRound();
      if (result && result.round) {
        onRoundChange(result.round);
        onMessage(`Advanced to round ${result.round}!`);
      }
      console.log('Round advanced:', result);
    } catch (error) {
      console.error('Error advancing round:', error);
      onMessage(error.message || 'Failed to advance to next round.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormTeams = async () => {
    try {
      const { teams } = await AdminApiService.formTeams(round);
      onMessage(`${teams.length} teams formed successfully!`);
    } catch (error) {
      console.error('Error forming teams:', error);
      onMessage(error.message || 'Failed to form teams.');
    }
  };

  return (
    <div className="admin-section">
      <h2>Game Control</h2>
      
      <div className="control-card">
        <h3>Game Status</h3>
        <div className="game-controls">
          <div className="game-status-display">
            <span className="status-label">Current Status:</span>
            <span className={`status-value ${gameStatus}`}>{loading ? 'UPDATING...' : gameStatus.toUpperCase()}</span>
          </div>
          <div className="game-buttons">
            <button 
              className="start-button" 
              onClick={handleStartGame}
              disabled={gameStatus === 'running' || loading}
            >
              {loading ? 'Processing...' : 'Start Game'}
            </button>
            <button 
              className="stop-button" 
              onClick={handleStopGame}
              disabled={gameStatus === 'stopped' || loading}
            >
              {loading ? 'Processing...' : 'Stop Game'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="control-card">
        <h3>Round Management</h3>
        <div className="round-controls">
          <div className="round-display">
            <span className="round-label">Current Round:</span>
            <span className="round-value">{round}</span>
          </div>
          <button onClick={handleNextRound} className="next-button" disabled={loading}>
            {loading ? 'Processing...' : 'Advance to Next Round'}
          </button>
        </div>
      </div>
      
      <div className="control-card">
        <h3>Team Formation</h3>
        <p>Form teams based on player ratings and preferences from the current round.</p>
        <button onClick={handleFormTeams} className="teams-button">
          Form Teams
        </button>
      </div>

      <div className="control-card">
        <h3>Match Management</h3>
        <p>View and manage current matches in progress</p>
        <button onClick={() => window.location.href = `/admin/matches/${round}`} className="view-button">
          View Current Matches
        </button>
      </div>
    </div>
  );
}

export default GameControl;
