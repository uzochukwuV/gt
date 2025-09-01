export const backendService = {
  createIdentity: async (_data: any, _credentials: any[], _privacySettings: any) => {
    // Mock implementation for testing
    return 'gt_id_123456';
  },

  getIdentityStats: async () => {
    // Mock implementation for testing
    return { total: 100n, verified: 75n };
  }
};