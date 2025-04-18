//PlayerRegistration.jsx
// File: src/components/PlayerRegistration.jsx
import React, { useState } from 'react';
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
  const navigate = useNavigate();

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'playerType') {
      try {
        const data = await apiGet(`player-count?playerType=${value}`);
        if (data.count > 5) { // Example threshold
          setWarning(`There are already many ${value} players. Consider selecting a different type.`);
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

    // Validate the name to make sure it's not empty or "mm"
    if (!formData.name || formData.name.trim() === "" || formData.name === "mm") {
      alert("Please enter a valid name");
      return;
    }

    try {
      const data = await apiPost('register', formData);
      console.log('Registration successful, player ID:', data.id);
      
      // Store player ID and NAME in localStorage for persistence
      localStorage.setItem('playerId', data.id);
      localStorage.setItem('playerName', formData.name.trim());
      localStorage.setItem('playerType', formData.playerType);
      
      console.log(`Stored player name "${formData.name}" in localStorage`);
      
      // Register the player with the Socket.IO server
      socket.emit('register_player', {
        playerId: data.id,
        playerName: formData.name,
        playerType: formData.playerType
      });
      
      console.log('Registration successful, redirecting to matching page.');
      navigate(`/matching/${formData.playerType}`);
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
            <label>Player Type</label>
            <select name="playerType" value={formData.playerType} onChange={handleChange} required>
              <option value="">Select your player type</option>
              <option value="stationary">Stationary</option>
              <option value="moving">Moving</option>
            </select>
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
