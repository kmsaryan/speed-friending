const express = require('express');
const router = express.Router();
const db = require('../database'); // Import the database connection

// Endpoint to get the count of players by type
router.get('/player-count', (req, res) => {
  const { playerType } = req.query;

  if (!playerType) {
    return res.status(400).json({ error: 'Player type is required' });
  }

  db.get(
    `SELECT COUNT(*) as count FROM players WHERE playerType = ?`,
    [playerType],
    (err, row) => {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(200).json(row);
    }
  );
});

module.exports = router;
