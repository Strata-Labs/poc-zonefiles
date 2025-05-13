// pages/domain/[id].tsx

import { useRouter } from "next/router";
import { useState } from "react";
import { useStacksAuthContext } from "../../contexts/StacksAuthContext";
import Link from "next/link";
import { trpc } from "../../../utils/trpc";
import { signMessage } from "../../../utils/auth";
import Layout from "@/components/Layout/layout";
import { tryCatch } from "../../../utils/try-catch-wrapper";
import ErrorBoundary from "../../components/ErrorBoundary";

// Type for the add address form
type AddressFormData = {
  address: string;
  chain: "BTC" | "ETH" | "SOL";
};

// Form states
type FormState = "input" | "signing" | "processing" | "success" | "error";

export default function DomainManagement() {
  const router = useRouter();
  const { id } = router.query;
  const { authenticated, senderAddresses } = useStacksAuthContext();
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<AddressFormData>({
    address: "",
    chain: "BTC",
  });
  const [formState, setFormState] = useState<FormState>("input");
  const [successMessage, setSuccessMessage] = useState("");
  const [isRemovingAddress, setIsRemovingAddress] = useState(false);
  const [addressToRemove, setAddressToRemove] = useState<{
    id: string;
    address: string;
    chain: "BTC" | "ETH" | "SOL";
  } | null>(null);

  // Fetch domain data
  const {
    data: domain,
    isLoading,
    refetch,
  } = trpc.domain.getByName.useQuery(
    { name: (id as string) || "" },
    {
      enabled: !!id,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  // Add address mutation
  const addAddressMutation = trpc.domain.addAddress.useMutation({
    onSuccess: () => {
      setFormData({ address: "", chain: "BTC" });
      setFormState("success");
      setSuccessMessage("Address added successfully!");
      refetch();

      // Reset to input state after a delay
      setTimeout(() => {
        setFormState("input");
        setSuccessMessage("");
      }, 3000);
    },
    onError: (error) => {
      console.error("Mutation error:", error);

      if (error.message.includes("already registered")) {
        setError(
          `This ${formData.chain} address is already registered in the system. Each address can only be registered once per blockchain.`
        );
      } else {
        setError(error.message || "Failed to add address. Please try again.");
      }

      setFormState("error");

      setTimeout(() => {
        setFormState("input");
      }, 5000);
    },
  });

  // Remove address mutation
  const removeAddressMutation = trpc.domain.removeAddress.useMutation({
    onSuccess: () => {
      setIsRemovingAddress(false);
      setAddressToRemove(null);
      setFormState("success");
      setSuccessMessage("Address removed successfully!");
      refetch();

      // Reset success message after a delay
      setTimeout(() => {
        setFormState("input");
        setSuccessMessage("");
      }, 3000);
    },
    onError: (error) => {
      console.error("Remove mutation error:", error);
      setError(error.message || "Failed to remove address. Please try again.");
      setFormState("error");
      setIsRemovingAddress(false);
      setAddressToRemove(null);

      // Reset to input state after a delay on error
      setTimeout(() => {
        setFormState("input");
      }, 5000);
    },
  });

  // Handle form changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission to add an address
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!authenticated || !domain) {
      setError("You must be authenticated and own this domain");
      return;
    }

    // Validate that the user is the owner
    if (domain.ownerStacksAddress !== senderAddresses.mainnet) {
      setError("You are not the owner of this domain");
      return;
    }

    // Validate the address format
    if (!formData.address.trim()) {
      setError("Address is required");
      return;
    }

    // Chain-specific validation
    if (
      formData.chain === "BTC" &&
      !/^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/.test(formData.address)
    ) {
      setError("Please enter a valid Bitcoin address");
      return;
    } else if (
      formData.chain === "ETH" &&
      !/^0x[a-fA-F0-9]{40}$/.test(formData.address)
    ) {
      setError("Please enter a valid Ethereum address");
      return;
    } else if (
      formData.chain === "SOL" &&
      !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(formData.address)
    ) {
      setError("Please enter a valid Solana address");
      return;
    }

    setFormState("signing");

    const message = `I authorize adding ${formData.chain} address ${formData.address} to domain ${domain.name}`;

    console.log("Attempting to sign message:", message);

    const [signatureResponse, signError] = await tryCatch(async () => {
      return await signMessage(message);
    });

    if (signError) {
      console.error("Signature error:", signError);
      setFormState("error");

      if (signError.message === "USER_REJECTED_SIGNATURE") {
        setError(
          "You cancelled the signature request. To add an address, you need to authorize with your wallet."
        );
      } else {
        setError(
          signError.message || "Failed to sign message. Please try again."
        );
      }

      setTimeout(() => {
        setFormState("input");
      }, 5000);

      return;
    }

    setFormState("processing");

    // Submit the form with signature
    try {
      await addAddressMutation.mutateAsync({
        domainId: domain.id,
        address: formData.address,
        chain: formData.chain,
        signature: signatureResponse!.signature,
        publicKey: signatureResponse!.publicKey,
      });
    } catch (err) {
      console.error("Mutation failed:", err);
    }
  };

  // Handle address removal
  const handleRemoveClick = (
    addressId: string,
    address: string,
    chain: "BTC" | "ETH" | "SOL"
  ) => {
    setAddressToRemove({ id: addressId, address, chain });
    setIsRemovingAddress(true);
    setError("");
  };

  // Confirm address removal
  const confirmRemoveAddress = async () => {
    if (!addressToRemove || !domain || !authenticated) {
      setError("Missing required information to remove address");
      return;
    }

    // Verify owner
    if (domain.ownerStacksAddress !== senderAddresses.mainnet) {
      setError("You are not the owner of this domain");
      return;
    }

    setFormState("signing");

    // Generate message to sign
    const message = `I authorize removing ${addressToRemove.chain} address ${addressToRemove.address} from domain ${domain.name}`;

    console.log("Attempting to sign removal message:", message);

    const [signatureResponse, signError] = await tryCatch(async () => {
      return await signMessage(message);
    });

    if (signError) {
      console.error("Signature error:", signError);
      setFormState("error");

      if (signError.message === "USER_REJECTED_SIGNATURE") {
        setError(
          "You cancelled the signature request. To remove an address, you need to authorize with your wallet."
        );
      } else {
        setError(
          signError.message || "Failed to sign message. Please try again."
        );
      }

      setIsRemovingAddress(false);
      setAddressToRemove(null);

      setTimeout(() => {
        setFormState("input");
        setError("");
      }, 5000);

      return;
    }

    setFormState("processing");

    // Submit the removal with signature
    try {
      await removeAddressMutation.mutateAsync({
        addressId: addressToRemove.id,
        signature: signatureResponse!.signature,
        publicKey: signatureResponse!.publicKey,
      });
    } catch (err) {
      console.error("Remove mutation failed:", err);
    }
  };

  // Cancel address removal
  const cancelRemoveAddress = () => {
    setIsRemovingAddress(false);
    setAddressToRemove(null);
  };

  if (!id) {
    return <div>Domain ID is required</div>;
  }

  if (isLoading) {
    return (
      <Layout title="Loading..." description="Loading domain information">
        <div className="flex justify-center py-10">
          <svg
            className="animate-spin h-10 w-10 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      </Layout>
    );
  }

  if (!domain) {
    return (
      <Layout
        title="Domain Not Found"
        description="The requested domain does not exist"
      >
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
          <p className="text-red-600 mb-4">Domain not found</p>
          <Link
            href="/"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Return to Home
          </Link>
        </div>
      </Layout>
    );
  }

  const isOwner =
    authenticated && domain.ownerStacksAddress === senderAddresses.mainnet;

  return (
    <ErrorBoundary>
      <Layout title={domain.name} description={`Manage domain ${domain.name}`}>
        {/* Success/Error messages */}
        {formState === "success" && successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
            <p className="flex items-center text-green-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3 text-green-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              {successMessage}
            </p>
          </div>
        )}

        {formState === "error" && error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
            <p className="flex items-start text-red-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0 text-red-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </p>
          </div>
        )}

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Addresses</h2>
          <div className="p-6 border rounded-lg">
            {domain.addresses && domain.addresses.length > 0 ? (
              <div className="space-y-4">
                {domain.addresses.map((address) => (
                  <div
                    key={address.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <span className="text-sm font-semibold text-gray-500">
                        {address.chain}
                      </span>
                      <div className="font-mono">{address.address}</div>
                    </div>
                    {isOwner && (
                      <button
                        className="text-red-500 hover:underline"
                        onClick={() =>
                          handleRemoveClick(
                            address.id,
                            address.address,
                            address.chain as "BTC" | "ETH" | "SOL"
                          )
                        }
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">
                No addresses linked to this domain yet.
              </p>
            )}
          </div>
        </section>

        {/* Address Removal Confirmation Modal */}
        {isRemovingAddress && addressToRemove && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-3">
                Confirm Address Removal
              </h3>
              <p className="mb-4">
                Are you sure you want to remove this {addressToRemove.chain}{" "}
                address from your domain?
              </p>
              <div className="p-3 bg-gray-50 rounded mb-4">
                <span className="text-sm font-medium text-gray-500">
                  {addressToRemove.chain}
                </span>
                <div className="font-mono text-sm truncate">
                  {addressToRemove.address}
                </div>
              </div>

              {formState === "signing" && (
                <div className="p-3 mb-4 bg-blue-50 border border-blue-200 rounded">
                  <p className="flex items-center text-blue-700">
                    <svg
                      className="animate-spin h-5 w-5 mr-3 text-blue-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Waiting for signature... Please check your wallet and
                    approve the request
                  </p>
                </div>
              )}

              {formState === "processing" && (
                <div className="p-3 mb-4 bg-blue-50 border border-blue-200 rounded">
                  <p className="flex items-center text-blue-700">
                    <svg
                      className="animate-spin h-5 w-5 mr-3 text-blue-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing your request...
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  className="px-3 py-1 border rounded hover:bg-gray-50"
                  onClick={cancelRemoveAddress}
                  disabled={
                    formState === "signing" || formState === "processing"
                  }
                >
                  Cancel
                </button>
                <button
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  onClick={confirmRemoveAddress}
                  disabled={
                    formState === "signing" || formState === "processing"
                  }
                >
                  {formState === "signing"
                    ? "Waiting for signature..."
                    : formState === "processing"
                    ? "Processing..."
                    : "Remove Address"}
                </button>
              </div>
            </div>
          </div>
        )}

        {isOwner && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Add New Address</h2>
            <div className="p-6 border rounded-lg">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="chain"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Blockchain
                  </label>
                  <select
                    id="chain"
                    name="chain"
                    value={formData.chain}
                    onChange={handleChange}
                    disabled={formState !== "input"}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="BTC">Bitcoin (BTC)</option>
                    <option value="ETH">Ethereum (ETH)</option>
                    <option value="SOL">Solana (SOL)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={formState !== "input"}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Enter ${formData.chain} address`}
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.chain === "BTC"
                      ? "Example: bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"
                      : formData.chain === "ETH"
                      ? "Example: 0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
                      : "Example: 5U1Vhm6ejkqahzFbPCrCwvVzrTWkXWABdyEyUvGJDLfL"}
                  </p>
                </div>

                {formState === "signing" && !isRemovingAddress && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                    <p className="flex items-center text-blue-700">
                      <svg
                        className="animate-spin h-5 w-5 mr-3 text-blue-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Waiting for signature... Please check your wallet and
                      approve the request
                    </p>
                    <p className="mt-2 text-xs text-blue-600">
                      If you don't see a wallet popup, check if it was blocked
                      by your browser or if your wallet extension is running
                    </p>
                  </div>
                )}

                {formState === "processing" && !isRemovingAddress && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                    <p className="flex items-center text-blue-700">
                      <svg
                        className="animate-spin h-5 w-5 mr-3 text-blue-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing your request...
                    </p>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={formState !== "input"}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                  >
                    Add Address
                  </button>
                </div>
              </form>
            </div>

            {/* Information Box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <h3 className="text-md font-semibold text-blue-800 mb-2">
                Address Verification with Signatures
              </h3>
              <p className="text-sm text-blue-600">
                When adding or removing an address for your domain, you'll be
                asked to sign a message with your Stacks wallet. This signature
                proves you authorize the action and helps prevent unauthorized
                changes.
              </p>
            </div>
          </section>
        )}
      </Layout>
    </ErrorBoundary>
  );
}
