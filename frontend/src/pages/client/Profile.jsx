import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, MapPin, Lock, Save, Plus, Trash2, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import api from '../../utils/axios';
import GlassCard from '../../components/ui/GlassCard';
import SquircleButton from '../../components/ui/SquircleButton';

const Profile = () => {
  const { user } = useAuth(); 
  const { lang } = useApp(); 

  const [loading, setLoading] = useState(false);
  
  // 🔒 THE FIX: A Lock to prevent auto-resetting while you type
  const isDataLoaded = useRef(false);

  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addresses, setAddresses] = useState([]);
  
  // Password State
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // ✅ 1. LOAD DATA ONLY ONCE
  useEffect(() => {
    // Only run if user exists AND we haven't loaded data yet
    if (user && !isDataLoaded.current) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAddresses(user.addresses || []);
      
      // 🔒 Lock it! Now background updates won't overwrite your typing
      isDataLoaded.current = true;
    }
  }, [user]);

  // Handle Address Changes
  const handleAddAddress = () => {
    if (addresses.length >= 2) return toast.error(lang === 'ar' ? 'الحد الأقصى عنوانين' : 'Max 2 addresses allowed');
    // Add empty address container
    setAddresses([...addresses, { street: '', city: 'Alexandria', phone: '', aptNumber: '' }]);
  };

  // ✅ 2. FIX IMMUTABILITY (Prevents "Stuck Input" bug)
  const handleAddressChange = (index, field, value) => {
    setAddresses(prevAddresses => 
      prevAddresses.map((addr, i) => 
        i === index ? { ...addr, [field]: value } : addr
      )
    );
  };

  const handleRemoveAddress = (index) => {
    setAddresses(addresses.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Password Validation
    if (passwordData.newPassword) {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setLoading(false);
        return toast.error(lang === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      }
      if (!passwordData.oldPassword) {
        setLoading(false);
        return toast.error(lang === 'ar' ? 'يرجى كتابة كلمة المرور القديمة' : 'Please enter old password');
      }
    }

    try {
      // ✅ 3. CLEAN THE ADDRESSES (Strip IDs)
      // We remove the '_id' field from addresses before sending.
      // This forces the Backend to treat them as new clean data, preventing update conflicts.
      const cleanAddresses = addresses.map(({ _id, ...rest }) => rest);

      const payload = {
        name,
        email,
        phone,
        addresses: cleanAddresses
      };

      if (passwordData.newPassword) {
        payload.password = passwordData.newPassword;
        payload.oldPassword = passwordData.oldPassword;
      }

      console.log("📤 Sending Payload:", payload); // Verify in Browser Console

      const { data } = await api.put('/users/profile', payload);
      
      // Update Local Storage
      localStorage.setItem('userInfo', JSON.stringify(data)); 
      
      toast.success(lang === 'ar' ? 'تم تحديث الملف الشخصي' : 'Profile Updated Successfully');
      
      // Force reload to ensure all Contexts sync up perfectly
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Update failed');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
        <div className="bg-[#DC2626]/10 p-4 rounded-2xl">
          <User size={32} className="text-[#DC2626]" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-[#0F172A] uppercase tracking-tight">
            {lang === 'ar' ? 'الملف الشخصي' : 'My Profile'}
          </h1>
          <p className="text-slate-500 font-medium">
            {lang === 'ar' ? 'إدارة معلوماتك الشخصية والأمان' : 'Manage your personal information and security'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: Basic Info */}
        <div className="space-y-6">
          <GlassCard className="p-6 space-y-6">
            <h3 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
              <ShieldCheck className="text-[#DC2626]" size={20} />
              {lang === 'ar' ? 'المعلومات الأساسية' : 'Basic Information'}
            </h3>

            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 uppercase">{lang === 'ar' ? 'الاسم بالكامل' : 'Full Name'}</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-3 font-bold text-[#0F172A] outline-none focus:border-[#DC2626] transition-all"
                />
                <User size={18} className="absolute top-1/2 -translate-y-1/2 text-slate-400 ltr:left-3 rtl:right-3" />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 uppercase">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-3 font-bold text-[#0F172A] outline-none focus:border-[#DC2626] transition-all"
                />
                <Mail size={18} className="absolute top-1/2 -translate-y-1/2 text-slate-400 ltr:left-3 rtl:right-3" />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 uppercase">{lang === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-10 py-3 font-bold text-[#0F172A] outline-none focus:border-[#DC2626] transition-all"
                />
                <Phone size={18} className="absolute top-1/2 -translate-y-1/2 text-slate-400 ltr:left-3 rtl:right-3" />
              </div>
            </div>
          </GlassCard>

          {/* Security / Password */}
          <GlassCard className="p-6 space-y-6 border-l-4 border-l-amber-500">
            <h3 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
              <Lock className="text-amber-500" size={20} />
              {lang === 'ar' ? 'الأمان وكلمة المرور' : 'Security & Password'}
            </h3>
            
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
              <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-amber-700 font-medium leading-relaxed">
                {lang === 'ar' 
                  ? 'اترك الحقول فارغة إذا كنت لا تريد تغيير كلمة المرور.' 
                  : 'Leave these fields blank if you do not want to change your password.'}
              </p>
            </div>

            <div className="space-y-4">
              <input 
                type="password" 
                placeholder={lang === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}
                value={passwordData.oldPassword}
                onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-[#0F172A] outline-none focus:border-amber-500 transition-all"
              />
              <input 
                type="password" 
                placeholder={lang === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-[#0F172A] outline-none focus:border-amber-500 transition-all"
              />
              <input 
                type="password" 
                placeholder={lang === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-[#0F172A] outline-none focus:border-amber-500 transition-all"
              />
            </div>
          </GlassCard>
        </div>

        {/* RIGHT COLUMN: Addresses */}
        <div className="space-y-6">
          <GlassCard className="p-6 space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
                <MapPin className="text-[#DC2626]" size={20} />
                {lang === 'ar' ? 'العناوين المحفوظة' : 'Saved Addresses'}
              </h3>
              <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
                {addresses.length}/2
              </span>
            </div>

            <div className="space-y-4 flex-1">
              {addresses.map((addr, index) => (
                <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative group">
                  <div className="absolute top-2 right-2 rtl:left-2 rtl:right-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      type="button"
                      onClick={() => handleRemoveAddress(index)}
                      className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-[#DC2626] text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                      {lang === 'ar' ? `عنوان ${index + 1}` : `Address ${index + 1}`}
                    </span>
                  </div>

                  <input 
                    type="text" 
                    placeholder={lang === 'ar' ? 'اسم الشارع / المنطقة' : 'Street Name / Area'}
                    value={addr.street}
                    onChange={(e) => handleAddressChange(index, 'street', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-[#DC2626]"
                  />
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder={lang === 'ar' ? 'المدينة' : 'City'}
                      value={addr.city}
                      onChange={(e) => handleAddressChange(index, 'city', e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-[#DC2626]"
                    />
                    <input 
                      type="text" 
                      placeholder={lang === 'ar' ? 'رقم هاتف للتواصل' : 'Contact Phone'}
                      value={addr.phone}
                      onChange={(e) => handleAddressChange(index, 'phone', e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-[#DC2626]"
                    />
                  </div>
                </div>
              ))}

              {addresses.length === 0 && (
                <div className="text-center py-10 text-slate-400">
                  <MapPin size={48} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-bold">{lang === 'ar' ? 'لا توجد عناوين محفوظة' : 'No addresses saved'}</p>
                </div>
              )}
            </div>

            {addresses.length < 2 && (
              <button 
                type="button"
                onClick={handleAddAddress}
                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 font-bold hover:border-[#DC2626] hover:text-[#DC2626] hover:bg-red-50 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                {lang === 'ar' ? 'إضافة عنوان جديد' : 'Add New Address'}
              </button>
            )}
          </GlassCard>
        </div>

        {/* Save Button (Full Width) */}
        <div className="lg:col-span-2 sticky bottom-6 z-10">
          <SquircleButton 
            type="submit" 
            variant="primary" 
            fullWidth 
            className="shadow-2xl shadow-red-900/30 !py-4"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" /> {lang === 'ar' ? 'جاري الحفظ...' : 'Saving Changes...'}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save size={20} /> {lang === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
              </span>
            )}
          </SquircleButton>
        </div>

      </form>
    </div>
  );
};

export default Profile;