import React, { useState, useEffect } from 'react';
import '../styles/TeamBattleAdmin.css';
import socket from '../../utils/socket';

function TeamBattleAdmin({ round = 1, onMessage, onBack }) {
  const [teams, setTeams] = useState([]);
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchTeams();
  }, [round]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/teams/${round}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching teams: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched teams:', data);
      setTeams(data.teams || []);
      
      // Only generate battles if we have teams
      if (data.teams && data.teams.length > 0) {
        // Fetch existing battles or generate new ones
        fetchBattles(data.teams);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError(`Failed to fetch teams: ${err.message}`);
      setLoading(false);
      if (onMessage) onMessage(`Error: ${err.message}`);
    }
  };
  
  const fetchBattles = async (teamsList) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/battles/${round}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched battles:', data);
        if (data.battles && data.battles.length > 0) {
          // Format battles to include team details
          const formattedBattles = data.battles.map(battle => {
            const team1 = teamsList.find(t => t.team_id === battle.team1_id) || { 
              team_id: battle.team1_id, 
              player1_name: 'Unknown', 
              player2_name: 'Unknown' 
            };
            const team2 = teamsList.find(t => t.team_id === battle.team2_id) || { 
              team_id: battle.team2_id, 
              player1_name: 'Unknown', 
              player2_name: 'Unknown' 
            };
            
            return {
              ...battle,
              team1,
              team2,
              inProgress: battle.status === 'in_progress'
            };
          });
          
          setBattles(formattedBattles);
          return;
        }
      }
      
      // If no battles found or error, generate new ones
      generateBattles(teamsList);
    } catch (err) {
      console.error('Error fetching battles:', err);
      // Fall back to generating battles
      generateBattles(teamsList);
    }
  };
  
  const generateBattles = (teamsList) => {
    if (!teamsList || teamsList.length < 2) {
      setBattles([]);
      return;
    }
    
    console.log('Generating battles from teams:', teamsList);
    const battleTypes = [
      "Language Challenge",
      "Word Association Game",
      "Cultural Storytelling",
      "Impromptu Skit",
      "Team Quiz"
    ];
    
    // Create balanced pairings
    const generatedBattles = [];
    const teamsCopy = [...teamsList];
    
    // Shuffle teams for random matchups
    for (let i = teamsCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [teamsCopy[i], teamsCopy[j]] = [teamsCopy[j], teamsCopy[i]];
    }
    
    // Create battle pairings
    for (let i = 0; i < teamsCopy.length - 1; i += 2) {
      if (i + 1 < teamsCopy.length) {
        const battleType = battleTypes[Math.floor(Math.random() * battleTypes.length)];
        generatedBattles.push({
          id: `temp-${i/2}`, // Temporary ID until saved
          team1_id: teamsCopy[i].team_id,
          team2_id: teamsCopy[i+1].team_id,
          team1: teamsCopy[i],
          team2: teamsCopy[i+1],
          battleType,
          round,
          winner_id: null,
          status: 'pending',
          inProgress: false
        });
      }
    }
    
    // Handle odd number of teams
    if (teamsCopy.length % 2 !== 0 && teamsCopy.length > 0) {
      const lastTeam = teamsCopy[teamsCopy.length - 1];
      generatedBattles.push({
        id: `temp-bye`,
        team1_id: lastTeam.team_id,
        team2_id: null,
        team1: lastTeam,
        team2: { 
          team_id: 'bye',
          player1_name: 'Bye', 
          player2_name: 'Round' 
        },
        battleType: "Bye Round",
        round,
        winner_id: lastTeam.team_id, // Auto-win for the team with a bye
        status: 'completed',
        inProgress: false
      });
    }
    
    setBattles(generatedBattles);
  };
  
  const saveBattles = async () => {
    if (battles.length === 0) return;
    
    try {
      setLoading(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/battles/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          battles: battles.map(b => ({
            team1_id: b.team1_id,
            team2_id: b.team2_id,
            battle_type: b.battleType,
            round
          }))
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error saving battles: ${response.status}`);
      }
      
      const data = await response.json();
      if (onMessage) onMessage('Battles saved successfully!');
      
      // Refresh battles to get the server-generated IDs
      fetchTeams();
    } catch (err) {
      console.error('Error saving battles:', err);
      setError(`Failed to save battles: ${err.message}`);
      if (onMessage) onMessage(`Error: ${err.message}`);
      setLoading(false);
    }
  };
  
  const startTeamBattles = () => {
    if (battles.length === 0) {
      if (onMessage) onMessage('No battles available to start');
      return;
    }
    
    // First save battles if they're temporary
    if (battles.some(b => !b.id || b.id.startsWith('temp'))) {
      saveBattles();
    }
    
    // Emit socket event to notify players
    socket.emit('start_team_battles', { round });
    if (onMessage) onMessage(`Team battles for round ${round} have been started!`);
  };

  const startBattle = async (battleId) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/battles/${battleId}/start`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Error starting battle: ${response.status}`);
      }
      
      // Update local state to show battle as in progress
      setBattles(battles.map(b => 
        b.id === battleId ? { ...b, inProgress: true, status: 'in_progress' } : b
      ));
      
      if (onMessage) onMessage(`Battle ${battleId} started!`);
    } catch (err) {
      console.error('Error starting battle:', err);
      if (onMessage) onMessage(`Error starting battle: ${err.message}`);
    }
  };
  
  const declareWinner = async (battleId, winningTeamId) => {
    if (!battleId || !winningTeamId) return;
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/battles/${battleId}/winner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winner_id: winningTeamId })
      });
      
      if (!response.ok) {
        throw new Error(`Error declaring winner: ${response.status}`);
      }
      
      // Update local state
      setBattles(battles.map(b => 
        b.id === battleId ? { 
          ...b, 
          winner_id: winningTeamId, 
          inProgress: false,
          status: 'completed' 
        } : b
      ));
      
      if (onMessage) onMessage(`Team ${winningTeamId} declared as winner!`);
    } catch (err) {
      console.error('Error declaring winner:', err);
      if (onMessage) onMessage(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="admin-section team-battle-admin">
        <h2>Team Battles Administration - Round {round}</h2>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading team and battle data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-section team-battle-admin">
        <h2>Team Battles Administration - Round {round}</h2>
        <div className="error-message">
          <p>{error}</p>
          <button className="refresh-button" onClick={fetchTeams}>Try Again</button>
          <button className="back-button" onClick={onBack}>Back to Admin</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-section team-battle-admin">
      <h2>Team Battles Administration - Round {round}</h2>
      
      <div className="control-card">
        <div className="battle-actions">
          <button 
            className="primary-button start-battles-button"
            onClick={startTeamBattles}
            disabled={teams.length < 2}
          >
            Broadcast Team Battles Start
          </button>
          <button 
            className="secondary-button refresh-button"
            onClick={fetchTeams}
          >
            Refresh Data
          </button>
          <button 
            className="tertiary-button back-button"
            onClick={onBack}
          >
            Back to Admin
          </button>
        </div>
      </div>
      
      <div className="control-card">
        <h3>Teams ({teams.length})</h3>
        {teams.length === 0 ? (
          <div className="empty-state">
            <p>No teams have been formed for round {round} yet.</p>
            <p>Form teams in the Dashboard before starting team battles.</p>
          </div>
        ) : (
          <div className="teams-list">
            {teams.map(team => (
              <div className="team-item" key={team.team_id}>
                <div className="team-header">Team {team.team_id}</div>
                <div className="team-members">
                  <div>{team.player1_name}</div>
                  <div>&</div>
                  <div>{team.player2_name}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {teams.length > 0 && (
        <div className="control-card">
          <h3>Battle Pairings ({battles.length})</h3>
          
          {battles.length === 0 ? (
            <div className="empty-state">
              <p>No battles have been created yet.</p>
              <button 
                className="generate-button"
                onClick={() => generateBattles(teams)}
              >
                Generate Battle Pairings
              </button>
            </div>
          ) : (
            <>
              <div className="battles-grid">
                {battles.map(battle => (
                  <div 
                    key={battle.id} 
                    className={`battle-card ${battle.inProgress ? 'in-progress' : ''} ${battle.winner_id ? 'completed' : ''}`}
                  >
                    <div className="battle-header">
                      <span className="battle-id">Battle #{typeof battle.id === 'string' && battle.id.startsWith('temp') ? battle.id.replace('temp-', '') : battle.id}</span>
                      <span className="battle-type">{battle.battleType}</span>
                    </div>
                    
                    {battle.team1 && battle.team2 && (
                      <div className="battle-teams-preview">
                        <div className="team-preview">
                          <h4>Team {battle.team1.team_id}</h4>
                          <p>{battle.team1.player1_name} & {battle.team1.player2_name}</p>
                        </div>
                        <div className="vs">VS</div>
                        <div className="team-preview">
                          <h4>Team {battle.team2.team_id}</h4>
                          <p>{battle.team2.player1_name} & {battle.team2.player2_name}</p>
                        </div>
                      </div>
                    )}
                    
                    {battle.winner_id ? (
                      <div className="battle-result">
                        <p>Winner: Team {battle.winner_id}</p>
                      </div>
                    ) : battle.inProgress ? (
                      <div className="battle-actions">
                        <p>Battle in progress</p>
                        <div className="winner-buttons">
                          <button onClick={() => declareWinner(battle.id, battle.team1_id)}>
                            Team {battle.team1.team_id} Wins
                          </button>
                          <button onClick={() => declareWinner(battle.id, battle.team2_id)}>
                            Team {battle.team2.team_id} Wins
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="start-battle-button"
                        onClick={() => startBattle(battle.id)}
                        disabled={typeof battle.id === 'string' && battle.id.startsWith('temp')}
                      >
                        {typeof battle.id === 'string' && battle.id.startsWith('temp') 
                          ? 'Save Battles to Start' 
                          : 'Start Battle'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              {battles.some(b => typeof b.id === 'string' && b.id.startsWith('temp')) && (
                <div className="save-battles">
                  <button onClick={saveBattles} className="save-button">
                    Save Battle Pairings
                  </button>
                  <p>Battles must be saved before they can be started.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default TeamBattleAdmin;
