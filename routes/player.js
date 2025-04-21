const express = require('express');
const router = express.Router();
const db = require('../database');

// Get player details - improved error handling
router.get('/player/:id', (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ error: 'Player ID is required' });
  }
  
  console.log(`[API] Fetching player data for ID: ${id}`);
  
  db.get(
    'SELECT id, name, gender, interests, preferences, playerType, tableNumber, status FROM players WHERE id = ?',
    [id],
    (err, player) => {
      if (err) {
        console.error('[API] Error fetching player data:', err.message);
        return res.status(500).json({ error: 'Database error', message: err.message });
      }
      
      if (!player) {
        console.log(`[API] Player with ID ${id} not found`);
        return res.status(404).json({ error: 'Player not found' });
      }
      
      // Make sure we don't serve invalid names
      if (!player.name || player.name === 'mm' || player.name === 'undefined') {
        player.name = 'Player ' + id;
      }
      
      console.log(`[API] Found player: ${player.name}`);
      res.status(200).json(player);
    }
  );
});

// Add an endpoint to update a player's name
router.put('/player/:id/name', (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: 'Player ID is required' });
  }
  
  if (!name || name.trim() === '' || name === 'mm') {
    return res.status(400).json({ error: 'A valid name is required' });
  }
  
  const cleanName = name.trim();
  
  console.log(`[API] Updating name for player ${id} to "${cleanName}"`);
  
  db.run(
    'UPDATE players SET name = ? WHERE id = ?',
    [cleanName, id],
    function(err) {
      if (err) {
        console.error('[API] Error updating player name:', err.message);
        return res.status(500).json({ error: 'Database error', message: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Player not found' });
      }
      
      console.log(`[API] Successfully updated player ${id} name to "${cleanName}"`);
      res.status(200).json({ message: 'Name updated successfully', name: cleanName });
    }
  );
});

module.exports = router;
