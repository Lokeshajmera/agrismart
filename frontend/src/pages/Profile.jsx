import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { User, Phone, Mail, Hash, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91');

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setProfile(data);
        setName(data.name || '');
        setPhone(data.phone || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const generateFarmerId = async (firstName) => {
    const prefix = firstName.split(' ')[0].toUpperCase();
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .ilike('name', `${prefix}%`);
      
    if (error) throw error;
    return `${prefix}${String((count || 0) + 1).padStart(3, '0')}`;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !phone) {
      toast.error('Name and Phone are required');
      return;
    }

    setSaving(true);
    try {
      let currentFarmerId = profile?.farmer_id;
      if (!currentFarmerId) {
        currentFarmerId = await generateFarmerId(name);
      }

      const updates = {
        id: user.id,
        email: user.email,
        name,
        phone,
        farmer_id: currentFarmerId
      };

      const { error } = await supabase
        .from('users')
        .upsert(updates);

      if (error) throw error;

      toast.success('Profile saved successfully');
      fetchProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(error.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-earth-500" />
      </div>
    );
  }

  const isProfileComplete = profile && profile.name && profile.farmer_id;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-nature-950 shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-nature-50 dark:bg-nature-900 border-b border-nature-200 dark:border-nature-800 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-nature-900 dark:text-white">
              {isProfileComplete ? 'Farmer Profile' : 'Complete Your Profile'}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-nature-500">
              Personal details and system identifiers.
            </p>
          </div>
          {isProfileComplete && profile.farmer_id && (
            <div className="bg-earth-100 px-3 py-1 rounded-full text-earth-800 text-sm font-semibold flex items-center gap-1">
              <Hash className="w-4 h-4" />
              {profile.farmer_id}
            </div>
          )}
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          {!isProfileComplete && (
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Your profile is incomplete. Please provide your Name and Mobile Number to generate your unique Farmer ID and access all features.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-nature-700 dark:text-nature-200">Email (from secure login)</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-nature-300 bg-nature-50 dark:bg-nature-900 text-nature-500 sm:text-sm">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  disabled
                  value={user.email || 'N/A (Phone Login)'}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-nature-300 bg-nature-50 dark:bg-nature-900 text-gray-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-nature-700 dark:text-nature-200">Full Name</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-nature-300 bg-nature-50 dark:bg-nature-900 text-nature-500 sm:text-sm">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-nature-300 focus:ring-earth-500 focus:border-earth-500 sm:text-sm"
                  placeholder="Rahul Kumar"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-nature-700 dark:text-nature-200">Mobile Number</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-nature-300 bg-nature-50 dark:bg-nature-900 text-nature-500 sm:text-sm">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-nature-300 focus:ring-earth-500 focus:border-earth-500 sm:text-sm"
                  placeholder="+919876543210"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-earth-600 hover:bg-earth-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-earth-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : (isProfileComplete ? 'Update Details' : 'Complete Setup')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
