import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import socket from "../utils/socket";
import "../styles/Matching.css";
import StationaryParticipant from "../components/StationaryParticipant";
import MovingParticipant from "../components/MovingParticipant";
import RatingForm from "../components/RatingForm";

function Matching() {
  const [match, setMatch] = useState(null);
  const [message, setMessage] = useState("Finding the best match for you...");
  const { playerType } = useParams();
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [ratings, setRatings] = useState({
    enjoyment: 3,
    depth: 3,
    wouldChatAgain: true
  });

  useEffect(() => {
    socket.emit("find_match", playerType);
    setLoading(true);

    socket.on("match_found", (matchData) => {
      console.log("Match data received:", matchData);
      setMatch(matchData);
      setMessage("Match found!");
      setLoading(false);
      setTimeLeft(180); // Reset timer when match is found
      setShowRating(false);
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

  useEffect(() => {
    socket.emit("game_status_check");
    
    // Listen for game status updates
    socket.on("game_status_update", (gameState) => {
      console.log("Received game status update:", gameState);
      if (gameState.status === 'stopped') {
        setMessage("The game is currently paused. Please wait for the administrator to start the game.");
        setLoading(true);
      } else if (gameState.status === 'running') {
        if (!match) {
          setMessage("The game is active. Looking for a match...");
          socket.emit("find_match", playerType);
        }
      }
      
      if (gameState.round && match && gameState.round !== match.round) {
        setMessage(`Round ${gameState.round} has started. Looking for a new match...`);
        setMatch(null);
        setLoading(true);
        socket.emit("find_match", playerType);
      }
    });
    
    // Listen for game status changes
    socket.on("game_status_change", (gameState) => {
      console.log("Game status changed:", gameState);
      if (gameState.status === 'stopped') {
        setMessage("The game has been paused by the administrator. Please wait for the game to resume.");
        setLoading(true);
      } else if (gameState.status === 'running') {
        setMessage("The game is now active. Looking for a match...");
        if (!match) {
          socket.emit("find_match", playerType);
        }
      }
      
      if (gameState.round && gameState.round !== match?.round) {
        setMessage(`Round ${gameState.round} has started. Looking for a new match...`);
        setMatch(null);
        setLoading(true);
        socket.emit("find_match", playerType);
      }
    });
    
    socket.emit("find_match", playerType);
    setLoading(true);

    return () => {
      socket.off("game_status_update");
      socket.off("game_status_change");
    };
  }, [playerType, match]);

  // Timer effect
  useEffect(() => {
    let interval = null;
    
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(seconds => seconds - 1);
      }, 1000);
    } else if (timerActive && timeLeft === 0) {
      setTimerActive(false);
      setShowRating(true);
    }
    
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const toggleTimer = () => {
    setTimerActive(!timerActive);
  };

  const handleRatingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRatings({
      ...ratings,
      [name]: type === 'checkbox' ? checked : parseFloat(value)
    });
  };

  const submitRating = async () => {
    if (!match) return;
    
    try {
      // Get the player ID from socket mapping (we were using socket.id before)
      const playerData = socketToPlayer?.get(socket.id);
      const actualPlayerId = playerData ? playerData.playerId : socket.id;
      
      console.log("Submitting rating with player ID:", actualPlayerId);
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: actualPlayerId,
          ratedPlayerId: match.id,
          enjoyment: ratings.enjoyment,
          depth: ratings.depth,
          wouldChatAgain: ratings.wouldChatAgain,
          round: match.round || 1
        })
      });
      
      if (response.ok) {
        setMessage("Rating submitted! Looking for your next match...");
        setShowRating(false);
        
        // Emit event to update server about the rating submission
        socket.emit("submit_rating", {
          playerId: actualPlayerId,
          ratedPlayerId: match.id,
          round: match.round || 1
        });
        
        retryMatch();
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
    }
  };

  const retryMatch = () => {
    setMessage("Finding a new match...");
    setMatch(null);
    setLoading(true);
    setTimerActive(false);
    setTimeLeft(180);
    socket.emit("find_match", playerType);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="matching-container">
        <h2 className="match-header">{message}</h2>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Searching for a compatible match...</p>
        </div>
      </div>
    );
  }

  // Render rating form using the new component
  if (showRating && match) {
    return (
      <div className="matching-container">
        <RatingForm 
          match={match}
          ratings={ratings}
          onRatingChange={handleRatingChange}
          onSubmit={submitRating}
        />
      </div>
    );
  }

  // Render no match state
  if (!match) {
    return (
      <div className="matching-container">
        <h2 className="match-header">{message}</h2>
        <p className="no-match">Waiting for a match...</p>
        <button 
          onClick={retryMatch} 
          className="retry-button"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Render matched state with the appropriate component
  return (
    <div className="matching-container">
      <h2 className="match-header">You've been matched!</h2>
      
      <div className="timer-controls">
        <button onClick={toggleTimer} className={timerActive ? "pause-button" : "start-button"}>
          {timerActive ? "Pause Timer" : "Start Interaction"}
        </button>
        <div className="timer-display">
          Time Left: {Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? '0' : ''}{timeLeft % 60}
        </div>
      </div>
      
      {/* Render the appropriate participant component based on player type */}
      {playerType === 'stationary' ? (
        <StationaryParticipant match={match} timeLeft={timeLeft} />
      ) : (
        <MovingParticipant match={match} timeLeft={timeLeft} />
      )}
      
      <button 
        onClick={retryMatch} 
        className="retry-button"
        disabled={timerActive}
      >
        Find New Match
      </button>
    </div>
  );
}

export default Matching;
