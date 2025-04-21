import React, { useState, useEffect } from 'react';
import { apiGet } from '../../utils/apiUtils';
import AdminApiService from '../services/AdminApiService';
import '../styles/Dashboard.css';
import socket from '../../utils/socket';

function Dashboard({ 
  playerStats, 
  ratings, 
  round, 
  gameStatus, 
  onStatusChange, 
  onRoundChange, 
  onRefresh, 
  onMessage,
  onTeamBattlesClick 
}) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMatches();
    
    // Listen for match updates
    socket.on('match_created', fetchMatches);
    socket.on('match_updated', fetchMatches);
    socket.on('match_ended', fetchMatches);

    return () => {
      socket.off('match_created', fetchMatches);
      socket.off('match_updated', fetchMatches);
      socket.off('match_ended', fetchMatches);
    };
  }, [round]);

  // Explicitly define fetchMatches function
  const fetchMatches = async () => {
    try {
      setLoading(true);
      const matchData = await apiGet(`admin/matches?round=${round}`);
      setMatches(matchData || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching matches:', error);
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      await onRefresh();
      await fetchMatches();
      setLoading(false);
      onMessage('Dashboard refreshed successfully');
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      onMessage('Failed to refresh dashboard');
      setLoading(false);
    }
  };

  const handleGameAction = async (action) => {
    try {
      setLoading(true);
      if (action === 'start') {
        await AdminApiService.startGame(round);
        onStatusChange('running');
        onMessage('Game started successfully');
      } else if (action === 'stop') {
        await AdminApiService.stopGame();
        onStatusChange('stopped');
        onMessage('Game stopped successfully');
      } else if (action === 'next') {
        const response = await AdminApiService.nextRound();
        onRoundChange(response.round);
        onMessage(`Advanced to round ${response.round}`);
      }
      setLoading(false);
    } catch (error) {
      console.error(`Error with game action ${action}:`, error);
      onMessage(`Failed to ${action} game: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="admin-dashboard-container">
      <div className="dashboard-header">
        <h2>Speed Friending Dashboard</h2>
        <button onClick={handleRefresh} className="refresh-button" disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
      
      <div className="dashboard-stats">
        <div className="stat-box">
          <span className="stat-value">{playerStats.total || 0}</span>
          <span className="stat-label">Total Players</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">{playerStats.matched || 0}</span>
          <span className="stat-label">In Matches</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">{playerStats.available || 0}</span>
          <span className="stat-label">Available</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">{matches.length || 0}</span>
          <span className="stat-label">Matches</span>
        </div>
      </div>
      
      <div className="game-controls">
        <div className="control-group">
          <h3>Game Status: <span className={gameStatus}>{gameStatus}</span></h3>
          <div className="buttons">
            <button 
              onClick={() => handleGameAction('start')} 
              disabled={gameStatus === 'running' || loading}
              className="start-button"
            >
              Start Game
            </button>
            <button 
              onClick={() => handleGameAction('stop')} 
              disabled={gameStatus === 'stopped' || loading}
              className="stop-button"
            >
              Stop Game
            </button>
          </div>
        </div>
        
        <div className="control-group">
          <h3>Current Round: <span className="round">{round}</span></h3>
          <div className="buttons">
            <button 
              onClick={() => handleGameAction('next')} 
              disabled={gameStatus !== 'running' || loading}
              className="next-button"
            >
              Next Round
            </button>
            <button 
              onClick={onTeamBattlesClick} 
              disabled={loading}
              className="teams-button"
            >
              Team Battles
            </button>
          </div>
        </div>
      </div>
      
      <div className="quick-stats">
        <div className="quick-stat-item">
          <h3>Player Distribution</h3>
          <div className="player-types">
            <div className="player-type">
              <span className="type-label">Stationary</span>
              <span className="type-value">{playerStats.stationary || 0}</span>
            </div>
            <div className="player-type">
              <span className="type-label">Moving</span>
              <span className="type-value">{playerStats.moving || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
