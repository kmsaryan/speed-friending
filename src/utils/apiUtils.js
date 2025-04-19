/**
 * Utility to get the appropriate API URL based on environment
 * @param {string} endpoint - API endpoint (without leading slash)
 * @returns {string} Complete API URL
 */
export const getApiUrl = (endpoint) => {
  // In production, use relative URLs
  if (process.env.NODE_ENV === 'production') {
    return `/api/${endpoint}`;
  }
  
  // In development, use the configured backend URL
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
  return `${backendUrl}/api/${endpoint}`;
};

/**
 * Make an API request with proper URL handling
 * @param {string} endpoint - API endpoint (without leading slash)
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} Response data
 */
export const apiRequest = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API error (${endpoint}):`, error);
    throw error;
  }
};
