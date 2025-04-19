import React, { useEffect, useState } from 'react';
import '../styles/GameControl.css';
import AdminApiService from '../services/AdminApiService';

function GameControl({ gameStatus, round, onStatusChange, onRoundChange, onMessage }) {
  const [isLoading, setIsLoading] = useState(false);

  // Fetch initial game status on component mount
  useEffect(() => {
    const fetchGameStatus = async () => {
      setIsLoading(true);
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
        setIsLoading(false);
      }
    };
    
    fetchGameStatus();
  }, [onStatusChange, onRoundChange, onMessage]);

  const handleStartGame = async () => {
    setIsLoading(true);
    try {
      const result = await AdminApiService.startGame(round);
      onStatusChange('running');
      onMessage('Game started successfully! Players can now be matched.');
      console.log('Game started:', result);
    } catch (error) {
      console.error('Error starting game:', error);
      onMessage(error.message || 'Failed to start game.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleStopGame = async () => {
    setIsLoading(true);
    try {
      const result = await AdminApiService.stopGame();
      onStatusChange('stopped');
      onMessage('Game stopped successfully! Matching is now disabled.');
      console.log('Game stopped:', result);
    } catch (error) {
      console.error('Error stopping game:', error);
      onMessage(error.message || 'Failed to stop game.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleNextRound = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
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

  const handleResetRound = async () => {
    if (!window.confirm('Are you sure you want to reset the round to 1? This will affect all players.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      const { round: newRound } = await AdminApiService.resetRound();
      onRoundChange(newRound);
      onMessage('Round reset to 1 successfully');
      setIsLoading(false);
    } catch (error) {
      console.error('Error resetting round:', error);
      onMessage(`Error: ${error.message}`);
      setIsLoading(false);
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
            <span className={`status-value ${gameStatus}`}>{isLoading ? 'UPDATING...' : gameStatus.toUpperCase()}</span>
          </div>
          <div className="game-buttons">
            <button 
              className="start-button" 
              onClick={handleStartGame}
              disabled={gameStatus === 'running' || isLoading}
            >
              {isLoading ? 'Processing...' : 'Start Game'}
            </button>
            <button 
              className="stop-button" 
              onClick={handleStopGame}
              disabled={gameStatus === 'stopped' || isLoading}
            >
              {isLoading ? 'Processing...' : 'Stop Game'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="control-card">
        <h3>Round Management</h3>
        <p>Manage the rounds of the speed friending event. The game has only 2 rounds: individual matching and team battles.</p>
        
        <div className="round-controls">
          <div className="round-display">
            <span className="round-label">Current Round:</span>
            <span className="round-value">{round}</span>
          </div>
          
          <div className="round-buttons">
            <button 
              onClick={handleNextRound}
              className="btn-primary"
              disabled={isLoading || gameStatus !== 'running' || round >= 2}
              title={round >= 2 ? "Maximum round reached" : ""}
            >
              Next Round
            </button>
            <button 
              onClick={handleResetRound}
              className="btn-warning"
              disabled={isLoading || round === 1}
              title={round === 1 ? "Already at round 1" : ""}
            >
              Reset to Round 1
            </button>
          </div>
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
