import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, User, Globe, LayoutDashboard, Menu, X, Home as HomeIcon,
  Sparkles, HeartPulse, Baby, Stethoscope, Pill, Apple, ChevronDown, LogOut, LogIn,
  MessageCircle, Search, Package, Star, UserCog 
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import Logo from '../ui/Logo';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const Header = () => {
  const { lang, setLang, t } = useApp();
  const { user, logout } = useAuth(); 
  const { cartItems } = useCart();
  
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  const userDropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const translations = t || {};

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        const currentScrollY = window.scrollY;
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setShowHeader(false); 
          setIsUserDropdownOpen(false);
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
    setIsUserDropdownOpen(false);
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${searchQuery}`);
      setIsSideMenuOpen(false);
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

  return (
    <>
      <header 
        className={`fixed top-0 w-full z-50 px-2 sm:px-4 pt-4 transition-transform duration-500 ease-in-out pointer-events-none ${
          showHeader ? 'translate-y-0' : '-translate-y-full'
        }`} 
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="container mx-auto pointer-events-auto">
          {/* Main Wrapper: flex-nowrap prevents vertical stacking, items-stretch ensures vertical alignment */}
          <div className="bg-white/90 backdrop-blur-xl border border-white/40 rounded-2xl sm:rounded-3xl px-2 sm:px-6 py-2 sm:py-3 flex items-center justify-between shadow-xl gap-1 sm:gap-4">
            
            {/* LEFT: MENU & LOGO - Shrink-0 keeps the logo size stable */}
            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
              <button 
                onClick={() => setIsSideMenuOpen(true)} 
                className="p-1.5 sm:p-2.5 hover:bg-slate-100 rounded-xl transition-colors group"
              >
                <Menu size={24} className="text-[#0F172A] group-hover:text-[#DC2626]" />
              </button>

              <div className="flex items-center gap-1.5 cursor-pointer group" onClick={() => navigate('/')}>
                <div className="relative transition-transform duration-300 group-hover:scale-105 shrink-0">
                   <Logo size="h-10 sm:h-14" showText={false} />
                </div>
                <div className="hidden lg:flex flex-col leading-none">
                  <span className="text-[#0F172A] font-black text-sm md:text-lg uppercase tracking-tighter">Maryland</span>
                  <span className="text-[#DC2626] font-black text-[10px] uppercase tracking-[0.2em]">Pharmacy</span>
                </div>
              </div>
            </div>

                        {/* CENTER: SEARCH */}
            <form onSubmit={handleSearch} className="flex-grow max-w-xl mx-2 sm:mx-6 group relative">
              <div className="relative w-full">
                <input 
                  type="text" 
                  placeholder={lang === 'en' ? "Search..." : "ابحث..."}
                  // ✅ Added dynamic padding: pr-9/10 for Arabic, pl-9/10 for English
                  className={`w-full bg-slate-100/50 border border-slate-200/50 rounded-xl py-2 sm:py-2.5 
                    ${lang === 'ar' ? 'pr-9 sm:pr-10 pl-4' : 'pl-9 sm:pl-10 pr-4'} 
                    text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:border-transparent transition-all outline-none`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {/* ✅ Icon positioning: right-3 for Arabic, left-3 for English */}
                <Search 
                  size={16} 
                  className={`absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#DC2626] 
                    ${lang === 'ar' ? 'right-3' : 'left-3'}`} 
                />
              </div>
            </form>

            {/* RIGHT: ACTIONS - Shrink-0 keeps buttons from collapsing */}
            <div className="flex items-center gap-0.5 sm:gap-2 shrink-0 relative" ref={userDropdownRef}>
              
              <button 
                onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                className="hidden md:flex p-2.5 rounded-xl hover:bg-slate-100 text-[#0F172A] transition-colors"
              >
                <Globe size={20} />
              </button>

              <Link to="/cart" className="p-2 sm:p-2.5 rounded-xl hover:bg-red-50 text-[#0F172A] transition-colors relative">
                <ShoppingCart size={22} className="sm:w-[24px] sm:h-[24px]" />
                {cartItems?.length > 0 && (
                  <span className="absolute top-1 right-1 bg-[#DC2626] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {cartItems.length}
                  </span>
                )}
              </Link>

              <button 
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className={`p-2 sm:p-2.5 rounded-xl transition-all ${isUserDropdownOpen ? 'bg-[#DC2626] text-white' : 'hover:bg-slate-100 text-[#0F172A]'}`}
              >
                <User size={22} className="sm:w-[24px] sm:h-[24px]" />
              </button>

              {/* USER DROPDOWN MENU */}
              {isUserDropdownOpen && (
                <div className={`absolute top-full mt-4 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200 ${lang === 'ar' ? 'left-0' : 'right-0'}`}>
                  <div className="p-4 bg-slate-50 border-b border-slate-100">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{translations.welcome || 'Welcome'}</p>
                    <p className="text-sm font-bold text-[#0F172A] truncate">{user?.name || translations.guest || 'Guest User'}</p>
                  </div>
                  
                  <div className="p-2 flex flex-col gap-1">
                    {user ? (
                      <>
                        <Link to="/profile" onClick={() => setIsUserDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-sm font-bold text-slate-700">
                          <UserCog size={18} className="text-[#DC2626]" /> {lang === 'en' ? 'My Profile' : 'الملف الشخصي'}
                        </Link>
                        <Link to="/my-orders" onClick={() => setIsUserDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-sm font-bold text-slate-700">
                          <Package size={18} className="text-[#DC2626]" /> {lang === 'en' ? 'My Orders' : 'طلباتي'}
                        </Link>
                        {user.role === 'admin' && (
                          <Link to="/management-panel" onClick={() => setIsUserDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0F172A] text-white text-sm font-bold">
                            <LayoutDashboard size={18} className="text-[#DC2626]" /> Management
                          </Link>
                        )}
                        <hr className="my-1 border-slate-100" />
                      </>
                    ) : (
                      <Link to="/login" onClick={() => setIsUserDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-sm font-bold text-[#DC2626]">
                        <LogIn size={18} /> {translations.login || 'Sign In'}
                      </Link>
                    )}

                    <Link to="/contact" onClick={() => setIsUserDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-sm font-bold text-slate-700">
                      <MessageCircle size={18} className="text-[#DC2626]" /> {lang === 'en' ? 'Contact Us' : 'تواصل معنا'}
                    </Link>

                    <button onClick={() => { setLang(lang === 'en' ? 'ar' : 'en'); setIsUserDropdownOpen(false); }} className="md:hidden flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-sm font-bold text-slate-700">
                      <Globe size={18} className="text-[#DC2626]" /> {lang === 'en' ? 'العربية' : 'English'}
                    </button>

                    {user && (
                      <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-sm font-bold text-[#DC2626] text-left">
                        <LogOut size={18} /> {translations.logout || 'Logout'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* CATEGORY SIDE DRAWER */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isSideMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSideMenuOpen(false)}
      />
      <aside 
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
        className={`fixed top-0 bottom-0 w-[280px] sm:w-[320px] bg-white z-[110] shadow-2xl transition-transform duration-500 flex flex-col
        ${lang === 'ar' ? 'right-0' : 'left-0'} 
        ${isSideMenuOpen ? 'translate-x-0' : (lang === 'ar' ? 'translate-x-full' : '-translate-x-full')}`}
      >
        <div className="p-6 flex justify-between items-center border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col">
            <span className="font-black text-[#0F172A] text-xl uppercase leading-none">Categories</span>
            <span className="text-[10px] text-[#DC2626] font-bold tracking-[0.2em] mt-1 uppercase">Shop by Department</span>
          </div>
          <button onClick={() => setIsSideMenuOpen(false)} className="p-2 hover:bg-red-50 rounded-full text-[#DC2626] transition-colors"><X size={24} /></button>
        </div>
        
        <nav className="p-4 flex flex-col gap-1 overflow-y-auto">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={cat.path}
              onClick={() => setIsSideMenuOpen(false)}
              className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all font-bold ${
                location.pathname === cat.path 
                ? 'bg-[#DC2626] text-white shadow-lg shadow-red-200' 
                : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <cat.icon size={22} className={location.pathname === cat.path ? 'text-white' : 'text-[#DC2626]'} />
              <span className={lang === 'ar' ? 'font-arabic text-lg' : 'text-sm'}>{cat.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto p-6 bg-slate-50 border-t border-slate-100">
           <div className="flex items-center gap-3 text-[#0F172A]">
              <div className="bg-white p-2 rounded-xl shadow-sm"><Logo size="h-6" showText={false} /></div>
              <p className="text-xs font-black uppercase tracking-widest">Maryland Pharmacy</p>
           </div>
        </div>
      </aside>
    </>
  );
};

export default Header;