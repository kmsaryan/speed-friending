import React from 'react';

const EnvDebug = () => {
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 0, 
      right: 0, 
      backgroundColor: 'rgba(0,0,0,0.7)',
      color: '#66fcf1', 
      padding: '5px 10px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <div>NODE_ENV: {process.env.NODE_ENV || 'not set'}</div>
      <div>API URL: {process.env.REACT_APP_BACKEND_URL || 'not set'}</div>
      <div>Host: {window.location.hostname}</div>
    </div>
  );
};

export default EnvDebug;
