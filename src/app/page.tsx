'use client';
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ChevronRight, TrendingUp, Zap, Trophy, Mail, Bell, Gift, Users, BarChart2, Medal, Layers, Smartphone, Brain, Calculator, Code, Check, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/api/supabase';
import { ProfileIconSelector } from '@/components/ProfileIconSelector';
import Image from 'next/image';

// Define TypeScript interfaces
interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface SectionVisibility {
  features: boolean;
  giveaway: boolean;
  platforms: boolean;
  howItWorks: boolean;
  gameModes: boolean;
  pricing: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface GameModeItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string[];
  buttonText: string;
  highlighted: boolean;
}

// Throttle function to improve scroll performance
const throttle = <T extends (...args: unknown[]) => void>(func: T, limit: number) => {
  let inThrottle: boolean;
  return function(this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

const CerebroLanding = () => {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [email, setEmail] = useState<string>('');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [userInitial, setUserInitial] = useState<string>("");
  // Update profileIcon state to include SVG string
  const [profileIcon, setProfileIcon] = useState<{
    id: string,
    svgString?: string
  }>({ id: "initial" });
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Refs for section animations
  const featuresRef = useRef<HTMLDivElement>(null);
  const giveawayRef = useRef<HTMLDivElement>(null);
  const platformsRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const gameModesRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  
  // Visibility tracking ref to avoid dependency issues
  const visibilitySectionsRef = useRef<SectionVisibility>({
    features: false,
    giveaway: false,
    platforms: false,
    howItWorks: false,
    gameModes: false,
    pricing: false
  });
  
  // Animation states
  const [visibleSections, setVisibleSections] = useState<SectionVisibility>({
    features: false,
    giveaway: false,
    platforms: false,
    howItWorks: false,
    gameModes: false,
    pricing: false
  });

  // Add CSS animations
  const animationStyles = `
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    
    @keyframes float-particle {
      0%, 100% { transform: translate(0, 0); }
      50% { transform: translate(10px, -15px); }
    }
    
    @keyframes pulse-subtle {
      0% { opacity: 0.5; }
      50% { opacity: 0.8; }
      100% { opacity: 0.5; }
    }
    
    @keyframes animate-gradient-x {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    @keyframes shimmer {
      0% { transform: translateX(-100%) skewX(45deg); }
      100% { transform: translateX(200%) skewX(45deg); }
    }
    
    @keyframes shimmer-slow {
      0% { transform: translateX(-100%) skewX(45deg); }
      100% { transform: translateX(200%) skewX(45deg); }
    }
    
    @keyframes text-reveal {
      0% { transform: translateY(100%); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes reveal-right {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    
    @keyframes glitch {
      0%, 100% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%); }
      20% { clip-path: polygon(1% 0, 100% 0, 100% 100%, 0% 100%); }
      22% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%); }
      35% { clip-path: polygon(0 1%, 100% 0, 100% 100%, 0% 100%); }
      49% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%); }
      50% { clip-path: polygon(0 0, 100% 0, 100% 99%, 0% 100%); }
      65% { clip-path: polygon(0 0, 100% 1%, 100% 100%, 0% 100%); }
      80% { clip-path: polygon(0 0, 99% 0, 100% 100%, 0% 100%); }
    }
    
    @keyframes scan {
      0% { top: 0; opacity: 1; }
      75% { top: 100%; opacity: 0.5; }
      100% { top: 100%; opacity: 0; }
    }
    
    @keyframes fade-in {
      0% { opacity: 0; transform: translateY(-10px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes rotate3d {
      0% {
        transform: rotateY(0deg);
      }
      100% {
        transform: rotateY(360deg);
      }
    }
    
    .animate-float { animation: float 3s ease-in-out infinite; }
    .animate-pulse-slow { animation: pulse-subtle 4s infinite alternate; }
    .animate-gradient-x { background-size: 200% 200%; animation: animate-gradient-x 15s ease infinite; }
    .animate-shimmer { animation: shimmer 1.5s forwards; }
    .animate-shimmer-slow { animation: shimmer-slow 6s infinite; }
    .animate-text-reveal { animation: text-reveal 0.8s ease forwards; }
    .animate-reveal-right { animation: reveal-right 1.5s ease forwards; }
    .animate-scan { animation: scan 2s ease-in infinite; }
    .animate-fade-in { animation: fade-in 0.2s ease-out; }
  `;

  // Game modes data
  const gameModes = [
    {
      icon: <BarChart2 size={48} className="text-green-400" />,
      title: "Stock Challenges",
      description: "Build a $10,000 virtual portfolio and track your progress against market benchmarks or compete with others",
      features: [
        "Practice mode with personalized feedback",
        "Progressive difficulty levels for skill building",
        "AI-powered investment suggestions to improve your strategy",
        "Skill analytics to identify strengths and weaknesses",
        "Compete when ready in the Stock Arena"
      ]
    },
    {
      icon: <Zap size={48} className="text-green-400" />,
      title: "Trivia Challenges",
      description: "Expand your knowledge with tailored trivia practice across multiple categories and difficulty levels",
      features: [
        "Category-specific training modules",
        "Difficulty progression from beginner to expert",
        "Spaced repetition for improved retention",
        "Custom challenge creation to share with friends",
        "Track improvement in specific knowledge areas"
      ]
    },
    {
      icon: <Calculator size={48} className="text-green-400" />,
      title: "Math Challenges",
      description: "Enhance numerical skills from basic arithmetic to advanced problem solving with guided practice",
      features: [
        "Personalized skill development path",
        "Timed exercises with detailed feedback",
        "Concept explanations when you need help",
        "Mental math training with progressive difficulty",
        "Share your progress and compete in tournaments"
      ]
    },
    {
      icon: <Layers size={48} className="text-green-400" />,
      title: "Logic Challenges",
      description: "Sharpen your reasoning and pattern recognition abilities through diverse puzzle types and strategies",
      features: [
        "Tutorial modes that teach advanced strategies",
        "Practice specific puzzle types to build skills",
        "Solution breakdowns for learning",
        "Track improvement across different puzzle categories",
        "Join logic tournaments when you're ready to compete"
      ]
    },
    {
      icon: <Code size={48} className="text-green-400" />,
      title: "Coding Challenges",
      description: "Master programming skills with challenges in Python, JavaScript, C++ and other popular languages",
      features: [
        "1v1 style code duels with real-time competition",
        "Timed coding challenges with increasing difficulty",
        "Multiple programming languages including Python, JavaScript, and C++",
        "Different modes: Speed Mode, Efficiency Mode, and Blind Mode",
        "Weekly themed coding competitions with real prizes"
      ]
    }
  ];

  // Pricing tiers data
  const pricingTiers = [
    {
      name: "Free Tier",
      price: "$0",
      description: "For users who want to try the platform with limited access",
      features: [
        "Basic Access to Challenges (Trivia, Math, Logic, and Coding)",
        "5 Arena Matches Per Week",
        "Basic Progress Tracking",
        "Community-Generated Challenges",
        "Limited AI Hints",
        "Full Ads Experience"
      ],
      buttonText: "Get Started",
      highlighted: false
    },
    {
      name: "Pro Tier",
      price: "$5",
      description: "For users who want unlimited practice & better performance tracking",
      features: [
        "Everything in Free Tier",
        "Unlimited Practice Challenges",
        "Unlimited Arena Matches",
        "Advanced Analytics",
        "Skill-Based Progression System",
        "Access to Coding Challenges & Duel Arena",
        "Discounted Tournament Entry (10% Off)",
        "No Ads Experience",
        "Step-by-Step Tutorial Library"
      ],
      buttonText: "Preorder Subscription",
      highlighted: true
    },
    {
      name: "Premium Tier",
      price: "$10",
      description: "For serious learners & competitors who want AI coaching and elite features",
      features: [
        "Everything in Pro Tier",
        "AI-Powered Skill Coaching",
        "AI-Generated Adaptive Challenges",
        "Exclusive Competitive Challenge Modes",
        "Higher Tournament Discounts (20% Off)",
        "Early Access to New Features",
        "Priority Support & Exclusive Leaderboards",
        "Monthly Elite Tournaments",
        "Premium User Badge"
      ],
      buttonText: "Preorder Subscription",
      highlighted: false
    }
  ];

  // Check authentication status using Supabase
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsAuthLoading(true);
        
        // Get current session, but don't auto-login
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking auth:', error.message);
          setIsAuthenticated(false);
          setIsAuthLoading(false);
          return;
        }
        
        // Check if user has an active session and is logged in via sessionStorage
        // Using sessionStorage ensures logout when browser is closed
        const hasLoginFlag = typeof window !== 'undefined' && 
          sessionStorage.getItem('cerebro-logged-in') === 'true';
        const hasSession = !!data.session;
        
        // Only consider the user authenticated if both conditions are true
        const isUserAuthenticated = hasSession && hasLoginFlag;
        setIsAuthenticated(isUserAuthenticated);
        
        // Get user's email or name for initial if authenticated
        if (isUserAuthenticated && data.session?.user) {
          const email = data.session.user.email || "";
          const name = data.session.user.user_metadata?.name || email;
          setUserInitial(name.charAt(0).toUpperCase());
        } else {
          setUserInitial("");
        }
          
        // Set up auth state change listener for future changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
          (event, session) => {
            // Handle auth state changes without auto-login
            if (event === 'SIGNED_OUT') {
              setIsAuthenticated(false);
              setUserInitial("");
              
              // Clear login flags
              if (typeof window !== 'undefined') {
                sessionStorage.removeItem('cerebro-logged-in');
                localStorage.removeItem('cerebro-logged-in'); // Clean up any old values
              }
            } else if (event === 'SIGNED_IN' && session) {
              // For signed in, don't automatically set authenticated
              // Only set it if a sessionStorage login flag exists (set by the login form)
              const hasLoginFlag = typeof window !== 'undefined' && 
                sessionStorage.getItem('cerebro-logged-in') === 'true';
              
              if (hasLoginFlag) {
                setIsAuthenticated(true);
                
                // Update user initial
                const email = session.user.email || "";
                const name = session.user.user_metadata?.name || email;
                setUserInitial(name.charAt(0).toUpperCase());
              }
            }
          }
        );
        
        setIsAuthLoading(false);
        
        return () => {
          // Clean up the listener when the component unmounts
          if (authListener && authListener.subscription) {
            authListener.subscription.unsubscribe();
          }
        };
      } catch (err: unknown) {
        // Proper error handling with type checking as per project best practices
        const errorMessage = err instanceof Error ? err.message : 'Unknown authentication error';
        console.error('Auth check error:', errorMessage);
        
        // Ensure the loading state is turned off and authentication state is reset
        setIsAuthenticated(false);
        setIsAuthLoading(false);
        
        // Allow the component to continue rendering even if auth fails
        return null;
      }
    };
    
    // Wrap the async function in a try-catch to prevent unhandled promise rejections
    try {
      checkAuth();
    } catch (err: unknown) {
      // Secondary fallback for any errors that might occur when calling checkAuth
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize auth check';
      console.error('Fatal auth initialization error:', errorMessage);
      setIsAuthenticated(false);
      setIsAuthLoading(false);
    }
  }, []);

  const [mounted, setMounted] = useState<boolean>(false);
  
  // Set mounted state after component mounts to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Countdown to June 4th 12:00 PM EST - improved date handling
  useEffect(() => {
    // Skip on server-side to prevent hydration mismatch
    if (!mounted) return;
    
    // Use ISO format for better browser compatibility
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

  // Add parallax scroll effect with throttling
  useEffect(() => {
    // Throttled scroll handler for better performance
    const handleScroll = throttle(() => {
      // Check if sections are visible for animations
      const checkVisibility = (ref: React.RefObject<HTMLDivElement | null>, section: keyof SectionVisibility) => {
        if (!ref.current) return false;
        
        const rect = ref.current.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const isVisible = rect.top <= windowHeight * 0.8;
        
        if (isVisible && !visibilitySectionsRef.current[section]) {
          visibilitySectionsRef.current = {
            ...visibilitySectionsRef.current,
            [section]: true
          };
          
          setVisibleSections(prev => ({ ...prev, [section]: true }));
        }
        
        return isVisible;
      };
      
      checkVisibility(featuresRef, 'features');
      checkVisibility(giveawayRef, 'giveaway');
      checkVisibility(platformsRef, 'platforms');
      checkVisibility(howItWorksRef, 'howItWorks');
      checkVisibility(gameModesRef, 'gameModes');
      checkVisibility(pricingRef, 'pricing');
    }, 100); // Throttle to 100ms
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // Empty dependency array

  // Handle email subscription
  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (email && email.includes('@')) {
      try {
        // You could add API call here to actually save the email
        // Example: await fetch('/api/subscribe', { method: 'POST', body: JSON.stringify({ email }) });
        
        setIsSubscribed(true);
        setTimeout(() => {
          setIsSubscribed(false);
          setEmail('');
        }, 5000);
      } catch (error) {
        console.error('Error subscribing:', error);
      }
    }
  };

  // Handle input change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  // Handle login/dashboard navigation
  const handleAuthClick = () => {
    if (isAuthenticated) {
      router.push('/dashboard-coming-soon'); // Redirect to coming soon page when authenticated
    } else {
      router.push('/auth/login');
    }
  };

  const handleSignupClick = () => {
    // Always redirect to registration form, regardless of authentication status
    router.push('/auth/register');
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error.message);
        return;
      }
      
      // Clear session storage flag
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('cerebro-logged-in');
      }
      
      setIsAuthenticated(false);
      setUserInitial("");
      setShowDropdown(false);
      
      // Optional: Redirect to home or login page
      router.push('/');
    } catch (error) {
      // Using unknown for better type safety as mentioned in memories
      const err = error as unknown;
      if (err instanceof Error) {
        console.error('Error signing out:', err.message);
      } else {
        console.error('Unknown error when signing out');
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Modified to handle both the icon ID and SVG string
  const handleProfileIconChange = (iconId: string, svgString?: string) => {
    setProfileIcon({
      id: iconId,
      svgString: svgString
    });
    
    // Save to local storage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('cerebro-profile-icon', JSON.stringify({ 
        id: iconId, 
        svgString: svgString 
      }));
    }
  };
  
  // Load saved icon on initial render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedIcon = localStorage.getItem('cerebro-profile-icon');
      if (savedIcon) {
        try {
          setProfileIcon(JSON.parse(savedIcon));
        } catch (error) {
          // Using unknown for better type safety as mentioned in memories
          const err = error as unknown;
          if (err instanceof Error) {
            console.error('Failed to parse saved profile icon:', err.message);
          } else {
            console.error('Unknown error when parsing profile icon');
          }
        }
      }
    }
  }, []);

  // Get profile icon component - updated to support SVG string
  const getProfileIconComponent = () => {
    // If we have a SVG string from DiceBear, render it
    if (profileIcon.svgString) {
      return (
        <div dangerouslySetInnerHTML={{ __html: profileIcon.svgString }} className="w-full h-full scale-75" />
      );
    }
    
    // Otherwise use the fallback text initial
    return <span className="text-white font-bold">{userInitial || '•'}</span>;
  };

  // Handle subscription button click - navigate to subscription page
  const handleSubscriptionClick = (tier: string) => {
    router.push(`/subscribe?tier=${tier.toLowerCase()}&returnTo=%2F`);
  };

  const [botQuestion, setBotQuestion] = useState('');
  const [botIsTyping, setBotIsTyping] = useState(false);
  const [botConversation, setBotConversation] = useState<{question: string, answer: string}[]>([]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white relative overflow-hidden">
      {/* Add animation keyframes */}
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      
      {/* Main content */}
      <div className="relative z-10 container mx-auto">
        {/* Header with logo and navigation */}
        <header className="pt-6 px-4 flex justify-between items-center">
          <div className="flex items-center">
            {/* Cerebro logo */}
            <div className="flex items-center cursor-pointer" onClick={() => router.push('/')}>
              <Image 
                src="/gptcc.png" 
                alt="Cerebro Logo" 
                width={50} 
                height={50} 
                className="mr-3"
              />
              <div className="font-black text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-600">
                CEREBRO
              </div>
              <div className="ml-3 hidden sm:block text-xs text-green-400">
                TRAIN YOUR MIND, TRACK YOUR GROWTH
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Donation Button */}
            <div className="relative group">
              <button 
                onClick={() => router.push('/donate')}
                className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 
                           text-white text-sm font-medium py-2 px-3.5 rounded-full shadow-md hover:shadow-lg 
                           transition-all duration-300 flex items-center gap-1"
              >
                <Gift size={16} />
                <span>Donate</span>
              </button>
              
              {/* Tooltip */}
              <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-300 
                              top-full left-1/2 transform -translate-x-1/2 mt-2 w-64
                              bg-black/90 backdrop-blur-md border border-green-500/30
                              p-3 rounded shadow-xl z-50 text-xs pointer-events-none">
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 
                                border-8 border-transparent border-b-black/90"></div>
                <p className="font-medium text-green-400 mb-1">Support Cerebro</p>
                <p>Your donation helps build the application and 75% will be added directly to the launch giveaway prize pool!</p>
              </div>
            </div>
            
            {/* Login/Dashboard Button */}
            {isAuthLoading ? (
              <div className="h-6 w-16 bg-gray-800 animate-pulse rounded-md"></div>
            ) : (
              <button 
                onClick={handleAuthClick}
                className="text-green-300 hover:text-white transition-colors text-sm font-medium"
              >
                {isAuthenticated ? 'Dashboard' : 'Log in'}
              </button>
            )}
            
            {/* User Profile Button with Dropdown */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <div 
                  className="bg-gradient-to-b from-blue-600 to-teal-400 rounded-full w-8 h-8 flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => setShowDropdown(!showDropdown)}>
                  {getProfileIconComponent()}
                </div>
                
                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-black/90 backdrop-blur-md border border-green-500/30 rounded-lg shadow-lg z-50 py-1 animate-fade-in">
                    <div className="px-4 py-2 border-b border-green-500/20">
                      <p className="text-sm text-white font-medium">Profile</p>
                    </div>
                    
                    {/* Dashboard Link */}
                    <button
                      onClick={() => {
                        router.push('/dashboard-coming-soon');
                        setShowDropdown(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-green-800/20 hover:text-white transition-colors"
                    >
                      <User size={16} className="mr-2" />
                      Dashboard
                    </button>
                    
                    {/* Profile Icon Selector */}
                    <div className="px-4 py-2 border-t border-green-500/20">
                      <p className="text-xs text-gray-400 mb-2">Choose Profile Icon</p>
                      <ProfileIconSelector 
                        userInitial={userInitial || 'user'}
                        selectedIcon={profileIcon.id}
                        onIconChange={handleProfileIconChange}
                        size={32}
                      />
                    </div>
                    
                    {/* Logout Button */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors border-t border-green-500/20"
                    >
                      <LogOut size={16} className="mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleSignupClick}
                className="bg-gradient-to-r from-green-600 to-blue-700 hover:from-green-500 hover:to-blue-600 
                       text-white text-sm font-medium py-2 px-4 rounded shadow-md hover:shadow-lg transition-all duration-300"
              >
                Sign Up
              </button>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <section className="mt-12 md:mt-24 px-4 max-w-6xl mx-auto text-center">
          <h1 className="text-6xl md:text-8xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-teal-500 to-blue-500
                         animate-gradient-x">
            TRAIN YOUR MIND
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Challenge yourself, track your improvement, and compete with others across multiple skill categories.
          </p>
          
          {/* Sign-up for giveaway button moved to hero section for more prominence */}
          <div className="mb-10 max-w-md mx-auto">
            <button
              onClick={handleSignupClick}
              className="w-full inline-flex items-center justify-center group relative
                         overflow-hidden rounded-md shadow-xl shadow-green-900/20"
            >
              {/* Button background with animated gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-blue-700 
                              group-hover:from-green-500 group-hover:to-blue-600
                              transition-all duration-500"></div>
              
              {/* Animated shine effect */}
              <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent 
                              skew-x-45 group-hover:animate-shimmer"></div>
              
              {/* Button content */}
              <div className="relative px-8 py-4 text-lg font-bold flex items-center justify-center">
                {isAuthenticated ? (
                  <span>SUCCESS! YOU&apos;RE IN THE GIVEAWAY! 🎉</span>
                ) : (
                  <span>SIGN UP TO BE ENTERED IN LAUNCH GIVEAWAY</span>
                )}
                <ArrowRight className="ml-2 inline-block group-hover:translate-x-1 transition-transform" size={20} />
              </div>
              
              {/* Pulsing border effect */}
              <div className="absolute -inset-[2px] rounded-lg bg-gradient-to-r from-green-400 to-blue-600 opacity-0 group-hover:opacity-50 blur-sm group-hover:animate-pulse" style={{animationDuration: "2s"}}></div>
            </button>
          </div>
          
          {/* Enhanced Countdown with 3D effect */}
          <div className="mb-12">
            {/* Enhanced Futuristic Countdown Title */}
            <div className="mb-6 relative">
              {/* Animated background effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-900/20 via-blue-800/10 to-green-900/20 rounded-full blur-lg transform scale-110 animate-pulse-slow"></div>
              
              {/* Glitch effect layer */}
              <div className="absolute inset-0 rounded-full overflow-hidden">
                <div className="w-full h-full bg-black/40 backdrop-blur-sm border border-green-500/30" 
                     style={{
                       clipPath: "polygon(0 0, 100% 0, 100% 100%, 0% 100%)",
                     }}>
                </div>
                <div className="absolute inset-0 bg-green-600/5"></div>
              </div>
              
              {/* Main content */}
              <div className="font-mono text-base text-white flex items-center justify-center py-3 px-8 relative">
                {/* Lock Icon with animation */}
                <div className="relative mr-3 animate-pulse" style={{animationDuration: "1.5s"}}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" 
                       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                       className="text-green-400">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  
                  {/* Radiating circles animation */}
                  <div className="absolute inset-0 rounded-full border border-green-400/30 animate-ping" style={{animationDuration: "1.5s"}}></div>
                </div>
                
                {/* Text with scan line effect */}
                <div className="relative">
                  <span className="animate-gradient-x text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-teal-400 to-green-300 font-bold tracking-wider">
                    UNLOCKS IN
                  </span>
                  {/* Scanner line effect */}
                  <div className="absolute h-[2px] left-0 right-0 bg-green-400/50 animate-scan"></div>
                </div>
              </div>
            </div>
            
            {/* Only show countdown after client-side hydration is complete */}
            {mounted ? (
              <div className="grid grid-cols-4 gap-3 max-w-3xl mx-auto">
                {Object.entries(timeLeft).map(([unit, value], index) => (
                  <div 
                    key={unit}
                    className="relative overflow-hidden group"
                    style={{ perspective: '1000px', transitionDelay: `${index * 100}ms` }}
                  >
                    {/* 3D card effect container */}
                    <div className="relative transform transition-all duration-700 ease-out group-hover:rotate-y-12">
                      {/* Background with subtle animation */}
                      <div className="absolute inset-0 bg-gradient-to-br from-green-600/30 to-blue-700/30 
                                      group-hover:from-green-500/40 group-hover:to-blue-600/40
                                      backdrop-blur-md border border-green-500/30 rounded-lg transition-all duration-500 z-0"></div>
                      
                      {/* Glass reflection effect */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
                      
                      {/* Animated highlight */}
                      <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent 
                                      skew-x-45 group-hover:animate-shimmer"></div>
                      
                      {/* Edge light effect */}
                      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-transparent via-green-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-green-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      <div className="p-4 md:p-6 relative">
                        {/* Value with pulse effect on change */}
                        <div 
                          className="text-4xl md:text-6xl font-mono font-bold text-white mb-1 group-hover:scale-110 transition-transform relative"
                          key={`${unit}-${value}`} // Force re-render on value change
                        >
                          <span className="relative z-10">{String(value).padStart(2, '0')}</span>
                          
                          {/* Digital number effect */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-10 text-green-400 transform -translate-y-1">
                            {String(value).padStart(2, '0')}
                          </div>
                        </div>
                        
                        {/* Unit label with gradient */}
                        <div className="text-xs uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 font-medium">
                          {unit}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 italic p-4">
                Countdown will appear after client-side hydration is complete.
              </div>
            )}
          </div>
          
          {/* App Preview Mockup - using placeholder color instead of image */}
          <div className="mb-16 relative mx-auto max-w-5xl">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/15 to-blue-500/15 opacity-20 blur-sm rounded-2xl"></div>
            <div className="relative bg-black p-2 rounded-2xl shadow-2xl border border-green-500/20">
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden h-64 md:h-80 flex items-center justify-center">
                <div className="text-center">
                  <Image 
                    src="/gptcc.png" 
                    alt="Cerebro Logo" 
                    width={80} 
                    height={80} 
                    className="mx-auto mb-4"
                  />
                  <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-medium inline-block mb-2">COMING SOON</span>
                  <h3 className="text-2xl md:text-3xl font-bold text-white">The Complete Skill Development Platform</h3>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
              </div>
            </div>
          </div>
          
          {/* Email notification form moved from hero to this section */}
          <div className="mb-12">
            <form onSubmit={handleSubscribe} className="w-full relative max-w-xl mx-auto">
              <div className="flex shadow-lg shadow-green-900/10 rounded-lg overflow-hidden">
                <div className="flex-1 relative min-w-[320px]">
                  <Mail size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-400" />
                  <input 
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="Enter email to be notified when we launch"
                    className="bg-black/70 w-full h-full pl-12 pr-3 py-4 text-white placeholder-gray-500 border-0 focus:outline-none focus:ring-1 focus:ring-green-500/50 text-sm"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  className="bg-gradient-to-r from-green-600 to-blue-700 hover:from-green-500 hover:to-blue-600
                           px-6 py-4 text-white font-medium flex items-center transition-all duration-300 shadow-md whitespace-nowrap"
                >
                  Notify Me
                  <ChevronRight size={18} className="ml-1" />
                </button>
              </div>
              
              {/* Success message */}
              {isSubscribed && (
                <div className="mt-3 text-center text-green-400 text-sm animate-fade-in">
                  <Check size={16} className="inline-block mr-1" />
                  You&apos;ll be notified when we launch!
                </div>
              )}
              {!isSubscribed && (
                <div className="mt-2 text-center text-gray-400 text-xs">
                  Get exclusive early access and platform updates
                </div>
              )}
            </form>
          </div>
        </section>

        {/* How It Works Section */}
        <section 
          ref={howItWorksRef}
          className="mt-12 md:mt-24 px-4 max-w-6xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-12 text-center">
            <span className={`relative inline-block overflow-hidden ${visibleSections.howItWorks ? 'animate-text-reveal' : ''}`}>
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-600">
                HOW CEREBRO WORKS
              </span>
              <span className={`absolute inset-0 bg-green-500/15 transform ${visibleSections.howItWorks ? 'animate-reveal-right' : 'translate-x-full'} transition-transform duration-1000 ease-out`}></span>
            </span>
          </h2>
          
          {/* Steps */}
          <div className="grid md:grid-cols-4 gap-8 mb-16">
            {[
              {
                icon: <Users size={36} className="text-green-400" />,
                title: "1. CREATE AN ACCOUNT",
                desc: "Sign up and get access to all skill challenges and personalized tracking"
              },
              {
                icon: <Medal size={36} className="text-green-400" />,
                title: "2. SELECT SKILL CATEGORIES",
                desc: "Choose from Stock, Trivia, Math, Coding, or Logic Puzzles" 
              },
              {
                icon: <Trophy size={36} className="text-green-400" />,
                title: "3. PRACTICE & IMPROVE",
                desc: "Use guided practice to develop your skills with detailed feedback"
              },
              {
                icon: <BarChart2 size={36} className="text-green-400" />,
                title: "4. TRACK YOUR GROWTH",
                desc: "Monitor your progress and compete in the Arena when ready"
              }
            ].map((step, index) => (
              <div 
                key={index}
                className={`p-6 relative overflow-hidden rounded-lg transform transition-all duration-700 ease-out 
                           ${visibleSections.howItWorks ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                style={{ 
                  transitionDelay: `${index * 150}ms`,
                  background: "linear-gradient(to bottom right, rgba(6, 78, 59, 0.2), rgba(7, 89, 133, 0.2))"
                }}
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500/15 to-blue-500/15 blur opacity-30 rounded-lg"></div>
                <div className="relative z-10">
                  <div className="p-3 bg-green-900/30 rounded-full inline-block border border-green-500/20">
                    {step.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-300">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section with Reveal Animation */}
        <section 
          ref={featuresRef}
          className="mt-12 md:mt-24 px-4 max-w-6xl mx-auto"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-12 text-center">
            <span className={`relative inline-block overflow-hidden ${visibleSections.features ? 'animate-text-reveal' : ''}`}>
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-600">
                SKILL DEVELOPMENT
              </span>
              <span className={`absolute inset-0 bg-green-500/15 transform ${visibleSections.features ? 'animate-reveal-right' : 'translate-x-full'} transition-transform duration-1000 ease-out`}></span>
            </span>
          </h2>
          
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
            {/* Feature 1 - With reveal animation */}
            <div 
              className={`rounded-xl overflow-hidden relative group transform transition-all duration-700 ease-out ${visibleSections.features ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
              style={{ transitionDelay: '0ms' }}
            >
              {/* Animated border glow */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600/50 to-blue-600/50 rounded-xl opacity-0 group-hover:opacity-70 blur-sm transition-opacity duration-700"></div>
              
              {/* Background with subtle animation */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 to-blue-900/10 
                              group-hover:from-green-800/30 group-hover:to-blue-800/20
                              backdrop-blur-md border border-green-500/10 rounded-xl transition-all duration-500 z-0"></div>
              
              {/* Content */}
              <div className="p-6 relative h-full flex flex-col z-10">
                <div className="p-3 bg-green-900/30 rounded-lg w-12 h-12 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                  <TrendingUp size={24} className="text-green-300" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-300 transition-colors duration-300">Stock Trading</h3>
                
                <p className="text-gray-300 mb-3">
                  Master investment strategies with a virtual portfolio
                </p>
                
                <p className="text-gray-400 text-sm mt-auto">
                  Personalized learning path from basics to advanced trading
                </p>
              </div>
            </div>
            
            {/* Feature 2 - With reveal animation */}
            <div 
              className={`rounded-xl overflow-hidden relative group transform transition-all duration-700 ease-out ${visibleSections.features ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
              style={{ transitionDelay: '150ms' }}
            >
              {/* Animated border glow */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600/50 to-blue-600/50 rounded-xl opacity-0 group-hover:opacity-70 blur-sm transition-opacity duration-700"></div>
              
              <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 to-blue-900/10 
                              group-hover:from-green-800/30 group-hover:to-blue-800/20
                              backdrop-blur-md border border-green-500/10 rounded-xl transition-all duration-500 z-0"></div>
              
              <div className="p-6 relative h-full flex flex-col z-10">
                <div className="p-3 bg-green-900/30 rounded-lg w-12 h-12 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                  <Zap size={24} className="text-green-300" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-300 transition-colors duration-300">Trivia Skills</h3>
                
                <p className="text-gray-300 mb-3">
                  Expand your knowledge across multiple categories
                </p>
                
                <p className="text-gray-400 text-sm mt-auto">
                  Personalized quizzing with topics and difficulty you can control
                </p>
              </div>
            </div>
            
            {/* Feature 3 - Math Skills */}
            <div 
              className={`rounded-xl overflow-hidden relative group transform transition-all duration-700 ease-out ${visibleSections.features ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
              style={{ transitionDelay: '300ms' }}
            >
              {/* Animated border glow */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600/50 to-blue-600/50 rounded-xl opacity-0 group-hover:opacity-70 blur-sm transition-opacity duration-700"></div>
              
              <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 to-blue-900/10 
                              group-hover:from-green-800/30 group-hover:to-blue-800/20
                              backdrop-blur-md border border-green-500/10 rounded-xl transition-all duration-500 z-0"></div>
              
              <div className="p-6 relative h-full flex flex-col z-10">
                <div className="p-3 bg-green-900/30 rounded-lg w-12 h-12 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                  <Calculator size={24} className="text-green-300" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-300 transition-colors duration-300">Math Skills</h3>
                
                <p className="text-gray-300 mb-3">
                  Enhance numerical skills from basics to advanced problems
                </p>
                
                <p className="text-gray-400 text-sm mt-auto">
                  Interactive exercises with step-by-step guidance
                </p>
              </div>
            </div>
            
            {/* Feature 4 - Logic Skills */}
            <div 
              className={`rounded-xl overflow-hidden relative group transform transition-all duration-700 ease-out ${visibleSections.features ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
              style={{ transitionDelay: '450ms' }}
            >
              {/* Animated border glow */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600/50 to-blue-600/50 rounded-xl opacity-0 group-hover:opacity-70 blur-sm transition-opacity duration-700"></div>
              
              <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 to-blue-900/10 
                              group-hover:from-green-800/30 group-hover:to-blue-800/20
                              backdrop-blur-md border border-green-500/10 rounded-xl transition-all duration-500 z-0"></div>
              
              <div className="p-6 relative h-full flex flex-col z-10">
                <div className="p-3 bg-green-900/30 rounded-lg w-12 h-12 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                  <Layers size={24} className="text-green-300" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-300 transition-colors duration-300">Logic Skills</h3>
                
                <p className="text-gray-300 mb-3">
                  Sharpen reasoning skills with diverse puzzle types
                </p>
                
                <p className="text-gray-400 text-sm mt-auto">
                  Learn strategies that enhance problem-solving abilities
                </p>
              </div>
            </div>
            
            {/* Feature 5 - Coding Skills */}
            <div 
              className={`rounded-xl overflow-hidden relative group transform transition-all duration-700 ease-out ${visibleSections.features ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
              style={{ transitionDelay: '600ms' }}
            >
              {/* Animated border glow */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600/50 to-blue-600/50 rounded-xl opacity-0 group-hover:opacity-70 blur-sm transition-opacity duration-700"></div>
              
              <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 to-blue-900/10 
                              group-hover:from-green-800/30 group-hover:to-blue-800/20
                              backdrop-blur-md border border-green-500/10 rounded-xl transition-all duration-500 z-0"></div>
              
              <div className="p-6 relative h-full flex flex-col z-10">
                <div className="p-3 bg-green-900/30 rounded-lg w-12 h-12 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                  <Code size={24} className="text-green-300" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-green-300 transition-colors duration-300">Coding Skills</h3>
                
                <p className="text-gray-300 mb-3">
                  Master programming in Python, JavaScript, C++ and more
                </p>
                
                <p className="text-gray-400 text-sm mt-auto">
                  Participate in 1v1 duels and timed coding competitions
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Platform Insights Section */}
        <section 
          ref={platformsRef}
          className="mt-12 px-4 max-w-6xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
              Join the Inner Circle
            </span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Early Adopter Program */}
            <div className="bg-black/80 border border-green-800/30 rounded-xl p-6 backdrop-blur-md hover:bg-green-900/20 transition-all duration-300 shadow-lg">
              <div className="text-2xl mb-4 font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent text-center">Early Adopter Benefits</div>
              
              <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-xl p-4 mb-6">
                <div className="text-center text-white mb-2 font-semibold">Limited to first 500 members</div>
                <div className="flex justify-center">
                  <div className="bg-black/60 rounded-full px-4 py-1 text-sm">
                    <span className="text-green-400 font-bold">376</span>
                    <span className="text-gray-400"> spots remaining</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3 bg-black/40 p-3 rounded-lg border-l-4 border-green-500">
                  <div className="text-2xl">💎</div>
                  <div>
                    <h3 className="text-white font-semibold">Lifetime 50% Discount</h3>
                    <p className="text-sm text-gray-400">Lock in half-price premium access forever</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 bg-black/40 p-3 rounded-lg border-l-4 border-green-500">
                  <div className="text-2xl">🔑</div>
                  <div>
                    <h3 className="text-white font-semibold">Beta Access</h3>
                    <p className="text-sm text-gray-400">Be first to try new features and provide feedback</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 bg-black/40 p-3 rounded-lg border-l-4 border-green-500">
                  <div className="text-2xl">🏆</div>
                  <div>
                    <h3 className="text-white font-semibold">Founding Member Badge</h3>
                    <p className="text-sm text-gray-400">Exclusive profile badge showing your OG status</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 bg-black/40 p-3 rounded-lg border-l-4 border-green-500">
                  <div className="text-2xl">🎁</div>
                  <div>
                    <h3 className="text-white font-semibold">5,000 Bonus Points</h3>
                    <p className="text-sm text-gray-400">Head start on challenges and competitions</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <button 
                  className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-300 shadow-lg font-bold text-lg"
                  onClick={() => {
                    if (isAuthenticated) {
                      router.push('/dashboard'); 
                    } else {
                      router.push('/auth/register');
                    }
                  }}
                >
                  {isAuthenticated ? 'Access Dashboard' : 'Secure Your Spot'}
                </button>
                <p className="text-center text-xs text-gray-500 mt-2">No credit card required until launch</p>
              </div>
            </div>
            
            {/* Chatbot/FAQ Interface */}
            <div className="bg-black/80 border border-green-800/30 rounded-xl p-6 backdrop-blur-md hover:bg-green-900/20 transition-all duration-300 shadow-lg flex flex-col h-full">
              <div className="text-2xl mb-4 font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent text-center">Ask Cerebro AI</div>
              
              {/* Chat Display Area */}
              <div className="flex-grow overflow-y-auto mb-4 space-y-3 h-[250px]">
                {botConversation.length === 0 ? (
                  <div className="text-center text-gray-500 italic p-4">
                    Ask a question about Cerebro features, subscription plans, or how the platform works
                  </div>
                ) : (
                  botConversation.map((message, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-end">
                        <div className="bg-blue-600/30 rounded-lg p-3 max-w-[80%] text-white">
                          {message.question}
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-green-600/30 rounded-lg p-3 max-w-[80%] text-white">
                          {message.answer}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {botIsTyping && (
                  <div className="flex justify-start">
                    <div className="bg-green-600/30 rounded-lg p-3 max-w-[80%] text-white">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse delay-75"></div>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse delay-150"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Input Area */}
              <form className="mt-auto" onSubmit={async (e) => {
                e.preventDefault();
                if (!botQuestion.trim()) return;
                
                // Add user question to chat
                setBotConversation([...botConversation, {
                  question: botQuestion, 
                  answer: '' // Will be filled after "typing"
                }]);
                
                // Show typing indicator
                setBotIsTyping(true);
                
                try {
                  // Call our OpenAI-powered API endpoint
                  const response = await fetch('/api/chatbot', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: botQuestion }),
                  });
                  
                  if (!response.ok) {
                    throw new Error('Failed to get chatbot response');
                  }
                  
                  const data = await response.json();
                  
                  // Update the last conversation message with the answer
                  setBotConversation(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1].answer = data.answer || 
                      "Sorry, I couldn't process your question. Please try again.";
                    return updated;
                  });
                } catch (error: unknown) {
                  // Following TypeScript best practices for error handling
                  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                  console.error('Chatbot error:', errorMessage);
                  
                  // Handle error in UI
                  setBotConversation(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1].answer = 
                      "I'm having trouble connecting to my knowledge base. Please try again later.";
                    return updated;
                  });
                } finally {
                  setBotIsTyping(false);
                  setBotQuestion('');
                }
              }}>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={botQuestion}
                    onChange={(e) => setBotQuestion(e.target.value)}
                    placeholder="Ask about Cerebro features, pricing, launch date..."
                    className="flex-grow bg-black/50 border border-green-800/30 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                    disabled={botIsTyping}
                  />
                  <button
                    type="submit"
                    disabled={botIsTyping || !botQuestion.trim()}
                    className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
        
        {/* Game Modes Section */}
        <section 
          ref={gameModesRef}
          className="mt-16 mb-20 px-4 max-w-6xl mx-auto"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-8 text-center">
            <span className={`relative inline-block overflow-hidden ${visibleSections.gameModes ? 'animate-text-reveal' : ''}`}>
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-600">
                CHALLENGE DETAILS
              </span>
              <span className={`absolute inset-0 bg-green-500/15 transform ${visibleSections.gameModes ? 'animate-reveal-right' : 'translate-x-full'} transition-transform duration-1000 ease-out`}></span>
            </span>
          </h2>
          
          {/* Tabs for Game Modes */}
          <div className="mb-6 flex justify-center">
            <div className="flex flex-wrap justify-center rounded-lg p-1 bg-black/30 border border-green-500/10 backdrop-blur-md">
              {gameModes.map((mode, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`px-4 py-2 rounded-md text-sm md:text-base font-medium transition-all duration-300 ${
                    activeTab === index 
                      ? 'bg-gradient-to-r from-green-600 to-blue-700 text-white shadow-lg' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {mode.title.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
          
          {/* Active Tab Content */}
          <div 
            className={`p-6 rounded-xl relative overflow-hidden transform transition-all duration-700 ease-out 
                       ${visibleSections.gameModes ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
            style={{ 
              background: "linear-gradient(to bottom right, rgba(6, 78, 59, 0.2), rgba(7, 89, 133, 0.2))"
            }}
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500/15 to-blue-500/15 blur opacity-30 rounded-lg"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="md:w-1/4 flex justify-center">
                  <div className="p-6 bg-black/50 rounded-full inline-block border border-green-500/20">
                    {gameModes[activeTab].icon}
                  </div>
                </div>
                
                <div className="md:w-3/4">
                  <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-3">
                    {gameModes[activeTab].title}
                  </h3>
                  
                  <p className="text-gray-300 mb-6">
                    {gameModes[activeTab].description}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {gameModes[activeTab].features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="text-green-400 mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
                               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                               className="text-white">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Subscription Plans Section */}
        <section 
          ref={pricingRef}
          className="mt-16 mb-24 px-4 max-w-6xl mx-auto"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-8 text-center">
            <span className={`relative inline-block overflow-hidden ${visibleSections.pricing ? 'animate-text-reveal' : ''}`}>
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-600">
                SUBSCRIPTION PLANS
              </span>
              <span className={`absolute inset-0 bg-green-500/15 transform ${visibleSections.pricing ? 'animate-reveal-right' : 'translate-x-full'} transition-transform duration-1000 ease-out`}></span>
            </span>
          </h2>
          
          <p className="text-gray-300 text-center mb-12 max-w-2xl mx-auto">
            Choose the plan that fits your needs. All subscriptions include a free trial period so you can experience the full power of Cerebro.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <div 
                key={index}
                className={`rounded-xl overflow-hidden relative transform transition-all duration-700 ease-out flex flex-col
                          ${visibleSections.pricing ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
                style={{ 
                  transitionDelay: `${index * 150}ms`,
                  background: tier.highlighted 
                    ? "linear-gradient(to bottom right, rgba(22, 163, 74, 0.2), rgba(37, 99, 235, 0.2))"
                    : "linear-gradient(to bottom right, rgba(6, 78, 59, 0.1), rgba(7, 89, 133, 0.1))"
                }}
              >
                {/* Highlighted tier badge */}
                {tier.highlighted && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-md">
                      MOST POPULAR
                    </div>
                  </div>
                )}
                
                {/* Background effects */}
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500/10 to-blue-500/10 blur opacity-30 rounded-lg"></div>
                
                {/* Content */}
                <div className="p-6 relative z-10 flex flex-col h-full">
                  <div className="mb-6 text-center">
                    <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                    <div className="flex items-center justify-center">
                      <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
                        {tier.price}
                      </span>
                      <span className="text-gray-400 ml-1">/month</span>
                    </div>
                    <p className="text-gray-400 text-sm mt-2">{tier.description}</p>
                  </div>
                  
                  <div className="flex-grow overflow-y-auto">
                    {tier.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2 mb-3">
                        <div className="text-green-400 mt-1 flex-shrink-0">
                          <Check size={16} />
                        </div>
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6">
                    <button
                      onClick={() => handleSubscriptionClick(tier.name.split(' ')[0])}
                      className={`w-full py-3 rounded-lg font-medium transition-all duration-300 text-base ${
                        tier.highlighted
                          ? 'bg-gradient-to-r from-green-600 to-blue-700 text-white shadow-lg' 
                          : 'bg-black/60 hover:bg-black/80 text-gray-300 hover:text-white border border-green-500/20'
                      }`}
                    >
                      {tier.buttonText}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Mobile App Teaser - simpler without image */}
        <section className="mt-12 mb-20 px-4 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8 bg-gradient-to-br from-green-900/20 to-blue-900/10 rounded-xl p-8 backdrop-blur-md border border-green-500/20">
            <div className="md:w-1/2">
              <h3 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-4">
                Take Cerebro Anywhere
              </h3>
              <p className="text-gray-300 mb-6">
                Our mobile app lets you practice on the go. Track your daily progress, complete challenges, and improve your skills from anywhere.
              </p>
              <div className="flex gap-4">
                <div className="bg-black/50 p-3 rounded-lg flex items-center gap-2 border border-green-500/20">
                  <Smartphone size={24} className="text-green-400" />
                  <span className="text-white">iOS App</span>
                </div>
                <div className="bg-black/50 p-3 rounded-lg flex items-center gap-2 border border-green-500/20">
                  <Smartphone size={24} className="text-green-400" />
                  <span className="text-white">Android App</span>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <div className="h-64 w-full flex items-center justify-center bg-black/50 rounded-xl border border-green-500/20">
                <Brain size={80} className="text-green-400/30" />
                <div className="absolute inset-0 rounded-xl border border-green-500/20"></div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Giveaway Section with Enhanced Effects */}
        <section 
          ref={giveawayRef}
          className="mt-12 mb-12 px-4 max-w-6xl mx-auto"
        >
          <div 
            className={`relative overflow-hidden rounded-xl transform transition-all duration-1000 ${visibleSections.giveaway ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'}`}
          >
            {/* Animated background with more dynamic gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-900/30 to-blue-900/20 backdrop-blur-md z-0 shadow-xl">
              <div className="absolute inset-0 opacity-40" 
                   style={{
                     background: `radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.2) 0%, transparent 70%)`,
                     animation: 'pulse-subtle 4s infinite alternate'
                   }}>
              </div>
            </div>
            
            {/* Enhanced animated light effects */}
            <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-45 animate-shimmer-slow"></div>
            <div className="absolute -inset-[100%] bg-gradient-to-l from-transparent via-green-500/5 to-transparent -skew-x-45 animate-shimmer-slow" style={{animationDelay: '2s'}}></div>
            
            {/* Particle effects */}
            <div className="absolute inset-0 overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-green-400"
                  style={{
                    left: `${10 + (i * 20)}%`,
                    top: `${30 + (i * 10)}%`,
                    opacity: 0.4,
                    boxShadow: '0 0 10px 2px rgba(74, 222, 128, 0.3)',
                    animation: `float-particle ${3 + i}s infinite ease-in-out`
                  }}
                ></div>
              ))}
            </div>
            
            <div className="p-8 relative z-10 flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-green-900/30 rounded-full mr-3 animate-pulse shadow-md" style={{animationDuration: "3s"}}>
                    <Gift size={28} className="text-green-300" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-300 animate-gradient-x">
                    LAUNCH GIVEAWAY
                  </h3>
                </div>
                
                <p className="text-gray-300 mb-6 text-lg">
                  Sign up now and be automatically entered into our huge launch giveaway with over $50,000 in prizes!
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                  {[
                    { icon: "💰", label: "Cash Prizes", delay: "0ms" },
                    { icon: "🎮", label: "Gaming Gear", delay: "100ms" },
                    { icon: "📱", label: "Latest Electronics", delay: "200ms" }
                  ].map((item, index: number) => (
                    <div 
                      key={index}
                      className="bg-black/70 border border-green-800/20 rounded-lg p-3 text-center 
                                backdrop-blur-md transition-all duration-500
                                hover:scale-110 hover:border-green-500/30 hover:bg-green-900/20
                                opacity-0 transform"
                      style={{ 
                        transform: visibleSections.giveaway ? 'translateX(0)' : `translateX(${index % 2 === 0 ? '-' : ''}100px)`,
                        opacity: visibleSections.giveaway ? 1 : 0,
                        transition: 'transform 0.6s ease-out, opacity 0.6s ease-out',
                        transitionDelay: `${index * 0.1 + 0.3}s`
                      }}
                    >
                      <span className="mr-2 text-xl">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                      
                      {/* Shine effect on hover */}
                      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -translate-x-full hover:translate-x-full transition-transform duration-1500"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="md:w-1/3">
                <button
                  onClick={handleSignupClick}
                  className="w-full relative overflow-hidden rounded-lg group shadow-lg"
                >
                  {/* Button background with animated gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-blue-700 
                                 group-hover:from-green-500 group-hover:to-blue-600
                                 transition-all duration-500"></div>
                  
                  {/* Animated shine effect */}
                  <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent 
                                skew-x-45 group-hover:animate-shimmer"></div>
                  
                  {/* Button content */}
                  <div className="relative px-6 py-4 text-white font-bold flex items-center justify-center">
                    {isAuthenticated ? (
                      <span>SUCCESS! YOU&apos;RE IN THE GIVEAWAY! 🎉</span>
                    ) : (
                      <span>SIGN UP TO BE ENTERED IN LAUNCH GIVEAWAY</span>
                    )}
                    <ArrowRight className="ml-2 inline-block group-hover:translate-x-1 transition-transform" size={20} />
                  </div>
                  
                  {/* Pulsing border effect */}
                  <div className="absolute -inset-[2px] rounded-lg bg-gradient-to-r from-green-400 to-blue-600 opacity-0 group-hover:opacity-50 blur-sm group-hover:animate-pulse" style={{animationDuration: "2s"}}></div>
                </button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Testimonials section */}
        <section className="mt-16 mb-10 px-4 max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
            WHAT BETA TESTERS ARE SAYING
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "I've improved my stock trading skills dramatically thanks to the guided practice. Now I consistently outperform my friends in the monthly competitions.",
                name: "Jason K.",
                role: "Finance Enthusiast",
                avatar: "😎"
              },
              {
                quote: "The trivia challenges are addictive and educational. I've learned so much across different categories while having fun competing with others.",
                name: "Sarah M.",
                role: "Knowledge Seeker",
                avatar: "👑"
              },
              {
                quote: "The coding challenges helped me prepare for technical interviews. The 1v1 duels are intense and really test your problem-solving skills under pressure!",
                name: "Alex R.",
                role: "Software Developer",
                avatar: "💻"
              }
            ].map((testimonial, index: number) => (
              <div 
                key={index}
                className="bg-black/60 rounded-xl p-6 shadow-lg border border-green-800/20 hover:border-green-600/30 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 backdrop-blur-sm"
              >
                <div className="mb-4 text-gray-300 text-lg italic">{`"${testimonial.quote}"`}</div>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-green-900/30 flex items-center justify-center text-xl mr-3">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-medium text-white">{testimonial.name}</div>
                    <div className="text-xs text-green-400">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Join community section */}
        <section className="mt-16 mb-24 px-4 max-w-2xl mx-auto text-center">
          <div className="mb-6 flex flex-col items-center">
            <Bell size={24} className="text-green-400 mb-2" />
            <h3 className="text-xl font-bold text-white mb-2">Join Our Community</h3>
            <p className="text-gray-300 mb-3">
              Follow us on social media for exclusive updates and skill-building tips
            </p>
            <p className="text-gray-400 text-sm mb-4">
              Connect with other learners, share challenges, and track your improvement journey
            </p>
          </div>
          
          <div className="flex justify-center gap-4">
            {/* X icon (formerly Twitter) - using simple X shape, no bird */}
            <a href="https://x.com/cerebrohub" target="_blank" rel="noopener noreferrer" 
               className="bg-black/40 p-4 rounded-lg backdrop-blur-md border border-green-500/20 
                         hover:bg-green-900/10 transition-all duration-300 group">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                   className="text-white">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </a>
            {/* TikTok icon */}
            <a href="https://www.tiktok.com/@cerebrohub" target="_blank" rel="noopener noreferrer" 
               className="bg-black/40 p-4 rounded-lg backdrop-blur-md border border-green-500/20 
                         hover:bg-green-900/10 transition-all duration-300 group">
              <Image 
                src="/tk.png" 
                alt="TikTok" 
                width={24} 
                height={24} 
                className="text-white" 
              />
            </a>
            {/* LinkedIn icon */}
            <a href="#" target="_blank" rel="noopener noreferrer" 
               className="bg-black/40 p-4 rounded-lg backdrop-blur-md border border-green-500/20 
                         hover:bg-green-900/10 transition-all duration-300 group">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                   className="text-white group-hover:scale-110 transition-transform">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect width="4" height="12" x="2" y="9"></rect>
                <circle cx="4" cy="4" r="2"></circle>
              </svg>
            </a>
          </div>
        </section>
        
        {/* Footer */}
        <footer className="py-8 px-4 text-center text-gray-500 text-sm">
          <div className="mb-4 flex justify-center gap-6">
            <a href="#" className="hover:text-green-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-green-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-green-400 transition-colors">Contact</a>
          </div>
          <div>&copy; 2025 Cerebro. All rights reserved.</div>
        </footer>
      </div>
    </div>
  );
};

export default CerebroLanding;

{/* Add keyframes for all animations */}
<style jsx global>{`
  @keyframes orbit {
    0% {
      transform: rotate(0deg) translate(200px) rotate(0deg);
    }
    100% {
      transform: rotate(360deg) translate(200px) rotate(-360deg);
    }
  }

  @keyframes rotateContainer {
    0% {
      transform: rotateY(0deg);
    }
    100% {
      transform: rotateY(360deg);
    }
  }
`}</style>