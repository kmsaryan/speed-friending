const express = require('express');
const router = express.Router();
const db = require('../database'); // Import the database connection

router.post('/form-teams', (req, res) => {
  const { round } = req.body;

  db.all(
    `SELECT r1.player_id AS player1, r1.rated_player_id AS player2, 
            r1.enjoyment AS player1_rating, r2.enjoyment AS player2_rating
     FROM ratings r1
     JOIN ratings r2 ON r1.player_id = r2.rated_player_id AND r1.rated_player_id = r2.player_id
     WHERE r1.round = ? AND r2.round = ?`,
    [round, round],
    (err, rows) => {
      if (err) {
        console.error('Database error during team formation:', err.message);
        return res.status(500).json({ error: 'Database error', message: err.message });
      }

      const teams = [];
      const usedPlayers = new Set();

      rows.forEach((row) => {
        const { player1, player2, player1_rating, player2_rating } = row;

        if (
          !usedPlayers.has(player1) &&
          !usedPlayers.has(player2) &&
          Math.abs(player1_rating - player2_rating) <= 1
        ) {
          teams.push({ player1, player2 });
          usedPlayers.add(player1);
          usedPlayers.add(player2);
        }
      });

      console.log('Teams formed:', teams);
      res.status(200).json({ teams });
    }
  );
});

module.exports = router;
