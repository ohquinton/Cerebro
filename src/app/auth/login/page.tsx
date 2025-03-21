'use client';
import React, { useEffect, useState, Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';
import { ChevronLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/api/supabase';

// Separate component that uses useSearchParams to allow for Suspense wrapping
function LoginPageContent() {
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
  }, [router, returnTo]);
  
  // Handle form submission success
  const handleLoginSuccess = () => {
    console.log('Login successful, will redirect to:', returnTo);
    // No need to do anything here - the LoginForm component handles the redirect
  };
  
  // Determine back button destination
  const handleBackClick = () => {
    // If returnTo is a valid path that's not the dashboard or an auth page
    if (returnTo && 
        returnTo !== '/' && 
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-lg">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center text-white relative overflow-hidden">
      {/* Back button */}
      <button
        onClick={handleBackClick}
        className="absolute top-6 left-6 z-50 text-green-300 hover:text-white flex items-center transition-colors"
      >
        <ChevronLeft size={20} className="mr-1" />
        <span>Back</span>
      </button>
      
      {/* Login Form */}
      <div className="relative z-50 max-w-md w-full mx-auto px-4">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-5">
            <div className="relative w-24 h-24">
              <Image
                src="/gptcc.png"
                alt="Cerebro Logo"
                fill
                className="object-contain drop-shadow-glow"
                priority
              />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-blue-500 filter drop-shadow-glow">
            Welcome Back
          </h1>
          <p className="text-gray-300">Sign in to your account.</p>
          {returnTo && returnTo !== '/' && (
            <p className="text-sm text-green-400 mt-2">
              You&apos;ll be redirected back after login
            </p>
          )}
        </div>
        
        {authError && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-400 text-sm">
            Authentication error: {authError}
          </div>
        )}
        
        <div className="bg-gray-900/90 backdrop-blur-xl p-6 rounded-xl border border-green-500/40 shadow-2xl shadow-green-500/20">
          <LoginForm 
            redirectPath={returnTo} 
            onSuccess={handleLoginSuccess}
          />
          
          {/* Register option */}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Don&apos;t have an account?{' '}
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  router.push(`/auth/register?returnTo=${encodeURIComponent(returnTo)}`);
                }} 
                className="text-green-400 hover:text-green-300 font-medium"
              >
                Sign Up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component with hydration suppression directly applied
export default function LoginPage() {
  return (
    <div suppressHydrationWarning={true}>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 to-gray-900">
        <div className="text-white text-xl">Loading login page...</div>
      </div>}>
        <LoginPageContent />
      </Suspense>
    </div>
  );
}
