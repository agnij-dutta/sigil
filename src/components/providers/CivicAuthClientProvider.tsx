"use client"

import { CivicAuthProvider } from "@civic/auth-web3/react";
import { useEffect, useState } from "react";

interface CivicAuthClientProviderProps {
  children: React.ReactNode;
}

export function CivicAuthClientProvider({ children }: CivicAuthClientProviderProps) {
  const [isClient, setIsClient] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_CIVIC_CLIENT_ID || "5d40dfe1-7677-4fbf-9391-f7b36b7e6575";

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Render children without provider during SSR
  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <CivicAuthProvider clientId={clientId}>
      {children}
    </CivicAuthProvider>
  );
} 