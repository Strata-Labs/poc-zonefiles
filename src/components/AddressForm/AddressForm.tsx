import React, { useState } from "react";
import { useStacksAuthContext } from "@/contexts/StacksAuthContext";
import { verifyAddressOwnership } from "../../../utils/verifyAddressOwnership";
import { trpc } from "../../../utils/trpc";
import WalletSelect from "../wallets/WalletSelect";
import { Loader, AlertCircle, CheckCircle, X, HelpCircle } from "lucide-react";
import { WalletErrorType } from "../../../utils/walletErrorHandler";

type Chain = "BTC" | "ETH" | "SOL";

type FormState =
  | "input"
  | "wallet-select"
  | "signing"
  | "processing"
  | "success"
  | "error";

interface AddressFormProps {
  domainId: string;
  domainName: string;
  onAddressAdded: () => void;
}

export default function AddressForm({
  domainId,
  domainName,
  onAddressAdded,
}: AddressFormProps) {
  const { authenticated } = useStacksAuthContext();
  const [formState, setFormState] = useState<FormState>("input");
  const [formData, setFormData] = useState<{
    address: string;
    chain: Chain;
    detectedAddress?: string;
  }>({
    address: "",
    chain: "BTC",
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // tRPC mutation for adding an address
  const addAddressMutation = trpc.domain.addAddress.useMutation({
    onSuccess: () => {
      setFormData({ address: "", chain: "BTC" });
      setFormState("success");
      setSuccessMessage("Address added successfully!");
      onAddressAdded();

      // Reset to input state after a delay
      setTimeout(() => {
        setFormState("input");
        setSuccessMessage(null);
      }, 3000);
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      setError(error.message || "Failed to add address. Please try again.");
      setFormState("error");

      setTimeout(() => {
        setFormState("input");
      }, 5000);
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateAddress = (): boolean => {
    // Chain-specific validation
    if (!formData.address.trim()) {
      setError("Address is required");
      return false;
    }

    if (
      formData.chain === "BTC" &&
      !/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/.test(formData.address)
    ) {
      setError("Please enter a valid Bitcoin address");
      return false;
    } else if (
      formData.chain === "ETH" &&
      !/^0x[a-fA-F0-9]{40}$/.test(formData.address)
    ) {
      setError("Please enter a valid Ethereum address");
      return false;
    } else if (
      formData.chain === "SOL" &&
      !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(formData.address)
    ) {
      setError("Please enter a valid Solana address");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!authenticated) {
      setError("You must be authenticated to add an address");
      return;
    }

    if (!validateAddress()) {
      return;
    }

    // For Ethereum and Solana, prompt to connect the respective wallet
    if (formData.chain === "ETH" || formData.chain === "SOL") {
      setFormState("wallet-select");
    } else {
      // For Bitcoin, proceed directly with Stacks wallet
      handleVerifyAddress();
    }
  };

  const handleWalletConnected = (address: string) => {
    // Store the detected address from the wallet
    setFormData((prev) => ({ ...prev, detectedAddress: address }));

    // If the address field is empty, fill it with the detected address
    if (!formData.address.trim()) {
      setFormData((prev) => ({ ...prev, address }));
    }

    // Proceed with verification
    handleVerifyAddress();
  };

  const handleCancelWalletSelect = () => {
    setFormState("input");
  };

  const handleVerifyAddress = async () => {
    setFormState("signing");
    setError(null);

    try {
      // Verify ownership of the address using the appropriate wallet
      const verificationResult = await verifyAddressOwnership(
        formData.address,
        formData.chain,
        domainName
      );

      // Check success status
      if (!verificationResult.success) {
        // If the error indicates user cancellation, just go back to input state
        if (
          verificationResult.error?.includes("cancelled") ||
          verificationResult.error?.includes("cancel") ||
          verificationResult.error?.toLowerCase().includes("user rejected")
        ) {
          setFormState("input");
          return;
        }

        // Otherwise, show the error
        setError(
          verificationResult.error || "Failed to verify address ownership"
        );
        setFormState("error");
        return;
      }

      // If successful, proceed with mutation
      setFormState("processing");

      // Prepare the signature data with correct typing
      const signatureData = {
        domainId: domainId,
        address: formData.address,
        chain: formData.chain,
        signature: verificationResult.signature,
        publicKey: verificationResult.publicKey,
        verificationMethod:
          formData.chain === "BTC" ? ("stacks" as const) : ("native" as const),
      };

      // Add the address
      await addAddressMutation.mutateAsync(signatureData);
    } catch (error) {
      console.error("Error during address verification:", error);

      // Handle user cancellation
      if (
        error instanceof Error &&
        (error.message.toLowerCase().includes("cancel") ||
          error.message.toLowerCase().includes("reject") ||
          error.message.toLowerCase().includes("denied"))
      ) {
        setFormState("input");
        return;
      }

      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
      setFormState("error");
    }
  };

  // Get chain-specific placeholder and example
  const getChainInfo = (chain: Chain) => {
    switch (chain) {
      case "BTC":
        return {
          placeholder: "Enter your Bitcoin address",
          example: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
          icon: (
            <svg
              className="h-5 w-5 text-orange-500"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.17-1.06-.25l.53-2.127-1.32-.33-.54 2.165c-.285-.065-.565-.13-.84-.2l-1.815-.45-.35 1.407s.975.225.955.238c.535.136.63.495.615.78l-1.477 5.92c-.075.18-.24.45-.625.35.015.02-.96-.24-.96-.24l-.655 1.51 1.715.43.93.236-.54 2.19 1.32.33.54-2.17c.36.1.705.19 1.05.273l-.54 2.143 1.32.33.54-2.18c2.24.427 3.93.255 4.64-1.775.57-1.637-.03-2.582-1.217-3.2.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.185 3.137.53 2.75 2.084v.006z"
                fill="currentColor"
              />
            </svg>
          ),
        };
      case "ETH":
        return {
          placeholder: "Enter your Ethereum address",
          example: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
          icon: (
            <svg
              className="h-5 w-5 text-blue-500"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"
                fill="currentColor"
              />
            </svg>
          ),
        };
      case "SOL":
        return {
          placeholder: "Enter your Solana address",
          example: "5U1Vhm6ejkqahzFbPCrCwvVzrTWkXWABdyEyUvGJDLfL",
          icon: (
            <svg
              className="h-5 w-5 text-purple-500"
              viewBox="0 0 397 311"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7zm0-164.7c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7zm317.2-47.3c-5.8 0-8.7-7-4.6-11.1l62.7-62.7c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H73.8z"
                fill="currentColor"
              />
            </svg>
          ),
        };
      default:
        return {
          placeholder: "Enter blockchain address",
          example: "",
          icon: <HelpCircle className="h-5 w-5 text-gray-500" />,
        };
    }
  };

  const chainInfo = getChainInfo(formData.chain);

  // Render different UI based on form state
  const renderFormContent = () => {
    switch (formState) {
      case "wallet-select":
        return (
          <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-5">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-white">
                Connect Your Wallet
              </h3>
              <button
                onClick={handleCancelWalletSelect}
                className="text-gray-500 hover:text-gray-300 p-1 rounded-full hover:bg-zinc-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <WalletSelect
              chain={formData.chain}
              onWalletConnected={handleWalletConnected}
              onCancel={handleCancelWalletSelect}
            />
          </div>
        );

      case "signing":
        return (
          <div className="p-5 bg-blue-900/20 border border-blue-900/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-blue-900/40 flex items-center justify-center">
                <Loader className="h-5 w-5 text-blue-400 animate-spin" />
              </div>
              <div>
                <h3 className="font-semibold text-white">
                  Waiting for Signature
                </h3>
                <p className="text-sm text-blue-300">
                  Please check your wallet and approve the signature request
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-blue-300 bg-blue-900/30 p-3 rounded">
              If you don't see a wallet popup, check if it was blocked by your
              browser or if your wallet extension is running
            </p>
          </div>
        );

      case "processing":
        return (
          <div className="p-5 bg-blue-900/20 border border-blue-900/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-blue-900/40 flex items-center justify-center">
                <Loader className="h-5 w-5 text-blue-400 animate-spin" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Processing Request</h3>
                <p className="text-sm text-blue-300">
                  We're adding your address to the domain...
                </p>
              </div>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="p-5 bg-emerald-900/20 border border-emerald-900/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-emerald-900/40 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Success!</h3>
                <p className="text-sm text-emerald-300">{successMessage}</p>
              </div>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="p-5 bg-red-900/20 border border-red-900/30 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="h-10 w-10 rounded-full bg-red-900/40 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Error</h3>
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="chain"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Blockchain
              </label>
              <div className="relative">
                <select
                  id="chain"
                  name="chain"
                  value={formData.chain}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none text-white"
                >
                  <option value="BTC">Bitcoin (BTC)</option>
                  <option value="ETH">Ethereum (ETH)</option>
                  <option value="SOL">Solana (SOL)</option>
                </select>
                <div className="absolute left-3 top-2.5 text-gray-500">
                  {chainInfo.icon}
                </div>
                <div className="absolute right-3 top-2.5 text-gray-500 pointer-events-none">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                placeholder={chainInfo.placeholder}
                required
              />
              <p className="mt-1 text-xs text-gray-500 flex items-center">
                <span className="mr-1">Example:</span>
                <span className="font-mono truncate">{chainInfo.example}</span>
              </p>
              {formData.chain !== "BTC" && (
                <div className="mt-3 p-3 bg-blue-900/20 border border-blue-900/30 rounded-lg">
                  <p className="text-xs text-blue-300 flex items-start">
                    <HelpCircle className="h-4 w-4 mr-1.5 flex-shrink-0 mt-0.5" />
                    <span>
                      When adding a {formData.chain} address, you'll need to
                      connect your {formData.chain} wallet to verify ownership.
                    </span>
                  </p>
                </div>
              )}
            </div>

            {error && formState === "input" && (
              <div className="p-3 bg-red-900/20 border border-red-900/30 rounded-lg text-sm text-red-300 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-900 flex items-center shadow-lg shadow-emerald-900/30"
              >
                <span>Add Address</span>
              </button>
            </div>
          </form>
        );
    }
  };

  return <div>{renderFormContent()}</div>;
}
