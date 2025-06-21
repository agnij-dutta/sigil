import { createCivicAuthPlugin } from "@civic/auth-web3/nextjs"
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["@civic/auth"],
  env: {
    CIVIC_CLIENT_ID: process.env.CIVIC_CLIENT_ID,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  }
};

const withCivicAuth = createCivicAuthPlugin({
  clientId: process.env.NEXT_PUBLIC_CIVIC_CLIENT_ID || "5d40dfe1-7677-4fbf-9391-f7b36b7e6575",
  loginSuccessUrl: "/dashboard",
  include: ["/dashboard/*", "/api/protected/*"],
  exclude: ["/", "/api/auth/*", "/api/github/*"],
});

export default withCivicAuth(nextConfig)
