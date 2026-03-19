import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signup = (email, password, options) => {
    return supabase.auth.signUp({ email, password, options });
  };

  const loginWithPassword = (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const loginWithOtp = (email) => {
    return supabase.auth.signInWithOtp({ email });
  };

  const loginWithPhone = (phone) => {
    return supabase.auth.signInWithOtp({ phone });
  };

  const verifyOtp = (emailOrPhone, token, type) => {
    // type can be 'email', 'sms', 'magiclink', etc.
    const params = { token, type };
    if (type === 'email' || type === 'magiclink') {
        params.email = emailOrPhone;
    } else if (type === 'sms') {
        params.phone = emailOrPhone;
    }
    return supabase.auth.verifyOtp(params);
  };

  const logout = () => {
    return supabase.auth.signOut();
  };

  const resetPassword = (email) => {
    return supabase.auth.resetPasswordForEmail(email);
  };

  const updatePassword = (newPassword) => {
    return supabase.auth.updateUser({ password: newPassword });
  };

  const value = {
    user,
    session,
    loading,
    signup,
    loginWithPassword,
    loginWithOtp,
    loginWithPhone,
    verifyOtp,
    logout,
    resetPassword,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : <div className="flex items-center justify-center min-h-screen"><div className="w-12 h-12 border-4 border-earth-500 border-t-transparent rounded-full animate-spin"></div></div>}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
