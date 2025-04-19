import React, { useState } from 'react';
import '../styles/global.css';
import '../styles/Registration.css';
import socket from '../utils/socket';

function Registration({ onRegistrationComplete }) {
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    interests: '',
    preferences: '',
    playerType: 'stationary',
    tableNumber: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }
    
    try {
      setIsLoading(true);
      
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Registration failed');
      }
      
      const data = await response.json();
      
      // Store player ID in localStorage
      localStorage.setItem('playerId', data.id);
      
      // Store player name in localStorage - ensure it's not empty
      if (formData.name && formData.name.trim()) {
        localStorage.setItem('playerName', formData.name.trim());
        console.log("Stored player name:", formData.name.trim());
      }
      
      // Emit socket event to register player
      socket.emit("register_player", {
        playerId: data.id,
        playerType: formData.playerType
      });
      
      // Update the state
      setIsLoading(false);
      onRegistrationComplete(formData.playerType);
      
    } catch (error) {
      console.error('Registration error:', error);
      setError('Failed to register. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="registration-container">
      <h1>Player Registration</h1>
      <form onSubmit={handleSubmit} className="registration-form">
        {error && <p className="error-message">{error}</p>}
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="gender">Gender</label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="interests">Interests</label>
          <input
            type="text"
            id="interests"
            name="interests"
            value={formData.interests}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="preferences">Preferences</label>
          <input
            type="text"
            id="preferences"
            name="preferences"
            value={formData.preferences}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="playerType">Player Type</label>
          <select
            id="playerType"
            name="playerType"
            value={formData.playerType}
            onChange={handleChange}
          >
            <option value="stationary">Stationary</option>
            <option value="moving">Moving</option>
          </select>
        </div>
        {formData.playerType === 'stationary' && (
          <div className="form-group">
            <label htmlFor="tableNumber">Table Number</label>
            <input
              type="text"
              id="tableNumber"
              name="tableNumber"
              value={formData.tableNumber}
              onChange={handleChange}
            />
          </div>
        )}
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
}

export default Registration;