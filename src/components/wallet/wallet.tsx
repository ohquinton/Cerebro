'use client';
import React, { useState, useEffect } from 'react';
// This import ensures JSX namespace is available
import * as ReactJSX from 'react';
import { 
  Wallet, 
  CreditCard, 
  DollarSign, 
  ArrowUp, 
  ArrowDown,
  Clock,
  Check,
  X,
  AlertCircle,
  Repeat,
  Star,
  ChevronDown,
  ChevronRight,
  Sliders,
  BarChart2,
  ChevronLeft,
  Trophy,
  Plus
} from 'lucide-react';
import { supabase } from '@/lib/api/supabase'; // Import the Supabase client

// Type definitions
type CurrencyType = 'USD' | 'EUR' | 'BTC' | 'USDC';
type TransactionType = 'deposit' | 'withdrawal' | 'winning' | 'loss' | 'bonus' | 'conversion';
type TransactionStatus = 'completed' | 'pending' | 'failed';
type PaymentMethodType = 'card' | 'paypal' | 'crypto' | 'bank';
type NotificationType = 'success' | 'error' | 'info';
type TabType = 'overview' | 'wallets' | 'payment-methods' | 'transactions' | 'recurring' | 'limits' | 'convert';
type RecurringFrequency = 'daily' | 'weekly' | 'monthly';
type SpendingPeriod = 'daily' | 'weekly' | 'monthly';

// Interface definitions
interface WalletData {
  id: string;
  name: string;
  balance: number;
  currency: CurrencyType;
  isPrimary: boolean;
  user_id?: string; // For Supabase integration
}

interface TransactionData {
  id: string;
  type: TransactionType;
  amount: number;
  currency: CurrencyType;
  status: TransactionStatus;
  date: Date;
  paymentMethod?: string;
  description: string;
  wallet_id?: string; // For Supabase integration
  user_id?: string; // For Supabase integration
}

interface PaymentMethodData {
  id: string;
  name: string;
  type: PaymentMethodType;
  isDefault: boolean;
  expiryDate?: string;
  cardType?: string;
  email?: string;
  address?: string;
  user_id?: string; // For Supabase integration
}

interface NotificationState {
  show: boolean;
  message: string;
  type: NotificationType;
}

interface TransactionCategoryData {
  id: string;
  name: string;
  types?: TransactionType[];
}

// Currency conversion rate structure
interface CurrencyRates {
  [key: string]: {
    [key: string]: number;
  };
}

// Mock data for initial loading state or fallback
const MOCK_WALLETS: WalletData[] = [
  { id: 'main', name: 'Main Wallet', balance: 2450.75, currency: 'USD', isPrimary: true },
  { id: 'crypto', name: 'Crypto Wallet', balance: 0.045, currency: 'BTC', isPrimary: false },
  { id: 'euro', name: 'Euro Wallet', balance: 1200, currency: 'EUR', isPrimary: false },
  { id: 'stablecoin', name: 'USDC Wallet', balance: 500, currency: 'USDC', isPrimary: false }
];

const TRANSACTION_CATEGORIES: TransactionCategoryData[] = [
  { id: 'all', name: 'All Transactions' },
  { id: 'deposits', name: 'Deposits', types: ['deposit'] },
  { id: 'withdrawals', name: 'Withdrawals', types: ['withdrawal'] },
  { id: 'earnings', name: 'Earnings', types: ['winning', 'bonus'] },
  { id: 'losses', name: 'Losses', types: ['loss'] }
];

const CURRENCY_SYMBOLS: Record<CurrencyType, string> = {
  'USD': '$',
  'EUR': '€',
  'BTC': '₿',
  'USDC': 'USDC'
};

// Currency conversion rates - in a real app, you'd fetch these from an API
const CURRENCY_CONVERSION_RATES: CurrencyRates = {
  'USD': {
    'EUR': 0.92,
    'BTC': 0.000016,
    'USDC': 1
  },
  'EUR': {
    'USD': 1.09,
    'BTC': 0.000018,
    'USDC': 1.09
  },
  'BTC': {
    'USD': 61500,
    'EUR': 56500,
    'USDC': 61500
  },
  'USDC': {
    'USD': 1,
    'EUR': 0.92,
    'BTC': 0.000016
  }
};

const WalletDashboard: React.FC = () => {
  // States with proper typing
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [activeCurrency, setActiveCurrency] = useState<CurrencyType>('USD');
  const [activeWallet, setActiveWallet] = useState<WalletData | null>(null);
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  const [showConvertModal, setShowConvertModal] = useState<boolean>(false);
  const [activeTransactionFilter, setActiveTransactionFilter] = useState<string>('all');
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<NotificationState>({ show: false, message: '', type: 'info' });
  const [walletExpanded, setWalletExpanded] = useState<boolean>(false);
  const [vipStatus, setVipStatus] = useState<boolean>(false);
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([]);
  const [convertAmount, setConvertAmount] = useState<string>('');
  const [convertFrom, setConvertFrom] = useState<CurrencyType>('USD');
  const [convertTo, setConvertTo] = useState<CurrencyType>('EUR');
  const [recurringDepositActive, setRecurringDepositActive] = useState<boolean>(false);
  const [recurringAmount, setRecurringAmount] = useState<string>('100');
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>('weekly');
  const [spendingLimit, setSpendingLimit] = useState<string>('1000');
  const [spendingPeriod, setSpendingPeriod] = useState<SpendingPeriod>('daily');
  const [walletName, setWalletName] = useState<string>('');
  const [showEditWalletModal, setShowEditWalletModal] = useState<boolean>(false);
  const [showSpendingLimitsModal, setShowSpendingLimitsModal] = useState<boolean>(false);
  const [showAddCardModal, setShowAddCardModal] = useState<boolean>(false);
  const [newCardData, setNewCardData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: ''
  });
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch user on component mount
  useEffect(() => {
    const fetchUser = async () => {
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserId(user.id);
        
        // Also check if user has VIP status
        const { data: userData } = await supabase
          .from('users')
          .select('is_vip')
          .eq('id', user.id)
          .single();
          
        if (userData) {
          setVipStatus(userData.is_vip || false);
        }
      } else {
        // Redirect to login or show error
        console.error('No authenticated user found');
        setNotification({
          show: true,
          message: 'Please login to access your wallet',
          type: 'error'
        });
      }
    };
    
    fetchUser();
  }, []);

  // Fetch wallets when userId changes
  useEffect(() => {
    if (!userId) return;
    
    const fetchWallets = async () => {
      setIsLoading(true);
      
      try {
        // Get wallets for the current user
        const { data, error } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', userId);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Transform data to match our interface if needed
          const walletData: WalletData[] = data.map(wallet => ({
            id: wallet.id,
            name: wallet.name,
            balance: wallet.balance,
            currency: wallet.currency as CurrencyType,
            isPrimary: wallet.is_primary,
            user_id: wallet.user_id
          }));
          
          setWallets(walletData);
          
          // Set active wallet to primary or first wallet
          const primaryWallet = walletData.find(w => w.isPrimary);
          setActiveWallet(primaryWallet || walletData[0]);
          if (primaryWallet) {
            setActiveCurrency(primaryWallet.currency);
            setWalletName(primaryWallet.name);
          } else if (walletData[0]) {
            setActiveCurrency(walletData[0].currency);
            setWalletName(walletData[0].name);
          }
        } else {
          // If no wallets, create a default one
          const newWallet: Partial<WalletData> = {
            name: 'Main Wallet',
            balance: 0,
            currency: 'USD',
            isPrimary: true,
            user_id: userId
          };
          
          const { data: createdWallet, error: createError } = await supabase
            .from('wallets')
            .insert([newWallet])
            .select()
            .single();
            
          if (createError) throw createError;
          
          if (createdWallet) {
            const walletData: WalletData = {
              id: createdWallet.id,
              name: createdWallet.name,
              balance: createdWallet.balance,
              currency: createdWallet.currency as CurrencyType,
              isPrimary: createdWallet.is_primary,
              user_id: createdWallet.user_id
            };
            
            setWallets([walletData]);
            setActiveWallet(walletData);
            setActiveCurrency(walletData.currency);
            setWalletName(walletData.name);
          }
        }
      } catch (error) {
        console.error('Error fetching wallets:', error);
        setNotification({
          show: true,
          message: 'Failed to load wallets',
          type: 'error'
        });
        // Fallback to mock data
        setWallets(MOCK_WALLETS);
        setActiveWallet(MOCK_WALLETS[0]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWallets();
  }, [userId]);

  // Fetch transactions when activeWallet changes
  useEffect(() => {
    if (!userId || !activeWallet) return;
    
    const fetchTransactions = async () => {
      try {
        // Get transactions for the current user and wallet
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        if (data) {
          // Transform data to match our interface if needed
          const transactionData: TransactionData[] = data.map(transaction => ({
            id: transaction.id,
            type: transaction.type as TransactionType,
            amount: transaction.amount,
            currency: transaction.currency as CurrencyType,
            status: transaction.status as TransactionStatus,
            date: new Date(transaction.created_at),
            paymentMethod: transaction.payment_method,
            description: transaction.description,
            wallet_id: transaction.wallet_id,
            user_id: transaction.user_id
          }));
          
          setTransactions(transactionData);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setNotification({
          show: true,
          message: 'Failed to load transactions',
          type: 'error'
        });
      }
    };
    
    fetchTransactions();
  }, [userId, activeWallet]);

  // Fetch payment methods when userId changes
  useEffect(() => {
    if (!userId) return;
    
    const fetchPaymentMethods = async () => {
      try {
        // Get payment methods for the current user
        const { data, error } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('user_id', userId);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Transform data to match our interface if needed
          const paymentMethodData: PaymentMethodData[] = data.map(method => ({
            id: method.id,
            name: method.name,
            type: method.type as PaymentMethodType,
            isDefault: method.is_default,
            expiryDate: method.expiry_date,
            cardType: method.card_type,
            email: method.email,
            address: method.address,
            user_id: method.user_id
          }));
          
          setPaymentMethods(paymentMethodData);
          
          // Set default payment method
          const defaultMethod = paymentMethodData.find(m => m.isDefault);
          if (defaultMethod) {
            setSelectedPaymentMethod(defaultMethod.id);
          } else if (paymentMethodData[0]) {
            setSelectedPaymentMethod(paymentMethodData[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        setNotification({
          show: true,
          message: 'Failed to load payment methods',
          type: 'error'
        });
      }
    };
    
    fetchPaymentMethods();
  }, [userId]);

  // Set up real-time subscription to wallets table
  useEffect(() => {
    if (!userId) return;
    
    const walletSubscription = supabase
      .channel('wallets-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wallets',
        filter: `user_id=eq.${userId}`
      }, async (payload) => {
        // For INSERT and UPDATE events, we can use the payload data directly
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const wallet = payload.new;
          
          // Transform the wallet data
          const updatedWallet: WalletData = {
            id: wallet.id,
            name: wallet.name,
            balance: wallet.balance,
            currency: wallet.currency as CurrencyType,
            isPrimary: wallet.is_primary,
            user_id: wallet.user_id
          };
          
          // For UPDATE: update the wallet in the existing list
          if (payload.eventType === 'UPDATE') {
            setWallets(prevWallets => 
              prevWallets.map(w => w.id === updatedWallet.id ? updatedWallet : w)
            );
            
            // Update active wallet if it's the one that changed
            if (activeWallet && activeWallet.id === updatedWallet.id) {
              setActiveWallet(updatedWallet);
            }
          } 
          // For INSERT: add the new wallet to the list
          else if (payload.eventType === 'INSERT') {
            setWallets(prevWallets => [...prevWallets, updatedWallet]);
          }
        } 
        // For DELETE events or fallback: refetch all wallets
        else {
          const { data, error } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', userId);
            
          if (error) {
            console.error('Error refreshing wallets:', error);
            return;
          }
          
          if (data) {
            const walletData: WalletData[] = data.map(wallet => ({
              id: wallet.id,
              name: wallet.name,
              balance: wallet.balance,
              currency: wallet.currency as CurrencyType,
              isPrimary: wallet.is_primary,
              user_id: wallet.user_id
            }));
            
            setWallets(walletData);
            
            // Update active wallet if it's in the list
            if (activeWallet) {
              const updatedActiveWallet = walletData.find(w => w.id === activeWallet.id);
              if (updatedActiveWallet) {
                setActiveWallet(updatedActiveWallet);
              } else {
                setActiveWallet(walletData[0]);
              }
            }
          }
        }
      })
      .subscribe();
      
    // Set up real-time subscription to transactions table
    const transactionSubscription = supabase
      .channel('transactions-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `user_id=eq.${userId}`
      }, async (payload) => {
        // For INSERT events, we can use the payload data directly
        if (payload.eventType === 'INSERT') {
          const transaction = payload.new;
          
          // Transform the transaction data
          const newTransaction: TransactionData = {
            id: transaction.id,
            type: transaction.type as TransactionType,
            amount: transaction.amount,
            currency: transaction.currency as CurrencyType,
            status: transaction.status as TransactionStatus,
            date: new Date(transaction.created_at),
            paymentMethod: transaction.payment_method,
            description: transaction.description,
            wallet_id: transaction.wallet_id,
            user_id: transaction.user_id
          };
          
          // Add the new transaction to the beginning of the list (most recent first)
          setTransactions(prevTransactions => [newTransaction, ...prevTransactions]);
        } 
        // For UPDATE, DELETE, or other events: refetch all transactions
        else {
          const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
            
          if (error) {
            console.error('Error refreshing transactions:', error);
            return;
          }
          
          if (data) {
            const transactionData: TransactionData[] = data.map(transaction => ({
              id: transaction.id,
              type: transaction.type as TransactionType,
              amount: transaction.amount,
              currency: transaction.currency as CurrencyType,
              status: transaction.status as TransactionStatus,
              date: new Date(transaction.created_at),
              paymentMethod: transaction.payment_method,
              description: transaction.description,
              wallet_id: transaction.wallet_id,
              user_id: transaction.user_id
            }));
            
            setTransactions(transactionData);
          }
        }
      })
      .subscribe();
    
    // Clean up subscriptions when component unmounts
    return () => {
      supabase.removeChannel(walletSubscription);
      supabase.removeChannel(transactionSubscription);
    };
  }, [userId, activeWallet]);

  // Get transactions based on filter
  const getFilteredTransactions = (): TransactionData[] => {
    if (activeTransactionFilter === 'all') {
      return transactions;
    }
    
    const selectedCategory = TRANSACTION_CATEGORIES.find(cat => cat.id === activeTransactionFilter);
    if (!selectedCategory || !selectedCategory.types) {
      return transactions;
    }
    
    return transactions.filter(transaction => 
      selectedCategory.types!.includes(transaction.type)
    );
  };

  // Format currency display
  const formatCurrency = (amount: number, currency: CurrencyType): string => {
    if (currency === 'BTC') {
      return `₿${amount.toFixed(8)}`;
    }
    
    const symbols: Record<CurrencyType, string> = {
      'USD': '$',
      'EUR': '€',
      'BTC': '₿',
      'USDC': 'USDC '
    };
    
    const symbol = symbols[currency] || '';
    
    return `${symbol}${amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })}`;
  };

  // Handle deposit submission with Supabase
  const handleDeposit = async (): Promise<void> => {
    if (!userId || !activeWallet) return;
    
    setIsLoading(true);
    
    try {
      const amount = parseFloat(depositAmount);
      const method = paymentMethods.find(m => m.id === selectedPaymentMethod);
      
      if (amount && method) {
        // Start a transaction by using supabase.rpc to call a stored procedure
        // In a real app, you'd typically integrate with a payment processor here
        
        // 1. Create new transaction record
        const { data: newTransaction, error: transactionError } = await supabase
          .from('transactions')
          .insert([{
            type: 'deposit',
            amount,
            currency: activeWallet.currency,
            status: 'completed',
            payment_method: method.name,
            description: `Deposit via ${method.type === 'card' ? method.name : method.type}`,
            wallet_id: activeWallet.id,
            user_id: userId
          }])
          .select()
          .single();
          
        if (transactionError) throw transactionError;
        
        // Log the transaction for debugging
        console.log('Deposit transaction created:', newTransaction);
        
        // 2. Update wallet balance
        const newBalance = activeWallet.balance + amount;
        
        const { data: updatedWallet, error: walletError } = await supabase
          .from('wallets')
          .update({ balance: newBalance })
          .eq('id', activeWallet.id)
          .select()
          .single();
          
        if (walletError) throw walletError;
        
        // Use the updated wallet data
        if (updatedWallet) {
          // Update active wallet directly without waiting for the subscription
          const updatedWalletData: WalletData = {
            id: updatedWallet.id,
            name: updatedWallet.name,
            balance: updatedWallet.balance,
            currency: updatedWallet.currency as CurrencyType,
            isPrimary: updatedWallet.is_primary,
            user_id: updatedWallet.user_id
          };
          
          setActiveWallet(updatedWalletData);
          
          // Update in wallets list
          setWallets(prevWallets => 
            prevWallets.map(wallet => 
              wallet.id === updatedWalletData.id ? updatedWalletData : wallet
            )
          );
        }
        
        // Show success notification
        setNotification({
          show: true,
          message: `Successfully deposited ${formatCurrency(amount, activeWallet.currency)}`,
          type: 'success'
        });
        
        // Reset form
        setDepositAmount('');
        setShowDepositModal(false);
      }
    } catch (error) {
      console.error('Error processing deposit:', error);
      setNotification({
        show: true,
        message: 'Failed to process deposit',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle withdrawal submission with Supabase
  const handleWithdraw = async (): Promise<void> => {
    if (!userId || !activeWallet) return;
    
    setIsLoading(true);
    
    try {
      const amount = parseFloat(withdrawAmount);
      const method = paymentMethods.find(m => m.id === selectedPaymentMethod);
      
      if (amount && method) {
        // Check if enough balance
        if (amount > activeWallet.balance) {
          setNotification({
            show: true,
            message: 'Insufficient balance for withdrawal',
            type: 'error'
          });
          setIsLoading(false);
          return;
        }
        
        // 1. Create new transaction record
        const { data: newTransaction, error: transactionError } = await supabase
          .from('transactions')
          .insert([{
            type: 'withdrawal',
            amount,
            currency: activeWallet.currency,
            status: 'pending', // Withdrawals typically start as pending
            payment_method: method.name,
            description: `Withdrawal to ${method.type === 'card' ? method.name : method.type}`,
            wallet_id: activeWallet.id,
            user_id: userId
          }])
          .select()
          .single();
          
        if (transactionError) throw transactionError;
        
        // Log the transaction for debugging
        console.log('Withdrawal transaction created:', newTransaction);
        
        // 2. Update wallet balance
        const newBalance = activeWallet.balance - amount;
        
        const { data: updatedWallet, error: walletError } = await supabase
          .from('wallets')
          .update({ balance: newBalance })
          .eq('id', activeWallet.id)
          .select()
          .single();
          
        if (walletError) throw walletError;
        
        // Use the updated wallet data
        if (updatedWallet) {
          // Update active wallet directly without waiting for the subscription
          const updatedWalletData: WalletData = {
            id: updatedWallet.id,
            name: updatedWallet.name,
            balance: updatedWallet.balance,
            currency: updatedWallet.currency as CurrencyType,
            isPrimary: updatedWallet.is_primary,
            user_id: updatedWallet.user_id
          };
          
          setActiveWallet(updatedWalletData);
          
          // Update in wallets list
          setWallets(prevWallets => 
            prevWallets.map(wallet => 
              wallet.id === updatedWalletData.id ? updatedWalletData : wallet
            )
          );
        }
        
        // Show success notification
        setNotification({
          show: true,
          message: `Withdrawal of ${formatCurrency(amount, activeWallet.currency)} submitted and pending approval`,
          type: 'success'
        });
        
        // Reset form
        setWithdrawAmount('');
        setShowWithdrawModal(false);
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      setNotification({
        show: true,
        message: 'Failed to process withdrawal',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle currency conversion with Supabase
  const handleConvertCurrency = async (): Promise<void> => {
    if (!userId) return;
    
    setIsLoading(true);
    
    try {
      const amount = parseFloat(convertAmount);
      
      if (amount && amount > 0) {
        // Get source wallet
        const sourceWallet = wallets.find(wallet => wallet.currency === convertFrom);
        // Get target wallet
        const targetWallet = wallets.find(wallet => wallet.currency === convertTo);
        
        if (!sourceWallet || !targetWallet) {
          setNotification({
            show: true,
            message: 'Invalid wallet selection',
            type: 'error'
          });
          setIsLoading(false);
          return;
        }
        
        // Check if enough balance in source wallet
        if (amount > sourceWallet.balance) {
          setNotification({
            show: true,
            message: 'Insufficient balance for conversion',
            type: 'error'
          });
          setIsLoading(false);
          return;
        }
        
        // Get conversion rate
        const conversionRate = CURRENCY_CONVERSION_RATES[convertFrom][convertTo];
        const convertedAmount = amount * conversionRate;
        
        // 1. Create transaction for source (withdrawal)
        const { data: sourceTransaction, error: sourceError } = await supabase
          .from('transactions')
          .insert([{
            type: 'conversion',
            amount: -amount,
            currency: convertFrom,
            status: 'completed',
            description: `Converted to ${convertTo}`,
            wallet_id: sourceWallet.id,
            user_id: userId
          }])
          .select()
          .single();
          
        if (sourceError) throw sourceError;
        console.log('Source conversion transaction created:', sourceTransaction);
        
        // 2. Create transaction for target (deposit)
        const { data: targetTransaction, error: targetError } = await supabase
          .from('transactions')
          .insert([{
            type: 'conversion',
            amount: convertedAmount,
            currency: convertTo,
            status: 'completed',
            description: `Converted from ${convertFrom}`,
            wallet_id: targetWallet.id,
            user_id: userId
          }])
          .select()
          .single();
          
        if (targetError) throw targetError;
        console.log('Target conversion transaction created:', targetTransaction);
        
        // 3. Update source wallet balance
        const { data: updatedSource, error: sourceWalletError } = await supabase
          .from('wallets')
          .update({ balance: sourceWallet.balance - amount })
          .eq('id', sourceWallet.id)
          .select()
          .single();
          
        if (sourceWalletError) throw sourceWalletError;
        
        // 4. Update target wallet balance
        const { data: updatedTarget, error: targetWalletError } = await supabase
          .from('wallets')
          .update({ balance: targetWallet.balance + convertedAmount })
          .eq('id', targetWallet.id)
          .select()
          .single();
          
        if (targetWalletError) throw targetWalletError;
        
        // Update wallets list with the updated source and target wallets
        if (updatedSource && updatedTarget) {
          const updatedSourceData: WalletData = {
            id: updatedSource.id,
            name: updatedSource.name,
            balance: updatedSource.balance,
            currency: updatedSource.currency as CurrencyType,
            isPrimary: updatedSource.is_primary,
            user_id: updatedSource.user_id
          };
          
          const updatedTargetData: WalletData = {
            id: updatedTarget.id,
            name: updatedTarget.name,
            balance: updatedTarget.balance,
            currency: updatedTarget.currency as CurrencyType,
            isPrimary: updatedTarget.is_primary,
            user_id: updatedTarget.user_id
          };
          
          setWallets(prevWallets => 
            prevWallets.map(wallet => {
              if (wallet.id === updatedSourceData.id) return updatedSourceData;
              if (wallet.id === updatedTargetData.id) return updatedTargetData;
              return wallet;
            })
          );
          
          // Update active wallet if affected
          if (activeWallet && activeWallet.id === updatedSourceData.id) {
            setActiveWallet(updatedSourceData);
          } else if (activeWallet && activeWallet.id === updatedTargetData.id) {
            setActiveWallet(updatedTargetData);
          }
        }
        
        // Show success notification
        setNotification({
          show: true,
          message: `Successfully converted ${formatCurrency(amount, convertFrom)} to ${formatCurrency(convertedAmount, convertTo)}`,
          type: 'success'
        });
        
        // Reset form
        setConvertAmount('');
        setShowConvertModal(false);
      }
    } catch (error) {
      console.error('Error processing conversion:', error);
      setNotification({
        show: true,
        message: 'Failed to convert currency',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle add new payment method with Supabase
  const handleAddCard = async (): Promise<void> => {
    if (!userId) return;
    
    setIsLoading(true);
    
    try {
      // Create new payment method in Supabase
      const { data, error } = await supabase
        .from('payment_methods')
        .insert([{
          name: `Card ending in ${newCardData.cardNumber.slice(-4)}`,
          type: 'card',
          is_default: paymentMethods.length === 0, // Make default if first card
          expiry_date: newCardData.expiryDate,
          card_type: newCardData.cardNumber.startsWith('4') ? 'Visa' : 'Mastercard',
          last_four: newCardData.cardNumber.slice(-4),
          user_id: userId
        }])
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        console.log('New payment method added:', data);
        
        // Show success notification
        setNotification({
          show: true,
          message: 'New payment method added successfully',
          type: 'success'
        });
        
        // Reset form
        setNewCardData({
          cardNumber: '',
          expiryDate: '',
          cvv: '',
          name: ''
        });
        setShowAddCardModal(false);
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
      setNotification({
        show: true,
        message: 'Failed to add payment method',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle wallet name update with Supabase
  const handleUpdateWalletName = async (): Promise<void> => {
    if (!userId || !activeWallet) return;
    
    setIsLoading(true);
    
    try {
      // Update wallet name in Supabase
      const { data, error } = await supabase
        .from('wallets')
        .update({ name: walletName })
        .eq('id', activeWallet.id)
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        console.log('Wallet name updated:', data);
        
        // Update active wallet directly
        const updatedWalletData: WalletData = {
          id: data.id,
          name: data.name,
          balance: data.balance,
          currency: data.currency as CurrencyType,
          isPrimary: data.is_primary,
          user_id: data.user_id
        };
        
        setActiveWallet(updatedWalletData);
        
        // Update in wallets list
        setWallets(prevWallets => 
          prevWallets.map(wallet => 
            wallet.id === updatedWalletData.id ? updatedWalletData : wallet
          )
        );
        
        // Show success notification
        setNotification({
          show: true,
          message: 'Wallet name updated successfully',
          type: 'success'
        });
        
        setShowEditWalletModal(false);
      }
    } catch (error) {
      console.error('Error updating wallet name:', error);
      setNotification({
        show: true,
        message: 'Failed to update wallet name',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle spending limits update with Supabase
  const handleUpdateSpendingLimits = async (): Promise<void> => {
    if (!userId) return;
    
    setIsLoading(true);
    
    try {
      // Update or create spending limits in Supabase
      const { data, error } = await supabase
        .from('user_settings')
        .upsert([{
          user_id: userId,
          spending_limit: parseFloat(spendingLimit),
          spending_period: spendingPeriod
        }])
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        console.log('Spending limits updated:', data);
        
        // Show success notification
        setNotification({
          show: true,
          message: `Spending limit set to ${formatCurrency(Number(spendingLimit), 'USD')} ${spendingPeriod}`,
          type: 'success'
        });
        
        setShowSpendingLimitsModal(false);
      }
    } catch (error) {
      console.error('Error updating spending limits:', error);
      setNotification({
        show: true,
        message: 'Failed to update spending limits',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle recurring deposit toggle with Supabase
  const handleToggleRecurringDeposit = async (): Promise<void> => {
    if (!userId || !activeWallet) return;
    
    setIsLoading(true);
    
    try {
      // Update or create recurring deposit settings in Supabase
      const { data, error } = await supabase
        .from('recurring_deposits')
        .upsert([{
          user_id: userId,
          wallet_id: activeWallet.id,
          amount: parseFloat(recurringAmount),
          frequency: recurringFrequency,
          is_active: !recurringDepositActive,
          next_deposit_date: new Date(Date.now() + (
            recurringFrequency === 'daily' ? 86400000 : 
            recurringFrequency === 'weekly' ? 604800000 : 
            2592000000 // monthly
          ))
        }])
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        console.log('Recurring deposit settings updated:', data);
        setRecurringDepositActive(!recurringDepositActive);
        
        // Show success notification
        setNotification({
          show: true,
          message: recurringDepositActive 
            ? 'Recurring deposit has been disabled' 
            : `Recurring deposit of ${formatCurrency(Number(recurringAmount), 'USD')} ${recurringFrequency} has been enabled`,
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error updating recurring deposit:', error);
      setNotification({
        show: true,
        message: 'Failed to update recurring deposit settings',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get transaction icon based on type
  const getTransactionIcon = (type: TransactionType): ReactJSX.ReactElement => {
    switch(type) {
      case 'deposit':
        return <ArrowDown className="text-green-500" size={20} />;
      case 'withdrawal':
        return <ArrowUp className="text-red-500" size={20} />;
      case 'winning':
        return <Trophy className="text-green-500" size={20} />;
      case 'loss':
        return <X className="text-red-500" size={20} />;
      case 'bonus':
        return <Star className="text-purple-500" size={20} />;
      case 'conversion':
        return <Repeat className="text-blue-500" size={20} />;
      default:
        return <DollarSign className="text-gray-500" size={20} />;
    }
  };

  // Get status icon based on transaction status
  const getStatusIcon = (status: TransactionStatus): ReactJSX.ReactElement | null => {
    switch(status) {
      case 'completed':
        return <Check size={16} className="text-green-500" />;
      case 'pending':
        return <Clock size={16} className="text-yellow-500" />;
      case 'failed':
        return <X size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  // Format date
  const formatDate = (date: Date): string => {
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get amount styling based on transaction type
  const getAmountStyling = (type: TransactionType, amount: number, currency: CurrencyType): ReactJSX.ReactElement => {
    const isPositive = ['deposit', 'winning', 'bonus'].includes(type);
    const isNegative = ['withdrawal', 'loss'].includes(type);
    
    return (
      <span className={`${isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-gray-300'} font-bold`}>
        {isPositive ? '+ ' : isNegative ? '- ' : ''}
        {formatCurrency(Math.abs(amount), currency)}
      </span>
    );
  };

  // Modal overlay component
  const ModalOverlay: React.FC<{isOpen: boolean, onClose: () => void, children: React.ReactNode}> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-indigo-900 rounded-xl max-w-md w-full mx-auto">
          <div className="relative">
            <button 
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
              disabled={isLoading}
            >
              <X size={20} />
            </button>
            {children}
          </div>
        </div>
      </div>
    );
  };

  // Loading indicator
  if (isLoading && wallets.length === 0) {
    return (
      <div className="min-h-screen bg-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <Clock size={48} className="mx-auto mb-4 text-green-500 animate-spin" />
          <h2 className="text-xl font-bold text-white">Loading your wallet...</h2>
        </div>
      </div>
    );
  }

  // If no user is found
  if (!userId && !isLoading) {
    return (
      <div className="min-h-screen bg-indigo-950 flex items-center justify-center">
        <div className="bg-indigo-900 rounded-xl p-8 max-w-md w-full text-center">
          <AlertCircle size={48} className="mx-auto mb-2 opacity-50" />
          <h2 className="text-xl font-bold text-white mb-4">Authentication Required</h2>
          <p className="text-gray-300 mb-6">Please log in to access your wallet</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="bg-green-500 hover:bg-green-600 text-black font-medium py-3 px-4 rounded-lg transition-colors w-full"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-950 text-white">
      {/* Page header */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 py-6 px-8 shadow-lg">
        <div className="container mx-auto">
          <button onClick={() => window.history.back()} className="flex items-center text-gray-300 hover:text-white mb-4 transition-colors">
            <ChevronLeft size={20} className="mr-1" />
            <span>Back to Dashboard</span>
          </button>

          <h1 className="text-3xl font-bold flex items-center">
            <Wallet className="mr-3 text-green-500" size={28} />
            Wallet Dashboard
          </h1>
          
          <div className="flex flex-wrap items-center mt-2 text-sm text-gray-300">
            <div className="mr-6 flex items-center">
              <DollarSign size={16} className="mr-1 text-green-500" />
              Manage your funds, payments, and transaction history
            </div>
            
            {/* Added currency selector to use activeCurrency state */}
            <div className="mr-6 flex items-center">
              <span className="text-gray-400 mr-2">Preferred Currency:</span>
              <select
                value={activeCurrency}
                onChange={(e) => setActiveCurrency(e.target.value as CurrencyType)}
                className="bg-indigo-800 border border-indigo-700 rounded-lg py-1 px-2 text-sm"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="BTC">BTC</option>
                <option value="USDC">USDC</option>
              </select>
            </div>
            
            {vipStatus && (
              <div className="flex items-center ml-auto">
                <Star size={16} className="mr-1 text-yellow-500" />
                <span className="text-yellow-500 font-medium">VIP Status Active</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="bg-indigo-900 rounded-xl overflow-hidden shadow-xl mb-6">
              <div className="bg-gradient-to-r from-indigo-800 to-indigo-700 p-4">
                <h2 className="font-bold text-lg">Wallet Menu</h2>
              </div>
              <ul>
                <li>
                  <button 
                    onClick={() => setActiveTab('overview')}
                    className={`w-full px-4 py-3 text-left flex items-center ${activeTab === 'overview' ? 'bg-indigo-800 text-green-500' : 'hover:bg-indigo-800 text-gray-300'}`}
                  >
                    <BarChart2 size={18} className="mr-3" />
                    <span>Overview</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('wallets')}
                    className={`w-full px-4 py-3 text-left flex items-center ${activeTab === 'wallets' ? 'bg-indigo-800 text-green-500' : 'hover:bg-indigo-800 text-gray-300'}`}
                  >
                    <Wallet size={18} className="mr-3" />
                    <span>My Wallets</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('payment-methods')}
                    className={`w-full px-4 py-3 text-left flex items-center ${activeTab === 'payment-methods' ? 'bg-indigo-800 text-green-500' : 'hover:bg-indigo-800 text-gray-300'}`}
                  >
                    <CreditCard size={18} className="mr-3" />
                    <span>Payment Methods</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('transactions')}
                    className={`w-full px-4 py-3 text-left flex items-center ${activeTab === 'transactions' ? 'bg-indigo-800 text-green-500' : 'hover:bg-indigo-800 text-gray-300'}`}
                  >
                    <Clock size={18} className="mr-3" />
                    <span>Transaction History</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('recurring')}
                    className={`w-full px-4 py-3 text-left flex items-center ${activeTab === 'recurring' ? 'bg-indigo-800 text-green-500' : 'hover:bg-indigo-800 text-gray-300'}`}
                  >
                    <Repeat size={18} className="mr-3" />
                    <span>Recurring Deposits</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('limits')}
                    className={`w-full px-4 py-3 text-left flex items-center ${activeTab === 'limits' ? 'bg-indigo-800 text-green-500' : 'hover:bg-indigo-800 text-gray-300'}`}
                  >
                    <Sliders size={18} className="mr-3" />
                    <span>Spending Limits</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('convert')}
                    className={`w-full px-4 py-3 text-left flex items-center ${activeTab === 'convert' ? 'bg-indigo-800 text-green-500' : 'hover:bg-indigo-800 text-gray-300'}`}
                  >
                    <Repeat size={18} className="mr-3" />
                    <span>Convert Currency</span>
                  </button>
                </li>
              </ul>
            </nav>

            {/* Quick Actions */}
            <div className="bg-indigo-900 rounded-xl overflow-hidden shadow-xl">
              <div className="bg-gradient-to-r from-indigo-800 to-indigo-700 p-4">
                <h2 className="font-bold text-lg">Quick Actions</h2>
              </div>
              <div className="p-4 space-y-3">
                <button 
                  onClick={() => setShowDepositModal(true)}
                  className="w-full bg-green-500 hover:bg-green-600 text-black font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                  disabled={!activeWallet}
                >
                  <ArrowDown size={18} className="mr-2" />
                  Deposit Funds
                </button>
                
                <button 
                  onClick={() => setShowWithdrawModal(true)}
                  className="w-full bg-indigo-800 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                  disabled={!activeWallet}
                >
                  <ArrowUp size={18} className="mr-2" />
                  Withdraw Funds
                </button>
                
                <button 
                  onClick={() => setShowConvertModal(true)}
                  className="w-full bg-indigo-800 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                  disabled={wallets.length < 2}
                >
                  <Repeat size={18} className="mr-2" />
                  Convert Currency
                </button>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="lg:col-span-3">
            {/* Notification */}
            {notification.show && (
              <div className={`mb-6 p-4 rounded-lg flex items-center justify-between ${
                notification.type === 'success' ? 'bg-green-900/50 border border-green-500/30' :
                notification.type === 'error' ? 'bg-red-900/50 border border-red-500/30' :
                'bg-blue-900/50 border border-blue-500/30'
              }`}>
                <span className={`${
                  notification.type === 'success' ? 'text-green-400' :
                  notification.type === 'error' ? 'text-red-400' :
                  'text-blue-400'
                }`}>
                  {notification.message}
                </span>
                <button onClick={() => setNotification({ ...notification, show: false })}>
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && activeWallet && (
              <div className="space-y-6">
                {/* Balance card */}
                <div className="bg-gradient-to-r from-indigo-800 to-purple-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
                  <div className="relative">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-lg font-medium text-gray-300 mb-1">Total Balance</h2>
                        <div className="text-4xl font-bold">
                          {formatCurrency(activeWallet.balance, activeWallet.currency)}
                        </div>
                        <div className="mt-2 text-sm text-gray-300">{activeWallet.name}</div>
                      </div>
                      
                      <div className="flex items-center">
                        <button 
                          onClick={() => setShowDepositModal(true)}
                          className="bg-green-500 hover:bg-green-600 text-black font-medium py-2 px-4 rounded-lg mr-2 transition-colors text-sm"
                        >
                          <span className="flex items-center">
                            <ArrowDown size={16} className="mr-1" />
                            Deposit
                          </span>
                        </button>
                        
                        <button 
                          onClick={() => setShowWithdrawModal(true)}
                          className="bg-indigo-700 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                        >
                          <span className="flex items-center">
                            <ArrowUp size={16} className="mr-1" />
                            Withdraw
                          </span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Wallets toggle */}
                    <div className="mt-6">
                      <button 
                        onClick={() => setWalletExpanded(!walletExpanded)}
                        className="flex items-center justify-between w-full py-2 border-t border-indigo-700 text-gray-300 hover:text-white transition-colors"
                      >
                        <span className="flex items-center">
                          <Wallet size={16} className="mr-2" />
                          All Wallets ({wallets.length})
                        </span>
                        <ChevronDown size={16} className={`transform transition-transform ${walletExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {walletExpanded && (
                        <div className="mt-3 space-y-3">
                          {wallets.map(wallet => (
                            <div 
                              key={wallet.id}
                              className={`p-3 rounded-lg flex justify-between items-center cursor-pointer transition-colors ${
                                wallet.id === activeWallet.id ? 'bg-indigo-700' : 'bg-indigo-800/50 hover:bg-indigo-700/50'
                              }`}
                              onClick={() => {
                                setActiveWallet(wallet);
                                setWalletName(wallet.name);
                              }}
                            >
                              <div>
                                <div className="text-sm font-medium flex items-center">
                                  {wallet.name}
                                  {wallet.isPrimary && (
                                    <span className="ml-2 bg-green-500 text-black text-xs px-2 py-0.5 rounded-full">
                                      Primary
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {wallet.currency === 'BTC' ? 'Bitcoin' : 
                                   wallet.currency === 'USDC' ? 'USD Coin' : 
                                   wallet.currency === 'EUR' ? 'Euro' : 'US Dollar'}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">
                                  {formatCurrency(wallet.balance, wallet.currency)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Recent activity */}
                <div className="bg-indigo-900 rounded-xl overflow-hidden shadow-xl">
                  <div className="bg-gradient-to-r from-indigo-800 to-indigo-700 p-4 flex justify-between items-center">
                    <h2 className="font-bold text-lg">Recent Activity</h2>
                    <button 
                      onClick={() => setActiveTab('transactions')}
                      className="text-sm text-green-500 hover:text-green-400 transition-colors flex items-center"
                    >
                      View All
                      <ChevronRight size={16} className="ml-1" />
                    </button>
                  </div>
                  
                  <div className="p-4">
                    {transactions.length === 0 ? (
                      <div className="py-8 text-center text-gray-400">
                        <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No transactions yet</p>
                      </div>
                    ) : (
                      transactions.slice(0, 5).map(transaction => (
                        <div 
                          key={transaction.id}
                          className="py-3 border-b border-indigo-800 last:border-b-0 flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <div className="mr-3">
                              {getTransactionIcon(transaction.type)}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{transaction.description}</div>
                              <div className="text-xs text-gray-400 flex items-center mt-1">
                                <Clock size={12} className="mr-1" />
                                {formatDate(transaction.date)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="text-right mr-3">
                              {getAmountStyling(transaction.type, transaction.amount, transaction.currency)}
                            </div>
                            {getStatusIcon(transaction.status)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Payment Methods */}
                <div className="bg-indigo-900 rounded-xl overflow-hidden shadow-xl">
                  <div className="bg-gradient-to-r from-indigo-800 to-indigo-700 p-4 flex justify-between items-center">
                    <h2 className="font-bold text-lg">Payment Methods</h2>
                    <button 
                      onClick={() => setActiveTab('payment-methods')}
                      className="text-sm text-green-500 hover:text-green-400 transition-colors flex items-center"
                    >
                      Manage
                      <ChevronRight size={16} className="ml-1" />
                    </button>
                  </div>
                  
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {paymentMethods.length === 0 ? (
                        <div className="col-span-2 py-6 text-center text-gray-400">
                          <CreditCard size={32} className="mx-auto mb-2 opacity-50" />
                          <p>No payment methods added yet</p>
                        </div>
                      ) : (
                        paymentMethods.map(method => (
                          <div 
                            key={method.id}
                            className={`p-3 rounded-lg bg-indigo-800 flex items-center relative ${
                              method.isDefault ? 'border border-green-500/50' : ''
                            }`}
                          >
                            <div className="mr-3 bg-indigo-700 p-2 rounded-md">
                              <CreditCard size={20} className="text-green-500" />
                            </div>
                            <div>
                              <div className="text-sm font-medium">{method.name}</div>
                              {method.expiryDate && (
                                <div className="text-xs text-gray-400">Expires {method.expiryDate}</div>
                              )}
                            </div>
                            {method.isDefault && (
                              <div className="absolute top-2 right-2 bg-green-500 text-black text-xs px-2 py-0.5 rounded-full">
                                Default
                              </div>
                            )}
                          </div>
                        ))
                      )}
                      
                      <button 
                        onClick={() => setShowAddCardModal(true)}
                        className="p-3 rounded-lg bg-indigo-800 border border-dashed border-indigo-600 hover:border-green-500 flex items-center justify-center hover:bg-indigo-700 transition-colors"
                      >
                        <CreditCard size={18} className="mr-2 text-green-500" />
                        <span>Add Payment Method</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* VIP Perks */}
                {vipStatus && (
                  <div className="bg-gradient-to-r from-yellow-900 to-yellow-800 rounded-xl p-6 shadow-xl">
                    <div className="flex items-start">
                      <div className="mr-4">
                        <Star size={32} className="text-yellow-500" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold mb-2">VIP Wallet Perks</h2>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center">
                            <Check size={16} className="mr-2 text-green-500" />
                            Higher withdrawal limits (up to $10,000)
                          </li>
                          <li className="flex items-center">
                            <Check size={16} className="mr-2 text-green-500" />
                            Priority processing for all transactions
                          </li>
                          <li className="flex items-center">
                            <Check size={16} className="mr-2 text-green-500" />
                            Exclusive VIP deposit bonuses
                          </li>
                          <li className="flex items-center">
                            <Check size={16} className="mr-2 text-green-500" />
                            Dedicated VIP financial manager
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div className="bg-indigo-900 rounded-xl overflow-hidden shadow-xl">
                <div className="bg-gradient-to-r from-indigo-800 to-indigo-700 p-4">
                  <h2 className="font-bold text-lg">Transaction History</h2>
                </div>
                
                <div className="p-4">
                  {/* Category filter */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    {TRANSACTION_CATEGORIES.map(category => (
                      <button
                        key={category.id}
                        onClick={() => setActiveTransactionFilter(category.id)}
                        className={`px-3 py-2 rounded-md text-sm transition-colors ${
                          activeTransactionFilter === category.id
                            ? 'bg-green-500 text-black font-medium'
                            : 'bg-indigo-800 text-gray-300 hover:bg-indigo-700'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                  
                  {/* Transactions list */}
                  <div className="space-y-4">
                    {getFilteredTransactions().length === 0 ? (
                      <div className="py-8 text-center text-gray-400">
                        <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No transactions found</p>
                      </div>
                    ) : (
                      getFilteredTransactions().map(transaction => (
                        <div 
                          key={transaction.id}
                          className="p-4 rounded-lg bg-indigo-800 hover:bg-indigo-700 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="mr-3 bg-indigo-700 p-2 rounded-full">
                                {getTransactionIcon(transaction.type)}
                              </div>
                              <div>
                                <div className="font-medium">{transaction.description}</div>
                                <div className="text-sm text-gray-400 flex items-center mt-1">
                                  <Clock size={14} className="mr-1" />
                                  {formatDate(transaction.date)}
                                  {transaction.status !== 'completed' && (
                                    <span className="ml-2 flex items-center">
                                      • Status: {transaction.status}
                                      <span className="ml-1">
                                        {getStatusIcon(transaction.status)}
                                      </span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <div className="text-right mr-3">
                                {getAmountStyling(transaction.type, transaction.amount, transaction.currency)}
                              </div>
                              {transaction.paymentMethod && (
                                <div className="text-xs text-gray-400 mt-1">
                                  via {transaction.paymentMethod}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Recurring Deposits Tab - Newly implemented */}
            {activeTab === 'recurring' && (
              <div className="bg-indigo-900 rounded-xl overflow-hidden shadow-xl">
                <div className="bg-gradient-to-r from-indigo-800 to-indigo-700 p-4">
                  <h2 className="font-bold text-lg">Recurring Deposits</h2>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-medium">Automatic Deposits</h3>
                    <div className="flex items-center">
                      <span className="mr-2 text-sm text-gray-300">{recurringDepositActive ? 'Active' : 'Inactive'}</span>
                      <button 
                        onClick={handleToggleRecurringDeposit}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 ${
                          recurringDepositActive ? 'bg-green-500' : 'bg-gray-600'
                        }`}
                      >
                        <span className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${
                          recurringDepositActive ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Deposit Amount
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                          $
                        </span>
                        <input
                          type="number"
                          value={recurringAmount}
                          onChange={(e) => setRecurringAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-indigo-800 border border-indigo-700 rounded-lg py-2 pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Frequency
                      </label>
                      <select
                        value={recurringFrequency}
                        onChange={(e) => setRecurringFrequency(e.target.value as RecurringFrequency)}
                        className="w-full bg-indigo-800 border border-indigo-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        disabled={isLoading}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Destination Wallet
                      </label>
                      <select
                        value={activeWallet?.id || ''}
                        onChange={(e) => {
                          const wallet = wallets.find(w => w.id === e.target.value);
                          if (wallet) {
                            setActiveWallet(wallet);
                            setWalletName(wallet.name);
                          }
                        }}
                        className="w-full bg-indigo-800 border border-indigo-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        disabled={isLoading}
                      >
                        {wallets.map(wallet => (
                          <option key={wallet.id} value={wallet.id}>
                            {wallet.name} ({formatCurrency(wallet.balance, wallet.currency)})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="p-4 bg-indigo-800 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
                        <Clock size={16} className="mr-2" />
                        Next Scheduled Deposit
                      </h4>
                      {recurringDepositActive ? (
                        <p className="text-white">
                          {new Date(Date.now() + (
                            recurringFrequency === 'daily' ? 86400000 : 
                            recurringFrequency === 'weekly' ? 604800000 : 
                            2592000000
                          )).toLocaleDateString(undefined, {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      ) : (
                        <p className="text-gray-400 italic">No scheduled deposits</p>
                      )}
                    </div>
                    
                    <button
                      onClick={handleToggleRecurringDeposit}
                      className={`w-full py-3 px-4 rounded-lg transition-colors flex items-center justify-center ${
                        recurringDepositActive 
                          ? 'bg-red-500 hover:bg-red-600 text-white' 
                          : 'bg-green-500 hover:bg-green-600 text-black'
                      }`}
                    >
                      {recurringDepositActive ? (
                        <span className="flex items-center">
                          <X size={18} className="mr-2" />
                          Disable Recurring Deposits
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Check size={18} className="mr-2" />
                          Enable Recurring Deposits
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Spending Limits Tab */}
            {activeTab === 'limits' && (
              <div className="bg-indigo-900 rounded-xl overflow-hidden shadow-xl">
                <div className="bg-gradient-to-r from-indigo-800 to-indigo-700 p-4">
                  <h2 className="font-bold text-lg">Spending Limits</h2>
                </div>
                
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-xl font-medium mb-2">Current Spending Limit</h3>
                    <div className="p-4 bg-indigo-800 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Amount:</span>
                        <span className="text-xl font-bold">${parseFloat(spendingLimit).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-gray-300">Period:</span>
                        <span className="font-medium capitalize">{spendingPeriod}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowSpendingLimitsModal(true)}
                    className="w-full bg-green-500 hover:bg-green-600 text-black font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <Sliders size={18} className="mr-2" />
                    Update Spending Limits
                  </button>
                </div>
              </div>
            )}
            
            {/* Convert Currency Tab with Conversion History */}
            {activeTab === 'convert' && (
              <div className="space-y-6">
                {/* Convert UI */}
                <div className="bg-indigo-900 rounded-xl overflow-hidden shadow-xl">
                  <div className="bg-gradient-to-r from-indigo-800 to-indigo-700 p-4">
                    <h2 className="font-bold text-lg">Convert Currency</h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          From
                        </label>
                        <select
                          value={convertFrom}
                          onChange={(e) => setConvertFrom(e.target.value as CurrencyType)}
                          className="w-full bg-indigo-800 border border-indigo-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          disabled={isLoading}
                        >
                          {wallets.map(wallet => (
                            <option key={wallet.id} value={wallet.currency}>
                              {wallet.currency} - {wallet.name} ({formatCurrency(wallet.balance, wallet.currency)})
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Amount
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                            {CURRENCY_SYMBOLS[convertFrom]}
                          </span>
                          <input
                            type="number"
                            value={convertAmount}
                            onChange={(e) => setConvertAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-indigo-800 border border-indigo-700 rounded-lg py-2 pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          Available balance: {formatCurrency(
                            wallets.find(w => w.currency === convertFrom)?.balance || 0,
                            convertFrom
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-center">
                        <div className="bg-indigo-800 rounded-full p-2">
                          <Repeat size={20} className="text-green-500" />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          To
                        </label>
                        <select
                          value={convertTo}
                          onChange={(e) => setConvertTo(e.target.value as CurrencyType)}
                          className="w-full bg-indigo-800 border border-indigo-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          disabled={isLoading}
                        >
                          {wallets.map(wallet => (
                            <option key={wallet.id} value={wallet.currency} disabled={wallet.currency === convertFrom}>
                              {wallet.currency} - {wallet.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {convertAmount && parseFloat(convertAmount) > 0 && (
                        <div className="p-4 bg-indigo-800 rounded-lg">
                          <div className="text-sm text-gray-300 mb-1">Exchange Rate</div>
                          <div className="font-medium">
                            {CURRENCY_SYMBOLS[convertFrom]}1 = {CURRENCY_SYMBOLS[convertTo]}{CURRENCY_CONVERSION_RATES[convertFrom][convertTo].toFixed(
                              convertTo === 'BTC' ? 8 : 2
                            )}
                          </div>
                          <div className="mt-2 text-sm text-gray-300">
                            You will receive approximately {formatCurrency(
                              parseFloat(convertAmount) * CURRENCY_CONVERSION_RATES[convertFrom][convertTo],
                              convertTo
                            )}
                          </div>
                        </div>
                      )}
                      
                      <button
                        onClick={handleConvertCurrency}
                        disabled={
                          !convertAmount || 
                          parseFloat(convertAmount) <= 0 || 
                          parseFloat(convertAmount) > (wallets.find(w => w.currency === convertFrom)?.balance || 0) || 
                          convertFrom === convertTo ||
                          isLoading
                        }
                        className={`w-full py-3 px-4 rounded-lg transition-colors flex items-center justify-center ${
                          !convertAmount || 
                          parseFloat(convertAmount) <= 0 || 
                          parseFloat(convertAmount) > (wallets.find(w => w.currency === convertFrom)?.balance || 0) || 
                          convertFrom === convertTo ||
                          isLoading
                            ? 'bg-indigo-700 cursor-not-allowed'
                            : 'bg-green-500 hover:bg-green-600 text-black'
                        }`}
                      >
                        <Repeat size={18} className="mr-2" />
                        Convert Currency
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Conversion History */}
                <div className="bg-indigo-900 rounded-xl overflow-hidden shadow-xl">
                  <div className="bg-gradient-to-r from-indigo-800 to-indigo-700 p-4">
                    <h2 className="font-bold text-lg">Recent Conversions</h2>
                  </div>
                  
                  <div className="p-4">
                    {transactions
                      .filter(transaction => transaction.type === 'conversion')
                      .slice(0, 5)
                      .map(transaction => (
                        <div 
                          key={transaction.id}
                          className="py-3 border-b border-indigo-800 last:border-b-0 flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <div className="mr-3">
                              {getTransactionIcon(transaction.type)}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{transaction.description}</div>
                              <div className="text-xs text-gray-400 flex items-center">
                                <Clock size={12} className="mr-1" />
                                {formatDate(transaction.date)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="text-right mr-3">
                              {getAmountStyling(transaction.type, transaction.amount, transaction.currency)}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                    {transactions.filter(transaction => transaction.type === 'conversion').length === 0 && (
                      <div className="py-6 text-center text-gray-400">
                        <Repeat size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No currency conversions yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Wallets Management Tab */}
            {activeTab === 'wallets' && (
              <div className="bg-indigo-900 rounded-xl overflow-hidden shadow-xl">
                <div className="bg-gradient-to-r from-indigo-800 to-indigo-700 p-4">
                  <h2 className="font-bold text-lg">My Wallets</h2>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    {wallets.map(wallet => (
                      <div 
                        key={wallet.id}
                        className="p-4 rounded-lg bg-indigo-800 hover:bg-indigo-700 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center">
                              <h3 className="font-medium">{wallet.name}</h3>
                              {wallet.isPrimary && (
                                <span className="ml-2 bg-green-500 text-black text-xs px-2 py-0.5 rounded-full">
                                  Primary
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mt-1">
                              {wallet.currency === 'BTC' ? 'Bitcoin' : 
                               wallet.currency === 'USDC' ? 'USD Coin' : 
                               wallet.currency === 'EUR' ? 'Euro' : 'US Dollar'}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold">
                              {formatCurrency(wallet.balance, wallet.currency)}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between mt-4">
                          <button
                            onClick={() => {
                              setActiveWallet(wallet);
                              setWalletName(wallet.name);
                              setShowEditWalletModal(true);
                            }}
                            className="px-3 py-1 text-sm bg-indigo-700 hover:bg-indigo-600 rounded"
                          >
                            Edit Wallet
                          </button>
                          <button
                            onClick={() => {
                              setActiveWallet(wallet);
                              setShowDepositModal(true);
                            }}
                            className="px-3 py-1 text-sm bg-green-500 hover:bg-green-600 text-black rounded"
                          >
                            Deposit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Payment Methods Tab */}
            {activeTab === 'payment-methods' && (
              <div className="bg-indigo-900 rounded-xl overflow-hidden shadow-xl">
                <div className="bg-gradient-to-r from-indigo-800 to-indigo-700 p-4">
                  <h2 className="font-bold text-lg">Payment Methods</h2>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    {paymentMethods.length === 0 ? (
                      <div className="py-6 text-center text-gray-400">
                        <CreditCard size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No payment methods added yet</p>
                      </div>
                    ) : (
                      paymentMethods.map(method => (
                        <div 
                          key={method.id}
                          className="p-4 rounded-lg bg-indigo-800"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center">
                              <div className="p-2 bg-indigo-700 rounded-lg mr-3">
                                <CreditCard size={24} className="text-green-500" />
                              </div>
                              <div>
                                <h3 className="font-medium">{method.name}</h3>
                                {method.expiryDate && (
                                  <p className="text-sm text-gray-400">Expires: {method.expiryDate}</p>
                                )}
                              </div>
                            </div>
                            {method.isDefault && (
                              <span className="bg-green-500 text-black text-xs px-2 py-0.5 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    
                    <button
                      onClick={() => setShowAddCardModal(true)}
                      className="w-full py-3 rounded-lg bg-indigo-800 border border-dashed border-indigo-600 hover:border-green-500 hover:bg-indigo-700 transition-colors"
                    >
                      <span className="flex items-center justify-center">
                        <Plus size={16} className="mr-2" />
                        Add New Payment Method
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Deposit Modal */}
      <ModalOverlay isOpen={showDepositModal} onClose={() => setShowDepositModal(false)}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6">Deposit Funds</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                  {activeWallet ? CURRENCY_SYMBOLS[activeWallet.currency] : '$'}
                </span>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-indigo-800 border border-indigo-700 rounded-lg py-2 pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Wallet
              </label>
              <select
                value={activeWallet?.id || ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  const wallet = wallets.find(w => w.id === e.target.value);
                  if (wallet) {
                    setActiveWallet(wallet);
                    setActiveCurrency(wallet.currency);
                    setWalletName(wallet.name);
                  }
                }}
                className="w-full bg-indigo-800 border border-indigo-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              >
                {wallets.map(wallet => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.name} ({formatCurrency(wallet.balance, wallet.currency)})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Payment Method
              </label>
              {paymentMethods.length === 0 ? (
                <div className="text-sm text-gray-400 p-3 bg-indigo-800 rounded-lg">
                  No payment methods available. 
                  <button 
                    onClick={() => {
                      setShowDepositModal(false);
                      setShowAddCardModal(true);
                    }}
                    className="text-green-500 ml-1 hover:underline"
                  >
                    Add one now.
                  </button>
                </div>
              ) : (
                <select
                  value={selectedPaymentMethod}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedPaymentMethod(e.target.value)}
                  className="w-full bg-indigo-800 border border-indigo-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={isLoading}
                >
                  {paymentMethods.map(method => (
                    <option key={method.id} value={method.id}>
                      {method.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
          
          <div className="mt-8">
            <button
              onClick={handleDeposit}
              className="w-full bg-green-500 hover:bg-green-600 text-black font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              disabled={
                !depositAmount || 
                parseFloat(depositAmount) <= 0 || 
                isLoading || 
                !selectedPaymentMethod ||
                paymentMethods.length === 0
              }
            >
              {isLoading ? (
                <span className="flex items-center">
                  Processing... <Clock className="ml-2 animate-spin" size={18} />
                </span>
              ) : (
                <span className="flex items-center">
                  Deposit Funds <ArrowDown size={18} className="ml-2" />
                </span>
              )}
            </button>
          </div>
        </div>
      </ModalOverlay>
      
 {/* Withdraw Modal */}
 <ModalOverlay isOpen={showWithdrawModal} onClose={() => setShowWithdrawModal(false)}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6">Withdraw Funds</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount
              </label>
              <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                  {activeWallet ? CURRENCY_SYMBOLS[activeWallet.currency] : '$'}
                </span>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-indigo-800 border border-indigo-700 rounded-lg py-2 pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
              <div className="mt-1 text-xs text-gray-400">
                Available balance: {activeWallet ? formatCurrency(activeWallet.balance, activeWallet.currency) : '$0.00'}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Wallet
              </label>
              <select
                value={activeWallet?.id || ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  const wallet = wallets.find(w => w.id === e.target.value);
                  if (wallet) {
                    setActiveWallet(wallet);
                    setActiveCurrency(wallet.currency);
                  }
                }}
                className="w-full bg-indigo-800 border border-indigo-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              >
                {wallets.map(wallet => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.name} ({formatCurrency(wallet.balance, wallet.currency)})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Payment Method
              </label>
              {paymentMethods.length === 0 ? (
                <div className="text-sm text-gray-400 p-3 bg-indigo-800 rounded-lg">
                  No payment methods available. 
                  <button 
                    onClick={() => {
                      setShowWithdrawModal(false);
                      setShowAddCardModal(true);
                    }}
                    className="text-green-500 ml-1 hover:underline"
                  >
                    Add one now.
                  </button>
                </div>
              ) : (
                <select
                  value={selectedPaymentMethod}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedPaymentMethod(e.target.value)}
                  className="w-full bg-indigo-800 border border-indigo-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={isLoading}
                >
                  {paymentMethods.map(method => (
                    <option key={method.id} value={method.id}>
                      {method.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
          
          <div className="mt-8">
            <button
              onClick={handleWithdraw}
              className="w-full bg-indigo-700 hover:bg-indigo-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              disabled={
                !withdrawAmount || 
                parseFloat(withdrawAmount) <= 0 || 
                (activeWallet && parseFloat(withdrawAmount) > activeWallet.balance) || 
                isLoading || 
                !selectedPaymentMethod ||
                paymentMethods.length === 0
              }
            >
              {isLoading ? (
                <span className="flex items-center">
                  Processing... <Clock className="ml-2 animate-spin" size={18} />
                </span>
              ) : (
                <span className="flex items-center">
                  Withdraw Funds <ArrowUp size={18} className="ml-2" />
                </span>
              )}
            </button>
          </div>
        </div>
      </ModalOverlay>
      
      {/* Convert Currency Modal */}
      <ModalOverlay isOpen={showConvertModal} onClose={() => setShowConvertModal(false)}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6">Convert Currency</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                From
              </label>
              <select
                value={convertFrom}
                onChange={(e) => setConvertFrom(e.target.value as CurrencyType)}
                className="flex-1 bg-indigo-800 border border-indigo-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              >
                {wallets.map(wallet => (
                  <option key={wallet.id} value={wallet.currency}>
                    {wallet.currency} - {wallet.name} ({formatCurrency(wallet.balance, wallet.currency)})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                  {CURRENCY_SYMBOLS[convertFrom]}
                </span>
                <input
                  type="number"
                  value={convertAmount}
                  onChange={(e) => setConvertAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-indigo-800 border border-indigo-700 rounded-lg py-2 pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
              <div className="mt-1 text-xs text-gray-400">
                Available balance: {formatCurrency(
                  wallets.find(w => w.currency === convertFrom)?.balance || 0,
                  convertFrom
                )}
              </div>
            </div>
            
            <div className="flex justify-center">
              <div className="bg-indigo-800 rounded-full p-2">
                <Repeat size={20} className="text-green-500" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                To
              </label>
              <select
                value={convertTo}
                onChange={(e) => setConvertTo(e.target.value as CurrencyType)}
                className="flex-1 bg-indigo-800 border border-indigo-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              >
                {wallets.map(wallet => (
                  <option key={wallet.id} value={wallet.currency} disabled={wallet.currency === convertFrom}>
                    {wallet.currency} - {wallet.name}
                  </option>
                ))}
              </select>
            </div>
            
            {convertAmount && parseFloat(convertAmount) > 0 && (
              <div className="p-4 bg-indigo-800 rounded-lg">
                <div className="text-sm text-gray-300 mb-1">Exchange Rate</div>
                <div className="font-medium">
                  {CURRENCY_SYMBOLS[convertFrom]}1 = {CURRENCY_SYMBOLS[convertTo]}{CURRENCY_CONVERSION_RATES[convertFrom][convertTo].toFixed(
                    convertTo === 'BTC' ? 8 : 2
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-300">
                  You will receive approximately {formatCurrency(
                    parseFloat(convertAmount) * CURRENCY_CONVERSION_RATES[convertFrom][convertTo],
                    convertTo
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-8">
            <button
              onClick={handleConvertCurrency}
              className="w-full bg-indigo-700 hover:bg-indigo-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              disabled={
                !convertAmount || 
                parseFloat(convertAmount) <= 0 || 
                parseFloat(convertAmount) > (wallets.find(w => w.currency === convertFrom)?.balance || 0) || 
                convertFrom === convertTo ||
                isLoading
              }
            >
              {isLoading ? (
                <span className="flex items-center">
                  Processing... <Clock className="ml-2 animate-spin" size={18} />
                </span>
              ) : (
                <span className="flex items-center">
                  Convert Currency <Repeat size={18} className="ml-2" />
                </span>
              )}
            </button>
          </div>
        </div>
      </ModalOverlay>
      
      {/* Edit Wallet Modal */}
      <ModalOverlay isOpen={showEditWalletModal} onClose={() => setShowEditWalletModal(false)}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6">Edit Wallet</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Wallet Name
              </label>
              <input
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                className="w-full bg-indigo-800 border border-indigo-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Currency
              </label>
              <div className="bg-indigo-800 border border-indigo-700 rounded-lg py-2 px-3 text-gray-400">
                {activeWallet ? activeWallet.currency : ''} - {
                  activeWallet ? (
                    activeWallet.currency === 'BTC' ? 'Bitcoin' : 
                    activeWallet.currency === 'USDC' ? 'USD Coin' : 
                    activeWallet.currency === 'EUR' ? 'Euro' : 'US Dollar'
                  ) : ''
                }
              </div>
              <div className="mt-1 text-xs text-gray-400">
                Currency cannot be changed
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPrimary"
                checked={activeWallet ? activeWallet.isPrimary : false}
                onChange={async (e) => {
                  if (!activeWallet || !userId) return;
                  
                  if (e.target.checked) {
                    setIsLoading(true);
                    
                    try {
                      // First, set all wallets to non-primary
                      await supabase
                        .from('wallets')
                        .update({ is_primary: false })
                        .eq('user_id', userId);
                        
                      // Then set this wallet as primary
                      await supabase
                        .from('wallets')
                        .update({ is_primary: true })
                        .eq('id', activeWallet.id);
                        
                      setNotification({
                        show: true,
                        message: `${activeWallet.name} is now your primary wallet`,
                        type: 'success'
                      });
                    } catch (error) {
                      console.error('Error updating primary wallet:', error);
                      setNotification({
                        show: true,
                        message: 'Failed to update primary wallet',
                        type: 'error'
                      });
                    } finally {
                      setIsLoading(false);
                    }
                  }
                }}
                className="mr-2"
                disabled={isLoading || (activeWallet ? activeWallet.isPrimary : false)}
              />
              <label htmlFor="isPrimary" className="text-sm text-gray-300">
                Set as primary wallet
              </label>
            </div>
          </div>
          
          <div className="mt-8">
            <button
              onClick={handleUpdateWalletName}
              className="w-full bg-green-500 hover:bg-green-600 text-black font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              disabled={!walletName || (activeWallet && walletName === activeWallet.name) || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  Updating... <Clock className="ml-2 animate-spin" size={18} />
                </span>
              ) : (
                <span className="flex items-center">
                  Update Wallet <Check size={18} className="ml-2" />
                </span>
              )}
            </button>
          </div>
        </div>
      </ModalOverlay>
      
      {/* Spending Limits Modal */}
      <ModalOverlay isOpen={showSpendingLimitsModal} onClose={() => setShowSpendingLimitsModal(false)}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6">Set Spending Limits</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                  $
                </span>
                <input
                  type="number"
                  value={spendingLimit}
                  onChange={(e) => setSpendingLimit(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-indigo-800 border border-indigo-700 rounded-lg py-2 pl-8 pr-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Period
              </label>
              <select
                value={spendingPeriod}
                onChange={(e) => setSpendingPeriod(e.target.value as SpendingPeriod)}
                className="w-full bg-indigo-800 border border-indigo-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            <div className="p-3 bg-indigo-800/50 rounded-lg">
              <div className="text-sm text-gray-300">
                <AlertCircle size={16} className="inline-block mr-2" />
                Setting a spending limit helps you control your deposits and withdrawals.
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <button
              onClick={handleUpdateSpendingLimits}
              className="w-full bg-green-500 hover:bg-green-600 text-black font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              disabled={!spendingLimit || parseFloat(spendingLimit) <= 0 || isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  Updating... <Clock className="ml-2 animate-spin" size={18} />
                </span>
              ) : (
                <span className="flex items-center">
                  Set Limit <Sliders size={18} className="ml-2" />
                </span>
              )}
            </button>
          </div>
        </div>
      </ModalOverlay>
      
      {/* Add Card Modal */}
      <ModalOverlay isOpen={showAddCardModal} onClose={() => setShowAddCardModal(false)}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6">Add Payment Method</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Card Number
              </label>
              <input
                type="text"
                value={newCardData.cardNumber}
                onChange={(e) => setNewCardData({...newCardData, cardNumber: e.target.value})}
                placeholder="1234 5678 9012 3456"
                className="w-full bg-indigo-800 border border-indigo-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Expiry Date
                </label>
                <input
                  type="text"
                  value={newCardData.expiryDate}
                  onChange={(e) => setNewCardData({...newCardData, expiryDate: e.target.value})}
                  placeholder="MM/YY"
                  className="w-full bg-indigo-800 border border-indigo-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  CVV
                </label>
                <input
                  type="text"
                  value={newCardData.cvv}
                  onChange={(e) => setNewCardData({...newCardData, cvv: e.target.value})}
                  placeholder="123"
                  className="w-full bg-indigo-800 border border-indigo-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cardholder Name
              </label>
              <input
                type="text"
                value={newCardData.name}
                onChange={(e) => setNewCardData({...newCardData, name: e.target.value})}
                placeholder="John Doe"
                className="w-full bg-indigo-800 border border-indigo-700 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            
            <div className="p-3 bg-indigo-800/50 rounded-lg">
              <div className="text-xs text-gray-400">
                <p>Your card information is secured with industry-standard encryption.</p>
                <p className="mt-1">We do not store complete card numbers, only the last 4 digits for reference.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <button
              onClick={handleAddCard}
              className="w-full bg-green-500 hover:bg-green-600 text-black font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              disabled={
                !newCardData.cardNumber || 
                !newCardData.expiryDate || 
                !newCardData.cvv || 
                !newCardData.name || 
                isLoading
              }
            >
              {isLoading ? (
                <span className="flex items-center">
                  Adding Card... <Clock className="ml-2 animate-spin" size={18} />
                </span>
              ) : (
                <span className="flex items-center">
                  Add Card <CreditCard size={18} className="ml-2" />
                </span>
              )}
            </button>
          </div>
        </div>
      </ModalOverlay>
    </div>
  );
};

export default WalletDashboard;