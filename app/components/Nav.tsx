'use client';

import { sendGAEvent } from '@next/third-parties/google';

const track = (menu: string) => {
  sendGAEvent('event', 'menu_click', { menu });
};

export default function Nav() {
  return (
    <nav className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
      <a
        href="/"
        onClick={() => track('home')}
        className="font-mono text-sm font-semibold text-zinc-100 hover:text-orange-300 transition-colors"
      >
        astamvalley
      </a>
      <div className="flex items-center gap-3 sm:gap-5">
        <a
          href="/"
          onClick={() => track('lab')}
          className="text-xs font-mono text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          Lab
        </a>
        <a
          href="/docs"
          onClick={() => track('docs')}
          className="text-xs font-mono text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          Docs
        </a>
        <a
          href="https://astamvalley.github.io/claude-foundation"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('skills')}
          className="text-xs font-mono text-zinc-500 hover:text-orange-300 transition-colors"
        >
          Skills ↗
        </a>
        <a
          href="https://github.com/astamvalley"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('github')}
          className="text-xs font-mono text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          GitHub ↗
        </a>
      </div>
    </nav>
  );
}
