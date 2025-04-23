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
      console.log('[AdminApiService] Fetching game status...');
      const url = `${getApiBaseUrl()}/admin/game-status`;
      const response = await fetch(url, { method: 'GET' });
      console.log('[AdminApiService] Game status response:', response);
      if (!response.ok) {
        throw new Error(`Failed to fetch game status: ${response.status}`);
      }
      const data = await response.json();
      console.log('[AdminApiService] Game status data:', data);
      return data;
    } catch (error) {
      console.error('[AdminApiService] Error fetching game status:', error);
      return { status: 'stopped', round: 1 }; // Default fallback
    }
  }
  
  /**
   * Login request
   */
  static async login(credentials) {
    console.log('[AdminApiService] Login request initiated...');
    const response = await apiPost('admin/login', credentials);
    console.log('[AdminApiService] Login response:', response);
    return response;
  }
  
  /**
   * Register new admin
   */
  static async register(credentials) {
    console.log('[AdminApiService] Register request initiated...');
    const response = await apiPost('admin/register', credentials);
    console.log('[AdminApiService] Register response:', response);
    return response;
  }
  
  /**
   * Fetch player statistics
   */
  static async getPlayerStats() {
    try {
      console.log('[AdminApiService] Fetching player stats...');
      const url = `${getApiBaseUrl()}/admin/player-stats`;
      const response = await fetch(url, { method: 'GET' });
      console.log('[AdminApiService] Player stats response:', response);
      if (!response.ok) {
        throw new Error(`Failed to fetch player stats: ${response.status}`);
      }
      const data = await response.json();
      console.log('[AdminApiService] Player stats data:', data);
      return data;
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
      console.log('[AdminApiService] Fetching ratings...');
      const url = `${getApiBaseUrl()}/admin/ratings`;
      const response = await fetch(url, { method: 'GET' });
      console.log('[AdminApiService] Ratings response:', response);
      if (!response.ok) {
        throw new Error(`Failed to fetch ratings: ${response.status}`);
      }
      const data = await response.json();
      console.log('[AdminApiService] Ratings data:', data);
      return data;
    } catch (error) {
      console.error('[AdminApiService] Error fetching ratings:', error);
      throw error;
    }
  }
  
  /**
   * Game control methods
   */
  static async startGame(round) {
    console.log('[AdminApiService] Start game request initiated...');
    const response = await apiPost('admin/start-game', { round });
    console.log('[AdminApiService] Start game response:', response);
    return response;
  }
  
  static async stopGame() {
    console.log('[AdminApiService] Stop game request initiated...');
    const response = await apiPost('admin/stop-game', {});
    console.log('[AdminApiService] Stop game response:', response);
    return response;
  }
  
  static async nextRound() {
    console.log('[AdminApiService] Next round request initiated...');
    const response = await apiPost('admin/next-round', {});
    console.log('[AdminApiService] Next round response:', response);
    return response;
  }
  
  static async formTeams(round) {
    console.log('[AdminApiService] Form teams request initiated...');
    const response = await apiPost('form-teams', { round });
    console.log('[AdminApiService] Form teams response:', response);
    return response;
  }
  
  static async resetRound() {
    try {
      console.log('[AdminApiService] Reset round request initiated...');
      const response = await fetch(`${getApiBaseUrl()}/api/admin/reset-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('[AdminApiService] Reset round response:', response);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `Failed with status: ${response.status}` }));
        throw new Error(error.error || 'Failed to reset round');
      }

      const data = await response.json();
      console.log('[AdminApiService] Reset round data:', data);
      return data;
    } catch (error) {
      console.error('[AdminApiService] Error resetting round:', error);
      throw error;
    }
  }
  
  /**
   * Data management methods
   */
  static async clearDatabase() {
    console.log('[AdminApiService] Clear database request initiated...');
    const response = await apiPost('admin/clear', {});
    console.log('[AdminApiService] Clear database response:', response);
    return response;
  }
  
  static async clearPlayers() {
    console.log('[AdminApiService] Clear players request initiated...');
    const response = await apiPost('admin/clear-players', {});
    console.log('[AdminApiService] Clear players response:', response);
    return response;
  }
  
  static async clearMatches() {
    console.log('[AdminApiService] Clear matches request initiated...');
    const response = await apiPost('admin/clear-matches', {});
    console.log('[AdminApiService] Clear matches response:', response);
    return response;
  }
  
  static async clearRatings() {
    console.log('[AdminApiService] Clear ratings request initiated...');
    const response = await apiPost('admin/clear-ratings', {});
    console.log('[AdminApiService] Clear ratings response:', response);
    return response;
  }

  /**
   * Player and match management methods
   */
  static async getPlayers() {
    try {
      console.log('[AdminApiService] Fetching players...');
      const url = `${getApiBaseUrl()}/admin/players`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('[AdminApiService] Players response:', response);

      if (!response.ok) {
        throw new Error(`Failed to fetch players: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[AdminApiService] Players data:', data);
      return data;
    } catch (error) {
      console.error('[AdminApiService] Error fetching players:', error);
      throw error;
    }
  }

  static async getMatches(round) {
    try {
      console.log('[AdminApiService] Fetching matches...');
      const url = `${getApiBaseUrl()}/admin/matches?round=${round}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('[AdminApiService] Matches response:', response);

      if (!response.ok) {
        throw new Error(`Failed to fetch matches: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[AdminApiService] Matches data:', data);
      return data;
    } catch (error) {
      console.error('[AdminApiService] Error fetching matches:', error);
      throw error;
    }
  }

  static async endMatch(matchId) {
    try {
      console.log('[AdminApiService] End match request initiated...');
      const url = `${getApiBaseUrl()}/api/admin/end-match/${matchId}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      console.log('[AdminApiService] End match response:', response);

      if (!response.ok) {
        throw new Error(`Failed to end match: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[AdminApiService] End match data:', data);
      return data;
    } catch (error) {
      console.error('[AdminApiService] Error ending match:', error);
      throw error;
    }
  }

  static async createMatch(player1Id, player2Id, round = 1) {
    console.log('[AdminApiService] Create match request initiated...');
    const response = await apiPost('admin/create-match', { player1Id, player2Id, round });
    console.log('[AdminApiService] Create match response:', response);
    return response;
  }

  static async getTeams(round) {
    try {
      console.log('[AdminApiService] Fetching teams...');
      const url = `${getApiBaseUrl()}/teams/${round}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('[AdminApiService] Teams response:', response);

      if (!response.ok) {
        throw new Error(`Failed to fetch teams: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[AdminApiService] Teams data:', data);
      return data;
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
      console.log('[AdminApiService] Fetching battles...');
      const url = `${getApiBaseUrl()}/team-battles/${round}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('[AdminApiService] Battles response:', response);

      if (!response.ok) {
        throw new Error(`Failed to fetch battles: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[AdminApiService] Battles data:', data);
      return data;
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
      console.log('[AdminApiService] Delete player request initiated...');
      const url = `${getApiBaseUrl()}/api/admin/players/${playerId}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('[AdminApiService] Delete player response:', response);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `Failed with status: ${response.status}` }));
        throw new Error(error.error || `Failed to delete player: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[AdminApiService] Delete player data:', data);
      return data;
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
      console.log('[AdminApiService] Update player request initiated...');
      const url = `${getApiBaseUrl()}/api/admin/players/${playerId}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playerData)
      });
      
      console.log('[AdminApiService] Update player response:', response);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `Failed with status: ${response.status}` }));
        throw new Error(error.error || `Failed to update player: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[AdminApiService] Update player data:', data);
      return data;
    } catch (error) {
      console.error('[AdminApiService] Error updating player:', error);
      throw error;
    }
  }
}

export default AdminApiService;
