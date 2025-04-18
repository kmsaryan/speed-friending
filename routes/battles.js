const express = require('express');
const router = express.Router();
const db = require('../database');

// Record a battle winner
router.post('/record-battle-winner', (req, res) => {
  const { round, battleId, winningTeamId } = req.body;
  
  if (!round || !battleId || !winningTeamId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Update the battle record with the winner
  db.run(
    `UPDATE team_battles SET winner_id = ? WHERE id = ? AND round = ?`,
    [winningTeamId, battleId, round],
    function(err) {
      if (err) {
        console.error('Error recording battle winner:', err.message);
        return res.status(500).json({ error: 'Database error', message: err.message });
      }
      
      if (this.changes === 0) {
        // If no battle was updated, insert a new record
        db.run(
          `INSERT INTO team_battles (team1_id, team2_id, round, winner_id) VALUES (?, ?, ?, ?)`,
          [battleId * 2 - 1, battleId * 2, round, winningTeamId],
          function(err) {
            if (err) {
              console.error('Error inserting battle record:', err.message);
              return res.status(500).json({ error: 'Database error', message: err.message });
            }
            
            // Update the winning team's score
            db.run(
              `UPDATE teams SET battle_score = battle_score + 1 WHERE id = ? AND round = ?`,
              [winningTeamId, round],
              function(err) {
                if (err) {
                  console.error('Error updating team score:', err.message);
                }
              }
            );
            
            res.status(200).json({ message: 'Battle winner recorded successfully' });
          }
        );
      } else {
        // Update the winning team's score
        db.run(
          `UPDATE teams SET battle_score = battle_score + 1 WHERE id = ? AND round = ?`,
          [winningTeamId, round],
          function(err) {
            if (err) {
              console.error('Error updating team score:', err.message);
            }
          }
        );
        
        res.status(200).json({ message: 'Battle winner updated successfully' });
      }
    }
  );
});

// Get battles for a specific round
router.get('/battles/:round', (req, res) => {
  const { round } = req.params;
  
  db.all(
    `SELECT b.id, b.team1_id, b.team2_id, b.winner_id, b.battle_type,
            t1.player1_id as team1_player1, t1.player2_id as team1_player2,
            t2.player1_id as team2_player1, t2.player2_id as team2_player2,
            p1.name as team1_player1_name, p2.name as team1_player2_name,
            p3.name as team2_player1_name, p4.name as team2_player2_name
     FROM team_battles b
     JOIN teams t1 ON b.team1_id = t1.id
     JOIN teams t2 ON b.team2_id = t2.id
     JOIN players p1 ON t1.player1_id = p1.id
     JOIN players p2 ON t1.player2_id = p2.id
     JOIN players p3 ON t2.player1_id = p3.id
     JOIN players p4 ON t2.player2_id = p4.id
     WHERE b.round = ?`,
    [round],
    (err, battles) => {
      if (err) {
        console.error('Error fetching battles:', err.message);
        return res.status(500).json({ error: 'Database error', message: err.message });
      }
      
      res.status(200).json({ battles });
    }
  );
});

module.exports = router;
