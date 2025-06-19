'use client';

import { useState, useEffect, useRef } from 'react';

interface TelegramAuthButtonProps {
  className?: string;
  onSuccess?: (user: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  onError?: (error: Error) => void;
}

// Telegram Login Widget data interface
interface TelegramLoginData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// Extend window to include Telegram callback
declare global {
  interface Window {
    TelegramLoginWidget?: {
      onTelegramAuth: (user: TelegramLoginData) => void;
    };
  }
}

export default function TelegramAuthButton({ 
  className = '', 
  onSuccess, 
  onError 
}: TelegramAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [authMode, setAuthMode] = useState<'widget' | 'qr' | 'phone'>('widget');
  const [isPhoneStage, setIsPhoneStage] = useState<'number' | 'code'>('number');
  const [botConfig, setBotConfig] = useState<{ botUsername: string; hasToken: boolean } | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Load bot configuration
  useEffect(() => {
    const loadBotConfig = async () => {
      try {
        const response = await fetch('/api/telegram/config');
        if (response.ok) {
          const config = await response.json();
          setBotConfig(config);
        }
      } catch (error) {
        console.error('Failed to load bot config:', error);
      }
    };

    loadBotConfig();
  }, []);

  // Initialize Telegram Login Widget
  useEffect(() => {
    if (authMode === 'widget' && botConfig?.hasToken && botConfig?.botUsername !== 'your_bot_username_here') {
      loadTelegramWidget();
    }
  }, [authMode, botConfig]);

  const loadTelegramWidget = () => {
    if (!botConfig?.botUsername || botConfig.botUsername === 'your_bot_username_here') {
      onError?.(new Error('Telegram bot not configured. Please set TELEGRAM_BOT_USERNAME and TELEGRAM_BOT_TOKEN.'));
      return;
    }

    // Set up global callback
    window.TelegramLoginWidget = {
      onTelegramAuth: handleTelegramAuth
    };

    // Load Telegram widget script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botConfig.botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'TelegramLoginWidget.onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');

    if (widgetRef.current) {
      widgetRef.current.appendChild(script);
    }

    return () => {
      if (widgetRef.current) {
        widgetRef.current.innerHTML = '';
      }
      delete window.TelegramLoginWidget;
    };
  };

  const handleTelegramAuth = async (user: TelegramLoginData) => {
    try {
      setIsLoading(true);

      // Verify the authentication with our backend
      const response = await fetch('/api/telegram/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to verify Telegram authentication');
      }

      const data = await response.json();
      if (data.success) {
        onSuccess?.(data.user);
      } else {
        throw new Error('Authentication verification failed');
      }

    } catch (error) {
      console.error('Telegram auth error:', error);
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateQR = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/telegram/auth/qr', {
        method: 'POST',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate QR code');
      }
      
      const data = await response.json();
      setQrCode(data.qrCode);
      setSessionId(data.sessionId);
      setShowQR(true);
      
      // Note: QR polling removed to prevent 404 errors
      // In a real implementation, you'd use websockets or server-sent events
      
    } catch (error) {
      console.error('QR generation error:', error);
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneAuth = async () => {
    if (!phoneNumber.trim()) {
      onError?.(new Error('Phone number is required'));
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/telegram/auth/phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: phoneNumber.trim() })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send verification code');
      }
      
      const data = await response.json();
      setSessionId(data.sessionId);
      setIsPhoneStage('code');
      setShowPhoneAuth(true);
      
      // In development, show the auth code
      if (process.env.NODE_ENV === 'development' && data.authCode) {
        console.log('Development auth code:', data.authCode);
        alert(`Development mode: Your auth code is ${data.authCode}`);
      }
      
    } catch (error) {
      console.error('Phone auth error:', error);
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeVerification = async () => {
    if (!authCode.trim() || !sessionId) {
      onError?.(new Error('Verification code is required'));
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/telegram/auth/phone/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          sessionId, 
          code: authCode.trim() 
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Invalid verification code');
      }
      
      const data = await response.json();
      if (data.success && data.user) {
        onSuccess?.(data.user);
        resetForm();
      } else {
        throw new Error('Verification failed');
      }
      
    } catch (error) {
      console.error('Code verification error:', error);
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setShowQR(false);
    setShowPhoneAuth(false);
    setQrCode(null);
    setSessionId(null);
    setPhoneNumber('');
    setAuthCode('');
    setIsPhoneStage('number');
    if (widgetRef.current) {
      widgetRef.current.innerHTML = '';
    }
    if (authMode === 'widget' && botConfig?.hasToken) {
      setTimeout(loadTelegramWidget, 100);
    }
  };

  const handleCancel = () => {
    resetForm();
  };

  if (!botConfig) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="text-gray-500">Loading Telegram configuration...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!showQR && !showPhoneAuth && (
        <>
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setAuthMode('widget')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                authMode === 'widget' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              disabled={!botConfig.hasToken || botConfig.botUsername === 'your_bot_username_here'}
            >
              Login Widget
            </button>
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
              Phone
            </button>
          </div>

          {authMode === 'widget' && (
            <div className="space-y-4">
              {botConfig.hasToken && botConfig.botUsername !== 'your_bot_username_here' ? (
                <>
                  <div className="text-sm text-gray-600 mb-2">
                    Click the button below to authenticate with Telegram:
                  </div>
                  <div ref={widgetRef} className="telegram-widget-container" />
                  {isLoading && (
                    <div className="text-center text-sm text-gray-500">
                      Verifying authentication...
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-yellow-800 text-sm">
                    <strong>Configuration Required:</strong>
                    <br />
                    Please set your TELEGRAM_BOT_TOKEN and TELEGRAM_BOT_USERNAME environment variables to enable Telegram authentication.
                    <br />
                    <br />
                    <strong>Steps:</strong>
                    <br />
                    1. Create a bot with @BotFather on Telegram
                    <br />
                    2. Get your bot token and username
                    <br />
                    3. Add them to your .env.local file
                    <br />
                    4. Set domain for your bot using @BotFather (/setdomain command)
                  </div>
                </div>
              )}
            </div>
          )}

          {authMode === 'qr' && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Generate a QR code to authenticate with Telegram mobile app
              </div>
              <button
                onClick={generateQR}
                disabled={isLoading}
                className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                  isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } ${className}`}
              >
                {isLoading ? 'Generating...' : 'Generate QR Code'}
              </button>
            </div>
          )}

          {authMode === 'phone' && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Enter your phone number to receive a verification code
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={handlePhoneAuth}
                disabled={isLoading || !phoneNumber.trim()}
                className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                  isLoading || !phoneNumber.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } ${className}`}
              >
                {isLoading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </div>
          )}
        </>
      )}

      {showQR && qrCode && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">Scan QR Code</div>
            <div className="text-sm text-gray-600 mb-4">
              Scan this QR code with your Telegram app to authenticate
            </div>
            <div className="flex justify-center mb-4">
              <img src={qrCode} alt="QR Code" className="border rounded-lg" />
            </div>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showPhoneAuth && (
        <div className="space-y-4">
          {isPhoneStage === 'code' && (
            <>
              <div className="text-center">
                <div className="text-lg font-medium mb-2">Enter Verification Code</div>
                <div className="text-sm text-gray-600 mb-4">
                  Enter the 6-digit code sent to {phoneNumber}
                </div>
              </div>
              <input
                type="text"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-wider"
                disabled={isLoading}
                maxLength={6}
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleCodeVerification}
                  disabled={isLoading || authCode.length !== 6}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                    isLoading || authCode.length !== 6
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isLoading ? 'Verifying...' : 'Verify'}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
} 