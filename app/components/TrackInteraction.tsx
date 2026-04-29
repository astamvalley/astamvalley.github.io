'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { sendGAEvent } from '@next/third-parties/google';

const TRACKED_PREFIXES = ['/labs/', '/craft/', '/games/', '/audio'];

export default function TrackInteraction() {
  const pathname = usePathname();

  useEffect(() => {
    const isTracked = TRACKED_PREFIXES.some((p) => pathname.startsWith(p));
    if (!isTracked) return;

    const sessionKey = `interacted:${pathname}`;
    if (sessionStorage.getItem(sessionKey)) return;

    const eventName = pathname.startsWith('/games/') ? 'game_start' : 'demo_interact';

    let fired = false;
    const handler = () => {
      if (fired) return;
      fired = true;
      sessionStorage.setItem(sessionKey, '1');
      sendGAEvent('event', eventName, { demo: pathname });
    };

    window.addEventListener('pointerdown', handler, { once: true, passive: true });
    window.addEventListener('keydown', handler, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handler);
      window.removeEventListener('keydown', handler);
    };
  }, [pathname]);

  return null;
}
