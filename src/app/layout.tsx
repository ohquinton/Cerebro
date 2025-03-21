import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SuppressHydration from "@/components/common/SuppressHydration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cerebro - Skill-Based Competition Platform",
  description: "Challenge your skills and compete with others in stock market simulations, coding challenges, logic puzzles, and more.",
  icons: {
    icon: [
      { url: "/gptcc.png", type: "image/png" }
    ],
    apple: { url: "/gptcc.png", type: "image/png" },
    shortcut: { url: "/gptcc.png" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <SuppressHydration>
          {children}
        </SuppressHydration>
      </body>
    </html>
  );
}
