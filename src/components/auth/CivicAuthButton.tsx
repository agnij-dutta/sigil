"use client";

import { useUser, UserButton } from "@civic/auth-web3/react";
import { userHasWallet } from "@civic/auth-web3";
import { useCallback, useEffect } from "react";

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
  const userContext = useUser();
  const { user, signIn, signOut, isLoading } = userContext;

  // Auto-create wallet for new users
  useEffect(() => {
    const createWalletIfNeeded = async () => {
      if (user && !userHasWallet(userContext)) {
        try {
          await userContext.createWallet();
          onSuccess?.();
        } catch (error) {
          console.error('Failed to create wallet:', error);
          onError?.(error as Error);
        }
      }
    };

    createWalletIfNeeded();
  }, [user, userContext, onSuccess, onError]);

  const handleSignIn = useCallback(async () => {
    try {
      await signIn();
    } catch (error) {
      console.error('Sign-in failed:', error);
      onError?.(error as Error);
    }
  }, [signIn, onError]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign-out failed:', error);
      onError?.(error as Error);
    }
  }, [signOut, onError]);

  const handleCreateWallet = useCallback(async () => {
    if (user && !userHasWallet(userContext)) {
      try {
        await userContext.createWallet();
        onSuccess?.();
      } catch (error) {
        console.error('Failed to create wallet:', error);
        onError?.(error as Error);
      }
    }
  }, [user, userContext, onSuccess, onError]);

  if (isLoading) {
    return (
      <button 
        disabled 
        className={`
          relative inline-flex items-center justify-center px-6 py-3 text-sm font-medium 
          text-white bg-gray-400 rounded-lg cursor-not-allowed ${className}
        `}
      >
        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        Loading...
      </button>
    );
  }

  if (!user) {
    return (
      <button
        onClick={handleSignIn}
        className={`
          relative inline-flex items-center justify-center px-6 py-3 text-sm font-medium 
          text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg 
          hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 
          focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 
          shadow-lg hover:shadow-xl transform hover:scale-105 ${className}
        `}
      >
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        Connect with Civic
      </button>
    );
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* User Button for profile management */}
      <UserButton />
      
      {/* Wallet Status and Actions */}
      <div className="flex flex-col gap-2 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Wallet Status:</span>
          <span className={`text-xs px-2 py-1 rounded-full ${
            userHasWallet(userContext) 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {userHasWallet(userContext) ? 'Connected' : 'Not Created'}
          </span>
        </div>
        
        {userHasWallet(userContext) ? (
          <div className="space-y-2">
            <div className="text-xs text-gray-600">
              <span className="font-medium">Address:</span> {userContext.ethereum?.address}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSignOut}
                className="text-xs px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleCreateWallet}
            disabled={userContext.walletCreationInProgress}
            className={`
              text-sm px-4 py-2 rounded-lg transition-colors
              ${userContext.walletCreationInProgress 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
              }
            `}
          >
            {userContext.walletCreationInProgress ? 'Creating Wallet...' : 'Create Wallet'}
          </button>
        )}
      </div>
    </div>
  );
} 