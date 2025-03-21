/**
 * User Types for Cerebro Application
 * These types define the structure of user data throughout the application
 */

/**
 * Basic user information from Supabase Auth
 */
export interface User {
    id: string;
    email?: string;
    // Use more specific types for metadata
    user_metadata?: Record<string, string | number | boolean | null | undefined>;
    app_metadata?: Record<string, string | number | boolean | null | undefined>;
    created_at?: string;
    updated_at?: string;
  }
  
  /**
   * Skill progress tracking
   */
  export interface SkillProgress {
    stocks: number;
    coding: number;
    trivia: number;
    logic: number;
    math: number;
    [key: string]: number;
  }
  
  /**
   * User preferences
   */
  export interface UserPreferences {
    darkMode?: boolean;
    notifications?: boolean;
    emailFrequency?: 'daily' | 'weekly' | 'never';
    challengeLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    showRealNames?: boolean;
    favoriteCategories?: string[];
    [key: string]: string | number | boolean | string[] | undefined;
  }
  
  /**
   * Extended user profile information
   */
  export interface UserProfile {
    id: string;
    email?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    level?: number;
    points?: number;
    skillProgress?: SkillProgress;
    achievements?: string[];
    donorRank?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
    totalDonated?: number;
    joinDate?: string;
    lastActive?: string;
    preferences?: UserPreferences;
    // Use a more specific index signature that still allows flexibility
    [key: string]: string | number | boolean | object | undefined | null;
  }
  
  /**
   * Authentication state
   */
  export interface AuthState {
    isAuthenticated: boolean;
    user: UserProfile | null;
    isLoading?: boolean;
    error?: string | null;
  }
  
  /**
   * User authentication credentials
   */
  export interface UserCredentials {
    email: string;
    password: string;
  }
  
  /**
   * User registration data
   */
  export interface UserRegistrationData {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    dateOfBirth?: string;
    agreeToTerms: boolean;
  }