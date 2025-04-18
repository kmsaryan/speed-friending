const { Server } = require("socket.io");
const db = require('./database'); // Import database connection

// Check if status column exists in players table
let statusColumnExists = false;
db.get("PRAGMA table_info(players)", (err, rows) => {
  if (!err) {
    db.all("PRAGMA table_info(players)", (err, rows) => {
      if (!err) {
        statusColumnExists = rows.some(row => row.name === 'status');
        console.log(`Status column ${statusColumnExists ? 'exists' : 'does not exist'} in players table`);
      }
    });
  }
});

const initializeSocketServer = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  // Socket ID to player ID mapping
  const socketToPlayer = new Map();

  io.on("connection", (socket) => {
    console.log(`[SOCKET LOG]: Player connected with ID: ${socket.id}`);

    // Handle player registration
    socket.on("register_player", (playerData) => {
      const { playerId, playerType } = playerData;
      console.log(`[SOCKET LOG]: Player with ID ${playerId} registered socket`);
      
      // Store the mapping between socket ID and player ID
      socketToPlayer.set(socket.id, { 
        playerId, 
        playerType 
      });
    });

    // Handle player matching
    socket.on("find_match", (playerType) => {
      console.log(`[SOCKET LOG]: Finding match for player type: ${playerType}`);
      
      const socketData = socketToPlayer.get(socket.id);
      if (!socketData) {
        console.log(`[SOCKET LOG]: No player data found for socket ${socket.id}`);
        socket.emit("no_match", "Please register first");
        return;
      }
      
      const { playerId } = socketData;
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
            return;
          }
          
          // Step 2: Find a match with the opposite type
          // Use a query that works whether or not the status column exists
          const query = statusColumnExists 
            ? `SELECT * FROM players WHERE playerType = ? AND id != ? AND id NOT IN (
                SELECT matched_player_id FROM matches WHERE player_id = ?
              ) AND status = 'available' ORDER BY RANDOM() LIMIT 1`
            : `SELECT * FROM players WHERE playerType = ? AND id != ? AND id NOT IN (
                SELECT matched_player_id FROM matches WHERE player_id = ?
              ) ORDER BY RANDOM() LIMIT 1`;
          
          db.get(
            query,
            [oppositeType, playerId, playerId],
            (err, match) => {
              if (err) {
                console.error("[SOCKET LOG]: Database error:", err.message);
                socket.emit("no_match", "Error finding match");
                return;
              }
              
              if (match) {
                console.log(`[SOCKET LOG]: Match found for ${socket.id}:`, match);
                
                // Update statuses only if the column exists
                if (statusColumnExists) {
                  db.run('UPDATE players SET status = ? WHERE id = ?', ['matched', match.id]);
                  db.run('UPDATE players SET status = ? WHERE id = ?', ['matched', playerId]);
                }
                
                // Record the match
                db.run(
                  'INSERT INTO matches (player_id, matched_player_id, round) VALUES (?, ?, ?)',
                  [playerId, match.id, 1]
                );
                
                // Send complete match details to the current player
                socket.emit("match_found", {
                  id: match.id,
                  name: match.name,
                  gender: match.gender,
                  interests: match.interests,
                  preferences: match.preferences,
                  playerType: match.playerType,
                  tableNumber: match.tableNumber
                });
                
                // Find the socket for the matched player
                let matchedSocket = null;
                for (const [socketId, data] of socketToPlayer.entries()) {
                  if (data.playerId === match.id) {
                    matchedSocket = socketId;
                    break;
                  }
                }
                
                // If we found the socket, notify the matched player
                if (matchedSocket) {
                  io.to(matchedSocket).emit("match_found", {
                    id: currentPlayer.id,
                    name: currentPlayer.name,
                    gender: currentPlayer.gender,
                    interests: currentPlayer.interests,
                    preferences: currentPlayer.preferences, 
                    playerType: currentPlayer.playerType,
                    tableNumber: currentPlayer.tableNumber
                  });
                  
                  console.log(`[SOCKET LOG]: Notified matched player at socket ${matchedSocket}`);
                } else {
                  console.log(`[SOCKET LOG]: Matched player (ID: ${match.id}) not connected via socket`);
                }
              } else {
                console.log(`[SOCKET LOG]: No match found for ${socket.id}`);
                socket.emit("no_match", "No match found. Waiting for more players.");
              }
            }
          );
        }
      );
    });

    // Handle chat messages
    socket.on("chat_message", ({ to, message }) => {
      console.log(`[SOCKET LOG]: Chat message from ${socket.id} to ${to}`, message);
      io.to(to).emit("chat_message", { from: socket.id, message });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`[SOCKET LOG]: Player disconnected with ID: ${socket.id}`);
      socketToPlayer.delete(socket.id);
    });
  });

  return io;
};

module.exports = initializeSocketServer;
