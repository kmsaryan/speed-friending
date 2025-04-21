import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminApiService from '../services/AdminApiService';
import LoadingSpinner from '../../components/LoadingSpinner';
import '../styles/TeamBattleLanding.css';

function TeamBattleLanding({ round, onMessage }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Create a proper fetchTeams function
  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await AdminApiService.getTeams(round);
      // Ensure we have a valid teams array from the response
      if (response && response.teams) {
        setTeams(response.teams || []);
      } else {
        console.warn("Teams API response did not contain teams array:", response);
        setTeams([]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError('Failed to load teams data: ' + err.message);
      setTeams([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [round]);

  const formTeams = async () => {
    try {
      setLoading(true);
      await AdminApiService.formTeams(round);
      await fetchTeams();
      onMessage('Teams formed successfully!');
    } catch (err) {
      console.error('Error forming teams:', err);
      onMessage('Failed to form teams: ' + err.message);
      setLoading(false);
    }
  };

  const navigateToTeamBattles = () => {
    navigate('/admin/team-battles/' + round);
  };

  if (loading) {
    return <LoadingSpinner message="Loading team data..." />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="team-battle-landing">
      <h2>Team Battles Management - Round {round}</h2>
      
      <div className="team-battle-actions">
        <button onClick={formTeams} className="primary-button">
          Form Teams from Ratings
        </button>
        <button onClick={navigateToTeamBattles} className="secondary-button">
          Manage Team Battles
        </button>
      </div>
      
      <div className="teams-overview">
        <h3>Teams ({teams.length})</h3>
        {teams.length === 0 ? (
          <div className="no-teams">
            <p>No teams have been formed for round {round} yet.</p>
            <p>Use the "Form Teams from Ratings" button to create teams based on player ratings.</p>
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
    </div>
  );
}

export default TeamBattleLanding;
