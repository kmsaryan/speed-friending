const express = require('express');
const router = express.Router();
const db = require('../database'); // Import the database connection

router.post('/rate', (req, res) => {
  const { playerId, ratedPlayerId, enjoyment, depth, wouldChatAgain, round = 1 } = req.body;

  if (!playerId || !ratedPlayerId || enjoyment === undefined || depth === undefined || wouldChatAgain === undefined) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // First, insert the rating
  db.run(
    `INSERT INTO ratings (player_id, rated_player_id, enjoyment, depth, would_chat_again, round) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [playerId, ratedPlayerId, enjoyment, depth, wouldChatAgain, round],
    function(err) {
      if (err) {
        console.error('Error inserting rating:', err.message);
        return res.status(500).json({ error: 'Failed to submit rating' });
      }

      console.log(`Rating submitted: Player ${playerId} rated ${ratedPlayerId}`);
      
      // Check if status column exists in players table
      db.all("PRAGMA table_info(players)", (err, columns) => {
        if (err) {
          console.error('Error checking table columns:', err.message);
          return res.status(200).json({ message: 'Rating submitted successfully, but player status not updated' });
        }
        
        const hasStatusColumn = columns.some(col => col.name === 'status');
        
        // Update player status to available if the column exists
        if (hasStatusColumn) {
          db.run('UPDATE players SET status = ? WHERE id = ?', ['available', playerId], function(err) {
            if (err) {
              console.error(`Error updating player status after rating: ${err.message}`);
              return res.status(200).json({ message: 'Rating submitted successfully, but player status not updated' });
            }
            
            console.log(`Player ${playerId} status updated to available after rating submission`);
            res.status(200).json({ message: 'Rating submitted successfully and player status updated' });
          });
        } else {
          res.status(200).json({ message: 'Rating submitted successfully' });
        }
      });
    }
  );
});

module.exports = router;
