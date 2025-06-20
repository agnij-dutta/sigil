'use client';

import { useState } from 'react';

interface CivicAuthButtonProps {
  className?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export default function CivicAuthButton({ 
  className = '', 
  onError 
}: CivicAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async () => {
    try {
      setIsLoading(true);
      // Placeholder for future Web3 wallet integration
      setTimeout(() => {
        setIsLoading(false);
        onError?.(new Error('Web3 wallet integration coming soon! Please use GitHub authentication for now.'));
      }, 1000);
    } catch (error) {
      console.error('Auth error:', error);
      onError?.(error as Error);
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleAuth}
      disabled={isLoading}
      className={`
        relative inline-flex items-center justify-center px-6 py-3
        bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700
        text-white font-medium rounded-lg transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Connecting...</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <svg 
            className="w-5 h-5" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span>Connect Wallet</span>
          <span className="text-xs opacity-75">(Coming Soon)</span>
        </div>
      )}
    </button>
  );
} 