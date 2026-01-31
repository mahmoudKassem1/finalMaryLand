import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, User, Globe, LayoutDashboard, Menu, X, Home as HomeIcon,
  Sparkles, HeartPulse, Baby, Stethoscope, Pill, Apple, ChevronDown, LogOut, LogIn,
  MessageCircle, Search, Package, Star, UserCog // ✅ Added UserCog Icon
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import Logo from '../ui/Logo';

// Context Imports
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const Header = () => {
  const { lang, setLang, t } = useApp();
  const { user, logout } = useAuth(); 
  const { cartItems } = useCart();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  const location = useLocation();
  const navigate = useNavigate();
  const translations = t || {};

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        const currentScrollY = window.scrollY;
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setShowHeader(false); 
          setIsCatDropdownOpen(false); 
        } else {
          setShowHeader(true); 
        }
        setLastScrollY(currentScrollY);
      }
    };
    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY]);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${searchQuery}`);
      setIsMenuOpen(false);
    }
  };

  const categories = [
    { id: 'home', label: translations.cat_home || 'Home', icon: HomeIcon, path: '/' },
    { id: 'beauty', label: translations.cat_beauty || 'BEAUTY', icon: Sparkles, path: '/category/beauty' },
    { id: 'personal', label: translations.cat_personal || 'PERSONAL CARE', icon: HeartPulse, path: '/category/personal-care' },
    { id: 'baby', label: translations.cat_baby || 'MOM AND BABY', icon: Baby, path: '/category/mom-and-baby' },
    { id: 'health', label: translations.cat_health || 'HEALTH CARE', icon: Stethoscope, path: '/category/health-care' },
    { id: 'meds', label: translations.cat_meds || 'MEDICATION', icon: Pill, path: '/category/medication' },
    { id: 'vitamins', label: translations.cat_vitamins || 'VITAMINS', icon: Apple, path: '/category/vitamins' },
    { 
      id: 'maryland-products', 
      label: lang === 'en' ? 'MARYLAND PRODUCTS' : 'منتجات ماريلاند', 
      icon: Star, 
      path: '/category/maryland-products' 
    },
  ];

  const currentCat = categories.find(c => c.path === location.pathname) || categories[0];

  return (
    <>
      <header 
        className={`fixed top-0 w-full z-50 px-2 sm:px-4 pt-4 transition-transform duration-500 ease-in-out pointer-events-none ${
          showHeader ? 'translate-y-0' : '-translate-y-full'
        }`} 
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="container mx-auto space-y-2 sm:space-y-3 pointer-events-auto">
          
          {/* TOP BAR */}
          <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-2xl sm:rounded-3xl px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between shadow-xl gap-2 sm:gap-4">
            
            <div className="flex items-center gap-3 sm:gap-4 group shrink-0 cursor-pointer" onClick={() => navigate('/')}>
              {/* Logo Upgrade: Bigger, Shadow, Hover Effect */}
              <div className="relative transition-transform duration-300 group-hover:scale-110 drop-shadow-md">
                 <Logo size="h-10 sm:h-12 md:h-14" showText={false} />
              </div>
              
              <div className="flex flex-col leading-none">
                <span className="text-[#0F172A] font-black text-sm sm:text-lg md:text-2xl uppercase tracking-tighter transition-colors group-hover:text-[#DC2626]">
                  Maryland
                </span>
                <span className="text-[#DC2626] font-black text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.25em] mt-0.5">
                  Pharmacy
                </span>
              </div>
            </div>

            {/* SEARCH BAR (Desktop) */}
            <form onSubmit={handleSearch} className="hidden md:block flex-1 max-w-lg mx-4 group relative">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder={lang === 'en' ? "Search for medicines..." : "ابحث عن الأدوية..."}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-2.5 pl-11 pr-4 text-sm font-medium 
                              focus:outline-none focus:ring-2 focus:ring-[#DC2626] focus:border-[#DC2626] 
                              focus:bg-white transition-all shadow-inner placeholder:text-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#DC2626] transition-colors" />
              </div>
            </form>

            {/* ICONS */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {!user && (
                <Link to="/login" className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-[#0F172A] font-bold text-xs hover:bg-[#DC2626] hover:text-white transition-all">
                  <LogIn size={16} />
                  <span>{translations.login || 'Login'}</span>
                </Link>
              )}

              <Link to="/cart" className="p-2 sm:p-2.5 rounded-xl hover:bg-red-50 hover:text-[#DC2626] transition-colors relative">
                <ShoppingCart size={24} className="text-[#0F172A]" />
                {cartItems?.length > 0 && (
                  <span className="absolute top-0 right-0 bg-[#DC2626] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm">
                    {cartItems.length}
                  </span>
                )}
              </Link>
              
              <button onClick={() => setIsMenuOpen(true)} className="p-2 sm:p-2.5 hover:bg-red-50 hover:text-[#DC2626] transition-colors rounded-xl">
                <Menu size={28} className="text-[#0F172A]" />
              </button>
            </div>
          </div>

          {/* DESKTOP NAV (Standard Centered Layout) */}
          <div className="relative hidden md:block">
            <div className="bg-[#0F172A]/95 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl">
              <nav className="flex items-center justify-center flex-nowrap gap-1 lg:gap-4 px-2 py-2.5">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={cat.path}
                    className={`flex items-center gap-2 px-2 lg:px-4 py-2 rounded-xl text-[10px] lg:text-xs font-black transition-all duration-300 whitespace-nowrap shrink-0 ${
                      location.pathname === cat.path 
                      ? 'bg-[#DC2626] text-white shadow-lg' 
                      : 'text-slate-300 hover:text-[#DC2626] hover:bg-red-500/10'
                    }`}
                  >
                    <cat.icon size={16} className="shrink-0 lg:w-[18px] lg:h-[18px]" />
                    <span className={lang === 'ar' ? 'font-arabic' : ''}>{cat.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
          
          {/* MOBILE NAV DROPDOWN (Category Selector) */}
          <div className="md:hidden relative">
            <button 
              onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
              className="w-full bg-[#0F172A]/95 backdrop-blur-lg border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between text-white shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <currentCat.icon size={20} className="text-[#DC2626]" />
                <span className={`text-xs font-black tracking-widest uppercase ${lang === 'ar' ? 'font-arabic' : ''}`}>
                  {currentCat.label}
                </span>
              </div>
              <ChevronDown size={20} className={`transition-transform duration-300 ${isCatDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={`absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transition-all duration-300 origin-top z-[60] ${
              isCatDropdownOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 pointer-events-none'
            }`}>
              <div className="p-2 grid grid-cols-1 gap-1 max-h-[60vh] overflow-y-auto">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={cat.path}
                    onClick={() => setIsCatDropdownOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                      location.pathname === cat.path 
                      ? 'bg-red-50 text-[#DC2626]' 
                      : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <cat.icon size={18} className={location.pathname === cat.path ? 'text-[#DC2626]' : 'text-slate-400'} />
                    <span className={`text-sm font-bold ${lang === 'ar' ? 'font-arabic' : ''}`}>{cat.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER (Main Menu) */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMenuOpen(false)}
      />
      <aside 
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        className={`fixed top-0 bottom-0 w-[300px] bg-white z-[110] shadow-2xl transition-transform duration-500 flex flex-col
        ${lang === 'ar' ? 'right-0' : 'left-0'} 
        ${isMenuOpen ? 'translate-x-0' : (lang === 'ar' ? 'translate-x-full' : '-translate-x-full')}`}
      >
        <div className="p-6 flex justify-between items-center border-b border-slate-100">
          <span className="font-black text-[#0F172A] tracking-tighter text-xl uppercase">{translations.menu || 'Menu'}</span>
          <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-red-50 rounded-full text-[#DC2626]"><X size={24} /></button>
        </div>
        
        <nav className="p-6 flex flex-col gap-4 overflow-y-auto h-full">
            <form onSubmit={handleSearch} className="md:hidden relative mb-2 group">
                <input 
                    type="text" 
                    placeholder={lang === 'en' ? "Search..." : "بحث..."}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-bold 
                               focus:outline-none focus:ring-[#DC2626] focus:border-[#DC2626] transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#DC2626]" />
            </form>

          <div className="flex items-center gap-4 p-4 mb-2 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="bg-[#DC2626] p-2 rounded-xl text-white">
              <User size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-black uppercase tracking-widest">{translations.welcome || 'Welcome'}</p>
              <p className="text-sm font-bold text-[#0F172A]">{user?.name || translations.guest || 'Guest User'}</p>
            </div>
          </div>

          <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-red-50 font-bold text-[#0F172A]">
            <HomeIcon size={22} className="text-[#DC2626]" /> {translations.home || 'Home'}
          </Link>
          
          {user && (
            <>
              {/* My Orders Link */}
              <Link to="/my-orders" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-red-50 font-bold text-[#0F172A]">
                  <Package size={22} className="text-[#DC2626]" /> {lang === 'en' ? 'My Orders' : 'طلباتي'}
              </Link>

              {/* ✅ NEW: My Profile Link */}
              <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-red-50 font-bold text-[#0F172A]">
                  <UserCog size={22} className="text-[#DC2626]" /> {lang === 'en' ? 'My Profile' : 'الملف الشخصي'}
              </Link>
            </>
          )}

          <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-red-50 font-bold text-[#0F172A]">
            <MessageCircle size={22} className="text-[#DC2626]" /> {lang === 'en' ? 'Contact Us' : 'تواصل معنا'}
          </Link>
          
          <button onClick={() => { setLang(lang === 'en' ? 'ar' : 'en'); setIsMenuOpen(false); }} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-red-50 font-bold text-[#0F172A]">
            <Globe size={22} className="text-[#DC2626]" /> {lang === 'en' ? 'العربية' : 'English'}
          </button>

          {user?.role === 'admin' && (
            <Link to="/management-panel" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-[#0F172A] text-white font-bold mt-4 shadow-lg">
              <LayoutDashboard size={22} className="text-[#DC2626]" /> Management
            </Link>
          )}

          <div className="mt-auto pt-6 border-t border-slate-100">
            {user ? (
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-50 text-[#DC2626] font-bold hover:bg-red-100 transition-all"
              >
                <LogOut size={22} /> {translations.logout || 'Logout'}
              </button>
            ) : (
              <Link 
                to="/login" 
                onClick={() => setIsMenuOpen(false)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-100 text-[#0F172A] font-bold hover:bg-slate-200 transition-all"
              >
                <LogIn size={22} /> {translations.login || 'Sign In'}
              </Link>
            )}
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Header;