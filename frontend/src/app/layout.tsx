import type { Metadata } from "next";
import "./globals.css";
import RootLayoutClient from "@/components/layout/RootLayoutClient";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QuickFi - Decentralized Insurance-backed Loans",
  description: "Get instant USDC loans backed by your tokenized insurance policies on Pharos Network",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="quickfi" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
