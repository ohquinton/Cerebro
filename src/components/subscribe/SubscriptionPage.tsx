'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Check, AlertCircle, Clock, CreditCard, Zap } from 'lucide-react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/api/supabase';
import { refreshAuth } from '@/lib/auth';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Tier data
const tiers = {
  pro: {
    name: 'Pro Tier',
    price: 5,
    description: 'For users who want unlimited practice & better performance tracking',
    features: [
      'Everything in Free Tier',
      'Unlimited Practice Challenges',
      'Unlimited Arena Matches',
      'Advanced Analytics',
      'Skill-Based Progression System',
      'Access to Coding Challenges & Duel Arena',
      'Discounted Tournament Entry (10% Off)',
      'No Ads Experience',
      'Step-by-Step Tutorial Library'
    ]
  },
  premium: {
    name: 'Premium Tier',
    price: 10,
    description: 'For serious learners & competitors who want AI coaching and elite features',
    features: [
      'Everything in Pro Tier',
      'AI-Powered Skill Coaching',
      'AI-Generated Adaptive Challenges',
      'Exclusive Competitive Challenge Modes',
      'Higher Tournament Discounts (20% Off)',
      'Early Access to New Features',
      'Priority Support & Exclusive Leaderboards',
      'Monthly Elite Tournaments',
      'Premium User Badge'
    ]
  }
};

// Create a checkout form component
const CheckoutForm = ({ tier, onSuccess }: { tier: 'pro' | 'premium', onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Trigger form validation and wallet collection
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError?.message || 'Validation error occurred');
        setIsProcessing(false);
        return;
      }
      
      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });
      
      if (error) {
        // Show error to your customer
        setErrorMessage(error.message || 'An unexpected error occurred');
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // The payment is complete!
        console.log(`Successful subscription pre-order for ${tier} tier: $${tiers[tier].price}/month`);
        onSuccess();
      } else {
        setErrorMessage('Unexpected payment state');
        setIsProcessing(false);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('An unknown error occurred');
      }
      setIsProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      {errorMessage && (
        <div className="p-3 bg-[#0E1116]/80 border border-red-500/50 rounded-lg text-red-400 text-sm mb-4">
          {errorMessage}
        </div>
      )}
      
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-3 rounded-lg font-medium transition-all duration-300 
                  bg-gradient-to-r from-green-600 to-blue-700 hover:from-green-500 hover:to-blue-600 
                  text-white shadow-lg shadow-green-900/20 
                  flex items-center justify-center"
      >
        {isProcessing ? (
          <>
            <Clock size={20} className="mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard size={20} className="mr-2" />
            Pre-order {tiers[tier].name} Subscription
          </>
        )}
      </button>
      
      <div className="text-xs text-gray-400 mt-2">
        Your subscription will begin on June 4, 2025 (Launch Day).
      </div>
    </form>
  );
};

const SubscriptionPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean;
    user: null | {
      id?: string;
      email?: string;
      username?: string;
      firstName?: string;
      [key: string]: string | number | boolean | null | undefined;
    };
  }>({ isAuthenticated: false, user: null });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<'pro' | 'premium' | null>(
    (searchParams.get('tier') === 'pro' || searchParams.get('tier') === 'premium') 
      ? (searchParams.get('tier') as 'pro' | 'premium') 
      : null
  );
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  
  // Get return path (where to go back to)
  const returnPath = searchParams.get('returnTo') || '/';
  
  // Check authentication status
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      
      try {
        // First, try to refresh the session
        await refreshAuth();
        
        // Then check auth state again after the refresh
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Get user profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          // Set auth state with user information
          setAuthState({ 
            isAuthenticated: true, 
            user: {
              id: session.user.id,
              email: session.user.email,
              ...session.user.user_metadata,
              ...(profileData || {})
            }
          });
          
          console.log('User authenticated in subscription page:', session.user.email);
        } else {
          setAuthState({ isAuthenticated: false, user: null });
          console.log('No active session found in subscription page');
        }
      } catch (error) {
        console.error('Auth check error in subscription page:', error);
        setAuthState({ isAuthenticated: false, user: null });
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();
  }, []);
  
  // Create payment intent when tier selection changes
  useEffect(() => {
    // Only create payment intent if authenticated and a tier is selected
    if (!authState.isAuthenticated || !selectedTier) return;
    
    const amount = tiers[selectedTier].price;
    
    const createPaymentIntent = async () => {
      try {
        console.log('Creating subscription payment intent for tier:', selectedTier, 'amount:', amount);
        
        const response = await fetch('/api/create-subscription-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            amount,
            tier: selectedTier,
            startDate: '2025-06-04' // Launch date
          }),
        });
        
        const data = await response.json();
        
        if (data.clientSecret) {
          console.log('Client secret received successfully');
          setClientSecret(data.clientSecret);
        } else {
          console.error('Error creating payment intent:', data.error);
          setNotification({
            show: true,
            message: data.error || 'Error creating payment intent. Please try again.',
            type: 'error'
          });
        }
      } catch (error) {
        console.error('Error creating payment intent:', error);
        setNotification({
          show: true,
          message: 'Error creating payment intent. Please try again.',
          type: 'error'
        });
      }
    };
    
    createPaymentIntent();
  }, [selectedTier, authState.isAuthenticated]);
  
  // Handle successful payment
  const handleSuccess = () => {
    setNotification({
      show: true,
      message: `Thank you for pre-ordering the ${selectedTier === 'pro' ? 'Pro' : 'Premium'} Tier! Your subscription will begin on June 4, 2025.`,
      type: 'success'
    });
    
    // Scroll to thank you section
    setTimeout(() => {
      const thankYouSection = document.getElementById('thank-you');
      if (thankYouSection) {
        thankYouSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 1000);
  };
  
  // Handle login redirect
  const handleLoginRedirect = () => {
    // Include the current URL as the return path
    router.push(`/auth/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
  };
  
  // Handle register redirect
  const handleRegisterRedirect = () => {
    // Include the current URL as the return path
    router.push(`/auth/register?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
  };
  
  // Handle back button click
  const handleBackClick = () => {
    if (returnPath && returnPath !== '/') {
      router.push(returnPath);
    } else {
      router.push('/');
    }
  };

  // Handle tier selection
  const handleTierSelect = (tier: 'pro' | 'premium') => {
    setSelectedTier(tier);
    
    // Update URL without refreshing the page
    const params = new URLSearchParams(window.location.search);
    params.set('tier', tier);
    router.push(`/subscribe?${params.toString()}`, { scroll: false });
  };
  
  // If still loading, show loading indicator
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0E1116] to-[#131921] flex flex-col items-center justify-center text-white">
        <div className="text-center">
          <Clock size={40} className="mx-auto mb-4 text-white animate-spin" />
          <p className="text-xl">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0E1116] to-[#131921] text-white">
      {/* Back button */}
      <button 
        onClick={handleBackClick}
        className="absolute top-4 left-4 flex items-center text-sm text-gray-300 hover:text-white"
      >
        <ChevronLeft size={20} className="mr-1" />
        <span>Back</span>
      </button>
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent mb-2">
              Pre-order Your Subscription
            </h1>
            <p className="text-xl text-gray-300 mb-6 max-w-2xl mx-auto">
              Choose the plan that fits your needs. Your subscription will begin on June 4, 2025 (Launch Day).
            </p>
            
            {/* Show greeting if authenticated */}
            {authState.isAuthenticated && authState.user && (
              <div className="bg-gradient-to-b from-[#131921]/90 to-[#1A202C]/90 border border-green-500/30 rounded-lg p-4 mb-6 max-w-md mx-auto">
                <p className="flex items-center text-green-400 mb-2">
                  <Check size={20} className="mr-2 flex-shrink-0" />
                  Welcome, {authState.user?.username || authState.user?.firstName || authState.user?.email}!
                </p>
                <p className="text-gray-300 text-sm">
                  You&apos;re logged in and ready to pre-order your subscription.
                </p>
              </div>
            )}
            
            {/* Authentication notice if not authenticated */}
            {!authState.isAuthenticated && (
              <div className="bg-gradient-to-b from-[#131921]/90 to-[#1A202C]/90 border border-green-500/30 rounded-lg p-4 mb-6 max-w-md mx-auto">
                <p className="flex items-center text-green-400 mb-2">
                  <AlertCircle size={20} className="mr-2 flex-shrink-0" />
                  You need to be signed in to pre-order
                </p>
                <div className="flex space-x-4 justify-center mt-3">
                  <button
                    onClick={handleLoginRedirect}
                    className="px-4 py-2 bg-[#0E1116]/80 hover:bg-[#131921] border border-green-500/20 text-gray-300 hover:text-white rounded-lg transition-all duration-300"
                  >
                    Log In
                  </button>
                  <button
                    onClick={handleRegisterRedirect}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-700 hover:from-green-500 hover:to-blue-600 rounded-lg transition-all duration-300 shadow-lg shadow-green-900/20"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            )}
            
            {/* Notification */}
            {notification.show && (
              <div className={`mb-8 p-4 rounded-lg flex items-center justify-between ${
                notification.type === 'success' ? 'bg-gradient-to-b from-[#131921]/90 to-[#1A202C]/90 border border-green-500/30' :
                notification.type === 'error' ? 'bg-gradient-to-b from-[#131921]/90 to-[#1A202C]/90 border border-red-500/30' :
                'bg-gradient-to-b from-[#131921]/90 to-[#1A202C]/90 border border-blue-500/30'
              }`}>
                <span className={`${
                  notification.type === 'success' ? 'text-green-400' :
                  notification.type === 'error' ? 'text-red-400' :
                  'text-blue-400'
                }`}>
                  {notification.message}
                </span>
                <button onClick={() => setNotification({ ...notification, show: false })}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
            
            {/* Subscription Tier Selection */}
            {!selectedTier && (
              <div className="grid md:grid-cols-2 gap-6 mt-8">
                {/* Pro Tier */}
                <div className="bg-gradient-to-b from-[#131921] to-[#1A202C] rounded-xl border border-green-500/30 shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-green-600 to-blue-700 p-1">
                    <div className="bg-[#0E1116] p-6 text-center">
                      <h2 className="text-2xl font-bold text-white mb-2">{tiers.pro.name}</h2>
                      <p className="text-4xl font-bold text-green-400 mb-2">${tiers.pro.price}<span className="text-lg text-gray-400">/month</span></p>
                      <p className="text-gray-300 mb-4">{tiers.pro.description}</p>
                      
                      <button
                        onClick={() => handleTierSelect('pro')}
                        disabled={!authState.isAuthenticated}
                        className="w-full py-3 rounded-lg font-medium transition-all duration-300 
                                  bg-gradient-to-r from-green-600 to-blue-700 hover:from-green-500 hover:to-blue-600 
                                  text-white shadow-lg shadow-green-900/20 
                                  flex items-center justify-center"
                      >
                        <Zap size={20} className="mr-2" />
                        Pre-order Pro Tier
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <ul className="space-y-2">
                      {tiers.pro.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check size={16} className="text-green-400 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {/* Premium Tier */}
                <div className="bg-gradient-to-b from-[#131921] to-[#1A202C] rounded-xl border border-blue-500/30 shadow-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-700 p-1">
                    <div className="bg-[#0E1116] p-6 text-center">
                      <div className="bg-blue-600 text-xs font-semibold text-white py-1 px-3 rounded-full inline-block mb-2">
                        MOST POPULAR
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2">{tiers.premium.name}</h2>
                      <p className="text-4xl font-bold text-blue-400 mb-2">${tiers.premium.price}<span className="text-lg text-gray-400">/month</span></p>
                      <p className="text-gray-300 mb-4">{tiers.premium.description}</p>
                      
                      <button
                        onClick={() => handleTierSelect('premium')}
                        disabled={!authState.isAuthenticated}
                        className="w-full py-3 rounded-lg font-medium transition-all duration-300 
                                  bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-500 hover:to-purple-600 
                                  text-white shadow-lg shadow-blue-900/20 
                                  flex items-center justify-center"
                      >
                        <Zap size={20} className="mr-2" />
                        Pre-order Premium Tier
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <ul className="space-y-2">
                      {tiers.premium.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check size={16} className="text-blue-400 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {/* Payment Form - Only show if a tier is selected */}
            {selectedTier && (
              <div className="bg-gradient-to-b from-[#131921] to-[#1A202C] backdrop-blur-md rounded-xl border border-green-500/30 shadow-xl overflow-hidden mt-8 max-w-2xl mx-auto">
                <div className={`${selectedTier === 'pro' ? 'bg-gradient-to-r from-green-600 to-blue-700' : 'bg-gradient-to-r from-blue-600 to-purple-700'} p-4`}>
                  <h2 className="text-xl font-semibold flex items-center">
                    <CreditCard size={20} className="mr-2" />
                    Pre-order {selectedTier === 'pro' ? 'Pro Tier' : 'Premium Tier'} Subscription
                  </h2>
                </div>
                
                <div className="p-6">
                  {/* Tier Information */}
                  <div className="mb-6 p-4 bg-[#0E1116]/80 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-bold">{tiers[selectedTier].name}</h3>
                        <p className="text-sm text-gray-400">Subscription starts June 4, 2025</p>
                      </div>
                      <div className="text-2xl font-bold text-green-400">
                        ${tiers[selectedTier].price}<span className="text-sm text-gray-400">/month</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setSelectedTier(null)}
                      className="text-sm text-blue-400 hover:text-blue-300 underline"
                    >
                      Change selection
                    </button>
                  </div>
                  
                  {/* Stripe Payment Element */}
                  {authState.isAuthenticated && clientSecret && (
                    <div className="pt-4">
                      <Elements stripe={stripePromise} options={{ 
                        clientSecret, 
                        appearance: { 
                          theme: 'night', 
                          variables: { 
                            colorPrimary: '#34D399',
                            colorBackground: '#0E1116', 
                            colorText: '#FFFFFF',
                            colorDanger: '#EF4444',
                            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                            spacingUnit: '4px',
                            borderRadius: '8px'
                          },
                          rules: {
                            '.Input': {
                              border: '1px solid #34D39930',
                              boxShadow: 'none',
                              backgroundColor: 'rgba(0, 0, 0, 0.6)'
                            },
                            '.Input:focus': {
                              border: '1px solid #34D399',
                              boxShadow: '0 0 0 1px #34D399'
                            },
                            '.Label': {
                              color: '#D1D5DB'
                            },
                            '.Tab': {
                              border: '1px solid #34D39930',
                              backgroundColor: 'rgba(0, 0, 0, 0.4)'
                            },
                            '.Tab:hover': {
                              border: '1px solid #34D39950',
                              backgroundColor: 'rgba(0, 0, 0, 0.6)'
                            },
                            '.Tab--selected': {
                              borderColor: '#34D399',
                              backgroundColor: 'rgba(0, 0, 0, 0.8)'
                            },
                            '.TabIcon': {
                              color: '#34D399'
                            },
                            '.TabLabel': {
                              color: '#D1D5DB'
                            },
                            '.p-ButtonPrimary': {
                              backgroundColor: '#16a34a',
                              color: 'white'
                            },
                            '.p-ButtonPrimary:hover': {
                              backgroundColor: '#15803d'
                            }
                          }
                        }
                      }}>
                        <CheckoutForm tier={selectedTier} onSuccess={handleSuccess} />
                      </Elements>
                    </div>
                  )}
                  
                  {/* Loading State */}
                  {authState.isAuthenticated && !clientSecret && (
                    <div className="pt-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto mb-2"></div>
                      <p className="text-sm text-white">Preparing payment form...</p>
                    </div>
                  )}
                  
                  <div className="text-xs text-white text-center mt-6 p-3 bg-[#0E1116]/80 rounded-lg border border-green-500/10">
                    <p>Your payment information is secured with industry-standard encryption by Stripe.</p>
                    <p className="mt-1">Your subscription will automatically begin on June 4, 2025 (Launch Day).</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Thank You Section (hidden initially) */}
          <div id="thank-you" className={`mt-12 text-center ${notification.type === 'success' ? 'block' : 'hidden'}`}>
            <div className="bg-[#0E1116]/80 p-8 rounded-xl">
              <div className="flex justify-center mb-4">
                <div className="bg-[#0E1116]/80 p-3 rounded-full">
                  <Check size={32} className="text-green-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-4">Pre-order Confirmed!</h2>
              <p className="text-white mb-2">
                Thank you for pre-ordering the {selectedTier === 'pro' ? 'Pro' : 'Premium'} Tier subscription.
              </p>
              <p className="text-gray-300 mb-6">
                Your subscription will automatically start on June 4, 2025 (Launch Day).
              </p>
              <div className="flex justify-center">
                <button
                  onClick={handleBackClick}
                  className="bg-gradient-to-r from-green-600 to-blue-700 hover:from-green-500 hover:to-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Return to Previous Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
