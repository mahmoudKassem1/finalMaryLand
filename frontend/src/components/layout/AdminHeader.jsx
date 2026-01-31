import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, PackagePlus, ShoppingBag, LogOut, Menu, X, Globe } from 'lucide-react';

// 🔴 REMOVE: import { useAuth } from '../../context/AuthContext';
// ✅ ADD: Import AdminContext
import { useAdmin } from '../../context/AdminContext'; 
import { useApp } from '../../context/AppContext';

const AdminHeader = () => {
  // ✅ USE ADMIN CONTEXT (Separate from Client)
  const { logout } = useAdmin(); 
  
  const { lang, setLang } = useApp(); 
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout(); // This now clears ONLY 'adminToken'
    navigate('/management/login');
  };

  // ... (Rest of the component remains exactly the same)
  // ...
  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'ar' : 'en');
  };

  const navLinks = [
    { label: lang === 'ar' ? 'لوحة التحكم' : 'Dashboard', path: '/management-panel', icon: LayoutDashboard },
    { label: lang === 'ar' ? 'الطلبات' : 'Orders', path: '/management-panel/orders', icon: ShoppingBag },
    { label: lang === 'ar' ? 'إضافة منتج' : 'Add Product', path: '/management-panel/add-product', icon: PackagePlus },
  ];

  return (
    <header className="bg-[#0F172A] text-white sticky top-0 z-50 shadow-2xl border-b border-white/5">
      <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        
        {/* 1. BRANDING */}
        <div className="flex flex-col leading-none shrink-0 cursor-pointer" onClick={() => navigate('/management-panel')}>
          <span className="text-white font-black text-sm sm:text-lg uppercase tracking-tighter">
            Maryland
          </span>
          <span className="text-[#DC2626] font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] mt-0.5">
            Management
          </span>
        </div>

        {/* 2. DESKTOP NAVIGATION */}
        <nav className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link 
                key={link.path}
                to={link.path} 
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  isActive 
                    ? 'bg-[#DC2626] text-white shadow-lg' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <link.icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* 3. CONTROLS */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
          >
            <Globe size={18} className="text-[#DC2626] group-hover:rotate-12 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
              {lang === 'en' ? 'AR' : 'EN'}
            </span>
          </button>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 hover:border-red-600 font-bold text-xs sm:text-sm rounded-xl transition-all"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">{lang === 'ar' ? 'خروج' : 'Logout'}</span>
          </button>

          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 bg-white/5 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu (Same as before) */}
      <div className={`md:hidden absolute top-full left-0 right-0 bg-[#0F172A] border-b border-white/10 overflow-hidden transition-all duration-300 ease-in-out shadow-2xl ${
        isMobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
      }`}>
        <div className="p-4 space-y-2">
          {navLinks.map((link) => (
             <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${
                  location.pathname === link.path ? 'bg-[#DC2626] text-white shadow-lg' : 'bg-white/5 text-slate-300'
                }`}
              >
                <link.icon size={20} />
                <span className="font-bold text-base">{link.label}</span>
              </Link>
          ))}
          <div className="pt-4 mt-2 border-t border-white/5">
            <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all">
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;