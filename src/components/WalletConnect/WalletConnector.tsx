// components/WalletConnector.tsx

import { useStacksAuthContext } from "@/contexts/StacksAuthContext";
import React from "react";

export default function WalletConnector() {
  const { authenticated, senderAddresses, authenticate, logout } =
    useStacksAuthContext();

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg">
      {authenticated ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">
              Connected Address (Mainnet)
            </span>
            <span className="font-mono text-sm truncate">
              {senderAddresses.mainnet}
            </span>
          </div>

          <div className="flex flex-col mb-2">
            <span className="text-xs text-gray-400">
              Note: All operations use Mainnet network
            </span>
          </div>

          <button
            onClick={logout}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Disconnect Wallet
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <p className="text-center">
            Connect your Stacks wallet to manage your domains
          </p>
          <p className="text-xs text-gray-500 text-center">
            This application only works with Mainnet Stacks addresses
          </p>
          <button
            onClick={authenticate}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Connect Stacks Wallet
          </button>
        </div>
      )}
    </div>
  );
}
