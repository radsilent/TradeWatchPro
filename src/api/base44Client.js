import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "68a3798b664b8f811bac97bc", 
  requiresAuth: true // Ensure authentication is required for all operations
});
