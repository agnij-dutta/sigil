'use client';

import { useState } from 'react';

interface TelegramAuthButtonProps {
  className?: string;
  onSuccess?: (user: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  onError?: (error: Error) => void;
}

export default function TelegramAuthButton({ 
  className = '', 
  onSuccess, 
  onError 
}: TelegramAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [phoneNumber, setPhoneNumber] = useState('');
  const [authMode, setAuthMode] = useState<'qr' | 'phone'>('qr');

  const generateQR = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/telegram/auth/qr', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }
      
      const data = await response.json();
      setQrCode(data.qrCode);
      setSessionId(data.sessionId);
      setShowQR(true);
      
      // Start polling for authentication
      pollAuthStatus(data.sessionId);
    } catch (error) {
      console.error('QR generation error:', error);
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const pollAuthStatus = async (sessionId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/telegram/auth/qr?sessionId=${sessionId}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.status === 'authenticated' && data.user) {
            onSuccess?.(data.user);
            setShowQR(false);
            return;
          }
        }
        
        // Continue polling if still pending
        setTimeout(poll, 2000);
      } catch (error) {
        console.error('Auth status polling error:', error);
      }
    };
    
    poll();
  };

  const handlePhoneAuth = async () => {
    if (!phoneNumber.trim()) {
      onError?.(new Error('Phone number is required'));
      return;
    }
    
    try {
      setIsLoading(true);
      // Placeholder implementation - in a real app, this would connect to Telegram's API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      // For now, we'll show a success message but note that it's not fully implemented
      onSuccess?.({
        method: 'phone',
        phone: phoneNumber,
        status: 'demo',
        message: 'Phone authentication is a placeholder. Real implementation requires Telegram API setup.'
      });
      
      console.log('Phone auth demo completed for:', phoneNumber);
    } catch (error) {
      console.error('Phone auth error:', error);
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <button
          onClick={() => setAuthMode('qr')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            authMode === 'qr' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          QR Code
        </button>
        <button
          onClick={() => setAuthMode('phone')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            authMode === 'phone' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Phone Number
        </button>
      </div>

      {authMode === 'qr' ? (
        <div className="space-y-4">
          {!showQR ? (
            <button
              onClick={generateQR}
              disabled={isLoading}
              className={`
                relative inline-flex items-center justify-center px-6 py-3 w-full
                bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg
                transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                ${className}
              `}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating QR...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM19 13h2v2h-2zM13 13h2v2h-2zM15 15h2v2h-2zM13 17h2v2h-2zM15 19h2v2h-2zM17 17h2v2h-2zM19 19h2v2h-2zM17 15h2v2h-2zM19 15v2h2v-2h-2z"/>
                  </svg>
                  <span>Connect with Telegram QR</span>
                </div>
              )}
            </button>
          ) : (
            <div className="bg-white p-6 rounded-lg border text-center space-y-4">
              <h3 className="font-medium text-gray-900">Scan QR Code with Telegram</h3>
              {qrCode && (
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCode} alt="Telegram QR Code" className="w-48 h-48" />
                </div>
              )}
              <p className="text-sm text-gray-600">
                Open Telegram app and scan this QR code to connect your account
              </p>
              <button
                onClick={() => setShowQR(false)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handlePhoneAuth}
            disabled={isLoading || !phoneNumber.trim()}
            className={`
              relative inline-flex items-center justify-center px-6 py-3 w-full
              bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg
              transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
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
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
                </svg>
                <span>Connect with Phone</span>
              </div>
            )}
          </button>
        </div>
      )}
    </div>
  );
} 