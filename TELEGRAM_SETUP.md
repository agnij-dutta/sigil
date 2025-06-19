# Telegram User Authentication Setup Guide

This guide will help you set up **Telegram User Authentication** for TipDAO using **GramJS** - allowing users to authenticate with their actual Telegram accounts (not bots).

## 🎯 What Changed

✅ **NEW: Real User Authentication**
- Users authenticate with their **actual Telegram accounts**
- Phone number + verification code flow
- Support for 2FA/two-factor authentication
- Session management with MTProto

❌ **REMOVED: Bot Authentication Issues**
- No more bot polling errors (ETELEGRAM 404)
- No more QR code complications
- No more bot token dependencies

## 📋 Prerequisites

To use Telegram User Authentication, you need:

1. **Telegram API credentials** (not bot token)
2. **Development environment** setup

## 🔑 Step 1: Get Telegram API Credentials

### Option A: Create New App (Recommended)

1. Go to https://my.telegram.org/apps
2. Sign in with your phone number
3. Click "Create Application"
4. Fill out the form:
   - **App title**: `TipDAO` (or your app name)
   - **Short name**: `tipdao` (unique identifier)
   - **Platform**: `Web`
   - **Description**: `Telegram authentication for TipDAO`
5. Copy your **API ID** and **API Hash**

### Option B: Use Existing App

If you already have a Telegram app:
1. Go to https://my.telegram.org/apps
2. Find your existing app
3. Copy the **API ID** and **API Hash**

## ⚙️ Step 2: Configure Environment Variables

Update your `.env.local` file:

```bash
# Telegram User Authentication Configuration
TELEGRAM_API_ID=1234567
TELEGRAM_API_HASH=abcdef1234567890abcdef1234567890
```

**Important Notes:**
- Replace with your actual credentials from my.telegram.org
- Keep these credentials secret and secure
- Don't commit them to version control

## 🧪 Step 3: Test the Implementation

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to your app** (usually http://localhost:3000)

3. **Click "Connect with Telegram"**

4. **Follow the authentication flow:**
   - Enter your phone number (with country code, e.g., +1234567890)
   - Check Telegram app for verification code
   - Enter the verification code
   - If you have 2FA enabled, enter your 2FA password

5. **Success!** You should see your Telegram user info displayed

## 🔒 Authentication Flow Details

### Step 1: Phone Number
- User enters their phone number
- System sends verification code via Telegram

### Step 2: Verification Code
- User receives code in their Telegram app
- User enters the code to verify their phone

### Step 3: 2FA Password (if enabled)
- If user has 2FA enabled, they enter their password
- This step is skipped for users without 2FA

### Step 4: Success
- User is authenticated and session is created
- Session string is saved for future use

## 🛡️ Security Features

✅ **Session Management**
- Secure session strings using MTProto protocol
- Automatic session cleanup after 30 minutes
- Client disconnection on session end

✅ **Validation**
- Phone number format validation
- Code expiration handling
- 2FA password verification

✅ **Error Handling**
- Proper error messages for each step
- Graceful handling of network issues
- Session state management

## 🚀 Production Deployment

### Environment Variables
Ensure these are set in production:
```bash
TELEGRAM_API_ID=your_production_api_id
TELEGRAM_API_HASH=your_production_api_hash
```

### Security Considerations
1. **HTTPS Required**: Telegram requires HTTPS in production
2. **Rate Limiting**: Implement rate limiting for authentication endpoints
3. **Session Storage**: Consider Redis or database for session persistence
4. **Monitoring**: Monitor authentication success/failure rates

## 🔧 API Endpoints

The following endpoints are available:

- `POST /api/telegram/auth/start` - Start authentication flow
- `POST /api/telegram/auth/phone` - Send phone number
- `POST /api/telegram/auth/phone/verify` - Verify phone code
- `POST /api/telegram/auth/password` - Verify 2FA password
- `POST /api/telegram/auth/validate` - Validate existing session

## 🐛 Troubleshooting

### "API ID/Hash not set" Error
- Check your `.env.local` file has the correct variables
- Restart your development server after adding variables

### "Invalid phone number" Error
- Include country code (e.g., +1 for US)
- Remove any spaces or special characters except +

### "Code expired" Error
- Request a new code
- Codes typically expire after 5 minutes

### "Invalid password" Error
- Make sure you're entering your Telegram 2FA password
- This is different from your Telegram login code

### "Session invalid" Error
- The session may have expired
- Start a new authentication flow

## 🔄 Migration from Bot Auth

If you were using the old bot authentication:

1. **Remove bot tokens** from environment variables
2. **Add API credentials** as shown above
3. **Update your frontend** to use the new authentication flow
4. **Test thoroughly** with real phone numbers

## 📚 Technical Details

### Library Used
- **GramJS**: Official TypeScript MTProto client for Telegram
- **MTProto Protocol**: Telegram's native protocol for user authentication

### Session Management
- Sessions are stored in memory during development
- Consider Redis or database storage for production
- Automatic cleanup prevents memory leaks

### Error Codes
- `PHONE_NUMBER_INVALID`: Invalid phone number format
- `PHONE_CODE_INVALID`: Invalid verification code
- `SESSION_PASSWORD_NEEDED`: 2FA required
- `PASSWORD_HASH_INVALID`: Invalid 2FA password

## 💡 Tips for Development

1. **Use your own phone number** for testing
2. **Enable 2FA** on your test account to test that flow
3. **Check Telegram app** for verification codes (they arrive instantly)
4. **Clear sessions** if you encounter issues

## 🆘 Need Help?

If you encounter issues:

1. **Check the console** for detailed error messages
2. **Verify environment variables** are correctly set
3. **Ensure phone number format** includes country code
4. **Try with a different phone number** to isolate issues

The new implementation provides a much more robust and user-friendly authentication experience compared to the previous bot-based approach! 