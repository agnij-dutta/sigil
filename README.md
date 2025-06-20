# Sigil - Connect & Collaborate

A Web3-native hiring passport for developers that enables them to generate verifiable, privacy-preserving proofs of their real GitHub contributions. A modern platform for meaningful connections and collaborative work, built with Next.js.

## Overview

Sigil helps developers discover and connect with others who share their interests, collaborate on projects, and build lasting professional relationships. The platform focuses on human-centered design and meaningful connections.

## Features

- **GitHub Integration**: Connect your GitHub account to discover repositories, track contributions, and find collaborators
- **Web3 Identity**: Secure, decentralized authentication using wallet-based identity (coming soon)
- **Repository Collaboration**: Access issues, pull requests, and contribution tracking
- **Meaningful Connections**: Build professional relationships through shared interests and projects

## Getting Started

First, copy the environment variables:

```bash
cp env.example .env.local
```

Configure your environment variables in `.env.local`:
- `CIVIC_CLIENT_ID` and `CIVIC_CLIENT_SECRET`: For Web3 authentication
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`: For GitHub OAuth
- `JWT_SECRET`: For session management

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Authentication**: Civic Auth for Web3, GitHub OAuth
- **Styling**: Tailwind CSS
- **TypeScript**: Full type safety

## Development

The main application code is in `src/app/page.tsx`. The page auto-updates as you edit files.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
