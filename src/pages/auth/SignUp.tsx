import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, AlertCircle, Check, X, User } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { 
  generateUsernameFromName, 
  validateUsername, 
  checkUsernameAvailability,
  updateUsername 
} from '../../lib/usernameUtils';

const SignUp = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameError, setUsernameError] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  
  const { signUp, error, isLoading, clearError } = useAuthStore();
  const navigate = useNavigate();

  // Generate username from name when name changes
  useEffect(() => {
    if (name.trim()) {
      const generatedUsername = generateUsernameFromName(name.trim());
      if (generatedUsername && generatedUsername !== username) {
        setUsername(generatedUsername);
      }
    }
  }, [name]);

  // Validate and check username availability when username changes
  useEffect(() => {
    const checkUsername = async () => {
      if (!username.trim()) {
        setUsernameStatus('idle');
        setUsernameError('');
        return;
      }

      // First validate format
      const validation = validateUsername(username);
      if (!validation.isValid) {
        setUsernameStatus('invalid');
        setUsernameError(validation.error || 'Invalid username format');
        return;
      }

      // Then check availability
      setIsCheckingUsername(true);
      setUsernameStatus('checking');
      
      try {
        const { isAvailable, error: availabilityError } = await checkUsernameAvailability(username);
        
        if (availabilityError) {
          setUsernameStatus('invalid');
          setUsernameError(availabilityError);
        } else if (isAvailable) {
          setUsernameStatus('available');
          setUsernameError('');
        } else {
          setUsernameStatus('taken');
          setUsernameError('This username is already taken');
        }
      } catch (error) {
        setUsernameStatus('invalid');
        setUsernameError('Unable to check username availability');
      } finally {
        setIsCheckingUsername(false);
      }
    };

    // Debounce the username check
    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [username]);

  const getUsernameStatusIcon = () => {
    switch (usernameStatus) {
      case 'checking':
        return <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent" />;
      case 'available':
        return <Check size={16} className="text-success-600" />;
      case 'taken':
      case 'invalid':
        return <X size={16} className="text-error-600" />;
      default:
        return null;
    }
  };

  const getUsernameStatusColor = () => {
    switch (usernameStatus) {
      case 'available':
        return 'border-success-300 focus:border-success-500 focus:ring-success-500';
      case 'taken':
      case 'invalid':
        return 'border-error-300 focus:border-error-500 focus:ring-error-500';
      default:
        return 'border-primary-300 focus:border-primary-500 focus:ring-primary-500';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate username before proceeding
    if (usernameStatus !== 'available') {
      setUsernameError('Please choose a valid and available username');
      return;
    }
    
    try {
      // Sign up the user first
      await signUp(email, password, name);
      
      // Get the current user after signup
      const { data: { user } } = await import('../../lib/supabase').then(({ supabase }) => 
        supabase.auth.getUser()
      );
      
      if (user) {
        // Update the username in the profile
        const { success, error: usernameError } = await updateUsername(user.id, username);
        
        if (!success) {
          console.error('Failed to set username:', usernameError);
          // Don't fail the entire signup process, just log the error
        }
      }
      
      navigate('/discover');
    } catch (err) {
      // Error is handled by the store
    }
  };

  const isFormValid = name.trim() && email.trim() && password.trim() && usernameStatus === 'available';

  return (
    <div className="min-h-screen flex flex-col justify-center bg-primary-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center items-center mb-8">
          <Zap size={40} className="text-accent-500" />
          <span className="ml-2 text-3xl font-medium text-primary-800">Whizlist</span>
        </Link>
        
        <div className="bg-white py-8 px-4 shadow-elevated sm:rounded-lg sm:px-10">
          <h2 className="text-2xl font-bold text-primary-900 mb-6 text-center">
            Create your account
          </h2>
          
          {error && (
            <div className="mb-4 p-3 rounded bg-error-50 text-error-700 flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-primary-700">
                Full name
              </label>
              <input
                id="name"
                type="text"
                required
                className="input mt-1"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearError();
                }}
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-primary-700">
                Username
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={16} className="text-primary-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  className={`input pl-10 pr-10 ${getUsernameStatusColor()}`}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase());
                    clearError();
                  }}
                  placeholder="your-username"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {getUsernameStatusIcon()}
                </div>
              </div>
              
              {/* Username feedback */}
              <div className="mt-1">
                {usernameError && (
                  <p className="text-sm text-error-600">{usernameError}</p>
                )}
                {usernameStatus === 'available' && (
                  <p className="text-sm text-success-600">Username is available!</p>
                )}
                {usernameStatus === 'idle' && (
                  <p className="text-sm text-primary-500">
                    Must start with a letter, 3-30 characters, lowercase letters, numbers, and hyphens only
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-primary-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                className="input mt-1"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError();
                }}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-primary-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="input mt-1"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError();
                }}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              isLoading={isLoading || isCheckingUsername}
              disabled={!isFormValid || isLoading || isCheckingUsername}
            >
              Sign up
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-primary-600">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-600 hover:text-accent-700 font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;