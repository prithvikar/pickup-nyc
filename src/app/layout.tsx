import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/ui/navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pickup NYC",
  description: "Find pickup tennis & pickleball games in NYC",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-glass-black text-white antialiased`}>
        <main className="min-h-screen relative pb-24">
          {children}
        </main>
        <Navbar />
      </body>
    </html>
  );
}
