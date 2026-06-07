import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Optimizer — ATS Resume Analysis",
    template: "%s | Optimizer",
  },
  description:
    "Upload your resume, analyze ATS score, find missing keywords, and get actionable suggestions to optimize your resume for any job role.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full dark antialiased`}>
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "oklch(0.17 0.01 260)",
              color: "oklch(0.95 0.005 260)",
              border: "1px solid oklch(0.28 0.01 260 / 0.5)",
              borderRadius: "0.625rem",
              fontSize: "0.8125rem",
            },
          }}
        />
      </body>
    </html>
  );
}
