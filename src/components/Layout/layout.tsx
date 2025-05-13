// components/Layout.tsx

import React from "react";
import Link from "next/link";
import { useStacksAuthContext } from "@/contexts/StacksAuthContext";

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export default function Layout({ children, title, description }: LayoutProps) {
  const { authenticated, senderAddresses } = useStacksAuthContext();

  return (
    <div
      className={`$ min-h-screen flex flex-col font-[family-name:var(--font-geist-sans)]`}
    >
      <nav className="bg-gray-800 text-white">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            Domain System
          </Link>
          <div className="flex gap-4 items-center">
            <Link href="/lookup" className="hover:text-blue-300">
              Lookup
            </Link>
            {authenticated ? (
              <div className="flex items-center gap-3">
                <span className="hidden md:inline text-sm text-gray-300 font-mono truncate max-w-[140px]">
                  {senderAddresses.mainnet.substring(0, 10)}...
                </span>
                <Link
                  href="/"
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                >
                  My Domains
                </Link>
              </div>
            ) : (
              <Link
                href="/"
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
              >
                Connect Wallet
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 flex-grow">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-1">{title}</h1>
          {description && <p className="text-gray-600">{description}</p>}
        </header>

        <main>{children}</main>
      </div>

      <footer className="bg-gray-50 border-t py-8">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          Cross-Chain Domain System &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
