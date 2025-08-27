// Centralized API handling with error management

import { rateLimiter, secureLocalStorage } from "./security";

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const apiCall = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  retries: number = 3,
): Promise<T> => {
  const userId = secureLocalStorage.getItem("userId") || "anonymous";

  // Rate limiting
  if (!rateLimiter.check(`${userId}:${operationName}`, 50, 60000)) {
    throw new ApiError("Rate limit exceeded. Please try again later.");
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), 30000),
        ),
      ]);

      return result;
    } catch (error) {
      lastError = error as Error;
      console.error(
        `API call ${operationName} failed (attempt ${attempt}):`,
        error,
      );

      // Don't retry on certain errors
      if (error instanceof ApiError || attempt === retries) {
        break;
      }

      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000),
      );
    }
  }

  throw lastError || new Error(`Failed to execute ${operationName}`);
};

export const handleApiError = (error: any, context: string = ""): string => {
  console.error(`API Error in ${context}:`, error);

  if (error instanceof ApiError) {
    return error.message;
  }

  if (error?.message) {
    // Handle common canister errors
    if (error.message.includes("Unauthorized")) {
      return "You are not authorized to perform this action. Please log in again.";
    }

    if (error.message.includes("InsufficientCycles")) {
      return "Service temporarily unavailable due to high demand. Please try again later.";
    }

    if (error.message.includes("CanisterError")) {
      return "Service error occurred. Please try again or contact support.";
    }

    if (
      error.message.includes("timeout") ||
      error.message.includes("Request timeout")
    ) {
      return "Request timed out. Please check your connection and try again.";
    }

    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
};

export const withLoading = async <T>(
  operation: () => Promise<T>,
  setLoading: (loading: boolean) => void,
): Promise<T> => {
  setLoading(true);
  try {
    return await operation();
  } finally {
    setLoading(false);
  }
};

export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (i === maxRetries) {
        break;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, delay * Math.pow(2, i)),
      );
    }
  }

  throw lastError!;
};
