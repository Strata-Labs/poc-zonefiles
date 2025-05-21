// utils/wallets/solanaWallet.ts
import { PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import nacl from "tweetnacl";

let connectedAddress: string | null = null;

export async function connectSolanaWallet(): Promise<{ address: string }> {
  if (!window.solana) {
    throw new Error(
      "Solana wallet not detected. Please install a Solana wallet (like Atomic Wallet, Phantom, or Solflare) to use Solana features."
    );
  }

  try {
    // Connect to wallet
    const response = await window.solana.connect();

    // Ensure we have a valid response with publicKey
    if (!response || !response.publicKey) {
      throw new Error(
        "Failed to connect to Solana wallet. No public key returned."
      );
    }

    // Get the address as a string
    const address = response.publicKey.toString();

    // Validate the address
    if (!address) {
      throw new Error("Failed to retrieve Solana address from wallet.");
    }

    // Store the address for later use
    connectedAddress = address;

    // Return a non-null address (validated above)
    return { address };
  } catch (error) {
    console.error("Error connecting to Solana wallet:", error);
    throw error;
  }
}

export async function signSolanaMessage(
  message: string
): Promise<{ signature: string; address: string }> {
  if (!window.solana || !connectedAddress) {
    throw new Error("Solana wallet not connected. Please connect first.");
  }

  try {
    // Encode message to Uint8Array
    const encodedMessage = new TextEncoder().encode(message);

    // Sign the message
    const signatureData = await window.solana.signMessage(
      encodedMessage,
      "utf8"
    );

    console.log("Received signature data:", signatureData);

    // Handle different signature formats based on wallet implementations
    let signature: string;

    if (typeof signatureData === "string") {
      // Some wallets return base58 encoded string directly
      signature = signatureData;
    } else if (signatureData instanceof Uint8Array) {
      // Most wallets return a Uint8Array
      signature = bs58.encode(signatureData);
    } else if (
      signatureData &&
      typeof signatureData === "object" &&
      "signature" in signatureData
    ) {
      // Some wallets return an object with signature property
      const sigData = (signatureData as any).signature;
      if (typeof sigData === "string") {
        signature = sigData;
      } else if (sigData instanceof Uint8Array) {
        signature = bs58.encode(sigData);
      } else {
        throw new Error(`Unsupported signature format: ${sigData}`);
      }
    } else if (Array.isArray(signatureData)) {
      // Handle array format (some wallets might return array of numbers)
      signature = bs58.encode(new Uint8Array(signatureData));
    } else {
      console.error(
        "Unsupported signature data type:",
        typeof signatureData,
        signatureData
      );
      throw new Error(`Unsupported signature format: ${typeof signatureData}`);
    }

    // Ensure we have a valid signature
    if (!signature) {
      throw new Error("Failed to generate valid signature from Solana wallet.");
    }

    console.log("Processed signature:", signature);

    return {
      signature,
      address: connectedAddress,
    };
  } catch (error) {
    console.error("Error signing message with Solana wallet:", error);

    // Propagate the original error to be handled by safeWalletOperation
    throw error;
  }
}

export function verifySolanaSignature(
  message: string,
  signature: string,
  expectedAddress: string
): boolean {
  try {
    // Decode base58 signature to Uint8Array
    const signatureBytes = bs58.decode(signature);

    // Encode message
    const encodedMessage = new TextEncoder().encode(message);

    // Create PublicKey from address
    const publicKey = new PublicKey(expectedAddress);
    const publicKeyBytes = publicKey.toBytes();

    // Verify the signature using nacl
    return nacl.sign.detached.verify(
      encodedMessage,
      signatureBytes,
      publicKeyBytes
    );
  } catch (error) {
    console.error("Error verifying Solana signature:", error);
    return false;
  }
}
