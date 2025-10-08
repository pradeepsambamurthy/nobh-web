import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MSWBoot from "./_msw";
import { QueryProvider } from "@/lib/api/query";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NoBrokerHood Plus",
  description: "Admin Portal for HOA Management",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Starts MSW only in dev, only in the browser */}
        <MSWBoot />
        {/* React Query context for your pages/components */}
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}