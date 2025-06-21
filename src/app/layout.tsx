import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CivicAuthClientProvider } from "@/components/providers/CivicAuthClientProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sigil - Verifiable Developer Credentials",
  description: "Transform your GitHub contributions into verifiable credentials. Build trust, showcase expertise, and unlock new opportunities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <CivicAuthClientProvider>
            {children}
          </CivicAuthClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
