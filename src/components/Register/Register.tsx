// components/Register/Register.tsx

import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useStacksAuthContext } from "@/contexts/StacksAuthContext";
import { trpc } from "../../../utils/trpc";
import WalletConnector from "../WalletConnect/WalletConnector";
import DomainOwnershipChecker from "../Ownership/DomainOwnershipChecker";

export default function RegisterDomain() {
  const router = useRouter();
  const { authenticated, senderAddresses } = useStacksAuthContext();
  const [domainName, setDomainName] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDomainVerified, setIsDomainVerified] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<{
    status: "idle" | "verifying" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });

  const utils = trpc.useContext();

  const createDomainMutation = trpc.domain.create.useMutation({
    onSuccess: () => {
      // Invalidate queries that might have domain data
      utils.domain.getByOwner.invalidate({
        ownerStacksAddress: senderAddresses.mainnet,
      });

      // Show success message before redirecting
      setVerificationStatus({
        status: "success",
        message: "Domain registered successfully!",
      });

      // Redirect after a short delay to allow user to see the success message
      setTimeout(() => {
        router.push("/");
      }, 1500);
    },
    onError: (error) => {
      setError(error.message);
      setVerificationStatus({
        status: "error",
        message: error.message,
      });
      setIsVerifying(false);
    },
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authenticated) {
      setError("Please connect your wallet first");
      return;
    }

    // Reset any previous errors
    setError("");
    setIsVerifying(true);
    setVerificationStatus({
      status: "verifying",
      message: "Verifying domain ownership...",
    });

    // Validate domain name
    if (!domainName.trim()) {
      setError("Domain name is required");
      setVerificationStatus({
        status: "error",
        message: "Domain name is required",
      });
      setIsVerifying(false);
      return;
    }

    // Format the domain name
    const formattedDomainName = domainName.toLowerCase();

    try {
      // Create the domain
      createDomainMutation.mutate({
        name: formattedDomainName,
        ownerStacksAddress: senderAddresses.mainnet,
      });
    } catch (err) {
      console.error("Error during domain registration:", err);
      setError("An unexpected error occurred during registration");
      setVerificationStatus({
        status: "error",
        message: "An unexpected error occurred during registration",
      });
      setIsVerifying(false);
    }
  };

  return (
    <div
      className={` min-h-screen flex flex-col items-center p-8 font-[family-name:var(--font-geist-sans)]`}
    >
      <header className="w-full max-w-4xl mb-12">
        <h1 className="text-3xl font-bold mb-2">Register New Domain</h1>
        <p className="text-gray-600">
          Register a new cross-chain domain with your Stacks wallet
        </p>
      </header>

      <main className="w-full max-w-4xl flex-grow">
        {!authenticated ? (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Connect Your Wallet</h2>
            <WalletConnector />
          </section>
        ) : (
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Register Domain</h2>
            <div className="p-6 border rounded-lg">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label
                    htmlFor="domainName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Domain Name
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      id="domainName"
                      value={domainName}
                      onChange={(e) => setDomainName(e.target.value)}
                      className="flex-grow px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="yourdomain.tld"
                      required
                      disabled={isVerifying}
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    You must own this domain in the BNS system before
                    registering here
                  </p>
                </div>

                {/* Domain Ownership Checker */}
                <DomainOwnershipChecker
                  domainName={domainName}
                  onVerificationComplete={(isVerified) =>
                    setIsDomainVerified(isVerified)
                  }
                />

                {/* Verification Status */}
                {verificationStatus.status !== "idle" && (
                  <div
                    className={`p-3 rounded ${
                      verificationStatus.status === "verifying"
                        ? "bg-blue-50 border border-blue-200 text-blue-600"
                        : verificationStatus.status === "success"
                        ? "bg-green-50 border border-green-200 text-green-600"
                        : "bg-red-50 border border-red-200 text-red-600"
                    }`}
                  >
                    {verificationStatus.status === "verifying" && (
                      <div className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500"
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
                        {verificationStatus.message}
                      </div>
                    )}
                    {verificationStatus.status !== "verifying" &&
                      verificationStatus.message}
                  </div>
                )}

                {error && verificationStatus.status === "idle" && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600">
                    {error}
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <Link
                    href="/"
                    className="px-4 py-2 border rounded hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={!domainName || isVerifying}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                  >
                    {isVerifying ? "Verifying..." : "Register Domain"}
                  </button>
                </div>
              </form>
            </div>

            {/* Information Box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <h3 className="text-md font-semibold text-blue-800 mb-2">
                How Domain Verification Works
              </h3>
              <p className="text-sm text-blue-600">
                When you register a domain, we verify that you own it by
                checking against the BNS (Bitcoin Name System) records. The
                domain must be already registered to your Stacks address in the
                BNS system for verification to succeed.
              </p>
            </div>
          </section>
        )}
      </main>

      <footer className="w-full max-w-4xl py-8 text-center text-gray-500 text-sm">
        Cross-Chain Domain System &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
