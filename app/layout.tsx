import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import Nav from "./components/Nav";
import TrackInteraction from "./components/TrackInteraction";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "astamvalley",
  description: "Personal lab & playground",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6048532485731496"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="bg-[#0a0a0a] text-zinc-300 min-h-screen antialiased overflow-x-hidden">
        <div className="border-t-2 border-orange-400/80" />
        <Nav />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
          {children}
        </main>
        <footer className="max-w-3xl mx-auto px-4 sm:px-6 pb-10 text-[11px] font-mono text-zinc-700">
          astamvalley
        </footer>
        <TrackInteraction />
      </body>
      <GoogleAnalytics gaId="G-XP02S16YV1" />
    </html>
  );
}
