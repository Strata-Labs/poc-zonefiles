import React, { useState } from "react";
import { useStacksAuthContext } from "@/contexts/StacksAuthContext";
import { trpc } from "../../../utils/trpc";
import { verifyAddressOwnership } from "../../../utils/verifyAddressOwnership";
import WalletSelect from "../wallets/WalletSelect";
import { AlertCircle, X, Loader, Trash2, AlertTriangle } from "lucide-react";
import {
  safeWalletOperation,
  WalletErrorType,
} from "../../../utils/walletErrorHandler";

type Chain = "BTC" | "ETH" | "SOL";
type FormState =
  | "confirm"
  | "wallet-select"
  | "signing"
  | "processing"
  | "success"
  | "error";

interface RemoveAddressModalProps {
  addressId: string;
  address: string;
  chain: Chain;
  domainName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function RemoveAddressModal({
  addressId,
  address,
  chain,
  domainName,
  onSuccess,
  onCancel,
}: RemoveAddressModalProps) {
  const { authenticated } = useStacksAuthContext();
  const [formState, setFormState] = useState<FormState>("confirm");
  const [error, setError] = useState<string | null>(null);

  // tRPC mutation for removing an address
  const removeAddressMutation = trpc.domain.removeAddress.useMutation({
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      console.error("Remove mutation error:", error);
      setError(error.message || "Failed to remove address. Please try again.");
      setFormState("error");
    },
  });

  const handleRemove = async () => {
    // For Ethereum and Solana, prompt to connect the respective wallet
    if (chain === "ETH" || chain === "SOL") {
      setFormState("wallet-select");
    } else {
      // For Bitcoin, proceed directly with Stacks wallet
      handleVerifyAddress();
    }
  };

  const handleWalletConnected = (connectedAddress: string) => {
    // Check if the connected address matches the address being removed
    if (connectedAddress.toLowerCase() !== address.toLowerCase()) {
      setError(
        `The connected wallet address (${connectedAddress}) does not match the address you're trying to remove (${address}). Please connect the correct wallet.`
      );
      setFormState("error");
      return;
    }

    // Proceed with verification
    handleVerifyAddress();
  };

  const handleVerifyAddress = async () => {
    setFormState("signing");
    setError(null);

    try {
      // Verify ownership of the address using the appropriate wallet
      const verificationResult = await verifyAddressOwnership(
        address,
        chain,
        domainName,
        "remove"
      );

      // Similar to AddressForm, handle cancellation gracefully
      if (!verificationResult.success) {
        // If the error indicates user cancellation, just go back to confirm state
        if (
          verificationResult.error?.includes("you cancelled") ||
          verificationResult.error?.toLowerCase().includes("cancel") ||
          verificationResult.error?.toLowerCase().includes("reject") ||
          verificationResult.error?.toLowerCase().includes("denied")
        ) {
          setFormState("confirm");
          return;
        }

        // Otherwise, show the error
        setError(
          verificationResult.error || "Failed to verify address ownership"
        );
        setFormState("error");
        return;
      }

      // Proceed with the removal process
      setFormState("processing");

      // Prepare the data for the removal mutation with proper typing
      const removalData = {
        addressId: addressId,
        signature: verificationResult.signature,
        publicKey: verificationResult.publicKey,
        verificationMethod:
          chain === "BTC" ? ("stacks" as const) : ("native" as const),
      };

      // Execute the removal mutation
      await removeAddressMutation.mutateAsync(removalData);

      // Call the parent component's onSuccess callback
      onSuccess();
    } catch (error) {
      console.error("Error during address verification:", error);

      // Don't show error messages for cancellations
      if (
        error instanceof Error &&
        (error.message.toLowerCase().includes("cancel") ||
          error.message.toLowerCase().includes("reject") ||
          error.message.toLowerCase().includes("denied") ||
          error.message.toLowerCase().includes("user cancelled"))
      ) {
        setFormState("confirm");
        return;
      }

      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
      setFormState("error");
    }
  };

  const handleCancel = () => {
    if (formState === "wallet-select" || formState === "error") {
      // Go back to confirm state instead of closing
      setFormState("confirm");
      setError(null);
    } else {
      onCancel();
    }
  };

  // Get chain icon
  const getChainIcon = () => {
    switch (chain) {
      case "BTC":
        return (
          <svg
            className="h-5 w-5 text-orange-500"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.17-1.06-.25l.53-2.127-1.32-.33-.54 2.165c-.285-.065-.565-.13-.84-.2l-1.815-.45-.35 1.407s.975.225.955.238c.535.136.63.495.615.78l-1.477 5.92c-.075.18-.24.45-.625.35.015.02-.96-.24-.96-.24l-.655 1.51 1.715.43.93.236-.54 2.19 1.32.33.54-2.17c.36.1.705.19 1.05.273l-.54 2.143 1.32.33.54-2.18c2.24.427 3.93.255 4.64-1.775.57-1.637-.03-2.582-1.217-3.2.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.185 3.137.53 2.75 2.084v.006z"
              fill="currentColor"
            />
          </svg>
        );
      case "ETH":
        return (
          <svg
            className="h-5 w-5 text-blue-500"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"
              fill="currentColor"
            />
          </svg>
        );
      case "SOL":
        return (
          <svg
            className="h-5 w-5 text-purple-500"
            viewBox="0 0 397 311"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7zm0-164.7c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7zm317.2-47.3c-5.8 0-8.7-7-4.6-11.1l62.7-62.7c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H73.8z"
              fill="currentColor"
            />
          </svg>
        );
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  // Render different UI based on form state
  const renderModalContent = () => {
    switch (formState) {
      case "wallet-select":
        return (
          <div className="bg-zinc-900 rounded-xl p-6 max-w-md w-full shadow-xl border border-zinc-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                Connect Your Wallet
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-300 p-1 rounded-full hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <WalletSelect
              chain={chain}
              onWalletConnected={handleWalletConnected}
              onCancel={handleCancel}
            />
          </div>
        );

      case "signing":
        return (
          <div className="bg-zinc-900 rounded-xl p-6 max-w-md w-full shadow-xl border border-zinc-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white">
                Signing Request
              </h3>
              <button
                className="text-gray-500 hover:text-gray-300 p-1 rounded-full hover:bg-zinc-800 opacity-50 cursor-not-allowed"
                disabled
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center mb-4">
              <div className="h-10 w-10 rounded-full bg-blue-900/40 flex-shrink-0 flex items-center justify-center mr-4">
                <Loader className="h-5 w-5 text-blue-400 animate-spin" />
              </div>
              <div>
                <p className="font-medium text-white">Waiting for signature</p>
                <p className="text-sm text-gray-400">
                  Please check your wallet and approve the request
                </p>
              </div>
            </div>

            <div className="p-3 bg-blue-900/20 border border-blue-900/30 rounded-lg text-sm text-blue-300">
              If you don't see a wallet popup, check if it was blocked by your
              browser
            </div>
          </div>
        );

      case "processing":
        return (
          <div className="bg-zinc-900 rounded-xl p-6 max-w-md w-full shadow-xl border border-zinc-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white">Processing</h3>
              <button
                className="text-gray-500 hover:text-gray-300 p-1 rounded-full hover:bg-zinc-800 opacity-50 cursor-not-allowed"
                disabled
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-blue-900/40 flex-shrink-0 flex items-center justify-center mr-4">
                <Loader className="h-5 w-5 text-blue-400 animate-spin" />
              </div>
              <div>
                <p className="font-medium text-white">Removing address</p>
                <p className="text-sm text-gray-400">
                  This will only take a moment...
                </p>
              </div>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="bg-zinc-900 rounded-xl p-6 max-w-md w-full shadow-xl border border-zinc-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white">Error</h3>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-300 p-1 rounded-full hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-start mb-6">
              <div className="h-10 w-10 rounded-full bg-red-900/40 flex-shrink-0 flex items-center justify-center mr-4">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="font-medium text-white mb-1">Operation failed</p>
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setFormState("confirm")}
                className="px-4 py-2 text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 text-white border border-zinc-700 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        );

      default: // 'confirm'
        return (
          <div className="bg-zinc-900 rounded-xl p-6 max-w-md w-full shadow-xl border border-zinc-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white">
                Confirm Address Removal
              </h3>
              <button
                onClick={onCancel}
                className="text-gray-500 hover:text-gray-300 p-1 rounded-full hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <p className="font-medium text-white">Are you sure?</p>
              </div>
              <p className="text-gray-300 mb-4">
                This will remove the following address from your domain{" "}
                <span className="font-medium text-emerald-400">
                  {domainName}
                </span>
                :
              </p>

              <div className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg mb-2">
                <div className="flex items-center mb-1">
                  {getChainIcon()}
                  <span className="text-sm font-medium ml-2 text-white">
                    {chain}
                  </span>
                </div>
                <div className="font-mono text-sm break-all text-gray-300">
                  {address}
                </div>
              </div>

              <p className="text-sm text-gray-400">
                You'll need to verify ownership of this address to complete the
                removal.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-white border border-zinc-700 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center shadow-lg shadow-red-900/30"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                <span>Remove Address</span>
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fadeIn backdrop-blur-sm">
      {renderModalContent()}
    </div>
  );
}
