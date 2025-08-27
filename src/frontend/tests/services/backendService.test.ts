import { describe, it, expect, beforeEach, vi } from "vitest";
import { backendService } from "../../src/services/backendService";

// Mock the backend module
vi.mock("../../../declarations/backend", () => ({
  backend: {
    create_identity: vi.fn(),
    get_identity: vi.fn(),
    get_my_identities: vi.fn(),
    add_credential: vi.fn(),
    link_wallet: vi.fn(),
    update_reputation: vi.fn(),
    get_identity_stats: vi.fn(),
  },
}));

describe("backendService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createIdentity", () => {
    it("should create identity successfully", async () => {
      const mockIdentityId = "gt_id_123456";
      const { backend } = await import("../../../declarations/backend");

      (backend.create_identity as any).mockResolvedValue({
        Ok: mockIdentityId,
      });

      const privacy_settings = {
        default_privacy_level: { Private: null },
        public_credentials: [],
        cross_chain_visibility: [],
      };

      const result = await backendService.createIdentity(
        null,
        [],
        privacy_settings,
      );

      expect(result).toBe(mockIdentityId);
      expect(backend.create_identity).toHaveBeenCalledWith(
        [],
        [],
        privacy_settings,
      );
    });
  });

  describe("getIdentityStats", () => {
    it("should return identity statistics", async () => {
      const { backend } = await import("../../../declarations/backend");
      const mockStats = [100n, 75n]; // total, verified

      (backend.get_identity_stats as any).mockResolvedValue(mockStats);

      const result = await backendService.getIdentityStats();

      expect(result).toEqual({ total: 100n, verified: 75n });
      expect(backend.get_identity_stats).toHaveBeenCalled();
    });
  });
});
