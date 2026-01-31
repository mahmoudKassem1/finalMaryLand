import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { KeyRound } from 'lucide-react';

import api from '../../utils/axios';
import { useApp } from '../../context/AppContext';
import GlassCard from '../../components/ui/GlassCard';
import SquircleButton from '../../components/ui/SquircleButton';

const ResetPassword = () => {
  const { resettoken } = useParams();
  const navigate = useNavigate();
  const { lang } = useApp();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error(lang === 'en' ? 'Passwords do not match' : 'كلمات المرور غير متطابقة');
      return;
    }
    if (password.length < 6) {
      toast.error(lang === 'en' ? 'Password must be at least 6 characters' : 'يجب أن تكون كلمة المرور 6 أحرف على الأقل');
      return;
    }

    setLoading(true);
    try {
      // The backend route is PUT /api/auth/reset-password/:token
      await api.put(`/auth/reset-password/${resettoken}`, { password });
      toast.success(lang === 'en' ? 'Password reset successfully! Please log in.' : 'تم إعادة تعيين كلمة المرور بنجاح! الرجاء تسجيل الدخول.');
      navigate('/login');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Invalid or expired token';
      toast.error(lang === 'en' ? errorMsg : 'الرمز غير صالح أو انتهت صلاحيته');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      <GlassCard className="p-10 text-center shadow-2xl">
        <div className="w-16 h-16 bg-[#DC2626] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <KeyRound size={32} className="text-white" />
        </div>
        <h2 className="text-3xl font-black mb-4 text-[#0F172A]">
          {lang === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
        </h2>
        <p className="text-slate-500 text-sm mb-8 font-medium">
          {lang === 'ar' ? 'أدخل كلمة المرور الجديدة لحسابك' : 'Enter a new password for your account'}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <input 
            type="password" 
            placeholder={lang === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
            className="w-full p-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-[#DC2626] transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <input 
            type="password" 
            placeholder={lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm New Password'}
            className="w-full p-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-[#DC2626] transition-all"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
          />
          <SquircleButton 
            type="submit"
            variant="primary" 
            fullWidth 
            disabled={loading}
          >
            {loading 
              ? (lang === 'ar' ? 'جاري التحديث...' : 'Updating...') 
              : (lang === 'ar' ? 'تحديث كلمة المرور' : 'Update Password')
            }
          </SquircleButton>
        </form>
      </GlassCard>
    </div>
  );
};

export default ResetPassword;