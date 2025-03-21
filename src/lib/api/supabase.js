import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

// Load environment variables with fallbacks for Vercel builds
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kuwfeemgxeklrqrbqgfs.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1d2ZlZW1neGVrbHJxcmJxZ2ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNzIzNTcsImV4cCI6MjA1NzY0ODM1N30.CP8rg6F7XW-kQooCxowBhpUoHtW3R2b9KS4DvOCIlmc';

// Validation and fallback values
if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_KEY environment variable');
}

// Create a custom storage implementation for better debugging
const customStorage = {
  getItem: (key) => {
    if (typeof window === 'undefined') {
      return null;
    }
    
    const value = localStorage.getItem(key);
    console.log(`[Auth Storage] Retrieved ${key?.substring(0, 15)}...`);
    return value;
  },
  setItem: (key, value) => {
    if (typeof window === 'undefined') {
      return;
    }
    
    localStorage.setItem(key, value);
    console.log(`[Auth Storage] Stored ${key?.substring(0, 15)}...`);
  },
  removeItem: (key) => {
    if (typeof window === 'undefined') {
      return;
    }
    
    localStorage.removeItem(key);
    console.log(`[Auth Storage] Removed ${key?.substring(0, 15)}...`);
  }
};

// Enhanced Supabase client configuration
const supabaseOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: customStorage,
    storageKey: 'battle-bets-auth',
    flowType: 'implicit',
    debug: process.env.NODE_ENV !== 'production'
  },
  global: {
    headers: {
      'x-client-info': 'battle-bets-web'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
};

// Initialize the Supabase client with enhanced configuration
export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  supabaseOptions
);

// Function to create a Supabase server client (for server components)
export const createServerSupabaseClient = ({ cookies }) => {
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get: (name) => cookies.get(name)?.value,
        set: (name, value, options) => cookies.set(name, value, options),
        remove: (name, options) => cookies.delete(name, options),
      },
    }
  );
};

// Log initialization for debugging
console.log('Supabase client initialized with enhanced configuration');

// Function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!supabaseUrl && !!supabaseKey;
};

// Helper to check if we're on the client side
export const isClient = () => {
  return typeof window !== 'undefined';
};

// Export helper functions for logout and other auth operations
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
      return false;
    }
    
    // Clear local storage auth items
    if (isClient()) {
      localStorage.removeItem('battle-bets-logged-in');
      localStorage.removeItem('auth');
      localStorage.removeItem('dashboardLoaded');
    }
    
    return true;
  } catch (error) {
    console.error('Exception during sign out:', error);
    return false;
  }
};

export default supabase;