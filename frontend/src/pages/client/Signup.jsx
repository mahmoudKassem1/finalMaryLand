import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Globe, UserPlus } from 'lucide-react';
import { toast } from 'react-hot-toast'; // <--- 1. Import Toast
import GlassCard from '../../components/ui/GlassCard';
import SquircleButton from '../../components/ui/SquircleButton';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

const Signup = () => {
  const { lang, setLang } = useApp();
  const { register, verifyRegistration } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false); // Local loading state
  const [verificationPending, setVerificationPending] = useState(false);
  const [otp, setOtp] = useState('');
  const [phoneConfirmed, setPhoneConfirmed] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', gender: 'Male', password: '',
    address: '', city: 'Alexandria', building: ''
  });

  const handleSubmit = async (e) => { // <--- 2. Make Async
    e.preventDefault();
    if (verificationPending) {
      setLoading(true);
      const result = await verifyRegistration(formData.email, otp);
      if (result.success) { toast.success(lang === 'en' ? 'Email verified. Account created.' : 'تم تأكيد البريد وإنشاء الحساب.'); navigate('/'); }
      else toast.error(result.error);
      setLoading(false);
      return;
    }
    if (!phoneConfirmed) { toast.error(lang === 'en' ? 'Please confirm this is your real phone number.' : 'يرجى تأكيد أن رقم الهاتف حقيقي ويمكن الوصول إليك من خلاله.'); return; }
    setLoading(true);

    // 3. Map Frontend Fields to Backend Schema
    // Backend expects: street, aptNumber
    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      gender: formData.gender.toLowerCase(), // Ensure lowercase for enum
      street: formData.address, // Map address -> street
      aptNumber: formData.building, // Map building -> aptNumber
      phoneConfirmed: true,
    };

    // 4. Call Register Function
    const result = await register(payload);

    if (result.success) {
      setVerificationPending(true);
      toast.success(lang === 'en' ? 'We emailed you a 6-digit verification code.' : 'أرسلنا رمز تحقق من ٦ أرقام إلى بريدك الإلكتروني.');
    } else {
      // ❌ Error Toast
      toast.error(result.error || (lang === 'en' ? 'Registration Failed' : 'فشل إنشاء الحساب'));
    }

    setLoading(false);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div 
      className="max-w-lg mx-auto mb-12 px-4 sm:px-6 flex flex-col items-center" 
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* 1. LANGUAGE TOGGLE */}
      <button 
        onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
        className="mt-4 sm:mt-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-[#DC2626] transition-colors py-2"
      >
        <Globe size={14} />
        {lang === 'en' ? 'العربية' : 'English'}
      </button>

      {/* 2. RESPONSIVE BACK BUTTON */}
      <button 
        onClick={handleBack}
        className="w-full mb-4 sm:mb-6 flex items-center gap-2 text-[#0F172A] font-bold hover:text-[#DC2626] transition-all group py-2"
      >
        {lang === 'en' ? (
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        ) : (
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        )}
        <span className="text-sm sm:text-base">{lang === 'en' ? 'Back' : 'العودة'}</span>
      </button>

      {/* 3. RESPONSIVE CARD */}
      <GlassCard className="p-6 sm:p-10 w-full shadow-2xl">
        <div className="text-center mb-6 sm:mb-8">
           <div className="bg-[#DC2626] w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-3 sm:mb-4">
             <span className="text-white font-black text-xl sm:text-2xl">M</span>
           </div>
           <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] uppercase tracking-tighter">
             {lang === 'en' ? 'Create Account' : 'إنشاء حساب جديد'}
           </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {verificationPending ? <div className="md:col-span-2 space-y-4 text-center"><p className="text-slate-600">{lang === 'en' ? `Enter the code sent to ${formData.email}. It expires in 10 minutes.` : `أدخل الرمز المرسل إلى ${formData.email}. تنتهي صلاحيته خلال ١٠ دقائق.`}</p><label className="block text-sm font-bold">{lang === 'en' ? 'Email verification code' : 'رمز تأكيد البريد الإلكتروني'}</label><input autoComplete="one-time-code" inputMode="numeric" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full p-4 text-center text-2xl tracking-[0.5em] rounded-xl bg-slate-50 focus:ring-2 focus:ring-[#DC2626]" required /></div> : <>
          
          <div className="md:col-span-2">
            <label className="block text-xs sm:text-sm font-bold mb-1.5 sm:mb-2 text-slate-700">{lang === 'en' ? 'Full Name' : 'الاسم بالكامل'}</label>
            <input 
              type="text" 
              placeholder="Enter your full name"
              className="w-full p-3.5 sm:p-4 text-sm sm:text-base rounded-xl sm:rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-[#DC2626] outline-none transition-all" 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
              required 
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs sm:text-sm font-bold mb-1.5 sm:mb-2 text-slate-700">{lang === 'en' ? 'Email' : 'البريد الإلكتروني'}</label>
            <input 
              type="email" 
              placeholder="name@example.com"
              className="w-full p-3.5 sm:p-4 text-sm sm:text-base rounded-xl sm:rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-[#DC2626] outline-none transition-all" 
              onChange={(e) => setFormData({...formData, email: e.target.value})} 
              required 
            />
          </div>

          <label className="md:col-span-2 flex items-start gap-3 text-sm text-slate-700"><input type="checkbox" checked={phoneConfirmed} onChange={e => setPhoneConfirmed(e.target.checked)} className="mt-1 accent-[#DC2626]" required /><span>{lang === 'en' ? 'I confirm this is my real phone number and that I can be reached on it for delivery and order updates.' : 'أؤكد أن هذا رقم هاتفي الحقيقي ويمكن التواصل معي من خلاله بخصوص التوصيل وتحديثات الطلب.'}</span></label>

          <div className="md:col-span-1">
            <label className="block text-xs sm:text-sm font-bold mb-1.5 sm:mb-2 text-slate-700">{lang === 'en' ? 'Phone' : 'رقم الهاتف'}</label>
            <input 
              type="tel" 
              placeholder="012..."
              className="w-full p-3.5 sm:p-4 text-sm sm:text-base rounded-xl sm:rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-[#DC2626] outline-none transition-all" 
              onChange={(e) => setFormData({...formData, phone: e.target.value})} 
              required 
            />
          </div>

          <div className="md:col-span-2 mt-2 pt-4 border-t border-slate-100">
            <h3 className="text-[#DC2626] font-black text-[10px] sm:text-xs uppercase tracking-widest mb-3 sm:mb-4">
              {lang === 'en' ? 'Delivery Info' : 'معلومات التوصيل'}
            </h3>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs sm:text-sm font-bold mb-1.5 sm:mb-2 text-slate-700">{lang === 'en' ? 'Street Address' : 'اسم الشارع'}</label>
            <input 
              type="text" 
              placeholder={lang === 'en' ? 'e.g. Gamal Abd El-Nasir St.' : 'مثال: شارع جمال عبد الناصر'}
              className="w-full p-3.5 sm:p-4 text-sm sm:text-base rounded-xl sm:rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-[#DC2626] outline-none transition-all" 
              onChange={(e) => setFormData({...formData, address: e.target.value})} 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4 md:col-span-2">
            <div>
              <label className="block text-xs sm:text-sm font-bold mb-1.5 sm:mb-2 text-slate-700">{lang === 'en' ? 'City' : 'المدينة'}</label>
              <select 
                className="w-full p-3.5 sm:p-4 text-sm sm:text-base rounded-xl sm:rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-[#DC2626] outline-none appearance-none cursor-pointer" 
                onChange={(e) => setFormData({...formData, city: e.target.value})}
              >
                <option value="Alexandria">Alexandria</option>
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-bold mb-1.5 sm:mb-2 text-slate-700">{lang === 'en' ? 'Building' : 'المبنى'}</label>
              <input 
                type="text" 
                placeholder="No. 4"
                className="w-full p-3.5 sm:p-4 text-sm sm:text-base rounded-xl sm:rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-[#DC2626] outline-none transition-all" 
                onChange={(e) => setFormData({...formData, building: e.target.value})} 
                required 
              />
            </div>
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs sm:text-sm font-bold mb-1.5 sm:mb-2 text-slate-700">{lang === 'en' ? 'Gender' : 'النوع'}</label>
            <select 
              className="w-full p-3.5 sm:p-4 text-sm sm:text-base rounded-xl sm:rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-[#DC2626] outline-none cursor-pointer" 
              onChange={(e) => setFormData({...formData, gender: e.target.value})}
            >
              <option value="Male">{lang === 'en' ? 'Male' : 'ذكر'}</option>
              <option value="Female">{lang === 'en' ? 'Female' : 'أنثى'}</option>
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="block text-xs sm:text-sm font-bold mb-1.5 sm:mb-2 text-slate-700">{lang === 'en' ? 'Password' : 'كلمة المرور'}</label>
            <input 
              type="password" 
              placeholder="••••••••"
              className="w-full p-3.5 sm:p-4 text-sm sm:text-base rounded-xl sm:rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-[#DC2626] outline-none transition-all" 
              onChange={(e) => setFormData({...formData, password: e.target.value})} 
              required 
            />
          </div>

          </>}
          <div className="md:col-span-2 mt-4">
            <SquircleButton 
                variant="primary" 
                fullWidth 
                icon={UserPlus} 
                className="py-3.5 sm:py-4"
                disabled={loading} // Disable while loading
            >
              {loading 
                ? (lang === 'en' ? 'Creating Account...' : 'جاري الإنشاء...')
                : verificationPending ? (lang === 'en' ? 'Verify email' : 'تأكيد البريد') : (lang === 'en' ? 'Send verification code' : 'إرسال رمز التحقق')
              }
            </SquircleButton>
          </div>
        </form>

        <p className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-slate-500 font-bold">
          {lang === 'en' ? 'Already have an account?' : 'لديك حساب بالفعل؟'}{' '}
          <Link to="/login" className="text-[#DC2626] hover:underline underline-offset-4 ml-1">
            {lang === 'en' ? 'Login here' : 'سجل دخولك هنا'}
          </Link>
        </p>
      </GlassCard>
    </div>
  );
};

export default Signup;
