import React from 'react';
import '../styles/PostRegistration.css';

function PostRegistration() {
  return (
    <div className="container">
      <h1>Thank You for Registering!</h1>
      <p>Select your player type to start the game:</p>
      <button onClick={() => alert('Stationary Selected')}>Stationary Participant</button>
      <button onClick={() => alert('Moving Selected')}>Moving Participant</button>
    </div>
  );
}

export default PostRegistration;
