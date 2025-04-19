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

  useEffect(() => {
    if (playerManager.currentRound !== 2) {
      console.error('Player is not in round 2. Redirecting...');
      playerManager.redirectToNextRound(navigate);
      return;
    }

    // Fetch team and opponent details
    const fetchBattleDetails = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/team-battles/battle/${teamId}`
        );
        const data = await response.json();
        setTeam({
          player1: data.team1_player1,
          player2: data.team1_player2,
        });
        setOpponent({
          player1: data.team2_player1,
          player2: data.team2_player2,
        });
        setBattleDetails({
          battleType: data.battle_type,
        });
        setWinner(data.winner_id);
      } catch (error) {
        console.error('Error fetching battle details:', error);
      }
    };

    fetchBattleDetails();

    // Listen for battle result updates
    socket.on('battle_result', (result) => {
      if (result.battleId === parseInt(teamId)) {
        setWinner(result.winnerId);
      }
    });

    return () => {
      socket.off('battle_result');
    };
  }, [teamId, navigate]);

  if (!team || !opponent || !battleDetails) {
    return <div>Loading battle details...</div>;
  }

  return (
    <div className="team-battle-container">
      <h1>Team Battle</h1>
      <div className="team-section">
        <h2>Your Team</h2>
        <p>Player 1: {team.player1}</p>
        <p>Player 2: {team.player2}</p>
      </div>
      <div className="opponent-section">
        <h2>Opponent Team</h2>
        <p>Player 1: {opponent.player1}</p>
        <p>Player 2: {opponent.player2}</p>
      </div>
      <div className="battle-details">
        <h2>Battle Details</h2>
        <p>Battle Type: {battleDetails.battleType}</p>
      </div>
      {winner && (
        <div className="winner-section">
          <h2>Winner</h2>
          <p>Team {winner === teamId ? 'Your Team' : 'Opponent Team'} won the battle!</p>
        </div>
      )}
    </div>
  );
}

export default TeamBattle;
