import React, { useEffect, useState } from 'react';
import { getApiUrl, apiGet } from '../../utils/apiUtils'; // Ensure this is imported
import '../styles/LiveMatchTable.css';
import socket from '../../utils/socket';
import LoadingSpinner from '../../components/LoadingSpinner';

function LiveMatchTable() {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentRound, setCurrentRound] = useState(1);

  // Move fetchMatches outside useEffect to component scope so it can be accessed by fetchData
  const fetchMatches = async () => {
    try {
      const response = await apiGet(`admin/matches?round=${currentRound}`);
      setMatches(response);
    } catch (error) {
      console.error('[API]: Error fetching matches:', error.message);
      setError('Failed to load matches. Please try again.');
    }
  };

  useEffect(() => {
    fetchData();
    
    // Listen for player status updates
    socket.on('player_status_updated', () => {
      console.log('Player status changed, refreshing data...');
      fetchData();
    });
    
    // Listen for game status changes which might affect the current round
    socket.on('game_status_change', (gameState) => {
      if (gameState.round && gameState.round !== currentRound) {
        setCurrentRound(gameState.round);
        fetchData();
      }
    });
    
    return () => {
      socket.off('player_status_updated');
      socket.off('game_status_change');
    };
  }, [currentRound]);

  useEffect(() => {
    // Use the fetchMatches function defined at component level
    fetchMatches();
    
    socket.on('match_created', fetchMatches);
    socket.on('match_updated', fetchMatches);

    return () => {
      socket.off('match_created', fetchMatches);
      socket.off('match_updated', fetchMatches);
    };
  }, [currentRound]);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchPlayers(), fetchMatches()]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try refreshing.');
      setLoading(false);
    }
  };
  
  const fetchPlayers = async () => {
    try {
      const response = await fetch(getApiUrl('admin/players'));
      
      if (!response.ok) {
        console.error(`Error response fetching players: ${response.status} ${response.statusText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setPlayers(data);
      return data;
    } catch (error) {
      console.error('Error fetching players:', error);
      setError(`Failed to load players: ${error.message}`);
      throw error;
    }
  };
  
  // Helper to get current match for a player
  const getPlayerMatch = (playerId) => {
    return matches.find(match => 
      match.player1_id === playerId || match.player2_id === playerId
    );
  };
  
  // Helper to get match partner name
  const getPartnerName = (match, playerId) => {
    if (match.player1_id === playerId) {
      return match.player2_name;
    } else {
      return match.player1_name;
    }
  };
  
  // Handle force end match
  const handleEndMatch = async (matchId) => {
    if (!window.confirm('Are you sure you want to end this match?')) {
      return;
    }
    
    try {
      const response = await fetch(getApiUrl(`admin/end-match/${matchId}`), {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      fetchData(); // Refresh the match list
    } catch (error) {
      console.error('Error ending match:', error);
      setError('Failed to end match. Please try again.');
    }
  };
  
  // Handle manual player matching
  const handleCreateMatch = async (player1Id, player2Id) => {
    try {
      const response = await fetch(getApiUrl('admin/create-match'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player1Id, player2Id, round: currentRound }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      fetchData(); // Refresh the data
    } catch (error) {
      console.error('Error creating match:', error);
      setError('Failed to create match. Please try again.');
    }
  };
  
  if (loading) {
    return (
      <div className="admin-section">
        <h2>Live Match Tracking</h2>
        <LoadingSpinner message="Loading match data..." />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="admin-section">
        <h2>Live Match Tracking</h2>
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchData} className="refresh-button">Refresh Data</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-section live-match-section">
      <h2>Live Match Tracking</h2>
      
      <div className="control-card">
        <div className="table-header">
          <h3>Current Player Status (Round {currentRound})</h3>
          <button onClick={fetchData} className="refresh-button">
            Refresh Data
          </button>
        </div>
        
        <div className="live-match-table-container">
          <table className="live-match-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Current Match</th>
                <th>Interactions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">No players registered yet</td>
                </tr>
              ) : (
                players.map((player) => {
                  const match = getPlayerMatch(player.id);
                  const matchStatus = match ? 'In Conversation' : (player.status === 'available' ? 'Available' : 'Waiting');
                  const matchPartner = match ? getPartnerName(match, player.id) : 'None';
                  
                  return (
                    <tr key={player.id} className={`status-${player.status}`}>
                      <td>{player.id}</td>
                      <td>{player.name}</td>
                      <td>{player.playerType}</td>
                      <td>
                        <span className={`status-badge ${player.status}`}>
                          {player.status?.charAt(0).toUpperCase() + player.status?.slice(1) || 'Unknown'}
                        </span>
                      </td>
                      <td>{matchPartner}</td>
                      <td>{player.interaction_count || 0}</td>
                      <td>
                        {match ? (
                          <button 
                            className="end-match-button"
                            onClick={() => handleEndMatch(match.id)}
                          >
                            End Match
                          </button>
                        ) : (
                          <button 
                            className="match-button"
                            onClick={() => {
                              const availablePlayers = players.filter(p => 
                                p.id !== player.id && 
                                p.status === 'available' && 
                                !getPlayerMatch(p.id)
                              );
                              
                              if (availablePlayers.length === 0) {
                                alert('No available players to match with.');
                                return;
                              }
                              
                              // Find an opposite type player if possible
                              const oppositeType = player.playerType === 'stationary' ? 'moving' : 'stationary';
                              const matchablePlayer = availablePlayers.find(p => p.playerType === oppositeType) || 
                                                    availablePlayers[0];
                              
                              if (window.confirm(`Match ${player.name} with ${matchablePlayer.name}?`)) {
                                handleCreateMatch(player.id, matchablePlayer.id);
                              }
                            }}
                            disabled={player.status !== 'available'}
                          >
                            Match Now
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="control-card">
        <h3>Match Legend</h3>
        <div className="legend">
          <div className="legend-item">
            <span className="status-badge available"></span>
            <span>Available: Player is ready to be matched</span>
          </div>
          <div className="legend-item">
            <span className="status-badge matched"></span>
            <span>Matched: Player is currently in a conversation</span>
          </div>
          <div className="legend-item">
            <span className="status-badge rating"></span>
            <span>Rating: Player is submitting feedback</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveMatchTable;