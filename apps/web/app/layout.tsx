import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "../components/AuthProvider";
import { SocketProvider } from "../components/SocketProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "SkillSwap — Peer-to-Peer Skill Exchange for College Students",
  description: "Learn coding, design, music, sports, and language directly from fellow students. Swap your knowledge in a decentralized skill marketplace.",
  keywords: "Skill swap, student marketplace, peer learning, college networking, React, Figma, study trade",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} font-sans bg-background text-foreground antialiased min-h-screen`}>
        <AuthProvider>
          <SocketProvider>
            {children}
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
