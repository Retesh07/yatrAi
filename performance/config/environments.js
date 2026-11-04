/**
 * Environment configuration for k6 tests
 */
export const getBaseUrl = () => {
  // Default to local server or Docker container host
  return __ENV.BASE_URL || 'http://localhost:5000';
};

export const getGraphQLUrl = () => {
  return `${getBaseUrl()}/graphql`;
};

export const getApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${getBaseUrl()}/api/v1${cleanEndpoint}`;
};

