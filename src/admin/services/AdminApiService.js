import { getApiUrl, apiGet, apiPost, getApiBaseUrl } from '../../utils/apiUtils'; // Ensure getApiBaseUrl is imported

/**
 * Service to handle all admin API requests
 */
class AdminApiService {
  /**
   * Get current game status
   */
  static async getGameStatus() {
    try {
      console.log('[AdminApiService] Fetching game status...');
      const response = await apiGet('admin/game-status');
      console.log('[AdminApiService] Game status fetched:', response);
      return response;
    } catch (error) {
      console.error('[AdminApiService] Error fetching game status:', error);
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
      const response = await fetch(`${getApiBaseUrl()}/api/admin/reset-round`, { // Use getApiBaseUrl
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
      const url = `${getApiBaseUrl()}/admin/players`; // Use getApiBaseUrl
      const response = await fetch(url, {
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

  static async getMatches(round) {
    try {
      const url = `${getApiBaseUrl()}/admin/matches?round=${round}`; // Use getApiBaseUrl
      const response = await fetch(url, {
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

  static async endMatch(matchId) {
    try {
      const url = `${getApiBaseUrl()}/api/admin/end-match/${matchId}`; // Use getApiBaseUrl
      const response = await fetch(url, {
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

  static async createMatch(player1Id, player2Id, round = 1) {
    return apiPost('admin/create-match', { player1Id, player2Id, round });
  }

  static async getTeams(round) {
    try {
      const url = `${getApiBaseUrl()}/teams/${round}`; // Use getApiBaseUrl
      const response = await fetch(url, {
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
      const url = `${getApiBaseUrl()}/team-battles/${round}`; // Use getApiBaseUrl
      const response = await fetch(url, {
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
   * Delete a player
   */
  static async deletePlayer(playerId) {
    try {
      const url = `${getApiBaseUrl()}/api/admin/players/${playerId}`; // Use getApiBaseUrl
      const response = await fetch(url, {
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
      const url = `${getApiBaseUrl()}/api/admin/players/${playerId}`; // Use getApiBaseUrl
      const response = await fetch(url, {
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
