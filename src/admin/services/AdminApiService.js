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
  
  /**
   * Get teams for a specific round
   */
  static async getTeams(round = 2) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/${round}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch teams: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  }
  
  /**
   * Get battles for a specific round
   */
  static async getBattles(round = 2) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/team-battles/${round}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch battles: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching battles:', error);
      throw error;
    }
  }
  
  /**
   * Get all players
   */
  static async getPlayers() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/players`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch players: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching players:', error);
      throw error;
    }
  }
  
  /**
   * Get matches for a specific round
   */
  static async getMatches(round = 1) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/matches?round=${round}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch matches: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching matches:', error);
      throw error;
    }
  }
  
  /**
   * End a specific match
   */
  static async endMatch(matchId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/end-match/${matchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to end match: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error ending match:', error);
      throw error;
    }
  }
  
  /**
   * Delete a player
   */
  static async deletePlayer(playerId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/players/${playerId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `Failed with status: ${response.status}` }));
        throw new Error(error.error || `Failed to delete player: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error deleting player:', error);
      throw error;
    }
  }
  
  /**
   * Update a player
   */
  static async updatePlayer(playerId, playerData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/players/${playerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playerData)
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `Failed with status: ${response.status}` }));
        throw new Error(error.error || `Failed to update player: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error updating player:', error);
      throw error;
    }
  }
}

export default AdminApiService;
