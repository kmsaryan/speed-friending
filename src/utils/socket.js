import { io } from "socket.io-client";

// Dynamically determine the WebSocket server URL
const getWebSocketURL = () => {
  // In production, use the same hostname
  if (process.env.NODE_ENV === 'production') {
    // This ensures we're using the same host, which avoids CORS issues
    return window.location.origin;
  }
  
  // In development, use the configured backend URL
  return process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
};

const serverUrl = getWebSocketURL();
console.log(`[SOCKET LOG]: Connecting to WebSocket server at ${serverUrl}`);

const socket = io(serverUrl, {
  transports: ["websocket", "polling"], // Added polling as fallback
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  timeout: 20000,
});

socket.on("connect", () => {
  console.log(`[SOCKET LOG]: Connected to server with ID: ${socket.id}`);
});

socket.on("disconnect", (reason) => {
  console.log(`[SOCKET LOG]: Disconnected from server. Reason: ${reason}`);
});

socket.on("connect_error", (error) => {
  console.error('[SOCKET ERROR]: Connection error:', error.message); // Add detailed logging
  
  // Try to reconnect with polling if websocket fails
  if (socket.io.opts.transports[0] === 'websocket') {
    console.log("[SOCKET LOG]: Falling back to polling transport");
    socket.io.opts.transports = ['polling', 'websocket'];
  }
});

socket.on("reconnect_attempt", (attempt) => {
  console.log(`[SOCKET LOG]: Reconnection attempt #${attempt}`);
});

socket.on("reconnect_failed", () => {
  console.error(`[SOCKET ERROR]: Reconnection failed after maximum attempts`);
});

// Example event listeners
socket.on("match_found", (match) => {
  console.log(`[SOCKET EVENT]: Match found`, match);
});

socket.on("chat_message", (message) => {
  console.log(`[SOCKET EVENT]: Chat message received`, message);
});

// Wrap emit to log outgoing messages
const originalEmit = socket.emit;
socket.emit = function (event, ...args) {
  console.log(`[SOCKET EMIT]: Event: ${event}`, args);
  originalEmit.apply(socket, [event, ...args]);
};

export default socket;
