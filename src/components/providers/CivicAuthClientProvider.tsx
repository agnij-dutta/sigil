"use client"

import { CivicAuthProvider } from "@civic/auth-web3/react";

interface CivicAuthClientProviderProps {
  children: React.ReactNode;
}

export function CivicAuthClientProvider({ children }: CivicAuthClientProviderProps) {
  const clientId = process.env.NEXT_PUBLIC_CIVIC_CLIENT_ID || "5d40dfe1-7677-4fbf-9391-f7b36b7e6575";

  return (
    <CivicAuthProvider clientId={clientId}>
      {children}
    </CivicAuthProvider>
  );
} 