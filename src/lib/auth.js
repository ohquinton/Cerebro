// src/lib/auth.js
import { supabase } from './api/supabase';

/**
 * Check if user is authenticated and get user data
 * @returns {Promise<{isAuthenticated: boolean, user: Object|null}>}
 */
export const checkAuth = async () => {
  try {
    console.log('Running checkAuth function...');
    
    // Check if we're on the dashboard page and have the dashboardLoaded flag
    // This helps prevent redirect loops
    const isDashboardLoaded = typeof window !== 'undefined' && localStorage.getItem('dashboardLoaded');
    
    // First check if there's an existing session
    const { data, error: sessionError } = await supabase.auth.getSession();
    const session = data?.session;
    
    if (sessionError) {
      console.error('Error getting session in checkAuth:', sessionError);
      return { isAuthenticated: false, user: null };
    }
    
    // If we have a session, return authenticated
    if (session) {
      console.log('Found existing session for user:', session.user.email);
      
      // Store the cerebro-logged-in flag for quick checks
      if (typeof window !== 'undefined') {
        localStorage.setItem('cerebro-logged-in', 'true');
      }
      
      // We have a valid session, extract user data
      const userData = {
        id: session.user.id,
        email: session.user.email,
        ...session.user.user_metadata
      };
      
      // Try to get additional profile data
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (!profileError && profileData) {
          console.log('Found profile data for user');
          // Return combined user data
          return { 
            isAuthenticated: true, 
            user: {
              ...userData,
              ...profileData
            }
          };
        } else if (profileError && profileError.code === 'PGRST116') {
          // Profile doesn't exist - create it
          console.log('No user profile found, creating one...');
          const { error: createError } = await ensureUserProfile(session.user);
          if (createError) {
            console.error('Error creating profile:', createError);
          } else {
            console.log('User profile created successfully');
          }
        }
      } catch (profileError) {
        console.error('Error fetching profile:', profileError);
        // Continue with user metadata only
      }
      
      // No profile data available, just return user data from session
      return {
        isAuthenticated: true,
        user: userData
      };
    }
    
    // No active session found, attempt to refresh
    console.log('No active session, attempting refresh...');
    const { success } = await refreshAuth();
    
    if (success) {
      // Refresh succeeded, check session again
      const { data: refreshData } = await supabase.auth.getSession();
      const refreshedSession = refreshData?.session;
      
      if (refreshedSession) {
        console.log('Session refreshed successfully');
        
        // Store the cerebro-logged-in flag for quick checks
        if (typeof window !== 'undefined') {
          localStorage.setItem('cerebro-logged-in', 'true');
        }
        
        // Extract user data from refreshed session
        const userData = {
          id: refreshedSession.user.id,
          email: refreshedSession.user.email,
          ...refreshedSession.user.user_metadata
        };
        
        // Try to get profile data again
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', refreshedSession.user.id)
            .single();
            
          if (!profileError && profileData) {
            return { 
              isAuthenticated: true, 
              user: {
                ...userData,
                ...profileData
              }
            };
          } else if (profileError && profileError.code === 'PGRST116') {
            // Profile doesn't exist after refresh - create it
            console.log('No user profile found after refresh, creating one...');
            const { error: createError } = await ensureUserProfile(refreshedSession.user);
            if (createError) {
              console.error('Error creating profile:', createError);
            } else {
              console.log('User profile created successfully after refresh');
            }
          }
        } catch (profileError) {
          console.error('Error fetching profile after refresh:', profileError);
        }
        
        // Return user data without profile
        return {
          isAuthenticated: true,
          user: userData
        };
      }
    }
    
    // If we're on the dashboard and we have the special flag, 
    // but we're getting "not authenticated", something is wrong with session persistence
    if (isDashboardLoaded) {
      console.warn('Dashboard loaded but no session found - session persistence issue');
      
      // Try one more direct approach to get the user
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        console.log('Found user through getUser() despite missing session');
        
        // Store the cerebro-logged-in flag for quick checks
        if (typeof window !== 'undefined') {
          localStorage.setItem('cerebro-logged-in', 'true');
        }
        
        return {
          isAuthenticated: true,
          user: {
            id: userData.user.id,
            email: userData.user.email,
            ...userData.user.user_metadata
          }
        };
      }
    }
    
    // No session and refresh failed
    console.log('No active session and refresh failed');
    
    // Clear any leftover auth flags
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cerebro-logged-in');
    }
    
    return { isAuthenticated: false, user: null };
    
  } catch (err) {
    console.error('Error in auth check:', err);
    return { isAuthenticated: false, user: null };
  }
};

/**
 * Ensure a user profile exists in the database for the authenticated user
 * This links the Supabase Auth user with our database tables
 * @param {Object} user - User object from Supabase Auth
 * @returns {Promise<{success: boolean, error: any}>}
 */
export const ensureUserProfile = async (user) => {
  if (!user || !user.id) {
    console.error('Cannot create profile: No valid user data provided');
    return { success: false, error: 'Invalid user data' };
  }
  
  try {
    console.log('Ensuring user profile exists for:', user.email);
    
    // First check if a profile already exists
    const { data: existingProfile, error: queryError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    // Handle case where the table doesn't exist  
    if (queryError && (queryError.code === '42P01' || queryError.message?.includes('does not exist'))) {
      console.error('Error checking for existing profile:', queryError);
      return { 
        success: false, 
        error: {
          message: 'Database tables not set up correctly. Please run the database migrations.',
          originalError: queryError
        }
      };
    }
      
    if (!queryError && existingProfile) {
      console.log('Profile already exists');
      return { success: true, error: null };
    }
    
    // Profile doesn't exist, create a new one
    const profileData = {
      id: user.id,
      email: user.email,
      username: user.user_metadata?.username || user.email.split('@')[0],
      created_at: new Date().toISOString()
    };
    
    console.log('Attempting to create profile with data:', profileData);
    
    const { error: insertError } = await supabase
      .from('profiles')
      .insert(profileData);
    
    if (insertError) {
      console.error('Error creating profile:', insertError);
      return { success: false, error: insertError };
    }
    
    console.log('Profile created successfully');
    
    // Also ensure the user has a wallet
    const { success: walletSuccess, error: walletError } = await ensureUserWallet(user.id);
    
    if (!walletSuccess) {
      console.warn('Created profile but failed to create wallet:', walletError);
      // Continue anyway since the profile was created
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Exception in ensureUserProfile:', error);
    return { success: false, error };
  }
};

/**
 * Ensure a user has a wallet in the database
 * @param {string} userId - User ID from auth.users
 * @returns {Promise<{success: boolean, error: any}>}
 */
export const ensureUserWallet = async (userId) => {
  if (!userId) {
    return { success: false, error: 'No user ID provided' };
  }
  
  try {
    // Check if wallet exists
    const { data: existingWallet, error: queryError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    // Handle case where the table doesn't exist  
    if (queryError && (queryError.code === '42P01' || queryError.message?.includes('does not exist'))) {
      console.error('Error checking for existing wallet:', queryError);
      return { 
        success: false, 
        error: {
          message: 'Wallet table not set up correctly. Please run the database migrations.',
          originalError: queryError
        }
      };
    }
      
    if (!queryError && existingWallet) {
      console.log('Wallet already exists for user');
      return { success: true, error: null };
    }
    
    // Create wallet data matching your schema
    const walletData = {
      user_id: userId,
      name: 'Primary Wallet',
      balance: 1000,  // Starting balance
      currency: 'USD',
      is_primary: true,
      created_at: new Date().toISOString()
    };
    
    console.log('Attempting to create wallet with data:', JSON.stringify(walletData));
    
    // Insert wallet - use RPC function or service role client for better security
    const { data: insertData, error: insertError } = await supabase
      .from('wallets')
      .insert(walletData)
      .select()
      .single();
      
    if (insertError) {
      // Check if this is an RLS policy error
      if (insertError.code === '42501' || insertError.message?.includes('violates row-level security policy')) {
        console.error('RLS policy error creating wallet. This may be a permission issue:', insertError);
        
        // Try to create the wallet using the trigger instead
        try {
          // Update the user's profile to trigger the wallet creation
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', userId);
            
          if (updateError) {
            console.error('Error triggering wallet creation via profile update:', updateError);
            return { success: false, error: updateError };
          }
          
          // Check again if wallet was created by trigger
          const { data: checkWallet, error: checkError } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', userId)
            .single();
            
          if (!checkError && checkWallet) {
            console.log('Wallet created successfully via trigger');
            return { success: true, error: null };
          } else {
            return { success: false, error: insertError };
          }
        } catch (triggerError) {
          console.error('Error in trigger attempt:', triggerError);
          return { success: false, error: triggerError };
        }
      }
      
      console.error('Error creating wallet:', insertError);
      return { success: false, error: insertError };
    }
    
    console.log('Wallet created successfully with ID:', insertData?.id);
    return { success: true, error: null };
  } catch (error) {
    console.error('Exception in ensureUserWallet:', error);
    return { success: false, error: error.message || 'Unknown error in wallet creation' };
  }
};

/**
 * Refresh the user's session
 * @returns {Promise<{success: boolean}>}
 */
export const refreshAuth = async () => {
  try {
    console.log('Attempting to refresh auth session...');
    
    // Get current session first
    const { data: sessionData } = await supabase.auth.getSession();
    const currentSession = sessionData?.session;
    
    if (currentSession?.refresh_token) {
      console.log('Found refresh token in current session');
    } else {
      console.log('No refresh token available in current session');
    }
    
    // Try to refresh the session
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Error refreshing session:', error);
      return { success: false };
    }
    
    if (!data.session) {
      console.log('No session returned after refresh attempt');
      return { success: false };
    }
    
    // Session refreshed successfully
    console.log('Session refreshed successfully for user:', data.session.user.email);
    
    // Store the cerebro-logged-in flag for quick checks
    if (typeof window !== 'undefined') {
      localStorage.setItem('cerebro-logged-in', 'true');
    }
    
    return { success: true };
  } catch (err) {
    console.error('Error in refreshAuth:', err);
    return { success: false };
  }
};

/**
 * Log the user out
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const logout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error logging out:', error);
      return { success: false, error: error.message };
    }
    
    // Clear any auth-related local storage items
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cerebro-logged-in');
      localStorage.removeItem('dashboardLoaded');
      // Remove any legacy storage keys too
      localStorage.removeItem('battle-bets-logged-in');
      localStorage.removeItem('battle-bets-auth');
      localStorage.removeItem('auth');
    }
    
    console.log('User logged out successfully');
    return { success: true, error: null };
  } catch (err) {
    console.error('Error in logout:', err);
    return { success: false, error: 'Unknown error occurred' };
  }
};

/**
 * Get user initials from name
 * @param {Object} user - User object
 * @returns {string} - User initials
 */
export const getUserInitials = (user) => {
  if (!user) return '?';
  
  if (user.first_name && user.last_name) {
    return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
  }
  
  if (user.firstName && user.lastName) {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
  }
  
  if (user.first_name) {
    return user.first_name.charAt(0);
  }
  
  if (user.firstName) {
    return user.firstName.charAt(0);
  }
  
  if (user.username) {
    return user.username.charAt(0).toUpperCase();
  }
  
  if (user.email) {
    return user.email.charAt(0).toUpperCase();
  }
  
  return '?';
};

/**
 * Create a login-and-redirect URL that maintains the return path
 * @param {string} returnPath - Path to return to after login
 * @returns {string} - URL to redirect to
 */
export const getLoginRedirectUrl = (returnPath) => {
  if (!returnPath) {
    return '/auth/login';
  }
  
  return `/auth/login?returnTo=${encodeURIComponent(returnPath)}`;
};

/**
 * Create a register-and-redirect URL that maintains the return path
 * @param {string} returnPath - Path to return to after registration
 * @returns {string} - URL to redirect to
 */
export const getRegisterRedirectUrl = (returnPath) => {
  if (!returnPath) {
    return '/auth/register';
  }
  
  return `/auth/register?returnTo=${encodeURIComponent(returnPath)}`;
};

/**
 * Simple function to check if the user is logged in without making an API call
 * Useful for UI components that need a quick check
 */
export const isLoggedInLocally = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('cerebro-logged-in') === 'true';
};

// Create a named object for the default export
const authUtils = {
  checkAuth,
  refreshAuth,
  logout,
  getUserInitials,
  getLoginRedirectUrl,
  getRegisterRedirectUrl,
  ensureUserProfile,
  ensureUserWallet,
  isLoggedInLocally
};

export default authUtils;