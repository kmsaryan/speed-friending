//PlayerRegistration.jsx
// File: src/components/PlayerRegistration.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (response.ok) {
      console.log('Registration successful, redirecting to post-registration page.'); // Debugging statement
      navigate('/post-registration'); // Updated path
    } else {
      alert('Registration failed. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Name" onChange={handleChange} required />
      <input name="gender" placeholder="Gender" onChange={handleChange} />
      <textarea name="interests" placeholder="Interests" onChange={handleChange} />
      <textarea name="preferences" placeholder="Conversation Preferences" onChange={handleChange} />
      <button type="submit">Register</button>
    </form>
  );
}

export default PlayerRegistration;
