import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminApiService from '../services/AdminApiService';
import LiveMatchTable from './LiveMatchTable'; // Import LiveMatchTable
import '../../styles/global.css';
import '../styles/GameControl.css';

function GameControl({ gameStatus, round, onStatusChange, onRoundChange, onMessage, onTabChange, onResetRound }) {
  const [gameStarting, setGameStarting] = useState(false);
  const [gameStopping, setGameStopping] = useState(false);
  const [nextingRound, setNextingRound] = useState(false);
  const [resettingRound, setResettingRound] = useState(false);
  const [showMatches, setShowMatches] = useState(false);
  const [formingTeams, setFormingTeams] = useState(false);
  const [controlMessage, setControlMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGameStatus = async () => {
      try {
        const status = await AdminApiService.getGameStatus();
        if (status) {
          onStatusChange(status.status);
          if (status.round) onRoundChange(status.round);
        }
      } catch (error) {
        console.error('Error fetching initial game status:', error);
        onMessage('Failed to fetch game status');
      }
    };

    fetchGameStatus();
  }, [onStatusChange, onRoundChange, onMessage]);

  const handleStartGame = async () => {
    setGameStarting(true);
    try {
      const result = await AdminApiService.startGame(round);
      onStatusChange('running');
      onMessage(`Game started for round ${round}`);
    } catch (error) {
      console.error('Error starting game:', error);
      onMessage(`Error: ${error.message}`);
    } finally {
      setGameStarting(false);
    }
  };

  const handleStopGame = async () => {
    setGameStopping(true);
    try {
      const result = await AdminApiService.stopGame();
      onStatusChange('stopped');
      onMessage('Game stopped successfully');
    } catch (error) {
      console.error('Error stopping game:', error);
      onMessage(`Error: ${error.message}`);
    } finally {
      setGameStopping(false);
    }
  };

  const handleNextRound = async () => {
    setNextingRound(true);
    try {
      if (round === 1) {
        const teamsResult = await AdminApiService.formTeams(1);
        const teamCount = teamsResult.teams?.length || 0;

        if (teamCount > 0) {
          onMessage(`${teamCount} teams formed based on round 1 player ratings.`);
        } else {
          onMessage('No compatible teams could be formed. Please check player ratings from round 1.');
        }

        const result = await AdminApiService.nextRound();
        if (result && result.round) {
          onRoundChange(result.round);
          onMessage(`Advanced to round ${result.round} (Team Battles)`);
        }
      } else {
        const result = await AdminApiService.nextRound();
        if (result && result.round) {
          onRoundChange(result.round);
          onMessage(`Advanced to round ${result.round}`);
        }
      }
    } catch (error) {
      console.error('Error advancing round:', error);
      onMessage(error.message || 'Failed to advance to next round.');
    } finally {
      setNextingRound(false);
    }
  };

  const handleResetRound = async () => {
    if (!window.confirm('Are you sure you want to reset the round to 1? This will affect all players.')) {
      return;
    }

    setResettingRound(true);
    try {
      const { round: newRound } = await AdminApiService.resetRound();
      onRoundChange(newRound);
      onMessage('Round reset to 1 successfully');
    } catch (error) {
      console.error('Error resetting round:', error);
      onMessage(`Error: ${error.message}`);
    } finally {
      setResettingRound(false);
    }
  };

  const handleFormTeams = async () => {
    setFormingTeams(true);
    try {
      const response = await AdminApiService.formTeams(round);
      onMessage(`Teams formed successfully for round ${round}`);
    } catch (error) {
      console.error('Error forming teams:', error);
      onMessage(`Error: ${error.message}`);
    } finally {
      setFormingTeams(false);
    }
  };

  const handleEndMatch = (matchId) => {
    AdminApiService.endMatch(matchId)
      .then(() => {
        setControlMessage('Match ended successfully');
        setTimeout(() => setControlMessage(''), 3000);
      })
      .catch(err => {
        setControlMessage(`Error: ${err.message}`);
        setTimeout(() => setControlMessage(''), 5000);
      });
  };

  return (
    <div className="admin-section">
      <h2>Game Control</h2>

      {controlMessage && (
        <div className="control-message">
          {controlMessage}
        </div>
      )}

      <div className="control-grid">
        <div className="control-card">
          <h3>Game Status</h3>
          <p>Current status: <span className={`status-${gameStatus}`}>{gameStatus.toUpperCase()}</span></p>
          <div className="game-controls">
            {gameStatus === 'stopped' ? (
              <button 
                onClick={handleStartGame} 
                className="control-button success"
                disabled={gameStarting}
              >
                {gameStarting ? 'Starting...' : 'Start Game'}
              </button>
            ) : (
              <button 
                onClick={handleStopGame} 
                className="control-button danger"
                disabled={gameStopping}
              >
                {gameStopping ? 'Stopping...' : 'Stop Game'}
              </button>
            )}
          </div>
        </div>

        <div className="control-card">
          <h3>Round Management</h3>
          <p>Current round: {round}</p>
          <div className="round-controls">
            <button 
              onClick={handleNextRound}
              disabled={nextingRound || gameStatus === 'stopped'}
              className={`control-button ${gameStatus === 'stopped' ? 'disabled' : ''}`}
            >
              {nextingRound ? 'Advancing...' : 'Next Round'}
            </button>
            <button 
              onClick={onResetRound}
              disabled={resettingRound || round === 1}
              className={`control-button danger ${round === 1 ? 'disabled' : ''}`}
            >
              {resettingRound ? 'Resetting...' : 'Reset to Round 1'}
            </button>
          </div>
        </div>

        <div className="control-card">
          <h3>Team Battles</h3>
          <p>Form teams based on round 1 ratings to start team battles in round 2.</p>
          <div className="control-buttons">
            <button 
              onClick={handleFormTeams}
              disabled={formingTeams || round < 2}
              className={`control-button ${round < 2 ? 'disabled' : ''}`}
            >
              {formingTeams ? 'Forming Teams...' : 'Form Teams'}
            </button>
            <button 
              onClick={() => onTabChange('team-battles')}
              className="view-button secondary"
              disabled={round < 2}
            >
              Manage Team Battles
            </button>
          </div>
        </div>

        <div className="control-card">
          <h3>Match Analytics</h3>
          <p>View detailed match history, player interactions and analytics.</p>
          <div className="control-buttons">
            <button 
              onClick={() => onTabChange('match-history')}
              className="view-button secondary"
            >
              View Match History
            </button>
          </div>
        </div>

        <div className="control-card">
          <h3>Active Matches</h3>
          <p>
            {gameStatus === 'running' 
              ? 'View and manage current matches in the system.' 
              : 'No matches active. Start the game to begin matching.'}
          </p>
          
          {showMatches ? (
            <LiveMatchTable 
              round={round} 
              onMatchEnd={(matchId) => {
                AdminApiService.endMatch(matchId)
                  .then(() => {
                    onMessage('Match ended successfully');
                  })
                  .catch(err => {
                    console.error('Error ending match:', err);
                    onMessage(`Error: ${err.message}`);
                  });
              }}
            />
          ) : (
            <div className="control-buttons">
              <button 
                onClick={() => setShowMatches(true)} 
                className="view-button"
                disabled={gameStatus !== 'running'}
              >
                View Current Matches
              </button>
              <button 
                onClick={() => onTabChange('match-history')} 
                className="view-button secondary"
              >
                View Match History
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GameControl;
