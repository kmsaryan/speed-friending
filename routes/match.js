const express = require('express');
const router = express.Router();
const db = require('../database');

// Check if status column exists
let statusColumnExists = false;
db.all("PRAGMA table_info(players)", (err, rows) => {
  if (!err) {
    statusColumnExists = rows.some(row => row.name === 'status');
    console.log(`Match route: Status column ${statusColumnExists ? 'exists' : 'does not exist'} in players table`);
  }
});

// Add function to increment interaction counts for both players
function incrementInteractionCount(player1Id, player2Id) {
  db.run(
    'UPDATE players SET interaction_count = COALESCE(interaction_count, 0) + 1 WHERE id IN (?, ?)',
    [player1Id, player2Id],
    (err) => {
      if (err) {
        console.error(`Error updating interaction counts: ${err.message}`);
      } else {
        console.log(`Interaction counts incremented for players ${player1Id} and ${player2Id}`);
      }
    }
  );
}

router.get('/match/:playerType', (req, res) => {
  const playerType = req.params.playerType;
  console.log(`Matching request for player type: ${playerType}`);

  const oppositeType = playerType === 'stationary' ? 'moving' : 'stationary';

  // Use a query that works whether or not the status column exists
  const query = statusColumnExists 
    ? `SELECT id, name, gender, interests, preferences, playerType, tableNumber  
       FROM players 
       WHERE playerType = ? AND status = 'available' AND id != ? AND id NOT IN (
         SELECT matched_player_id FROM matches WHERE player_id = ?
       ) 
       ORDER BY RANDOM() LIMIT 1`
    : `SELECT id, name, gender, interests, preferences, playerType, tableNumber
       FROM players 
       WHERE playerType = ? AND id != ? AND id NOT IN (
         SELECT matched_player_id FROM matches WHERE player_id = ?
       ) 
       ORDER BY RANDOM() LIMIT 1`;

  db.get(
    query,
    [oppositeType, req.query.playerId, req.query.playerId],
    (err, row) => {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(500).json({ error: 'Database error', message: err.message });
      }
      if (row) {
        console.log('Match found with opposite type:', row);

        // Update status only if the column exists
        if (statusColumnExists) {
          db.run('UPDATE players SET status = ? WHERE id = ?', ['matched', row.id]);
          db.run('UPDATE players SET status = ? WHERE id = ?', ['matched', req.query.playerId]);
        }

        db.run(
          'INSERT INTO matches (player_id, matched_player_id, round) VALUES (?, ?, ?)',
          [req.query.playerId, row.id, 1],
          function(err) {
            if (err) return res.status(500).send(err.message);
            
            // Increment interaction count when match is created
            incrementInteractionCount(req.query.playerId, row.id);
            
            res.status(200).send(row);
          }
        );
        return;
      }

      res.status(404).json({ error: 'No match found. Waiting for more players.' });
    }
  );
});

module.exports = router;
