// pages/index.tsx

import Layout from "@/components/Layout/layout";
import { useStacksAuthContext } from "../contexts/StacksAuthContext";
import { useUser } from "../hooks/useUser";

import Link from "next/link";
import WalletConnector from "@/components/WalletConnect/WalletConnector";

export default function Home() {
  const { authenticated } = useStacksAuthContext();
  const { user, isLoading } = useUser();

  return (
    <Layout
      title="Cross-Chain Domain System"
      description="Register and manage cross-chain domain names with your Stacks wallet"
    >
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Connect Your Wallet</h2>
        <WalletConnector />
      </section>

      {authenticated && (
        <section className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Domains</h2>
            <Link
              href="/register"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Register New Domain
            </Link>
          </div>

          <div className="p-6 border rounded-lg">
            {isLoading ? (
              <p className="text-center">Loading your domains...</p>
            ) : user?.domains && user.domains.length > 0 ? (
              <ul className="divide-y">
                {user.domains.map((domain) => (
                  <li key={domain.id} className="py-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{domain.name}</span>
                      <Link
                        href={`/domain/${domain.name}`}
                        className="text-blue-500 hover:underline"
                      >
                        Manage
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-gray-500">
                  You haven't registered any domains yet.
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </Layout>
  );
}
