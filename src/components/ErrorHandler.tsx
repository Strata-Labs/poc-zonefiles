// components/ErrorHandler.tsx
import React, { useEffect } from "react";

const ErrorHandler: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    // Handle errors at the window level
    const originalOnError = window.onerror;
    const handleError = (
      event: string | Event,
      source?: string,
      lineno?: number,
      colno?: number,
      error?: Error
    ) => {
      // Check for the specific JsonRpcError we want to suppress
      if (
        error &&
        ((error.name === "JsonRpcError" &&
          error.message === "User canceled the request") ||
          (error.toString().includes("JsonRpcError") &&
            error.toString().includes("User canceled the request")))
      ) {
        console.log("ErrorHandler: Suppressed JsonRpcError");
        return true; // Prevents the error from propagating
      }

      // Otherwise use the original handler
      if (originalOnError) {
        return originalOnError.apply(window, [
          event,
          source,
          lineno,
          colno,
          error,
        ]);
      }
      return false;
    };

    window.onerror = handleError as OnErrorEventHandler;

    // Handle unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason &&
        ((event.reason.name === "JsonRpcError" &&
          event.reason.message === "User canceled the request") ||
          (event.reason.toString().includes("JsonRpcError") &&
            event.reason.toString().includes("User canceled the request")))
      ) {
        console.log(
          "ErrorHandler: Prevented unhandled rejection for JsonRpcError"
        );
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.onerror = originalOnError;
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return <>{children}</>;
};

export default ErrorHandler;
