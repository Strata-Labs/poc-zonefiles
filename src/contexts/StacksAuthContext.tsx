// contexts/StacksAuthContext.tsx

import React, { createContext, useContext, useEffect } from "react";
import { userSession, useStacksAuth } from "../../utils/auth";

interface StacksAuthContextType {
  authenticated: boolean;
  senderAddresses: {
    testnet: string;
    mainnet: string;
  };
  authenticate: () => void;
  logout: () => void;
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
