/**
 * Comprehensive utilities for API requests with proper URL handling
 */

// Helper function to determine the base API URL
export const getApiBaseUrl = () => {
  // Check both explicit NODE_ENV and hostname to ensure correct behavior in production
  if (process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost') {
    // Use relative URL in production
    return '/api';
  }
  
  // Use the environment variable in development, fallback to localhost:5000
  return `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api`;
};

// Export this function explicitly to fix the build error
export const getApiUrl = (endpoint) => {
  return `${getApiBaseUrl()}/${endpoint}`;
};

/**
 * Make a GET request with proper URL handling
 * @param {string} endpoint - API endpoint (without leading slash or 'api/' prefix)
 * @param {Object} options - Additional fetch options
 * @returns {Promise<any>} Response data
 */
export const apiGet = async (endpoint, options = {}) => {
  const url = `${getApiBaseUrl()}/${endpoint}`;
  console.log(`[API] GET request to: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Failed with status: ${response.status}` }));
      throw new Error(errorData.error || `Request failed with status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API error (GET ${endpoint}):`, error);
    throw error;
  }
};

/**
 * Make a POST request with proper URL handling
 * @param {string} endpoint - API endpoint (without leading slash or 'api/' prefix)
 * @param {Object} data - Request body data
 * @param {Object} options - Additional fetch options
 * @returns {Promise<any>} Response data
 */
export const apiPost = async (endpoint, data, options = {}) => {
  const url = `${getApiBaseUrl()}/${endpoint}`;
  console.log(`[API] POST request to: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
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
    console.error(`API error (POST ${endpoint}):`, error);
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
  const url = `${getApiBaseUrl()}/${endpoint}`;
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
  const url = `${getApiBaseUrl()}/${endpoint}`;
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
