// utils/walletErrorHandler.ts

/**
 * Centralized wallet error handler utility
 * Standardizes different wallet error formats into consistent user-friendly messages
 */

// Common error types for wallet interactions
export enum WalletErrorType {
  USER_REJECTED = "USER_REJECTED",
  WALLET_NOT_FOUND = "WALLET_NOT_FOUND",
  CONNECT_FAILED = "CONNECT_FAILED",
  SIGNATURE_FAILED = "SIGNATURE_FAILED",
  NETWORK_ERROR = "NETWORK_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

// Error response interface
export interface WalletErrorResponse {
  type: WalletErrorType;
  message: string;
  originalError?: Error;
}

/**
 * Detects if an error is a user rejection/cancellation error
 */
export function isUserRejectionError(error: unknown): boolean {
  if (!error) return false;

  let errorMessage = "";

  if (error instanceof Error) {
    errorMessage = error.message.toLowerCase();
  } else if (typeof error === "string") {
    errorMessage = error.toLowerCase();
  } else if (typeof error === "object" && error !== null) {
    // Handle JSON-RPC error objects
    const errorObj = error as any;

    // Check for JSON-RPC error format
    if (errorObj.code === 4001) return true;

    // Check for error message in various locations
    const possibleMessages = [
      errorObj.message,
      errorObj.error?.message,
      errorObj.data?.message,
      errorObj.info?.error?.message,
    ];

    errorMessage = possibleMessages
      .filter(Boolean)
      .map((msg) => String(msg).toLowerCase())
      .join(" ");
  }

  // Common rejection patterns across different wallet implementations
  const rejectionPatterns = [
    "user denied",
    "user rejected",
    "user canceled",
    "user cancelled",
    "user decline",
    "rejected by user",
    "canceled by user",
    "cancelled by user",
    "user refused",
    "declined by user",
    "rejected the request",
    "canceled the request",
    "cancelled the request",
    "denied the request",
    "user did not approve",
    "request was rejected",
    "action_rejected",
    "code 4001",
    "user aborted",
    "signature was denied",
  ];

  return rejectionPatterns.some((pattern) => errorMessage.includes(pattern));
}

/**
 * Process wallet errors into standardized format
 */
export function handleWalletError(error: unknown): WalletErrorResponse {
  console.error("Wallet operation error:", error);

  // Default to unknown error
  const response: WalletErrorResponse = {
    type: WalletErrorType.UNKNOWN_ERROR,
    message: "An unknown error occurred with the wallet operation",
    originalError: error instanceof Error ? error : new Error(String(error)),
  };

  // Handle user rejections
  if (isUserRejectionError(error)) {
    return {
      type: WalletErrorType.USER_REJECTED,
      message: "You cancelled the wallet operation",
      originalError: response.originalError,
    };
  }

  // Extract error message if it's an Error object
  if (error instanceof Error) {
    const errorMsg = error.message.toLowerCase();

    // Handle wallet not found errors
    if (
      errorMsg.includes("not detected") ||
      errorMsg.includes("not installed") ||
      errorMsg.includes("no provider") ||
      errorMsg.includes("not found")
    ) {
      return {
        type: WalletErrorType.WALLET_NOT_FOUND,
        message:
          "Wallet extension not detected. Please install the required wallet extension.",
        originalError: error,
      };
    }

    // Handle connection failures
    if (
      errorMsg.includes("failed to connect") ||
      errorMsg.includes("cannot connect") ||
      errorMsg.includes("connection failed") ||
      errorMsg.includes("connect failed")
    ) {
      return {
        type: WalletErrorType.CONNECT_FAILED,
        message: "Failed to connect to your wallet. Please try again.",
        originalError: error,
      };
    }

    // Handle signature failures
    if (
      errorMsg.includes("signature failed") ||
      errorMsg.includes("failed to sign") ||
      errorMsg.includes("signing failed") ||
      errorMsg.includes("invalid signature")
    ) {
      return {
        type: WalletErrorType.SIGNATURE_FAILED,
        message: "Failed to sign message with your wallet.",
        originalError: error,
      };
    }

    // Handle network errors
    if (
      errorMsg.includes("network error") ||
      errorMsg.includes("timeout") ||
      errorMsg.includes("request failed")
    ) {
      return {
        type: WalletErrorType.NETWORK_ERROR,
        message:
          "Network error while connecting to wallet. Please check your connection.",
        originalError: error,
      };
    }

    // Use the actual error message for other types of errors
    response.message = error.message;
  }

  return response;
}

/**
 * Safely executes a wallet operation with proper error handling
 * Returns [result, error] tuple
 */
export async function safeWalletOperation<T>(
  operation: () => Promise<T>,
  onRejection?: (error: WalletErrorResponse) => void
): Promise<[T | null, WalletErrorResponse | null]> {
  console.log("safeWalletOperation started");
  try {
    console.log("Executing wallet operation");
    const result = await operation();
    console.log("Wallet operation completed successfully");
    return [result, null];
  } catch (error) {
    console.log("Wallet operation error caught in safeWalletOperation", error);
    const handledError = handleWalletError(error);
    console.log("Error handled and categorized:", handledError);

    if (handledError.type === WalletErrorType.USER_REJECTED && onRejection) {
      console.log("Calling onRejection callback for user rejection");
      onRejection(handledError);
    }

    return [null, handledError];
  }
}
