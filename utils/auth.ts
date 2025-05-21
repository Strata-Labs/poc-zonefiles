// utils/auth.ts

import { authenticatedAtom, senderAddressesAtom } from "@/atoms";
import { AppConfig, UserSession, showConnect } from "@stacks/connect";
import { useAtom } from "jotai";
import { request } from "@stacks/connect";
import { safeWalletOperation } from "./walletErrorHandler";
import { useState } from "react";

const appConfig = new AppConfig(["store_write", "publish_data"]);

export const userSession = new UserSession({ appConfig });

export const isUserSignedIn = () => {
  return userSession.isUserSignedIn();
};

export const getUserData = () => {
  return userSession.loadUserData();
};

export function authenticateWithStacks(
  onFinish?: () => void,
  onCancel?: () => void
) {
  try {
    // Create a promise to handle the connect flow
    const connectPromise = new Promise((resolve, reject) => {
      try {
        showConnect({
          appDetails: {
            name: "Cross-Chain Domain System",
            icon: window.location.origin + "/favicon.ico",
          },
          redirectTo: "/",
          onFinish: () => {
            if (onFinish) onFinish();
            resolve(true);
          },
          onCancel: () => {
            // Handle user cancellation
            if (onCancel) onCancel();
            resolve(false); // Resolve with false, not reject
          },
          userSession,
        });
      } catch (error) {
        console.error("Initial Connect error:", error);
        if (onCancel) onCancel();
        resolve(false); // Resolve with false rather than rejecting
      }
    });

    // Handle the connect promise
    connectPromise.catch((error) => {
      console.log("Connect promise error (should never happen):", error);
      if (onCancel) onCancel();
    });

    return connectPromise;
  } catch (outerError) {
    console.error("Outer authentication error:", outerError);
    if (onCancel) onCancel();
    return Promise.resolve(false);
  }
}

export async function signMessage(message: string) {
  console.log("Requesting signature for message:", message);

  const [response, error] = await safeWalletOperation(async () => {
    return await request("stx_signMessage", {
      message,
    });
  });

  if (error) {
    throw error; // This will be caught by safeWalletOperation in verifyAddressOwnership
  }

  console.log("Signature response received:", {
    signatureLength: response?.signature?.length,
    publicKey: response?.publicKey,
  });

  if (!response || !response.signature || !response.publicKey) {
    throw new Error(
      "Incomplete signature response. Missing signature or public key."
    );
  }

  return response;
}

export function signOut(callback?: () => void) {
  userSession.signUserOut("/");
  if (callback) callback();
}

export function useStacksAuth() {
  const [authenticated, setAuthenticated] = useAtom(authenticatedAtom);
  const [senderAddresses, setSenderAddresses] = useAtom(senderAddressesAtom);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const authenticate = async () => {
    console.log("authenticate function called in useStacksAuth");
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      await authenticateWithStacks(
        // OnFinish
        () => {
          console.log("Authentication finished - processing successful result");
          if (userSession.isUserSignedIn()) {
            console.log("User is signed in, loading user data");
            const userData = userSession.loadUserData();
            setAuthenticated(true);
            setSenderAddresses({
              testnet: userData.profile.stxAddress.testnet,
              mainnet: userData.profile.stxAddress.mainnet,
            });
            console.log("User state updated with authentication data");
          } else {
            console.log(
              "userSession.isUserSignedIn() returned false after success callback"
            );
          }
          setIsAuthenticating(false);
        },
        // OnCancel or Error
        () => {
          console.log("Authentication cancelled - handling cancel/error case");
          setIsAuthenticating(false);
          // No need to show an error message for user rejection
          console.log(
            "IsAuthenticating set to false, no error message set for cancellation"
          );
        }
      );

      console.log("Authentication process completed");
    } catch (error) {
      // This should never be reached due to our error handling above
      console.error("Unexpected error in authenticate function:", error);
      setIsAuthenticating(false);
    }
  };

  const logout = () => {
    signOut(() => {
      setAuthenticated(false);
      setSenderAddresses({ testnet: "", mainnet: "" });
    });
  };

  return {
    authenticated,
    senderAddresses,
    authenticate,
    logout,
    isAuthenticating,
    authError,
  };
}
