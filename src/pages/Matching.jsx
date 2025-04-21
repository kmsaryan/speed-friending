import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../utils/socket";
import { apiGet, apiPost } from "../utils/apiUtils";
import "../styles/global.css";
import "../styles/Matching.css";
import StationaryParticipant from "../components/StationaryParticipant";
import MovingParticipant from "../components/MovingParticipant";
import RatingForm from "../components/RatingForm";
import LoadingSpinner from "../components/LoadingSpinner";

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
  const [matchId, setMatchId] = useState(null);
  const navigate = useNavigate();
  const [currentPlayerName, setCurrentPlayerName] = useState("You");
  const [notification, setNotification] = useState(null);
  
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

  // Update the player name retrieval effect
  useEffect(() => {
    if (playerId) {
      // First try to get name directly from the registration form data
      const storedName = localStorage.getItem('playerName');
      
      if (storedName && storedName !== "mm" && storedName !== "undefined") {
        console.log("Using stored player name:", storedName);
        setCurrentPlayerName(storedName);
      } else {
        // If no valid name in localStorage, fetch from database
        const fetchPlayerName = async () => {
          try {
            console.log("Fetching player name from API for ID:", playerId);
            const data = await apiGet(`player/${playerId}`);
            
            if (data.name) {
              setCurrentPlayerName(data.name);
              localStorage.setItem('playerName', data.name);
              console.log("Updated player name to:", data.name);
            }
          } catch (error) {
            console.error("Error fetching player name:", error);
          }
        };
        
        fetchPlayerName();
      }
    }
  }, [playerId]);

  useEffect(() => {
    socket.emit("find_match", playerType);
    setLoading(true);

    socket.on("match_found", (matchData) => {
      console.log("Match data received:", matchData);
      setMatch(matchData);
      
      // Fix: store the match ID properly, it could be in matchId or id field
      if (matchData.matchId) {
        setMatchId(matchData.matchId);
      } else if (matchData.id) {
        console.log("Received match player ID but no match ID - using the ID field");
        setMatchId(matchData.id);
      }
      
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
        setNotification({
          type: 'info',
          message: `Round ${gameState.round} has started! Looking for a new match...`,
          timeout: 5000
        });
        setMatch(null);
        setLoading(true);
        socket.emit("find_match", playerType);
      }
    });
    
    // Enhanced listener for game status changes
    socket.on("game_status_change", (gameState) => {
      console.log("Game status changed:", gameState);
      
      // Show notification with the message from server if available
      if (gameState.message) {
        setNotification({
          type: gameState.status === 'stopped' ? 'warning' : 'success',
          message: gameState.message,
          timeout: 5000
        });
      }
      
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
    
    // Listen specifically for round changes
    socket.on("round_changed", (data) => {
      console.log("Round changed:", data);
      setNotification({
        type: 'success',
        message: `Round ${data.round} has started!`,
        timeout: 5000
      });
      
      // If player was in a match, look for new match
      if (match) {
        setMatch(null);
        setLoading(true);
        socket.emit("find_match", playerType);
      }
    });
    
    return () => {
      socket.off("game_status_update");
      socket.off("game_status_change");
      socket.off("round_changed");
    };
  }, [playerType, match]);

  // Effect to automatically hide notifications
  useEffect(() => {
    if (notification && notification.timeout) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, notification.timeout);
      
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Timer effect - Synchronize timer across both players
  useEffect(() => {
    let interval = null;

    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((seconds) => {
          const newValue = seconds - 1;

          // Send sync updates every second to keep moving player in sync
          // Only do this if we have a valid matchId
          if (playerType === 'stationary' && newValue > 0 && matchId) {
            console.log(`Sending timer sync to match room ${matchId}, time: ${newValue}`);
            socket.emit("timer_control", {
              matchId: matchId,
              action: 'sync',
              timeLeft: newValue,
            });
          }

          return newValue;
        });
      }, 1000);
    } else if (timerActive && timeLeft === 0) {
      setTimerActive(false);
      setShowRating(true);

      // Notify the other player that time is up
      if (playerType === 'stationary' && matchId) {
        socket.emit("timer_control", {
          matchId: matchId,
          action: 'timeout',
          timeLeft: 0,
        });
      }
    }

    return () => clearInterval(interval);
  }, [timerActive, timeLeft, playerType, matchId]);

  // Enhanced listener for timer updates from the room
  useEffect(() => {
    socket.on("timer_update", (data) => {
      console.log("Received timer update:", data);

      if (data.action === "start") {
        setTimerActive(true);
        setTimeLeft(data.timeLeft || 180); // Ensure we have a default
        console.log(`Timer started with ${data.timeLeft} seconds`);
      } else if (data.action === "pause") {
        setTimerActive(false);
        console.log("Timer paused");
      } else if (data.action === "timeout") {
        setTimerActive(false);
        setTimeLeft(0);
        setShowRating(true);
        console.log("Timer ended, showing rating form");
      } else if (data.action === "sync") {
        // Explicitly update the timeLeft for moving participants
        if (playerType === 'moving') {
          setTimeLeft(data.timeLeft);
          console.log(`Moving participant timer synced: ${data.timeLeft} seconds`);
        }
      }
    });

    return () => {
      socket.off("timer_update");
    };
  }, [playerType]); // Add playerType as a dependency

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

  // Add listener for team battle notifications
  useEffect(() => {
    // Listen for team battles starting
    socket.on("team_battles_started", (data) => {
      console.log("Team battles have started for round:", data.round);
      
      // If the player is in a team, we need to get their team info
      if (playerId) {
        socket.emit("get_player_team", {
          playerId,
          round: data.round
        });
      }
    });
    
    // Listen for player team info
    socket.on("player_team_info", (data) => {
      if (data.found && data.teamId) {
        console.log("Player is in team:", data.teamId);
        
        // Store team info in localStorage for persistence
        localStorage.setItem('playerTeamId', data.teamId);
        if (data.battleId) {
          localStorage.setItem('playerBattleId', data.battleId);
        }
        
        // Navigate to team battle page
        navigate(`/team-battle/${data.teamId}`);
      } else if (data.error) {
        console.error("Error getting team info:", data.error);
        setMessage("Error checking your team status.");
      } else {
        console.log("Player is not in a team");
        setMessage("You are not in a team for the current round.");
      }
    });
    
    return () => {
      socket.off("team_battles_started");
      socket.off("player_team_info");
    };
  }, [playerId, navigate]);

  // Update toggleTimer function to emit timer events to the room with improved logging
  const toggleTimer = () => {
    const newTimerState = !timerActive;
    setTimerActive(newTimerState);

    if (matchId) {
      console.log(`[LOCAL] Toggling timer for match ${matchId}: ${newTimerState ? "start" : "pause"} with time ${timeLeft}`);
      socket.emit("timer_control", {
        matchId: matchId,
        action: newTimerState ? "start" : "pause",
        timeLeft: timeLeft,
      });
    } else {
      console.warn("Cannot toggle timer: No match ID available");
    }
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
      // Use the locally stored playerId instead of trying to access socketToPlayer
      const actualPlayerId = playerId || socket.id;
      
      console.log("Submitting rating with player ID:", actualPlayerId);
      
      // Use our apiPost utility instead of direct fetch
      await apiPost('rate', {
        playerId: actualPlayerId,
        ratedPlayerId: match.id,
        enjoyment: ratings.enjoyment,
        depth: ratings.depth,
        wouldChatAgain: ratings.wouldChatAgain,
        round: match.round || 1
      });
      
      setMessage("Rating submitted! Looking for your next match...");
      setShowRating(false);
      
      // Emit event to update server about the rating submission
      socket.emit("submit_rating", {
        playerId: actualPlayerId,
        ratedPlayerId: match.id,
        round: match.round || 1
      });
      
      retryMatch();
    } catch (error) {
      console.error("Error submitting rating:", error);
      setMessage("Failed to submit rating. Please try again.");
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
    return <LoadingSpinner message={message} />;
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
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
          <button className="close-btn" onClick={() => setNotification(null)}>×</button>
        </div>
      )}
      
      <h2 className="match-header">You've been matched!</h2>
      
      {/* Only stationary players can control the timer */}
      {playerType === 'stationary' && (
        <div className="timer-controls">
          <button
            onClick={toggleTimer}
            className={timerActive ? "btn-warning btn-rounded" : "btn-success btn-rounded"}
          >
            {timerActive ? "Pause Timer" : "Start Interaction"}
          </button>
        </div>
      )}
      
      <div className="timer-display">
        Time Left: {Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? '0' : ''}{timeLeft % 60}
      </div>

      {playerType === 'stationary' ? (
        <StationaryParticipant 
          match={match} 
          timeLeft={timeLeft} 
          timerActive={timerActive}
          currentPlayerName={currentPlayerName}
          currentPlayerId={playerId}
        />
      ) : (
        <MovingParticipant 
          match={match} 
          timeLeft={timeLeft} 
          timerActive={timerActive}
          currentPlayerName={currentPlayerName}
          currentPlayerId={playerId}
        />
      )}

      <button
        onClick={retryMatch}
        className="btn-primary btn-rounded"
        disabled={timerActive}
      >
        Find New Match
      </button>
    </div>
  );
}

export default Matching;
