import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, AlertCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';

const SignUp = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signUp, error, isLoading, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signUp(email, password, name);
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by the store
    }
  };

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

            <Button type="submit" className="w-full" isLoading={isLoading}>
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