import React, { useState } from 'react';
import { MessageSquare, Send, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';

const API_URL = `http://${window.location.hostname}:5000/api`;

const ComplaintForm = () => {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('technical');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.from('complaints').insert([{
        user_id: session.user.id,
        message,
        category,
        status: 'pending'
      }]);
      
      if (error) throw error;
      toast.success('Complaint submitted successfully');
      setMessage('');
    } catch (error) {
      toast.error(error.message || 'Error submitting complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white dark:bg-nature-950 rounded-xl shadow-sm border border-nature-200 dark:border-nature-800 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-100 rounded-lg">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-nature-900 dark:text-white">{t('complaints')}</h1>
            <p className="text-nature-600">Submit your issues or request urgent help</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-nature-700 dark:text-nature-200 mb-1">Category</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-nature-300 rounded-lg focus:ring-earth-500 focus:border-earth-500"
            >
              <option value="technical">Technical Issue</option>
              <option value="irrigation">Irrigation Problem</option>
              <option value="sensor">Sensor Malfunction</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-nature-700 dark:text-nature-200 mb-1">Message</label>
            <textarea 
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue in detail..."
              className="w-full px-4 py-2 border border-nature-300 rounded-lg focus:ring-earth-500 focus:border-earth-500"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-earth-600 text-white rounded-lg font-medium hover:bg-earth-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting...' : (
              <>
                <Send className="w-4 h-4" />
                {t('submit')}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ComplaintForm;
