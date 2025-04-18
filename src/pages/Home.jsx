// File: src/pages/Home.jsx
// This file defines the Home component, which serves as the landing page for the application.
import React, { useState, useEffect } from 'react';
import PlayerRegistration from '../components/PlayerRegistration';
import '../styles/Home.css';

// Import SVG icons properly
import registerIcon from '../asserts/register.svg';
import roleIcon from '../asserts/male-student-1.svg';
import timerIcon from '../asserts/timer.svg';
import ratingsIcon from '../asserts/ratings.svg';

function Home() {
  const [showRegistration, setShowRegistration] = useState(false);

  useEffect(() => {
    document.body.classList.add('dark-theme');
    return () => {
      document.body.classList.remove('dark-theme');
    };
  }, []);

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>
          Speed <span>Friending</span>
        </h1>
        <p>Connect with others through meaningful conversations in a dynamic, gamified format.</p>
      </header>

      {!showRegistration ? (
        <>
          <section className="game-concept">
            <h2>How It Works</h2>
            <div className="concept-grid">
              <div className="concept-item">
                <div className="icon-container">
                  <img src={registerIcon} alt="Register" className="concept-icon" />
                </div>
                <h3>Register</h3>
                <p>Create your profile with your name, interests, and preferences.</p>
              </div>
              <div className="concept-item">
                <div className="icon-container">
                  <img src={roleIcon} alt="Choose Role" className="concept-icon" />
                </div>
                <h3>Choose Your Role</h3>
                <p>Select to be either a Stationary or Moving participant.</p>
              </div>
              <div className="concept-item">
                <div className="icon-container">
                  <img src={timerIcon} alt="Timer" className="concept-icon" />
                </div>
                <h3>Timed Interactions</h3>
                <p>Engage in short, meaningful conversations with a timer.</p>
              </div>
              <div className="concept-item">
                <div className="icon-container">
                  <img src={ratingsIcon} alt="Rate" className="concept-icon" />
                </div>
                <h3>Rate & Match</h3>
                <p>Rate your conversations and get matched with compatible participants.</p>
              </div>
            </div>
          </section>
          <button onClick={() => setShowRegistration(true)} className="start-button">
            Join Now
          </button>
        </>
      ) : (
        <PlayerRegistration />
      )}
    </div>
  );
}

export default Home;
