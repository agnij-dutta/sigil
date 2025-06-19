# Telegram Authentication Setup Guide

This guide will help you set up Telegram authentication for TipDAO using the **Telegram Login Widget** (the proper way for web applications).

## Important Changes Made

✅ **Fixed Issues:**
- Removed Bot API polling that was causing ETELEGRAM 404 errors
- Implemented proper Telegram Login Widget authentication
- Added proper error handling and configuration checks
- Removed dependency on QR code polling that doesn't work in production

## Prerequisites

1. **Create a Telegram Bot** (required for authentication)
2. **Set up your domain** for the Login Widget
3. **Configure environment variables**

## Step 1: Create a Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Start a chat with BotFather and send `/newbot`
3. Follow the prompts to:
   - Choose a name for your bot (e.g., "TipDAO Bot")
   - Choose a username for your bot (e.g., "tipdao_auth_bot")
4. Save the **bot token** you receive (looks like `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
5. Note the **bot username** (without the @ symbol)

## Step 2: Configure Bot for Web Authentication

1. In your chat with @BotFather, send `/setdomain`
2. Select your bot
3. Set your domain (for local development: `localhost`)
4. For production, use your actual domain (e.g., `tipdao.com`)

**Important:** This step is crucial for the Login Widget to work!

## Step 3: Update Environment Variables

Add these variables to your `.env.local` file:

```bash
# Telegram Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_BOT_USERNAME=your_bot_username_without_at_symbol

# Example:
# TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
# TELEGRAM_BOT_USERNAME=tipdao_auth_bot
```

## Step 4: How the New Authentication Works

### Three Authentication Methods Available:

1. **Telegram Login Widget** (Recommended for production)
   - Uses official Telegram Login Widget
   - Secure and verified by Telegram
   - Works in all browsers
   - No polling or 404 errors

2. **QR Code** (Demo only)
   - Generates a simple QR code
   - For demonstration purposes
   - In production, you'd integrate with a real QR service

3. **Phone Number** (Development only)
   - Mock verification for development
   - Shows auth codes in development mode
   - Not for production use

### Authentication Flow:

1. User clicks "Login with Telegram" widget
2. Telegram redirects to official authentication page
3. User authorizes the app in Telegram
4. Telegram sends verified user data back to your app
5. Your backend verifies the data using the bot token
6. User is authenticated

## Step 5: Test the Setup

1. Start your development server: `npm run dev`
2. Go to the authentication page
3. You should see:
   - If properly configured: A Telegram Login Widget button
   - If not configured: A yellow warning box with setup instructions

## Step 6: Production Deployment

For production deployment:

1. Set your actual domain with @BotFather using `/setdomain`
2. Update `TELEGRAM_BOT_TOKEN` and `TELEGRAM_BOT_USERNAME` in production environment
3. The Login Widget will automatically work with your production domain

## Security Features

✅ **Implemented Security Measures:**
- HMAC-SHA256 verification of all authentication data
- Timestamp validation (24-hour expiry)
- Bot token validation
- Input sanitization and validation
- No sensitive data stored in localStorage

## Troubleshooting

### Common Issues:

1. **"Configuration Required" message:**
   - Check that `TELEGRAM_BOT_TOKEN` is set and not placeholder
   - Check that `TELEGRAM_BOT_USERNAME` is set correctly (without @)
   - Restart your development server after updating .env.local

2. **Login Widget doesn't appear:**
   - Domain not set with @BotFather (use `/setdomain`)
   - Bot token is invalid or revoked
   - Check browser console for errors

3. **Authentication fails:**
   - Bot token might be wrong
   - Domain mismatch (localhost vs. actual domain)
   - Check server logs for verification errors

4. **404 errors (should be fixed now):**
   - The old polling system has been removed
   - New implementation doesn't use polling
   - If you still see 404s, check for old code or restart the server

## Development vs Production

### Development:
- Domain: `localhost`
- Phone auth shows codes in alerts
- QR codes are simple placeholders

### Production:
- Domain: Your actual domain (set with @BotFather)
- Only Login Widget authentication recommended
- All mock features disabled

## Additional Notes

- The Login Widget is the **official and recommended** way for web applications
- Bot API is primarily for bots that send/receive messages, not web authentication
- This implementation follows Telegram's official guidelines
- No more polling = no more 404 errors = better performance

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check the server logs for authentication failures  
3. Verify your bot configuration with @BotFather
4. Ensure environment variables are correctly set 