// types/global.d.ts

// Type definitions for wallet providers
interface Window {
  // Ethereum wallet provider (MetaMask, etc.)
  ethereum?: {
    isMetaMask?: boolean;
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (eventName: string, callback: (params: any) => void) => void;
    selectedAddress?: string;
    chainId?: string;
  };

  // Solana wallet provider (Atomic Wallet, etc.)
  solana?: {
    isAtomic?: boolean;
    connect: () => Promise<{ publicKey: { toString: () => string } }>;
    disconnect: () => Promise<void>;
    signMessage: (
      message: Uint8Array,
      encoding: "utf8" | "hex"
    ) => Promise<Uint8Array>;
    publicKey?: { toString: () => string };
    on: (eventName: string, callback: (params: any) => void) => void;
  };

  // File system API for artifact reading
  fs: {
    readFile: (
      path: string,
      options?: { encoding?: string }
    ) => Promise<Uint8Array | string>;
  };
}
