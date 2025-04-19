const express = require('express');
const router = express.Router();
const db = require('../database'); // Import the database connection

router.post('/rate', (req, res) => {
  const { playerId, ratedPlayerId, enjoyment, depth, wouldChatAgain, round = 1 } = req.body;
  
  console.log(`[RATING]: Received rating from player ${playerId} for player ${ratedPlayerId}`);

  if (!playerId || !ratedPlayerId || enjoyment === undefined || depth === undefined || wouldChatAgain === undefined) {
    console.error('[RATING]: Missing required fields in request');
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Check if ratings table has round column
  db.all("PRAGMA table_info(ratings)", (err, columns) => {
    if (err) {
      console.error('[RATING]: Error checking table columns:', err.message);
      return res.status(500).json({ error: 'Database error checking schema' });
    }
    
    const hasRoundColumn = columns.some(col => col.name === 'round');
    
    if (!hasRoundColumn) {
      console.error('[RATING]: Round column missing from ratings table. Running migration...');
      
      // Add round column to the table on the fly
      db.run('ALTER TABLE ratings ADD COLUMN round INTEGER DEFAULT 1', (err) => {
        if (err) {
          console.error('[RATING]: Failed to add round column:', err.message);
          return res.status(500).json({ error: 'Database schema update failed' });
        }
        
        console.log('[RATING]: Added round column to ratings table');
        // After adding the column, proceed with the insertion
        insertRating();
      });
    } else {
      // Column exists, proceed with insertion
      insertRating();
    }
  });

  // Function to insert the rating
  function insertRating() {
    // First, insert the rating
    db.run(
      `INSERT INTO ratings (player_id, rated_player_id, enjoyment, depth, would_chat_again, round) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [playerId, ratedPlayerId, enjoyment, depth, wouldChatAgain, round],
      function(err) {
        if (err) {
          console.error('[RATING]: Error inserting rating:', err.message);
          return res.status(500).json({ error: 'Failed to submit rating' });
        }

        console.log(`[RATING]: Rating submitted: Player ${playerId} rated ${ratedPlayerId}`);
        
        // Make sure we record this as a completed interaction for both players
        db.run(
          `UPDATE players 
           SET interaction_count = COALESCE(interaction_count, 0) + 1 
           WHERE id IN (?, ?)`, 
          [playerId, ratedPlayerId], 
          (err) => {
            if (err) {
              console.error('[RATING]: Error updating interaction count:', err.message);
            } else {
              console.log(`[RATING]: Updated interaction counts for players ${playerId} and ${ratedPlayerId}`);
            }
            
            // Continue with the rest of the flow...
            // Check if status column exists in players table
            db.all("PRAGMA table_info(players)", (err, columns) => {
              if (err) {
                console.error('[RATING]: Error checking table columns:', err.message);
                return res.status(200).json({ message: 'Rating submitted successfully, but player status not updated' });
              }
              
              const hasStatusColumn = columns.some(col => col.name === 'status');
              
              // Update player status to available if the column exists
              if (hasStatusColumn) {
                db.run('UPDATE players SET status = ? WHERE id = ?', ['available', playerId], function(err) {
                  if (err) {
                    console.error(`[RATING]: Error updating player status after rating: ${err.message}`);
                    return res.status(200).json({ message: 'Rating submitted successfully, but player status not updated' });
                  }
                  
                  console.log(`[RATING]: Player ${playerId} status updated to available after rating submission`);
                  
                  // If Socket.IO is initialized, broadcast player status change
                  if (global.io) {
                    global.io.emit('player_status_updated');
                    console.log('[RATING]: Broadcasted player_status_updated event');
                    
                    // Also notify any waiting players that new matches might be available
                    global.io.emit('new_players_available');
                    console.log('[RATING]: Broadcasted new_players_available event');
                  }
                  
                  // Also update the matching record to mark it as rated
                  db.run(
                    `UPDATE matches SET rated = 1 WHERE 
                    (player_id = ? AND matched_player_id = ?) OR 
                    (player_id = ? AND matched_player_id = ?)`,
                    [playerId, ratedPlayerId, ratedPlayerId, playerId],
                    function(err) {
                      if (err) {
                        console.error(`[RATING]: Error updating match rated status: ${err.message}`);
                      }
                    }
                  );
                  
                  res.status(200).json({ 
                    message: 'Rating submitted successfully and player status updated',
                    success: true
                  });
                });
              } else {
                res.status(200).json({ message: 'Rating submitted successfully' });
              }
            });
          }
        );
      }
    );
  }
});

module.exports = router;
