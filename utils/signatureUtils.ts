// utils/signatureUtils.ts

import { verifyMessageSignatureRsv } from "@stacks/encryption";

export function verifySignature(
  message: string,
  signature: string,
  publicKey: string
): boolean {
  try {
    console.log("Verifying signature with:", {
      message,
      messageLength: message.length,
      signatureLength: signature.length,
      publicKey,
    });

    const result = verifyMessageSignatureRsv({
      message,
      signature,
      publicKey,
    });

    console.log("Signature verification result:", result);
    return result;
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}

export function generateAddAddressMessage(
  chain: string,
  address: string,
  domainName: string,
  ownerAddress: string
): string {
  return `I authorize adding ${chain} address ${address} to domain ${domainName}`;
}

export function generateRemoveAddressMessage(
  addressId: string,
  chain: string,
  address: string,
  domainName: string,
  ownerAddress: string
): string {
  return `I authorize removing ${chain} address ${address} from domain ${domainName}`;
}
