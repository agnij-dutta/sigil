'use client';

import { useState } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  phone_number?: string;
  is_bot?: boolean;
  language_code?: string;
}

interface TelegramAuthButtonProps {
  className?: string;
  onSuccess?: (user: TelegramUser, sessionString: string) => void;
  onError?: (error: string) => void;
}

type AuthStep = 'start' | 'phone' | 'code' | 'password' | 'success' | 'error';

export default function TelegramAuthButton({ 
  className = '', 
  onSuccess,
  onError 
}: TelegramAuthButtonProps) {
  const [step, setStep] = useState<AuthStep>('start');
  const [sessionId, setSessionId] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [user, setUser] = useState<TelegramUser | null>(null);

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setStep('error');
    onError?.(errorMessage);
  };

  const startAuth = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/telegram/auth/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.error) {
        handleError(data.error);
        return;
      }

      setSessionId(data.sessionId);
      setStep('phone');
    } catch (error) {
      handleError('Failed to start authentication');
    } finally {
      setLoading(false);
    }
  };

  const sendPhoneNumber = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/telegram/auth/phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          phoneNumber: phoneNumber.trim()
        }),
      });

      const data = await response.json();

      if (data.error) {
        handleError(data.error);
        return;
      }

      if (data.success) {
        setStep('code');
      } else {
        handleError('Failed to send verification code');
      }
    } catch (error) {
      handleError('Failed to send phone number');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/telegram/auth/phone/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          code: code.trim()
        }),
      });

      const data = await response.json();

      if (data.error) {
        if (data.needsPassword) {
          setStep('password');
          setError('Two-factor authentication required');
        } else {
          handleError(data.error);
        }
        return;
      }

      if (data.success && data.user && data.sessionString) {
        setUser(data.user);
        setStep('success');
        onSuccess?.(data.user, data.sessionString);
      } else {
        handleError('Failed to verify code');
      }
    } catch (error) {
      handleError('Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const verifyPassword = async () => {
    if (!password.trim()) {
      setError('Please enter your 2FA password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/telegram/auth/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          password: password.trim()
        }),
      });

      const data = await response.json();

      if (data.error) {
        handleError(data.error);
        return;
      }

      if (data.success && data.user && data.sessionString) {
        setUser(data.user);
        setStep('success');
        onSuccess?.(data.user, data.sessionString);
      } else {
        handleError('Failed to verify password');
      }
    } catch (error) {
      handleError('Failed to verify password');
    } finally {
      setLoading(false);
    }
  };

  const resetAuth = () => {
    setStep('start');
    setSessionId('');
    setPhoneNumber('');
    setCode('');
    setPassword('');
    setError('');
    setUser(null);
  };

  if (step === 'start') {
    return (
      <button
        onClick={startAuth}
        disabled={loading}
        className={`
          inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium
          transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${loading 
            ? 'bg-gray-400 cursor-not-allowed text-white' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
          }
          ${className}
        `}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
        </svg>
        Connect with Telegram
      </button>
    );
  }

  if (step === 'success') {
    return (
      <div className={`text-green-600 ${className}`}>
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Connected as {user?.first_name} {user?.last_name}</span>
        </div>
        <button 
          onClick={resetAuth}
          className="mt-2 text-sm text-blue-500 hover:text-blue-700"
        >
          Connect different account
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {step === 'phone' && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Enter your phone number</h3>
          <p className="text-sm text-gray-600">
            We'll send you a verification code via Telegram
          </p>
          <div className="flex space-x-2">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              onClick={sendPhoneNumber}
              disabled={loading}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? 'Sending...' : 'Send Code'}
            </button>
          </div>
        </div>
      )}

      {step === 'code' && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Enter verification code</h3>
          <p className="text-sm text-gray-600">
            Check your Telegram app for the verification code
          </p>
          <div className="flex space-x-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="12345"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              onClick={verifyCode}
              disabled={loading}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </div>
      )}

      {step === 'password' && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Enter 2FA password</h3>
          <p className="text-sm text-gray-600">
            Your account has two-factor authentication enabled
          </p>
          <div className="flex space-x-2">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your 2FA password"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              onClick={verifyPassword}
              disabled={loading}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </div>
      )}

      {error && step !== 'password' && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={resetAuth}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        ← Back to start
      </button>
    </div>
  );
}