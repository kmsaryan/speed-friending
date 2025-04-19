import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socket from '../utils/socket';
import playerManager from '../utils/playerManager';
import '../styles/global.css';
import '../styles/TeamBattle.css';

function TeamBattle() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [battleDetails, setBattleDetails] = useState(null);
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playerId] = useState(localStorage.getItem('playerId'));
  const [battleInstructions, setBattleInstructions] = useState('');
  
  useEffect(() => {
    if (!playerId || !teamId) {
      console.error('Missing player ID or team ID');
      setError('Missing required information. Please return to the main page.');
      setLoading(false);
      return;
    }

    // Check if player is in this team
    socket.emit("get_player_team", {
      playerId,
      round: 2 // Assuming this is for round 2
    });
    
    // Listen for team information response
    socket.on("player_team_info", (data) => {
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }
      
      if (!data.found) {
        setError('You are not part of this team.');
        setLoading(false);
        return;
      }
      
      // Set team data
      setTeam({
        id: data.teamId,
        player1: playerId,
        player2: data.teammate.id,
        teammateId: data.teammate.id,
        teammateName: data.teammate.name
      });
      
      // Set battle details if available
      if (data.battleType) {
        setBattleDetails({
          battleId: data.battleId,
          battleType: data.battleType,
          instructions: getBattleInstructions(data.battleType)
        });
        
        setBattleInstructions(getBattleInstructions(data.battleType));
      }
      
      // Set opponent data if available
      if (data.opponents) {
        setOpponent({
          teamId: data.opponents.teamId,
          player1: data.opponents.player1.id,
          player2: data.opponents.player2.id,
          player1Name: data.opponents.player1.name,
          player2Name: data.opponents.player2.name
        });
      }
      
      setLoading(false);
    });
    
    // Listen for battle result updates
    socket.on('battle_result', (result) => {
      if (result.battleId && result.winnerId) {
        setWinner(result.winnerId);
        
        // Highlight the winner visually
        if (result.winnerId === parseInt(teamId, 10)) {
          // Our team won
          showWinnerAnimation(true);
        } else {
          // Opponent team won
          showWinnerAnimation(false);
        }
      }
    });

    // Listen for battle updates
    socket.on('battle_update', (data) => {
      if (data.battleType) {
        setBattleDetails(prev => ({
          ...prev,
          battleType: data.battleType,
          instructions: getBattleInstructions(data.battleType)
        }));
        setBattleInstructions(getBattleInstructions(data.battleType));
      }
    });

    return () => {
      socket.off("player_team_info");
      socket.off("battle_result");
      socket.off("battle_update");
    };
  }, [teamId, playerId]);

  // Helper function to get battle instructions based on battle type
  const getBattleInstructions = (battleType) => {
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
        return "Prepare for your battle! Your host will provide specific instructions.";
    }
  };

  // Show winner animation
  const showWinnerAnimation = (isWinner) => {
    const element = document.querySelector('.team-battle-container');
    if (element) {
      element.classList.add(isWinner ? 'winner-animation' : 'loser-animation');
      setTimeout(() => {
        element.classList.remove(isWinner ? 'winner-animation' : 'loser-animation');
      }, 3000);
    }
  };

  if (loading) {
    return (
      <div className="team-battle-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading team battle details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="team-battle-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="team-battle-container">
      <div className="battle-header">
        <h1>Team Battle</h1>
        {battleDetails && (
          <div className="battle-type-badge">{battleDetails.battleType}</div>
        )}
      </div>

      <div className="teams-section">
        <div className={`team-card my-team ${winner && winner === parseInt(teamId, 10) ? 'winner' : ''}`}>
          <h2>Your Team</h2>
          <div className="team-members">
            <div className="team-member">
              <div className="member-avatar">
                {playerId ? 'You' : '?'}
              </div>
              <div className="member-name">You</div>
            </div>
            {team && team.teammateName && (
              <div className="team-member">
                <div className="member-avatar">
                  {team.teammateName.charAt(0).toUpperCase()}
                </div>
                <div className="member-name">{team.teammateName}</div>
              </div>
            )}
          </div>
        </div>
        
        <div className="vs-container">
          <div className="vs-circle">VS</div>
        </div>
        
        {opponent ? (
          <div className={`team-card opponent-team ${winner && winner !== parseInt(teamId, 10) ? 'winner' : ''}`}>
            <h2>Opponent Team</h2>
            <div className="team-members">
              <div className="team-member">
                <div className="member-avatar">
                  {opponent.player1Name && opponent.player1Name.charAt(0).toUpperCase()}
                </div>
                <div className="member-name">{opponent.player1Name}</div>
              </div>
              <div className="team-member">
                <div className="member-avatar">
                  {opponent.player2Name && opponent.player2Name.charAt(0).toUpperCase()}
                </div>
                <div className="member-name">{opponent.player2Name}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="team-card opponent-team not-assigned">
            <h2>Waiting for Opponents</h2>
            <p>The admin will assign your opponents</p>
          </div>
        )}
      </div>

      {battleInstructions && (
        <div className="battle-instructions">
          <h3>Battle Instructions</h3>
          <p>{battleInstructions}</p>
        </div>
      )}

      {winner && (
        <div className="winner-announcement">
          <h2>{winner === parseInt(teamId, 10) ? 'Congratulations! Your team won!' : 'Your opponent team won.'}</h2>
          <p>Get ready for the next activity!</p>
        </div>
      )}
    </div>
  );
}

export default TeamBattle;
