const express = require('express');
const router = express.Router();
const db = require('../database');

// Get info about active WebSocket connections
router.get('/debug/socket-connections', (req, res) => {
  if (!global.io) {
    return res.status(500).json({ error: 'Socket.IO not initialized' });
  }
  
  // Get all socket rooms and connections
  const rooms = global.io.sockets.adapter.rooms;
  const sids = global.io.sockets.adapter.sids;
  const roomData = {};
  
  // Convert Map to JSON-serializable object
  for (const [key, value] of rooms.entries()) {
    // Skip socket ID entries which are actually client IDs
    if (sids.has(key)) continue;
    
    roomData[key] = {
      size: value.size,
      clients: Array.from(value)
    };
  }
  
  // Get socket-to-player mappings
  const socketToPlayerMap = [];
  if (global.socketToPlayer) {
    for (const [socketId, data] of global.socketToPlayer.entries()) {
      socketToPlayerMap.push({
        socketId,
        playerId: data.playerId,
        playerType: data.playerType,
        currentMatchId: data.currentMatchId
      });
    }
  }
  
  // Get match timer states
  const matchTimers = [];
  if (global.matchTimers) {
    for (const [matchId, data] of global.matchTimers.entries()) {
      matchTimers.push({
        matchId,
        timeLeft: data.timeLeft,
        isActive: data.isActive,
        lastUpdated: new Date(data.lastUpdated).toISOString()
      });
    }
  }
  
  res.json({
    connections: {
      total: global.io.engine.clientsCount,
      rooms: roomData
    },
    players: socketToPlayerMap,
    timers: matchTimers
  });
});

module.exports = router;