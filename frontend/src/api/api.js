const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export const registerPlayer = async (playerData) => {
    const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playerData),
    });
    return response.json();
};

export const getMatch = async (playerId, round) => {
    const response = await fetch(`${API_BASE_URL}/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, round }),
    });
    return response.json();
};

export const submitRating = async (ratingData) => {
    const response = await fetch(`${API_BASE_URL}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ratingData),
    });
    return response.json();
};

export const getConfig = async () => {
    const response = await fetch(`${API_BASE_URL}/config`);
    return response.json();
};

export const updateConfig = async (configData) => {
    const response = await fetch(`${API_BASE_URL}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData),
    });
    return response.json();
};
