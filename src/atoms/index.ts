// atoms/index.ts

import { atom } from "jotai";

// Authentication
export const authenticatedAtom = atom(false);
export const senderAddressesAtom = atom<{ testnet: string; mainnet: string }>({
  testnet: "",
  mainnet: "",
});
