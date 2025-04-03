import React from 'react';
import { useNavigate } from 'react-router-dom';

function PostRegistration() {
  const navigate = useNavigate();

  const handleSelection = (type) => {
    if (type === 'stationary') {
      navigate(`/matching/${type}`);
    } else if (type === 'moving') {
      navigate(`/matching/${type}`);
    }
  };

  return (
    <div>
      <h1>Thank You for Registering!</h1>
      <p>Your registration was successful. Please select your player type to start the game:</p>
      <button onClick={() => handleSelection('stationary')}>Stationary Participant</button>
      <button onClick={() => handleSelection('moving')}>Moving Participant</button>
    </div>
  );
}

export default PostRegistration;
