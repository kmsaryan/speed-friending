const express = require('express');
const router = express.Router();
const db = require('../database'); // Import the database connection

router.post('/rate', (req, res) => {
  const { playerId, ratedPlayerId, enjoyment, depth, wouldChatAgain } = req.body;

  if (!playerId || !ratedPlayerId || enjoyment === undefined || depth === undefined || wouldChatAgain === undefined) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  db.run(
    `INSERT INTO ratings (player_id, rated_player_id, enjoyment, depth, would_chat_again) 
     VALUES (?, ?, ?, ?, ?)`,
    [playerId, ratedPlayerId, enjoyment, depth, wouldChatAgain],
    (err) => {
      if (err) {
        console.error('Error inserting rating:', err.message);
        return res.status(500).json({ error: 'Failed to submit rating' });
      }
      res.status(200).json({ message: 'Rating submitted successfully' });
    }
  );
});

module.exports = router;
