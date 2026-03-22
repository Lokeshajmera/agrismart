import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function VerifyOtp() {
  const { t } = useTranslation();

 const [otp, setOtp] = useState(['', '', '', '', '', '']);
 const [timer, setTimer] = useState(30);
 const [loading, setLoading] = useState(false);
 const { verifyOtp, loginWithOtp, loginWithPhone } = useAuth();
 const location = useLocation();
 const navigate = useNavigate();
 const inputRefs = useRef([]);
 const email = location.state?.email;
 const phone = location.state?.phone;
 const type = location.state?.type; // 'email' or 'sms'

 useEffect(() => {
 if (!email && !phone) {
 navigate('/login');
 }
 }, [email, phone, navigate]);

 useEffect(() => {
 if (timer > 0) {
 const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
 return () => clearInterval(interval);
 }
 }, [timer]);

 const handleChange = (index, value) => {

 if (isNaN(value)) return;
 const newOtp = [...otp];
 newOtp[index] = value;
 setOtp(newOtp);

 // Auto-focus next input
 if (value !== '' && index < 5) {
 inputRefs.current[index + 1].focus();
 }
 };

 const handleKeyDown = (index, e) => {
 if (e.key === 'Backspace' && !otp[index] && index > 0) {
 inputRefs.current[index - 1].focus();
 }
 };

 const handleVerify = async (e) => {
 e.preventDefault();
 const token = otp.join('');
 if (token.length !== 6) {
 toast.error('Please enter a 6-digit OTP');
 return;
 }
 setLoading(true);
 try {
 const { error } = await verifyOtp(type === 'email' ? email : phone, token, type);
 if (error) throw error;
 toast.success('Successfully logged in!');
 navigate('/app/dashboard');
 } catch (error) {
 toast.error(error.message || 'Verification failed');
 } finally {
 setLoading(false);
 }
 };

 const handleResend = async () => {
 setLoading(true);
 try {
 let error;
 if (type === 'email') {
 const res = await loginWithOtp(email);
 error = res.error;
 } else {
 const res = await loginWithPhone(phone);
 error = res.error;
 }
 if (error) throw error;
 toast.success('OTP resent successfully');
 setTimer(30);
 setOtp(['', '', '', '', '', '']);
 inputRefs.current[0].focus();
 } catch (error) {
 toast.error(error.message || 'Failed to resend OTP');
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="min-h-screen bg-nature-50 dark:bg-nature-900 flex flex-col justify-center sm:px-6 lg:px-8">
 <div className="sm:mx-auto sm:w-full sm:max-w-md">
 <div className="flex justify-center mb-6">
 <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-nature-900 dark:text-white">
 <Sprout className="w-8 h-8 text-earth-500" />
 <span>{t("Agri")}<span className="text-earth-500">{t("Smart")}</span></span>
 </Link>
 </div>
 <h2 className="text-center text-3xl font-extrabold text-nature-900 dark:text-white">
 Verify your {type === 'email' ? 'Email' : 'Mobile Number'}
 </h2>
 <p className="mt-2 text-center text-sm text-nature-600 dark:text-white">
 {t("We sent a code to")} <span className="font-medium text-nature-900 dark:text-white">{type === 'email' ? email : phone}</span>
 </p>
 </div>

 <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
 <div className="bg-white dark:bg-nature-950 py-8 px-4 shadow-sm border border-nature-200 dark:border-nature-800 sm:rounded-xl sm:px-10">
 <form className="space-y-6" onSubmit={handleVerify}>
 <div className="flex justify-between gap-2">
 {otp.map((digit, index) => (
 <input
 key={index}
 ref={(el) => (inputRefs.current[index] = el)}
 type="text"
 maxLength={1}
 value={digit}
 onChange={(e) => handleChange(index, e.target.value)}
 onKeyDown={(e) => handleKeyDown(index, e)}
 className="w-12 h-12 text-center text-xl font-semibold border border-nature-300 rounded-md focus:outline-none focus:ring-2 focus:ring-earth-500 focus:border-earth-500"
 />
 ))}
 </div>

 <div>
 <button
 type="submit"
 disabled={loading}
 className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-earth-600 hover:bg-earth-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-earth-500 disabled:opacity-50"
 >
 {loading ? 'Verifying...' : 'Verify OTP'}
 </button>
 </div>
 </form>

 <div className="mt-6 text-center">
 {timer > 0 ? (
 <p className="text-sm text-nature-600 dark:text-white">
 {t("Resend code in")} <span className="font-medium text-earth-600">{timer}s</span>
 </p>
 ) : (
 <button
 onClick={handleResend}
 disabled={loading}
 className="text-sm font-medium text-earth-600 hover:text-earth-500"
 >
 {t("Resend OTP")}
 </button>
 )}
 </div>
 </div>
 </div>
 </div>
 );
}
