import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, Calendar, DollarSign, Truck, Loader2, Mail, Plus, Trash2, Save, AlertTriangle, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import GlassCard from '../../components/ui/GlassCard';
import Inventory from './Inventory'; 
import api from '../../utils/axios'; 
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
  // ✅ FIX: Added "t = {}" to prevent crash if translations aren't loaded yet
  const { lang, t = {} } = useApp();
  
  // Data States
  const [stats, setStats] = useState({ 
    totalSales: 0, monthlySales: 0, yearlySales: 0, totalOrders: 0 
  });
  
  const [deliveryFee, setDeliveryFee] = useState(50);
  
  // Email States
  const [notificationEmails, setNotificationEmails] = useState([]);
  const [newEmail, setNewEmail] = useState('');

  // UI States
  const [loading, setLoading] = useState(true);
  const [updatingSettings, setUpdatingSettings] = useState(false);
  
  // ✅ NEW: Filter State for Inventory
  const [showLowStock, setShowLowStock] = useState(false);

  // 1. FETCH DATA ON LOAD
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, settingsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/settings')
        ]);

        setStats(statsRes.data);
        setDeliveryFee(settingsRes.data.deliveryFee );
        setNotificationEmails(settingsRes.data.notificationEmails || []);
      } catch (error) {
        console.error("Dashboard Error:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // 2. UNIVERSAL SETTINGS UPDATE HANDLER
  const saveSettings = async (updatedFee, updatedEmails) => {
    setUpdatingSettings(true);
    try {
      await api.put('/settings', { 
        deliveryFee: updatedFee !== undefined ? updatedFee : deliveryFee, 
        notificationEmails: updatedEmails !== undefined ? updatedEmails : notificationEmails 
      });
      toast.success(lang === 'en' ? 'Settings Updated' : 'تم تحديث الإعدادات');
      return true;
    } catch (error) {
      toast.error("Update Failed");
      console.log(error)
      return false;
    } finally {
      setUpdatingSettings(false);
    }
  };

  // HANDLER: Add Email
  const handleAddEmail = async (e) => {
    e.preventDefault();
    if (!newEmail) return;
    if (notificationEmails.length >= 3) return toast.error("Max 3 emails allowed");
    if (!/\S+@\S+\.\S+/.test(newEmail)) return toast.error("Invalid email format");
    if (notificationEmails.includes(newEmail)) return toast.error("Email already exists");

    const updatedList = [...notificationEmails, newEmail];
    setNotificationEmails(updatedList); // Optimistic UI update
    setNewEmail(''); // Clear input
    await saveSettings(deliveryFee, updatedList); // Save to DB
  };

  // HANDLER: Remove Email
  const handleRemoveEmail = async (emailToRemove) => {
    const updatedList = notificationEmails.filter(e => e !== emailToRemove);
    setNotificationEmails(updatedList); // Optimistic UI
    await saveSettings(deliveryFee, updatedList); // Save to DB
  };

  // Stats Configuration
  const statCards = [
    { label: lang === 'ar' ? 'إجمالي المبيعات' : (t.totalSales || "Total Sales"), value: `${stats.totalSales.toLocaleString()} EGP`, icon: DollarSign, color: "bg-emerald-500" },
    { label: lang === 'ar' ? 'إجمالي الطلبات' : (t.totalOrders || "Total Orders"), value: stats.totalOrders.toLocaleString(), icon: Package, color: "bg-amber-500" },
    { label: lang === 'ar' ? 'المبيعات الشهرية' : "Monthly Sales", value: `${stats.monthlySales.toLocaleString()} EGP`, icon: Calendar, color: "bg-[#DC2626]" },
    { label: lang === 'ar' ? 'المبيعات السنوية' : "Yearly Sales", value: `${stats.yearlySales.toLocaleString()} EGP`, icon: TrendingUp, color: "bg-blue-600" },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-red-500" size={40}/>
    </div>
  );

  return (
    <div className={`space-y-8 animate-fade-in pb-10 ${lang === 'ar' ? 'font-arabic' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-black uppercase tracking-tighter">
            {lang === 'ar' ? 'نظرة عامة على' : 'Panel'} <span className="text-[#DC2626]">{lang === 'ar' ? 'لوحة التحكم' : 'Overview'}</span>
          </h1>
          <p className="text-slate-400 font-bold text-xs mt-1">
            {lang === 'ar' ? 'آخر تحديث:' : 'Last Updated:'} {new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
          </p>
        </div>

        {/* ✅ Filter Actions Buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button 
            onClick={() => setShowLowStock(!showLowStock)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-tight transition-all border-2 ${
              showLowStock 
              ? 'bg-[#DC2626] border-[#DC2626] text-white shadow-lg shadow-red-500/20' 
              : 'bg-white border-black/5 text-slate-600 hover:border-[#DC2626] hover:text-[#DC2626]'
            }`}
          >
            <AlertTriangle size={16} />
            {lang === 'ar' ? 'النواقص' : 'Low Stock'}
          </button>
          
          <button 
            onClick={() => setShowLowStock(false)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black text-white font-black text-xs uppercase tracking-tight hover:bg-zinc-800 transition-all border-2 border-black"
          >
            <RotateCcw size={16} />
            {lang === 'ar' ? 'إعادة ضبط' : 'Reset'}
          </button>
        </div>
      </div>

      {/* 2. Financial Overview Stats */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat, i) => (
          <GlassCard key={i} variant="dark" className="p-5 sm:p-6 flex items-center justify-between hover:border-[#DC2626]/50 transition-all cursor-default group">
            <div className="space-y-1">
              <p className="text-slate-500 text-[10px] sm:text-xs font-black uppercase tracking-widest">{stat.label}</p>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight group-hover:text-[#DC2626] transition-colors">{stat.value}</h2>
            </div>
            <div className={`${stat.color} p-2 sm:p-3 rounded-xl shadow-lg transform group-hover:rotate-12 transition-transform shrink-0`}>
              <stat.icon size={22} className="text-white" />
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 3. Delivery Fee Management */}
        <GlassCard variant="dark" className="p-6 sm:p-8 border-l-4 border-l-[#DC2626] sm:border-l-4 rtl:border-l-0 rtl:border-r-4 rtl:border-r-[#DC2626]">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-[#DC2626]/10 p-3 rounded-2xl shrink-0">
              <Truck size={24} className="text-[#DC2626]" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{lang === 'ar' ? 'رسوم التوصيل' : 'Delivery Fee'}</h3>
              <p className="text-slate-400 text-xs">{lang === 'ar' ? 'يضاف هذا المبلغ لكل طلب' : 'Added to every order'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input 
                type="number" 
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-black text-white outline-none focus:ring-2 focus:ring-[#DC2626]"
              />
              <span className={`absolute top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs ${lang === 'ar' ? 'left-4' : 'right-4'}`}>EGP</span>
            </div>
            <button 
              onClick={() => saveSettings(Number(deliveryFee), notificationEmails)}
              disabled={updatingSettings}
              className="bg-[#DC2626] hover:bg-red-700 text-white p-3.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {updatingSettings ? <Loader2 size={20} className="animate-spin"/> : <Save size={20} />}
            </button>
          </div>
        </GlassCard>

        {/* 4. Email Notification Management */}
        <GlassCard variant="dark" className="p-6 sm:p-8 border-l-4 border-l-amber-500 sm:border-l-4 rtl:border-l-0 rtl:border-r-4 rtl:border-r-amber-500">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-amber-500/10 p-3 rounded-2xl shrink-0">
              <Mail size={24} className="text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">{lang === 'ar' ? 'تنبيهات الطلبات' : 'Order Alerts'}</h3>
              <p className="text-slate-400 text-xs">
                {lang === 'ar' ? `تم إضافة ${notificationEmails.length}/3 بريد إلكتروني` : `${notificationEmails.length}/3 emails added`}
              </p>
            </div>
          </div>

          <form onSubmit={handleAddEmail} className="flex gap-2 mb-4">
            <input 
              type="email" 
              placeholder={lang === 'ar' ? 'أضف بريد إلكتروني...' : 'Add admin email...'}
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={notificationEmails.length >= 3 || updatingSettings}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-amber-500 disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={notificationEmails.length >= 3 || updatingSettings}
              className="bg-amber-500 hover:bg-amber-600 text-white px-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={20} />
            </button>
          </form>

          <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
            {notificationEmails.map((email, idx) => (
              <div key={idx} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 border border-white/5 group">
                <span className="text-slate-300 text-xs font-mono">{email}</span>
                <button 
                  onClick={() => handleRemoveEmail(email)}
                  disabled={updatingSettings}
                  className="text-slate-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </GlassCard>

      </div>

      {/* 5. Inventory Management Section */}
      <div className="pt-4">
        {/* Pass the filter state to the Inventory component */}
        {Inventory && <Inventory filterLowStock={showLowStock} />}
      </div>
    </div>
  );
};

export default AdminDashboard;