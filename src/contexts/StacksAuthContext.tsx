// contexts/StacksAuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from "react";
import { userSession, useStacksAuth } from "../../utils/auth";

// Update the interface to include isAuthenticating
interface StacksAuthContextType {
  authenticated: boolean;
  senderAddresses: {
    testnet: string;
    mainnet: string;
  };
  authenticate: () => void;
  logout: () => void;
  isAuthenticating: boolean; // Added this property
  authError: string | null; // Optional: Added for error handling
}

const StacksAuthContext = createContext<StacksAuthContextType | undefined>(
  undefined
);

export function StacksAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const authState = useStacksAuth();

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      authState.authenticate();
    }
  }, []);

  return (
    <StacksAuthContext.Provider value={authState}>
      {children}
    </StacksAuthContext.Provider>
  );
}

export function useStacksAuthContext() {
  const context = useContext(StacksAuthContext);
  if (context === undefined) {
    throw new Error(
      "useStacksAuthContext must be used within a StacksAuthProvider"
    );
  }
  return context;
}
