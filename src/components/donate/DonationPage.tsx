'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Gift, Check, AlertCircle, Clock } from 'lucide-react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/api/supabase';
import { refreshAuth } from '@/lib/auth';
import { UserProfile } from '@/lib/types/user';

// Define AuthState interface
interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
}

// Load stripe outside component to avoid recreating it on each render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Create a checkout form component
const CheckoutForm = ({ amount, onSuccess }: { amount: number, onSuccess: () => void }) => {
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
        // Save donation amount for analytics or confirmation
        console.log(`Successful donation of $${amount.toFixed(2)}`);
        // The payment is complete!
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
        <div className="p-3 bg-gray-900/60 border border-gray-500/50 rounded-lg text-gray-400 text-sm mb-4">
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
            <Gift size={20} className="mr-2" />
            Make Donation
          </>
        )}
      </button>
    </form>
  );
};

const DonationPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authState, setAuthState] = useState<AuthState>({ isAuthenticated: false, user: null });
  const [isLoading, setIsLoading] = useState(true);
  const [donationAmount, setDonationAmount] = useState('10');
  const [customAmount, setCustomAmount] = useState('');
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
          
          console.log('User authenticated in donation page:', session.user.email);
        } else {
          setAuthState({ isAuthenticated: false, user: null });
          console.log('No active session found in donation page');
        }
      } catch (error) {
        console.error('Auth check error in donation page:', error);
        setAuthState({ isAuthenticated: false, user: null });
      } finally {
        setIsLoading(false);
      }
    };
    
    initAuth();
  }, []);
  
  // Create payment intent when amount or auth state changes
  useEffect(() => {
    // Only create payment intent if authenticated
    if (!authState.isAuthenticated) return;
    
    const amount = customAmount ? parseFloat(customAmount) : parseFloat(donationAmount);
    if (!amount || amount <= 0) return;
    
    const createPaymentIntent = async () => {
      try {
        console.log('Creating payment intent for amount:', amount);
        
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ amount }),
        });
        
        const data = await response.json();
        
        if (data.clientSecret) {
          console.log('Client secret received successfully');
          setClientSecret(data.clientSecret);
        } else {
          console.error('No client secret in response:', data);
          setNotification({
            show: true,
            message: 'Failed to initialize payment. Please try again.',
            type: 'error'
          });
        }
      } catch (error) {
        console.error('Error creating payment intent:', error);
        setNotification({
          show: true,
          message: 'Failed to initialize payment. Please try again.',
          type: 'error'
        });
      }
    };
    
    createPaymentIntent();
  }, [donationAmount, customAmount, authState.isAuthenticated]);
  
  // Handle amount selection
  const handleAmountSelect = (amount: string) => {
    setDonationAmount(amount);
    setCustomAmount('');
  };
  
  // Handle successful payment
  const handleSuccess = () => {
    const amount = customAmount ? parseFloat(customAmount) : parseFloat(donationAmount);
    
    setNotification({
      show: true,
      message: `Thank you for your donation of $${amount.toFixed(2)}! 75% will go directly to the launch giveaway prize pool.`,
      type: 'success'
    });
    
    // Reset form
    setCustomAmount('');
    setDonationAmount('10');
    
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
    window.location.href = `/auth/login?returnTo=${encodeURIComponent('/donate')}`;
  };
  
  // Handle register redirect
  const handleRegisterRedirect = () => {
    // Include the current URL as the return path
    window.location.href = `/auth/register?returnTo=${encodeURIComponent('/donate')}`;
  };
  
  // Handle back button click
  const handleBackClick = () => {
    if (returnPath && returnPath !== '/') {
      router.push(returnPath);
    } else {
      router.push('/');
    }
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
  
  // Calculate actual donation amount
  const amount = customAmount ? parseFloat(customAmount) : parseFloat(donationAmount);
  
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
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-block p-4 bg-black/60 rounded-full mb-4">
              <Gift size={48} className="text-green-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
              Support Cerebro
            </h1>
            <p className="text-xl text-gray-300 mb-6 max-w-2xl mx-auto">
              Your donation helps build the application and 75% will be added directly to the launch giveaway prize pool!
            </p>
            
            {/* Show greeting if authenticated */}
            {authState.isAuthenticated && authState.user && (
              <div className="bg-gradient-to-b from-[#131921]/90 to-[#1A202C]/90 border border-green-500/30 rounded-lg p-4 mb-6 max-w-md mx-auto">
                <p className="flex items-center text-green-400 mb-2">
                  <Check size={20} className="mr-2 flex-shrink-0" />
                  Welcome, {authState.user.username || authState.user.firstName || authState.user.email}!
                </p>
                <p className="text-gray-300 text-sm">
                  You&apos;re logged in and ready to make a donation.
                </p>
              </div>
            )}
            
            {/* Authentication notice if not authenticated */}
            {!authState.isAuthenticated && (
              <div className="bg-gradient-to-b from-[#131921]/90 to-[#1A202C]/90 border border-green-500/30 rounded-lg p-4 mb-6 max-w-md mx-auto">
                <p className="flex items-center text-green-400 mb-2">
                  <AlertCircle size={20} className="mr-2 flex-shrink-0" />
                  You need to be signed in to donate
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
            
            {/* Donation Form */}
            <div className="bg-gradient-to-b from-[#131921] to-[#1A202C] backdrop-blur-md rounded-xl border border-green-500/30 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-blue-700 p-4">
                <h2 className="text-xl font-semibold">Make a Donation</h2>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Donation Amount */}
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Donation Amount
                  </label>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {['5', '10', '25', '50', '100', '500'].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => handleAmountSelect(amount)}
                        className={`py-3 rounded-lg transition-all duration-300 ${
                          donationAmount === amount && !customAmount
                            ? 'bg-gradient-to-r from-green-600 to-blue-700 text-white shadow-lg shadow-green-900/20'
                            : 'bg-[#0E1116]/80 hover:bg-[#131921] text-white hover:text-white border border-green-500/20'
                        }`}
                        disabled={!authState.isAuthenticated}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Custom Amount
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-white">
                        $
                      </span>
                      <input
                        type="number"
                        value={customAmount}
                        onChange={(e) => {
                          setCustomAmount(e.target.value);
                          setDonationAmount('');
                        }}
                        placeholder="Enter amount"
                        className="w-full bg-[#0E1116]/80 border border-green-500/30 rounded-lg py-2 pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        disabled={!authState.isAuthenticated}
                      />
                    </div>
                  </div>
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
                      <CheckoutForm amount={amount} onSuccess={handleSuccess} />
                    </Elements>
                  </div>
                )}
                
                {/* No Client Secret Message */}
                {authState.isAuthenticated && !clientSecret && amount > 0 && (
                  <div className="pt-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto mb-2"></div>
                    <p className="text-sm text-white">Preparing payment form...</p>
                  </div>
                )}
                
                <div className="text-xs text-white text-center mt-4 p-3 bg-[#0E1116]/80 rounded-lg border border-green-500/10">
                  <p>Your payment information is secured with industry-standard encryption by Stripe.</p>
                  <p className="mt-1">75% of all donations go directly to the prize pool.</p>
                </div>
              </div>
            </div>
            
            {/* Thank You Section (hidden initially) */}
            <div id="thank-you" className={`mt-12 text-center ${notification.type === 'success' ? 'block' : 'hidden'}`}>
              <div className="bg-[#0E1116]/80 p-8 rounded-xl">
                <div className="flex justify-center mb-4">
                  <div className="bg-[#0E1116]/80 p-3 rounded-full">
                    <Check size={32} className="text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-4">Thank You For Your Support!</h2>
                <p className="text-white mb-6">
                  Your contribution will help us build a better platform and grow our prize pool.
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
    </div>
  );
};

export default DonationPage;