'use client';
import React, { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/api/supabase';
import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
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
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
          <p className="text-lg">Checking authentication status...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center text-white relative overflow-hidden">
      {/* Back button */}
      <button
        onClick={handleBackClick}
        className="absolute top-6 left-6 z-50 text-green-300 hover:text-white flex items-center transition-colors duration-300 px-3 py-2 rounded-md hover:bg-gray-800/50"
      >
        <ChevronLeft size={20} className="mr-1" />
        <span>Back</span>
      </button>
      
      {/* Registration Form Container */}
      <div className="relative z-10 max-w-md w-full mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-5">
            <div className="relative w-24 h-24">
              <Image
                src="/gptcc.png"
                alt="Cerebro Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-blue-500 filter">
            Create Your Account
          </h1>
          <p className="text-gray-300 mb-2">Where Intelligence Meets Competition.</p>
        </div>
        
        <div className="bg-gray-900/80 backdrop-blur-xl p-6 rounded-xl border border-gray-700 shadow-xl transition-all duration-300">
          <RegisterForm />
        </div>
        
        <div className="mt-8 text-center">
          <div className="text-gray-400 text-xs flex items-center justify-center space-x-2 mb-3">
            <div className="w-16 h-px bg-gray-700"></div>
            <span>PROTECTED BY ENCRYPTION</span>
            <div className="w-16 h-px bg-gray-700"></div>
          </div>
          
          <div className="flex justify-center space-x-6 text-gray-400 text-xs">
            <a href="/privacy" className="hover:text-green-400 transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-green-400 transition-colors">Terms of Service</a>
            <a href="/help" className="hover:text-green-400 transition-colors">Help Center</a>
          </div>
        </div>
      </div>
    </div>
  );
}