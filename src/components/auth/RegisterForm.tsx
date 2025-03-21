'use client';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  ArrowRight, Mail, User, KeyRound, Eye, EyeOff, Calendar, 
  UserPlus, Check, X, LoaderCircle, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/api/supabase';

interface FormData {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  dateOfBirth: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

interface RegisterFormProps {
  onSuccess?: () => void;
  redirectPath?: string;
}

interface ValidationState {
  firstName: boolean | null;
  lastName: boolean | null;
  username: boolean | null;
  email: boolean | null;
  dateOfBirth: boolean | null;
  password: boolean | null;
  confirmPassword: boolean | null;
  agreeToTerms: boolean | null;
}

// Custom DatePicker component
const DatePicker: React.FC<{
  value: string;
  onChange: (value: string) => void;
  isValid?: boolean | null;
  errorMessage?: string;
}> = ({ value, onChange, isValid, errorMessage }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    // Start with January of 18 years ago (for age verification)
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    date.setMonth(0);
    date.setDate(1);
    return date;
  });
  
  const calendarRef = useRef<HTMLDivElement>(null);
  
  // Format a date as MM/DD/YYYY
  const formatDate = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };
  
  // Parse a string date into a Date object
  const parseDate = (dateStr: string): Date | null => {
    // Handle empty input
    if (!dateStr) return null;
    
    // Try MM/DD/YYYY format
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
      const [month, day, year] = dateStr.split('/').map(Number);
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) return date;
    }
    
    // Try YYYY-MM-DD format (from input type="date")
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) return date;
    }
    
    // Try parsing with built-in Date parser (more flexible)
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;
    
    return null;
  };
  
  // Convert from YYYY-MM-DD to MM/DD/YYYY and vice versa
  useEffect(() => {
    // If value is in YYYY-MM-DD format, convert it to MM/DD/YYYY for display
    if (value && /^\d{4}-\d{1,2}-\d{1,2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) {
        setDisplayValue(formatDate(date));
        setSelectedDate(date);
      }
    } else if (value && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
      // If value is already in MM/DD/YYYY, just use it
      setDisplayValue(value);
      const date = parseDate(value);
      if (date) setSelectedDate(date);
    } else {
      setDisplayValue(value);
    }
  }, [value]);
  
  // Handle manual date input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);
    
    // Try to parse and validate the date
    const parsedDate = parseDate(inputValue);
    if (parsedDate) {
      // If valid, convert to YYYY-MM-DD for the form value
      const year = parsedDate.getFullYear();
      const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
      const day = String(parsedDate.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
      setSelectedDate(parsedDate);
    } else {
      // If not valid yet, just update the display value
      onChange(inputValue);
    }
  };
  
  // Get days in month
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  // Handle calendar date selection
  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth);
    newDate.setDate(day);
    
    // Format for form value (YYYY-MM-DD)
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    onChange(`${year}-${month}-${dayStr}`);
    
    // Update display value and state
    setDisplayValue(formatDate(newDate));
    setSelectedDate(newDate);
    setShowCalendar(false);
  };
  
  // Handle month navigation
  const handlePrevMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };
  
  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };
  
  // Handle year navigation (faster jumps)
  const handlePrevYear = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setFullYear(newMonth.getFullYear() - 1);
    setCurrentMonth(newMonth);
  };
  
  const handleNextYear = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setFullYear(newMonth.getFullYear() + 1);
    setCurrentMonth(newMonth);
  };
  
  // Handle clicking outside of calendar to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Create array for days of the week header
    const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    
    // Create blanks for days before the first day of the month
    const blanks = Array(firstDayOfMonth).fill(null);
    
    // Create days for the current month
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    // Combine blanks and days
    const calendarDays = [...blanks, ...days];
    
    return (
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
        {/* Days of week header */}
        {daysOfWeek.map((day, index) => (
          <div key={`header-${index}`} className="py-1.5 font-medium text-gray-400">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`blank-${index}`} className="py-1.5"></div>;
          }
          
          // Check if this day is the selected date
          const isSelected = selectedDate && 
                          selectedDate.getDate() === day && 
                          selectedDate.getMonth() === month && 
                          selectedDate.getFullYear() === year;
          
          // Check if this day is today
          const today = new Date();
          const isToday = today.getDate() === day && 
                        today.getMonth() === month && 
                        today.getFullYear() === year;
          
          return (
            <div 
              key={`day-${index}`}
              onClick={() => handleDateSelect(day)}
              className={`py-1.5 rounded-md cursor-pointer transition-colors ${
                isSelected 
                  ? 'bg-green-600 text-white font-medium' 
                  : isToday 
                    ? 'border border-green-500/40 text-green-400' 
                    : 'text-white hover:bg-gray-700'
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>
    );
  };
  
  // Year picker for quickly jumping to birth year
  const renderYearPicker = () => {
    // Generate years from 1930 to 2011
    const yearStart = 1930;
    const yearEnd = 2011;
    const allYears = Array.from(
      { length: yearEnd - yearStart + 1 }, 
      (_, i) => yearEnd - i
    );
    
    return (
      <div className="mt-2 grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto custom-scrollbar text-center text-xs border-t border-gray-700 pt-2">
        {allYears.map(year => (
          <div
            key={`year-${year}`}
            onClick={() => {
              const newDate = new Date(currentMonth);
              newDate.setFullYear(year);
              setCurrentMonth(newDate);
            }}
            className={`py-1.5 px-1 rounded-md cursor-pointer hover:bg-gray-700 transition-colors ${
              currentMonth.getFullYear() === year ? 'bg-green-600 text-white font-medium' : 'text-white'
            }`}
          >
            {year}
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="relative">
      <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-300 mb-1">
        Date of Birth
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400">
          <Calendar size={16} />
        </div>
        <input
          id="dateOfBirth"
          name="dateOfBirth"
          type="text"
          placeholder="MM/DD/YYYY"
          value={displayValue}
          onChange={handleInputChange}
          className={`w-full pl-10 pr-10 py-2 bg-gray-800 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white placeholder-gray-400 transition-colors duration-200 ${
            isValid === true ? 'border-green-500' : isValid === false ? 'border-red-500' : 'border-gray-700'
          }`}
          required
        />
        <button
          type="button"
          onClick={() => setShowCalendar(!showCalendar)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
        >
          {showCalendar ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        
        {isValid !== null && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            {isValid ? (
              <Check size={16} className="text-green-400" />
            ) : (
              <X size={16} className="text-red-400" />
            )}
          </div>
        )}
      </div>
      
      {errorMessage && isValid === false && (
        <p className="text-red-400 text-xs mt-1">{errorMessage}</p>
      )}
      
      <p className="text-gray-500 text-xs mt-1">Must be 14+ years old</p>
      
      {/* Calendar dropdown */}
      {showCalendar && (
        <div 
          ref={calendarRef}
          className="absolute z-10 mt-1 w-full bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-md shadow-lg p-4"
        >
          {/* Calendar header with month/year navigation */}
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <button 
                type="button"
                onClick={handlePrevYear}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Previous Year"
              >
                <div className="flex items-center">
                  <ChevronLeft size={16} strokeWidth={1.5} />
                  <ChevronLeft size={16} strokeWidth={1.5} className="-ml-4" />
                </div>
              </button>
              <button 
                type="button"
                onClick={handlePrevMonth}
                className="p-1 ml-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Previous Month"
              >
                <ChevronLeft size={16} strokeWidth={1.5} />
              </button>
            </div>
            
            <div className="text-sm font-medium">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            
            <div className="flex items-center">
              <button 
                type="button"
                onClick={handleNextMonth}
                className="p-1 mr-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Next Month"
              >
                <ChevronRight size={16} strokeWidth={1.5} />
              </button>
              <button 
                type="button"
                onClick={handleNextYear}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Next Year"
              >
                <div className="flex items-center">
                  <ChevronRight size={16} strokeWidth={1.5} />
                  <ChevronRight size={16} strokeWidth={1.5} className="-ml-4" />
                </div>
              </button>
            </div>
          </div>
          
          {/* Calendar grid */}
          {generateCalendarDays()}
          
          {/* Birth year quick select */}
          {renderYearPicker()}
          
          {/* Clear and Today buttons */}
          <div className="flex justify-between mt-2 pt-2 border-t border-gray-700">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setDisplayValue('');
                setSelectedDate(null);
                setShowCalendar(false);
              }}
              className="text-xs text-gray-400 hover:text-white"
            >
              Clear
            </button>
            
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                onChange(formattedDate);
                setDisplayValue(formatDate(today));
                setSelectedDate(today);
                setShowCalendar(false);
              }}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Today
            </button>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        /* Custom scrollbar styles */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.4);
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.4);
          border-radius: 4px;
          border: 2px solid rgba(31, 41, 55, 0.4);
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.5);
        }
        
        /* Checkbox animation */
        @keyframes checkmark-appear {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-checkmark {
          animation: checkmark-appear 0.3s ease-out forwards;
        }
        
        /* Green flash animation */
        @keyframes green-flash {
          0% {
            opacity: 0;
          }
          25% {
            opacity: 1;
          }
          75% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        
        .animate-green-flash {
          animation: green-flash 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

// Modified input component with dark theme styling
const TextInput: React.FC<{
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  name: string;
  id: string;
  label: string;
  type: string;
  icon: React.ReactNode;
  isValid?: boolean | null;
  errorMessage?: string;
  sampleText?: string;
}> = ({ value, onChange, placeholder, name, id, label, type, icon, isValid, errorMessage, sampleText }) => {
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
          className={`w-full pl-10 pr-10 py-2 bg-gray-800 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white placeholder-gray-400 transition-colors duration-200 ${
            isValid === true ? 'border-green-500' : isValid === false ? 'border-red-500' : 'border-gray-700'
          }`}
          required
        />
        {isValid !== null && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {isValid ? (
              <Check size={16} className="text-green-400" />
            ) : (
              <X size={16} className="text-red-400" />
            )}
          </div>
        )}
        {sampleText && value.length === 0 && (
          <div className="absolute text-xs text-gray-500 mt-1">{sampleText}</div>
        )}
      </div>
      {errorMessage && isValid === false && (
        <p className="text-red-400 text-xs mt-1">{errorMessage}</p>
      )}
    </div>
  );
};

// Modified password input with dark theme styling
const PasswordInput: React.FC<{
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  name: string;
  id: string;
  label: string;
  isValid?: boolean | null;
  errorMessage?: string;
}> = ({ value, onChange, placeholder, name, id, label, isValid, errorMessage }) => {
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
          className={`w-full pl-10 pr-10 py-2 bg-gray-800 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white placeholder-gray-400 transition-colors duration-200 ${
            isValid === true ? 'border-green-500' : isValid === false ? 'border-red-500' : 'border-gray-700'
          }`}
          required
        />
        
        <button 
          type="button"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
        
        {isValid !== null && value.length > 0 && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            {isValid ? (
              <Check size={16} className="text-green-400" />
            ) : (
              <X size={16} className="text-red-400" />
            )}
          </div>
        )}
      </div>
      {errorMessage && isValid === false && (
        <p className="text-red-400 text-xs mt-1">{errorMessage}</p>
      )}
    </div>
  );
};

// Updated full register form with improved calendar
const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  redirectPath
}) => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>({
    firstName: null,
    lastName: null,
    username: null,
    email: null,
    dateOfBirth: null,
    password: null,
    confirmPassword: null,
    agreeToTerms: null
  });
  
  const [validationMessages, setValidationMessages] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: ''
  });

  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameExists, setUsernameExists] = useState(false);

  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showGreenFlash, setShowGreenFlash] = useState(false);

  // Password strength calculation
  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 1;
    
    // Character variety checks
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return strength;
  };

  // Password strength text & color
  const getPasswordStrengthText = (strength: number): { text: string; color: string } => {
    switch(strength) {
      case 0: return { text: 'Very weak', color: '#ef4444' };
      case 1: return { text: 'Weak', color: '#f97316' };
      case 2: return { text: 'Fair', color: '#f59e0b' };
      case 3: return { text: 'Good', color: '#84cc16' };
      case 4: return { text: 'Strong', color: '#22c55e' };
      case 5: return { text: 'Very strong', color: '#15803d' };
      default: return { text: 'Unknown', color: '#6b7280' };
    }
  };

  // Function to check if username exists
  const checkUsername = useCallback(async (username: string) => {
    if (username.length < 3) return false;
    
    setCheckingUsername(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();
      
      const exists = !!data;
      setUsernameExists(exists);
      
      if (exists) {
        setValidationMessages(prev => ({
          ...prev,
          username: 'Username already taken'
        }));
        setValidationState(prev => ({
          ...prev,
          username: false
        }));
      }
      
      return exists;
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    } finally {
      setCheckingUsername(false);
    }
  }, []);

  // Handle input change for registration form
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Validate the field that just changed
    validateField(name, value);
  };
  
  // Handle date change
  const handleDateChange = (value: string) => {
    setFormData({
      ...formData,
      dateOfBirth: value
    });
    
    validateField('dateOfBirth', value);
  };
  
  // Handle checkbox change
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
    
    validateField(name, checked.toString());
    
    // Trigger animation when checking the box
    if (checked) {
      setShowGreenFlash(true);
      setTimeout(() => setShowGreenFlash(false), 800);
    }
  };

  // Validate a single field
  const validateField = useCallback(async (name: string, value: string) => {
    let isValid = false;
    let message = '';
    
    switch (name) {
      case 'firstName':
        isValid = value.length >= 2;
        message = isValid ? '' : 'First name must be at least 2 characters';
        break;
        
      case 'lastName':
        isValid = value.length >= 2;
        message = isValid ? '' : 'Last name must be at least 2 characters';
        break;
        
      case 'username':
        isValid = /^[a-zA-Z0-9_]{3,20}$/.test(value);
        message = isValid ? '' : 'Username must be 3-20 characters and can only contain letters, numbers, and underscores';
        
        if (isValid) {
          // Check if username exists
          const exists = await checkUsername(value);
          isValid = !exists;
          if (exists) {
            message = 'Username already taken';
          }
        }
        break;
        
      case 'email':
        isValid = /\S+@\S+\.\S+/.test(value);
        message = isValid ? '' : 'Please enter a valid email address';
        break;
        
      case 'dateOfBirth':
        // Handle both date formats
        let dobDate: Date | null = null;
        
        if (value.includes('/')) {
          // Handle MM/DD/YYYY format
          const [month, day, year] = value.split('/').map(Number);
          dobDate = new Date(year, month - 1, day);
        } else if (value.includes('-')) {
          // Handle YYYY-MM-DD format
          const [year, month, day] = value.split('-').map(Number);
          dobDate = new Date(year, month - 1, day);
        } else {
          // Try native parsing
          dobDate = new Date(value);
        }
        
        if (dobDate && !isNaN(dobDate.getTime())) {
          const today = new Date();
          const age = today.getFullYear() - dobDate.getFullYear();
          const monthDiff = today.getMonth() - dobDate.getMonth();
          
          // Adjust age if birth month hasn't occurred yet this year
          const adjustedAge = (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) 
            ? age - 1 
            : age;
          
          isValid = adjustedAge >= 14;
          message = isValid ? '' : 'You must be at least 14 years old';
        } else {
          isValid = false;
          message = 'Please enter a valid date';
        }
        break;
        
      case 'password':
        const strength = calculatePasswordStrength(value);
        isValid = strength >= 3;
        message = isValid ? '' : 'Password should include uppercase, lowercase, numbers and symbols';
        
        // Also validate confirmPassword if it has a value
        if (formData.confirmPassword) {
          const confirmIsValid = value === formData.confirmPassword;
          setValidationState(prev => ({
            ...prev,
            confirmPassword: confirmIsValid
          }));
          setValidationMessages(prev => ({
            ...prev,
            confirmPassword: confirmIsValid ? '' : 'Passwords do not match'
          }));
        }
        break;
        
      case 'confirmPassword':
        isValid = value === formData.password;
        message = isValid ? '' : 'Passwords do not match';
        break;
        
      case 'agreeToTerms':
        isValid = value === 'true';
        message = isValid ? '' : 'You must agree to the terms and conditions';
        break;
        
      default:
        return;
    }
    
    // Only set validation state if the field has a value
    if (value) {
      setValidationState(prev => ({
        ...prev,
        [name]: isValid
      }));
      
      setValidationMessages(prev => ({
        ...prev,
        [name]: message
      }));
    } else {
      // If field is empty, reset validation state
      setValidationState(prev => ({
        ...prev,
        [name]: null
      }));
      
      setValidationMessages(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [formData, checkUsername]);

  // Validate the entire form
  const validateForm = (): boolean => {
    // Validate all fields
    let isValid = true;
    
    // Validate all fields
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'agreeToTerms') {
        if (!value) {
          setValidationState(prev => ({
            ...prev,
            [key]: false
          }));
          setValidationMessages(prev => ({
            ...prev,
            [key]: 'You must agree to the terms and conditions'
          }));
          isValid = false;
        } else {
          setValidationState(prev => ({
            ...prev,
            [key]: true
          }));
          setValidationMessages(prev => ({
            ...prev,
            [key]: ''
          }));
        }
      } else {
        const fieldValid = validateField(key as keyof FormData, value.toString());
        if (!fieldValid) {
          isValid = false;
        }
      }
    });
    
    // Check if any fields are empty
    if (Object.values(formData).some(value => !value)) {
      setRegisterError('All fields are required');
      return false;
    }
    
    // Check if any validations failed
    if (!isValid) {
      setRegisterError('Please correct the errors in the form');
      return false;
    }
    
    return true;
  };

  // Handle registration submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setRegisterError('');
    
    try {
      // Direct Supabase registration
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            username: formData.username,
            date_of_birth: formData.dateOfBirth,
          }
        }
      });
      
      if (authError) {
        console.error('Supabase auth error:', authError);
        setRegisterError(authError.message || 'Registration failed');
        setIsLoading(false);
        return;
      }
      
      // Create a profile record in a separate table
      if (authData?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            username: formData.username,
            first_name: formData.firstName,
            last_name: formData.lastName,
            date_of_birth: formData.dateOfBirth,
            email: formData.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (profileError) {
          console.error('Profile creation error:', profileError);
          setRegisterError(profileError.message || 'Failed to create user profile');
          setIsLoading(false);
          return;
        }
      }
      
      // If we got here, registration was successful
      setIsLoading(false);
      setRegisterSuccess(true);
      
      // Wait a moment before redirecting to show success message
      setTimeout(() => {
        // Execute success callback if provided
        if (onSuccess) {
          onSuccess();
        }
        if (redirectPath) {
          window.location.href = redirectPath;
        }
      }, 2000);
      
    } catch (err: unknown) {
      setIsLoading(false);
      if (err instanceof Error) {
        setRegisterError(err.message);
      } else {
        setRegisterError('An unexpected error occurred during registration');
      }
      console.error('Registration error:', err);
    }
  };

  const passwordStrength = formData.password ? calculatePasswordStrength(formData.password) : 0;
  const strengthInfo = getPasswordStrengthText(passwordStrength);

  return (
    <div className="w-full">
      {/* Green flash animation */}
      {showGreenFlash && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute inset-0 bg-green-400/10 animate-green-flash"></div>
        </div>
      )}
      {registerSuccess ? (
        <div className="text-center py-8 px-4 bg-gray-800/50 rounded-lg border border-green-500/20 shadow-lg">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <span className="text-3xl text-green-400">✓</span>
          </div>
          <h3 className="text-2xl font-semibold mb-3 text-green-400">Registration Successful!</h3>
          <p className="text-gray-300 mb-4">Your account has been created successfully. Check your email to confirm your registration.</p>
          <div className="space-y-3 mt-6">
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-md transition-all duration-200 flex items-center justify-center"
            >
              Go to Dashboard <ArrowRight size={16} className="ml-2" />
            </button>
            <button 
              onClick={() => window.location.href = '/profile/setup'}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-md transition-all duration-200"
            >
              Complete Your Profile
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleRegister} className="space-y-6">
          {registerError && (
            <div className="bg-red-900/30 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
              {registerError}
            </div>
          )}
          
          <div className="space-y-4">
            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <TextInput
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleRegisterChange}
                placeholder="First name"
                label="First Name"
                icon={<User size={16} />}
                isValid={validationState.firstName}
                errorMessage={validationMessages.firstName}
              />
              
              <TextInput
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleRegisterChange}
                placeholder="Last name"
                label="Last Name"
                icon={<User size={16} />}
                isValid={validationState.lastName}
                errorMessage={validationMessages.lastName}
              />
            </div>
            
            {/* Username field */}
            <div className="relative">
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                Username
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400">
                  <UserPlus size={16} />
                </div>
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleRegisterChange}
                  className={`w-full pl-10 pr-10 py-2 bg-gray-800 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white placeholder-gray-400 transition-colors duration-200 ${
                    validationState.username === true ? 'border-green-500' : 
                    validationState.username === false ? 'border-red-500' : 'border-gray-700'
                  }`}
                  required
                />
                {checkingUsername && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <LoaderCircle className="animate-spin h-5 w-5 text-gray-400" />
                  </div>
                )}
                {!checkingUsername && validationState.username === true && !usernameExists && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Check size={16} className="text-green-400" />
                  </div>
                )}
                {!checkingUsername && validationState.username === false && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <X size={16} className="text-red-400" />
                  </div>
                )}
              </div>
              {validationMessages.username && validationState.username === false && (
                <p className="text-red-400 text-xs mt-1">{validationMessages.username}</p>
              )}
            </div>
            
            {/* Email field */}
            <TextInput
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleRegisterChange}
              placeholder="you@example.com"
              label="Email Address"
              icon={<Mail size={16} />}
              isValid={validationState.email}
              errorMessage={validationMessages.email}
            />
            
            {/* Date of birth field with improved UI */}
            <DatePicker
              value={formData.dateOfBirth}
              onChange={handleDateChange}
              isValid={validationState.dateOfBirth}
              errorMessage={validationMessages.dateOfBirth}
            />
            
            {/* Security section */}
            <div className="mt-2 pt-3 border-t border-gray-700">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Security</h3>
              
              {/* Password requirements notice */}
              <div className="p-2 bg-gray-700/50 rounded-md text-xs text-gray-300 mb-3">
                <ul className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <li>• 8+ characters</li>
                  <li>• Uppercase &amp; lowercase</li>
                  <li>• Numbers</li>
                  <li>• Special characters (!@#$)</li>
                </ul>
              </div>
              
              {/* Password Input Component */}
              <PasswordInput
                id="password"
                name="password"
                value={formData.password}
                onChange={handleRegisterChange}
                placeholder="Create a strong password"
                label="Password"
                isValid={validationState.password}
                errorMessage={validationMessages.password}
              />
              
              {formData.password && (
                <div className="mt-1 mb-2">
                  <div className="flex gap-1 mb-1 h-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className="flex-1 rounded-full transition-all duration-500"
                        style={{
                          backgroundColor: passwordStrength >= level ? strengthInfo.color : '#374151',
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: strengthInfo.color }}>
                    {strengthInfo.text}
                  </p>
                </div>
              )}
              
              {/* Confirm Password Input Component */}
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleRegisterChange}
                placeholder="Confirm your password"
                label="Confirm Password"
                isValid={validationState.confirmPassword}
                errorMessage={validationMessages.confirmPassword}
              />
            </div>
          </div>
          
          {/* Terms and Conditions checkbox */}
          <div className="mt-6 pt-4 border-t border-gray-700">
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <div className="relative">
                  <input
                    id="agreeToTerms"
                    name="agreeToTerms"
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={handleCheckboxChange}
                    className={`h-5 w-5 rounded border-gray-700 bg-gray-800 text-green-500 focus:ring-green-500 focus:ring-offset-gray-900 transition-all duration-300 
                      ${formData.agreeToTerms ? 'border-green-500 ring-2 ring-green-500/20' : 'border-gray-600'}`}
                  />
                  {formData.agreeToTerms && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <Check size={14} className="text-green-500 animate-checkmark" />
                    </div>
                  )}
                </div>
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="agreeToTerms" className="text-gray-300">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-green-400 hover:text-green-300 underline font-medium transition-colors"
                  >
                    Terms and Conditions
                  </button>
                  {' '}{' '}and{' '}{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowTerms(false);
                      setShowPrivacyPolicy(true);
                    }}
                    className="text-green-400 hover:text-green-300 underline font-medium transition-colors"
                  >
                    Privacy Policy
                  </button>
                </label>
                {validationState.agreeToTerms === false && (
                  <p className="text-red-400 text-xs mt-1">{validationMessages.agreeToTerms}</p>
                )}
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-md transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-1"
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
                Create Account
                <ArrowRight size={18} className="ml-2" />
              </>
            )}
          </button>
          
          <div className="text-center text-sm text-gray-400">
            By registering, you agree to our <a href="#" className="text-green-400 hover:text-green-300 transition-colors">Terms</a> and <a href="#" className="text-green-400 hover:text-green-300 transition-colors">Privacy Policy</a>
          </div>
          
          <div className="pt-3 text-center border-t border-gray-800">
            <p className="text-gray-400 text-sm">
              Already have an account? <a href="/auth/login" className="text-green-400 hover:text-green-300 font-medium transition-colors">Log In</a>
            </p>
          </div>
        </form>
      )}
      
      {/* Terms and Conditions Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative bg-gray-900 border border-gray-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden p-6">
            <button
              type="button"
              onClick={() => setShowTerms(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors z-10"
            >
              <X size={20} />
            </button>
            
            <div className="h-full max-h-[calc(90vh-48px)] overflow-y-auto no-scrollbar pr-6">
              <h1 className="text-2xl font-bold mb-6 text-green-400">Cerebro Terms and Conditions</h1>
              
              <p className="font-medium text-base text-white mb-6">Last Updated: March 20, 2025</p>
              
              <p className="mb-4 text-gray-300">
                Welcome to Cerebro! These Terms and Conditions (&quot;Terms&quot;) govern your use of our platform, including our stock market battles, trivia challenges, puzzle competitions, and all associated features. By accessing or using Cerebro, you agree to be bound by these Terms. If you do not agree, please do not use our services.
              </p>
              
              <hr className="my-6 border-gray-700" />
              
              <h2 className="text-xl font-semibold mb-3 text-white">1. Acceptance of Terms</h2>
              <p className="mb-4 text-gray-300">
                By accessing or using Cerebro, you confirm that you have read, understood, and agreed to be bound by these Terms and our Privacy Policy. These Terms apply to all users of the platform, including visitors, registered users, and content contributors.
              </p>
              
              <hr className="my-6 border-gray-700" />
              
              <h2 className="text-xl font-semibold mb-3 text-white">2. Age Restriction</h2>
              <p className="mb-4 text-gray-300">
                You must be at least 14 years old to use Cerebro. By creating an account, you represent and warrant that you meet this age requirement. If you are under 14, you may only use Cerebro with parental or legal guardian supervision.
              </p>
              
              <hr className="my-6 border-gray-700" />
              
              <h2 className="text-xl font-semibold mb-3 text-white">3. User Accounts &amp; Responsibilities</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-300">
                <li>You must provide accurate, complete, and up-to-date information when creating an account.</li>
                <li>You are solely responsible for maintaining the confidentiality of your login credentials.</li>
                <li>Any activity conducted through your account is your responsibility. If you suspect unauthorized access, notify us immediately at support@cerebro.com.</li>
              </ul>
              
              <hr className="my-6 border-gray-700" />
              
              <h2 className="text-xl font-semibold mb-3 text-white">4. Intellectual Property</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-300">
                <li>Cerebro and all original content, trademarks, features, and functionality are owned by Cerebro Inc. and protected under copyright, trademark, and intellectual property laws.</li>
                <li>Users may not copy, modify, distribute, or use any of Cerebro&#39;s content without written permission.</li>
              </ul>
              
              <hr className="my-6 border-gray-700" />
              
              <h2 className="text-xl font-semibold mb-3 text-white">5. User Content &amp; Conduct</h2>
              <p className="mb-2 text-gray-300">By using Cerebro, you agree to:</p>
              <ul className="list-none pl-6 mb-4 space-y-2 text-gray-300">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✅</span>
                  <span>Only post legal, appropriate, and non-offensive content.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✅</span>
                  <span>Respect other users and avoid harassment, hate speech, or abuse.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✅</span>
                  <span>Not engage in fraudulent or misleading activities.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✅</span>
                  <span>Not attempt to manipulate or exploit Cerebro&#39;s platform or competition mechanics.</span>
                </li>
              </ul>
              <p className="mb-4 text-gray-300">
                Cerebro reserves the right to remove any content and suspend or ban users who violate these rules.
              </p>
              
              <hr className="my-6 border-gray-700" />
              
              <h2 className="text-xl font-semibold mb-3 text-white">6. Privacy &amp; Data Protection</h2>
              <p className="mb-4 text-gray-300">
                Your privacy is important to us. Please review our <button 
                  type="button" 
                  className="text-green-400 hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowTerms(false);
                    setShowPrivacyPolicy(true);
                  }}
                >
                  Privacy Policy
                </button> for details on how we collect, use, and safeguard your personal information.
              </p>
              
              <hr className="my-6 border-gray-700" />
              
              <h2 className="text-xl font-semibold mb-3 text-white">7. Payments, Wagers &amp; Transactions</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-300">
                <li>Users may participate in skill-based competitions involving entry fees and cash rewards.</li>
                <li>Cerebro does not operate as a gambling platform; all winnings are based purely on skill.</li>
                <li>Cerebro takes a small transaction fee on certain competitions for platform maintenance.</li>
                <li>No refunds will be issued once an entry fee is paid, except in cases of technical errors.</li>
              </ul>
              
              <hr className="my-6 border-gray-700" />
              
              <h2 className="text-xl font-semibold mb-3 text-white">8. Termination &amp; Account Suspension</h2>
              <p className="mb-2 text-gray-300">Cerebro reserves the right to suspend or terminate your account without prior notice if:</p>
              <ul className="list-none pl-6 mb-4 space-y-2 text-gray-300">
                <li className="flex items-start">
                  <span className="text-red-400 mr-2">❌</span>
                  <span>You violate any Terms or policies.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-400 mr-2">❌</span>
                  <span>You engage in fraudulent, abusive, or illegal behavior.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-400 mr-2">❌</span>
                  <span>Your actions threaten the integrity of the platform.</span>
                </li>
              </ul>
              
              <hr className="my-6 border-gray-700" />
              
              <h2 className="text-xl font-semibold mb-3 text-white">9. Limitation of Liability</h2>
              <p className="mb-2 text-gray-300">
                Cerebro is provided &quot;as is&quot; without warranties of any kind. Cerebro Inc., its affiliates, employees, or partners shall not be liable for any:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-300">
                <li>Loss of profits, data, or earnings.</li>
                <li>Technical failures, interruptions, or security breaches.</li>
                <li>User actions, misconduct, or unauthorized use of accounts.</li>
              </ul>
              <p className="mb-4 text-gray-300">
                You agree to use Cerebro at your own risk.
              </p>
              
              <hr className="my-6 border-gray-700" />
              
              <h2 className="text-xl font-semibold mb-3 text-white">10. Changes to Terms</h2>
              <p className="mb-4 text-gray-300">
                Cerebro may update these Terms at any time. Changes will take effect immediately upon posting. Continued use of the platform after changes constitutes acceptance of the new Terms.
              </p>
              
              <hr className="my-6 border-gray-700" />
              
              <h2 className="text-xl font-semibold mb-3 text-white">11. Contact Us</h2>
              <p className="mb-4 text-gray-300">
                If you have any questions about these Terms, please contact us at support@cerebro.com.
              </p>
              
              <p className="mb-6 text-gray-300">
                By using Cerebro, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.
              </p>
              
              <div className="mt-6 pt-4 border-t border-gray-700 flex justify-between">
                <button
                  type="button"
                  onClick={() => setShowTerms(false)}
                  className="px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, agreeToTerms: true }));
                    setValidationState(prev => ({ ...prev, agreeToTerms: true }));
                    setValidationMessages(prev => ({ ...prev, agreeToTerms: "" }));
                    setShowTerms(false);
                    setShowGreenFlash(true);
                    setTimeout(() => setShowGreenFlash(false), 800);
                  }}
                  className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
                >
                  I Agree
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Privacy Policy Modal */}
      {showPrivacyPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative bg-gray-900 border border-gray-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden p-6">
            <button
              type="button"
              onClick={() => setShowPrivacyPolicy(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors z-10"
            >
              <X size={20} />
            </button>
            
            <div className="h-full max-h-[calc(90vh-48px)] overflow-y-auto no-scrollbar pr-6">
              <h1 className="text-2xl font-bold mb-6 text-green-400">Cerebro Privacy Policy</h1>
              
              <p className="font-medium text-base text-white mb-6">Last Updated: March 20, 2025</p>
              
              <p className="mb-4 text-gray-300">
                At Cerebro, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
              </p>
              
              <hr className="my-6 border-gray-700" />
              
              <h2 className="text-xl font-semibold mb-3 text-white">1. Information We Collect</h2>
              <h3 className="text-lg font-semibold mb-2 text-gray-200">Personal Information</h3>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-300">
                <li>Contact information (name, email address, phone number)</li>
                <li>Account credentials (username, password)</li>
                <li>Profile information (date of birth, profile picture)</li>
                <li>Payment and transaction information</li>
              </ul>
              
              <h3 className="text-lg font-semibold mb-2 text-gray-200">Usage Information</h3>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-300">
                <li>Log data (IP address, browser type, pages visited)</li>
                <li>Device information (hardware model, operating system)</li>
                <li>Competition participation and performance data</li>
                <li>Communication with other users and our support team</li>
              </ul>
              
              <hr className="my-6 border-gray-700" />
              
              <h2 className="text-xl font-semibold mb-3 text-white">2. How We Use Your Information</h2>
              <p className="mb-2 text-gray-300">We use your information to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-300">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and administer competitions</li>
                <li>Communicate with you about your account, updates, and promotions</li>
                <li>Monitor and analyze usage patterns and trends</li>
                <li>Protect against unauthorized access and fraudulent activity</li>
                <li>Comply with legal obligations</li>
              </ul>
              
              <hr className="my-6 border-gray-700" />
              
              <h2 className="text-xl font-semibold mb-3 text-white">3. Information Sharing</h2>
              <p className="mb-2 text-gray-300">We may share your information with:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-300">
                <li>Service providers who help operate our platform</li>
                <li>Financial institutions to process payments</li>
                <li>Other users (limited to your username and competition data)</li>
                <li>Legal authorities when required by law</li>
              </ul>
              <p className="mb-4 text-gray-300">
                We will not sell your personal information to third parties.
              </p>
              
              <hr className="my-6 border-gray-700" />
              
              <h2 className="text-xl font-semibold mb-3 text-white">4. Data Security</h2>
              <p className="mb-4 text-gray-300">
                We implement appropriate technical and organizational measures to protect your personal information from unauthorized access, disclosure, alteration, and destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, so we cannot guarantee absolute security.
              </p>
              
              <hr className="my-6 border-gray-700" />
              
              <h2 className="text-xl font-semibold mb-3 text-white">5. Your Rights</h2>
              <p className="mb-2 text-gray-300">You have the right to:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-300">
                <li>Access and update your personal information</li>
                <li>Request deletion of your account and data</li>
                <li>Opt out of marketing communications</li>
                <li>Object to the processing of your information</li>
                <li>Request a copy of your data</li>
              </ul>
              
              <hr className="my-6 border-gray-700" />
              
              <h2 className="text-xl font-semibold mb-3 text-white">6. Cookies and Tracking</h2>
              <p className="mb-4 text-gray-300">
                We use cookies and similar tracking technologies to enhance your experience, analyze usage, and assist in our marketing efforts. You can control cookies through your browser settings, but this may impact certain features of our service.
              </p>
              
              <hr className="my-6 border-gray-700" />
              
              <h2 className="text-xl font-semibold mb-3 text-white">7. Children&#39;s Privacy</h2>
              <p className="mb-4 text-gray-300">
                Our services are not intended for individuals under 14 years of age. We do not knowingly collect personal information from children under 14. If we learn we have collected personal information from a child under 14, we will delete that information promptly.
              </p>
              
              <hr className="my-6 border-gray-700" />
              
              <h2 className="text-xl font-semibold mb-3 text-white">8. Changes to This Policy</h2>
              <p className="mb-4 text-gray-300">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot; date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
              
              <hr className="my-6 border-gray-700" />
              
              <h2 className="text-xl font-semibold mb-3 text-white">9. Contact Us</h2>
              <p className="mb-4 text-gray-300">
                If you have any questions about this Privacy Policy, please contact us at privacy@cerebro.com.
              </p>
              
              <div className="mt-6 pt-4 border-t border-gray-700 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowPrivacyPolicy(false)}
                  className="px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        /* Complete scrollbar elimination */
        .no-scrollbar,
        .no-scrollbar * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        
        .no-scrollbar::-webkit-scrollbar,
        .no-scrollbar *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          background: transparent !important;
        }
        
        /* Checkbox animation */
        @keyframes checkmark-appear {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-checkmark {
          animation: checkmark-appear 0.3s ease-out forwards;
        }
        
        /* Green flash animation */
        @keyframes green-flash {
          0% {
            opacity: 0;
          }
          25% {
            opacity: 1;
          }
          75% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        
        .animate-green-flash {
          animation: green-flash 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default RegisterForm;