const express = require('express');
const router = express.Router();
const db = require('../database');

// Form teams based on ratings
router.post('/form-teams', (req, res) => {
  // Handle missing round parameter with default value of 1
  const round = parseInt(req.body.round, 10) || 1;
  
  // Important: Always use round 1 ratings for team formation
  // This ensures we use player preferences from round 1 even when in round 2
  const ratingRound = 1; // Always use round 1 ratings regardless of current round

  console.log(`[TEAMS]: Forming teams for round ${round} using ratings from round ${ratingRound}`);

  // Debug log: Check ratings data
  db.all('SELECT * FROM ratings WHERE round = ?', [ratingRound], (err, allRatings) => {
    if (err) {
      console.error('[TEAMS DEBUG]: Error checking ratings:', err.message);
    } else {
      console.log(`[TEAMS DEBUG]: Found ${allRatings.length} ratings for round ${ratingRound}`);
    }
  });

  db.all(
    `SELECT r1.player_id AS player1, r1.rated_player_id AS player2, 
            r1.enjoyment AS player1_enjoyment, r2.enjoyment AS player2_enjoyment,
            r1.depth AS player1_depth, r2.depth AS player2_depth,
            r1.would_chat_again AS player1_would_chat_again, r2.would_chat_again AS player2_would_chat_again,
            p1.name AS player1_name, p2.name AS player2_name,
            p1.interests AS player1_interests, p2.interests AS player2_interests
     FROM ratings r1
     JOIN ratings r2 ON r1.player_id = r2.rated_player_id AND r1.rated_player_id = r2.player_id
     JOIN players p1 ON r1.player_id = p1.id
     JOIN players p2 ON r1.rated_player_id = p2.id
     WHERE r1.round = ? AND r2.round = ?
     ORDER BY (ABS(r1.enjoyment - r2.enjoyment) + ABS(r1.depth - r2.depth)) ASC`,
    [ratingRound, ratingRound], // Use ratingRound (always 1) instead of current round
    (err, pairs) => {
      if (err) {
        console.error('Database error during team formation:', err.message);
        return res.status(500).json({ error: 'Database error', message: err.message });
      }
      
      // Enhanced algorithm to find optimal pairs based on mutual high ratings
      const pairsWithScores = pairs.map(pair => {
        // Calculate mutual enjoyment & depth (lower difference = more compatible)
        const enjoymentDiff = Math.abs(pair.player1_enjoyment - pair.player2_enjoyment);
        const depthDiff = Math.abs(pair.player1_depth - pair.player2_depth);
        
        // Calculate mutual interest (higher = better)
        const mutualEnjoyment = (pair.player1_enjoyment + pair.player2_enjoyment) / 2;
        const mutualDepth = (pair.player1_depth + pair.player2_depth) / 2;
        
        // Both want to chat again is a strong indicator
        const bothWantToChat = pair.player1_would_chat_again && pair.player2_would_chat_again;
        
        // Calculate compatibility score (higher = better match)
        // Formula: mutual ratings (max 10) - difference penalty (max 8) + chat bonus (2)
        const compatibilityScore = 
          (mutualEnjoyment + mutualDepth) - 
          (enjoymentDiff + depthDiff) * 2 + 
          (bothWantToChat ? 2 : 0);
        
        return {
          ...pair,
          compatibilityScore,
          bothWantToChat
        };
      });
      
      // Sort pairs by compatibility score (descending)
      pairsWithScores.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
      
      // Now form teams from this sorted list
      const teams = [];
      const usedPlayers = new Set();
      
      pairsWithScores.forEach((pair) => {
        const { player1, player2 } = pair;
        // Skip if either player is already in a team
        if (usedPlayers.has(player1) || usedPlayers.has(player2)) {
          return;
        }
        
        // Only pair if there's enough compatibility or they both want to chat again
        if (pair.compatibilityScore > 5 || pair.bothWantToChat) {
          teams.push({
            team_id: teams.length + 1,
            player1: player1,
            player2: player2,
            player1_name: pair.player1_name,
            player2_name: pair.player2_name,
            player1_interests: pair.player1_interests,
            player2_interests: pair.player2_interests,
            compatibility_score: pair.compatibilityScore
          });
          
          usedPlayers.add(player1);
          usedPlayers.add(player2);
          
          // Record the team in database for the current round (not rating round)
          db.run(
            'INSERT INTO teams (player1_id, player2_id, round, compatibility_score) VALUES (?, ?, ?, ?)',
            [player1, player2, round, pair.compatibilityScore],
            (err) => {
              if (err) console.error('Error recording team:', err.message);
            }
          );
        } 
      });
      
      console.log(`Teams formed: ${teams.length} for round ${round} using ratings from round ${ratingRound}`);
      res.status(200).json({ teams });
    }
  );
});

// Get all teams for the current round
router.get('/teams/:round', (req, res) => {
  // Handle missing or invalid round parameter
  const round = parseInt(req.params.round, 10) || 1;
  
  db.all(
    `SELECT t.id as team_id, t.player1_id, t.player2_id, 
            p1.name as player1_name, p2.name as player2_name,
            p1.interests as player1_interests, p2.interests as player2_interests,
            t.compatibility_score
     FROM teams t
     JOIN players p1 ON t.player1_id = p1.id
     JOIN players p2 ON t.player2_id = p2.id
     WHERE t.round = ?
     ORDER BY t.compatibility_score DESC`,
    [round],
    (err, teams) => {
      if (err) {
        console.error('Database error fetching teams:', err.message);
        return res.status(500).json({ error: 'Database error', message: err.message });
      }
      res.status(200).json({ teams });
    }
  );
});

// Add an endpoint to get a player's team
router.get('/player-team/:playerId', (req, res) => {
  const { playerId } = req.params;
  const round = parseInt(req.query.round, 10) || 2;
  
  if (!playerId) {
    return res.status(400).json({ error: 'Player ID is required' });
  }
  
  // Query to find the team containing this player
  db.get(
    `SELECT t.id as teamId, t.player1_id, t.player2_id, t.compatibility_score, 
            p1.name as player1_name, p2.name as player2_name
     FROM teams t
     JOIN players p1 ON t.player1_id = p1.id
     JOIN players p2 ON t.player2_id = p2.id
     WHERE (t.player1_id = ? OR t.player2_id = ?) AND t.round = ?`,
    [playerId, playerId, round],
    (err, team) => {
      if (err) {
        console.error('Error fetching player team:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!team) {
        return res.status(200).json({ 
          found: false,
          message: 'No team found for this player in this round'
        });
      }
      
      // Determine the teammate based on which player ID matches
      let teammateId, teammateName;
      
      if (parseInt(team.player1_id, 10) === parseInt(playerId, 10)) {
        teammateId = team.player2_id;
        teammateName = team.player2_name;
      } else {
        teammateId = team.player1_id;
        teammateName = team.player1_name;
      }
      
      res.status(200).json({
        found: true,
        teamId: team.teamId,
        compatibility: team.compatibility_score,
        teammate: {
          id: teammateId,
          name: teammateName
        }
      });
    }
  );
});

// Add the endpoint for getting team by player ID
router.get('/player-team/:playerId', (req, res) => {
  const { playerId } = req.params;
  const round = parseInt(req.query.round, 10) || 2; // Default to round 2 for team battles
  
  if (!playerId) {
    return res.status(400).json({ error: 'Player ID is required' });
  }
  
  console.log(`[TEAM API]: Getting team for player ${playerId} in round ${round}`);
  
  // Find teams where this player is either player1 or player2
  db.get(
    `SELECT t.*, p2.name as teammate_name, p2.id as teammate_id
     FROM teams t
     JOIN players p1 ON (t.player1_id = ? AND t.player2_id = p1.id) OR (t.player2_id = ? AND t.player1_id = p1.id)
     JOIN players p2 ON (t.player1_id = ? AND t.player2_id = p2.id) OR (t.player2_id = ? AND t.player1_id = p2.id)
     WHERE t.round = ? AND p2.id != ?`,
    [playerId, playerId, playerId, playerId, round, playerId],
    (err, team) => {
      if (err) {
        console.error('[TEAM API]: Database error fetching team:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!team) {
        console.log(`[TEAM API]: No team found for player ${playerId} in round ${round}`);
        return res.status(404).json({ 
          found: false,
          message: `No team found for player ${playerId} in round ${round}`
        });
      }
      
      console.log(`[TEAM API]: Found team ${team.id} for player ${playerId} with teammate ${team.teammate_id}`);
      
      const isPlayer1 = parseInt(playerId, 10) === team.player1_id;
      const teammateId = isPlayer1 ? team.player2_id : team.player1_id;
      const teammateName = isPlayer1 ? team.player2_name : team.player1_name;

      const response = {
        found: true,
        teamId: team.id,
        role: isPlayer1 ? 'player1' : 'player2',
        teammate: { id: teammateId, name: teammateName },
        round: round,
      };
      
      // Now check if this team is in a battle
      db.get(
        `SELECT tb.* FROM team_battles tb
         WHERE (tb.team1_id = ? OR tb.team2_id = ?) AND tb.round = ?`,
        [team.id, team.id, round],
        (err, battle) => {
          if (err) {
            console.error('[TEAM API]: Database error fetching battle:', err.message);
            return res.status(500).json({ error: 'Database error' });
          }
          
          if (battle) {
            response.battleId = battle.id;
            response.battleType = battle.battle_type;
            response.winnerId = battle.winner_id;
            
            // If there's a battle, also get the opponent team details
            const opponentTeamId = battle.team1_id === team.id ? battle.team2_id : battle.team1_id;
            db.get(
              `SELECT t.*, p1.name as player1_name, p2.name as player2_name
               FROM teams t
               JOIN players p1 ON t.player1_id = p1.id
               JOIN players p2 ON t.player2_id = p2.id
               WHERE t.id = ?`,
              [opponentTeamId],
              (err, opponentTeam) => {
                if (!err && opponentTeam) {
                  response.opponents = {
                    teamId: opponentTeamId,
                    player1: {
                      id: opponentTeam.player1_id,
                      name: opponentTeam.player1_name
                    },
                    player2: {
                      id: opponentTeam.player2_id,
                      name: opponentTeam.player2_name
                    }
                  };
                }
                
                res.status(200).json(response);
              }
            );
          } else {
            res.status(200).json(response);
          }
        }
      );
    }
  );
});

// Get team information for a player
router.get('/teams/player/:playerId', (req, res) => {
  const { playerId } = req.params;
  const round = parseInt(req.query.round || 2, 10);
  
  if (!playerId) {
    return res.status(400).json({ error: 'Player ID is required' });
  }
  
  db.get(
    `SELECT t.id, t.player1_id, t.player2_id, 
            p1.name as player1_name, p2.name as player2_name,
            t.compatibility_score
     FROM teams t
     JOIN players p1 ON t.player1_id = p1.id
     JOIN players p2 ON t.player2_id = p2.id
     WHERE (t.player1_id = ? OR t.player2_id = ?) AND t.round = ?`,
    [playerId, playerId, round],
    (err, team) => {
      if (err) {
        console.error('[TEAM API]:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!team) {
        return res.status(404).json({ 
          found: false,
          message: 'No team found for this player in the current round.'
        });
      }
      
      // Determine player's role and teammate
      const isPlayer1 = parseInt(playerId, 10) === team.player1_id;
      const teammateId = isPlayer1 ? team.player2_id : team.player1_id;
      const teammateName = isPlayer1 ? team.player2_name : team.player1_name;
      const role = isPlayer1 ? 'player1' : 'player2';
      
      // Check for battle assignment
      db.get(
        `SELECT * FROM team_battles 
         WHERE (team1_id = ? OR team2_id = ?) AND round = ?`,
        [team.id, team.id, round],
        (err, battle) => {
          const response = {
            found: true,
            teamId: team.id,
            role: role,
            teammate: {
              id: teammateId,
              name: teammateName
            },
            round: round
          };
          
          if (battle) {
            response.battleId = battle.id;
            response.battleType = battle.battle_type;
            response.battleStatus = battle.status;
            
            // Get opponent team info if in a battle
            const opponentTeamId = battle.team1_id === team.id ? battle.team2_id : battle.team1_id;
            db.get(
              `SELECT t.*, p1.name as player1_name, p2.name as player2_name
               FROM teams t
               JOIN players p1 ON t.player1_id = p1.id
               JOIN players p2 ON t.player2_id = p2.id
               WHERE t.id = ?`,
              [opponentTeamId],
              (err, opponentTeam) => {
                if (!err && opponentTeam) {
                  response.opponents = {
                    teamId: opponentTeamId,
                    player1: {
                      id: opponentTeam.player1_id,
                      name: opponentTeam.player1_name
                    },
                    player2: {
                      id: opponentTeam.player2_id,
                      name: opponentTeam.player2_name
                    }
                  };
                }
                
                res.json(response);
              }
            );
          } else {
            res.json(response);
          }
        }
      );
    }
  );
});

module.exports = router;
