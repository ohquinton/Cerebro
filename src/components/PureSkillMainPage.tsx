'use client';
import React, { useState, useEffect } from 'react';
import { 
  Search, MessageSquare, Trophy, Users, Clock, Settings, Wallet,
  BookOpen, Home, Brain, BarChart2, Activity, 
  PlusSquare, Bell, Gift, User, LogOut, ChevronDown,
  TrendingUp, Code, Puzzle, Compass, Star, 
  ArrowUpRight, Heart, Target, Award, Info
} from 'lucide-react';
import { supabase } from '@/lib/api/supabase';
import { checkAuth, refreshAuth, logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/lib/types/user'; // Use only UserProfile type

// Define other types to improve type safety
interface SkillProgress {
  stocks: number;
  coding: number;
  trivia: number;
  logic: number;
  math: number;
  [key: string]: number;
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
}

// Sample data types
interface Challenge {
  id: number;
  title: string;
  category: string;
  difficulty: string;
  time: string;
  participants: number;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface Course {
  id: number;
  title: string;
  category: string;
  level: string;
  duration: string;
  enrolled: number;
}

interface LeaderboardUser {
  rank: number;
  name: string;
  score: number;
  change: 'up' | 'down' | 'same';
}

interface SkillCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface CommunityPost {
  id: number;
  author: string;
  title: string;
  likes: number;
  comments: number;
  time: string;
}

interface Notification {
  id: number;
  type: 'challenge' | 'achievement' | 'system' | 'social';
  message: string;
  time: string;
}

// Define type-safe color lookup objects
type CategoryKey = 'Stocks' | 'Coding' | 'Trivia' | 'Logic' | 'Math' | 'Coding & Stocks';
type DifficultyKey = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'All Levels';

// Color maps for categories and difficulties
const CATEGORY_COLORS: Record<CategoryKey, string> = {
  'Stocks': 'text-emerald-400',
  'Coding': 'text-blue-400',
  'Trivia': 'text-purple-400',
  'Logic': 'text-amber-400',
  'Math': 'text-rose-400',
  'Coding & Stocks': 'text-cyan-400'
};

const CATEGORY_BACKGROUNDS: Record<CategoryKey, string> = {
  'Stocks': 'bg-emerald-400/10 border-emerald-400/20',
  'Coding': 'bg-blue-400/10 border-blue-400/20',
  'Trivia': 'bg-purple-400/10 border-purple-400/20',
  'Logic': 'bg-amber-400/10 border-amber-400/20',
  'Math': 'bg-rose-400/10 border-rose-400/20',
  'Coding & Stocks': 'bg-cyan-400/10 border-cyan-400/20'
};

const DIFFICULTY_COLORS: Record<DifficultyKey, string> = {
  'Beginner': 'text-green-400',
  'Intermediate': 'text-yellow-400',
  'Advanced': 'text-orange-400',
  'Expert': 'text-red-400',
  'All Levels': 'text-blue-400'
};

// TabTypes for strict type checking
type TabType = 'dashboard' | 'challenges' | 'learn' | 'community' | 'analytics';
type LeaderboardTabType = 'weekly' | 'allTime';

const PureSkillDashboard = () => {
  const router = useRouter();
  
  // Authentication states
  const [isLoading, setIsLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [authState, setAuthState] = useState<AuthState>({ 
    isAuthenticated: false, 
    user: null 
  });
  
  // States
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [leaderboardTab, setLeaderboardTab] = useState<LeaderboardTabType>('weekly');
  const [userName, setUserName] = useState('');
  const [userLevel, setUserLevel] = useState(1);
  const [skillProgress, setSkillProgress] = useState<SkillProgress>({
    stocks: 78,
    coding: 65,
    trivia: 92,
    logic: 84,
    math: 71
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [darkMode, setDarkMode] = useState(true);
  
  // Check authentication status with improved session handling
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      
      try {
        // Set a flag in localStorage to prevent redirect loops
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('dashboardLoaded', 'true');
        }
        
        // First check directly with Supabase if there's an active session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error checking session:', sessionError.message);
          // Don't redirect yet, try refreshing first
        }
        
        if (session) {
          console.log('Active session found for user:', session.user.email);
          
          // Now check auth state with our utility
          const authInfo = await checkAuth();
          setAuthState({
            isAuthenticated: authInfo.isAuthenticated,
            user: authInfo.user as UserProfile
          });
          
          // Set user information if authenticated
          if (authInfo.isAuthenticated && authInfo.user) {
            console.log('User authenticated in dashboard:', authInfo.user);
            
            // Set user name (first priority: first+last name, second: username, third: email)
            const user = authInfo.user as UserProfile;
            if (user.firstName && user.lastName) {
              setUserName(`${user.firstName} ${user.lastName}`);
            } else if (user.username) {
              setUserName(user.username);
            } else if (user.email) {
              // Use part before @ in email if no name is available
              setUserName(user.email.split('@')[0]);
            }
            
            // Set user level (default to 1 if not available)
            setUserLevel(user.level || 1);
            
            // You can set other user-specific data here
            // For example, if you have skill progress stored in the user profile:
            if (user.skillProgress) {
              setSkillProgress(user.skillProgress);
            }
          } else {
            console.warn('Session exists but checkAuth returned not authenticated - using session data directly');
            
            // Fall back to using session data directly if checkAuth failed
            const userData = session.user;
            if (userData.email) {
              setUserName(userData.email.split('@')[0]);
              setAuthState({ 
                isAuthenticated: true, 
                user: {
                  id: userData.id,
                  email: userData.email,
                  ...userData.user_metadata
                } as UserProfile
              });
            }
          }
        } else {
          console.log('No active session found, trying to refresh...');
          
          // Try refreshing the session
          const refreshResult = await refreshAuth();
          
          if (refreshResult.success) {
            console.log('Session refreshed successfully');
            
            // Check auth again after refresh
            const refreshedAuthInfo = await checkAuth();
            setAuthState({
              isAuthenticated: refreshedAuthInfo.isAuthenticated,
              user: refreshedAuthInfo.user as UserProfile
            });
            
            if (refreshedAuthInfo.isAuthenticated && refreshedAuthInfo.user) {
              // Set user information from refreshed session
              const user = refreshedAuthInfo.user as UserProfile;
              if (user.firstName && user.lastName) {
                setUserName(`${user.firstName} ${user.lastName}`);
              } else if (user.username) {
                setUserName(user.username);
              } else if (user.email) {
                setUserName(user.email.split('@')[0]);
              }
              
              setUserLevel(user.level || 1);
            } else {
              console.log('Refresh succeeded but still not authenticated, redirecting to login');
              // Wait a moment before redirecting to avoid potential loops
              setTimeout(() => {
                if (typeof localStorage !== 'undefined') {
                  localStorage.removeItem('dashboardLoaded');
                }
                router.push('/auth/login?returnTo=/dashboard');
              }, 1000);
              return;
            }
          } else {
            console.log('Session refresh failed, redirecting to login');
            // Wait a moment before redirecting to avoid potential loops
            setTimeout(() => {
              if (typeof localStorage !== 'undefined') {
                localStorage.removeItem('dashboardLoaded');
              }
              router.push('/auth/login?returnTo=/dashboard');
            }, 1000);
            return;
          }
        }
      } catch (error) {
        console.error('Error initializing auth in dashboard:', error);
        // Don't redirect on error, just show dashboard with default state
      } finally {
        setIsLoading(false);
        
        // Clear the flag after 15 seconds to prevent it from persisting too long
        setTimeout(() => {
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('dashboardLoaded');
          }
        }, 15000);
      }
    };
    
    initAuth();
    
    // Cleanup function
    return () => {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('dashboardLoaded');
      }
    };
  }, [router]);
  
  // Set up auth state change listener
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        if (event === 'SIGNED_OUT') {
          setAuthState({ isAuthenticated: false, user: null });
          router.push('/auth/login');
        } else if (event === 'SIGNED_IN' && session) {
          // Update auth state when signed in
          setAuthState({ 
            isAuthenticated: true, 
            user: {
              id: session.user.id,
              email: session.user.email,
              ...session.user.user_metadata
            } as UserProfile
          });
        }
      }
    );
    
    return () => {
      // Clean up the listener when the component unmounts
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [router]);
  
  // Handle logout with improved error handling
  const handleLogout = async () => {
    setIsLoading(true);
    
    try {
      const { success, error } = await logout();
      
      if (success) {
        // Clear any auth-related localStorage items
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('dashboardLoaded');
        }
        
        // Redirect to login page
        router.push('/auth/login');
      } else {
        console.error('Logout failed:', error);
        // Try direct Supabase signOut as fallback
        await supabase.auth.signOut();
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Try direct Supabase signOut as fallback
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Final signOut attempt failed:', e);
      }
      router.push('/auth/login');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Navigate to donate page
  const navigateToDonate = () => {
    window.location.href = '/donate';
  };

  // Format category color with proper type checking
  const getCategoryColor = (category: string): string => {
    return CATEGORY_COLORS[category as CategoryKey] || 'text-gray-400';
  };
  
  // Format category background with proper type checking
  const getCategoryBackground = (category: string): string => {
    return CATEGORY_BACKGROUNDS[category as CategoryKey] || 'bg-gray-400/10 border-gray-400/20';
  };
  
  // Format difficulty color with proper type checking
  const getDifficultyColor = (difficulty: string): string => {
    return DIFFICULTY_COLORS[difficulty as DifficultyKey] || 'text-gray-400';
  };

  // Get user initials for avatar
  const getUserInitials = (): string => {
    if (!userName) return '?';
    
    const nameParts = userName.split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`;
    }
    
    return userName.charAt(0);
  };
  
  // Sample data
  const upcomingChallenges: Challenge[] = [
    { id: 1, title: "Stock Market Analysis", category: "Stocks", difficulty: "Advanced", time: "Today, 4:00 PM", participants: 24 },
    { id: 2, title: "Algorithm Optimization", category: "Coding", difficulty: "Expert", time: "Tomorrow, 2:30 PM", participants: 18 },
    { id: 3, title: "Science & History Quiz", category: "Trivia", difficulty: "Intermediate", time: "Friday, 6:00 PM", participants: 32 },
    { id: 4, title: "Pattern Recognition Challenge", category: "Logic", difficulty: "Advanced", time: "Saturday, 1:00 PM", participants: 16 }
  ];
  
  const recentAchievements: Achievement[] = [
    { id: 1, title: "Analytical Genius", description: "Correctly predicted stock movements 10 times in a row", icon: <TrendingUp size={20} /> },
    { id: 2, title: "Code Ninja", description: "Solved 5 algorithm challenges in under 30 minutes", icon: <Code size={20} /> },
    { id: 3, title: "Knowledge Master", description: "Answered 25 trivia questions correctly in a row", icon: <BookOpen size={20} /> }
  ];
  
  const recommendedCourses: Course[] = [
    { id: 1, title: "Technical Analysis Fundamentals", category: "Stocks", level: "Beginner", duration: "3 hours", enrolled: 1287 },
    { id: 2, title: "Data Structures & Algorithms", category: "Coding", level: "Intermediate", duration: "8 hours", enrolled: 956 },
    { id: 3, title: "Advanced Python for Finance", category: "Coding & Stocks", level: "Advanced", duration: "5 hours", enrolled: 743 },
    { id: 4, title: "Logic Puzzles Masterclass", category: "Logic", level: "All Levels", duration: "4 hours", enrolled: 1029 }
  ];
  
  const leaderboardData: LeaderboardUser[] = [
    { rank: 1, name: "JasonTech", score: 9875, change: "up" },
    { rank: 2, name: "DataMaster", score: 9632, change: "up" },
    { rank: 3, name: "StockWizard", score: 9541, change: "down" },
    { rank: 4, name: "CodeNinja", score: 9489, change: "up" },
    { rank: 5, name: "QuizChamp", score: 9356, change: "same" }
  ];
  
  const skillCategories: SkillCategory[] = [
    { id: 'all', name: 'All Categories', icon: <Compass size={18} /> },
    { id: 'stocks', name: 'Stock Analysis', icon: <TrendingUp size={18} /> },
    { id: 'coding', name: 'Coding Skills', icon: <Code size={18} /> },
    { id: 'trivia', name: 'Knowledge & Trivia', icon: <BookOpen size={18} /> },
    { id: 'logic', name: 'Logic & Puzzles', icon: <Puzzle size={18} /> },
    { id: 'math', name: 'Mathematics', icon: <Activity size={18} /> }
  ];
  
  const communityPosts: CommunityPost[] = [
    { id: 1, author: "MarketExpert", title: "My strategy for volatile markets", likes: 45, comments: 12, time: "2h ago" },
    { id: 2, author: "CodeMaster", title: "Optimizing sorting algorithms - tips & tricks", likes: 32, comments: 8, time: "4h ago" },
    { id: 3, author: "TriviaPro", title: "How I memorize historical dates effectively", likes: 28, comments: 15, time: "6h ago" }
  ];
  
  const notifications: Notification[] = [
    { id: 1, type: "challenge", message: "New coding challenge available: Algorithm Optimization", time: "10m ago" },
    { id: 2, type: "achievement", message: "You earned the 'Analytical Genius' badge!", time: "1h ago" },
    { id: 3, type: "system", message: "Your skill assessment for Stock Analysis is ready", time: "3h ago" },
    { id: 4, type: "social", message: "CodeMaster commented on your solution", time: "5h ago" }
  ];

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex flex-col items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Top Navigation Bar */}
      <header className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b sticky top-0 z-50`}>
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and primary navigation */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <div className="flex items-center">
                  <div className={`bg-gradient-to-r from-blue-500 to-emerald-500 text-white p-1.5 rounded`}>
                    <Brain size={24} />
                  </div>
                  <span className="ml-2 font-bold text-xl">Cerebro</span>
                </div>
              </div>
              
              {/* Desktop Menu */}
              <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`${activeTab === 'dashboard' ? 'border-blue-500 text-blue-500' : 'border-transparent hover:text-blue-500'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <Home size={18} className="mr-2" />
                  Dashboard
                </button>
                <button 
                  onClick={() => setActiveTab('challenges')}
                  className={`${activeTab === 'challenges' ? 'border-blue-500 text-blue-500' : 'border-transparent hover:text-blue-500'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <Target size={18} className="mr-2" />
                  Challenges
                </button>
                <button 
                  onClick={() => setActiveTab('learn')}
                  className={`${activeTab === 'learn' ? 'border-blue-500 text-blue-500' : 'border-transparent hover:text-blue-500'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <BookOpen size={18} className="mr-2" />
                  Learn
                </button>
                <button 
                  onClick={() => setActiveTab('community')}
                  className={`${activeTab === 'community' ? 'border-blue-500 text-blue-500' : 'border-transparent hover:text-blue-500'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <Users size={18} className="mr-2" />
                  Community
                </button>
                <button 
                  onClick={() => setActiveTab('analytics')}
                  className={`${activeTab === 'analytics' ? 'border-blue-500 text-blue-500' : 'border-transparent hover:text-blue-500'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <BarChart2 size={18} className="mr-2" />
                  Analytics
                </button>
              </nav>
            </div>
            
            {/* Right side actions */}
            <div className="flex items-center">
              {/* Search */}
              <div className="hidden md:block mr-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={16} className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search..."
                    className={`${darkMode ? 'bg-gray-800 text-white placeholder-gray-400 border-gray-700' : 'bg-gray-100 text-gray-900 placeholder-gray-500 border-gray-200'} block w-full pl-10 pr-3 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm transition`}
                  />
                </div>
              </div>
              
              {/* Donate Button */}
              <button 
                onClick={navigateToDonate}
                className="mr-3 sm:mr-4 rounded-lg px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-blue-500 to-emerald-500 text-white hover:from-blue-600 hover:to-emerald-600 transition shadow"
              >
                <div className="flex items-center">
                  <Gift size={16} className="mr-1.5" />
                  <span className="hidden sm:inline">Donate</span>
                </div>
              </button>
              
              {/* Notifications */}
              <div className="relative mr-3 sm:mr-4">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'} relative`}
                >
                  <Bell size={20} />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                </button>
                
                {showNotifications && (
                  <div className={`origin-top-right absolute right-0 mt-2 w-80 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} ring-1 ring-black ring-opacity-5 z-50 divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    <div className="px-4 py-3 flex justify-between items-center">
                      <h3 className="font-medium">Notifications</h3>
                      <button className="text-sm text-blue-500 hover:text-blue-600">Mark all as read</button>
                    </div>
                    <div className={`max-h-80 overflow-y-auto ${darkMode ? 'scrollbar-dark' : 'scrollbar-light'}`}>
                      {notifications.map(notification => (
                        <div key={notification.id} className={`px-4 py-3 hover:${darkMode ? 'bg-gray-700' : 'bg-gray-100'} transition`}>
                          <div className="flex">
                            <div className="mr-3 mt-1">
                              {notification.type === 'challenge' ? (
                                <Target size={18} className="text-blue-500" />
                              ) : notification.type === 'achievement' ? (
                                <Award size={18} className="text-yellow-500" />
                              ) : notification.type === 'system' ? (
                                <Info size={18} className="text-emerald-500" />
                              ) : (
                                <MessageSquare size={18} className="text-purple-500" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{notification.message}</p>
                              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>{notification.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2">
                      <button className="w-full text-center text-sm text-blue-500 hover:text-blue-600 py-1">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* User Menu */}
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 flex items-center justify-center text-white font-medium text-sm">
                    {getUserInitials()}
                  </div>
                  <ChevronDown size={16} className="ml-1.5" />
                </button>
                
                {showUserMenu && (
                  <div className={`origin-top-right absolute right-0 mt-2 w-48 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} ring-1 ring-black ring-opacity-5 z-50`}>
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-gray-700">
                        <div className="font-medium">{userName}</div>
                        <div className="text-xs text-blue-400">Level {userLevel}</div>
                      </div>
                      <a href="#" className="block px-4 py-2 text-sm hover:bg-blue-500 hover:text-white transition">
                        <div className="flex items-center">
                          <User size={16} className="mr-2" />
                          Profile
                        </div>
                      </a>
                      <a href="/wallet" className="block px-4 py-2 text-sm hover:bg-blue-500 hover:text-white transition">
                        <div className="flex items-center">
                          <Wallet size={16} className="mr-2" />
                          Wallet
                        </div>
                      </a>
                      <a href="#" className="block px-4 py-2 text-sm hover:bg-blue-500 hover:text-white transition">
                        <div className="flex items-center">
                          <Settings size={16} className="mr-2" />
                          Settings
                        </div>
                      </a>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-blue-500 hover:text-white transition"
                      >
                        <div className="flex items-center">
                          <LogOut size={16} className="mr-2" />
                          Sign out
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Toggle for dark/light mode */}
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className={`ml-3 p-2 rounded-lg ${darkMode ? 'bg-gray-800 text-yellow-400' : 'bg-gray-200 text-gray-800'}`}
              >
                {darkMode ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Category Navigation */}
        <div className={`mb-8 overflow-x-auto ${darkMode ? 'scrollbar-dark' : 'scrollbar-light'}`}>
          <div className="flex space-x-2 pb-1 min-w-max">
            {skillCategories.map(category => (
              <button
                key={category.id}
                onClick={() => setCurrentCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center transition
                  ${currentCategory === category.id 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : darkMode 
                      ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                      : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'
                  }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className={`rounded-xl overflow-hidden shadow-lg bg-gradient-to-r from-blue-600 to-emerald-600`}>
              <div className="p-6 sm:p-8 md:p-10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="mb-6 md:mb-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                      Welcome back, {userName ? userName.split(' ')[0] : 'User'}!
                    </h1>
                    <p className="text-blue-100 max-w-xl">Continue developing your skills, take on new challenges, and track your progress as you master new abilities.</p>
                    <div className="flex items-center mt-6">
                      <div className="flex items-center justify-center bg-white bg-opacity-20 rounded-lg px-4 py-2">
                        <Trophy className="text-yellow-300 mr-2" size={20} />
                        <span className="text-white font-medium">Level {userLevel}</span>
                      </div>
                      <div className="ml-4 flex items-center justify-center bg-white bg-opacity-20 rounded-lg px-4 py-2">
                        <Star className="text-yellow-300 mr-2" size={20} />
                        <span className="text-white font-medium">4.8/5.0 Rating</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <button className={`bg-white text-blue-600 hover:bg-blue-50 px-5 py-3 rounded-lg font-medium flex items-center shadow-md transition`}>
                      <PlusSquare size={20} className="mr-2" />
                      Take Skill Assessment
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {/* Daily Challenge Card */}
              <div className={`rounded-xl shadow ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                <div className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-lg">Daily Challenge</h2>
                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-500/10 text-blue-500' : 'bg-blue-100 text-blue-700'}`}>
                      <Target size={18} />
                    </div>
                  </div>
                  <div className={`rounded-lg p-4 mb-4 ${getCategoryBackground('Coding')}`}>
                    <div className={`font-medium mb-1 ${getCategoryColor('Coding')}`}>Coding Challenge</div>
                    <h3 className="font-bold text-lg mb-1">Algorithm Optimization</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                      Optimize a sorting algorithm to handle large datasets efficiently.
                    </p>
                    <div className="flex justify-between items-center">
                      <div className={`text-sm ${getDifficultyColor('Advanced')}`}>Advanced</div>
                      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>~45 minutes</div>
                    </div>
                  </div>
                  <button className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition">
                    Start Challenge
                  </button>
                </div>
              </div>
              
              {/* Skill Progress Card */}
              <div className={`rounded-xl shadow ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                <div className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-lg">Skill Progress</h2>
                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-emerald-500/10 text-emerald-500' : 'bg-emerald-100 text-emerald-700'}`}>
                      <Activity size={18} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(skillProgress).map(([skill, progress]) => (
                      <div key={skill}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="capitalize">{skill}</span>
                          <span className="text-sm font-medium">{progress}%</span>
                        </div>
                        <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                          <div 
                            className={`h-2 rounded-full ${
                              skill === 'stocks' ? 'bg-emerald-500' :
                              skill === 'coding' ? 'bg-blue-500' :
                              skill === 'trivia' ? 'bg-purple-500' :
                              skill === 'logic' ? 'bg-amber-500' :
                              'bg-rose-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Recent Achievements Card */}
              <div className={`rounded-xl shadow ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                <div className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-lg">Recent Achievements</h2>
                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-yellow-500/10 text-yellow-500' : 'bg-yellow-100 text-yellow-700'}`}>
                      <Award size={18} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {recentAchievements.map(achievement => (
                      <div key={achievement.id} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-gray-100 hover:bg-gray-200'} transition`}>
                        <div className="flex items-start">
                          <div className={`p-2 rounded-lg mr-3 ${
                            achievement.id === 1 ? 'bg-emerald-500/20 text-emerald-500' :
                            achievement.id === 2 ? 'bg-blue-500/20 text-blue-500' : 'bg-purple-500/20 text-purple-500'
                          }`}>
                            {achievement.icon}
                          </div>
                          <div>
                            <div className="font-medium">{achievement.title}</div>
                            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {achievement.description}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className={`w-full py-2 mt-3 rounded-lg font-medium border ${darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'} transition text-center`}>
                    View All Achievements
                  </button>
                </div>
              </div>
            </div>
            
            {/* Upcoming Challenges Section */}
            <div className={`rounded-xl shadow ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
              <div className="p-5">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-bold text-xl">Upcoming Challenges</h2>
                  <button className="text-blue-500 hover:text-blue-600 font-medium flex items-center">
                    View All
                    <ArrowUpRight size={16} className="ml-1" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className={`${darkMode ? 'border-gray-800' : 'border-gray-200'} border-b`}>
                        <th className="text-left py-3 font-medium">Challenge</th>
                        <th className="text-left py-3 font-medium">Category</th>
                        <th className="text-left py-3 font-medium">Difficulty</th>
                        <th className="text-left py-3 font-medium">Starts</th>
                        <th className="text-left py-3 font-medium">Participants</th>
                        <th className="text-right py-3 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-gray-800' : 'divide-gray-200'}`}>
                      {upcomingChallenges.map(challenge => (
                        <tr key={challenge.id}>
                          <td className="py-4">
                            <div className="font-medium">{challenge.title}</div>
                          </td>
                          <td className="py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs ${getCategoryBackground(challenge.category)} ${getCategoryColor(challenge.category)}`}>
                              {challenge.category}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className={`text-sm ${getDifficultyColor(challenge.difficulty)}`}>
                              {challenge.difficulty}
                            </span>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center">
                              <Clock size={14} className="mr-1.5 text-gray-400" />
                              <span className="text-sm">{challenge.time}</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center">
                              <Users size={14} className="mr-1.5 text-gray-400" />
                              <span className="text-sm">{challenge.participants}</span>
                            </div>
                          </td>
                          <td className="py-4 text-right">
                            <button className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition">
                              Register
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* Two Column Layout: Recommended Courses and Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recommended Courses */}
              <div className={`rounded-xl shadow ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'} lg:col-span-2`}>
                <div className="p-5">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="font-bold text-xl">Recommended Courses</h2>
                    <button className="text-blue-500 hover:text-blue-600 font-medium flex items-center">
                      Browse Library
                      <ArrowUpRight size={16} className="ml-1" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendedCourses.map(course => (
                      <div key={course.id} className={`rounded-lg p-4 ${darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-gray-100 hover:bg-gray-200'} transition`}>
                        <div className={`text-sm ${getCategoryColor(course.category)} mb-1`}>{course.category}</div>
                        <h3 className="font-bold text-lg mb-2">{course.title}</h3>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className={`px-2 py-0.5 rounded text-xs ${getDifficultyColor(course.level)} ${course.level === 'Beginner' ? 'bg-green-500/10' : course.level === 'Intermediate' ? 'bg-yellow-500/10' : course.level === 'Advanced' ? 'bg-orange-500/10' : 'bg-blue-500/10'}`}>
                              {course.level}
                            </div>
                            <div className={`ml-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{course.duration}</div>
                          </div>
                          <div className="flex items-center text-xs text-gray-400">
                            <Users size={12} className="mr-1" />
                            {course.enrolled.toLocaleString()}
                          </div>
                        </div>
                        <button className="w-full py-2 mt-2 rounded-lg font-medium bg-blue-500 hover:bg-blue-600 text-white transition">
                          Start Learning
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Leaderboard */}
              <div className={`rounded-xl shadow ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                <div className="p-5">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="font-bold text-xl">Leaderboard</h2>
                    <div className="flex">
                      <button 
                        onClick={() => setLeaderboardTab('weekly')}
                        className={`px-2.5 py-1 text-xs rounded-l-lg ${leaderboardTab === 'weekly' ? 'bg-blue-500 text-white' : darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                        Weekly
                      </button>
                      <button 
                        onClick={() => setLeaderboardTab('allTime')}
                        className={`px-2.5 py-1 text-xs rounded-r-lg ${leaderboardTab === 'allTime' ? 'bg-blue-500 text-white' : darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                        All Time
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {leaderboardData.map(user => (
                      <div key={user.rank} className={`flex items-center p-3 rounded-lg ${darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-gray-100 hover:bg-gray-200'} transition`}>
                        <div className={`w-7 h-7 flex-shrink-0 rounded-full ${
                          user.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                          user.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                          user.rank === 3 ? 'bg-gradient-to-br from-amber-500 to-amber-700' :
                          'bg-gray-700'
                        } flex items-center justify-center text-xs font-bold text-white`}>
                          {user.rank}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-gray-400">{user.score.toLocaleString()} pts</div>
                        </div>
                        <div className={`
                          ${user.change === 'up' ? 'text-green-500' : 
                           user.change === 'down' ? 'text-red-500' : 'text-gray-400'}
                        `}>
                          {user.change === 'up' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="18 15 12 9 6 15"></polyline>
                            </svg>
                          ) : user.change === 'down' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className={`w-full py-2 mt-4 rounded-lg font-medium border ${darkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'} transition`}>
                    View Full Leaderboard
                  </button>
                </div>
              </div>
            </div>
            
            {/* Community Activity Section */}
            <div className={`rounded-xl shadow ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
              <div className="p-5">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-bold text-xl">Community Activity</h2>
                  <button className="text-blue-500 hover:text-blue-600 font-medium flex items-center">
                    View All
                    <ArrowUpRight size={16} className="ml-1" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {communityPosts.map(post => (
                    <div key={post.id} className={`rounded-lg p-4 ${darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-gray-100 hover:bg-gray-200'} transition`}>
                      <div className="flex items-center mb-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white font-medium text-sm">
                          {post.author.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <div className="font-medium">{post.author}</div>
                          <div className="text-xs text-gray-400">{post.time}</div>
                        </div>
                      </div>
                      <h3 className="font-bold mb-3">{post.title}</h3>
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center">
                          <Heart size={16} className="mr-1 text-pink-500" />
                          <span>{post.likes}</span>
                        </div>
                        <div className="flex items-center">
                          <MessageSquare size={16} className="mr-1 text-blue-500" />
                          <span>{post.comments}</span>
                        </div>
                        <button className="text-blue-500 hover:text-blue-600">Read Post</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className={`py-6 ${darkMode ? 'bg-gray-900 border-t border-gray-800' : 'bg-white border-t border-gray-200'}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="flex items-center mb-4 md:mb-0">
              <div className={`bg-gradient-to-r from-blue-500 to-emerald-500 text-white p-1.5 rounded`}>
                <Brain size={20} />
              </div>
              <span className="ml-2 font-bold">Cerebro</span>
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="#" className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition`}>About</a>
              <a href="#" className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition`}>Privacy</a>
              <a href="#" className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition`}>Terms</a>
              <a href="#" className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition`}>Contact</a>
            </div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-4 md:mt-0`}>
              &copy; 2025 Cerebro. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PureSkillDashboard;