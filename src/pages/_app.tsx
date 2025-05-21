// pages/_app.tsx

import "../styles/globals.css";
import type { AppProps } from "next/app";
import { httpBatchLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { Provider as JotaiProvider } from "jotai";
import { StacksAuthProvider } from "../contexts/StacksAuthContext";
import { trpc } from "../../utils/trpc";
import ErrorBoundary from "../components/ErrorBoundary";
import Head from "next/head";
import { Buffer } from "buffer";

// Helper function to identify wallet cancellation errors
const isWalletCancellationError = (error: Error): boolean => {
  return (
    error.message === "User canceled the request" ||
    error.message.includes("USER_REJECTED") ||
    error.message.includes("User rejected") ||
    error.message.includes("user denied") ||
    error.message.includes("rejected request") ||
    error.message.toLowerCase().includes("cancel") ||
    error.message.toLowerCase().includes("cancelled")
  );
};

// Modified ErrorBoundary component that handles wallet cancellations
class WalletAwareErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    // Don't set error state for wallet cancellations
    if (isWalletCancellationError(error)) {
      return { hasError: false, error: null };
    }

    // For all other errors, show the error boundary
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Still log the error, but don't crash the UI for wallet cancellations
    if (isWalletCancellationError(error)) {
      console.log("Wallet cancellation detected in error boundary:", error);
      return;
    }

    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="p-6 border border-red-800 bg-zinc-900 rounded-lg max-w-md w-full shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-red-400 mb-4">
              {this.state.error?.message || "An unknown error occurred"}
            </p>
            <button
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Polyfill Buffer for the browser
if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || Buffer;
}

function MyApp({ Component, pageProps }: AppProps) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: false,
          },
        },
      })
  );

  const [trpcClient] = React.useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: "/api/trpc",
        }),
      ],
    })
  );

  React.useEffect(() => {
    // Add a global handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Check if this is a wallet cancellation error from Stacks Connect
      const isStacksConnectCancellation =
        event.reason &&
        typeof event.reason === "object" &&
        event.reason.message === "User canceled the request" &&
        (event.reason.constructor?.name === "JsonRpcError" ||
          event.reason.name === "JsonRpcError");

      // Handle Stack Connect cancellation errors
      if (isStacksConnectCancellation) {
        console.log(
          "Preventing Stacks Connect cancellation error from propagating"
        );
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // Handle other wallet rejection types
      if (
        event.reason &&
        typeof event.reason === "object" &&
        ((event.reason.message &&
          (event.reason.message.includes("USER_REJECTED") ||
            event.reason.message.includes("User rejected") ||
            event.reason.message.includes("user denied") ||
            event.reason.message.includes("rejected request") ||
            event.reason.message.includes("cancelled") ||
            event.reason.message.toLowerCase().includes("cancel"))) ||
          event.reason.code === 4001 ||
          event.reason.code === "ACTION_REJECTED")
      ) {
        console.log("Preventing wallet rejection error from propagating");
        event.preventDefault();
        return;
      }

      // Log other unhandled rejections for debugging
      console.error("Unhandled Promise Rejection:", event.reason);
    };

    // Add the event listener
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    // Clean up
    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, []);

  return (
    <WalletAwareErrorBoundary>
      <Head>
        <title>Domain Hub - Cross-Chain Domain Management</title>
        <meta
          name="description"
          content="Manage your blockchain domains across multiple chains in one place."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <JotaiProvider>
            <StacksAuthProvider>
              <Component {...pageProps} />
            </StacksAuthProvider>
          </JotaiProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </WalletAwareErrorBoundary>
  );
}

export default MyApp;
