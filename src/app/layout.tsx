import type { Metadata, Viewport } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import Navbar from "@/components/navbar";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Aviator Signals Kenya - Betika Pepeta Odibet Melbet Signals",
  description: "95% accurate Aviator game crash predictions. Packages from KSH 100 for 10 minutes signals.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-black text-white min-h-screen flex flex-col`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}

