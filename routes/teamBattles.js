const express = require('express');
const router = express.Router();
const db = require('../database');

// Notify players when they are teamed up
router.post('/team-up', (req, res) => {
  const { player1Id, player2Id, round } = req.body;

  if (!player1Id || !player2Id || !round) {
    return res.status(400).json({ error: 'Player IDs and round are required' });
  }

  db.run(
    'INSERT INTO teams (player1_id, player2_id, round) VALUES (?, ?, ?)',
    [player1Id, player2Id, round],
    function(err) {
      if (err) {
        console.error('[TEAM]: Error creating team:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }

      // Notify players about their team
      if (global.io) {
        global.io.to(`player_${player1Id}`).emit('team_created', { teammateId: player2Id, round });
        global.io.to(`player_${player2Id}`).emit('team_created', { teammateId: player1Id, round });
      }

      res.status(201).json({ message: 'Team created successfully', teamId: this.lastID });
    }
  );
});

// Fetch team and opponent details
router.get('/battle/:teamId', (req, res) => {
  const { teamId } = req.params;

  db.get(
    `SELECT t1.id AS team1_id, t1.player1_id AS team1_player1, t1.player2_id AS team1_player2,
            t2.id AS team2_id, t2.player1_id AS team2_player1, t2.player2_id AS team2_player2,
            b.battle_type, b.winner_id
     FROM team_battles b
     JOIN teams t1 ON b.team1_id = t1.id
     JOIN teams t2 ON b.team2_id = t2.id
     WHERE t1.id = ? OR t2.id = ?`,
    [teamId, teamId],
    (err, battle) => {
      if (err) {
        console.error('[TEAM BATTLE]: Error fetching battle details:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!battle) {
        return res.status(404).json({ error: 'Battle not found' });
      }

      res.status(200).json(battle);
    }
  );
});

// Get all battles for a specific round
router.get('/team-battles/:round', (req, res) => {
  const round = parseInt(req.params.round, 10) || 1;
  
  console.log(`[TEAM BATTLES]: Fetching battles for round ${round}`);
  
  // First check if status column exists in team_battles table
  db.all("PRAGMA table_info(team_battles)", (err, columns) => {
    if (err) {
      console.error('[TEAM BATTLES]: Error checking table columns:', err.message);
      return res.status(500).json({ error: 'Database error', message: err.message });
    }
    
    const hasStatusColumn = columns.some(col => col.name === 'status');
    console.log(`[TEAM BATTLES]: Status column exists: ${hasStatusColumn}`);
    
    // Build query WITHOUT using status column since it doesn't exist
    let query = `
      SELECT b.id, b.team1_id, b.team2_id, b.battle_type, b.winner_id, 
             t1.compatibility_score AS team1_score, t2.compatibility_score AS team2_score,
             p1.name AS team1_player1_name, p2.name AS team1_player2_name,
             p3.name AS team2_player1_name, p4.name AS team2_player2_name
       FROM team_battles b
       JOIN teams t1 ON b.team1_id = t1.id
       JOIN teams t2 ON b.team2_id = t2.id
       JOIN players p1 ON t1.player1_id = p1.id
       JOIN players p2 ON t1.player2_id = p2.id
       JOIN players p3 ON t2.player1_id = p3.id
       JOIN players p4 ON t2.player2_id = p4.id
       WHERE b.round = ?
       ORDER BY b.id
    `;
    
    db.all(query, [round], (err, battles) => {
      if (err) {
        console.error('[TEAM BATTLES]: Error fetching team battles:', err.message);
        return res.status(500).json({ error: 'Database error', message: err.message });
      }
      
      // Add virtual status field to each battle based on winner_id
      const battlesWithStatus = battles ? battles.map(battle => ({
        ...battle,
        status: battle.winner_id ? 'completed' : 'pending'
      })) : [];
      
      res.status(200).json({ battles: battlesWithStatus });
    });
  });
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

      // Notify all players in the battle
      if (global.io) {
        global.io.emit('battle_result', { battleId, winnerId });
      }

      res.status(200).json({ message: 'Battle result updated successfully' });
    }
  );
});

module.exports = router;
