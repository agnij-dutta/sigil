import { createCivicAuthPlugin } from "@civic/auth/nextjs"
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
  clientId: "5d40dfe1-7677-4fbf-9391-f7b36b7e6575"
});

export default withCivicAuth(nextConfig)
