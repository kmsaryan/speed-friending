import { getApiUrl, apiGet, apiPost } from '../../utils/apiUtils';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

/**
 * Service to handle all admin API requests
 */
class AdminApiService {
  /**
   * Get current game status
   */
  static async getGameStatus() {
    try {
      // Replace direct fetch with apiGet utility function
      return await apiGet('admin/game-status');
    } catch (error) {
      console.error('Error getting game status:', error);
      return { status: 'stopped', round: 1 }; // Default fallback on error
    }
  }
  
  /**
   * Login request
   */
  static async login(credentials) {
    return apiPost('admin/login', credentials);
  }
  
  /**
   * Register new admin
   */
  static async register(credentials) {
    return apiPost('admin/register', credentials);
  }
  
  /**
   * Fetch player statistics
   */
  static async getPlayerStats() {
    try {
      return await apiGet('admin/player-stats');
    } catch (error) {
      console.error('[AdminApiService] Error fetching player stats:', error); // Add detailed logging
      return { total: 0, stationary: 0, moving: 0, matched: 0, available: 0 };
    }
  }
  
  /**
   * Fetch ratings data
   */
  static async getRatings() {
    try {
      return await apiGet('admin/ratings');
    } catch (error) {
      console.error('[AdminApiService] Error fetching ratings:', error); // Add detailed logging
      return [];
    }
  }
  
  /**
   * Game control methods
   */
  static async startGame(round) {
    return apiPost('admin/start-game', { round });
  }
  
  static async stopGame() {
    return apiPost('admin/stop-game', {});
  }
  
  static async nextRound() {
    return apiPost('admin/next-round', {});
  }
  
  static async formTeams(round) {
    return apiPost('form-teams', { round });
  }
  
  static async resetRound() {
    return apiPost('admin/reset-round', {});
  }
  
  /**
   * Reset the game round to 1
   */
  static async resetRound() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/reset-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `Failed with status: ${response.status}` }));
        throw new Error(error.error || 'Failed to reset round');
      }

      return response.json();
    } catch (error) {
      console.error('[AdminApiService] Error resetting round:', error); // Add detailed logging
      throw error;
    }
  }
  
  /**
   * Data management methods
   */
  static async clearDatabase() {
    return apiPost('admin/clear', {});
  }
  
  static async clearPlayers() {
    return apiPost('admin/clear-players', {});
  }
  
  static async clearMatches() {
    return apiPost('admin/clear-matches', {});
  }
  
  static async clearRatings() {
    return apiPost('admin/clear-ratings', {});
  }

  /**
   * Player and match management methods
   */
  static async getPlayers() {
    try {
      return await apiGet('admin/players');
    } catch (error) {
      console.error('[AdminApiService] Error fetching players:', error); // Add detailed logging
      return [];
    }
  }

  static async getMatches(round) {
    try {
      return await apiGet(`admin/matches?round=${round}`);
    } catch (error) {
      console.error('[AdminApiService] Error fetching matches:', error); // Add detailed logging
      return [];
    }
  }

  static async endMatch(matchId) {
    return apiPost(`admin/end-match/${matchId}`, {});
  }

  static async createMatch(player1Id, player2Id, round = 1) {
    return apiPost('admin/create-match', { player1Id, player2Id, round });
  }

  static async getTeams(round) {
    try {
      return await apiGet(`teams/${round}`);
    } catch (error) {
      console.error('[AdminApiService] Error fetching teams:', error); // Add detailed logging
      throw error;
    }
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
      console.error('[AdminApiService] Error fetching teams:', error); // Add detailed logging
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
      console.error('[AdminApiService] Error fetching battles:', error); // Add detailed logging
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
      console.error('[AdminApiService] Error fetching players:', error); // Add detailed logging
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
      console.error('[AdminApiService] Error fetching matches:', error); // Add detailed logging
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
      console.error('[AdminApiService] Error ending match:', error); // Add detailed logging
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
      console.error('[AdminApiService] Error deleting player:', error); // Add detailed logging
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
      console.error('[AdminApiService] Error updating player:', error); // Add detailed logging
      throw error;
    }
  }
}

export default AdminApiService;
