const express = require('express');
const router = express.Router();
const db = require('../database');

router.post('/complete-round', (req, res) => {
  const { playerId, round } = req.body;

  if (!playerId || !round) {
    return res.status(400).json({ error: 'Player ID and round are required' });
  }

  console.log(`[ROUND]: Player ${playerId} completing round ${round}`);

  if (round === 1) {
    // Mark round 1 as completed and move to round 2
    db.run(
      `UPDATE players SET current_round = 2, status = 'available' WHERE id = ?`,
      [playerId],
      function(err) {
        if (err) {
          console.error('[ROUND]: Error updating player round:', err.message);
          return res.status(500).json({ error: 'Database error' });
        }

        console.log(`[ROUND]: Player ${playerId} moved to round 2`);
        res.status(200).json({ nextRound: 2 });
      }
    );
  } else {
    res.status(400).json({ error: 'Invalid round' });
  }
});

module.exports = router;
