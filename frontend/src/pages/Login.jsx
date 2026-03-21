import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sprout, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithPassword, loginWithOtp } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('password'); // 'password', 'email-otp'

  useEffect(() => {
    // Removed auto-fill per user request
  }, [location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (activeTab === 'password') {
      // Bypass real authentication for the Hackathon owner demo
      if (email === 'xyz@gmail.com' && password === '654321') {
        setLoading(false);
        toast.success('Logged in as Director successfully');
        navigate('/owner-dashboard');
        return;
      }

      try {
        const { error } = await loginWithPassword(email, password);
        if (error) throw error;
        
        toast.success('Logged in successfully');
        navigate('/app');
      } catch (error) {
        toast.error(error.message || 'Login failed');
      } finally {
        setLoading(false);
      }
    } else if (activeTab === 'email-otp') {
      try {
        const { error } = await loginWithOtp(email);
        if (error) throw error;

        toast.success('OTP sent to your email!');
        navigate('/verify-otp', { state: { email, type: 'email' } });
      } catch (error) {
        toast.error(error.message || 'Failed to send OTP');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-nature-50 dark:bg-nature-900 flex flex-col justify-center sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-nature-900 dark:text-white">
            <Sprout className="w-8 h-8 text-earth-500" />
            <span>Agri<span className="text-earth-500">Smart</span></span>
          </Link>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-nature-900 dark:text-white">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-nature-950 py-8 px-4 shadow-sm border border-nature-200 dark:border-nature-800 sm:rounded-xl sm:px-10">
          
          <div className="flex bg-nature-100 dark:bg-nature-800 rounded-lg p-1 mb-8">
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'password' ? 'bg-white dark:bg-nature-950 text-nature-900 dark:text-white shadow-sm' : 'text-nature-600 hover:text-nature-900 dark:text-white'
              }`}
            >
              Password
            </button>
            <button
              onClick={() => setActiveTab('email-otp')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'email-otp' ? 'bg-white dark:bg-nature-950 text-nature-900 dark:text-white shadow-sm' : 'text-nature-600 hover:text-nature-900 dark:text-white'
              }`}
            >
              Email OTP
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-nature-700 dark:text-nature-200">Email address</label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-nature-400" />
                <input 
                  required 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-nature-300 rounded-md shadow-sm placeholder-nature-400 focus:outline-none focus:ring-earth-500 focus:border-earth-500 sm:text-sm" 
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {activeTab === 'password' && (
              <div>
                <label className="block text-sm font-medium text-nature-700 dark:text-nature-200">Password</label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-nature-400" />
                  <input 
                    required 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-nature-300 rounded-md shadow-sm placeholder-nature-400 focus:outline-none focus:ring-earth-500 focus:border-earth-500 sm:text-sm" 
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="flex items-center justify-end">
                <div className="text-sm">
                  <Link to="/forgot-password" className="font-medium text-earth-600 hover:text-earth-500">
                    Forgot password?
                  </Link>
                </div>
              </div>
            )}

            <div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-earth-600 hover:bg-earth-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-earth-500 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Processing...' : (activeTab === 'password' ? 'Sign in' : 'Send OTP')}
              </button>
            </div>
          </form>
          
          {/* Sign up link removed per request */}
        </div>
      </div>
    </div>
  );
}
