import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function MatchManagement() {
  const { round } = useParams();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  
  useEffect(() => {
    fetchMatches();
  }, [round]);
  
  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/admin/matches?round=${round}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setMatches(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching matches:', error);
      setError('Failed to load matches. Please try again.');
      setLoading(false);
    }
  };
  
  const handleForceMatchEnd = async (matchId) => {
    if (!window.confirm('Are you sure you want to end this match?')) {
      return;
    }
    
    try {
      const response = await fetch(`${backendUrl}/api/admin/end-match/${matchId}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      fetchMatches(); // Refresh the match list
    } catch (error) {
      console.error('Error ending match:', error);
      setError('Failed to end match. Please try again.');
    }
  };
  
  const handleCreateMatch = async (player1Id, player2Id) => {
    try {
      const response = await fetch(`${backendUrl}/api/admin/create-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player1Id, player2Id, round }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      fetchMatches(); // Refresh the match list
    } catch (error) {
      console.error('Error creating match:', error);
      setError('Failed to create match. Please try again.');
    }
  };
  
  if (loading) {
    return <div>Loading matches...</div>;
  }
  
  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <button onClick={fetchMatches}>Try Again</button>
      </div>
    );
  }
  
  return (
    <div className="match-management">
      <h2>Match Management - Round {round}</h2>
      
      <div className="match-controls">
        <button onClick={fetchMatches}>Refresh Matches</button>
        <button onClick={() => window.history.back()}>Back to Admin</button>
      </div>
      
      <h3>Current Matches</h3>
      {matches.length === 0 ? (
        <p>No active matches found for this round.</p>
      ) : (
        <div className="match-list">
          {matches.map(match => (
            <div key={match.id} className="match-item">
              <div className="match-players">
                <div className="player">
                  <strong>{match.player1_name}</strong> ({match.player1_type})
                </div>
                <div className="match-separator">⟷</div>
                <div className="player">
                  <strong>{match.player2_name}</strong> ({match.player2_type})
                </div>
              </div>
              <div className="match-actions">
                <button onClick={() => handleForceMatchEnd(match.id)} className="end-match-button">
                  End Match
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <h3>Create Manual Match</h3>
      <div className="manual-match-form">
        <p>Select two available players to create a manual match:</p>
        {/* Form implementation for manual match creation */}
      </div>
    </div>
  );
}

export default MatchManagement;
