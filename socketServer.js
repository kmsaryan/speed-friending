const { Server } = require("socket.io");
const db = require('./database'); // Import database connection
const express = require('express');
const router = express.Router();

// Initialize game state table
function ensureGameStateTable(callback) {
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='game_state'", (err, table) => {
    if (err) {
      console.error('[SOCKET]: Error checking for game_state table:', err.message);
      callback(false);
      return;
    }
    
    if (!table) {
      console.log('[SOCKET]: Creating game_state table');
      db.run(`
        CREATE TABLE IF NOT EXISTS game_state (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          status TEXT NOT NULL DEFAULT 'stopped',
          current_round INTEGER NOT NULL DEFAULT 1,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, function(err) {
        if (err) {
          console.error('[SOCKET]: Error creating game_state table:', err.message);
          callback(false);
          return;
        }
        
        db.run(
          'INSERT OR IGNORE INTO game_state (id, status, current_round) VALUES (1, ?, ?)',
          ['stopped', 1],
          function(err) {
            if (err) {
              console.error('[SOCKET]: Error inserting default game state:', err.message);
              callback(false);
              return;
            }
            callback(true);
          }
        );
      });
    } else {
      callback(true);
    }
  });
}

// Check if status column exists in players table
let statusColumnExists = false;
db.all("PRAGMA table_info(players)", (err, rows) => {
  if (!err) {
    statusColumnExists = rows.some(row => row.name === 'status');
    console.log(`Status column ${statusColumnExists ? 'exists' : 'does not exist'} in players table`);
  }
});

const initializeSocketServer = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  // Make io available globally for broadcasts from routes
  global.io = io;

  // Socket ID to player ID mapping
  const socketToPlayer = new Map();
  // Track players currently in matching process to avoid duplicate matches
  const matchingInProgress = new Set();

  io.on("connection", (socket) => {
    console.log(`[SOCKET LOG]: Player connected with ID: ${socket.id}`);

    // Handle player registration
    socket.on("register_player", (playerData) => {
      const { playerId, playerType } = playerData;
      console.log(`[SOCKET LOG]: Player with ID ${playerId} registered socket ${socket.id}`);
      
      // Store the mapping between socket ID and player ID
      socketToPlayer.set(socket.id, { 
        playerId, 
        playerType 
      });

      // Set player as available when they register
      if (statusColumnExists) {
        db.run('UPDATE players SET status = ? WHERE id = ?', ['available', playerId], (err) => {
          if (err) {
            console.error(`[SOCKET LOG]: Error updating player status to available: ${err.message}`);
          } else {
            console.log(`[SOCKET LOG]: Player ${playerId} status set to available`);
          }
        });
      }
    });

    // Handle player matching
    socket.on("find_match", (playerType) => {
      console.log(`[SOCKET LOG]: Finding match for player type: ${playerType}`);
      
      // Ensure game_state table exists
      ensureGameStateTable((success) => {
        if (!success) {
          console.error('[SOCKET LOG]: Failed to ensure game_state table exists');
          socket.emit("no_match", "Server error. Please try again later.");
          return;
        }
        
        // Check if game is active
        db.get('SELECT status, current_round FROM game_state WHERE id = 1', [], (err, gameState) => {
          if (err) {
            console.error('[SOCKET LOG]: Error checking game status:', err.message);
            socket.emit("no_match", "Error checking game status");
            return;
          }
          
          // If game is not active, don't allow matching
          if (!gameState || gameState.status !== 'running') {
            console.log('[SOCKET LOG]: Game is not active (status: ' + (gameState?.status || 'unknown') + '). Matching not allowed.');
            socket.emit("no_match", "The game is not active yet. Please wait for the administrator to start the game.");
            return;
          }
          
          const currentRound = gameState.current_round || 1;
          console.log(`[SOCKET LOG]: Game is active. Round: ${currentRound}`);
          
          // Continue with matching process
          const socketData = socketToPlayer.get(socket.id);
          if (!socketData) {
            console.log(`[SOCKET LOG]: No player data found for socket ${socket.id}`);
            socket.emit("no_match", "Please register first");
            return;
          }
          
          const { playerId } = socketData;
          
          // IMPORTANT: Check if player is already in matching process
          if (matchingInProgress.has(playerId)) {
            console.log(`[SOCKET LOG]: Player ${playerId} is already in matching process`);
            socket.emit("no_match", "You are already being matched with someone. Please wait.");
            return;
          }
          
          // Add player to matching in progress set
          matchingInProgress.add(playerId);
          
          const oppositeType = playerType === "stationary" ? "moving" : "stationary";
          
          // Debug: output current socket-player mappings
          console.log(`[DEBUG] Current socket-player mappings:`);
          for (const [sid, data] of socketToPlayer.entries()) {
            console.log(`Socket: ${sid}, Player ID: ${data.playerId}, Type: ${data.playerType}`);
          }
          
          // Step 1: Get the current player's details
          db.get(
            `SELECT * FROM players WHERE id = ?`,
            [playerId],
            (err, currentPlayer) => {
              if (err || !currentPlayer) {
                console.error(`[SOCKET LOG]: Error retrieving current player ${playerId}:`, err);
                socket.emit("no_match", "Error retrieving your player data");
                matchingInProgress.delete(playerId);
                return;
              }

              // Step 2: Check if current player is available
              if (statusColumnExists && currentPlayer.status !== 'available') {
                console.log(`[SOCKET LOG]: Player ${playerId} is not available (status: ${currentPlayer.status})`);
                socket.emit("no_match", "You are not available for matching right now.");
                matchingInProgress.delete(playerId);
                return;
              }
              
              // Step 3: Find a match with the opposite type and available status
              // But don't match with players this player has already matched with in this round
              const query = statusColumnExists 
                ? `SELECT * FROM players 
                   WHERE playerType = ? 
                   AND id != ? 
                   AND id NOT IN (
                     SELECT matched_player_id FROM matches 
                     WHERE player_id = ? AND round = ?
                     UNION
                     SELECT player_id FROM matches 
                     WHERE matched_player_id = ? AND round = ?
                   ) 
                   AND status = 'available' 
                   ORDER BY RANDOM() LIMIT 1`
                : `SELECT * FROM players 
                   WHERE playerType = ? 
                   AND id != ? 
                   AND id NOT IN (
                     SELECT matched_player_id FROM matches 
                     WHERE player_id = ? AND round = ?
                     UNION
                     SELECT player_id FROM matches 
                     WHERE matched_player_id = ? AND round = ?
                   ) 
                   ORDER BY RANDOM() LIMIT 1`;
              
              db.get(
                query,
                [oppositeType, playerId, playerId, currentRound, playerId, currentRound],
                (err, match) => {
                  if (err) {
                    console.error("[SOCKET LOG]: Database error:", err.message);
                    socket.emit("no_match", "Error finding match");
                    matchingInProgress.delete(playerId);
                    return;
                  }
                  
                  if (match) {
                    console.log(`[SOCKET LOG]: Match found for ${socket.id}:`, match);
                    
                    // Update statuses only if the column exists
                    if (statusColumnExists) {
                      db.run('UPDATE players SET status = ? WHERE id = ?', ['matched', match.id], (err) => {
                        if (err) console.error(`[SOCKET LOG]: Error updating match status: ${err.message}`);
                        else console.log(`[SOCKET LOG]: Updated player ${match.id} status to matched`);
                      });
                      
                      db.run('UPDATE players SET status = ? WHERE id = ?', ['matched', playerId], (err) => {
                        if (err) console.error(`[SOCKET LOG]: Error updating player status: ${err.message}`);
                        else console.log(`[SOCKET LOG]: Updated player ${playerId} status to matched`);
                      });
                    }
                    
                    // Record the match with the current round
                    db.run(
                      'INSERT INTO matches (player_id, matched_player_id, round) VALUES (?, ?, ?)',
                      [playerId, match.id, currentRound],
                      function(err) {
                        if (err) {
                          console.error(`[SOCKET LOG]: Error inserting match: ${err.message}`);
                        } else {
                          const matchId = this.lastID;
                          console.log(`[SOCKET LOG]: Match recorded with ID: ${matchId}`);
                          
                          // Create a match room name
                          const matchRoom = `match_${matchId}`;
                          
                          // Find the socket for the matched player
                          let matchedSocket = null;
                          for (const [socketId, data] of socketToPlayer.entries()) {
                            if (data.playerId === match.id) {
                              matchedSocket = socketId;
                              break;
                            }
                          }
                          
                          // Add both sockets to the match room
                          socket.join(matchRoom);
                          if (matchedSocket) {
                            const matchedSocketObj = io.sockets.sockets.get(matchedSocket);
                            if (matchedSocketObj) {
                              matchedSocketObj.join(matchRoom);
                              console.log(`[SOCKET LOG]: Created match room ${matchRoom} with both players`);
                            }
                          }
                          
                          // Send complete match details to the current player WITH the matchId
                          socket.emit("match_found", {
                            id: match.id,
                            name: match.name,
                            gender: match.gender,
                            interests: match.interests,
                            preferences: match.preferences,
                            playerType: match.playerType,
                            tableNumber: match.tableNumber,
                            round: currentRound,
                            matchId: matchId  // Include the match ID in the response
                          });
                          
                          // If we found the socket, notify the matched player WITH the matchId
                          if (matchedSocket) {
                            io.to(matchedSocket).emit("match_found", {
                              id: currentPlayer.id,
                              name: currentPlayer.name,
                              gender: currentPlayer.gender,
                              interests: currentPlayer.interests,
                              preferences: currentPlayer.preferences, 
                              playerType: currentPlayer.playerType,
                              tableNumber: currentPlayer.tableNumber,
                              round: currentRound,
                              matchId: matchId  // Include the match ID in the response
                            });
                            
                            console.log(`[SOCKET LOG]: Notified matched player at socket ${matchedSocket}`);
                          } else {
                            console.log(`[SOCKET LOG]: Matched player (ID: ${match.id}) not connected via socket`);
                          }
                          
                          // Broadcast match created event to admin panels
                          if (global.io) {
                            global.io.emit('match_created', { 
                              matchId: matchId,
                              player1Id: playerId, 
                              player2Id: match.id
                            });
                          }
                          
                          // Remove player from matching in progress
                          matchingInProgress.delete(playerId);
                        }
                      }
                    );
                  } else {
                    console.log(`[SOCKET LOG]: No match found for ${socket.id}`);
                    socket.emit("no_match", "No match found. Waiting for more players.");
                    // Remove player from matching in progress
                    matchingInProgress.delete(playerId);
                  }
                }
              );
            }
          );
        });
      });
    });

    // Handle rating submission which should set players back to available
    socket.on("submit_rating", (ratingData) => {
      console.log(`[SOCKET LOG]: Rating submitted by socket ${socket.id}`, ratingData);
      
      // Get the player ID directly from the rating data
      const playerId = ratingData.playerId;
      const ratedPlayerId = ratingData.ratedPlayerId;
      const round = ratingData.round || 1;
      
      if (!playerId) {
        console.log(`[SOCKET LOG]: No player ID provided in rating data`);
        return;
      }
      
      console.log(`[SOCKET LOG]: Setting player ${playerId} status to available after rating submission`);
      
      // Set current player status back to available
      if (statusColumnExists) {
        db.run('UPDATE players SET status = ? WHERE id = ?', ['available', playerId], (err) => {
          if (err) {
            console.error(`[SOCKET LOG]: Error resetting player status: ${err.message}`);
          } else {
            console.log(`[SOCKET LOG]: Reset player ${playerId} status to available after rating`);
            
            // Notify the client that the status has been updated
            socket.emit("rating_processed", { success: true, playerId });
            
            // If the admin panel is open, broadcast the updated player count
            if (global.io) {
              global.io.emit("player_status_updated");
            }
            
            // Mark the match as rated in the database
            db.all("PRAGMA table_info(matches)", (err, columns) => {
              if (err) {
                console.error(`[SOCKET LOG]: Error checking matches table columns: ${err.message}`);
                return;
              }
              
              const hasRatedColumn = columns.some(col => col.name === 'rated');
              
              if (hasRatedColumn) {
                db.run(
                  `UPDATE matches SET rated = 1 
                   WHERE (player_id = ? AND matched_player_id = ?) 
                   OR (player_id = ? AND matched_player_id = ?) 
                   AND round = ?`,
                  [playerId, ratedPlayerId, ratedPlayerId, playerId, round],
                  function(err) {
                    if (err) {
                      console.error(`[SOCKET LOG]: Error updating match rated status: ${err.message}`);
                    } else {
                      console.log(`[SOCKET LOG]: Match marked as rated between players ${playerId} and ${ratedPlayerId}`);
                    }
                  }
                );
              } else {
                console.log(`[SOCKET LOG]: 'rated' column does not exist in matches table. Skipping status update.`);
              }
            });
          }
        });
      }
    });

    // Handle game status changes from clients
    socket.on("game_status_check", () => {
      ensureGameStateTable(() => {
        db.get('SELECT status, current_round FROM game_state WHERE id = 1', [], (err, state) => {
          if (err || !state) {
            socket.emit("game_status_update", { status: 'stopped', round: 1 });
            return;
          }
          socket.emit("game_status_update", { 
            status: state.status,
            round: state.current_round
          });
        });
      });
    });

    // Handle chat messages
    socket.on("chat_message", ({ to, message }) => {
      console.log(`[SOCKET LOG]: Chat message from ${socket.id} to ${to}`, message);
      io.to(to).emit("chat_message", { from: socket.id, message });
    });

    // Handle timer controls - improved room-based broadcasting
    socket.on("timer_control", (data) => {
      const { matchId, action, timeLeft } = data;
      
      if (!matchId) {
        console.error("[SOCKET LOG]: Timer control missing matchId:", data);
        return;
      }
      
      const matchRoom = `match_${matchId}`;
      console.log(`[SOCKET LOG]: Timer control for room ${matchRoom}. Action: ${action}, Time Left: ${timeLeft}`);
      
      // Create a cleaner message with explicit action and timeLeft
      const timerUpdate = {
        action,
        timeLeft: parseInt(timeLeft, 10) || 180,
        timestamp: Date.now()
      };
      
      // Broadcast to the specific match room (including the sender for consistency)
      io.in(matchRoom).emit("timer_update", timerUpdate);
      
      // Debug log to confirm emission
      console.log(`[SOCKET LOG]: Emitted timer_update to room ${matchRoom}:`, timerUpdate);
    });

    // New event handler for starting team battles
    socket.on("start_team_battles", (data) => {
      const { round } = data;
      console.log(`[SOCKET LOG]: Admin started team battles for round ${round}`);
      
      // Broadcast to all connected clients that team battles have started
      io.emit('team_battles_started', { round });
    });

    // New event to get player's team
    socket.on("get_player_team", (data) => {
      const { playerId, round } = data;
      
      if (!playerId) {
        console.log(`[SOCKET LOG]: No player ID provided in get_player_team`);
        return;
      }
      
      console.log(`[SOCKET LOG]: Getting team for player ${playerId} in round ${round}`);
      
      db.get(
        `SELECT t.id as team_id, 
                t.player1_id, t.player2_id, 
                p1.name as player1_name, p2.name as player2_name,
                battle.id as battle_id, battle.battle_type,
                t2.id as opponent_team_id, 
                t2.player1_id as opponent_player1_id, t2.player2_id as opponent_player2_id,
                p3.name as opponent_player1_name, p4.name as opponent_player2_name
         FROM teams t
         JOIN players p1 ON t.player1_id = p1.id
         JOIN players p2 ON t.player2_id = p2.id
         LEFT JOIN team_battles battle ON (battle.team1_id = t.id OR battle.team2_id = t.id)
         LEFT JOIN teams t2 ON (battle.team1_id = t2.id OR battle.team2_id = t2.id) AND t2.id != t.id
         LEFT JOIN players p3 ON t2.player1_id = p3.id
         LEFT JOIN players p4 ON t2.player2_id = p4.id
         WHERE (t.player1_id = ? OR t.player2_id = ?) AND t.round = ?`,
        [playerId, playerId, round],
        (err, teamData) => {
          if (err) {
            console.error(`[SOCKET LOG]: Error retrieving team for player ${playerId}:`, err);
            socket.emit("player_team_info", { error: "Error retrieving team data" });
            return;
          }

          if (!teamData) {
            console.log(`[SOCKET LOG]: No team found for player ${playerId} in round ${round}`);
            socket.emit("player_team_info", { found: false });
            return;
          }

          console.log(`[SOCKET LOG]: Found team for player ${playerId}:`, teamData.team_id);
          socket.emit("player_team_info", { 
            found: true,
            teamId: teamData.team_id,
            battleId: teamData.battle_id,
            battleType: teamData.battle_type,
            teammate: teamData.player1_id == playerId ? {
              id: teamData.player2_id,
              name: teamData.player2_name
            } : {
              id: teamData.player1_id,
              name: teamData.player1_name
            },
            opponents: teamData.opponent_team_id ? {
              teamId: teamData.opponent_team_id,
              player1: {
                id: teamData.opponent_player1_id,
                name: teamData.opponent_player1_name
              },
              player2: {
                id: teamData.opponent_player2_id,
                name: teamData.opponent_player2_name
              }
            } : null
          });
        }
      );
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`[SOCKET LOG]: Player disconnected with ID: ${socket.id}`);
      
      // Check if we have player data for this socket
      const socketData = socketToPlayer.get(socket.id);
      if (socketData) {
        const { playerId } = socketData;
        
        // Get all rooms this socket was in
        const rooms = socket.rooms;
        console.log(`[SOCKET LOG]: Player was in rooms:`, rooms);
        
        // Remove player from matching in progress
        matchingInProgress.delete(playerId);
        
        // Set player status to available when they disconnect
        if (statusColumnExists && playerId) {
          db.run('UPDATE players SET status = ? WHERE id = ?', ['available', playerId], (err) => {
            if (err) {
              console.error(`[SOCKET LOG]: Error updating player status on disconnect: ${err.message}`);
            } else {
              console.log(`[SOCKET LOG]: Updated player ${playerId} status to available on disconnect`);
            }
          });
        }
        
        // Remove from socketToPlayer map
        socketToPlayer.delete(socket.id);
      }
    });
  });

  return io;
};

// Admin routes for game state management
router.post('/admin/start-game', (req, res) => {
  const { round = 1 } = req.body;
  
  ensureGameStateTable(() => {
    db.run(
      'INSERT OR REPLACE INTO game_state (id, status, current_round, last_updated) VALUES (1, ?, ?, CURRENT_TIMESTAMP)',
      ['running', round],
      function(err) {
        if (err) {
          console.error('[ADMIN]: Error starting game:', err.message);
          return res.status(500).json({ error: 'Database error' });
        }
        
        console.log('[ADMIN]: Game started successfully. Round:', round);
        
        // Improved broadcasting to all clients
        if (global.io) {
          console.log('[ADMIN]: Broadcasting game start to all clients');
          global.io.emit('game_status_change', { 
            status: 'running', 
            round,
            message: `Round ${round} has started!`  // Add a user-friendly message
          });
        } else {
          console.log('[ADMIN]: Socket.io not initialized, unable to broadcast');
        }
        
        res.status(200).json({ message: 'Game started successfully', status: 'running', round });
      }
    );
  });
});

router.post('/admin/next-round', (req, res) => {
  const { nextRound } = req.body;
  
  db.get('SELECT current_round FROM game_state WHERE id = 1', [], (err, state) => {
    if (err || !state) {
      console.error('[ADMIN]: Error retrieving current round:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    
    const currentRound = state.current_round;
    
    db.run(
      'UPDATE game_state SET current_round = ?, last_updated = CURRENT_TIMESTAMP WHERE id = 1',
      [nextRound],
      function(err) {
        if (err) {
          console.error('[ADMIN]: Error advancing round:', err.message);
          return res.status(500).json({ error: 'Database error' });
        }
        
        console.log('[ADMIN]: Advanced to round:', nextRound);
        
        // Improved broadcasting for round change
        if (global.io) {
          console.log('[ADMIN]: Broadcasting round change to all clients');
          global.io.emit('game_status_change', { 
            round: nextRound,
            message: `Round ${nextRound} has started!` // Add a user-friendly message 
          });
          
          // Also broadcast a separate round_changed event for specific actions
          global.io.emit('round_changed', { 
            round: nextRound,
            previousRound: currentRound
          });
        } else {
          console.log('[ADMIN]: Socket.io not initialized, unable to broadcast');
        }
        
        res.status(200).json({ 
          message: `Advanced to round ${nextRound}`, 
          round: nextRound 
        });
      }
    );
  });
});

module.exports = { initializeSocketServer, router };
