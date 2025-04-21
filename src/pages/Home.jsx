// File: src/pages/Home.jsx
// This file defines the Home component, which serves as the landing page for the application.
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PlayerRegistration from '../components/PlayerRegistration';
import '../styles/global.css'; // Replace colors.css with global.css
import '../styles/Home.css';

// Import SVG icons properly
import registerIcon from '../asserts/register.svg';
import roleIcon from '../asserts/male-student-1.svg';
import timerIcon from '../asserts/timer.svg';
import ratingsIcon from '../asserts/ratings.svg';

function Home() {
  const [showRegistration, setShowRegistration] = useState(false);
  const [adminLinkVisible, setAdminLinkVisible] = useState(false);

  useEffect(() => {
    document.body.classList.add('dark-theme');
    return () => {
      document.body.classList.remove('dark-theme');
    };
  }, []);

  // Toggle admin link visibility with key combination
  const handleKeyDown = (e) => {
    // Show admin link when user presses Ctrl + Alt + A
    if (e.ctrlKey && e.altKey && e.key === 'a') {
      setAdminLinkVisible(!adminLinkVisible);
    }
  };

  // Use effect to add key listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [adminLinkVisible]);

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
            
            {/* New detailed explanation about the game */}
            <div className="game-description">
              <h3>About Speed Friending</h3>
              <p>Speed Friending is designed to help you make meaningful connections in a fun, structured environment. Unlike traditional networking, our focus is on genuine connection rather than professional advancement.</p>
              
              <div className="game-steps">
                <div className="step">
                  <span className="step-number">1</span>
                  <div className="step-content">
                    <h4>Registration & Role Assignment</h4>
                    <p>After registering, you'll be assigned as either a "Stationary" participant (you stay at your designated table) or a "Moving" participant (you rotate between tables). We aim to keep these groups balanced for the best experience.</p>
                  </div>
                </div>
                
                <div className="step">
                  <span className="step-number">2</span>
                  <div className="step-content">
                    <h4>Match & Interact</h4>
                    <p>Our algorithm will match you with another participant. Each interaction lasts for a set time (typically 3 minutes), guided by a timer. This creates a focused environment for meaningful conversation.</p>
                  </div>
                </div>
                
                <div className="step">
                  <span className="step-number">3</span>
                  <div className="step-content">
                    <h4>Rate & Provide Feedback</h4>
                    <p>After each conversation, you'll rate the interaction based on enjoyment, depth, and whether you'd like to chat again. This helps our system make better matches in future rounds.</p>
                  </div>
                </div>
                
                <div className="step">
                  <span className="step-number">4</span>
                  <div className="step-content">
                    <h4>Team Formation & Activities</h4>
                    <p>In later rounds, participants with high compatibility are formed into teams for fun group activities and challenges, creating opportunities for deeper connections.</p>
                  </div>
                </div>
              </div>
              
              <div className="game-tips">
                <h4>Tips for a Great Experience:</h4>
                <ul>
                  <li>Be open and authentic in your conversations</li>
                  <li>Ask thoughtful questions beyond typical small talk</li>
                  <li>Listen actively to your conversation partner</li>
                  <li>Exchange contact information if you'd like to continue the conversation later</li>
                </ul>
              </div>
            </div>
          </section>
          <button onClick={() => setShowRegistration(true)} className="btn-primary btn-rounded">
            Join Now
          </button>
        </>
      ) : (
        <PlayerRegistration />
      )}

      {/* Hidden admin access - shown with keyboard shortcut */}
      {adminLinkVisible && (
        <div className="admin-access">
          <Link to="/admin" className="admin-link">
            Access Admin Panel
          </Link>
          <p className="admin-note">Admin access enabled. Click to enter admin panel.</p>
        </div>
      )}
      <div className="footer-note">
      </div>
    </div>
  );
}

export default Home;
