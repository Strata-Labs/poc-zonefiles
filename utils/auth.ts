// utils/auth.ts

import { authenticatedAtom, senderAddressesAtom } from "@/atoms";
import { AppConfig, UserSession, showConnect } from "@stacks/connect";
import { useAtom } from "jotai";
import { request } from "@stacks/connect";

const appConfig = new AppConfig(["store_write", "publish_data"]);

export const userSession = new UserSession({ appConfig });

export const isUserSignedIn = () => {
  return userSession.isUserSignedIn();
};

export const getUserData = () => {
  return userSession.loadUserData();
};

export function authenticateWithStacks(onFinish?: () => void) {
  showConnect({
    appDetails: {
      name: "Cross-Chain Domain System",
      icon: window.location.origin + "/favicon.ico",
    },
    redirectTo: "/",
    onFinish: () => {
      if (onFinish) onFinish();
    },
    userSession,
  });
}

export async function signMessage(message: string) {
  try {
    console.log("Requesting signature for message:", message);

    const response = await request("stx_signMessage", {
      message,
    });

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
  } catch (error) {
    console.error("Error signing message:", error);

    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      if (
        errorMessage.includes("user rejected") ||
        errorMessage.includes("user denied") ||
        errorMessage.includes("cancel") ||
        errorMessage.includes("reject") ||
        errorMessage.includes("denied") ||
        errorMessage.includes("closed") ||
        errorMessage.includes("user aborted") ||
        errorMessage.includes("signature was denied")
      ) {
        throw new Error("USER_REJECTED_SIGNATURE");
      } else if (errorMessage.includes("timeout")) {
        throw new Error("Wallet connection timed out. Please try again.");
      }
    }

    throw error;
  }
}

export function signOut(callback?: () => void) {
  userSession.signUserOut("/");
  if (callback) callback();
}

export function useStacksAuth() {
  const [authenticated, setAuthenticated] = useAtom(authenticatedAtom);
  const [senderAddresses, setSenderAddresses] = useAtom(senderAddressesAtom);

  const authenticate = () => {
    authenticateWithStacks(() => {
      if (userSession.isUserSignedIn()) {
        const userData = userSession.loadUserData();
        setAuthenticated(true);
        setSenderAddresses({
          testnet: userData.profile.stxAddress.testnet,
          mainnet: userData.profile.stxAddress.mainnet,
        });
      }
    });
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
  };
}
