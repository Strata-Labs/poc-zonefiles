import React, { useState } from "react";
import { useStacksAuthContext } from "@/contexts/StacksAuthContext";
import {
  safeWalletOperation,
  WalletErrorType,
} from "../../../utils/walletErrorHandler";
import {
  connectEthereumWallet,
  connectSolanaWallet,
} from "../../../utils/wallets";
import { Wallet, AlertCircle, ExternalLink, Loader } from "lucide-react";

type Chain = "BTC" | "ETH" | "SOL";

interface WalletSelectProps {
  chain: Chain;
  onWalletConnected: (address: string) => void;
  onCancel: () => void;
}

export default function WalletSelect({
  chain,
  onWalletConnected,
  onCancel,
}: WalletSelectProps) {
  const { authenticated } = useStacksAuthContext();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get chain-specific details
  const getChainDetails = () => {
    switch (chain) {
      case "BTC":
        return {
          name: "Bitcoin",
          color: "bg-orange-600",
          hoverColor: "hover:bg-orange-700",
          icon: (
            <svg
              className="h-5 w-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.17-1.06-.25l.53-2.127-1.32-.33-.54 2.165c-.285-.065-.565-.13-.84-.2l-1.815-.45-.35 1.407s.975.225.955.238c.535.136.63.495.615.78l-1.477 5.92c-.075.18-.24.45-.625.35.015.02-.96-.24-.96-.24l-.655 1.51 1.715.43.93.236-.54 2.19 1.32.33.54-2.17c.36.1.705.19 1.05.273l-.54 2.143 1.32.33.54-2.18c2.24.427 3.93.255 4.64-1.775.57-1.637-.03-2.582-1.217-3.2.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.185 3.137.53 2.75 2.084v.006z"
                fill="currentColor"
              />
            </svg>
          ),
          walletName: "Leather Wallet",
          walletIcon: "/leather-wallet-icon.png",
          walletURL: "https://leather.io/install-extension",
          description:
            "Bitcoin addresses are verified using your connected Stacks wallet (Leather).",
        };
      case "ETH":
        return {
          name: "Ethereum",
          color: "bg-blue-600",
          hoverColor: "hover:bg-blue-700",
          icon: (
            <svg
              className="h-5 w-5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"
                fill="currentColor"
              />
            </svg>
          ),
          walletName: "",
          walletIcon: "/metamask-icon.png",
          walletURL: "https://metamask.io/download/",
          description:
            "Connect your Ethereum wallet to verify ownership of this Ethereum address.",
        };
      case "SOL":
        return {
          name: "Solana",
          color: "bg-purple-600",
          hoverColor: "hover:bg-purple-700",
          icon: (
            <svg
              className="h-5 w-5 text-white"
              viewBox="0 0 397 311"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7zm0-164.7c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7zm317.2-47.3c-5.8 0-8.7-7-4.6-11.1l62.7-62.7c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H73.8z"
                fill="currentColor"
              />
            </svg>
          ),
          walletName: "",
          walletIcon: "/phantom-icon.png",
          walletURL: "https://phantom.app/download",
          description:
            "Connect your Phantom wallet to verify ownership of this Solana address.",
        };
      default:
        return {
          name: "Unknown",
          color: "bg-gray-600",
          hoverColor: "hover:bg-gray-700",
          icon: <Wallet className="h-5 w-5 text-white" />,
          walletName: "Wallet",
          walletIcon: "",
          walletURL: "",
          description: "Connect your wallet to verify ownership.",
        };
    }
  };

  const chainDetails = getChainDetails();

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      if (chain === "ETH") {
        // Using our new safe wallet operation
        const [result, error] = await safeWalletOperation(() =>
          connectEthereumWallet()
        );

        if (error) {
          // No need to show an error for user rejection
          if (error.type === WalletErrorType.USER_REJECTED) {
            setIsConnecting(false);
            return; // Just stop the operation without an error message
          }
          setError(error.message);
          setIsConnecting(false);
          return;
        }

        if (result) {
          onWalletConnected(result.address);
        }
      } else if (chain === "SOL") {
        // Using our new safe wallet operation
        const [result, error] = await safeWalletOperation(() =>
          connectSolanaWallet()
        );

        if (error) {
          // No need to show an error for user rejection
          if (error.type === WalletErrorType.USER_REJECTED) {
            setIsConnecting(false);
            return; // Just stop the operation without an error message
          }
          setError(error.message);
          setIsConnecting(false);
          return;
        }

        if (result) {
          onWalletConnected(result.address);
        }
      } else {
        // For BTC, we're already using the connected Stacks wallet (Leather)
        setError("Bitcoin addresses use the connected Stacks wallet");
      }
    } catch (error) {
      // This catch is for unexpected errors not handled by safeWalletOperation
      console.error("Unexpected wallet connection error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-zinc-800 border border-zinc-700 rounded-lg">
        <div className="flex items-center space-x-3 mb-3">
          <div
            className={`h-10 w-10 rounded-full ${chainDetails.color} text-white flex items-center justify-center`}
          >
            {chainDetails.icon}
          </div>
          <div>
            <h3 className="font-medium text-white">
              Connect {chainDetails.name} Wallet
            </h3>
            <p className="text-sm text-gray-400">{chainDetails.walletName}</p>
          </div>
        </div>

        <p className="text-sm text-gray-300 mb-4">{chainDetails.description}</p>

        {error && (
          <div className="p-3 mb-4 bg-red-900/20 border border-red-900/30 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <div className="flex space-x-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 border border-zinc-700 rounded-lg text-gray-300 hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConnectWallet}
            disabled={isConnecting}
            className={`px-3 py-2 ${chainDetails.color} text-white rounded-lg ${chainDetails.hoverColor} transition-colors disabled:opacity-70 flex items-center space-x-2 shadow-lg`}
          >
            {isConnecting ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4" />
                <span>Connect {chainDetails.walletName}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="text-center">
        <a
          href={chainDetails.walletURL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-xs text-emerald-400 hover:text-emerald-300"
        >
          <span>Don't have a {chainDetails.walletName}?</span>
          <ExternalLink className="h-3 w-3 ml-1" />
        </a>
      </div>
    </div>
  );
}
