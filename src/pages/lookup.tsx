import { useState } from "react";
import Link from "next/link";
import { trpc } from "../../utils/trpc";
import {
  Globe,
  Search,
  ArrowRight,
  Loader,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  User,
  Copy,
  CheckCircle,
} from "lucide-react";
import Layout from "@/components/Layout";
import Head from "next/head";

// Lookup types
type LookupType = "domain" | "address";

export default function Lookup() {
  const [lookupType, setLookupType] = useState<LookupType>("domain");
  const [domainName, setDomainName] = useState("");
  const [address, setAddress] = useState("");
  const [chain, setChain] = useState<"BTC" | "ETH" | "SOL">("BTC");
  const [selectedChain, setSelectedChain] = useState<
    "BTC" | "ETH" | "SOL" | "ALL"
  >("ALL");
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState("");

  // Domain lookup query
  const domainQuery = trpc.domain.getByName.useQuery(
    { name: domainName },
    { enabled: hasSearched && lookupType === "domain" && !!domainName }
  );

  // Domain address by chain query
  const domainAddressQuery = trpc.domain.getAddressByDomainAndChain.useQuery(
    {
      domainName,
      chain: selectedChain === "ALL" ? undefined : selectedChain,
    },
    {
      enabled:
        hasSearched && lookupType === "domain" && !!domainName && hasSearched,
    }
  );

  // Reverse lookup query
  const reverseLookupQuery = trpc.domain.getDomainByAddress.useQuery(
    { address, chain },
    { enabled: hasSearched && lookupType === "address" && !!address }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
  };

  // Copy to clipboard function
  const copyToClipboard = (text: string, message = "Copied to clipboard!") => {
    navigator.clipboard.writeText(text);
    setCopiedMessage(message);
    setTimeout(() => setCopiedMessage(""), 2000);
  };

  // Get chain icon
  const getChainIcon = (chainType: string) => {
    switch (chainType) {
      case "BTC":
        return (
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
        );
      case "ETH":
        return (
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
        );
      case "SOL":
        return (
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
        );
      default:
        return <Globe className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get chain styles
  const getChainStyles = (chainType: string) => {
    switch (chainType) {
      case "BTC":
        return {
          bg: "bg-orange-900/20",
          text: "text-orange-400",
          border: "border-orange-900/30",
        };
      case "ETH":
        return {
          bg: "bg-blue-900/20",
          text: "text-blue-400",
          border: "border-blue-900/30",
        };
      case "SOL":
        return {
          bg: "bg-purple-900/20",
          text: "text-purple-400",
          border: "border-purple-900/30",
        };
      default:
        return {
          bg: "bg-zinc-800",
          text: "text-gray-300",
          border: "border-zinc-700",
        };
    }
  };

  const renderResults = () => {
    if (!hasSearched) {
      return null;
    }

    if (lookupType === "domain") {
      if (domainQuery.isLoading) {
        return (
          <div className="flex items-center justify-center py-12 bg-zinc-900 rounded-lg border border-zinc-800">
            <Loader className="h-6 w-6 text-emerald-500 animate-spin mr-3" />
            <span className="text-gray-400">Searching for domain...</span>
          </div>
        );
      }

      if (domainQuery.error) {
        return (
          <div className="p-6 bg-red-900/20 border border-red-900/30 rounded-lg flex items-start">
            <AlertCircle className="h-6 w-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-white mb-1">Error Occurred</h3>
              <p className="text-red-400">{domainQuery.error.message}</p>
            </div>
          </div>
        );
      }

      if (!domainQuery.data) {
        return (
          <div className="p-6 bg-yellow-900/20 border border-yellow-900/30 rounded-lg flex items-start">
            <AlertCircle className="h-6 w-6 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-white mb-1">Domain Not Found</h3>
              <p className="text-yellow-300">
                No domain found with the name "
                <span className="font-medium">{domainName}</span>". Please check
                the spelling or try another domain.
              </p>
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-6">
          {/* Domain Found Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-emerald-900/30 to-zinc-900 p-5 border-b border-zinc-800 flex justify-between items-center">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-emerald-900/50 rounded-full flex items-center justify-center mr-3">
                  <Globe className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    {domainQuery.data?.name}
                    <button
                      onClick={() =>
                        copyToClipboard(
                          domainQuery.data?.name || "",
                          "Domain name copied!"
                        )
                      }
                      className="ml-2 p-1 text-gray-500 hover:text-gray-300 rounded-full hover:bg-zinc-800"
                      title="Copy domain name"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </h3>
                  <div className="flex items-center text-sm text-gray-400">
                    <User className="h-4 w-4 mr-1" />
                    <span className="mr-1">Owned by:</span>
                    <span className="font-mono text-emerald-400">
                      {domainQuery.data?.ownerStacksAddress.substring(0, 10)}...
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          domainQuery.data?.ownerStacksAddress || "",
                          "Owner address copied!"
                        )
                      }
                      className="ml-1 p-1 text-gray-500 hover:text-gray-300 rounded-full hover:bg-zinc-800"
                      title="Copy owner address"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    <a
                      href={`https://explorer.stacks.co/address/${domainQuery.data?.ownerStacksAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 p-1 text-gray-500 hover:text-gray-300 rounded-full hover:bg-zinc-800"
                      title="View on explorer"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
              <Link
                href={`/domain/${domainQuery.data?.name}`}
                className="hidden sm:flex items-center px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-900/30"
              >
                <span>View Details</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            {/* Addresses Section */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-white">Linked Addresses</h4>

                <div className="flex items-center">
                  <span className="text-xs text-gray-500 mr-2">Filter:</span>
                  <select
                    value={selectedChain}
                    onChange={(e) => setSelectedChain(e.target.value as any)}
                    className="text-sm border border-zinc-700 rounded px-2 py-1 bg-zinc-800 text-white"
                  >
                    <option value="ALL">All Chains</option>
                    <option value="BTC">Bitcoin</option>
                    <option value="ETH">Ethereum</option>
                    <option value="SOL">Solana</option>
                  </select>
                </div>
              </div>

              {selectedChain !== "ALL" ? (
                domainAddressQuery.isLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader className="h-5 w-5 text-emerald-500 animate-spin" />
                  </div>
                ) : !domainAddressQuery.data ||
                  domainAddressQuery.data.length === 0 ? (
                  <div className="text-center py-6 bg-zinc-800 rounded-lg border border-dashed border-zinc-700">
                    <div className="h-12 w-12 rounded-full bg-zinc-700 flex items-center justify-center mx-auto mb-3">
                      {getChainIcon(selectedChain)}
                    </div>
                    <p className="text-gray-400">
                      No {selectedChain} addresses linked to this domain.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {domainAddressQuery.data.map((addr) => {
                      const styles = getChainStyles(addr.chain);
                      return (
                        <div
                          key={addr.id}
                          className={`p-3 ${styles.bg} ${styles.border} border rounded-lg flex items-center justify-between`}
                        >
                          <div className="flex items-center">
                            <div className="mr-3">
                              {getChainIcon(addr.chain)}
                            </div>
                            <div>
                              <div className="font-mono text-sm break-all pr-4 text-white">
                                {addr.address}
                              </div>
                              <div
                                className={`text-xs ${styles.text} font-medium`}
                              >
                                {addr.chain === "BTC"
                                  ? "Bitcoin"
                                  : addr.chain === "ETH"
                                  ? "Ethereum"
                                  : "Solana"}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                addr.address,
                                `${addr.chain} address copied!`
                              )
                            }
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-zinc-700 rounded-full transition-colors"
                            title="Copy address"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : // Show all addresses from the original domain query
              domainQuery.data?.addresses &&
                domainQuery.data.addresses.length > 0 ? (
                <div className="space-y-3">
                  {domainQuery.data.addresses.map((addr) => {
                    const styles = getChainStyles(addr.chain);
                    return (
                      <div
                        key={addr.id}
                        className={`p-3 ${styles.bg} ${styles.border} border rounded-lg flex items-center justify-between`}
                      >
                        <div className="flex items-center">
                          <div className="mr-3">{getChainIcon(addr.chain)}</div>
                          <div>
                            <div className="font-mono text-sm break-all pr-4 text-white">
                              {addr.address}
                            </div>
                            <div
                              className={`text-xs ${styles.text} font-medium`}
                            >
                              {addr.chain === "BTC"
                                ? "Bitcoin"
                                : addr.chain === "ETH"
                                ? "Ethereum"
                                : "Solana"}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              addr.address,
                              `${addr.chain} address copied!`
                            )
                          }
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-zinc-700 rounded-full transition-colors"
                          title="Copy address"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 bg-zinc-800 rounded-lg border border-dashed border-zinc-700">
                  <Globe className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">
                    No addresses linked to this domain yet.
                  </p>
                </div>
              )}

              <div className="mt-4 flex justify-center sm:hidden">
                <Link
                  href={`/domain/${domainQuery.data?.name}`}
                  className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-900/30"
                >
                  <span>View Domain Details</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      // Reverse lookup results
      if (reverseLookupQuery.isLoading) {
        return (
          <div className="flex items-center justify-center py-12 bg-zinc-900 rounded-lg border border-zinc-800">
            <Loader className="h-6 w-6 text-emerald-500 animate-spin mr-3" />
            <span className="text-gray-400">
              Searching for domain by address...
            </span>
          </div>
        );
      }

      if (reverseLookupQuery.error) {
        return (
          <div className="p-6 bg-red-900/20 border border-red-900/30 rounded-lg flex items-start">
            <AlertCircle className="h-6 w-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-white mb-1">Error Occurred</h3>
              <p className="text-red-400">{reverseLookupQuery.error.message}</p>
            </div>
          </div>
        );
      }

      if (!reverseLookupQuery.data) {
        const styles = getChainStyles(chain);
        return (
          <div className="p-6 bg-yellow-900/20 border border-yellow-900/30 rounded-lg flex items-start">
            <AlertCircle className="h-6 w-6 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-white mb-1">Address Not Found</h3>
              <p className="text-yellow-300 mb-2">
                No domain found for this {chain} address.
              </p>
              <div
                className={`p-2 ${styles.bg} rounded-md inline-flex items-center ${styles.border} border`}
              >
                {getChainIcon(chain)}
                <span className="font-mono text-sm ml-2 text-white">
                  {address}
                </span>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-xl">
          <div className="bg-gradient-to-r from-emerald-900/30 to-zinc-900 p-5 border-b border-zinc-800">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-emerald-900/50 rounded-full flex items-center justify-center mr-3">
                <Globe className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center">
                  {reverseLookupQuery.data?.name}
                  <button
                    onClick={() =>
                      copyToClipboard(
                        reverseLookupQuery.data?.name || "",
                        "Domain name copied!"
                      )
                    }
                    className="ml-2 p-1 text-gray-500 hover:text-gray-300 rounded-full hover:bg-zinc-800"
                    title="Copy domain name"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </h3>
                <div className="flex items-center text-sm text-gray-400">
                  <User className="h-4 w-4 mr-1" />
                  <span className="mr-1">Owned by:</span>
                  <span className="font-mono text-emerald-400">
                    {reverseLookupQuery.data?.ownerStacksAddress.substring(
                      0,
                      10
                    )}
                    ...
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        reverseLookupQuery.data?.ownerStacksAddress || "",
                        "Owner address copied!"
                      )
                    }
                    className="ml-1 p-1 text-gray-500 hover:text-gray-300 rounded-full hover:bg-zinc-800"
                    title="Copy owner address"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <a
                    href={`https://explorer.stacks.co/address/${reverseLookupQuery.data?.ownerStacksAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 p-1 text-gray-500 hover:text-gray-300 rounded-full hover:bg-zinc-800"
                    title="View on explorer"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5">
            <h4 className="font-medium text-white mb-3">Matched Address</h4>

            <div className="mb-6">
              <div
                className={`p-4 ${getChainStyles(chain).bg} border ${
                  getChainStyles(chain).border
                } rounded-lg flex items-center justify-between`}
              >
                <div className="flex items-center">
                  <div className="mr-3">{getChainIcon(chain)}</div>
                  <div>
                    <div className="font-mono text-sm break-all pr-4 text-white">
                      {address}
                    </div>
                    <div
                      className={`text-xs ${
                        getChainStyles(chain).text
                      } font-medium`}
                    >
                      {chain === "BTC"
                        ? "Bitcoin"
                        : chain === "ETH"
                        ? "Ethereum"
                        : "Solana"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(address, `${chain} address copied!`)
                  }
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-zinc-700 rounded-full transition-colors"
                  title="Copy address"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex justify-center">
              <Link
                href={`/domain/${reverseLookupQuery.data?.name}`}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-900/30"
              >
                <span>View Domain Details</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <>
      <Head>
        <title>Domain Lookup | Domain Hub</title>
        <meta
          name="description"
          content="Search for domains or perform reverse lookups across multiple blockchains"
        />
      </Head>
      <Layout
        title="Domain Lookup"
        description="Search for domains or perform reverse lookups across chains"
      >
        {/* Copied message notification */}
        {copiedMessage && (
          <div className="fixed top-20 right-5 bg-emerald-600 text-white py-2 px-4 rounded-lg shadow-xl flex items-center animate-fadeIn z-50">
            <CheckCircle className="h-4 w-4 mr-2" />
            <span>{copiedMessage}</span>
          </div>
        )}

        {/* Search Panel */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-xl mb-8">
          <div className="flex border-b border-zinc-800">
            <button
              className={`flex-1 py-4 px-4 text-center font-medium transition-colors ${
                lookupType === "domain"
                  ? "bg-emerald-900/30 text-emerald-400 border-b-2 border-emerald-500"
                  : "bg-zinc-900 text-gray-400 hover:bg-zinc-800"
              }`}
              onClick={() => {
                setLookupType("domain");
                setHasSearched(false);
              }}
            >
              <div className="flex items-center justify-center">
                <Globe className="h-4 w-4 mr-2" />
                <span>Domain Lookup</span>
              </div>
            </button>
            <button
              className={`flex-1 py-4 px-4 text-center font-medium transition-colors ${
                lookupType === "address"
                  ? "bg-emerald-900/30 text-emerald-400 border-b-2 border-emerald-500"
                  : "bg-zinc-900 text-gray-400 hover:bg-zinc-800"
              }`}
              onClick={() => {
                setLookupType("address");
                setHasSearched(false);
              }}
            >
              <div className="flex items-center justify-center">
                <Search className="h-4 w-4 mr-2" />
                <span>Reverse Lookup</span>
              </div>
            </button>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit}>
              {lookupType === "domain" ? (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="domainName"
                      className="block text-sm font-medium text-gray-300 mb-1"
                    >
                      Domain Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="domainName"
                        value={domainName}
                        onChange={(e) => setDomainName(e.target.value)}
                        className="w-full pl-10 pr-3 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                        placeholder="Enter domain name (e.g. johndoe.btc)"
                        required
                      />
                      <div className="absolute left-3 top-3.5 text-gray-500">
                        <Globe className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="chainFilter"
                      className="block text-sm font-medium text-gray-300 mb-1"
                    >
                      Chain Filter
                    </label>
                    <div className="relative">
                      <select
                        id="chainFilter"
                        value={selectedChain}
                        onChange={(e) =>
                          setSelectedChain(
                            e.target.value as "BTC" | "ETH" | "SOL" | "ALL"
                          )
                        }
                        className="w-full pl-10 pr-3 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white appearance-none"
                      >
                        <option value="ALL">All Chains</option>
                        <option value="BTC">Bitcoin (BTC)</option>
                        <option value="ETH">Ethereum (ETH)</option>
                        <option value="SOL">Solana (SOL)</option>
                      </select>
                      <div className="absolute left-3 top-3.5 text-gray-500">
                        <Search className="h-5 w-5" />
                      </div>
                      <div className="absolute right-3 top-3.5 text-gray-500 pointer-events-none">
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
                </div>
              ) : (
                <div className="space-y-4">
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
                        value={chain}
                        onChange={(e) =>
                          setChain(e.target.value as "BTC" | "ETH" | "SOL")
                        }
                        className="w-full pl-10 pr-3 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white appearance-none"
                      >
                        <option value="BTC">Bitcoin (BTC)</option>
                        <option value="ETH">Ethereum (ETH)</option>
                        <option value="SOL">Solana (SOL)</option>
                      </select>
                      <div className="absolute left-3 top-3.5 text-gray-500">
                        {getChainIcon(chain)}
                      </div>
                      <div className="absolute right-3 top-3.5 text-gray-500 pointer-events-none">
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
                    <div className="relative">
                      <input
                        type="text"
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full pl-10 pr-3 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                        placeholder={`Enter ${chain} address`}
                        required
                      />
                      <div className="absolute left-3 top-3.5 text-gray-500">
                        <Search className="h-5 w-5" />
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Example:
                      {chain === "BTC"
                        ? " bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"
                        : chain === "ETH"
                        ? " 0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
                        : " 5U1Vhm6ejkqahzFbPCrCwvVzrTWkXWABdyEyUvGJDLfL"}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  className="px-5 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center shadow-lg shadow-emerald-900/30"
                >
                  <Search className="h-4 w-4 mr-2" />
                  <span>Search</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Results Section */}
        {hasSearched && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Search className="h-5 w-5 mr-2 text-emerald-500" />
              <span>Search Results</span>
            </h2>
            {renderResults()}
          </div>
        )}

        {/* Information Section */}
        {!hasSearched && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h2 className="font-semibold text-white mb-3 flex items-center">
              <Globe className="h-5 w-5 mr-2 text-emerald-500" />
              <span>What You Can Do</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700 hover:border-emerald-800 transition-colors">
                <h3 className="font-medium text-white mb-2 flex items-center">
                  <Globe className="h-4 w-4 mr-2 text-emerald-400" />
                  <span>Domain Lookup</span>
                </h3>
                <p className="text-sm text-gray-400">
                  Search for domains to find all the blockchain addresses
                  associated with them. See which BTC, ETH, and SOL addresses
                  are linked.
                </p>
              </div>
              <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700 hover:border-emerald-800 transition-colors">
                <h3 className="font-medium text-white mb-2 flex items-center">
                  <Search className="h-4 w-4 mr-2 text-emerald-400" />
                  <span>Reverse Lookup</span>
                </h3>
                <p className="text-sm text-gray-400">
                  Enter a blockchain address to find the domain it's associated
                  with. Works for BTC, ETH, and SOL addresses.
                </p>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </>
  );
}
