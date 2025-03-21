'use client';

import React, { useEffect, useState, ReactNode } from 'react';

/**
 * A wrapper component that handles hydration issues by:
 * 1. Only rendering children on the client-side
 * 2. Adding suppressHydrationWarning to the wrapper div
 * 3. Using useLayoutEffect to clean up browser extension attributes
 */
export default function SuppressHydration({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  
  // Use effect to mark client-side rendering
  useEffect(() => {
    setIsClient(true);
    
    // Handle browser extension attributes that can cause hydration errors
    const handleBodyAttributes = () => {
      try {
        const body = document.querySelector('body');
        if (body) {
          // Remove known problematic attributes added by browser extensions
          if (body.hasAttribute('cz-shortcut-listen')) {
            body.removeAttribute('cz-shortcut-listen');
          }
        }
      } catch (error) {
        console.warn('Error handling body attributes:', error);
      }
    };
    
    // Run immediately and set up an observer for future changes
    handleBodyAttributes();
    
    // Set up a mutation observer to catch dynamically added attributes
    try {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          if (mutation.type === 'attributes' && 
              mutation.attributeName === 'cz-shortcut-listen') {
            handleBodyAttributes();
          }
        });
      });
      
      const body = document.querySelector('body');
      if (body) {
        observer.observe(body, { attributes: true });
      }
      
      // Clean up observer on unmount
      return () => observer.disconnect();
    } catch (error) {
      console.warn('Error setting up mutation observer:', error);
    }
  }, []);
  
  return (
    <div suppressHydrationWarning={true} data-is-client={isClient}>
      {isClient ? children : <div>Loading...</div>}
    </div>
  );
}
