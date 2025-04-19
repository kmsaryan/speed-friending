import socket from './socket';
import { apiPost } from './apiUtils';

class PlayerManager {
  constructor() {
    this.playerId = null;
    this.currentRound = 1;
    this.roomId = null;
  }

  // Initialize from localStorage if available
  init() {
    this.playerId = localStorage.getItem('playerId') || null;
    this.currentRound = parseInt(localStorage.getItem('currentRound') || '1', 10);
    
    if (this.playerId) {
      this.roomId = `player_${this.playerId}`;
      console.log(`PlayerManager initialized for player: ${this.playerId}, round: ${this.currentRound}`);
    }
    return this;
  }

  // Register a player and assign a room
  async registerPlayer(playerData) {
    try {
      const data = await apiPost('register', playerData);
      this.playerId = data.playerId;
      this.roomId = `player_${this.playerId}`;
      localStorage.setItem('playerId', this.playerId);
      localStorage.setItem('currentRound', '1');

      // Join the player to their dedicated room
      socket.emit('join_room', { roomId: this.roomId });
      console.log(`Player registered with ID: ${this.playerId}, joined room: ${this.roomId}`);
      return this.playerId;
    } catch (error) {
      console.error('Error registering player:', error);
      return null;
    }
  }

  // Mark the current round as completed and move to the next round
  async completeRound() {
    try {
      if (!this.playerId) {
        this.playerId = localStorage.getItem('playerId');
        if (!this.playerId) {
          throw new Error('No player ID found');
        }
      }

      const data = await apiPost('complete-round', { 
        playerId: this.playerId, 
        round: this.currentRound 
      });
      
      this.currentRound = data.nextRound;
      localStorage.setItem('currentRound', String(this.currentRound));
      console.log(`Player ${this.playerId} moved to round ${this.currentRound}`);
      return this.currentRound;
    } catch (error) {
      console.error('Error completing round:', error);
      return null;
    }
  }

  // Redirect player based on the current round
  redirectToNextRound(navigate) {
    if (!navigate) {
      console.error('Navigate function is required');
      return;
    }
    
    if (this.currentRound === 1) {
      navigate('/matching');
    } else if (this.currentRound === 2) {
      navigate('/team-battle');
    } else {
      console.error('Unknown round:', this.currentRound);
    }
  }
}

const playerManager = new PlayerManager().init();
export default playerManager;
