import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await resetPassword(email);
      if (error) throw error;
      setSuccess(true);
      toast.success('Password reset link sent to your email');
    } catch (error) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-nature-50 flex flex-col justify-center sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-nature-900">
            <Sprout className="w-8 h-8 text-earth-500" />
            <span>Agri<span className="text-earth-500">Smart</span></span>
          </Link>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-nature-900">
          Reset your password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-nature-200 sm:rounded-xl sm:px-10">
          {!success ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-nature-700">Email address</label>
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
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-earth-600 hover:bg-earth-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-earth-500 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center">
              <p className="text-sm text-nature-600 mb-4">
                Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="font-medium text-earth-600 hover:text-earth-500">
              Return to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
