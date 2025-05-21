// components/Register/Register.tsx

import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useStacksAuthContext } from "@/contexts/StacksAuthContext";
import { trpc } from "../../../utils/trpc";
import DomainOwnershipChecker from "../Ownership/DomainOwnershipChecker";
import Layout from "@/components/Layout";
import {
  Globe,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader,
  InfoIcon,
} from "lucide-react";

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
    <Layout
      title="Register New Domain"
      description="Register a domain in the cross-chain registry"
    >
      {!authenticated ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center mb-6 bg-zinc-800/50 p-4 rounded-lg">
            <AlertCircle className="h-6 w-6 text-amber-500 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-white mb-1">
                Authentication Required
              </h3>
              <p className="text-gray-400">
                You need to connect your Stacks wallet to register a domain.
                Please use the "Connect Wallet" button in the navigation bar.
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <Link
              href="/"
              className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-lg">
            <div className="bg-gradient-to-r from-emerald-900/30 to-zinc-900 p-4 border-b border-zinc-800">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-emerald-900/50 rounded-full flex items-center justify-center mr-3">
                  <Globe className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Register Domain
                  </h3>
                  <p className="text-sm text-gray-400">
                    Add a new domain to the cross-chain registry
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label
                    htmlFor="domainName"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    Domain Name
                  </label>
                  <input
                    type="text"
                    id="domainName"
                    value={domainName}
                    onChange={(e) => setDomainName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white"
                    placeholder="yourdomain.btc"
                    required
                    disabled={isVerifying}
                  />
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
                    className={`p-4 rounded-lg ${
                      verificationStatus.status === "verifying"
                        ? "bg-blue-900/20 border border-blue-900/30 text-blue-300"
                        : verificationStatus.status === "success"
                        ? "bg-emerald-900/20 border border-emerald-900/30 text-emerald-300"
                        : "bg-red-900/20 border border-red-900/30 text-red-300"
                    }`}
                  >
                    {verificationStatus.status === "verifying" && (
                      <div className="flex items-center">
                        <Loader className="animate-spin h-5 w-5 text-blue-400 mr-3" />
                        <span>{verificationStatus.message}</span>
                      </div>
                    )}
                    {verificationStatus.status === "success" && (
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-emerald-400 mr-3" />
                        <span>{verificationStatus.message}</span>
                      </div>
                    )}
                    {verificationStatus.status === "error" && (
                      <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
                        <span>{verificationStatus.message}</span>
                      </div>
                    )}
                  </div>
                )}

                {error && verificationStatus.status === "idle" && (
                  <div className="p-4 bg-red-900/20 border border-red-900/30 rounded-lg text-red-300 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <Link
                    href="/"
                    className="px-4 py-2 bg-zinc-800 text-white border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={!domainName || isVerifying}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-emerald-900/40 disabled:text-emerald-100/50 shadow-lg shadow-emerald-900/30"
                  >
                    {isVerifying ? (
                      <span className="flex items-center">
                        <Loader className="animate-spin h-4 w-4 mr-2" />
                        Verifying...
                      </span>
                    ) : (
                      "Register Domain"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Information Box */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <div className="flex items-start">
              <InfoIcon className="h-5 w-5 text-emerald-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-md font-semibold text-white mb-2">
                  How Domain Verification Works
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  When you register a domain, we verify that you own it by
                  checking against the BNS (Bitcoin Name System) records. The
                  domain must be already registered to your Stacks address in
                  the BNS system for verification to succeed.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
