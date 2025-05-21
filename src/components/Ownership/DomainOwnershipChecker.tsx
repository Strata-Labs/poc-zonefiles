// components/DomainOwnershipChecker.tsx

import { useState } from "react";
import { useStacksAuthContext } from "@/contexts/StacksAuthContext";
import { CheckCircle, AlertCircle, Loader } from "lucide-react";

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
        className="text-sm px-3 py-2 bg-zinc-800 text-white border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors disabled:bg-zinc-900 disabled:text-gray-500 disabled:border-zinc-800 flex items-center"
      >
        {status.status === "checking" ? (
          <>
            <Loader className="h-3.5 w-3.5 mr-2 animate-spin" />
            Checking...
          </>
        ) : (
          "Check Domain Ownership"
        )}
      </button>

      {status.status !== "idle" && (
        <div
          className={`mt-3 p-4 rounded-lg text-sm ${
            status.status === "checking"
              ? "bg-blue-900/20 border border-blue-900/30 text-blue-300"
              : status.status === "verified"
              ? "bg-emerald-900/20 border border-emerald-900/30 text-emerald-300"
              : "bg-red-900/20 border border-red-900/30 text-red-300"
          }`}
        >
          {status.status === "checking" && (
            <div className="flex items-center">
              <Loader className="animate-spin h-4 w-4 mr-3 text-blue-400" />
              {status.message}
            </div>
          )}
          {status.status === "verified" && (
            <div className="flex items-start">
              <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p>{status.message}</p>
              </div>
            </div>
          )}
          {status.status === "error" && (
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p>{status.message}</p>
                {status.details?.ownerAddress &&
                  status.details.ownerAddress !== senderAddresses.mainnet && (
                    <p className="mt-1">
                      Current owner:{" "}
                      <span className="font-mono text-xs text-gray-400">
                        {status.details.ownerAddress}
                      </span>
                    </p>
                  )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
