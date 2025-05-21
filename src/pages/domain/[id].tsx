import { useRouter } from "next/router";
import { useState } from "react";
import { useStacksAuthContext } from "../../contexts/StacksAuthContext";
import Link from "next/link";
import { trpc } from "../../../utils/trpc";
import ErrorBoundary from "../../components/ErrorBoundary";
import AddressForm from "@/components/AddressForm/AddressForm";
import RemoveAddressModal from "@/components/RemoveAddress/RemoveAddressModal";
import {
  Globe,
  Loader,
  ArrowLeft,
  Copy,
  ExternalLink,
  Clock,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Info,
  Shield,
} from "lucide-react";
import Layout from "@/components/Layout";
import Head from "next/head";

export default function DomainManagement() {
  const router = useRouter();
  const { id } = router.query;
  const { authenticated, senderAddresses } = useStacksAuthContext();
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isRemovingAddress, setIsRemovingAddress] = useState(false);
  const [addressToRemove, setAddressToRemove] = useState<{
    id: string;
    address: string;
    chain: "BTC" | "ETH" | "SOL";
  } | null>(null);
  const [addAddressVisible, setAddAddressVisible] = useState(false);
  const [addressesByChain, setAddressesByChain] = useState<{
    [key: string]: boolean;
  }>({
    BTC: true,
    ETH: true,
    SOL: true,
  });

  // Function to toggle address visibility by chain
  const toggleAddressVisibility = (chain: string) => {
    setAddressesByChain((prev) => ({
      ...prev,
      [chain]: !prev[chain],
    }));
  };

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

  // Handle successful address removal
  const handleRemoveSuccess = () => {
    setIsRemovingAddress(false);
    setAddressToRemove(null);
    setSuccessMessage("Address removed successfully!");
    refetch();

    // Reset success message after a delay
    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  };

  // Cancel address removal
  const handleRemoveCancel = () => {
    setIsRemovingAddress(false);
    setAddressToRemove(null);
  };

  // Copy address to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessMessage("Address copied to clipboard!");
    setTimeout(() => setSuccessMessage(""), 2000);
  };

  // Toggle address form visibility
  const toggleAddAddressForm = () => {
    setAddAddressVisible(!addAddressVisible);
  };

  // Group addresses by chain
  const addressesByChainMap =
    domain?.addresses?.reduce(
      (acc: { [key: string]: typeof domain.addresses }, address) => {
        if (!acc[address.chain]) {
          acc[address.chain] = [];
        }
        acc[address.chain].push(address);
        return acc;
      },
      {} as { [key: string]: typeof domain.addresses }
    ) || {};

  // Get chain-specific class and icon
  const getChainStyles = (chain: string) => {
    switch (chain) {
      case "BTC":
        return {
          bgColor: "bg-orange-900/20",
          textColor: "text-orange-400",
          borderColor: "border-orange-900/30",
          icon: (
            <svg
              className="h-4 w-4 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.17-1.06-.25l.53-2.127-1.32-.33-.54 2.165c-.285-.065-.565-.13-.84-.2l-1.815-.45-.35 1.407s.975.225.955.238c.535.136.63.495.615.78l-1.477 5.92c-.075.18-.24.45-.625.35.015.02-.96-.24-.96-.24l-.655 1.51 1.715.43.93.236-.54 2.19 1.32.33.54-2.17c.36.1.705.19 1.05.273l-.54 2.143 1.32.33.54-2.18c2.24.427 3.93.255 4.64-1.775.57-1.637-.03-2.582-1.217-3.2.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.185 3.137.53 2.75 2.084v.006z"
                fill="#F97316"
              />
            </svg>
          ),
        };
      case "ETH":
        return {
          bgColor: "bg-blue-900/20",
          textColor: "text-blue-400",
          borderColor: "border-blue-900/30",
          icon: (
            <svg
              className="h-4 w-4 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"
                fill="#60A5FA"
              />
            </svg>
          ),
        };
      case "SOL":
        return {
          bgColor: "bg-purple-900/20",
          textColor: "text-purple-400",
          borderColor: "border-purple-900/30",
          icon: (
            <svg
              className="h-4 w-4 mr-2"
              viewBox="0 0 397 311"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7zm0-164.7c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7zm317.2-47.3c-5.8 0-8.7-7-4.6-11.1l62.7-62.7c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H73.8z"
                fill="#C084FC"
              />
            </svg>
          ),
        };
      default:
        return {
          bgColor: "bg-zinc-800",
          textColor: "text-gray-400",
          borderColor: "border-zinc-700",
          icon: <Globe className="h-4 w-4 mr-2 text-gray-400" />,
        };
    }
  };

  if (!id) {
    return <div>Domain ID is required</div>;
  }

  if (isLoading) {
    return (
      <Layout title="Loading..." description="Loading domain information">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader className="h-10 w-10 text-emerald-500 animate-spin mb-4" />
          <p className="text-gray-400">Loading domain information...</p>
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
        <div className="py-8 text-center">
          <div className="bg-red-900/20 border border-red-900/30 rounded-lg p-6 inline-block mx-auto">
            <div className="h-16 w-16 mx-auto bg-red-900/40 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-lg font-medium text-white mb-2">
              Domain Not Found
            </h2>
            <p className="text-red-400 mb-6">
              The domain "{id}" could not be found in our system.
            </p>
            <Link
              href="/"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 inline-flex items-center shadow-lg shadow-emerald-900/30"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Dashboard
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const isOwner =
    authenticated && domain.ownerStacksAddress === senderAddresses.mainnet;

  return (
    <ErrorBoundary>
      <Head>
        <title>{domain.name} | Domain Hub</title>
        <meta
          name="description"
          content={`Manage your domain ${domain.name} and its linked blockchain addresses`}
        />
      </Head>
      <Layout title={domain.name} description={`Manage domain ${domain.name}`}>
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-900/20 border border-emerald-900/30 rounded-lg flex items-start shadow-sm animate-fadeIn">
            <CheckCircle className="h-5 w-5 text-emerald-400 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-emerald-300">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-900/30 rounded-lg flex items-start shadow-sm">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Domain Header */}
        <div className="bg-gradient-to-r from-emerald-900/30 to-zinc-900 p-6 rounded-lg mb-8 border border-emerald-900/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center">
                <Globe className="h-6 w-6 text-emerald-400 mr-2" />
                <h2 className="text-2xl font-bold text-white">{domain.name}</h2>
              </div>
              <div className="mt-2 text-sm text-gray-400 flex items-center">
                <Clock className="h-4 w-4 mr-1 text-gray-500" />
                <span>
                  Registered on{" "}
                  {new Date(domain.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {isOwner && (
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg shadow-emerald-900/30"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Register Another Domain
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Domain Details */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <div className="flex items-center">
                <Globe className="h-5 w-5 mr-2 text-emerald-500" />
                <span>Blockchain Addresses</span>
              </div>
            </h3>
            {isOwner && (
              <button
                onClick={toggleAddAddressForm}
                className="inline-flex items-center justify-center px-3 py-1.5 text-sm border border-emerald-700 shadow-sm font-medium rounded-md text-emerald-400 bg-emerald-900/20 hover:bg-emerald-900/40"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Address
              </button>
            )}
          </div>

          {/* Address Cards Section */}
          <div className="space-y-4">
            {Object.keys(addressesByChainMap).length > 0 ? (
              Object.entries(addressesByChainMap).map(([chain, addresses]) => {
                const { bgColor, textColor, borderColor, icon } =
                  getChainStyles(chain);

                return (
                  <div
                    key={chain}
                    className={`border ${borderColor} rounded-lg overflow-hidden bg-zinc-900`}
                  >
                    <div
                      className={`${bgColor} ${textColor} p-3 flex justify-between items-center cursor-pointer`}
                      onClick={() => toggleAddressVisibility(chain)}
                    >
                      <div className="flex items-center">
                        {icon}
                        <span className="font-medium">
                          {chain === "BTC"
                            ? "Bitcoin"
                            : chain === "ETH"
                            ? "Ethereum"
                            : "Solana"}
                        </span>
                        <span className="ml-2 text-xs bg-zinc-900/40 rounded-full px-2 py-0.5">
                          {addresses.length}{" "}
                          {addresses.length === 1 ? "address" : "addresses"}
                        </span>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          addressesByChain[chain] ? "rotate-180" : ""
                        }`}
                      />
                    </div>

                    {addressesByChain[chain] && (
                      <div className="divide-y divide-zinc-800">
                        {addresses.map((address) => (
                          <div
                            key={address.id}
                            className="p-3 hover:bg-zinc-800"
                          >
                            <div className="flex justify-between items-center">
                              <div className="font-mono text-sm break-all pr-4 text-gray-300">
                                {address.address}
                              </div>
                              <div className="flex items-center space-x-2 flex-shrink-0">
                                <button
                                  onClick={() =>
                                    copyToClipboard(address.address)
                                  }
                                  className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-zinc-700 rounded"
                                  title="Copy to clipboard"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                                {isOwner && (
                                  <button
                                    onClick={() =>
                                      handleRemoveClick(
                                        address.id,
                                        address.address,
                                        address.chain as "BTC" | "ETH" | "SOL"
                                      )
                                    }
                                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded"
                                    title="Remove address"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
                <div className="h-16 w-16 mx-auto bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                  <Globe className="h-8 w-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  No addresses linked
                </h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  This domain doesn't have any blockchain addresses linked to it
                  yet.
                  {isOwner
                    ? " Add your first address to start using this domain across chains."
                    : ""}
                </p>
                {isOwner && (
                  <button
                    onClick={toggleAddAddressForm}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 inline-flex items-center shadow-lg shadow-emerald-900/30"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Address
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Add Address Form */}
        {isOwner && addAddressVisible && (
          <div className="mb-8 animate-fadeIn">
            <div className="border border-emerald-900/30 rounded-lg overflow-hidden">
              <div className="bg-emerald-900/20 p-3 border-b border-emerald-900/30">
                <h3 className="font-medium text-emerald-400 flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Blockchain Address
                </h3>
              </div>
              <div className="p-4 bg-zinc-900">
                <AddressForm
                  domainId={domain.id}
                  domainName={domain.name}
                  onAddressAdded={() => {
                    refetch();
                    setAddAddressVisible(false);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Information Box */}
        <div className="mt-8 bg-emerald-900/20 border border-emerald-900/30 rounded-lg p-4">
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-emerald-400 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-md font-semibold text-white mb-2">
                Cross-Chain Verification
              </h3>
              <p className="text-sm text-gray-300 mb-2">
                When adding blockchain addresses, you'll need to verify
                ownership:
              </p>
              <ul className="text-sm text-gray-300 space-y-1 list-disc pl-5">
                <li>
                  <strong className="text-emerald-400">Bitcoin (BTC):</strong>{" "}
                  Uses your connected Stacks/Leather wallet for verification
                </li>
                <li>
                  <strong className="text-emerald-400">Ethereum (ETH):</strong>{" "}
                  Requires connecting MetaMask or other Ethereum-compatible
                  wallet
                </li>
                <li>
                  <strong className="text-emerald-400">Solana (SOL):</strong>{" "}
                  Requires connecting Phantom or other Solana-compatible wallet
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Address Removal Modal */}
        {isRemovingAddress && addressToRemove && (
          <RemoveAddressModal
            addressId={addressToRemove.id}
            address={addressToRemove.address}
            chain={addressToRemove.chain}
            domainName={domain.name}
            onSuccess={handleRemoveSuccess}
            onCancel={handleRemoveCancel}
          />
        )}

        {/* Quick navigation */}
        <div className="mt-8 pt-4 border-t border-zinc-800">
          <Link
            href="/"
            className="text-emerald-400 hover:text-emerald-300 inline-flex items-center text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>
      </Layout>
    </ErrorBoundary>
  );
}
