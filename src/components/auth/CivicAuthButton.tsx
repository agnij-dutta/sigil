'use client';

import { useUser } from "@civic/auth-web3/react";
import { useEffect } from 'react';

interface CivicAuthButtonProps {
  className?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export default function CivicAuthButton({ 
  className = '', 
  onSuccess,
  onError 
}: CivicAuthButtonProps) {
  const { user, signIn, signOut, isLoading, error } = useUser();

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  useEffect(() => {
    if (user && onSuccess) {
      onSuccess();
    }
  }, [user, onSuccess]);

  const handleSignIn = async () => {
    try {
      await signIn();
    } catch (err) {
      console.error('Civic auth error:', err);
      if (onError) {
        onError(err as Error);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Civic signout error:', err);
      if (onError) {
        onError(err as Error);
      }
    }
  };

  if (user) {
    return (
      <button
        onClick={handleSignOut}
        disabled={isLoading}
        className={`
          relative inline-flex items-center justify-center px-6 py-3
          bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800
          text-white font-medium rounded-lg transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Disconnecting...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Disconnect Wallet</span>
          </div>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleSignIn}
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
        </div>
      )}
    </button>
  );
} 