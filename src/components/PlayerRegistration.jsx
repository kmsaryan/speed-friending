//PlayerRegistration.jsx
// File: src/components/PlayerRegistration.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/global.css'; // Replace colors.css import with global.css
import '../styles/PlayerRegistration.css';
import socket from '../utils/socket';
import registerIcon from '../asserts/register.svg';
import { apiGet, apiPost } from '../utils/apiUtils';

function PlayerRegistration() {
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    interests: '',
    playerType: '',
    tableNumber: '',
  });
  const [warning, setWarning] = useState('');
  const [playerCounts, setPlayerCounts] = useState({
    stationary: 0,
    moving: 0,
    total: 0
  });
  const navigate = useNavigate();

  // Fetch player counts on component mount
  useEffect(() => {
    const fetchPlayerCounts = async () => {
      try {
        // Use the apiGet utility directly without prepending the API URL
        const stationaryData = await apiGet('player-count?playerType=stationary');
        const movingData = await apiGet('player-count?playerType=moving');
        
        setPlayerCounts({
          stationary: stationaryData.count || 0,
          moving: movingData.count || 0,
          total: (stationaryData.count || 0) + (movingData.count || 0)
        });

        console.log('Player counts fetched:', {
          stationary: stationaryData.count,
          moving: movingData.count
        });
      } catch (error) {
        console.error('Error fetching player counts:', error);
      }
    };

    fetchPlayerCounts();
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchPlayerCounts, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'playerType') {
      try {
        // Use the apiGet utility directly without prepending the API URL
        const data = await apiGet(`player-count?playerType=${value}`);
        const oppositeType = value === 'stationary' ? 'moving' : 'stationary';
        const oppositeData = await apiGet(`player-count?playerType=${oppositeType}`);
        
        // Update the player counts
        setPlayerCounts(prev => ({
          ...prev,
          [value]: data.count || 0,
          [oppositeType]: oppositeData.count || 0
        }));

        // Calculate imbalance and provide guidance
        const threshold = 3; // Configurable threshold for imbalance
        const imbalance = Math.abs((data.count || 0) - (oppositeData.count || 0));
        
        if (imbalance >= threshold && (data.count || 0) > (oppositeData.count || 0)) {
          setWarning(`There are already ${data.count} ${value} players (${imbalance} more than ${oppositeType}). 
                    Please consider selecting ${oppositeType} to help balance the groups.`);
        } else {
          setWarning('');
        }
      } catch (error) {
        console.error('Error fetching player count:', error);
        setWarning('Unable to fetch player count. Please try again later.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting registration form:', formData);

    // Validate the name
    if (!formData.name || formData.name.trim() === "" || formData.name === "mm") {
      alert("Please enter a valid name");
      return;
    }

    try {
      const data = await apiPost('register', formData);
      console.log('Registration successful, player ID:', data.id);
      
      // Store essential data in localStorage
      localStorage.setItem('playerId', data.id);
      
      // Register the player with socket.io
      socket.emit("register_player", {
        playerId: data.id,
        playerType: formData.playerType
      });
      
      console.log(`Navigating to matching/${formData.playerType}`);
      
      // Wait a moment to ensure socket registration completes
      setTimeout(() => {
        // Use navigate with a forceRefresh to ensure proper loading
        navigate(`/matching/${formData.playerType}`, { replace: true });
      }, 100);
      
    } catch (error) {
      console.error('Error during registration:', error);
      alert('An error occurred during registration. Please try again.');
    }
  };

  return (
    <div className="registration-container">
      <div className="registration-header">
        <img src={registerIcon} alt="Register" className="registration-icon" />
        <h2>Player Registration</h2>
      </div>
      <p>Sign up to participate in Speed Friending.</p>
      
      {/* Player count stats display */}
      <div className="player-stats">
        <div className="stat-box">
          <span className="stat-value">{playerCounts.total}</span>
          <span className="stat-label">Total Players</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">{playerCounts.stationary}</span>
          <span className="stat-label">Stationary</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">{playerCounts.moving}</span>
          <span className="stat-label">Moving</span>
        </div>
      </div>
      
      {warning && <p className="warning">{warning}</p>}
      
      <form onSubmit={handleSubmit} className="dark-form">
        <div className="form-grid">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange} required>
              <option value="">Select your gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Interests</label>
            <select name="interests" value={formData.interests} onChange={handleChange} required>
              <option value="">Select your interests</option>
              <option value="Sports">Sports</option>
              <option value="Music">Music</option>
              <option value="Technology">Technology</option>
              <option value="Art">Art</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Player Type <i className="info-tooltip" title="Stationary players stay at their table. Moving players rotate tables.">ⓘ</i></label>
            <select name="playerType" value={formData.playerType} onChange={handleChange} required>
              <option value="">Select your player type</option>
              <option value="stationary">Stationary (Stay at your table)</option>
              <option value="moving">Moving (Rotate between tables)</option>
            </select>
            <div className="player-type-info">
              <p><strong>Stationary:</strong> You'll stay at your assigned table while others come to you.</p>
              <p><strong>Moving:</strong> You'll move to different tables to meet stationary players.</p>
              <p className="balance-notice">For the best experience, we need a balanced number of each player type.</p>
            </div>
          </div>
          
          {formData.playerType === 'stationary' && (
            <div className="form-group full-width">
              <label>Table Number</label>
              <input
                type="number"
                name="tableNumber"
                placeholder="Enter your table number"
                value={formData.tableNumber}
                onChange={handleChange}
                required
              />
            </div>
          )}
        </div>
        
        <button type="submit" className="btn-primary btn-rounded">
          Register Now
        </button>
      </form>
    </div>
  );
}

export default PlayerRegistration;
