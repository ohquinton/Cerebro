'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import SuppressHydration from '@/components/common/SuppressHydration';

// Import the component with ssr:false to prevent hydration issues
const SubscriptionPage = dynamic(
  () => import('../../components/subscribe/SubscriptionPage'), 
  { ssr: false }
);

// Main component with hydration suppression
export default function SubscribePage() {
  return (
    <SuppressHydration>
      <SubscriptionPage />
    </SuppressHydration>
  );
}
