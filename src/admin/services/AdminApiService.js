/**
 * Service to handle all admin API requests
 */
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

class AdminApiService {
  /**
   * Get current game status
   */
  static async getGameStatus() {
    try {
      console.log('Fetching game status...');
      const response = await fetch(`${API_BASE_URL}/api/admin/game-status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        console.error(`Error fetching game status: ${response.status}`);
        return { status: 'stopped', round: 1 }; // Default fallback
      }
      
      const data = await response.json();
      console.log('Game status fetched:', data);
      return data;
    } catch (error) {
      console.error('Error getting game status:', error);
      return { status: 'stopped', round: 1 }; // Default fallback on error
    }
  }
  
  /**
   * Login request
   */
  static async login(credentials) {
    const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    
    return response.json();
  }
  
  /**
   * Register new admin
   */
  static async register(credentials) {
    const response = await fetch(`${API_BASE_URL}/api/admin/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error.error || `Registration failed with status: ${response.status}`);
      } catch (parseError) {
        throw new Error(`Registration failed with status: ${response.status}`);
      }
    }
    
    return response.json();
  }
  
  /**
   * Fetch player statistics
   */
  static async getPlayerStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/player-stats`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        console.error(`Error fetching player stats: ${response.status}`);
        return { total: 0, stationary: 0, moving: 0, matched: 0, available: 0 };
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching player stats:', error);
      return { total: 0, stationary: 0, moving: 0, matched: 0, available: 0 };
    }
  }
  
  /**
   * Fetch ratings data
   */
  static async getRatings() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/ratings`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        console.error(`Error fetching ratings: ${response.status}`);
        return [];
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching ratings:', error);
      return [];
    }
  }
  
  /**
   * Game control methods
   */
  static async startGame(round) {
    const response = await fetch(`${API_BASE_URL}/api/admin/start-game`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ round }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `Failed with status: ${response.status}` }));
      throw new Error(error.error || 'Failed to start game');
    }
    
    return response.json();
  }
  
  static async stopGame() {
    const response = await fetch(`${API_BASE_URL}/api/admin/stop-game`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `Failed with status: ${response.status}` }));
      throw new Error(error.error || 'Failed to stop game');
    }
    
    return response.json();
  }
  
  static async nextRound() {
    const response = await fetch(`${API_BASE_URL}/api/admin/next-round`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `Failed with status: ${response.status}` }));
      throw new Error(error.error || 'Failed to advance to next round');
    }
    
    return response.json();
  }
  
  static async formTeams(round) {
    const response = await fetch(`${API_BASE_URL}/api/form-teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ round }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to form teams');
    }
    
    return response.json();
  }
  
  static async resetRound() {
    const response = await fetch(`${API_BASE_URL}/api/admin/reset-round`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `Failed with status: ${response.status}` }));
      throw new Error(error.error || 'Failed to reset round');
    }
    
    return response.json();
  }
  
  /**
   * Data management methods
   */
  static async clearDatabase() {
    const response = await fetch(`${API_BASE_URL}/api/admin/clear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to clear database');
    }
    
    return response.json();
  }
  
  static async clearPlayers() {
    const response = await fetch(`${API_BASE_URL}/api/admin/clear-players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to clear player data');
    }
    
    return response.json();
  }
  
  static async clearMatches() {
    const response = await fetch(`${API_BASE_URL}/api/admin/clear-matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to clear match data');
    }
    
    return response.json();
  }
  
  static async clearRatings() {
    const response = await fetch(`${API_BASE_URL}/api/admin/clear-ratings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to clear rating data');
    }
    
    return response.json();
  }
}

export default AdminApiService;
