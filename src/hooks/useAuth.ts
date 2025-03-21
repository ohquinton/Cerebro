'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/api/supabase';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  [key: string]: unknown;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export const useAuth = (redirectToLogin: boolean = false) => {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const quickAuthCheck = localStorage.getItem('cerebro-logged-in') === 'true';
        
        if (!quickAuthCheck) {
          setAuthState({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: null
          });
          
          if (redirectToLogin) {
            const currentPath = window.location.pathname;
            router.push(`/auth/login?returnTo=${encodeURIComponent(currentPath)}`);
          }
          
          return;
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (session) {
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            throw userError;
          }
          
          let profileData = null;
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userData.user.id)
              .single();
              
            if (!profileError && profile) {
              profileData = profile;
            }
          } catch (e) {
            console.warn('Error fetching profile in useAuth:', e);
          }
          
          setAuthState({
            isAuthenticated: true,
            user: {
              id: userData.user.id,
              email: userData.user.email || '',
              ...userData.user.user_metadata,
              ...(profileData || {})
            },
            isLoading: false,
            error: null
          });
        } else {
          localStorage.removeItem('cerebro-logged-in');
          
          setAuthState({
            isAuthenticated: false,
            user: null,
            isLoading: false,
            error: null
          });
          
          if (redirectToLogin) {
            const currentPath = window.location.pathname;
            router.push(`/auth/login?returnTo=${encodeURIComponent(currentPath)}`);
          }
        }
      } catch (error: unknown) {
        console.error('Auth error in useAuth hook:', error);
        
        let errorMessage = 'Authentication error';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: errorMessage
        });
        
        if (redirectToLogin) {
          const currentPath = window.location.pathname;
          router.push(`/auth/login?returnTo=${encodeURIComponent(currentPath)}`);
        }
      }
    };
    
    checkAuthState();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session) {
        localStorage.setItem('cerebro-logged-in', 'true');
        
        setAuthState(prevState => ({
          ...prevState,
          isAuthenticated: true,
          user: {
            id: session.user.id,
            email: session.user.email || '',
            ...session.user.user_metadata
          },
          isLoading: false
        }));
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('cerebro-logged-in');
        
        setAuthState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: null
        });
        
        if (redirectToLogin) {
          const currentPath = window.location.pathname;
          router.push(`/auth/login?returnTo=${encodeURIComponent(currentPath)}`);
        }
      }
    });
    
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [router, redirectToLogin]);

  const signOut = async () => {
    try {
      setAuthState(prevState => ({ ...prevState, isLoading: true }));
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      localStorage.removeItem('cerebro-logged-in');
      localStorage.removeItem('dashboardLoaded');
      
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null
      });
      
      router.push('/');
      return { success: true, error: null };
    } catch (error: unknown) {
      console.error('Sign out error:', error);
      
      let errorMessage = 'Sign out failed';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setAuthState(prevState => ({
        ...prevState,
        isLoading: false,
        error: errorMessage
      }));
      
      return { success: false, error: errorMessage };
    }
  };

  return {
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    isLoading: authState.isLoading,
    error: authState.error,
    signOut
  };
};

export default useAuth;