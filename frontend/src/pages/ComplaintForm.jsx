import React, { useState, useEffect, useRef } from 'react';

import { MessageSquare, Send, AlertCircle, Clock, CheckCircle, Trash2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import API_URL from '../config';



const API_BASE_URL = `${API_URL}/api`;


const ComplaintForm = () => {
 const { t } = useTranslation();
 const [message, setMessage] = useState('');
 const [category, setCategory] = useState('technical');
 const [loading, setLoading] = useState(false);
 const [complaints, setComplaints] = useState([]);
 const prevComplaintsRef = useRef([]);

 useEffect(() => {
 fetchComplaints();
 // Polling every 5 seconds for real-time sync
 const interval = setInterval(() => {
 fetchComplaints(true);
 }, 5000);

 return () => clearInterval(interval);
 }, []);

 const fetchComplaints = async (isSilent = false) => {
 try {
 const { data: { session } } = await supabase.auth.getSession();
 if (!session) return;
 const { data, error } = await supabase
 .from('complaints')
 .select('*')
 .eq('user_id', session.user.id)
 .order('created_at', { ascending: false });
 if (error) throw error;
 if (data) {
 // Detect state changes from pending -> resolved to trigger notification
 if (isSilent && prevComplaintsRef.current.length > 0) {
 data.forEach(newC => {
 const oldC = prevComplaintsRef.current.find(c => c.id === newC.id);
 if (oldC && oldC.status === 'pending' && newC.status === 'resolved') {
 toast.success(`✅ Your complaint CMP${newC.id.toString().padStart(3, '0')} has been resolved`, { duration: 5000 });
 }
 });
 }
 prevComplaintsRef.current = data;
 setComplaints(data);
 }
 } catch (err) {
 console.error('Failed to fetch complaints:', err);
 }
 };

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
 fetchComplaints();
 } catch (error) {
 toast.error(error.message || 'Error submitting complaint');
 } finally {
 setLoading(false);
 }
 };

 const handleDelete = async (id) => {
 try {
 const { error } = await supabase.from('complaints').delete().eq('id', id);
 if (error) throw error;
 toast.success('Complaint removed from history');
 fetchComplaints();
 } catch (err) {
 toast.error('Failed to remove complaint');
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
  <p className="text-nature-600 dark:text-white">{t("Submit your issues or request urgent help")}</p>
 </div>
 </div>

 <form onSubmit={handleSubmit} className="space-y-6">
 <div>
  <label className="block text-sm font-medium text-nature-700 dark:text-white mb-1">{t("Category")}</label>
 <select value={category}
 onChange={(e) => setCategory(e.target.value)}
 className="w-full px-4 py-2 border border-nature-300 rounded-lg focus:ring-earth-500 focus:border-earth-500"
 >
  <option value="technical">{t("Technical Issue")}</option>
  <option value="irrigation">{t("Irrigation Problem")}</option>
  <option value="sensor">{t("Sensor Malfunction")}</option>
  <option value="other">{t("Other")}</option>
 </select>
 </div>

 <div>
  <label className="block text-sm font-medium text-nature-700 dark:text-white mb-1">{t("Message")}</label>
 <textarea required
 rows={5}
 value={message}
 onChange={(e) => setMessage(e.target.value)}
  placeholder={t("Describe your issue in detail...")}
 className="w-full px-4 py-2 border border-nature-300 rounded-lg focus:ring-earth-500 focus:border-earth-500"
 />
 </div>

 <button type="submit"
 disabled={loading}
 className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-earth-600 text-white rounded-lg font-medium hover:bg-earth-700 transition-colors disabled:opacity-50"
 >
  {loading ? t('Submitting...') : (
 <>
 <Send className="w-4 h-4" />
 {t('submit')}
 </>
 )}
 </button>
 </form>
 </div>

 {/* My Complaints Section */}
 <div className="mt-8 mb-12">
  <h2 className="text-xl font-bold text-nature-900 dark:text-white mb-4">{t("My Complaints")}</h2>
 {complaints.length === 0 ? (
 <div className="bg-nature-50 dark:bg-nature-900/50 rounded-xl p-8 text-center border border-nature-200 dark:border-nature-800">
 <MessageSquare className="w-12 h-12 text-nature-300 dark:text-white mx-auto mb-3" />
  <p className="text-nature-600 dark:text-white ">{t("You haven't submitted any complaints yet.")}</p>
 </div>
 ) : (
 <div className="space-y-4">
 {complaints.map((c) => (
 <div key={c.id} className="bg-white dark:bg-nature-950 p-5 rounded-xl border border-nature-200 dark:border-nature-800 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-start animate-in fade-in zoom-in-95 duration-300">
 <div className="flex-1">
 <div className="flex items-center gap-3 mb-2">
 <span className="font-mono bg-earth-100 text-earth-700 dark:bg-earth-900/30 dark:text-earth-400 px-2 py-0.5 rounded text-xs font-bold tracking-wider">
 CMP{c.id.toString().padStart(3, '0')}
 </span>
  <h3 className="font-bold text-nature-900 dark:text-white capitalize text-lg">{c.category} {t("Issue")}</h3>
 </div>
 <p className="text-nature-600 dark:text-white text-sm mb-3 max-w-2xl leading-relaxed">{c.message}</p>
 <p className="text-xs text-nature-400 dark:text-white font-medium">{new Date(c.created_at).toLocaleString()}</p>
 </div>
 <div className="shrink-0 flex flex-col sm:flex-row items-end sm:items-center gap-2">
 <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${c.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:border-green-800/50 dark:text-green-400' : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50 dark:text-amber-400'}`}>
 {c.status === 'resolved' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
  {c.status === 'resolved' ? t('Resolved') : t('Pending')}
 </div>
 {c.status === 'resolved' && (
 <button onClick={() => handleDelete(c.id)}
 className="p-1.5 text-nature-400 dark:text-white hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
 title="Delete complaint"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 </div>
 );
};

export default ComplaintForm;
