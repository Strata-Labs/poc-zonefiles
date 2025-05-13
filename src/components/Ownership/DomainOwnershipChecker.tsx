// components/DomainOwnershipChecker.tsx

import { useState } from "react";
import { useStacksAuthContext } from "@/contexts/StacksAuthContext";

type OwnershipStatus = {
  status: "idle" | "checking" | "verified" | "error";
  message: string;
  details?: {
    isOwner: boolean;
    domainName: string;
    ownerAddress?: string;
  };
};

interface DomainOwnershipCheckerProps {
  domainName: string;
  onVerificationComplete?: (isVerified: boolean) => void;
}

export default function DomainOwnershipChecker({
  domainName,
  onVerificationComplete,
}: DomainOwnershipCheckerProps) {
  const { authenticated, senderAddresses } = useStacksAuthContext();
  const [status, setStatus] = useState<OwnershipStatus>({
    status: "idle",
    message: "",
  });

  const checkOwnership = async () => {
    if (!authenticated) {
      setStatus({
        status: "error",
        message: "Please connect your wallet first",
      });
      return;
    }

    if (!domainName) {
      setStatus({
        status: "error",
        message: "Please enter a domain name",
      });
      return;
    }

    // Format the domain name
    const formattedDomainName = domainName.toLowerCase();

    // Set to checking state
    setStatus({
      status: "checking",
      message: `Checking ownership of ${formattedDomainName}...`,
    });

    try {
      // Call the check-ownership API
      const response = await fetch("/api/check-ownership", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domainName: formattedDomainName,
          stacksAddress: senderAddresses.mainnet,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.isOwner) {
          setStatus({
            status: "verified",
            message: data.message,
            details: {
              isOwner: true,
              domainName: data.domainName,
              ownerAddress: data.ownerAddress,
            },
          });
          if (onVerificationComplete) onVerificationComplete(true);
        } else {
          setStatus({
            status: "error",
            message: data.message,
            details: {
              isOwner: false,
              domainName: data.domainName,
              ownerAddress: data.ownerAddress,
            },
          });
          if (onVerificationComplete) onVerificationComplete(false);
        }
      } else {
        setStatus({
          status: "error",
          message: data.error || "Failed to check ownership",
        });
        if (onVerificationComplete) onVerificationComplete(false);
      }
    } catch (error) {
      console.error("Error checking domain ownership:", error);
      setStatus({
        status: "error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
      if (onVerificationComplete) onVerificationComplete(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={checkOwnership}
        disabled={status.status === "checking" || !authenticated || !domainName}
        className="text-sm px-3 py-1 bg-gray-100 border rounded hover:bg-gray-200 transition-colors disabled:bg-gray-50 disabled:text-gray-400"
      >
        Check Domain Ownership
      </button>

      {status.status !== "idle" && (
        <div
          className={`mt-2 p-3 rounded text-sm ${
            status.status === "checking"
              ? "bg-blue-50 border border-blue-200 text-blue-600"
              : status.status === "verified"
              ? "bg-green-50 border border-green-200 text-green-600"
              : "bg-red-50 border border-red-200 text-red-600"
          }`}
        >
          {status.status === "checking" && (
            <div className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {status.message}
            </div>
          )}
          {status.status !== "checking" && (
            <>
              <p>{status.message}</p>
              {status.details?.ownerAddress &&
                status.details.ownerAddress !== senderAddresses.mainnet && (
                  <p className="mt-1">
                    Current owner:{" "}
                    <span className="font-mono text-xs">
                      {status.details.ownerAddress}
                    </span>
                  </p>
                )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
