import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
      <body className="bg-[#0a0a0a] text-zinc-300 min-h-screen antialiased">
        <div className="border-t-2 border-orange-400/80" />
        <nav className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <a href="/" className="font-mono text-sm font-semibold text-zinc-100 hover:text-orange-300 transition-colors">
            astamvalley
          </a>
          <div className="flex items-center gap-5">
            <a href="#labs" className="text-xs font-mono text-zinc-500 hover:text-zinc-200 transition-colors">
              Labs
            </a>
            <a href="#games" className="text-xs font-mono text-zinc-500 hover:text-zinc-200 transition-colors">
              Games
            </a>
            <a
              href="https://astamvalley.github.io/claude-foundation"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-zinc-500 hover:text-orange-300 transition-colors"
            >
              Skills ↗
            </a>
            <a
              href="https://github.com/astamvalley"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              GitHub ↗
            </a>
          </div>
        </nav>
        <main className="max-w-3xl mx-auto px-6 pb-20">
          {children}
        </main>
        <footer className="max-w-3xl mx-auto px-6 pb-10 text-[11px] font-mono text-zinc-700">
          astamvalley
        </footer>
      </body>
    </html>
  );
}
