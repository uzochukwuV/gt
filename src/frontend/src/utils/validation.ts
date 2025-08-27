// Input validation utilities for production security

export const validateAssetData = (data: {
  type: string;
  description: string;
  value: string;
  location: string;
}) => {
  const errors: string[] = [];

  if (!data.type || data.type.trim().length === 0) {
    errors.push("Asset type is required");
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.push("Description must be at least 10 characters");
  }

  if (data.description && data.description.length > 500) {
    errors.push("Description must be less than 500 characters");
  }

  if (
    !data.value ||
    isNaN(parseFloat(data.value)) ||
    parseFloat(data.value) <= 0
  ) {
    errors.push("Valid asset value is required");
  }

  if (!data.location || data.location.trim().length === 0) {
    errors.push("Asset location is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateLoanOffer = (data: {
  maxLoanAmountUsd: string;
  interestRate: string;
  maxLtvRatio: string;
  maxDurationDays: string;
}) => {
  const errors: string[] = [];

  const amount = parseFloat(data.maxLoanAmountUsd);
  if (!data.maxLoanAmountUsd || isNaN(amount) || amount <= 0) {
    errors.push("Valid loan amount is required");
  }

  if (amount > 10000000) {
    errors.push("Loan amount cannot exceed $10,000,000");
  }

  const rate = parseFloat(data.interestRate);
  if (!data.interestRate || isNaN(rate) || rate < 0 || rate > 100) {
    errors.push("Interest rate must be between 0-100%");
  }

  const ltv = parseFloat(data.maxLtvRatio);
  if (!data.maxLtvRatio || isNaN(ltv) || ltv <= 0 || ltv > 0.8) {
    errors.push("LTV ratio must be between 0-80%");
  }

  const duration = parseInt(data.maxDurationDays);
  if (
    !data.maxDurationDays ||
    isNaN(duration) ||
    duration <= 0 ||
    duration > 3650
  ) {
    errors.push("Duration must be between 1-3650 days");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateMarketplaceListing = (data: {
  price: number;
  paymentMethod: string;
}) => {
  const errors: string[] = [];

  if (!data.price || data.price <= 0) {
    errors.push("Valid price is required");
  }

  if (data.price > 100000000) {
    errors.push("Price cannot exceed $100,000,000");
  }

  if (!data.paymentMethod || data.paymentMethod.trim().length === 0) {
    errors.push("Payment method is required");
  }

  const validPaymentMethods = ["ICP", "Bitcoin", "Ethereum", "USDC", "USDT"];
  if (!validPaymentMethods.includes(data.paymentMethod)) {
    errors.push("Invalid payment method");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
    .replace(/javascript:/gi, "") // Remove javascript: protocols
    .replace(/on\w+="[^"]*"/gi, "") // Remove event handlers
    .substring(0, 1000); // Limit length
};

export const validateFileUpload = (file: File) => {
  const errors: string[] = [];
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "text/plain",
  ];

  if (file.size > maxSize) {
    errors.push("File size cannot exceed 10MB");
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push(
      "Invalid file type. Only JPEG, PNG, WebP, PDF, and text files are allowed",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
