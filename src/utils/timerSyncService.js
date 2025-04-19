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
      
      this.handleTimerUpdate(data);
    });
    
    socketManager.on('connectionChange', (connected) => {
      if (connected && this.matchId && this.isActive) {
        console.log('[TIMER SYNC]: Reconnected, requesting timer sync');
        this.requestSync();
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
        // Only update if not actively counting locally
        if (this.isActive) {
          const drift = Math.abs(this.timeLeft - timeLeft);
          // If drift is more than 2 seconds, sync
          if (drift > 2) {
            console.log(`[TIMER SYNC]: Syncing time (local: ${this.timeLeft}, server: ${timeLeft}, drift: ${drift}s)`);
            this.timeLeft = timeLeft;
            this.notifyListeners();
          }
        } else {
          this.timeLeft = timeLeft;
          this.notifyListeners();
        }
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
    
    return this;
  }
  
  // Start the timer
  startTimer(emitEvent = true) {
    if (this.isActive) return;
    
    this.isActive = true;
    this.clearTimer();
    
    this.timerId = setInterval(() => {
      this.timeLeft--;
      this.notifyListeners();
      
      // Sync timer with other clients periodically
      const now = Date.now();
      if (now - this.lastSyncTime > this.syncInterval) {
        this.syncTimer();
        this.lastSyncTime = now;
      }
      
      if (this.timeLeft <= 0) {
        this.handleTimeout();
      }
    }, 1000);
    
    if (emitEvent) {
      this.emitTimerControl('start');
    }
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
      senderId: socket.id
    });
  }
  
  // Sync timer with other clients
  syncTimer() {
    this.emitTimerControl('sync');
  }
  
  // Request a timer sync from the server
  requestSync() {
    if (!this.matchId) return;
    
    socket.emit('request_timer_sync', {
      matchId: this.matchId
    });
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
          matchId: this.matchId
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
          timedOut: true
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
      matchId: this.matchId
    };
  }
  
  // Clean up timers and listeners
  cleanup() {
    this.clearTimer();
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
