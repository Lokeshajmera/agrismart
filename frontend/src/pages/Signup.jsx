import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { supabase } from '../supabaseClient';

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Cross-device Magic Link Poller
  useEffect(() => {
    let interval;
    if (success) {
      interval = setInterval(async () => {
        const { data } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (data?.session) {
          clearInterval(interval);
          toast.success("Verification detected! Loading dashboard...");
          navigate('/app/profile');
        }
      }, 4000); // Check every 4 seconds
    }
    return () => clearInterval(interval);
  }, [success, email, password, navigate]);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { error, data } = await signup(email, password, {
        emailRedirectTo: `${window.location.origin}/app/profile`
      });
      if (error) throw error;
      
      setSuccess(true);
      toast.success('Registration successful! Please check your email to verify.');
    } catch (error) {
      toast.error(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-nature-50 dark:bg-nature-900 flex flex-col justify-center sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="flex justify-center mb-6">
            <Sprout className="w-16 h-16 text-earth-500" />
          </div>
          <h2 className="text-3xl font-extrabold text-nature-900 dark:text-white mb-4">Check your email</h2>
          <p className="text-nature-600">
            We've sent a verification link to <strong>{email}</strong>. Please click the link to verify your account.
          </p>
          <div className="mt-8">
            <Link to="/login" className="text-earth-600 font-medium hover:text-earth-500">
              Return to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nature-50 dark:bg-nature-900 flex flex-col justify-center sm:px-6 lg:px-8 py-12">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-nature-900 dark:text-white">
            <Sprout className="w-8 h-8 text-earth-500" />
            <span>Agri<span className="text-earth-500">Smart</span></span>
          </Link>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-nature-900 dark:text-white">Create a new account</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-nature-950 py-8 px-4 shadow-sm border border-nature-200 dark:border-nature-800 sm:rounded-xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSignup}>
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
                />
              </div>
            </div>

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
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-nature-700 dark:text-nature-200">Confirm Password</label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-nature-400" />
                <input 
                  required 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-nature-300 rounded-md shadow-sm placeholder-nature-400 focus:outline-none focus:ring-earth-500 focus:border-earth-500 sm:text-sm" 
                />
              </div>
            </div>

            <div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-earth-600 hover:bg-earth-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-earth-500 disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Sign up'}
              </button>
            </div>
          </form>
          <div className="mt-6 text-center border-t border-nature-200 dark:border-nature-800 pt-6">
            <p className="text-sm text-nature-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-earth-600 hover:text-earth-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
