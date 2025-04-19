import socket, { socketManager } from './socket';

class TimerSyncService {
  constructor() {
    this.matchId = null;
    this.timerId = null;
    this.timeLeft = 180; // Default 3 minutes
    this.isActive = false;
    this.lastSyncTime = 0;
    this.syncInterval = 5000; // Sync every 5 seconds
    this.listeners = [];
    this.timeDrift = 0; // Time drift between client and server in ms
    this.syncAttempts = 0;
    this.maxSyncAttempts = 3; // Maximum number of quick sync attempts
    this.syncAttemptsInterval = null;
    this.setupSocketListeners();
  }
  
  // Set up socket event listeners for timer updates
  setupSocketListeners() {
    socket.on("timer_update", (data) => {
      console.log("[TIMER SYNC]: Received timer update:", data);
      
      if (!this.matchId || data.matchId !== this.matchId) {
        console.log(`[TIMER SYNC]: Ignoring timer update for different match`);
        return;
      }
      
      // Calculate time drift if server time is provided
      if (data.serverTime) {
        this.timeDrift = Date.now() - data.serverTime;
        console.log(`[TIMER SYNC]: Calculated time drift: ${this.timeDrift}ms`);
      }
      
      this.handleTimerUpdate(data);
    });
    
    socket.on("heartbeat_ack", (data) => {
      // Update time drift based on server response
      if (data.clientTime && data.serverTime) {
        // Calculate round-trip time
        const rtt = Date.now() - data.clientTime;
        // Adjust for round-trip time (assuming symmetric network delay)
        this.timeDrift = (Date.now() - (data.serverTime + (rtt / 2)));
        console.log(`[TIMER SYNC]: Updated time drift from heartbeat: ${this.timeDrift}ms, RTT: ${rtt}ms`);
      }
    });
    
    socketManager.on('connectionChange', (connected) => {
      if (connected && this.matchId) {
        console.log('[TIMER SYNC]: Reconnected, requesting timer sync');
        this.initiateQuickSync();
      }
    });
  }
  
  // Handle incoming timer updates from server
  handleTimerUpdate(data) {
    const { action, timeLeft, senderId } = data;
    
    // Ignore our own updates
    if (senderId === socket.id) return;
    
    switch (action) {
      case "start":
        this.timeLeft = timeLeft;
        this.isActive = true;
        this.startTimer(false); // Start timer locally without emitting
        break;
        
      case "pause":
        this.timeLeft = timeLeft;
        this.isActive = false;
        this.stopTimer(false); // Stop timer locally without emitting
        break;
        
      case "sync":
        // Update our time to match the server's
        this.timeLeft = timeLeft;
        
        // Only restart the timer if we're supposed to be active
        if (this.isActive) {
          this.clearTimer();
          this.startLocalTimer();
        }
        
        this.notifyListeners();
        break;
        
      case "timeout":
        this.timeLeft = 0;
        this.isActive = false;
        this.stopTimer(false);
        this.notifyTimedOut();
        break;
        
      default:
        console.warn(`[TIMER SYNC]: Unknown timer action: ${action}`);
    }
  }
  
  // Initialize timer with match details
  initializeTimer(matchId, initialTime = 180) {
    this.matchId = matchId;
    this.timeLeft = initialTime;
    this.isActive = false;
    this.lastSyncTime = 0;
    console.log(`[TIMER SYNC]: Timer initialized for match ${matchId} with ${initialTime} seconds`);
    
    // Join match room through socket manager
    socketManager.joinMatchRoom(matchId);
    
    // Request immediate sync with server
    this.requestSync();
    
    return this;
  }
  
  // Start the timer
  startTimer(emitEvent = true) {
    if (this.isActive) return;
    
    this.isActive = true;
    this.clearTimer();
    this.startLocalTimer();
    
    if (emitEvent) {
      this.emitTimerControl('start');
    }
  }
  
  // Start the local timer countdown
  startLocalTimer() {
    this.timerId = setInterval(() => {
      this.timeLeft--;
      this.notifyListeners();
      
      // Sync timer with server periodically
      const now = Date.now();
      if (now - this.lastSyncTime > this.syncInterval) {
        this.syncTimer();
        this.lastSyncTime = now;
      }
      
      if (this.timeLeft <= 0) {
        this.handleTimeout();
      }
    }, 1000);
  }
  
  // Stop the timer
  stopTimer(emitEvent = true) {
    if (!this.isActive) return;
    
    this.isActive = false;
    this.clearTimer();
    this.notifyListeners();
    
    if (emitEvent) {
      this.emitTimerControl('pause');
    }
  }
  
  // Clear the timer interval
  clearTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
  
  // Toggle timer state
  toggleTimer() {
    if (this.isActive) {
      this.stopTimer();
    } else {
      this.startTimer();
    }
    
    return this.isActive;
  }
  
  // Handle timeout when timer reaches zero
  handleTimeout() {
    this.timeLeft = 0;
    this.isActive = false;
    this.clearTimer();
    this.notifyListeners();
    this.notifyTimedOut();
    
    this.emitTimerControl('timeout');
  }
  
  // Emit timer control event to server
  emitTimerControl(action) {
    if (!this.matchId) {
      console.error('[TIMER SYNC]: Cannot emit timer control. No match ID set.');
      return;
    }
    
    console.log(`[TIMER SYNC]: Emitting timer ${action} with ${this.timeLeft}s remaining`);
    socket.emit('timer_control', {
      matchId: this.matchId,
      action,
      timeLeft: this.timeLeft,
      senderId: socket.id,
      clientTime: Date.now()
    });
  }
  
  // Sync timer with server
  syncTimer() {
    this.requestSync();
  }
  
  // Perform multiple quick sync requests to improve accuracy after reconnection
  initiateQuickSync() {
    // Clear any existing quick sync interval
    if (this.syncAttemptsInterval) {
      clearInterval(this.syncAttemptsInterval);
    }
    
    this.syncAttempts = 0;
    
    // Request sync immediately
    this.requestSync();
    
    // Then set up several quick syncs
    this.syncAttemptsInterval = setInterval(() => {
      this.syncAttempts++;
      this.requestSync();
      
      if (this.syncAttempts >= this.maxSyncAttempts) {
        clearInterval(this.syncAttemptsInterval);
        this.syncAttemptsInterval = null;
      }
    }, 1000); // Quick sync every second
  }
  
  // Request a timer sync from the server
  requestSync() {
    if (!this.matchId) return;
    
    socket.emit('request_timer_sync', {
      matchId: this.matchId,
      clientTime: Date.now()
    });
  }
  
  // Get current time drift in milliseconds
  getTimeDrift() {
    return this.timeDrift;
  }
  
  // Add a timer update listener
  addListener(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
    return () => this.removeListener(callback); // Return unsubscribe function
  }
  
  // Remove a timer update listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }
  
  // Notify all listeners of timer updates
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener({
          timeLeft: this.timeLeft,
          isActive: this.isActive,
          matchId: this.matchId,
          drift: this.timeDrift
        });
      } catch (err) {
        console.error('[TIMER SYNC]: Error in timer listener:', err);
      }
    });
  }
  
  // Notify listeners that timer has timed out
  notifyTimedOut() {
    this.listeners.forEach(listener => {
      try {
        listener({
          timeLeft: 0,
          isActive: false,
          matchId: this.matchId,
          timedOut: true,
          drift: this.timeDrift
        });
      } catch (err) {
        console.error('[TIMER SYNC]: Error in timer timeout listener:', err);
      }
    });
  }
  
  // Get current timer state
  getTimerState() {
    return {
      timeLeft: this.timeLeft,
      isActive: this.isActive,
      matchId: this.matchId,
      drift: this.timeDrift
    };
  }
  
  // Clean up timers and listeners
  cleanup() {
    this.clearTimer();
    
    if (this.syncAttemptsInterval) {
      clearInterval(this.syncAttemptsInterval);
      this.syncAttemptsInterval = null;
    }
    
    this.listeners = [];
    
    if (this.matchId) {
      socketManager.leaveMatchRoom(this.matchId);
      this.matchId = null;
    }
  }
}

// Create singleton instance
const timerSyncService = new TimerSyncService();

export default timerSyncService;
