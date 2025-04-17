//PlayerRegistration.jsx
// File: src/components/PlayerRegistration.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/PlayerRegistration.css';

function PlayerRegistration() {
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    interests: '',
    preferences: ''
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting registration form:', formData);

    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

    try {
      const response = await fetch(`${backendUrl}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        console.log('Registration successful, redirecting to post-registration page.');
        navigate('/post-registration');
      } else {
        const errorData = await response.json();
        console.error('Registration failed:', errorData);
        alert(errorData.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      alert('An error occurred during registration. Please try again.');
    }
  };

  return (
    <div className="registration-frame">
      <h2>Player Registration</h2>
      <p>Sign up to participate in speed friending.</p>
      <form onSubmit={handleSubmit}>
        <label>
          Name
          <input name="name" placeholder="Enter your name" onChange={handleChange} required />
        </label>
        <label>
          Gender
          <input name="gender" placeholder="Select your gender" onChange={handleChange} />
        </label>
        <label>
          Interests
          <input name="interests" placeholder="Enter your interests" onChange={handleChange} />
        </label>
        <label>
          Conversation Preferences
          <input name="preferences" placeholder="Preferred topics" onChange={handleChange} />
        </label>
        <button type="submit">Register Now</button>
      </form>
    </div>
  );
}

export default PlayerRegistration;
