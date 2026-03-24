import React, { useState } from 'react';
import { Lightbulb, Send } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';

import API_URL from '../config';

const API_BASE_URL = `${API_URL}/api`;


const SuggestionForm = () => {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
 const [loading, setLoading] = useState(false);

 const handleSubmit = async (e) => {
 e.preventDefault();
 setLoading(true);
 try {
 const { data: { session } } = await supabase.auth.getSession();
 const { error } = await supabase.from('suggestions').insert([{
 user_id: session.user.id,
 message
 }]);

 if (error) throw error;
 toast.success('Suggestion submitted! Thank you for your feedback');
 setMessage('');
 } catch (error) {
 toast.error(error.message || 'Error submitting suggestion');
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="max-w-2xl mx-auto p-6">
 <div className="bg-white dark:bg-nature-950 rounded-xl shadow-sm border border-nature-200 dark:border-nature-800 p-8">
 <div className="flex items-center gap-3 mb-6">
 <div className="p-3 bg-yellow-100 rounded-lg">
 <Lightbulb className="w-6 h-6 text-yellow-600" />
 </div>
 <div>
 <h1 className="text-2xl font-bold text-nature-900 dark:text-white">{t('suggestions')}</h1>
 <p className="text-nature-600 dark:text-white">{t("Help us improve the platform with your ideas")}</p>
 </div>
 </div>

 <form onSubmit={handleSubmit} className="space-y-6">
 <div>
 <label className="block text-sm font-medium text-nature-700 dark:text-white mb-1">{t("Your Suggestion")}</label>
 <textarea required
 rows={5}
 value={message}
 onChange={(e) => setMessage(e.target.value)}
 placeholder="What could we do better?"
 className="w-full px-4 py-2 border border-nature-300 rounded-lg focus:ring-earth-500 focus:border-earth-500"
 />
 </div>

 <button type="submit"
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

export default SuggestionForm;
