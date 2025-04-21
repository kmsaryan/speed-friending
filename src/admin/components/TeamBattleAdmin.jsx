import React, { useState, useEffect } from 'react';
import AdminApiService from '../services/AdminApiService';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../styles/TeamBattleAdmin.css';

function TeamBattleAdmin({ round = 2, onMessage, onBack }) {
  const [teams, setTeams] = useState([]);
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [round]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchTeams(), fetchBattles()]);
      setLoading(false);
    } catch (err) {
      setError('Error loading data: ' + err.message);
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await AdminApiService.getTeams(round);
      if (response && response.teams) {
        setTeams(response.teams || []);
        return response.teams;
      } else {
        console.warn("Teams API response did not contain teams array:", response);
        setTeams([]);
        return [];
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
      setTeams([]);
      throw err;
    }
  };

  const fetchBattles = async () => {
    try {
      const response = await AdminApiService.getBattles(round);
      if (response && response.battles) {
        setBattles(response.battles || []);
        return response.battles;
      } else {
        console.warn("Battles API response did not contain battles array:", response);
        setBattles([]);
        return [];
      }
    } catch (err) {
      console.error('Error fetching battles:', err);
      setBattles([]);
      throw err;
    }
  };

  const createTeamBattles = async () => {
    try {
      setLoading(true);
      onMessage('Team battles created successfully!');
      await fetchData();
    } catch (err) {
      console.error('Error creating team battles:', err);
      onMessage('Failed to create team battles: ' + err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading team battle data..." />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="team-battle-admin">
      <div className="team-battle-header">
        <h2>Team Battles - Round {round}</h2>
        <button onClick={onBack} className="back-button">
          &larr; Back
        </button>
      </div>
      
      <div className="team-battle-actions">
        <button onClick={fetchData} className="refresh-button">
          Refresh Data
        </button>
        <button onClick={createTeamBattles} className="primary-button">
          Create Team Battles
        </button>
      </div>
      
      <div className="teams-section">
        <h3>Teams ({teams.length})</h3>
        {teams.length === 0 ? (
          <div className="no-teams">
            <p>No teams have been formed for round {round} yet.</p>
          </div>
        ) : (
          <div className="teams-grid">
            {teams.map(team => (
              <div key={team.team_id} className="team-card">
                <h4>Team #{team.team_id}</h4>
                <div className="team-members">
                  <div className="team-member">
                    <span className="member-name">{team.player1_name}</span>
                  </div>
                  <div className="team-member">
                    <span className="member-name">{team.player2_name}</span>
                  </div>
                </div>
                <div className="team-compatibility">
                  <span>Compatibility: </span>
                  <span className="compatibility-score">{team.compatibility_score}/10</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {battles.length > 0 && (
        <div className="battles-section">
          <h3>Battles ({battles.length})</h3>
          <div className="battles-grid">
            {battles.map(battle => (
              <div key={battle.id} className="battle-card">
                <h4>Battle #{battle.id}</h4>
                <div className="battle-details">
                  <div>Team {battle.team1_id} vs Team {battle.team2_id}</div>
                  <div>Type: {battle.battle_type || 'Standard'}</div>
                  <div>Status: {battle.status || 'Pending'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamBattleAdmin;
