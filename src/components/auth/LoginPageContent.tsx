'use client';
import React, { useEffect, useState } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import { ChevronLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/api/supabase';

export default function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/';
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsCheckingAuth(true);
        
        // First check if session exists
        const { error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking session:', error.message);
          setAuthError(error.message);
          setIsCheckingAuth(false);
          return;
        }
        
        // Don't auto-redirect when already authenticated, just show the login form
        // This allows users to explicitly login even if they have a session
        setIsCheckingAuth(false);
      } catch (error) {
        console.error('Auth check error:', error);
        setAuthError(
          error instanceof Error ? error.message : 'An unknown error occurred'
        );
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Handle back button click
  const handleBackClick = () => {
    if (returnTo && !returnTo.startsWith('/auth')) {
      router.push(returnTo);
    } else {
      router.push('/');
    }
  };
  
  // Show loading state
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
      
      {/* Main content */}
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md flex flex-col items-center">
          {/* Logo */}
          <div className="mb-8">
            <Image
              src="/logo-white.svg"
              alt="Logo"
              width={150}
              height={40}
              priority
            />
          </div>
          
          {/* Error alert */}
          {authError && (
            <div className="w-full mb-6 p-4 bg-red-900/50 border border-red-800 rounded-lg text-white">
              <p className="text-sm">{authError}</p>
            </div>
          )}
          
          {/* Login card */}
          <div className="w-full bg-gray-900/80 backdrop-blur-xl p-6 rounded-xl border border-gray-700 shadow-xl">
            <LoginForm redirectPath={returnTo} />
          </div>
          
          {/* Register link */}
          <div className="mt-8 text-center">
            <p className="text-gray-400">Don&apos;t have an account?</p>
            <button
              onClick={() => router.push(`/auth/register?returnTo=${encodeURIComponent(returnTo)}`)}
              className="mt-2 text-blue-400 hover:text-blue-300 transition"
            >
              Create an account
            </button>
          </div>
          
          {/* Support links */}
          <div className="mt-8 flex space-x-6 text-gray-500 text-sm">
            <button onClick={() => router.push('/help')} className="hover:text-gray-300 transition">
              Help
            </button>
            <button onClick={() => router.push('/privacy')} className="hover:text-gray-300 transition">
              Privacy
            </button>
            <button onClick={() => router.push('/terms')} className="hover:text-gray-300 transition">
              Terms
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
