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
