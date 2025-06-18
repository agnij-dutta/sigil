'use client';

interface CivicAuthClientProviderProps {
  children: React.ReactNode;
}

export default function CivicAuthClientProvider({ children }: CivicAuthClientProviderProps) {
  // Simple passthrough component - Web3 auth integration will be added later
  return <>{children}</>;
} 