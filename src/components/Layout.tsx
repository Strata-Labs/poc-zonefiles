// components/Layout.tsx

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useStacksAuthContext } from "@/contexts/StacksAuthContext";
import {
  Home,
  Search,
  Globe,
  UserCircle,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ExternalLink,
  Loader,
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export default function Layout({ children, title, description }: LayoutProps) {
  const {
    authenticated,
    senderAddresses,
    authenticate,
    logout,
    isAuthenticating,
  } = useStacksAuthContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const toggleProfileDropdown = () =>
    setProfileDropdownOpen(!profileDropdownOpen);

  // Handle wallet connection
  const handleConnectWallet = () => {
    console.log("Connect wallet button clicked");
    authenticate();
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white font-sans">
      {/* Navigation */}
      <nav className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-30 shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Logo and desktop navigation */}
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <Globe className="h-6 w-6 text-emerald-500" strokeWidth={2.5} />
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                  DomainHub
                </span>
              </Link>

              <div className="hidden md:flex space-x-6">
                <Link
                  href="/"
                  className="text-gray-300 hover:text-emerald-400 flex items-center space-x-1 transition-colors"
                >
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/lookup"
                  className="text-gray-300 hover:text-emerald-400 flex items-center space-x-1 transition-colors"
                >
                  <Search className="h-4 w-4" />
                  <span>Lookup</span>
                </Link>
              </div>
            </div>

            {/* User section */}
            <div className="hidden md:flex items-center space-x-4">
              {authenticated ? (
                <div className="relative">
                  <button
                    className="flex items-center space-x-2 px-3 py-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors"
                    onClick={toggleProfileDropdown}
                  >
                    <UserCircle className="h-5 w-5 text-emerald-400" />
                    <span className="text-sm font-medium text-gray-200 max-w-[120px] truncate">
                      {senderAddresses.mainnet.substring(0, 8)}...
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-zinc-800 rounded-md shadow-xl py-1 z-10 border border-zinc-700">
                      <Link
                        href="/"
                        className="block px-4 py-2 text-sm text-gray-200 hover:bg-zinc-700 hover:text-emerald-400"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        My Domains
                      </Link>
                      <Link
                        href="/register"
                        className="block px-4 py-2 text-sm text-gray-200 hover:bg-zinc-700 hover:text-emerald-400"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        Register Domain
                      </Link>
                      <div className="border-t border-zinc-700 my-1"></div>
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-zinc-700 flex items-center"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleConnectWallet}
                  disabled={isAuthenticating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors flex items-center space-x-2 shadow-lg shadow-emerald-900/30 disabled:opacity-70"
                >
                  {isAuthenticating ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <UserCircle className="h-4 w-4" />
                      <span>Connect Wallet</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                className="text-gray-300 hover:text-emerald-400"
                onClick={toggleMobileMenu}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-3 py-3 border-t border-zinc-800">
              <Link
                href="/"
                className="block py-2 text-gray-300 hover:text-emerald-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center space-x-2">
                  <Home className="h-5 w-5" />
                  <span>Dashboard</span>
                </div>
              </Link>
              <Link
                href="/lookup"
                className="block py-2 text-gray-300 hover:text-emerald-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>Lookup</span>
                </div>
              </Link>

              {authenticated ? (
                <>
                  <div className="border-t border-zinc-800 my-2"></div>
                  <div className="py-2 text-gray-400 text-sm">
                    Connected as:{" "}
                    <span className="font-mono text-emerald-400">
                      {senderAddresses.mainnet.substring(0, 8)}...
                    </span>
                  </div>
                  <Link
                    href="/register"
                    className="block py-2 text-gray-300 hover:text-emerald-400"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center space-x-2">
                      <Globe className="h-5 w-5" />
                      <span>Register Domain</span>
                    </div>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left flex items-center space-x-2 py-2 text-red-400 hover:text-red-300"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    handleConnectWallet();
                    setMobileMenuOpen(false);
                  }}
                  disabled={isAuthenticating}
                  className="mt-2 block py-2 px-4 text-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors w-full disabled:opacity-70"
                >
                  {isAuthenticating ? (
                    <span className="flex items-center justify-center">
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                      Connecting...
                    </span>
                  ) : (
                    "Connect Wallet"
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-grow py-8 bg-black">
        <div className="container mx-auto px-4">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
            {description && <p className="text-gray-400">{description}</p>}
          </header>

          <main className="bg-zinc-900 rounded-lg shadow-xl border border-zinc-800 p-6">
            {children}
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-zinc-900 border-t border-zinc-800 py-6 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Globe className="h-5 w-5 text-emerald-500" strokeWidth={2.5} />
              <span className="font-bold text-gray-200">DomainHub</span>
            </div>
            <div className="text-gray-500 text-sm">
              Cross-Chain Domain System &copy; {new Date().getFullYear()}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
