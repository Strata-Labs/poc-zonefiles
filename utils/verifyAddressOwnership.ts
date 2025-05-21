import { signMessage } from "./auth";
import {
  signEthereumMessage,
  signSolanaMessage,
  verifyEthereumSignature,
  verifySolanaSignature,
} from "./wallets";
import { safeWalletOperation, WalletErrorType } from "./walletErrorHandler";

type Chain = "BTC" | "ETH" | "SOL";
type Operation = "add" | "remove";

export interface VerificationResult {
  success: boolean;
  signature: string;
  publicKey: string;
  error?: string;
}

export async function verifyAddressOwnership(
  address: string,
  chain: Chain,
  domainName: string,
  operation: Operation = "add"
): Promise<VerificationResult> {
  try {
    // Create message to be signed - using different formats based on chain and operation
    let message = "";

    if (chain === "BTC") {
      message = `I authorize ${
        operation === "add" ? "adding" : "removing"
      } ${chain} address ${address} ${
        operation === "add" ? "to" : "from"
      } domain ${domainName}`;
    } else {
      message = `I am the owner of this ${chain} address: ${address} and I authorize its ${
        operation === "add" ? "addition to" : "removal from"
      } domain ${domainName}`;
    }

    switch (chain) {
      case "BTC":
        // Using our new safe wallet operation for BTC
        const [stacksResult, stacksError] = await safeWalletOperation(() =>
          signMessage(message)
        );

        // Handle user rejection or other errors
        if (stacksError) {
          // Check if this is a user rejection
          if (stacksError.type === WalletErrorType.USER_REJECTED) {
            return {
              success: false,
              signature: "",
              publicKey: "",
              error: "You cancelled the transaction",
            };
          }

          return {
            success: false,
            signature: "",
            publicKey: "",
            error: stacksError.message,
          };
        }

        // Check valid result
        if (
          !stacksResult ||
          !stacksResult.signature ||
          !stacksResult.publicKey
        ) {
          return {
            success: false,
            signature: "",
            publicKey: "",
            error: "Failed to get a valid signature from your Stacks wallet",
          };
        }

        return {
          success: true,
          signature: stacksResult.signature,
          publicKey: stacksResult.publicKey,
        };

      case "ETH":
        // For Ethereum, use safe wallet operation
        const [ethResult, ethError] = await safeWalletOperation(() =>
          signEthereumMessage(message)
        );

        // Handle errors
        if (ethError) {
          // Check if this is a user rejection
          if (ethError.type === WalletErrorType.USER_REJECTED) {
            return {
              success: false,
              signature: "",
              publicKey: "",
              error: "You cancelled the transaction",
            };
          }

          return {
            success: false,
            signature: "",
            publicKey: "",
            error: ethError.message,
          };
        }

        // Check valid result
        if (!ethResult || !ethResult.signature || !ethResult.address) {
          return {
            success: false,
            signature: "",
            publicKey: "",
            error: "Failed to get a valid signature from your Ethereum wallet",
          };
        }

        // Verify the signature matches the address
        const isEthSignatureValid = verifyEthereumSignature(
          message,
          ethResult.signature,
          address
        );

        if (!isEthSignatureValid) {
          return {
            success: false,
            signature: ethResult.signature,
            publicKey: ethResult.address,
            error:
              "The signature does not match the provided Ethereum address. Please ensure you are using the correct wallet.",
          };
        }

        return {
          success: true,
          signature: ethResult.signature,
          publicKey: ethResult.address,
        };

      case "SOL":
        // For Solana, use safe wallet operation
        const [solResult, solError] = await safeWalletOperation(() =>
          signSolanaMessage(message)
        );

        // Handle errors
        if (solError) {
          // Check if this is a user rejection
          if (solError.type === WalletErrorType.USER_REJECTED) {
            return {
              success: false,
              signature: "",
              publicKey: "",
              error: "You cancelled the transaction",
            };
          }

          return {
            success: false,
            signature: "",
            publicKey: "",
            error: solError.message,
          };
        }

        // Check valid result
        if (!solResult || !solResult.signature || !solResult.address) {
          return {
            success: false,
            signature: "",
            publicKey: "",
            error: "Failed to get a valid signature from your Solana wallet",
          };
        }

        // Verify the signature matches the address
        const isSolSignatureValid = verifySolanaSignature(
          message,
          solResult.signature,
          address
        );

        if (!isSolSignatureValid) {
          return {
            success: false,
            signature: solResult.signature,
            publicKey: solResult.address,
            error:
              "The signature does not match the provided Solana address. Please ensure you are using the correct wallet.",
          };
        }

        return {
          success: true,
          signature: solResult.signature,
          publicKey: solResult.address,
        };

      default:
        throw new Error(`Unsupported blockchain: ${chain}`);
    }
  } catch (error) {
    // This is a fallback for any errors not caught by safeWalletOperation
    console.error(`Error verifying ${chain} address ownership:`, error);

    // Handle user rejection patterns here too
    if (
      error instanceof Error &&
      (error.message.includes("USER_REJECTED") ||
        error.message.includes("user denied") ||
        error.message.includes("rejected") ||
        error.message.includes("cancel"))
    ) {
      return {
        success: false,
        signature: "",
        publicKey: "",
        error: "You cancelled the transaction",
      };
    }

    return {
      success: false,
      signature: "",
      publicKey: "",
      error: "An unknown error occurred during verification.",
    };
  }
}
