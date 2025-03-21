'use client';

import React, { useEffect, useState, ReactNode } from 'react';

/**
 * A wrapper component that handles hydration issues by:
 * 1. Only rendering children on the client-side
 * 2. Adding suppressHydrationWarning to the wrapper div
 */
export default function SuppressHydration({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return (
    <div suppressHydrationWarning={true} data-is-client={isClient}>
      {isClient ? children : <div>Loading...</div>}
    </div>
  );
}
