'use client';

import { useEffect } from 'react';

export default function MSWBoot() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Start Mock Service Worker only in the browser during development
      import('@/mocks/browser')
        .then(({ worker }) =>
          worker.start({ serviceWorker: { url: '/mockServiceWorker.js' } })
        )
        .catch((e) => console.error('[MSW] failed to start:', e));
    }
  }, []);

  return null;
}