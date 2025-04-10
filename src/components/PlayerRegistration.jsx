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
    console.log('Submitting registration form:', formData); // Log form data

    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'; // Fallback to default URL

    try {
      const response = await fetch(`${backendUrl}/api/register`, { // Use backend URL
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        console.log('Registration successful, redirecting to post-registration page.'); // Log success
        navigate('/post-registration');
      } else {
        const errorData = await response.json();
        console.error('Registration failed:', errorData); // Log error response
        alert(errorData.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Error during registration:', error); // Log network or other errors
      alert('An error occurred during registration. Please try again.');
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
