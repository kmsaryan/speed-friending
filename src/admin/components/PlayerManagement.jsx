import React, { useState, useEffect } from 'react';
import AdminApiService from '../services/AdminApiService';
import '../styles/PlayerManagement.css';

function PlayerManagement() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    interests: '',
    preferences: '',
    playerType: '',
    tableNumber: ''
  });

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const playersData = await AdminApiService.getPlayers();
      setPlayers(playersData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching players:', error);
      setError('Failed to load players data.');
      setLoading(false);
    }
  };

  const handleDeletePlayer = async (playerId) => {
    if (!window.confirm('Are you sure you want to delete this player?')) {
      return;
    }

    try {
      await AdminApiService.deletePlayer(playerId);
      setPlayers(players.filter(player => player.id !== playerId));
    } catch (error) {
      console.error('Error deleting player:', error);
      setError('Failed to delete player. Please try again.');
    }
  };

  const handleEditClick = (player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name || '',
      gender: player.gender || '',
      interests: player.interests || '',
      preferences: player.preferences || '',
      playerType: player.playerType || '',
      tableNumber: player.tableNumber || ''
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleUpdatePlayer = async (e) => {
    e.preventDefault();

    try {
      await AdminApiService.updatePlayer(editingPlayer.id, formData);
      setPlayers(players.map(player =>
        player.id === editingPlayer.id
          ? { ...player, ...formData }
          : player
      ));
      setEditingPlayer(null);
    } catch (error) {
      console.error('Error updating player:', error);
      setError('Failed to update player. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingPlayer(null);
  };

  if (loading) {
    return (
      <div className="admin-section">
        <h2>Player Management</h2>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading players...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-section">
        <h2>Player Management</h2>
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchPlayers} className="refresh-button">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <h2>Player Management</h2>

      <div className="control-card">
        <div className="table-header">
          <h3>Registered Players ({players.length})</h3>
          <button onClick={fetchPlayers} className="refresh-button">
            Refresh Data
          </button>
        </div>

        {editingPlayer ? (
          <div className="edit-player-form">
            <h3>Edit Player: {editingPlayer.name}</h3>
            <form onSubmit={handleUpdatePlayer}>
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Gender:</label>
                <select
                  name="gender"
                  value={formData.gender || ''}
                  onChange={handleFormChange}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Interests:</label>
                <input
                  type="text"
                  name="interests"
                  value={formData.interests || ''}
                  onChange={handleFormChange}
                  placeholder="e.g. Sports, Technology, Arts"
                />
              </div>

              <div className="form-group">
                <label>Preferences:</label>
                <input
                  type="text"
                  name="preferences"
                  value={formData.preferences || ''}
                  onChange={handleFormChange}
                  placeholder="Any conversation preferences"
                />
              </div>

              <div className="form-group">
                <label>Player Type:</label>
                <select
                  name="playerType"
                  value={formData.playerType}
                  onChange={handleFormChange}
                  required
                >
                  <option value="stationary">Stationary</option>
                  <option value="moving">Moving</option>
                </select>
              </div>

              {formData.playerType === 'stationary' && (
                <div className="form-group">
                  <label>Table Number:</label>
                  <input
                    type="text"
                    name="tableNumber"
                    value={formData.tableNumber || ''}
                    onChange={handleFormChange}
                    placeholder="e.g. 1, 2, A, B"
                  />
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="update-button">Update Player</button>
                <button type="button" onClick={handleCancelEdit} className="cancel-button">Cancel</button>
              </div>
            </form>
          </div>
        ) : (
          <div className="players-table-container">
            <table className="players-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Gender</th>
                  <th>Type</th>
                  <th>Table</th>
                  <th>Status</th>
                  <th>Matches</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {players.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="no-data">No players registered yet</td>
                  </tr>
                ) : (
                  players.map((player) => (
                    <tr key={player.id} className={`status-${player.status || 'unknown'}`}>
                      <td>{player.id}</td>
                      <td>{player.name}</td>
                      <td>{player.gender || 'Not specified'}</td>
                      <td>{player.playerType}</td>
                      <td>{player.tableNumber || 'N/A'}</td>
                      <td>
                        <span className={`status-badge ${player.status || 'unknown'}`}>
                          {player.status?.charAt(0).toUpperCase() + player.status?.slice(1) || 'Unknown'}
                        </span>
                      </td>
                      <td>{player.interaction_count || 0}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="edit-button"
                            onClick={() => handleEditClick(player)}
                          >
                            Edit
                          </button>
                          <button
                            className="delete-button"
                            onClick={() => handleDeletePlayer(player.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayerManagement;
