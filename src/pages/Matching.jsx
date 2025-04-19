import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../utils/socket";
import { socketManager } from "../utils/socket";
import playerManager from "../utils/playerManager";
import timerSyncService from "../utils/timerSyncService";
import "../styles/global.css"; // Replace colors.css import with global.css
import "../styles/Matching.css";
import StationaryParticipant from "../components/StationaryParticipant";
import MovingParticipant from "../components/MovingParticipant";
import RatingForm from "../components/RatingForm";

function Matching() {
  const [match, setMatch] = useState(null);
  const [message, setMessage] = useState("Finding the best match for you...");
  const { playerType } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
  const [timerActive, setTimerActive] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [ratings, setRatings] = useState({
    enjoyment: 3,
    depth: 3,
    wouldChatAgain: true
  });
  const [matchId, setMatchId] = useState(null); // Add match ID state
  const [matchEnded, setMatchEnded] = useState(false); // Track if the match has ended
  
  // Store player ID locally
  const [playerId, setPlayerId] = useState(() => {
    // Try to get playerId from localStorage if it exists
    return localStorage.getItem('playerId') || null;
  });

  useEffect(() => {
    // Listen for registered player ID if we don't have it
    if (!playerId) {
      const storedPlayerId = localStorage.getItem('playerId');
      if (storedPlayerId) {
        setPlayerId(storedPlayerId);
        console.log("Retrieved player ID from storage:", storedPlayerId);
      } else {
        // Set up listener for player ID from registration
        const handleRegistration = (e) => {
          if (e.key === 'playerId' && e.newValue) {
            setPlayerId(e.newValue);
            console.log("Received player ID from storage event:", e.newValue);
          }
        };
        window.addEventListener('storage', handleRegistration);
        return () => window.removeEventListener('storage', handleRegistration);
      }
    }
  }, [playerId]);

  useEffect(() => {
    socket.emit("find_match", playerType);
    setLoading(true);

    socket.on("match_found", (matchData) => {
      console.log("Match data received:", matchData);
      setMatch(matchData);
      
      // If the server provides a match ID, store it
      if (matchData.matchId) {
        console.log("Match ID set:", matchData.matchId);
        setMatchId(matchData.matchId);
      } else {
        console.warn("No matchId received in match_found event");
      }
      
      setMessage("Match found!");
      setLoading(false);
      setTimeLeft(180); // Reset timer when match is found
      setShowRating(false);
      setMatchEnded(false); // Reset match ended state
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

  // Use the timer sync service
  useEffect(() => {
    if (match && matchId) {
      // Initialize timer service with match ID
      timerSyncService.initializeTimer(matchId, 180);
      
      // Listen for timer updates
      const unsubscribe = timerSyncService.addListener(timerState => {
        setTimeLeft(timerState.timeLeft);
        setTimerActive(timerState.isActive);
        
        if (timerState.timedOut) {
          setShowRating(true);
        }
      });
      
      // Clean up timer when unmounting or changing match
      return () => {
        unsubscribe();
        timerSyncService.cleanup();
      };
    }
  }, [match, matchId]);

  const toggleTimer = useCallback(() => {
    if (!matchId) {
      console.error("Cannot toggle timer. matchId is null.");
      return;
    }

    const isNowActive = timerSyncService.toggleTimer();
    setTimerActive(isNowActive);
  }, [matchId]);

  const endMatch = async () => {
    if (!matchId) {
      console.error("Cannot end match. matchId is null.");
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/admin/end-match/${matchId}`, {
        method: 'POST',
      });

      if (response.ok) {
        console.log("Match ended successfully.");
        setMatch(null);
        setMatchId(null);
        setMatchEnded(true); // Mark the match as ended
        setTimerActive(false);
        setTimeLeft(180); // Reset timer
        setMessage("You are now available for matching.");
      } else {
        console.error("Failed to end match:", await response.json());
      }
    } catch (error) {
      console.error("Error ending match:", error);
    }
  };

  // Add connection status indicator
  useEffect(() => {
    const handleConnectionChange = (connected) => {
      if (!connected) {
        setMessage(prevMessage => `${prevMessage} (Disconnected from server, trying to reconnect...)`);
      } else if (message.includes('Disconnected')) {
        // Remove disconnection message if reconnected
        setMessage(message.replace(' (Disconnected from server, trying to reconnect...)', ''));
      }
    };
    
    socketManager.on('connectionChange', handleConnectionChange);
    
    return () => {
      socketManager.removeListener('connectionChange', handleConnectionChange);
    };
  }, [message]);

  // Add socket listener for new available players
  useEffect(() => {
    // Listen for notifications about new available players
    socket.on("new_players_available", () => {
      console.log("New players have become available for matching");
      // Only attempt to find a new match if we don't already have one
      // and we're not showing the rating form
      if (!match && !showRating && !loading) {
        console.log("Attempting to find a match with newly available players");
        retryMatch();
      }
    });
    
    return () => {
      socket.off("new_players_available");
    };
  }, [match, showRating, loading]);

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
      // Use the locally stored playerId instead of trying to access socketToPlayer
      const actualPlayerId = playerId || socket.id;
      
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
        setMessage("Rating submitted! Preparing for the next round...");
        setShowRating(false);
        
        // Complete the current round
        await playerManager.completeRound();

        // Redirect to the next round
        playerManager.redirectToNextRound(navigate);
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

      <div className="timer-display">
        Time Left: {Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? "0" : ""}{timeLeft % 60}
      </div>

      {playerType === "stationary" ? (
        <StationaryParticipant
          match={match}
          timeLeft={timeLeft}
          timerActive={timerActive}
          toggleTimer={toggleTimer}
        />
      ) : (
        <MovingParticipant
          match={match}
          timeLeft={timeLeft}
          timerActive={timerActive}
        />
      )}

      <button
        onClick={endMatch}
        className="btn-danger btn-rounded"
        disabled={!timerActive || matchEnded} // Disable if timer is not active or match is already ended
      >
        End Match
      </button>

      <button
        onClick={retryMatch}
        className="btn-primary btn-rounded"
        disabled={!!match || !matchEnded} // Disable if in a match or match is not ended
      >
        Find New Match
      </button>
    </div>
  );
}

export default Matching;
