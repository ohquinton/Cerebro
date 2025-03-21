'use client';

import React, { useState, useEffect, ReactNode } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * A wrapper component that only renders its children on the client-side
 * This prevents hydration errors from mismatched server/client rendering
 */
export default function ClientOnly({ 
  children, 
  fallback = (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 to-gray-900">
      <div className="text-white text-xl">Loading...</div>
    </div>
  ) 
}: ClientOnlyProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return isClient ? children : fallback;
}
