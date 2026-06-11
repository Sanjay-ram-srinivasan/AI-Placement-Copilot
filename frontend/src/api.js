import axios from 'axios';

export const API = import.meta.env.VITE_API_URL;

export function endpointUrl(endpoint) {
  if (!API) return endpoint;
  return `${API.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
}

export function logApiError(endpoint, error) {
  console.error(
    'API Error',
    endpoint,
    error.response?.status,
    error.response?.data
  );
}

export function getApiErrorMessage(error) {
  if (!error.response) return 'Backend unavailable. Please start the FastAPI server and try again.';

  const detail = error.response?.data?.detail || error.response?.data?.error;
  if (error.response.status === 404) return 'Route not found. The frontend endpoint does not exist on the backend.';
  if (error.response.status === 422 || error.response.status === 400) return detail || 'Validation error. Please check the submitted fields.';
  if (error.response.status >= 500) return 'Internal server error. Please check the FastAPI logs.';

  return detail || `Request failed with status ${error.response.status}.`;
}

export async function apiGet(endpoint, config) {
  try {
    return await axios.get(endpointUrl(endpoint), config);
  } catch (error) {
    logApiError(endpoint, error);
    throw error;
  }
}

export async function apiPost(endpoint, data, config) {
  try {
    return await axios.post(endpointUrl(endpoint), data, config);
  } catch (error) {
    logApiError(endpoint, error);
    throw error;
  }
}

export async function apiDelete(endpoint, config) {
  try {
    return await axios.delete(endpointUrl(endpoint), config);
  } catch (error) {
    logApiError(endpoint, error);
    throw error;
  }
}
