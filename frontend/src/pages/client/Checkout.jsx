import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useNavigate, Navigate } from 'react-router-dom';
import GlassCard from '../../components/ui/GlassCard';
import SquircleButton from '../../components/ui/SquircleButton';
import { MapPin, Plus, Truck, CreditCard, ShieldCheck, ArrowRight, Edit3, Trash2, X, Save, Smartphone, Wallet, Copy, MessageCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../utils/axios'; 

// ✅ CONFIG: Payment Details
const WHATSAPP_NUMBERS = ['+201000686866', '+201000076890', '+201033520476'];

const PAYMENT_INFO = {
  InstaPay: {
    title: { en: 'InstaPay', ar: 'انستا باي' },
    link: "https://ipn.eg/S/yousry360218/instapay/6xwQ60",
    textLink: "yousry360218@instapay",
    number: "01000000685",
    poweredBy: "Powered by InstaPay"
  },
  VodafoneCash: {
    title: { en: 'Vodafone Cash', ar: 'فودافون كاش' },
    link: "http://vf.eg/vfcash?id=mt&qrId=hvSwTd",
    number: "01000000685"
  }
};

const CheckoutContent = () => {
  const { cartItems, getCartTotal, checkout } = useCart();
  const { user, setUser } = useAuth(); 
  const { lang } = useApp();
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [addresses, setAddresses] = useState([]);
  const [selectedAddrId, setSelectedAddrId] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(50); 

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('CashOnDelivery');
  const [showPaymentModal, setShowPaymentModal] = useState(null); // 'InstaPay' | 'VodafoneCash' | null
  
  // UI Modes
  const [mode, setMode] = useState('list');
  const [form, setForm] = useState({ street: '', building: '', city: 'Alexandria' });
  const [editingId, setEditingId] = useState(null);
  
  const [isProcessing, setIsProcessing] = useState(false);

  // --- 1. INITIALIZATION ---
  useEffect(() => {
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

    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        setDeliveryFee(data.deliveryFee ?? 50);
      } catch (error) {
        console.error("Fee Fetch Error:", error);
      }
    };
    fetchSettings();
  }, [user]);

  // --- 2. HANDLERS (Address) ---
  const handleSaveAddress = async () => {
    if (!form.street || !form.building) return toast.error(lang === 'en' ? 'Fill all fields' : 'املأ جميع البيانات');
    try {
      setIsProcessing(true);
      const { data } = await api.post('/users/address', { street: form.street, aptNumber: form.building, city: 'Alexandria' });
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

  const handleUpdateAddress = async () => {
    try {
      setIsProcessing(true);
      const { data } = await api.put(`/users/address/${editingId}`, { street: form.street, aptNumber: form.building, city: 'Alexandria' });
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

  const handleDelete = async (e, id) => {
    e.stopPropagation(); 
    if (!window.confirm("Delete this address?")) return;
    try {
      setIsProcessing(true);
      const { data } = await api.delete(`/users/address/${id}`);
      const updatedUser = { ...user, addresses: data };
      if (setUser) setUser(updatedUser);
      setAddresses(data);
      if (selectedAddrId === id && data.length > 0) setSelectedAddrId(data[0]._id);
      toast.success(lang === 'en' ? 'Address Deleted' : 'تم حذف العنوان');
    } catch (error) {
      toast.error('Failed to delete');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const startEdit = (e, addr) => {
    e.stopPropagation();
    setForm({ street: addr.street, building: addr.aptNumber, city: addr.city });
    setEditingId(addr._id);
    setMode('edit');
  };

  // --- PAYMENT HELPERS ---
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success(lang === 'en' ? 'Copied!' : 'تم النسخ!');
  };

  const handleWhatsAppClick = () => {
    const randomNum = WHATSAPP_NUMBERS[Math.floor(Math.random() * WHATSAPP_NUMBERS.length)];
    const message = lang === 'en' 
      ? `Hello, I have sent the payment via ${paymentMethod}. Here is the screenshot.` 
      : `مرحباً، لقد قمت بالتحويل عبر ${paymentMethod === 'InstaPay' ? 'انستا باي' : 'فودافون كاش'}. إليك صورة التحويل.`;
    window.open(`https://wa.me/${randomNum}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // --- PLACE ORDER ---
  const handlePlaceOrder = async () => {
    // 1. Validate Address
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

    // 2. Prepare Payload
    // If Manual Payment, we set transactionId to "See WhatsApp" automatically
    let manualTxId = null;
    if (paymentMethod === 'InstaPay' || paymentMethod === 'VodafoneCash') {
      manualTxId = "See WhatsApp";
    }

    const payload = {
      ...finalAddress,
      paymentMethod,
      transactionId: manualTxId
    };

    const result = await checkout(payload);

    if (result.success) {
      toast.success(lang === 'en' ? 'Order Placed Successfully!' : 'تم تسجيل الطلب بنجاح');
      navigate('/'); 
    } else {
      toast.error(result.error || 'Checkout Failed');
    }
    
    setIsProcessing(false);
  };

  const subtotal = typeof getCartTotal === 'function' ? getCartTotal() : 0;
  const shipping = subtotal > 500 ? 0 : deliveryFee;
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
        
        {/* LEFT COLUMN: Addresses & Payment */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ADDRESS SECTION */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-[#0F172A] flex items-center gap-2">
              <MapPin size={22} className="text-[#DC2626]" />
              {lang === 'en' ? 'My Addresses' : 'عناويني'}
            </h2>

            {mode === 'list' && (
              <div className="grid gap-4">
                {addresses.map((addr) => (
                  <div 
                    key={addr._id}
                    onClick={() => setSelectedAddrId(addr._id)}
                    className={`relative p-5 rounded-3xl border-2 cursor-pointer transition-all flex justify-between items-center group ${
                      selectedAddrId === addr._id ? 'border-[#DC2626] bg-red-50/20' : 'border-slate-100 bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedAddrId === addr._id ? 'border-[#DC2626]' : 'border-slate-300'}`}>
                        {selectedAddrId === addr._id && <div className="w-3 h-3 bg-[#DC2626] rounded-full" />}
                      </div>
                      <div>
                        <p className="font-bold text-[#0F172A] text-lg">{addr.street}</p>
                        <p className="text-sm text-slate-500">{lang === 'en' ? 'Building/Apt:' : 'مبنى/شقة:'} {addr.aptNumber}</p>
                        <p className="text-xs text-slate-400 uppercase font-bold mt-1">Alexandria</p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => startEdit(e, addr)} className="p-2 bg-slate-50 text-slate-400 hover:text-[#DC2626] rounded-full"><Edit3 size={18} /></button>
                      <button onClick={(e) => handleDelete(e, addr._id)} className="p-2 bg-slate-50 text-slate-400 hover:text-red-600 rounded-full"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
                {addresses.length < 2 && (
                  <button onClick={() => { setMode('add'); setForm({ street: '', building: '', city: 'Alexandria' }); }} className="w-full p-5 rounded-3xl border-2 border-dashed border-slate-300 text-slate-400 font-bold hover:text-[#DC2626] hover:border-[#DC2626] hover:bg-red-50/10 flex items-center justify-center gap-2 transition-all">
                    <Plus size={20} /> {lang === 'en' ? 'Add New Address' : 'إضافة عنوان جديد'}
                  </button>
                )}
              </div>
            )}

            {(mode === 'add' || mode === 'edit') && (
              <GlassCard className="p-6 border-2 border-[#DC2626] bg-white animate-fade-in relative">
                <button onClick={() => setMode('list')} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
                <h3 className="font-bold text-[#DC2626] mb-4 uppercase tracking-wider">{mode === 'add' ? (lang === 'en' ? 'Add New Address' : 'إضافة عنوان جديد') : (lang === 'en' ? 'Edit Address' : 'تعديل العنوان')}</h3>
                <div className="space-y-4">
                  <input type="text" placeholder={lang === 'en' ? "Street Name" : "اسم الشارع"} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#DC2626]" value={form.street} onChange={(e) => setForm({...form, street: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4">
                     <input type="text" placeholder={lang === 'en' ? "Building/Flat No." : "رقم المبنى/الشقة"} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#DC2626]" value={form.building} onChange={(e) => setForm({...form, building: e.target.value})} />
                     <input type="text" value="Alexandria" readOnly className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400" />
                  </div>
                  <SquircleButton variant="primary" fullWidth icon={Save} loading={isProcessing} onClick={mode === 'add' ? handleSaveAddress : handleUpdateAddress} className="mt-2">{lang === 'en' ? 'Save Address' : 'حفظ العنوان'}</SquircleButton>
                </div>
              </GlassCard>
            )}
          </section>

          {/* PAYMENT METHOD SECTION */}
          <section className="space-y-4">
            <h2 className="text-xl font-black text-[#0F172A] flex items-center gap-2">
              <CreditCard size={22} className="text-[#DC2626]" />
              {lang === 'en' ? 'Payment Method' : 'طريقة الدفع'}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* COD */}
              <div 
                onClick={() => { setPaymentMethod('CashOnDelivery'); setShowPaymentModal(null); }}
                className={`cursor-pointer p-4 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-3 text-center min-h-[140px]
                  ${paymentMethod === 'CashOnDelivery' ? 'border-green-500 bg-green-50/50 ring-1 ring-green-500' : 'border-slate-100 bg-white hover:border-slate-200'}`}
              >
                <div className="bg-green-100 p-3 rounded-2xl text-green-600"><Truck size={28} /></div>
                <span className="font-bold text-sm text-[#0F172A]">{lang === 'en' ? 'Cash on Delivery' : 'الدفع عند الاستلام'}</span>
              </div>

              {/* InstaPay */}
              <div 
                onClick={() => { setPaymentMethod('InstaPay'); setShowPaymentModal('InstaPay'); }}
                className={`cursor-pointer p-4 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-3 text-center min-h-[140px]
                  ${paymentMethod === 'InstaPay' ? 'border-purple-500 bg-purple-50/50 ring-1 ring-purple-500' : 'border-slate-100 bg-white hover:border-slate-200'}`}
              >
                <div className="bg-purple-100 p-3 rounded-2xl text-purple-600"><Smartphone size={28} /></div>
                <span className="font-bold text-sm text-[#0F172A]">InstaPay</span>
              </div>

              {/* Vodafone Cash */}
              <div 
                onClick={() => { setPaymentMethod('VodafoneCash'); setShowPaymentModal('VodafoneCash'); }}
                className={`cursor-pointer p-4 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-3 text-center min-h-[140px]
                  ${paymentMethod === 'VodafoneCash' ? 'border-[#DC2626] bg-red-50/50 ring-1 ring-[#DC2626]' : 'border-slate-100 bg-white hover:border-slate-200'}`}
              >
                <div className="bg-red-100 p-3 rounded-2xl text-[#DC2626]"><Wallet size={28} /></div>
                <span className="font-bold text-sm text-[#0F172A]">{lang === 'en' ? 'Vodafone Cash' : 'فودافون كاش'}</span>
              </div>
            </div>

            {/* Selected Manual Payment Info (No input anymore) */}
            {(paymentMethod === 'InstaPay' || paymentMethod === 'VodafoneCash') && !showPaymentModal && (
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm">
                 <span className="font-bold text-slate-700">
                   {lang === 'en' ? 'Payment details' : 'تفاصيل الدفع'}
                 </span>
                 <button onClick={() => setShowPaymentModal(paymentMethod)} className="text-[#DC2626] font-bold underline text-xs">
                   {lang === 'en' ? 'Show Instructions' : 'عرض التعليمات'}
                 </button>
              </div>
            )}
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
                  <span className="text-slate-500 font-medium truncate max-w-[150px]">x{item.quantity || 1} {item.title}</span>
                  <span className="font-bold text-[#0F172A]">{item.price * (item.quantity || 1)}</span>
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
              variant="primary" fullWidth loading={isProcessing} icon={ArrowRight}
              onClick={handlePlaceOrder}
              disabled={mode !== 'list' || !selectedAddrId}
              className={`mt-6 ${(mode !== 'list' || !selectedAddrId) ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
            >
              {lang === 'en' ? 'Place Order' : 'تأكيد الطلب'}
            </SquircleButton>
          </GlassCard>
        </div>
      </div>

      {/* --- PAYMENT MODAL POPUP (RESPONSIVE FIXES) --- */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
          {/* ✅ ADDED: flex flex-col and max-h-[85vh] to fix height issues */}
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            
            {/* Header (Fixed) */}
            <div className={`shrink-0 p-5 flex items-center justify-between border-b ${showPaymentModal === 'InstaPay' ? 'bg-purple-600' : 'bg-[#DC2626]'}`}>
              <h3 className="text-white font-black text-lg flex items-center gap-2">
                {showPaymentModal === 'InstaPay' ? <Smartphone size={24}/> : <Wallet size={24}/>}
                {PAYMENT_INFO[showPaymentModal].title[lang]}
              </h3>
              <button onClick={() => setShowPaymentModal(null)} className="text-white/80 hover:text-white bg-white/20 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Body (Scrollable) */}
            {/* ✅ ADDED: overflow-y-auto to enable scrolling */}
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
              
              {/* Link Section */}
              <div className="text-center">
                <p className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wide">
                  {lang === 'en' ? 'Tap to Pay:' : 'اضغط للدفع:'}
                </p>
                <a 
                  href={PAYMENT_INFO[showPaymentModal].link} 
                  target="_blank" 
                  rel="noreferrer"
                  className={`inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-lg shadow-xl hover:scale-105 transition-transform
                    ${showPaymentModal === 'InstaPay' ? 'bg-purple-600 shadow-purple-200' : 'bg-[#DC2626] shadow-red-200'}`}
                >
                  {lang === 'en' ? 'Pay Now Link' : 'رابط الدفع المباشر'}
                </a>
              </div>

              {/* Divider */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-slate-300 text-xs font-black uppercase tracking-widest">{lang === 'en' ? 'OR' : 'أو'}</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Manual Info */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center space-y-4">
                
                {/* InstaPay Username */}
                {showPaymentModal === 'InstaPay' && (
                   <div className="space-y-1">
                     <p className="text-xs text-slate-400 font-bold uppercase">{lang === 'en' ? 'Send to Username:' : 'أرسل إلى:'}</p>
                     <div className="flex items-center justify-center gap-2 font-mono text-base font-bold text-slate-800 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                        <span className="truncate">{PAYMENT_INFO.InstaPay.textLink}</span>
                        <button onClick={() => copyToClipboard(PAYMENT_INFO.InstaPay.textLink)} className="text-purple-600 hover:bg-purple-50 p-1.5 rounded-md"><Copy size={16} /></button>
                     </div>
                     <p className="text-[10px] text-slate-400 font-bold">{PAYMENT_INFO.InstaPay.poweredBy}</p>
                   </div>
                )}

                {/* Phone Number */}
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 font-bold uppercase">{lang === 'en' ? 'Send to Number:' : 'أرسل إلى الرقم:'}</p>
                  <div className="flex items-center justify-center gap-3 font-mono text-2xl font-black text-slate-800">
                    {PAYMENT_INFO[showPaymentModal].number}
                    <button onClick={() => copyToClipboard(PAYMENT_INFO[showPaymentModal].number)} className="text-slate-400 hover:text-slate-600 p-1"><Copy size={20} /></button>
                  </div>
                </div>
              </div>

              {/* ✅ REMOVED: Input field entirely */}

              {/* WhatsApp Instruction */}
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-center">
                   <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                     {lang === 'en' ? 'To confirm your order, you MUST send a screenshot of the payment on WhatsApp.' : 'لتأكيد طلبك، يجب إرسال صورة إيصال الدفع عبر واتساب.'}
                   </p>
                   <button 
                     onClick={handleWhatsAppClick}
                     className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-3.5 rounded-xl hover:bg-[#20bd5a] transition-all shadow-lg shadow-green-100"
                   >
                     <MessageCircle size={20} />
                     {lang === 'en' ? 'Send Screenshot' : 'إرسال الإيصال واتساب'}
                   </button>
              </div>

              {/* Confirm Button */}
              <button 
                onClick={() => setShowPaymentModal(null)}
                className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors"
              >
                {lang === 'en' ? 'Close' : 'إغلاق'}
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// WRAPPER
const Checkout = () => {
  const { user } = useAuth();
  const { cartItems } = useCart();
  if (!cartItems || cartItems.length === 0) return <Navigate to="/cart" />;
  return <CheckoutContent key={user ? user._id : 'loading'} />;
};

export default Checkout;