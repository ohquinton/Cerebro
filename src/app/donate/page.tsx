'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import ClientOnly from '@/components/common/ClientOnly';

// Import the component with ssr:false to prevent hydration issues
const DonationPage = dynamic(
  () => import('@/components/donate/DonationPage'),
  { ssr: false }
);

// Main page component with client-only rendering
export default function DonatePage() {
  return (
    <ClientOnly fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 to-gray-900">
        <div className="text-white text-xl">Loading donation page...</div>
      </div>
    }>
      <DonationPage />
    </ClientOnly>
  );
}