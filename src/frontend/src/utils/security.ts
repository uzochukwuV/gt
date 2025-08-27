// Security utilities for production use

export const rateLimiter = {
  requests: new Map<string, { count: number; timestamp: number }>(),

  check(key: string, limit: number = 100, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = this.requests.get(key);

    if (!record || now - record.timestamp > windowMs) {
      this.requests.set(key, { count: 1, timestamp: now });
      return true;
    }

    if (record.count >= limit) {
      return false;
    }

    record.count++;
    return true;
  },

  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now - record.timestamp > 60000) {
        this.requests.delete(key);
      }
    }
  },
};

export const encryptSensitiveData = (data: string, key?: string): string => {
  // Simple encryption for client-side temporary storage
  // In production, use proper encryption libraries
  const shift = key ? key.length : 5;
  return btoa(
    data
      .split("")
      .map((char) => String.fromCharCode(char.charCodeAt(0) + shift))
      .join(""),
  );
};

export const decryptSensitiveData = (
  encryptedData: string,
  key?: string,
): string => {
  try {
    const shift = key ? key.length : 5;
    return atob(encryptedData)
      .split("")
      .map((char) => String.fromCharCode(char.charCodeAt(0) - shift))
      .join("");
  } catch {
    return "";
  }
};

export const generateSecureId = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
};

export const secureLocalStorage = {
  setItem(key: string, value: any, ttl: number = 3600000): void {
    const item = {
      value: encryptSensitiveData(JSON.stringify(value)),
      expiry: Date.now() + ttl,
    };
    localStorage.setItem(key, JSON.stringify(item));
  },

  getItem(key: string): any {
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return null;

      const item = JSON.parse(itemStr);
      if (Date.now() > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }

      return JSON.parse(decryptSensitiveData(item.value));
    } catch {
      return null;
    }
  },

  removeItem(key: string): void {
    localStorage.removeItem(key);
  },
};

export const validatePrincipal = (principal: string): boolean => {
  try {
    // Basic principal format validation
    return /^[a-z0-9-]{5,63}$/.test(principal) && principal.includes("-");
  } catch {
    return false;
  }
};

export const sanitizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Invalid protocol");
    }
    return parsed.toString();
  } catch {
    return "";
  }
};

// Clean up rate limiter periodically
setInterval(() => rateLimiter.cleanup(), 60000);
