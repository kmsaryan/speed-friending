import React, { useState, useEffect } from 'react';
import AdminApiService from '../services/AdminApiService';
import socket from '../../utils/socket';
import '../styles/TeamBattleAdmin.css';

function TeamBattleAdmin({ round, onMessage, onBack }) {
  const [teams, setTeams] = useState([]);
  const [battlesCreated, setBattlesCreated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, [round]);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const data = await AdminApiService.getTeams(round);
      setTeams(data.teams || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching teams:', error);
      onMessage && onMessage(`Error loading teams: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="admin-section team-battle-admin">
      <h2>Team Battles Administration - Round {round}</h2>
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading team data...</p>
        </div>
      ) : (
        <div>
          <div className="control-card">
            <button className="primary-button" onClick={onBack}>
              Back to Admin
            </button>
          </div>
          <div className="control-card">
            <h3>Teams ({teams.length})</h3>
            {teams.length === 0 ? (
              <p>No teams available for round {round}.</p>
            ) : (
              <ul>
                {teams.map((team) => (
                  <li key={team.team_id}>
                    Team {team.team_id}: {team.player1_name} & {team.player2_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamBattleAdmin;
