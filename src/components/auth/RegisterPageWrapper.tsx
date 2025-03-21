'use client';
import React, { useEffect, useState } from 'react';
import RegisterForm from '@/components/auth/RegisterForm';
import { ChevronLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/api/supabase';

export default function RegisterPageWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/dashboard';
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsCheckingAuth(true);
        const { data } = await supabase.auth.getSession();
        
        // If user is already logged in, show a brief message before continuing
        if (data.session) {
          // Maybe show a message or option to log out first
          // But we still allow registration of a new account
        }
        
        setIsCheckingAuth(false);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error';
        console.error('Auth check error:', errorMessage);
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Determine back button destination
  const handleBackClick = () => {
    // If returnTo is a valid path that's not the dashboard or an auth page
    if (returnTo && 
        returnTo !== '/dashboard' && 
        !returnTo.includes('/login') && 
        !returnTo.includes('/register')) {
      // Extract the base path (remove query parameters)
      const basePath = returnTo.split('?')[0];
      router.push(basePath);
    } else {
      // Default to home
      router.push('/');
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center text-white">
        <div className="animate-pulse">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-gray-900 flex flex-col">
      {/* Top bar with back button */}
      <div className="p-4">
        <button
          onClick={handleBackClick}
          className="flex items-center text-gray-300 hover:text-white transition"
        >
          <ChevronLeft className="mr-1" size={16} />
          Back
        </button>
      </div>
      
      {/* Main content - centered card */}
      <div className="flex flex-1 items-center justify-center px-4 py-2">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <Image
              src="/logo-white.svg"
              alt="Logo"
              width={150}
              height={40}
              priority
            />
          </div>
          
          {/* Heading */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Create Your Account</h1>
            <p className="mt-2 text-gray-400">Join the gaming revolution</p>
          </div>
          
          <div className="bg-gray-900/80 backdrop-blur-xl p-6 rounded-xl border border-gray-700 shadow-xl transition-all duration-300">
            <RegisterForm />
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-gray-400">Already have an account?</p>
            <button
              onClick={() => router.push(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`)}
              className="mt-2 text-blue-400 hover:text-blue-300 transition"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
