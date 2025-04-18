// File: src/pages/Home.jsx
// This file defines the Home component, which serves as the landing page for the application.
import React from 'react';
import PlayerRegistration from '../components/PlayerRegistration';
import '../styles/Home.css';
import deskWorkIcon from '../asserts/desk-work.svg';
import runningIcon from '../asserts/running.svg';
import timerIcon from '../asserts/timer.svg';
import registeration from '../asserts/register.svg';
import rating from '../asserts/ratings.svg';

function Home() {
  const [showRegistration, setShowRegistration] = React.useState(false);

  return (
    <div className="container">
      <h1>Welcome to Speed Friending</h1>
      <div className="game-concept">
        <h2>Game Concept</h2>
        <div className="concept-item">
          <img src={registeration} alt="Desk Work" className="icon" />
          <p>Players register by providing their name, gender, interests, and preferences.</p>
        </div>
        <div className="concept-item">
          <img src={runningIcon} alt="Running" className="icon" />
          <p>Players select their type: Stationary or Moving Participant.</p>
        </div>
        <div className="concept-item">
          <img src={timerIcon} alt="Timer" className="icon" />
          <p>Each round has a fixed time limit for conversations.</p>
        </div>
        <div className="concept-item">
          <img src={rating} alt="Rating" className="icon" />
          <p>Players rate their interactions after each conversation.</p>
        </div>
      </div>
      {!showRegistration ? (
        <button onClick={() => setShowRegistration(true)} className="start-button">
          Start Registration
        </button>
      ) : (
        <PlayerRegistration />
      )}
    </div>
  );
}

export default Home;
