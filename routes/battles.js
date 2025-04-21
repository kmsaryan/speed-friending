const express = require('express');
const router = express.Router();
const db = require('../database');

// Get battles for a specific round
router.get('/battles/:round', (req, res) => {
  // Handle missing or invalid round parameter
  const round = parseInt(req.params.round, 10) || 1;
  
  db.all(
    `SELECT b.id, b.team1_id, b.team2_id, b.battle_type, b.winner_id, b.status, b.round
     FROM team_battles b
     WHERE b.round = ?
     ORDER BY b.id ASC`,
    [round],
    (err, battles) => {
      if (err) {
        console.error('Database error fetching battles:', err.message);
        return res.status(500).json({ error: 'Database error', message: err.message });
      }
      
      console.log(`Retrieved ${battles.length} battles for round ${round}`);
      res.status(200).json({ battles });
    }
  );
});

// Create new team battles
router.post('/battles/create', (req, res) => {
  const { battles } = req.body;
  
  if (!battles || !Array.isArray(battles) || battles.length === 0) {
    return res.status(400).json({ error: 'No valid battle data provided' });
  }
  
  // Begin a transaction to insert all battles
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    const stmt = db.prepare(
      `INSERT INTO team_battles (team1_id, team2_id, battle_type, round, status)
       VALUES (?, ?, ?, ?, ?)`
    );
    
    const createdBattles = [];
    
    battles.forEach((battle) => {
      stmt.run(
        [battle.team1_id, battle.team2_id, battle.battle_type, battle.round, 'pending'],
        function(err) {
          if (err) {
            console.error('Error inserting battle:', err.message);
            return;
          }
          
          createdBattles.push({
            id: this.lastID,
            ...battle
          });
        }
      );
    });
    
    stmt.finalize();
    
    db.run('COMMIT', (err) => {
      if (err) {
        console.error('Error committing transaction:', err.message);
        return res.status(500).json({ error: 'Database error', message: err.message });
      }
      
      console.log(`Created ${createdBattles.length} new battles`);
      res.status(201).json({ battles: createdBattles });
    });
  });
});

// Start a battle
router.post('/battles/:id/start', (req, res) => {
  const { id } = req.params;
  
  db.run(
    'UPDATE team_battles SET status = ? WHERE id = ?',
    ['in_progress', id],
    function(err) {
      if (err) {
        console.error('Error starting battle:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Battle not found' });
      }
      
      // Notify clients about battle status change
      if (global.io) {
        global.io.emit('battle_status_update', {
          battleId: id,
          status: 'in_progress'
        });
      }
      
      res.status(200).json({ message: 'Battle started' });
    }
  );
});

// Declare a winner
router.post('/battles/:id/winner', (req, res) => {
  const { id } = req.params;
  const { winner_id } = req.body;
  
  if (!winner_id) {
    return res.status(400).json({ error: 'Winner ID is required' });
  }
  
  db.run(
    'UPDATE team_battles SET winner_id = ?, status = ? WHERE id = ?',
    [winner_id, 'completed', id],
    function(err) {
      if (err) {
        console.error('Error setting battle winner:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Battle not found' });
      }
      
      // Update the winning team's score
      db.run(
        'UPDATE teams SET battle_score = battle_score + 1 WHERE id = ?',
        [winner_id],
        (err) => {
          if (err) {
            console.error('Error updating team score:', err.message);
          }
        }
      );
      
      // Notify clients about the battle result
      if (global.io) {
        global.io.emit('battle_result', {
          battleId: id,
          winnerId: winner_id
        });
      }
      
      res.status(200).json({ 
        message: 'Winner declared',
        battleId: id,
        winnerId: winner_id
      });
    }
  );
});

// Broadcast battle results
router.post('/battle-result', (req, res) => {
  const { battleId, winnerId } = req.body;

  if (!battleId || !winnerId) {
    return res.status(400).json({ error: 'Battle ID and winner ID are required' });
  }

  db.run(
    'UPDATE team_battles SET winner_id = ? WHERE id = ?',
    [winnerId, battleId],
    function(err) {
      if (err) {
        console.error('[TEAM BATTLE]: Error updating battle result:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }

      // Notify all players in the battle if Socket.IO is initialized
      if (global.io) {
        global.io.emit('battle_result', { battleId, winnerId });
      }

      res.status(200).json({ message: 'Battle result updated successfully' });
    }
  );
});

module.exports = router;
