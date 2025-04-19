import { getApiUrl, apiGet, apiPost } from '../../utils/apiUtils';

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
      console.error('Error fetching player stats:', error);
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
      console.error('Error fetching ratings:', error);
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
      console.error('Error fetching players:', error);
      return [];
    }
  }

  static async getMatches(round) {
    try {
      return await apiGet(`admin/matches?round=${round}`);
    } catch (error) {
      console.error('Error fetching matches:', error);
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
      console.error('Error fetching teams:', error);
      throw error;
    }
  }
}

export default AdminApiService;
