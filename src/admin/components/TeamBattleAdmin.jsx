import React, { useState, useEffect } from 'react';
import socket from '../../utils/socket';
import '../../styles/global.css';
import '../styles/TeamBattleAdmin.css';

const battleTypes = [
  "Language Challenge - Teach a Song",
  "Word Association Game",
  "Cultural Storytelling",
  "Impromptu Skit Performance",
  "Language Pictionary"
];

function TeamBattleAdmin({ round, onMessage, onBack }) { // Add onBack prop
  const [teams, setTeams] = useState([]);
  const [battles, setBattles] = useState([]);
  const [selectedBattle, setSelectedBattle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch teams and generate battles
  useEffect(() => {
    fetchTeams();
    
    // Listen for battle results to update UI
    socket.on('battle_result', (data) => {
      if (data.battleId && data.winnerId) {
        setBattles(prev => prev.map(battle => 
          battle.id === data.battleId ? {...battle, winner: data.winnerId} : battle
        ));
        
        // If this is the currently selected battle, update it
        if (selectedBattle && selectedBattle.id === data.battleId) {
          setSelectedBattle(prev => ({...prev, winner: data.winnerId}));
        }
      }
    });
    
    return () => {
      socket.off('battle_result');
    };
  }, [round]);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/teams/${round}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setTeams(data.teams);
      
      if (data.teams.length >= 2) {
        fetchExistingBattles(data.teams);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError('Error loading teams: ' + err.message);
      setLoading(false);
    }
  };
  
  const fetchExistingBattles = async (teamsList) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/battles/${round}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.battles && data.battles.length > 0) {
        console.log("Found existing battles:", data.battles);
        setBattles(data.battles);
      } else {
        console.log("No existing battles found, generating new ones");
        generateBattles(teamsList);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching battles:", err);
      // Fall back to generating new battles
      generateBattles(teamsList);
      setLoading(false);
    }
  };
  
  const generateBattles = (teamsList) => {
    // Create balanced pairings for battles
    const battlePairings = [];
    const teamsCopy = [...teamsList];
    
    // Shuffle the teams for random matchups
    for (let i = teamsCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [teamsCopy[i], teamsCopy[j]] = [teamsCopy[j], teamsCopy[i]];
    }
    
    // Create battle pairings
    for (let i = 0; i < teamsCopy.length - 1; i += 2) {
      if (i + 1 < teamsCopy.length) {
        const battleType = battleTypes[Math.floor(Math.random() * battleTypes.length)];
        battlePairings.push({
          id: i / 2 + 1,
          team1: teamsCopy[i],
          team2: teamsCopy[i + 1],
          battleType,
          winner: null,
          inProgress: false
        });
      }
    }
    
    setBattles(battlePairings);
  };
  
  const startTeamBattles = () => {
    // Notify server to start team battles
    socket.emit("start_team_battles", { round });
    
    // Save battles to database if needed
    saveBattlesToDatabase();
  };
  
  const saveBattlesToDatabase = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/create-battles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ battles, round })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Battles saved:", data);
    } catch (err) {
      console.error("Error saving battles:", err);
      setError('Failed to save battles. Players may not receive proper notifications.');
    }
  };
  
  const startBattle = (battle) => {
    // Update the selected battle and mark it as in progress
    setSelectedBattle({...battle, inProgress: true});
    
    // Update battles list to mark this one as in progress
    const updatedBattles = battles.map(b => 
      b.id === battle.id ? {...b, inProgress: true} : b
    );
    setBattles(updatedBattles);
    
    // Notify players in this battle
    socket.emit("battle_update", {
      battleId: battle.id,
      battleType: battle.battleType,
      team1Id: battle.team1.team_id,
      team2Id: battle.team2.team_id
    });
  };
  
  const declareBattleWinner = (battleId, winningTeamId) => {
    // Update battles to record the winner
    const updatedBattles = battles.map(b => 
      b.id === battleId ? {...b, winner: winningTeamId, inProgress: false} : b
    );
    setBattles(updatedBattles);
    setSelectedBattle(null);
    
    // Notify about the battle result
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    fetch(`${backendUrl}/api/record-battle-winner`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        round: round,
        battleId: battleId,
        winningTeamId: winningTeamId
      })
    }).catch(err => console.error('Failed to record battle winner:', err));
  };
  
  const changeBattleType = (battle, newType) => {
    // Update the battle type
    const updatedBattles = battles.map(b => 
      b.id === battle.id ? {...b, battleType: newType} : b
    );
    setBattles(updatedBattles);
    
    // If this is the selected battle, update it
    if (selectedBattle && selectedBattle.id === battle.id) {
      setSelectedBattle({...selectedBattle, battleType: newType});
    }
    
    // Notify players about the battle type change
    socket.emit("battle_update", {
      battleId: battle.id,
      battleType: newType,
      team1Id: battle.team1.team_id,
      team2Id: battle.team2.team_id
    });
  };
  
  if (loading) {
    return (
      <div className="admin-section">
        <h2>Team Battles Administration - Round {round}</h2>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading team data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="admin-section">
        <h2>Team Battles Administration - Round {round}</h2>
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchTeams} className="refresh-button">Try Again</button>
        </div>
      </div>
    );
  }
  
  if (teams.length === 0) {
    return (
      <div className="admin-section">
        <h2>Team Battles Administration - Round {round}</h2>
        <div className="no-teams-message">
          <h2>No Teams Available</h2>
          <p>Teams need to be formed before battles can begin.</p>
          <button onClick={onBack} className="btn-primary"> {/* Replace navigate with onBack */}
            Return to Admin Dashboard
          </button>
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
            onClick={onBack} // Replace navigate with onBack
          >
            Back to Admin
          </button>
        </div>
      </div>
      
      {selectedBattle ? (
        <div className="active-battle-admin">
          <div className="battle-header">
            <h3>Active Battle: #{selectedBattle.id}</h3>
            <div className="battle-type-selector">
              <select 
                value={selectedBattle.battleType}
                onChange={(e) => changeBattleType(selectedBattle, e.target.value)}
              >
                {battleTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="battle-teams-admin">
            <div className="battle-team-admin">
              <h3>Team {selectedBattle.team1.team_id}</h3>
              <p>{selectedBattle.team1.player1_name} & {selectedBattle.team1.player2_name}</p>
              <p className="interests">Interests: {selectedBattle.team1.player1_interests}, {selectedBattle.team1.player2_interests}</p>
              <button 
                className="winner-button team1" 
                onClick={() => declareBattleWinner(selectedBattle.id, selectedBattle.team1.team_id)}
              >
                Team {selectedBattle.team1.team_id} Wins
              </button>
            </div>
            <div className="battle-vs">VS</div>
            <div className="battle-team-admin">
              <h3>Team {selectedBattle.team2.team_id}</h3>
              <p>{selectedBattle.team2.player1_name} & {selectedBattle.team2.player2_name}</p>
              <p className="interests">Interests: {selectedBattle.team2.player1_interests}, {selectedBattle.team2.player2_interests}</p>
              <button 
                className="winner-button team2" 
                onClick={() => declareBattleWinner(selectedBattle.id, selectedBattle.team2.team_id)}
              >
                Team {selectedBattle.team2.team_id} Wins
              </button>
            </div>
          </div>
          
          <div className="battle-instructions-admin">
            <h3>Battle Instructions</h3>
            <p>{getBattleInstructions(selectedBattle.battleType)}</p>
          </div>
          
          <button 
            className="secondary-button cancel-button"
            onClick={() => setSelectedBattle(null)}
          >
            Return to Battles List
          </button>
        </div>
      ) : (
        <div className="battles-grid-admin">
          <h3>Battle Schedule</h3>
          {battles.map(battle => (
            <div 
              key={battle.id} 
              className={`battle-card-admin ${battle.inProgress ? 'in-progress' : ''} ${battle.winner ? 'completed' : ''}`}
            >
              <div className="battle-header-admin">
                <span className="battle-id-admin">Battle #{battle.id}</span>
                <div className="battle-type-selector">
                  <select 
                    value={battle.battleType}
                    onChange={(e) => changeBattleType(battle, e.target.value)}
                  >
                    {battleTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="battle-teams-preview-admin">
                <div className="team-preview-admin">
                  <h4>Team {battle.team1.team_id}</h4>
                  <p>{battle.team1.player1_name} & {battle.team1.player2_name}</p>
                </div>
                <div className="vs-admin">VS</div>
                <div className="team-preview-admin">
                  <h4>Team {battle.team2.team_id}</h4>
                  <p>{battle.team2.player1_name} & {battle.team2.player2_name}</p>
                </div>
              </div>
              
              {battle.winner ? (
                <div className="battle-result-admin">
                  <p>Winner: Team {battle.winner}</p>
                </div>
              ) : (
                <button 
                  className="start-battle-button-admin"
                  onClick={() => startBattle(battle)}
                  disabled={battle.inProgress}
                >
                  {battle.inProgress ? 'Battle in Progress' : 'Start Battle'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
  
  // Helper function to get battle instructions
  function getBattleInstructions(battleType) {
    switch(battleType) {
      case "Language Challenge - Teach a Song":
        return "Each team has 5 minutes to teach the other team a short song or phrase in a language they know.";
      case "Word Association Game":
        return "Teams take turns saying words that relate to the previous word. The team that hesitates or repeats a word loses.";
      case "Cultural Storytelling":
        return "Each team shares a 2-minute story from their cultural background. The audience votes on the most engaging story.";
      case "Impromptu Skit Performance":
        return "Teams have 3 minutes to create a short skit that incorporates three random words provided by the host.";
      case "Language Pictionary":
        return "One team member draws while their partner guesses. The fastest team to guess correctly wins.";
      default:
        return "Prepare for your battle!";
    }
  }
}

export default TeamBattleAdmin;
