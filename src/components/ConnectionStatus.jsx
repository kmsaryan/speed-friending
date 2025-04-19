import React, { useState, useEffect } from 'react';
import { socketManager } from '../utils/socket';
import '../styles/ConnectionStatus.css';

const ConnectionStatus = () => {
  const [connected, setConnected] = useState(socketManager.isConnected());
  const [expanded, setExpanded] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [lastPing, setLastPing] = useState(null);
  const [matchId, setMatchId] = useState(null);

  useEffect(() => {
    const handleConnectionChange = (isConnected) => {
      setConnected(isConnected);
      if (isConnected) {
        setReconnecting(false);
      }
    };
    
    const handleReconnectAttempt = () => {
      setReconnecting(true);
    };
    
    // Check connection status immediately
    setConnected(socketManager.isConnected());
    
    // Listen for heartbeat acknowledgements to measure latency
    const socket = socketManager.getSocket();
    if (socket) {
      socket.on('heartbeat_ack', (data) => {
        const rtt = Date.now() - data.serverTime;
        setLastPing(rtt);
      });
      
      // Monitor match ID changes
      const timerState = socketManager.lastMatchId;
      if (timerState) {
        setMatchId(timerState);
      }
    }
    
    socketManager.on('connectionChange', handleConnectionChange);
    socketManager.on('reconnect_attempt', handleReconnectAttempt);
    
    return () => {
      socketManager.removeListener('connectionChange', handleConnectionChange);
      socketManager.removeListener('reconnect_attempt', handleReconnectAttempt);
      if (socket) {
        socket.off('heartbeat_ack');
      }
    };
  }, []);

  const handleReconnect = () => {
    const socket = socketManager.getSocket();
    if (socket) {
      socket.connect();
      setReconnecting(true);
    }
  };

  return (
    <div className={`connection-status ${expanded ? 'expanded' : 'collapsed'} ${connected ? 'connected' : 'disconnected'}`}>
      <div className="status-header" onClick={() => setExpanded(!expanded)}>
        <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`}></span>
        <span className="status-text">
          {reconnecting ? 'Reconnecting...' : (connected ? 'Connected' : 'Disconnected')}
        </span>
        <span className="expand-icon">{expanded ? '▼' : '▲'}</span>
      </div>
      
      {expanded && (
        <div className="status-details">
          {lastPing !== null && <p>Ping: {lastPing}ms</p>}
          {matchId && <p>Match: {matchId}</p>}
          {!connected && !reconnecting && (
            <button className="reconnect-button" onClick={handleReconnect}>
              Reconnect
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
