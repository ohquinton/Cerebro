'use client';
import React, { useState } from 'react';
import { ArrowRight, Mail, KeyRound, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/api/supabase';

interface FormData {
  email: string;
  password: string;
}

interface LoginFormProps {
  redirectPath?: string;
  onSuccess?: () => void;
}

// Text input component
const TextInput: React.FC<{
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  name: string;
  id: string;
  label: string;
  type: string;
  icon: React.ReactNode;
}> = ({ value, onChange, placeholder, name, id, label, type, icon }) => {
  return (
    <div className="relative">
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400">
          {icon}
        </div>
        <input
          id={id}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white placeholder-gray-400"
          required
        />
      </div>
    </div>
  );
};

// Password input component
const PasswordInput: React.FC<{
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  name: string;
  id: string;
  label: string;
}> = ({ value, onChange, placeholder, name, id, label }) => {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <div className="relative">
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      <div className="relative">
        <KeyRound size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400" />
        
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white placeholder-gray-400"
          required
        />
        
        <button 
          type="button"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
};

const LoginForm: React.FC<LoginFormProps> = ({
  redirectPath = '/',
  onSuccess
}) => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: ''
  });
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Updated handleSubmit function with more reliable login process
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setLoginError('Email and password are required');
      return;
    }
    
    try {
      setIsLoading(true);
      setLoginError('');
      
      // Direct Supabase login - this is more reliable than going through an API endpoint
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.user) {
        console.log('Login successful via Supabase auth, user:', data.user.email);
        
        // For temporary sessions, use sessionStorage instead of localStorage
        // This will clear when the browser is closed
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('cerebro-logged-in', 'true');
          // Make sure we don't have a conflicting localStorage item
          localStorage.removeItem('cerebro-logged-in');
        }
        
        // Set login success and trigger callback if provided
        setLoginSuccess(true);
        if (onSuccess) {
          onSuccess();
        }
        
        // Run the profile creation in background
        fetch('/api/auth/ensure-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }).catch(err => {
          console.warn('Error ensuring profile after login:', err);
        });
        
        // Add a clear explicit redirect to the landing page
        console.log('Login successful, redirecting to landing page:', redirectPath);
        
        // Use a short timeout to allow the UI to update before redirect
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 1500);
      } else {
        // Shouldn't reach here if there's no error, but just in case
        throw new Error('Login succeeded but no user data returned');
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      setLoginError(err instanceof Error ? err.message : 'An unexpected error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {loginSuccess ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-green-400">✓</span>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-green-400">Login Successful!</h3>
          <p className="text-gray-300">Redirecting you...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {loginError && (
            <div className="bg-red-900/30 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
              {loginError}
            </div>
          )}
          
          <div className="space-y-4">
            {/* Email field */}
            <TextInput
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              label="Email Address"
              icon={<Mail size={16} />}
            />
            
            {/* Password field */}
            <PasswordInput
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              label="Password"
            />
            
            {/* Forgot password link */}
            <div className="flex items-center justify-end mt-4 mb-6">
              <div>
                <a href="/auth/forgotten-password" className="text-sm text-green-400 hover:text-green-300">
                  Forgot password?
                </a>
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-md mt-6 transition-colors duration-300 flex items-center justify-center"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <>
                Sign In
                <ArrowRight size={16} className="ml-2" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default LoginForm;