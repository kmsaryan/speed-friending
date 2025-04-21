import { io } from "socket.io-client";

// Dynamically determine the WebSocket server URL
const getWebSocketURL = () => {
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL.replace(/^http/, "ws");
  }
  return "ws://localhost:5000"; // Default for local development
};

const serverUrl = getWebSocketURL();
console.log(`[SOCKET LOG]: Connecting to WebSocket server at ${serverUrl}`);

const socket = io(serverUrl, {
  transports: ["websocket", "polling"], // Added polling as fallback
  reconnection: true,
  reconnectionAttempts: 10,
  timeout: 20000,
});

socket.on("connect", () => {
  console.log(`[SOCKET LOG]: Connected to server with ID: ${socket.id}`);
});

socket.on("disconnect", (reason) => {
  console.log(`[SOCKET LOG]: Disconnected from server. Reason: ${reason}`);
});

socket.on("connect_error", (error) => {
  console.error(`[SOCKET ERROR]: Connection error`, error);
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
