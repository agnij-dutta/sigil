import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import CivicAuthClientProvider from "@/components/providers/CivicAuthClientProvider";
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
  title: "TipDAO - Connect & Collaborate",
  description: "A platform for meaningful connections and collaborative work",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CivicAuthClientProvider>
          {children}
        </CivicAuthClientProvider>
      </body>
    </html>
  );
}
