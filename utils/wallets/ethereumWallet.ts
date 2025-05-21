// utils/wallets/ethereumWallet.ts
import { ethers } from "ethers";

let provider: ethers.BrowserProvider | null = null;
let signer: ethers.Signer | null = null;
let connectedAddress: string | null = null;

export async function connectEthereumWallet(): Promise<{ address: string }> {
  if (!window.ethereum) {
    throw new Error(
      "MetaMask not detected. Please install MetaMask to use Ethereum features."
    );
  }

  try {
    // Initialize provider (ethers v6 uses BrowserProvider instead of Web3Provider)
    provider = new ethers.BrowserProvider(window.ethereum);

    // Request account access via the provider
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    // Handle the case where accounts array might be empty
    if (!accounts || accounts.length === 0) {
      throw new Error("No Ethereum accounts found. Please unlock your wallet.");
    }

    // Assign the first account
    connectedAddress = accounts[0];

    // Ensure connectedAddress is a valid string
    if (!connectedAddress) {
      throw new Error("Failed to retrieve Ethereum address from wallet.");
    }

    // Get signer
    signer = await provider.getSigner();

    // Return the address (guaranteed to be non-null at this point)
    return { address: connectedAddress };
  } catch (error) {
    console.error("Error connecting to Ethereum wallet:", error);
    throw error;
  }
}

export async function signEthereumMessage(
  message: string
): Promise<{ signature: string; address: string }> {
  if (!provider || !signer || !connectedAddress) {
    throw new Error("Ethereum wallet not connected. Please connect first.");
  }

  try {
    // Sign the message
    const signature = await signer.signMessage(message);

    // Return both the signature and the address for verification
    return {
      signature,
      address: connectedAddress,
    };
  } catch (error) {
    console.error("Error signing message with Ethereum wallet:", error);

    throw error;
  }
}

export function verifyEthereumSignature(
  message: string,
  signature: string,
  expectedAddress: string
): boolean {
  try {
    // Recover the address from the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);

    // Compare with the expected address (case insensitive)
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error("Error verifying Ethereum signature:", error);
    return false;
  }
}
