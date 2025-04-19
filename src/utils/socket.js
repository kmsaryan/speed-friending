import { io } from "socket.io-client";
import { EventEmitter } from 'events';

// Connection state manager
class SocketConnectionManager extends EventEmitter {
  constructor() {
    super();
    this.connected = false;
    this.connecting = false;
    this.socket = null;
    this.lastMatchId = null;
    this.heartbeatInterval = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  // Initialize socket connection
  initialize() {
    if (this.socket) return this.socket;
    
    const serverUrl = this.getWebSocketURL();
    console.log(`[SOCKET LOG]: Connecting to WebSocket server at ${serverUrl}`);
    
    this.connecting = true;
    this.socket = io(serverUrl, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });
    
    this.setupEventListeners();
    return this.socket;
  }
  
  // Get WebSocket URL based on environment
  getWebSocketURL() {
    if (process.env.REACT_APP_BACKEND_URL) {
      return process.env.REACT_APP_BACKEND_URL;
    }
    return "http://localhost:5000"; // Default for local development
  }
  
  // Set up socket event listeners
  setupEventListeners() {
    this.socket.on("connect", () => {
      console.log(`[SOCKET LOG]: Connected to server with ID: ${this.socket.id}`);
      this.connected = true;
      this.connecting = false;
      this.reconnectAttempts = 0;
      this.emit('connectionChange', true);
      
      // Re-join match room if we have a match ID
      if (this.lastMatchId) {
        this.joinMatchRoom(this.lastMatchId);
      }
      
      // Set up heartbeat to keep connection alive
      this.startHeartbeat();
      
      // Re-register player ID if available
      this.reRegisterPlayer();
    });
    
    this.socket.on("disconnect", (reason) => {
      console.log(`[SOCKET LOG]: Disconnected from server. Reason: ${reason}`);
      this.connected = false;
      this.emit('connectionChange', false);
      this.clearHeartbeat();
    });
    
    this.socket.on("connect_error", (error) => {
      console.error(`[SOCKET ERROR]: Connection error`, error);
      this.connecting = false;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error(`[SOCKET ERROR]: Max reconnect attempts reached. Please try refreshing the page.`);
        this.emit('maxReconnectAttemptsReached');
      }
    });
    
    this.socket.on("reconnect_attempt", (attempt) => {
      console.log(`[SOCKET LOG]: Reconnection attempt #${attempt}`);
      this.connecting = true;
    });
    
    this.socket.on("reconnect_failed", () => {
      console.error(`[SOCKET ERROR]: Reconnection failed after maximum attempts`);
      this.connecting = false;
      this.emit('reconnectFailed');
    });
    
    // Wrap emit to log outgoing messages
    const originalEmit = this.socket.emit;
    this.socket.emit = (...args) => {
      console.log(`[SOCKET EMIT]: Event: ${args[0]}`, args.slice(1));
      return originalEmit.apply(this.socket, args);
    };
  }
  
  // Start heartbeat to keep connection alive
  startHeartbeat() {
    this.clearHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.connected) {
        this.socket.emit('heartbeat', { timestamp: new Date().getTime() });
      }
    }, 30000); // Send heartbeat every 30 seconds
  }
  
  // Clear heartbeat interval
  clearHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  // Re-register player ID when reconnected
  reRegisterPlayer() {
    const playerId = localStorage.getItem('playerId');
    const playerType = localStorage.getItem('playerType');
    
    if (playerId && playerType) {
      console.log(`[SOCKET LOG]: Re-registering player ${playerId} after reconnection`);
      this.socket.emit('register_player', { playerId, playerType });
      
      // Re-join player's room
      this.socket.emit('join_room', { roomId: `player_${playerId}` });
    }
  }
  
  // Join a match room
  joinMatchRoom(matchId) {
    if (!this.connected || !matchId) return;
    
    this.lastMatchId = matchId;
    console.log(`[SOCKET LOG]: Joining match room: match_${matchId}`);
    this.socket.emit('join_room', { roomId: `match_${matchId}` });
  }
  
  // Leave a match room
  leaveMatchRoom(matchId) {
    if (!this.connected || !matchId) return;
    
    console.log(`[SOCKET LOG]: Leaving match room: match_${matchId}`);
    this.socket.emit('leave_room', { roomId: `match_${matchId}` });
    
    if (this.lastMatchId === matchId) {
      this.lastMatchId = null;
    }
  }
  
  // Get connection status
  isConnected() {
    return this.connected;
  }
  
  // Get socket instance
  getSocket() {
    return this.socket;
  }
}

// Create and initialize socket manager instance
const socketManager = new SocketConnectionManager();
const socket = socketManager.initialize();

// Export both the socket instance and the manager
export { socket as default, socketManager };
