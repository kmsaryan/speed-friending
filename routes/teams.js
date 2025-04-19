const express = require('express');
const router = express.Router();
const db = require('../database');

router.post('/form-teams', (req, res) => {
  // Handle missing round parameter with default value of 1
  const round = parseInt(req.body.round, 10) || 1;

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
    [round, round],
    (err, pairs) => {
      if (err) {
        console.error('Database error during team formation:', err.message);
        return res.status(500).json({ error: 'Database error', message: err.message });
      }

      const teams = [];
      const usedPlayers = new Set();

      // Enhanced algorithm to find optimal pairs
      pairs.forEach((pair) => {
        const { player1, player2 } = pair;

        // Skip if either player is already in a team
        if (usedPlayers.has(player1) || usedPlayers.has(player2)) {
          return;
        }

        // Calculate compatibility score (lower is better)
        const enjoymentDiff = Math.abs(pair.player1_enjoyment - pair.player2_enjoyment);
        const depthDiff = Math.abs(pair.player1_depth - pair.player2_depth);
        const bothWantToChat = pair.player1_would_chat_again && pair.player2_would_chat_again;
        
        // Only pair if they both want to chat again and have similar ratings
        if (bothWantToChat && enjoymentDiff <= 1 && depthDiff <= 1) {
          teams.push({
            team_id: teams.length + 1,
            player1: player1,
            player2: player2,
            player1_name: pair.player1_name,
            player2_name: pair.player2_name,
            player1_interests: pair.player1_interests,
            player2_interests: pair.player2_interests,
            compatibility_score: enjoymentDiff + depthDiff
          });
          
          usedPlayers.add(player1);
          usedPlayers.add(player2);
          
          // Record the team in database
          db.run(
            'INSERT INTO teams (player1_id, player2_id, round, compatibility_score) VALUES (?, ?, ?, ?)',
            [player1, player2, round, enjoymentDiff + depthDiff],
            (err) => {
              if (err) console.error('Error recording team:', err.message);
            }
          );
        }
      });

      console.log(`Teams formed: ${teams.length}`);
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
     ORDER BY t.compatibility_score ASC`,
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

module.exports = router;
