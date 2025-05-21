import React from "react";
import { useStacksAuthContext } from "../contexts/StacksAuthContext";
import { useUser } from "../hooks/useUser";
import Link from "next/link";
import {
  Globe,
  Plus,
  Settings,
  Box,
  ExternalLink,
  Loader,
  ChevronRight,
  Wallet,
  Search,
  Shield,
  Layers,
  GitBranch,
} from "lucide-react";
import Layout from "@/components/Layout";

export default function Home() {
  const { authenticated, authenticate } = useStacksAuthContext();
  const { user, isLoading } = useUser();

  return (
    <Layout
      title="Cross-Chain Domain Hub"
      description="Your portal to blockchain domains across multiple chains"
    >
      {authenticated ? (
        // Authenticated user view
        <div className="space-y-8">
          {/* Domain summary section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">Your Domains</h2>
              <Link
                href="/register"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center space-x-2 shadow-lg shadow-emerald-900/30"
              >
                <Plus className="h-4 w-4" />
                <span>Register New Domain</span>
              </Link>
            </div>

            <div className="rounded-lg border border-zinc-800 overflow-hidden shadow-lg">
              {isLoading ? (
                <div className="flex items-center justify-center p-12 bg-zinc-900">
                  <Loader className="h-6 w-6 text-emerald-500 animate-spin" />
                  <span className="ml-3 text-gray-400">
                    Loading your domains...
                  </span>
                </div>
              ) : user?.domains && user.domains.length > 0 ? (
                <div className="divide-y divide-zinc-800">
                  {user.domains.map((domain) => (
                    <div
                      key={domain.id}
                      className="p-4 hover:bg-zinc-800 transition-colors bg-zinc-900"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-white mb-1">
                            {domain.name}
                          </div>
                          <div className="text-sm text-gray-400">
                            Registered on{" "}
                            {new Date(domain.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Link
                          href={`/domain/${domain.name}`}
                          className="flex items-center text-emerald-400 hover:text-emerald-300 font-medium text-sm"
                        >
                          <span>Manage</span>
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-4 bg-zinc-900">
                  <div className="mx-auto h-16 w-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                    <Globe className="h-8 w-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    No domains yet
                  </h3>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    You haven't registered any domains yet. Register your first
                    domain to start managing your cross-chain identities.
                  </p>
                  <Link
                    href="/register"
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors inline-flex items-center shadow-lg shadow-emerald-900/30"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Register Your First Domain
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick actions section */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/register"
                className="p-4 border border-zinc-800 bg-zinc-900 rounded-lg hover:border-emerald-800 hover:bg-zinc-800 transition-colors flex items-start space-x-3"
              >
                <div className="mt-1 h-8 w-8 rounded-full bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                  <Globe className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white mb-1">
                    Register Domain
                  </h3>
                  <p className="text-sm text-gray-400">
                    Add a new domain to your portfolio
                  </p>
                </div>
              </Link>

              <Link
                href="/lookup"
                className="p-4 border border-zinc-800 bg-zinc-900 rounded-lg hover:border-emerald-800 hover:bg-zinc-800 transition-colors flex items-start space-x-3"
              >
                <div className="mt-1 h-8 w-8 rounded-full bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                  <Search className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white mb-1">Domain Lookup</h3>
                  <p className="text-sm text-gray-400">
                    Search for domain information
                  </p>
                </div>
              </Link>

              <a
                href="https://explorer.stacks.co"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 border border-zinc-800 bg-zinc-900 rounded-lg hover:border-emerald-800 hover:bg-zinc-800 transition-colors flex items-start space-x-3"
              >
                <div className="mt-1 h-8 w-8 rounded-full bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
                  <ExternalLink className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white mb-1">
                    Stacks Explorer
                  </h3>
                  <p className="text-sm text-gray-400">
                    View transaction details
                  </p>
                </div>
              </a>
            </div>
          </div>

          {/* Features section */}
          {user?.domains && user.domains.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">
                Domain Management
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border border-zinc-800 bg-zinc-900 rounded-lg hover:border-emerald-800 hover:bg-zinc-800 transition-colors">
                  <h4 className="font-medium text-white mb-2 flex items-center">
                    <GitBranch className="h-4 w-4 mr-2 text-emerald-500" />
                    Cross-Chain Integration
                  </h4>
                  <p className="text-sm text-gray-400">
                    Link your Bitcoin, Ethereum, and Solana addresses to your
                    domains for seamless cross-chain identity management.
                  </p>
                </div>
                <div className="p-4 border border-zinc-800 bg-zinc-900 rounded-lg hover:border-emerald-800 hover:bg-zinc-800 transition-colors">
                  <h4 className="font-medium text-white mb-2 flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-emerald-500" />
                    Secure Verification
                  </h4>
                  <p className="text-sm text-gray-400">
                    Every address requires secure wallet-based verification to
                    ensure only the true owners can manage their domains.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Non-authenticated user view - welcome screen
        <div className="space-y-8">
          {/* Hero section */}
          <div className="bg-gradient-to-br from-emerald-900/30 to-zinc-900 rounded-xl p-8 text-center shadow-lg border border-emerald-900/20">
            <div className="mx-auto h-20 w-20 bg-emerald-900/50 rounded-full flex items-center justify-center mb-6">
              <Globe className="h-10 w-10 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Welcome to DomainHub
            </h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              The cross-chain domain management platform that allows you to link
              multiple blockchain addresses to your domain. Connect your wallet
              to get started.
            </p>
            <button
              onClick={authenticate}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors mx-auto flex items-center justify-center shadow-lg shadow-emerald-900/30"
            >
              <Wallet className="h-5 w-5 mr-2" />
              <span className="font-medium">Connect Your Wallet</span>
            </button>
            <div className="mt-4 text-gray-500 text-sm">
              Using Stacks (formerly Blockstack) for secure authentication
            </div>
          </div>

          {/* Features section */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 text-center">
              Platform Features
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
                <div className="h-12 w-12 bg-emerald-900/50 rounded-full flex items-center justify-center mb-4">
                  <Layers className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Cross-Chain Identity
                </h3>
                <p className="text-gray-400">
                  Link addresses from multiple blockchains to a single domain
                  for unified identity management.
                </p>
              </div>

              <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
                <div className="h-12 w-12 bg-emerald-900/50 rounded-full flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Secure Verification
                </h3>
                <p className="text-gray-400">
                  Multi-chain signature verification ensures only legitimate
                  owners can manage their domains.
                </p>
              </div>

              <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
                <div className="h-12 w-12 bg-emerald-900/50 rounded-full flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Reverse Lookups
                </h3>
                <p className="text-gray-400">
                  Find domains associated with any blockchain address across
                  Bitcoin, Ethereum, and Solana.
                </p>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 text-center">
              How It Works
            </h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div className="p-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-900/50 text-emerald-400 flex items-center justify-center mb-4 mx-auto">
                    1
                  </div>
                  <h4 className="font-medium text-white mb-2">
                    Connect Wallet
                  </h4>
                  <p className="text-sm text-gray-400">
                    Link your Stacks wallet to securely access the platform
                  </p>
                </div>
                <div className="p-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-900/50 text-emerald-400 flex items-center justify-center mb-4 mx-auto">
                    2
                  </div>
                  <h4 className="font-medium text-white mb-2">
                    Register Domain
                  </h4>
                  <p className="text-sm text-gray-400">
                    Register your BNS domain on our platform
                  </p>
                </div>
                <div className="p-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-900/50 text-emerald-400 flex items-center justify-center mb-4 mx-auto">
                    3
                  </div>
                  <h4 className="font-medium text-white mb-2">Add Addresses</h4>
                  <p className="text-sm text-gray-400">
                    Link addresses from multiple blockchains
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Non-authenticated action */}
          <div className="flex justify-center">
            <Link
              href="/lookup"
              className="px-4 py-2 bg-zinc-800 text-gray-200 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors flex items-center space-x-2"
            >
              <Search className="h-4 w-4" />
              <span>Try Domain Lookup Without Connecting</span>
            </Link>
          </div>
        </div>
      )}
    </Layout>
  );
}
