// pages/lookup.tsx

import { useState } from "react";
import Link from "next/link";
import { trpc } from "../../utils/trpc";
import Layout from "@/components/Layout/layout";

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

  const renderResults = () => {
    if (!hasSearched) {
      return null;
    }

    if (lookupType === "domain") {
      if (domainQuery.isLoading) {
        return <div className="text-center py-4">Searching...</div>;
      }

      if (domainQuery.error) {
        return (
          <div className="p-4 bg-red-50 border border-red-200 rounded text-red-600">
            Error: {domainQuery.error.message}
          </div>
        );
      }

      if (!domainQuery.data) {
        return (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-700">
            No domain found with the name "{domainName}"
          </div>
        );
      }

      return (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="text-lg font-semibold text-green-800">
              {domainQuery.data.name}
            </h3>
            <p className="text-sm text-green-600">
              Owned by:{" "}
              <span className="font-mono">
                {domainQuery.data.ownerStacksAddress.substring(0, 10)}...
              </span>
            </p>
          </div>

          <div className="p-4 border rounded">
            <h3 className="text-lg font-semibold mb-3">Linked Addresses</h3>
            {selectedChain !== "ALL" ? (
              domainAddressQuery.isLoading ? (
                <div className="text-center py-2">Loading addresses...</div>
              ) : !domainAddressQuery.data ||
                domainAddressQuery.data.length === 0 ? (
                <p className="text-gray-500">
                  No {selectedChain} addresses linked to this domain.
                </p>
              ) : (
                <div className="space-y-2">
                  {domainAddressQuery.data.map((address) => (
                    <div key={address.id} className="p-3 bg-gray-50 rounded">
                      <span className="text-sm font-semibold text-gray-500">
                        {address.chain}
                      </span>
                      <div className="font-mono truncate">
                        {address.address}
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : // Show all addresses from the original domain query
            domainQuery.data.addresses &&
              domainQuery.data.addresses.length > 0 ? (
              <div className="space-y-2">
                {domainQuery.data.addresses.map((address) => (
                  <div key={address.id} className="p-3 bg-gray-50 rounded">
                    <span className="text-sm font-semibold text-gray-500">
                      {address.chain}
                    </span>
                    <div className="font-mono truncate">{address.address}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">
                No addresses linked to this domain.
              </p>
            )}
          </div>
        </div>
      );
    } else {
      if (reverseLookupQuery.isLoading) {
        return <div className="text-center py-4">Searching...</div>;
      }

      if (reverseLookupQuery.error) {
        return (
          <div className="p-4 bg-red-50 border border-red-200 rounded text-red-600">
            Error: {reverseLookupQuery.error.message}
          </div>
        );
      }

      if (!reverseLookupQuery.data) {
        return (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-700">
            No domain found for {chain} address "{address}"
          </div>
        );
      }

      return (
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="text-lg font-semibold text-green-800">
            {reverseLookupQuery.data.name}
          </h3>
          <p className="text-sm text-green-600">
            Owned by:{" "}
            <span className="font-mono">
              {reverseLookupQuery.data.ownerStacksAddress.substring(0, 10)}...
            </span>
          </p>
          <Link
            href={`/domain/${reverseLookupQuery.data.name}`}
            className="mt-2 inline-block text-blue-500 hover:underline"
          >
            View Domain Details
          </Link>
        </div>
      );
    }
  };

  return (
    <Layout
      title="Domain Lookup"
      description="Search for domains or perform reverse lookups"
    >
      <div className="mb-8 border rounded-lg overflow-hidden">
        <div className="flex border-b">
          <button
            className={`flex-1 py-3 px-4 text-center font-medium ${
              lookupType === "domain"
                ? "bg-blue-50 text-blue-600"
                : "bg-gray-50 text-gray-500"
            }`}
            onClick={() => setLookupType("domain")}
          >
            Domain Lookup
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center font-medium ${
              lookupType === "address"
                ? "bg-blue-50 text-blue-600"
                : "bg-gray-50 text-gray-500"
            }`}
            onClick={() => setLookupType("address")}
          >
            Reverse Lookup
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {lookupType === "domain" ? (
              <>
                <div>
                  <label
                    htmlFor="domainName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Domain Name
                  </label>
                  <input
                    type="text"
                    id="domainName"
                    value={domainName}
                    onChange={(e) => setDomainName(e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter domain name"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="chainFilter"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Chain Filter
                  </label>
                  <select
                    id="chainFilter"
                    value={selectedChain}
                    onChange={(e) =>
                      setSelectedChain(
                        e.target.value as "BTC" | "ETH" | "SOL" | "ALL"
                      )
                    }
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">All Chains</option>
                    <option value="BTC">Bitcoin (BTC)</option>
                    <option value="ETH">Ethereum (ETH)</option>
                    <option value="SOL">Solana (SOL)</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label
                    htmlFor="chain"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Blockchain
                  </label>
                  <select
                    id="chain"
                    value={chain}
                    onChange={(e) =>
                      setChain(e.target.value as "BTC" | "ETH" | "SOL")
                    }
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
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Enter ${chain} address`}
                    required
                  />
                </div>
              </>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Results</h2>
        {renderResults()}
      </div>
    </Layout>
  );
}
