const express = require('express');
const router = express.Router();
const db = require('../database');

// Create battles for a round
router.post('/create-battles', (req, res) => {
  const { battles, round } = req.body;
  
  if (!battles || !Array.isArray(battles) || battles.length === 0 || !round) {
    return res.status(400).json({ error: 'Battles array and round are required' });
  }
  
  console.log(`[BATTLES]: Creating ${battles.length} battles for round ${round}`);
  
  // Create a transaction to insert all battles
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    let successCount = 0;
    let errorOccurred = false;
    
    battles.forEach((battle) => {
      db.run(
        'INSERT INTO team_battles (team1_id, team2_id, round, battle_type) VALUES (?, ?, ?, ?)',
        [battle.team1.team_id, battle.team2.team_id, round, battle.battleType],
        function(err) {
          if (err) {
            console.error('[BATTLES]: Error inserting battle:', err.message);
            errorOccurred = true;
          } else {
            successCount++;
            console.log(`[BATTLES]: Created battle ${this.lastID} between teams ${battle.team1.team_id} and ${battle.team2.team_id}`);
          }
        }
      );
    });
    
    db.run('COMMIT', function(err) {
      if (err || errorOccurred) {
        console.error('[BATTLES]: Error committing transaction:', err ? err.message : 'See previous errors');
        return res.status(500).json({ error: 'Database error', message: err ? err.message : 'Error inserting battles' });
      }
      
      res.status(201).json({ 
        message: `Successfully created ${successCount} battles`,
        count: successCount
      });
    });
  });
});

// Record battle winner
router.post('/record-battle-winner', (req, res) => {
  const { battleId, winningTeamId, round } = req.body;

  if (!battleId || !winningTeamId || !round) {
    return res.status(400).json({ error: 'Battle ID, winner ID, and round are required' });
  }
  
  console.log(`[BATTLES]: Recording winner ${winningTeamId} for battle ${battleId} in round ${round}`);
  
  // Check if battle exists
  db.get('SELECT id FROM team_battles WHERE id = ?', [battleId], (err, battle) => {
    if (err) {
      console.error('[BATTLES]: Error checking battle:', err.message);
      return res.status(500).json({ error: 'Database error', message: err.message });
    }
    
    if (!battle) {
      console.log(`[BATTLES]: Creating new battle record for ID ${battleId}`);
      
      // Create a new battle record
      db.run(
        'INSERT INTO team_battles (id, team1_id, team2_id, round, winner_id) VALUES (?, ?, ?, ?, ?)',
        [battleId, battleId * 2 - 1, battleId * 2, round, winningTeamId],
        function(err) {
          if (err) {
            console.error('[BATTLES]: Error inserting battle record:', err.message);
            return res.status(500).json({ error: 'Database error', message: err.message });
          }
          
          // Update the winning team's score
          updateWinnerScore(winningTeamId, round, res);
        }
      );
    } else {
      // Update existing battle record
      db.run(
        'UPDATE team_battles SET winner_id = ? WHERE id = ?',
        [winningTeamId, battleId],
        function(err) {
          if (err) {
            console.error('[BATTLES]: Error updating battle result:', err.message);
            return res.status(500).json({ error: 'Database error', message: err.message });
          }
          
          // Update the winning team's score
          updateWinnerScore(winningTeamId, round, res);
        }
      );
    }
  });
  
  // Helper function to update winner's score
  function updateWinnerScore(teamId, round, res) {
    db.run(
      'UPDATE teams SET battle_score = battle_score + 1 WHERE id = ? AND round = ?',
      [teamId, round],
      function(err) {
        if (err) {
          console.error('[BATTLES]: Error updating team score:', err.message);
          // Continue despite errors - this is not critical
        }
        
        // Broadcast the battle result to all clients
        if (global.io) {
          global.io.emit('battle_result', { battleId, winnerId: teamId });
        }
        
        res.status(200).json({ 
          message: 'Battle winner recorded successfully',
          battleId,
          winningTeamId: teamId
        });
      }
    );
  }
});

// Get all battles for a specific round
router.get('/battles/:round', (req, res) => {
  const { round } = req.params;
  
  db.all(
    `SELECT b.id, b.team1_id, b.team2_id, b.winner_id, b.battle_type,
            t1.player1_id as team1_player1, t1.player2_id as team1_player2,
            t2.player1_id as team2_player1, t2.player2_id as team2_player2,
            p1.name as team1_player1_name, p2.name as team1_player2_name,
            p3.name as team2_player1_name, p4.name as team2_player2_name,
            p1.interests as team1_player1_interests, p2.interests as team1_player2_interests,
            p3.interests as team2_player1_interests, p4.interests as team2_player2_interests
     FROM team_battles b
     JOIN teams t1 ON b.team1_id = t1.id
     JOIN teams t2 ON b.team2_id = t2.id
     JOIN players p1 ON t1.player1_id = p1.id
     JOIN players p2 ON t1.player2_id = p2.id
     JOIN players p3 ON t2.player1_id = p3.id
     JOIN players p4 ON t2.player2_id = p4.id
     WHERE b.round = ?`,
    [round],
    (err, battles) => {
      if (err) {
        console.error('[BATTLES]: Error fetching battles:', err.message);
        return res.status(500).json({ error: 'Database error', message: err.message });
      }
      
      // Format battle data for frontend
      const formattedBattles = battles.map(b => ({
        id: b.id,
        team1: {
          team_id: b.team1_id,
          player1_id: b.team1_player1,
          player2_id: b.team1_player2,
          player1_name: b.team1_player1_name,
          player2_name: b.team1_player2_name,
          player1_interests: b.team1_player1_interests,
          player2_interests: b.team1_player2_interests
        },
        team2: {
          team_id: b.team2_id,
          player1_id: b.team2_player1,
          player2_id: b.team2_player2,
          player1_name: b.team2_player1_name,
          player2_name: b.team2_player2_name,
          player1_interests: b.team2_player1_interests,
          player2_interests: b.team2_player2_interests
        },
        winner: b.winner_id,
        battleType: b.battle_type,
        inProgress: false
      }));
      
      res.status(200).json({ battles: formattedBattles });
    }
  );
});

module.exports = router;
