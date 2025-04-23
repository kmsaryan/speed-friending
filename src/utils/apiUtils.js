/**
 * Comprehensive utilities for API requests with proper URL handling
 */

// Helper function to determine the base API URL
export const getApiBaseUrl = () => {
  // Check if running in production
  if (process.env.NODE_ENV === 'production') {
    // Use relative URL for production (assumes API is served from the same domain)
    return '/api';
  }

  // Check if running on Render deployment
  if (window.location.hostname.includes('onrender.com')) {
    // Use the Render deployment hostname
    return `${window.location.origin}/api`;
  }

  // Default to development environment
  return process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000/api';
};

// Export this function explicitly to fix the build error
export const getApiUrl = (endpoint) => {
  const baseUrl = getApiBaseUrl();
  // Make sure we don't have double slashes when joining paths
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
};

/**
 * Make a GET request with proper URL handling
 * @param {string} endpoint - API endpoint (without leading slash or 'api/' prefix)
 * @returns {Promise<any>} Response data
 */
export const apiGet = async (endpoint) => {
  const url = getApiUrl(endpoint);
  console.log(`[API] Making GET request to: ${url}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

/**
 * Make a POST request with proper URL handling
 * @param {string} endpoint - API endpoint (without leading slash or 'api/' prefix)
 * @param {Object} body - Request body data
 * @returns {Promise<any>} Response data
 */
export const apiPost = async (endpoint, body) => {
  const url = getApiUrl(endpoint.replace(/^\/+/, ''));
  
  console.log(`[API] Making POST request to: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Failed with status: ${response.status}` }));
      throw new Error(errorData.error || `Request failed with status: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error(`API error (${endpoint}):`, error);
    throw error;
  }
};

/**
 * Make a PUT request with proper URL handling
 * @param {string} endpoint - API endpoint (without leading slash or 'api/' prefix)
 * @param {Object} data - Request body data
 * @param {Object} options - Additional fetch options
 * @returns {Promise<any>} Response data
 */
export const apiPut = async (endpoint, data, options = {}) => {
  const url = getApiUrl(endpoint);
  console.log(`[API] PUT request to: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      body: JSON.stringify(data),
      ...options
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Failed with status: ${response.status}` }));
      throw new Error(errorData.error || `Request failed with status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API error (PUT ${endpoint}):`, error);
    throw error;
  }
};

/**
 * Make a DELETE request with proper URL handling
 * @param {string} endpoint - API endpoint (without leading slash or 'api/' prefix)
 * @param {Object} options - Additional fetch options
 * @returns {Promise<any>} Response data
 */
export const apiDelete = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  console.log(`[API] DELETE request to: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Failed with status: ${response.status}` }));
      throw new Error(errorData.error || `Request failed with status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API error (DELETE ${endpoint}):`, error);
    throw error;
  }
};
