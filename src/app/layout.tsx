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

// Script to remove problematic browser extension attributes (server component)
const inlineScript = `
  (function() {
    try {
      // Clean up known browser extension attributes
      const observer = new MutationObserver(function(mutations) {
        for (const mutation of mutations) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'cz-shortcut-listen') {
            const target = mutation.target;
            if (target && target.removeAttribute) {
              target.removeAttribute('cz-shortcut-listen');
            }
          }
        }
      });
      
      // Start observing once the DOM is ready
      document.addEventListener('DOMContentLoaded', function() {
        observer.observe(document.body, { attributes: true, subtree: true });
        
        // Immediate cleanup for any existing attributes
        if (document.body.hasAttribute('cz-shortcut-listen')) {
          document.body.removeAttribute('cz-shortcut-listen');
        }
      });
    } catch (e) {
      // Silent fail - don't affect user experience if this doesn't work
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: inlineScript }} />
      </head>
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
