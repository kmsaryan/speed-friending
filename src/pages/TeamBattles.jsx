import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/TeamBattles.css';

function TeamBattles() {
  const [teams, setTeams] = useState([]);
  const [battles, setBattles] = useState([]);
  const [selectedBattle, setSelectedBattle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { round } = useParams();
  const navigate = useNavigate();
  
  const battleTypes = [
    "Language Challenge - Teach a Song",
    "Word Association Game",
    "Cultural Storytelling",
    "Impromptu Skit Performance",
    "Language Pictionary"
  ];
  
  useEffect(() => {
    // Fetch teams for the current round
    fetchTeams();
  }, [round]);
  
  const fetchTeams = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/teams/${round}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }
      
      const data = await response.json();
      setTeams(data.teams);
      
      // Generate battles if teams exist
      if (data.teams.length >= 2) {
        generateBattles(data.teams);
      }
      setLoading(false);
    } catch (err) {
      setError('Error loading teams: ' + err.message);
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
    
    // Handle odd number of teams
    if (teamsCopy.length % 2 !== 0 && teamsCopy.length > 0) {
      // Last team gets a bye or faces a wildcard team
      battlePairings.push({
        id: Math.floor(teamsCopy.length / 2) + 1,
        team1: teamsCopy[teamsCopy.length - 1],
        team2: { team_id: 'wildcard', player1_name: 'Wildcard', player2_name: 'Team' },
        battleType: battleTypes[Math.floor(Math.random() * battleTypes.length)],
        winner: null,
        inProgress: false
      });
    }
    
    setBattles(battlePairings);
  };
  
  const startBattle = (battle) => {
    // Update the selected battle and mark it as in progress
    setSelectedBattle({...battle, inProgress: true});
    
    // Update battles list to mark this one as in progress
    const updatedBattles = battles.map(b => 
      b.id === battle.id ? {...b, inProgress: true} : b
    );
    setBattles(updatedBattles);
  };
  
  const declareBattleWinner = (battleId, winningTeamId) => {
    // Update battles to record the winner
    const updatedBattles = battles.map(b => 
      b.id === battleId ? {...b, winner: winningTeamId, inProgress: false} : b
    );
    setBattles(updatedBattles);
    setSelectedBattle(null);
    
    // In a real implementation, you would send this to the backend
    // to record the battle outcome
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
  
  if (loading) {
    return (
      <div className="team-battles-container">
        <h1>Team Battles - Round {round}</h1>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading teams...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="team-battles-container">
        <h1>Team Battles - Round {round}</h1>
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchTeams}>Try Again</button>
        </div>
      </div>
    );
  }
  
  if (teams.length === 0) {
    return (
      <div className="team-battles-container">
        <h1>Team Battles - Round {round}</h1>
        <div className="no-teams-message">
          <h2>No Teams Available</h2>
          <p>Teams need to be formed before battles can begin.</p>
          <button onClick={() => navigate('/admin')}>Go to Admin Panel</button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="team-battles-container">
      <h1>Team Battles - Round {round}</h1>
      
      {selectedBattle ? (
        <div className="active-battle">
          <h2>Active Battle: {selectedBattle.battleType}</h2>
          <div className="battle-teams">
            <div className="battle-team">
              <h3>Team 1</h3>
              <p>{selectedBattle.team1.player1_name} & {selectedBattle.team1.player2_name}</p>
              <p>Interests: {selectedBattle.team1.player1_interests}, {selectedBattle.team1.player2_interests}</p>
              <button 
                className="winner-button team1" 
                onClick={() => declareBattleWinner(selectedBattle.id, selectedBattle.team1.team_id)}
              >
                Declare Winner
              </button>
            </div>
            <div className="battle-vs">VS</div>
            <div className="battle-team">
              <h3>Team 2</h3>
              <p>{selectedBattle.team2.player1_name} & {selectedBattle.team2.player2_name}</p>
              <p>Interests: {selectedBattle.team2.player1_interests}, {selectedBattle.team2.player2_interests}</p>
              <button 
                className="winner-button team2" 
                onClick={() => declareBattleWinner(selectedBattle.id, selectedBattle.team2.team_id)}
              >
                Declare Winner
              </button>
            </div>
          </div>
          <div className="battle-instructions">
            <h3>Battle Instructions</h3>
            <p>
              {selectedBattle.battleType === "Language Challenge - Teach a Song" && 
                "Each team has 5 minutes to teach the other team a short song or phrase in a language they know."}
              {selectedBattle.battleType === "Word Association Game" && 
                "Teams take turns saying words that relate to the previous word. The team that hesitates or repeats a word loses."}
              {selectedBattle.battleType === "Cultural Storytelling" && 
                "Each team shares a 2-minute story from their cultural background. The audience votes on the most engaging story."}
              {selectedBattle.battleType === "Impromptu Skit Performance" && 
                "Teams have 3 minutes to create a short skit that incorporates three random words provided by the host."}
              {selectedBattle.battleType === "Language Pictionary" && 
                "One team member draws while their partner guesses. The fastest team to guess correctly wins."}
            </p>
          </div>
        </div>
      ) : (
        <>
          <h2>Battle Schedule</h2>
          <div className="battles-grid">
            {battles.map(battle => (
              <div 
                key={battle.id} 
                className={`battle-card ${battle.inProgress ? 'in-progress' : ''} ${battle.winner ? 'completed' : ''}`}
              >
                <div className="battle-header">
                  <span className="battle-id">Battle #{battle.id}</span>
                  <span className="battle-type">{battle.battleType}</span>
                </div>
                <div className="battle-teams-preview">
                  <div className="team-preview">
                    <h3>Team {battle.team1.team_id}</h3>
                    <p>{battle.team1.player1_name} & {battle.team1.player2_name}</p>
                  </div>
                  <div className="vs">VS</div>
                  <div className="team-preview">
                    <h3>Team {battle.team2.team_id}</h3>
                    <p>{battle.team2.player1_name} & {battle.team2.player2_name}</p>
                  </div>
                </div>
                
                {battle.winner ? (
                  <div className="battle-result">
                    <p>Winner: Team {battle.winner}</p>
                  </div>
                ) : (
                  <button 
                    className="start-battle-button"
                    onClick={() => startBattle(battle)}
                    disabled={battle.inProgress}
                  >
                    {battle.inProgress ? 'Battle in Progress' : 'Start Battle'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default TeamBattles;
