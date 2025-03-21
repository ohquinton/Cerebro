'use client';
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Trophy, ChevronLeft, Bell, Brain } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardComingSoon() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Optional: Add countdown to estimated release
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  // Set client-side mounted state to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Set release date - adjust as needed
  useEffect(() => {
    // Skip on server-side to prevent hydration mismatch
    if (!mounted) return;
    
    const launchDate = new Date('2025-06-04T12:00:00-05:00');
    
    const updateTimer = () => {
      const now = new Date();
      const diff = launchDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft({ days, hours, minutes, seconds });
    };

    const timerId = setInterval(updateTimer, 1000);
    updateTimer();
    return () => clearInterval(timerId);
  }, [mounted]);
  
  // Handle email subscription
  const handleSubscribe = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      // In a real app, you would send this to your backend
      console.log('Subscribed email:', email);
      setIsSubscribed(true);
      setTimeout(() => setIsSubscribed(false), 5000);
      setEmail('');
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col items-center justify-center p-4">
      <div className="max-w-lg w-full bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 border border-gray-700 shadow-xl">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="animate-pulse w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
              <Clock className="text-green-400 h-10 w-10" />
            </div>
            {/* Animated rings */}
            <div className="absolute top-0 left-0 w-20 h-20 rounded-full border border-green-400/20 animate-ping" style={{ animationDuration: '3s' }}></div>
            <div className="absolute top-0 left-0 w-20 h-20 rounded-full border border-green-400/10 animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }}></div>
          </div>
        </div>
        
        <div className="text-center mb-3">
          <div className="inline-flex items-center px-4 py-1.5 bg-green-500/10 rounded-full border border-green-500/20">
            <Brain className="h-4 w-4 text-green-400 mr-2" />
            <span className="text-xs text-green-400 font-medium uppercase tracking-wide">Cerebro</span>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center text-white mb-4">
          Dashboard Coming Soon
        </h1>
        
        <p className="text-gray-300 text-center mb-6">
          We&apos;re building something awesome! The dashboard is currently under development and will be available soon.
        </p>
        
        {/* Countdown Timer */}
        {mounted ? (
          <div className="grid grid-cols-4 gap-2 mb-6">
            {Object.entries(timeLeft).map(([unit, value]) => (
              <div key={unit} className="bg-gray-800/80 rounded-lg p-2 text-center">
                <div className="text-xl font-bold text-white">{String(value).padStart(2, '0')}</div>
                <div className="text-xs text-gray-400 capitalize">{unit}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center mb-6">
            <div className="bg-gray-800/60 rounded-lg p-3 text-center w-full max-w-md">
              <p className="text-gray-400 text-sm">Loading countdown...</p>
            </div>
          </div>
        )}
        
        <div className="space-y-4 mb-8">
          <div className="flex items-center bg-gray-700/30 p-3 rounded-lg">
            <Calendar className="text-green-400 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-white font-medium">Launch Timeline</h3>
              <p className="text-gray-400 text-sm">We&apos;re putting the final touches on your dashboard experience</p>
            </div>
          </div>
          
          <div className="flex items-center bg-gray-700/30 p-3 rounded-lg">
            <Trophy className="text-green-400 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-white font-medium">Early Access</h3>
              <p className="text-gray-400 text-sm">Stay tuned for early access opportunities and beta testing</p>
            </div>
          </div>
          
          <div className="flex items-center bg-gray-700/30 p-3 rounded-lg">
            <Bell className="text-green-400 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-white font-medium">Get Notified</h3>
              <p className="text-gray-400 text-sm mb-2">Be the first to know when the dashboard is ready</p>
              
              {isSubscribed ? (
                <div className="flex items-center bg-green-500/20 p-2 rounded text-green-400 text-sm">
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  You&apos;ll be notified when we launch!
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex mt-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 bg-black/30 text-white text-sm rounded-l-md border border-gray-700 focus:ring-green-500 focus:border-green-500 p-2 outline-none"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white font-medium text-sm px-3 rounded-r-md transition-colors"
                  >
                    Notify Me
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => router.push('/')}
          className="w-full flex items-center justify-center gap-2 bg-transparent hover:bg-gray-700/50 text-green-400 py-3 px-4 rounded-lg transition-all border border-gray-700"
        >
          <ChevronLeft size={18} />
          Return to Home
        </button>
      </div>
    </div>
  );
}
