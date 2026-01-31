import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useNavigate, Navigate } from 'react-router-dom';
import GlassCard from '../../components/ui/GlassCard';
import SquircleButton from '../../components/ui/SquircleButton';
import { MapPin, Plus, CheckCircle2, Truck, CreditCard, ShieldCheck, ArrowRight, Edit3, Trash2, X, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../utils/axios'; 

const CheckoutContent = () => {
  const { cartItems, getCartTotal, checkout } = useCart();
  const { user, setUser } = useAuth(); 
  const { lang } = useApp();
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [addresses, setAddresses] = useState([]);
  const [selectedAddrId, setSelectedAddrId] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(50); // Default, updated by API

  // UI Modes: 'list' | 'add' | 'edit'
  const [mode, setMode] = useState('list');
  const [form, setForm] = useState({ street: '', building: '', city: 'Alexandria' });
  const [editingId, setEditingId] = useState(null);
  
  const [isProcessing, setIsProcessing] = useState(false);

  // --- 1. INITIALIZATION ---
  useEffect(() => {
    // A. Fetch Addresses
    if (user) {
      let list = [];
      if (user.addresses && user.addresses.length > 0) {
        list = user.addresses;
      } else if (user.address && user.address.street) {
        list = [{ ...user.address, _id: user.address._id || 'legacy_primary' }];
      }
      setAddresses(list);
      if (list.length > 0 && !selectedAddrId) {
        setSelectedAddrId(list[0]._id);
      }
    }

    // B. Fetch Dynamic Delivery Fee
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        setDeliveryFee(data.deliveryFee || 50);
      } catch (error) {
        console.error("Fee Fetch Error:", error);
      }
    };
    fetchSettings();

  }, [user]);

  // --- 2. HANDLERS ---

  // SAVE NEW ADDRESS
  const handleSaveAddress = async () => {
    if (!form.street || !form.building) return toast.error(lang === 'en' ? 'Fill all fields' : 'املأ جميع البيانات');

    try {
      setIsProcessing(true);
      const { data } = await api.post('/users/address', {
        street: form.street,
        aptNumber: form.building,
        city: 'Alexandria'
      });

      const updatedUser = { ...user, addresses: data };
      if (setUser) setUser(updatedUser); 
      setAddresses(data);
      
      setMode('list');
      setForm({ street: '', building: '', city: 'Alexandria' });
      toast.success(lang === 'en' ? 'Address Added' : 'تم إضافة العنوان');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add address');
    } finally {
      setIsProcessing(false);
    }
  };

  // UPDATE EXISTING ADDRESS
  const handleUpdateAddress = async () => {
    try {
      setIsProcessing(true);
      const { data } = await api.put(`/users/address/${editingId}`, {
        street: form.street,
        aptNumber: form.building,
        city: 'Alexandria'
      });

      const updatedUser = { ...user, addresses: data };
      if (setUser) setUser(updatedUser);
      setAddresses(data);

      setMode('list');
      setEditingId(null);
      toast.success(lang === 'en' ? 'Address Updated' : 'تم تحديث العنوان');
    } catch (error) {
      toast.error('Failed to update');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // DELETE ADDRESS
  const handleDelete = async (e, id) => {
    e.stopPropagation(); 
    if (!window.confirm("Delete this address?")) return;

    try {
      setIsProcessing(true);
      const { data } = await api.delete(`/users/address/${id}`);
      
      const updatedUser = { ...user, addresses: data };
      if (setUser) setUser(updatedUser);
      setAddresses(data);
      
      if (selectedAddrId === id && data.length > 0) {
        setSelectedAddrId(data[0]._id);
      }
      
      toast.success(lang === 'en' ? 'Address Deleted' : 'تم حذف العنوان');
    } catch (error) {
      toast.error('Failed to delete');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  // START EDITING
  const startEdit = (e, addr) => {
    e.stopPropagation();
    setForm({ street: addr.street, building: addr.aptNumber, city: addr.city });
    setEditingId(addr._id);
    setMode('edit');
  };

  // PLACE ORDER
  const handlePlaceOrder = async () => {
    const selectedAddr = addresses.find(a => a._id === selectedAddrId);
    
    if (!selectedAddr) {
      toast.error(lang === 'en' ? 'Please select an address' : 'يرجى اختيار عنوان');
      return;
    }

    setIsProcessing(true);

    const finalAddress = {
      street: selectedAddr.street,
      aptNumber: selectedAddr.aptNumber,
      city: selectedAddr.city || 'Alexandria',
      phone: user.phone || '0000000000'
    };

    const result = await checkout(finalAddress);

    if (result.success) {
      toast.success(lang === 'en' ? 'Order Placed Successfully!' : 'تم تسجيل الطلب بنجاح');
      navigate('/'); 
    } else {
      toast.error(result.error || 'Checkout Failed');
    }
    
    setIsProcessing(false);
  };

  // CALCULATIONS (Using Dynamic Fee)
  const subtotal = typeof getCartTotal === 'function' ? getCartTotal() : 0;
  const shipping = subtotal > 500 ? 0 : deliveryFee; // Use fetched fee
  const total = subtotal + shipping;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-[#0F172A] uppercase tracking-tight">
          {lang === 'en' ? 'Secure Checkout' : 'إتمام الشراء الآمن'}
        </h1>
        <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
          <ShieldCheck size={18} />
          <span>{lang === 'en' ? 'SSL Encrypted & Secure' : 'اتصال مشفر وآمن'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN: Addresses */}
        <div className="lg:col-span-2 space-y-6">
          <section className="space-y-4">
            <h2 className="text-xl font-black text-[#0F172A] flex items-center gap-2">
              <MapPin size={22} className="text-[#DC2626]" />
              {lang === 'en' ? 'My Addresses' : 'عناويني'}
            </h2>

            {/* === MODE: LIST VIEW === */}
            {mode === 'list' && (
              <div className="grid gap-4">
                {addresses.map((addr) => (
                  <div 
                    key={addr._id}
                    onClick={() => setSelectedAddrId(addr._id)}
                    className={`relative p-5 rounded-3xl border-2 cursor-pointer transition-all flex justify-between items-center group ${
                      selectedAddrId === addr._id 
                      ? 'border-[#DC2626] bg-red-50/20' 
                      : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Selection Indicator */}
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedAddrId === addr._id ? 'border-[#DC2626]' : 'border-slate-300'}`}>
                        {selectedAddrId === addr._id && <div className="w-3 h-3 bg-[#DC2626] rounded-full" />}
                      </div>
                      
                      {/* Address Details */}
                      <div>
                        <p className="font-bold text-[#0F172A] text-lg">{addr.street}</p>
                        <p className="text-sm text-slate-500">
                          {lang === 'en' ? 'Building/Apt:' : 'مبنى/شقة:'} {addr.aptNumber}
                        </p>
                        <p className="text-xs text-slate-400 uppercase font-bold mt-1">Alexandria</p>
                      </div>
                    </div>

                    {/* Actions (Edit/Delete) */}
                    <div className="flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => startEdit(e, addr)}
                        className="p-2 bg-slate-50 text-slate-400 hover:text-[#DC2626] rounded-full"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, addr._id)}
                        className="p-2 bg-slate-50 text-slate-400 hover:text-red-600 rounded-full"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* ADD BUTTON (Only if < 2 addresses) */}
                {addresses.length < 2 && (
                  <button 
                    onClick={() => { setMode('add'); setForm({ street: '', building: '', city: 'Alexandria' }); }}
                    className="w-full p-5 rounded-3xl border-2 border-dashed border-slate-300 text-slate-400 font-bold hover:text-[#DC2626] hover:border-[#DC2626] hover:bg-red-50/10 flex items-center justify-center gap-2 transition-all"
                  >
                    <Plus size={20} />
                    {lang === 'en' ? 'Add New Address' : 'إضافة عنوان جديد'}
                  </button>
                )}
              </div>
            )}

            {/* === MODE: ADD / EDIT FORM === */}
            {(mode === 'add' || mode === 'edit') && (
              <GlassCard className="p-6 border-2 border-[#DC2626] bg-white animate-fade-in relative">
                <button 
                  onClick={() => setMode('list')} 
                  className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-400"
                >
                  <X size={20} />
                </button>
                
                <h3 className="font-bold text-[#DC2626] mb-4 uppercase tracking-wider">
                  {mode === 'add' 
                    ? (lang === 'en' ? 'Add New Address' : 'إضافة عنوان جديد') 
                    : (lang === 'en' ? 'Edit Address' : 'تعديل العنوان')}
                </h3>

                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder={lang === 'en' ? "Street Name" : "اسم الشارع"} 
                    className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#DC2626]" 
                    value={form.street}
                    onChange={(e) => setForm({...form, street: e.target.value})}
                  />
                  <div className="grid grid-cols-2 gap-4">
                     <input 
                       type="text" 
                       placeholder={lang === 'en' ? "Building/Flat No." : "رقم المبنى/الشقة"} 
                       className="p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#DC2626]" 
                       value={form.building}
                       onChange={(e) => setForm({...form, building: e.target.value})}
                     />
                     <input 
                       type="text" 
                       value="Alexandria" 
                       readOnly 
                       className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400" 
                     />
                  </div>
                  
                  <SquircleButton 
                    variant="primary" 
                    fullWidth 
                    icon={Save}
                    loading={isProcessing}
                    onClick={mode === 'add' ? handleSaveAddress : handleUpdateAddress}
                    className="mt-2"
                  >
                    {lang === 'en' ? 'Save Address' : 'حفظ العنوان'}
                  </SquircleButton>
                </div>
              </GlassCard>
            )}

          </section>

          {/* PAYMENT METHOD (Static) */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-[#0F172A] flex items-center gap-2">
              <CreditCard size={22} className="text-[#DC2626]" />
              {lang === 'en' ? 'Payment Method' : 'طريقة الدفع'}
            </h2>
            <div className="p-6 rounded-3xl border-2 border-[#DC2626] bg-red-50/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-[#DC2626] p-3 rounded-2xl text-white">
                  <Truck size={24} />
                </div>
                <div>
                  <p className="font-black text-[#0F172A]">{lang === 'en' ? 'Cash on Delivery' : 'الدفع عند الاستلام'}</p>
                  <p className="text-xs text-slate-500">{lang === 'en' ? 'Pay when you receive your meds' : 'ادفع عند استلام أدويتك'}</p>
                </div>
              </div>
              <CheckCircle2 size={24} className="text-[#DC2626]" />
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Summary */}
        <div className="lg:col-span-1">
          <GlassCard className="p-8 sticky top-48">
            <h3 className="text-xl font-black mb-6 text-[#0F172A] border-b border-slate-100 pb-4">
              {lang === 'en' ? 'Order Summary' : 'ملخص الطلب'}
            </h3>
            
            <div className="space-y-3 mb-6 max-h-40 overflow-y-auto pr-2">
              {cartItems.map((item) => (
                <div key={item._id} className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium truncate max-w-[150px]">
                    x{item.quantity || 1} {item.title}
                  </span>
                  <span className="font-bold text-[#0F172A]">
                    {item.price * (item.quantity || 1)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-4 py-4 border-t border-slate-100">
              <div className="flex justify-between text-slate-500 font-bold">
                <span>{lang === 'en' ? 'Subtotal' : 'المجموع'}</span>
                <span>{subtotal} EGP</span>
              </div>
              <div className="flex justify-between text-slate-500 font-bold">
                <span>{lang === 'en' ? 'Shipping' : 'التوصيل'}</span>
                <span>{shipping === 0 ? (lang === 'en' ? 'FREE' : 'مجاني') : `${shipping} EGP`}</span>
              </div>
              <div className="flex justify-between text-2xl font-black pt-4 text-[#0F172A]">
                <span>{lang === 'en' ? 'Total' : 'الإجمالي'}</span>
                <span className="text-[#DC2626]">{total} EGP</span>
              </div>
            </div>

            <SquircleButton 
              variant="primary" 
              fullWidth 
              loading={isProcessing}
              icon={ArrowRight}
              onClick={handlePlaceOrder}
              disabled={mode !== 'list' || !selectedAddrId}
              className={`mt-6 ${(mode !== 'list' || !selectedAddrId) ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
            >
              {lang === 'en' ? 'Place Order' : 'تأكيد الطلب'}
            </SquircleButton>

          </GlassCard>
        </div>
      </div>
    </div>
  );
};

// WRAPPER TO FORCE RELOAD ON USER DATA CHANGE
const Checkout = () => {
  const { user } = useAuth();
  const { cartItems } = useCart();

  if (!cartItems || cartItems.length === 0) return <Navigate to="/cart" />;

  return <CheckoutContent key={user ? user._id : 'loading'} />;
};

export default Checkout;