import React, { useState } from 'react';
import GlassCard from '../../components/ui/GlassCard';
import SquircleButton from '../../components/ui/SquircleButton';
import { useApp } from '../../context/AppContext';
import toast from 'react-hot-toast';
import api from '../../utils/axios'; // Import backend bridge

const ForgetPassword = () => {
  const { lang } = useApp();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false); // Add loading state

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Send Request to Backend
      await api.post('/auth/forget-password', { email });

      // 2. Success Feedback
      toast.success(
        lang === 'ar' 
          ? 'تم إرسال رابط الاستعادة إلى بريدك الإلكتروني' 
          : 'Reset link sent to your email address'
      );
      
      // Optional: Clear input
      setEmail('');

    } catch (error) {
      // 3. Error Feedback
      const errorMsg = error.response?.data?.message || 'Error sending email';
      toast.error(
        lang === 'ar' 
          ? 'فشل الإرسال. تأكد من صحة البريد الإلكتروني.' 
          : errorMsg
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      <GlassCard className="p-10 text-center shadow-2xl">
        <h2 className="text-3xl font-black mb-4 text-[#0F172A]">
          {lang === 'ar' ? 'نسيت كلمة السر؟' : 'Forgot Password?'}
        </h2>
        <p className="text-slate-500 text-sm mb-8 font-medium">
          {lang === 'ar' 
            ? 'أدخل بريدك الإلكتروني لاستعادة حسابك' 
            : 'Enter your email to recover your account'}
        </p>
        
        <form onSubmit={handleReset} className="space-y-6">
          <input 
            type="email" 
            placeholder={lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
            className="w-full p-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-[#DC2626] transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading} // Disable input while sending
          />
          <SquircleButton 
            variant="primary" 
            fullWidth 
            disabled={loading} // Disable button while sending
          >
            {loading 
              ? (lang === 'ar' ? 'جاري الإرسال...' : 'Sending...') 
              : (lang === 'ar' ? 'إرسال الرابط' : 'Send Reset Link')
            }
          </SquircleButton>
        </form>
      </GlassCard>
    </div>
  );
};

export default ForgetPassword;