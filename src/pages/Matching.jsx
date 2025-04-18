import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import socket from "../utils/socket";
import "../styles/Matching.css";

function Matching() {
  const [match, setMatch] = useState(null);
  const [message, setMessage] = useState("Finding the best match for you...");
  const { playerType } = useParams(); // Get playerType from URL parameter
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Emit the find_match event with the player type from the URL
    socket.emit("find_match", playerType);
    setLoading(true);

    socket.on("match_found", (matchData) => {
      console.log("Match data received:", matchData);
      setMatch(matchData);
      setMessage("Match found!");
      setLoading(false);
    });

    socket.on("no_match", (msg) => {
      console.log("No match message:", msg);
      setMessage(msg);
      setLoading(false);
    });

    return () => {
      socket.off("match_found");
      socket.off("no_match");
    };
  }, [playerType]);

  const retryMatch = () => {
    setMessage("Finding a new match...");
    setMatch(null);
    setLoading(true);
    socket.emit("find_match", playerType);
  };

  return (
    <div className="matching-container">
      <h2 className="match-header">{message}</h2>
      
      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Searching for a compatible match...</p>
        </div>
      )}
      
      {!loading && match && (
        <div className="match-card">
          <div className="match-avatar">
            {match.name ? match.name.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="match-details">
            <h3>You've been matched with:</h3>
            <p className="match-name">{match.name || 'Unknown'}</p>
            <div className="match-info">
              <div className="info-item">
                <span className="info-label">Gender:</span>
                <span className="info-value">{match.gender || 'Not specified'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Interests:</span>
                <span className="info-value">{match.interests || 'Not specified'}</span>
              </div>
              {match.preferences && (
                <div className="info-item">
                  <span className="info-label">Preferences:</span>
                  <span className="info-value">{match.preferences}</span>
                </div>
              )}
              {match.playerType && (
                <div className="info-item">
                  <span className="info-label">Player Type:</span>
                  <span className="info-value">{match.playerType}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {!loading && !match && <p className="no-match">Waiting for a match...</p>}
      
      <button 
        onClick={retryMatch} 
        className="retry-button"
        disabled={loading}
      >
        {loading ? 'Searching...' : 'Try Again'}
      </button>
    </div>
  );
}

export default Matching;
