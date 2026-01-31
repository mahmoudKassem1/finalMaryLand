import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast'; // <--- 1. Import Toast
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext'; 
import GlassCard from '../../components/ui/GlassCard';
import SquircleButton from '../../components/ui/SquircleButton';
import { Globe, ArrowLeft, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // Local loading state

  const { login } = useAuth();
  const { lang, setLang } = useApp(); 
  
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => { // <--- 2. Make Async
    e.preventDefault();
    setLoading(true);

    // 3. Wait for Backend Response
    const result = await login(email, password);
    
    if (result.success) {
      // ✅ Success Toast
      toast.success(lang === 'en' ? 'Welcome back!' : 'مرحباً بعودتك!');
      navigate(from, { replace: true });
    } else {
      // ❌ Error Toast (Shows the actual message from Backend)
      toast.error(result.error || (lang === 'en' ? 'Login Failed' : 'فشل تسجيل الدخول'));
    }

    setLoading(false);
  };

  // Logic to handle "Go Back"
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div 
      className="flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 mt-4 sm:mt-8"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-[440px]">
        
        {/* 1. RESPONSIVE BACK BUTTON & LANG TOGGLE ROW */}
        <div className="flex justify-between items-center mb-4 px-2">
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-[#0F172A] font-bold hover:text-[#DC2626] transition-all group py-2"
          >
            {lang === 'en' ? (
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            ) : (
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            )}
            <span className="text-sm font-black uppercase tracking-widest">
              {lang === 'en' ? 'Back' : 'العودة'}
            </span>
          </button>

          <button 
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-[#DC2626] transition-colors"
          >
            <Globe size={14} />
            {lang === 'en' ? 'العربية' : 'English'}
          </button>
        </div>

        {/* 2. LOGIN CARD */}
        <GlassCard className="p-6 sm:p-10 shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-black mb-6 sm:mb-8 text-center text-[#0F172A] uppercase tracking-tighter">
            {lang === 'en' ? 'Client Login' : 'تسجيل دخول العملاء'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div>
              <label className="block text-xs sm:text-sm font-bold mb-2 text-slate-700">
                {lang === 'en' ? 'Email Address' : 'البريد الإلكتروني'}
              </label>
              <input 
                type="email" 
                className="w-full p-3.5 sm:p-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-[#DC2626] transition-all text-sm sm:text-base"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={lang === 'en' ? 'Enter your email' : 'أدخل بريدك الإلكتروني'}
                required
              />
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-bold mb-2 text-slate-700">
                {lang === 'en' ? 'Password' : 'كلمة المرور'}
              </label>
              <input 
                type="password" 
                className="w-full p-3.5 sm:p-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-[#DC2626] transition-all text-sm sm:text-base"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className={lang === 'ar' ? 'text-left' : 'text-right'}>
              <Link 
                to="/forget-password" 
                className="text-xs sm:text-sm text-[#DC2626] font-bold hover:underline"
              >
                {lang === 'en' ? 'Forgot Password?' : 'نسيت كلمة المرور؟'}
              </Link>
            </div>

            <SquircleButton 
                type="submit" 
                variant="primary" 
                fullWidth 
                className="py-3.5 sm:py-4"
                disabled={loading} // Prevent double clicks
            >
              {loading 
                ? (lang === 'en' ? 'Signing In...' : 'جاري الدخول...')
                : (lang === 'en' ? 'Sign In' : 'تسجيل الدخول')
              }
            </SquircleButton>
          </form>

          <p className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-slate-500 font-medium">
            {lang === 'en' ? 'New to Maryland?' : 'جديد في ماريلاند؟'}{' '}
            <Link to="/signup" className="text-[#DC2626] font-black hover:underline ml-1">
              {lang === 'en' ? 'Register here' : 'سجل هنا'}
            </Link>
          </p>
        </GlassCard>
      </div>
    </div>
  );
};

export default Login;