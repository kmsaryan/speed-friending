import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './styles.css';
import App from './App';

const rootElement = document.getElementById('root'); // Ensure this matches the id in index.html
if (!rootElement) {
  console.error("Root element with id 'root' not found in index.html");
} else {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <Router>
        <App />
      </Router>
    </React.StrictMode>
  );
}
