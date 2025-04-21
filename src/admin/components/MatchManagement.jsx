import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AdminApiService from '../services/AdminApiService';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../styles/MatchManagement.css';

function MatchManagement({ initialRound }) {
  const { round: roundFromParams } = useParams();
  const [round, setRound] = useState(initialRound || parseInt(roundFromParams, 10) || 1);
  const [allMatches, setAllMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [playerMatches, setPlayerMatches] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [matchStats, setMatchStats] = useState({
    total: 0,
    active: 0,
    rated: 0
  });
  const [expandedPlayers, setExpandedPlayers] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Fetch matches and players when component mounts or round changes
  useEffect(() => {
    fetchData();
  }, [round]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all players first
      const playerData = await AdminApiService.getPlayers();
      setPlayers(playerData || []);
      
      // Then fetch matches for the current round
      const matchData = await AdminApiService.getMatches(round);
      setAllMatches(matchData || []);
      
      // Process the match data to organize by player
      processMatchesByPlayer(playerData || [], matchData || []);
      
      setLoading(false);
    } catch (err) {
      setError('Error loading data: ' + err.message);
      setLoading(false);
    }
  };

  // Function to process matches and organize them by player
  const processMatchesByPlayer = (playersList, matchesList) => {
    // Calculate match statistics
    const stats = {
      total: matchesList.length,
      active: matchesList.filter(m => !m.rated).length,
      rated: matchesList.filter(m => m.rated).length
    };
    setMatchStats(stats);
    
    // Create a map of player ID to their matches
    const playerMatchMap = {};
    
    // Initialize all players in the map
    playersList.forEach(player => {
      playerMatchMap[player.id] = {
        playerInfo: player,
        matches: []
      };
    });
    
    // Add matches to the appropriate players
    matchesList.forEach(match => {
      // Add the match to player 1's history
      if (playerMatchMap[match.player1_id]) {
        playerMatchMap[match.player1_id].matches.push({
          ...match,
          otherPlayerId: match.player2_id,
          otherPlayerName: match.player2_name,
          otherPlayerType: match.player2_type,
          fromPerspective: 'player1'
        });
      }
      
      // Add the match to player 2's history
      if (playerMatchMap[match.player2_id]) {
        playerMatchMap[match.player2_id].matches.push({
          ...match,
          otherPlayerId: match.player1_id,
          otherPlayerName: match.player1_name,
          otherPlayerType: match.player1_type,
          fromPerspective: 'player2'
        });
      }
    });
    
    setPlayerMatches(playerMatchMap);
  };

  const handleEndMatch = async (matchId) => {
    try {
      await AdminApiService.endMatch(matchId);
      fetchData(); // Refresh all data
    } catch (err) {
      setError('Error ending match: ' + err.message);
    }
  };

  const togglePlayerExpanded = (playerId) => {
    setExpandedPlayers(prev => ({
      ...prev,
      [playerId]: !prev[playerId]
    }));
  };
  
  const filteredPlayers = players.filter(player => {
    // First apply search filter (case insensitive)
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          player.id.toString().includes(searchTerm);
                          
    // Then apply player type filter
    if (filterType === 'all') return matchesSearch;
    return matchesSearch && player.playerType === filterType;
  });

  if (loading) {
    return <LoadingSpinner message="Loading player match history..." />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="match-management">
      <div className="controls-container">
        <div className="filter-controls">
          <div className="round-selector">
            <label>Round:</label>
            <select 
              value={round} 
              onChange={(e) => setRound(parseInt(e.target.value, 10))}
            >
              <option value={1}>Round 1</option>
              <option value={2}>Round 2</option>
              <option value={3}>Round 3</option>
            </select>
          </div>
          
          <div className="player-search">
            <input
              type="text"
              placeholder="Search by player name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="player-type-filter">
            <label>Player Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="stationary">Stationary</option>
              <option value="moving">Moving</option>
            </select>
          </div>
          
          <button onClick={fetchData} className="refresh-button">
            Refresh
          </button>
        </div>
      </div>
      
      <div className="match-statistics">
        <div className="stat-box">
          <span className="stat-value">{matchStats.total}</span>
          <span className="stat-label">Total Matches</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">{matchStats.active}</span>
          <span className="stat-label">Active</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">{matchStats.rated}</span>
          <span className="stat-label">Rated</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">{filteredPlayers.length}</span>
          <span className="stat-label">Players</span>
        </div>
      </div>
      
      <h3>Player Match History - Round {round}</h3>
      
      {filteredPlayers.length > 0 ? (
        <div className="player-list">
          {filteredPlayers.map(player => {
            const playerData = playerMatches[player.id];
            const matchCount = playerData?.matches?.length || 0;
            const isExpanded = expandedPlayers[player.id] || false;
            
            return (
              <div key={player.id} className="player-card">
                <div 
                  className="player-header" 
                  onClick={() => togglePlayerExpanded(player.id)}
                >
                  <div className="player-info">
                    <span className="player-id">#{player.id}</span>
                    <span className="player-name">{player.name}</span>
                    <span className={`player-type ${player.playerType}`}>
                      {player.playerType}
                    </span>
                  </div>
                  
                  <div className="player-meta">
                    <span className="match-count">
                      {matchCount} {matchCount === 1 ? 'match' : 'matches'}
                    </span>
                    <span className="expand-icon">
                      {isExpanded ? '▼' : '►'}
                    </span>
                  </div>
                </div>
                
                {isExpanded && playerData?.matches?.length > 0 && (
                  <div className="player-matches">
                    <table className="match-table">
                      <thead>
                        <tr>
                          <th>Match ID</th>
                          <th>Matched With</th>
                          <th>Type</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {playerData.matches.map(match => (
                          <tr key={match.id} className={match.rated ? 'rated-match' : ''}>
                            <td>#{match.id}</td>
                            <td>{match.otherPlayerName}</td>
                            <td>{match.otherPlayerType}</td>
                            <td>{match.rated ? 'Rated' : 'Active'}</td>
                            <td>
                              <button 
                                onClick={() => handleEndMatch(match.id)}
                                className="action-button"
                                disabled={match.rated}
                              >
                                End Match
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {isExpanded && (!playerData?.matches || playerData.matches.length === 0) && (
                  <div className="no-matches-message">
                    No matches found for this player in round {round}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-players-message">
          No players found matching your search criteria
        </div>
      )}
    </div>
  );
}

export default MatchManagement;
