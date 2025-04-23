import { getApiBaseUrl, apiGet, apiPost } from '../../utils/apiUtils';

/**
 * Service to handle all admin API requests
 */
class AdminApiService {
  /**
   * Get current game status
   */
  static async getGameStatus() {
    try {
      const url = `${getApiBaseUrl()}/admin/game-status`;
      const response = await fetch(url, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`Failed to fetch game status: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('[AdminApiService] Error fetching game status:', error);
      return { status: 'stopped', round: 1 }; // Default fallback
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
      const url = `${getApiBaseUrl()}/admin/player-stats`;
      const response = await fetch(url, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`Failed to fetch player stats: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('[AdminApiService] Error fetching player stats:', error);
      throw error;
    }
  }
  
  /**
   * Fetch ratings data
   */
  static async getRatings() {
    try {
      const url = `${getApiBaseUrl()}/admin/ratings`;
      const response = await fetch(url, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`Failed to fetch ratings: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('[AdminApiService] Error fetching ratings:', error);
      throw error;
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
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/admin/reset-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `Failed with status: ${response.status}` }));
        throw new Error(error.error || 'Failed to reset round');
      }

      return response.json();
    } catch (error) {
      console.error('[AdminApiService] Error resetting round:', error);
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
      const url = `${getApiBaseUrl()}/admin/players`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch players: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('[AdminApiService] Error fetching players:', error);
      throw error;
    }
  }

  static async getMatches(round) {
    try {
      const url = `${getApiBaseUrl()}/admin/matches?round=${round}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch matches: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('[AdminApiService] Error fetching matches:', error);
      throw error;
    }
  }

  static async endMatch(matchId) {
    try {
      const url = `${getApiBaseUrl()}/api/admin/end-match/${matchId}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to end match: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('[AdminApiService] Error ending match:', error);
      throw error;
    }
  }

  static async createMatch(player1Id, player2Id, round = 1) {
    return apiPost('admin/create-match', { player1Id, player2Id, round });
  }

  static async getTeams(round) {
    try {
      const url = `${getApiBaseUrl()}/teams/${round}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch teams: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('[AdminApiService] Error fetching teams:', error);
      throw error;
    }
  }
  
  /**
   * Get battles for a specific round
   */
  static async getBattles(round = 2) {
    try {
      const url = `${getApiBaseUrl()}/team-battles/${round}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch battles: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('[AdminApiService] Error fetching battles:', error);
      throw error;
    }
  }
  
  /**
   * Delete a player
   */
  static async deletePlayer(playerId) {
    try {
      const url = `${getApiBaseUrl()}/api/admin/players/${playerId}`;
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
      console.error('[AdminApiService] Error deleting player:', error);
      throw error;
    }
  }
  
  /**
   * Update a player
   */
  static async updatePlayer(playerId, playerData) {
    try {
      const url = `${getApiBaseUrl()}/api/admin/players/${playerId}`;
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
      console.error('[AdminApiService] Error updating player:', error);
      throw error;
    }
  }
}

export default AdminApiService;
