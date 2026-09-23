import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import SquircleButton from '../../components/ui/SquircleButton';
import { 
  MapPin, Plus, ShieldCheck, Edit3, Trash2, X, Save, 
  MessageCircle, AlertTriangle, ArrowLeft, CheckCircle2, 
  User, Phone, CreditCard, Truck, Smartphone, Wallet, 
  Copy, ExternalLink, HelpCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../utils/axios';
import Breadcrumbs from '../../components/navigation/Breadcrumbs';
import BackButton from '../../components/navigation/BackButton';

const WHATSAPP_NUMBER = '201000076890';

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
  const { cartItems, checkout, clearCart, getCartCount } = useCart();
  const { user, setUser } = useAuth(); 
  const { lang } = useApp();
  const navigate = useNavigate();

  const isAr = !lang || String(lang).toLowerCase().startsWith('ar');
  const totalUnits = typeof getCartCount === 'function' ? getCartCount() : cartItems.length;

  // --- STATE ---
  const [addresses, setAddresses] = useState([]);
  const [selectedAddrId, setSelectedAddrId] = useState(null);
  const [notes, setNotes] = useState('');
  
  // Payment Method starts as null so the user must make an active selection
  const [paymentMethod, setPaymentMethod] = useState(null);

  // Address UI Modes
  const [mode, setMode] = useState('list');
  const [form, setForm] = useState({ street: '', building: '', city: 'Alexandria' });
  const [editingId, setEditingId] = useState(null);
  const [addressToDelete, setAddressToDelete] = useState(null);
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
      if (list.length > 0) {
        setSelectedAddrId((currentId) => currentId || list[0]._id);
      }
    }
  }, [user]);

  // --- 2. ADDRESS HANDLERS ---
  const handleSaveAddress = async () => {
    if (!form.street.trim() || !form.building.trim()) {
      return toast.error(isAr ? 'يرجى كتابة اسم الشارع ورقم المبنى' : 'Please fill street and building');
    }
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
      if (!selectedAddrId && data.length > 0) {
        setSelectedAddrId(data[data.length - 1]._id);
      }
      setMode('list');
      setForm({ street: '', building: '', city: 'Alexandria' });
      toast.success(isAr ? 'تم حفظ العنوان بنجاح' : 'Address added successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || (isAr ? 'فشل حفظ العنوان' : 'Failed to save address'));
    } finally {
      setIsProcessing(false);
    }
  };

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
      toast.success(isAr ? 'تم تحديث العنوان' : 'Address updated');
    } catch (error) {
      console.error("Update Address Error:", error);

      toast.error(isAr ? 'فشل تحديث العنوان' : 'Failed to update address');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmDelete = async () => {
    if (!addressToDelete) return;
    try {
      setIsProcessing(true);
      const { data } = await api.delete(`/users/address/${addressToDelete}`);
      const updatedUser = { ...user, addresses: data };
      if (setUser) setUser(updatedUser);
      setAddresses(data);
      if (selectedAddrId === addressToDelete) {
        setSelectedAddrId(data.length > 0 ? data[0]._id : null);
      }
      toast.success(isAr ? 'تم حذف العنوان' : 'Address deleted');
    } catch (error) {
      console.error("Delete Address Error:", error);
      toast.error(isAr ? 'فشل الحذف' : 'Failed to delete');
    } finally {
      setIsProcessing(false);
      setAddressToDelete(null); 
    }
  };

  const startEdit = (e, addr) => {
    e.stopPropagation();
    setForm({ street: addr.street, building: addr.aptNumber, city: addr.city });
    setEditingId(addr._id);
    setMode('edit');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success(isAr ? 'تم النسخ بنجاح!' : 'Copied to clipboard!');
  };

  // --- 3. WHATSAPP DOSSIER GENERATOR ---
  const generateWhatsAppMessage = (orderId, addr) => {
    const itemsList = cartItems
      .map((item, index) => `  ${index + 1}. *${item.title}* × ${item.quantity || 1}`)
      .join('\n');

    const paymentLabel = {
      CashOnDelivery: isAr ? 'الدفع نقداً عند الاستلام' : 'Cash on Delivery',
      InstaPay: isAr ? 'تحويل انستا باي (InstaPay)' : 'InstaPay Transfer',
      VodafoneCash: isAr ? 'فودافون كاش (Vodafone Cash)' : 'Vodafone Cash'
    }[paymentMethod] || paymentMethod;
    
    if (isAr) {
      return encodeURIComponent(
`*طلب واستفسار جديد - صيدلية ماريلاند* 🏥
رقم المرجع: #${String(orderId).slice(-6).toUpperCase()}

👤 *بيانات العميل:*
• الاسم: ${user?.name || 'عميل ماريلاند'}
• الهاتف: ${user?.phone || 'غير مسجل'}

📍 *عنوان التوصيل:*
• الشارع: ${addr.street}
• المبنى/الشقة: ${addr.aptNumber}
• المدينة: الإسكندرية

💳 *طريقة الدفع المختارة:* ${paymentLabel}
${notes.trim() ? `📝 *ملاحظات العميل:* ${notes.trim()}\n` : ''}
📦 *الأصناف المطلوبة:*
${itemsList}

يرجى تزويدي بالسعر الإجمالي وتأكيد التوصيل. شكراً لكم!`
      );
    }

    return encodeURIComponent(
`*New Order Request - Maryland Pharmacy* 🏥
Reference: #${String(orderId).slice(-6).toUpperCase()}

👤 *Customer Info:*
• Name: ${user?.name || 'Customer'}
• Phone: ${user?.phone || 'N/A'}

📍 *Delivery Address:*
• Street: ${addr.street}
• Building/Apt: ${addr.aptNumber}
• City: Alexandria

💳 *Payment Preference:* ${paymentLabel}
${notes.trim() ? `📝 *Notes:* ${notes.trim()}\n` : ''}
📦 *Requested Items:*
${itemsList}

Please verify the current total price and delivery schedule. Thank you!`
    );
  };

  // --- 4. PLACE ORDER & DISPATCH ---
  const handlePlaceOrder = async () => {
    const selectedAddr = addresses.find(a => a._id === selectedAddrId);
    if (!selectedAddr) {
      toast.error(isAr ? 'يرجى اختيار عنوان التوصيل' : 'Please select a delivery address');
      return;
    }
    if (!paymentMethod) {
      toast.error(isAr ? 'يرجى تحديد طريقة الدفع المفضلة أولاً' : 'Please choose a payment method first');
      return;
    }

    setIsProcessing(true);

    const finalAddress = {
      street: selectedAddr.street,
      aptNumber: selectedAddr.aptNumber,
      city: selectedAddr.city || 'Alexandria',
      phone: user?.phone || '0000000000'
    };

    const payload = {
      orderItems: cartItems.map(item => ({
        _id: item._id, 
        quantity: item.quantity || 1,
        name: item.title,
      })),
      shippingAddress: finalAddress,
      paymentMethod,
      notes: notes.trim(),
    };

    try {
      const result = await checkout(payload);

      if (result.success) {
        const orderId = result.order?._id || result._id || Date.now();
        const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${generateWhatsAppMessage(orderId, selectedAddr)}`;
        
        toast.success(isAr ? 'تم حفظ طلبك! جاري تحويلك للواتساب للتأكيد...' : 'Order saved! Opening WhatsApp...');
        
        window.open(waLink, '_blank');
        
        if (clearCart) clearCart();
        setTimeout(() => navigate('/my-orders'), 1200);
      } else {
        toast.error(result.error || (isAr ? 'تعذر إتمام الطلب' : 'Order submission failed'));
      }
    } catch (err) {
      console.error("Checkout Error:", err);
      toast.error(isAr ? 'حدث خطأ أثناء حفظ الطلب' : 'An error occurred during submission');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-24 px-3 sm:px-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between gap-3">
        <Breadcrumbs />
        <BackButton fallback="/cart" label={isAr ? 'رجوع للسلة' : 'Back to cart'} />
      </div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-5 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/cart" className="text-slate-400 hover:text-slate-700 transition-colors">
              <ArrowLeft size={20} className={isAr ? 'rotate-180' : ''} />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {isAr ? 'تأكيد بيانات التوصيل والدفع' : 'Delivery & Payment Confirmation'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {isAr ? 'اختر العنوان وطريقة الدفع لتأكيد السعر النهائي مع الصيدلي' : 'Choose your address and payment method to finalize with pharmacist'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full w-fit">
          <ShieldCheck size={16} />
          <span>{isAr ? 'صيدلية ماريلاند المعتمدة' : 'Verified Maryland Pharmacy'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT COLUMN: Customer Info, Addresses & Payment */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* User Contact Pill */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                <User size={20} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{isAr ? 'اسم المستلم' : 'Recipient'}</p>
                <p className="text-sm sm:text-base font-black text-slate-900">{user?.name || (isAr ? 'عميل' : 'Customer')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Phone size={19} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{isAr ? 'رقم الهاتف للتواصل' : 'Contact Phone'}</p>
                <p className="text-sm sm:text-base font-black text-slate-900">{user?.phone || (isAr ? 'غير مسجل' : 'Not recorded')}</p>
              </div>
            </div>
          </div>

          {/* 1. Address Section */}
          <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <MapPin size={20} className="text-[#DC2626]" />
                <span>{isAr ? '١. عنوان التوصيل (الإسكندرية)' : '1. Delivery Address (Alexandria)'}</span>
              </h2>

              {mode === 'list' && addresses.length > 0 && addresses.length < 3 && (
                <button 
                  onClick={() => { setMode('add'); setForm({ street: '', building: '', city: 'Alexandria' }); }}
                  className="text-xs font-bold text-[#DC2626] hover:underline flex items-center gap-1"
                >
                  <Plus size={15} />
                  <span>{isAr ? 'إضافة عنوان جديد' : 'Add new address'}</span>
                </button>
              )}
            </div>

            {/* Address List */}
            {mode === 'list' && (
              <div className="grid gap-3">
                {addresses.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl">
                    <MapPin className="mx-auto text-slate-300 mb-2" size={30} />
                    <p className="text-xs sm:text-sm font-bold text-slate-700 mb-3">
                      {isAr ? 'لم تسجل عنوان توصيل بعد' : 'No saved delivery address yet'}
                    </p>
                    <SquircleButton 
                      variant="primary" 
                      onClick={() => setMode('add')} 
                      className="!py-2 !px-4 text-xs font-bold"
                    >
                      {isAr ? 'إضافة عنوان الآن' : 'Add Address Now'}
                    </SquircleButton>
                  </div>
                ) : (
                  addresses.map((addr) => {
                    const isSelected = selectedAddrId === addr._id;
                    return (
                      <div 
                        key={addr._id}
                        onClick={() => setSelectedAddrId(addr._id)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                          isSelected 
                            ? 'border-[#DC2626] bg-red-50/20' 
                            : 'border-slate-200/80 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-[#DC2626]' : 'border-slate-300'
                          }`}>
                            {isSelected && <div className="w-2.5 h-2.5 bg-[#DC2626] rounded-full" />}
                          </div>

                          <div>
                            <p className="font-bold text-slate-900 text-sm sm:text-base">{addr.street}</p>
                            <p className="text-xs text-slate-500 font-medium">
                              {isAr ? 'عمارة / رقم الشقة:' : 'Building/Flat:'} {addr.aptNumber} — <span className="text-slate-400">الإسكندرية</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={(e) => startEdit(e, addr)} 
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                            title={isAr ? 'تعديل' : 'Edit'}
                          >
                            <Edit3 size={15} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setAddressToDelete(addr._id); }} 
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title={isAr ? 'حذف' : 'Delete'}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Address Add/Edit Form */}
            {(mode === 'add' || mode === 'edit') && (
              <div className="p-4 sm:p-5 border border-slate-200 bg-slate-50/70 rounded-2xl space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="font-black text-xs sm:text-sm text-slate-900">
                    {mode === 'add' 
                      ? (isAr ? 'إضافة عنوان جديد للتوصيل' : 'Add New Delivery Address') 
                      : (isAr ? 'تعديل العنوان الحالي' : 'Edit Address')}
                  </h3>
                  <button onClick={() => setMode('list')} className="text-slate-400 hover:text-slate-700">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isAr ? 'اسم الشارع والمنطقة *' : 'Street & District *'}
                    </label>
                    <input 
                      type="text" 
                      placeholder={isAr ? "مثال: شارع سوريا، رشدي" : "e.g. Syria St, Roushdy"} 
                      className="w-full p-3 rounded-xl bg-white border border-slate-300 text-sm focus:outline-none focus:border-[#DC2626]" 
                      value={form.street} 
                      onChange={(e) => setForm({...form, street: e.target.value})} 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isAr ? 'رقم العمارة / الشقة *' : 'Building / Apt No. *'}
                      </label>
                      <input 
                        type="text" 
                        placeholder={isAr ? "عمارة 12 - شقة 4" : "Bldg 12, Apt 4"} 
                        className="w-full p-3 rounded-xl bg-white border border-slate-300 text-sm focus:outline-none focus:border-[#DC2626]" 
                        value={form.building} 
                        onChange={(e) => setForm({...form, building: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isAr ? 'المدينة' : 'City'}
                      </label>
                      <input 
                        type="text" 
                        value={isAr ? "الإسكندرية" : "Alexandria"} 
                        readOnly 
                        className="w-full p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-sm font-bold" 
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <SquircleButton 
                      variant="primary" 
                      icon={Save} 
                      loading={isProcessing} 
                      onClick={mode === 'add' ? handleSaveAddress : handleUpdateAddress} 
                      className="!py-2.5 !px-5 text-xs font-bold"
                    >
                      {isAr ? 'حفظ العنوان' : 'Save Address'}
                    </SquircleButton>
                    <button 
                      onClick={() => setMode('list')} 
                      className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl"
                    >
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 2. PAYMENT METHOD SELECTION */}
          <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <CreditCard size={20} className="text-[#DC2626]" />
                <span>{isAr ? '٢. طريقة الدفع المفضلة' : '2. Payment Preference'}</span>
              </h2>
              {!paymentMethod && (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                  {isAr ? 'مطلوب الاختيار' : 'Selection required'}
                </span>
              )}
            </div>

            {/* 3 Payment Options (Buttons that act as clear CTA selectors) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option A: Cash on Delivery */}
              <button
                type="button"
                onClick={() => setPaymentMethod('CashOnDelivery')}
                className={`p-4 rounded-2xl border-2 text-center flex flex-col items-center justify-center gap-2.5 transition-all ${
                  paymentMethod === 'CashOnDelivery'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`p-3 rounded-2xl transition-colors ${
                  paymentMethod === 'CashOnDelivery' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Truck size={24} />
                </div>
                <div>
                  <p className="font-black text-xs sm:text-sm text-slate-900">
                    {isAr ? 'الدفع عند الاستلام' : 'Cash on Delivery'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    {isAr ? 'كاش مع المندوب' : 'Pay cash to courier'}
                  </p>
                </div>
              </button>

              {/* Option B: InstaPay */}
              <button
                type="button"
                onClick={() => setPaymentMethod('InstaPay')}
                className={`p-4 rounded-2xl border-2 text-center flex flex-col items-center justify-center gap-2.5 transition-all ${
                  paymentMethod === 'InstaPay'
                    ? 'border-purple-600 bg-purple-50/50 shadow-md ring-2 ring-purple-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`p-3 rounded-2xl transition-colors ${
                  paymentMethod === 'InstaPay' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Smartphone size={24} />
                </div>
                <div>
                  <p className="font-black text-xs sm:text-sm text-slate-900">انستا باي (InstaPay)</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    {isAr ? 'تحويل لحظي بالاسم/الرقم' : 'Instant IPN Transfer'}
                  </p>
                </div>
              </button>

              {/* Option C: Vodafone Cash */}
              <button
                type="button"
                onClick={() => setPaymentMethod('VodafoneCash')}
                className={`p-4 rounded-2xl border-2 text-center flex flex-col items-center justify-center gap-2.5 transition-all ${
                  paymentMethod === 'VodafoneCash'
                    ? 'border-[#DC2626] bg-red-50/50 shadow-md ring-2 ring-red-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`p-3 rounded-2xl transition-colors ${
                  paymentMethod === 'VodafoneCash' ? 'bg-[#DC2626] text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Wallet size={24} />
                </div>
                <div>
                  <p className="font-black text-xs sm:text-sm text-slate-900">فودافون كاش (Vodafone Cash)</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    {isAr ? 'تحويل لمحفظة الصيدلية' : 'Mobile Wallet Transfer'}
                  </p>
                </div>
              </button>
            </div>

            {/* DYNAMIC RENDERING: Instructions for Elderly / Step-by-Step Clarity */}
            {paymentMethod === 'CashOnDelivery' && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs leading-relaxed space-y-1.5 animate-fade-in">
                <p className="font-black text-sm flex items-center gap-1.5 text-emerald-900">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>{isAr ? 'طريقة سهلة ومباشرة:' : 'Simple & Direct:'}</span>
                </p>
                <p className="font-medium text-emerald-900/90 text-xs">
                  {isAr 
                    ? 'ستدفع المبلغ نقداً لمندوب الصيدلية فور استلام الأدوية وفحصها عند باب منزلك. سيخبرك الصيدلي بإجمالي الفاتورة بدقة على واتساب.' 
                    : 'Pay the exact cash to the courier upon delivery at your door. The pharmacist will inform you of the exact total over WhatsApp.'}
                </p>
              </div>
            )}

            {paymentMethod === 'InstaPay' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/80 border border-purple-200 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-purple-200/80 pb-2.5">
                  <span className="font-black text-sm text-purple-900 flex items-center gap-2">
                    <Smartphone size={18} className="text-purple-700" />
                    <span>{isAr ? 'خطوات التحويل عبر انستا باي (سهلة وبسيطة):' : 'Easy InstaPay Instructions:'}</span>
                  </span>
                  <span className="text-[11px] font-bold text-purple-700">3 خطوات</span>
                </div>

                {/* Elderly-Friendly Step by Step */}
                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-black flex items-center justify-center text-[11px] shrink-0 mt-0.5">1</span>
                    <p className="text-slate-800 font-medium">
                      {isAr 
                        ? 'اضغط زر "تأكيد الطلب عبر واتساب" بالأسفل وتحدث مع الصيدلي لمعرفة إجمالي الفاتورة.' 
                        : 'Tap the button below to confirm with the pharmacist on WhatsApp and learn your total.'}
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-black flex items-center justify-center text-[11px] shrink-0 mt-0.5">2</span>
                    <div className="w-full">
                      <p className="text-slate-800 font-medium mb-1.5">
                        {isAr ? 'افتح تطبيق انستا باي وقم بالتحويل لمعرف الصيدلية أو رقم الهاتف:' : 'Open InstaPay app and transfer to our IPA or Phone:'}
                      </p>
                      
                      {/* Copyable Boxes */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                        <div className="flex items-center justify-between bg-white border border-purple-200 p-2.5 rounded-xl shadow-sm">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">IPA المعرف:</span>
                            <span className="font-mono font-bold text-purple-950 text-xs sm:text-sm">{PAYMENT_INFO.InstaPay.textLink}</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => copyToClipboard(PAYMENT_INFO.InstaPay.textLink)} 
                            className="p-1.5 text-purple-700 hover:bg-purple-100 rounded-lg flex items-center gap-1 font-bold text-xs"
                          >
                            <Copy size={14} />
                            <span>{isAr ? 'نسخ' : 'Copy'}</span>
                          </button>
                        </div>

                        <div className="flex items-center justify-between bg-white border border-purple-200 p-2.5 rounded-xl shadow-sm">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">{isAr ? 'رقم الهاتف:' : 'Phone:'}</span>
                            <span className="font-mono font-bold text-purple-950 text-xs sm:text-sm">{PAYMENT_INFO.InstaPay.number}</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => copyToClipboard(PAYMENT_INFO.InstaPay.number)} 
                            className="p-1.5 text-purple-700 hover:bg-purple-100 rounded-lg flex items-center gap-1 font-bold text-xs"
                          >
                            <Copy size={14} />
                            <span>{isAr ? 'نسخ' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Direct Link button */}
                      <a 
                        href={PAYMENT_INFO.InstaPay.link} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-1.5 text-xs text-purple-700 font-bold hover:underline mt-2"
                      >
                        <ExternalLink size={13} />
                        <span>{isAr ? 'أو افتح رابط الدفع المباشر لتطبيق انستا باي' : 'Or open direct InstaPay app link'}</span>
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-black flex items-center justify-center text-[11px] shrink-0 mt-0.5">3</span>
                    <p className="text-slate-800 font-medium">
                      {isAr 
                        ? 'أرسل لقطة شاشة (Screenshot) لعملية التحويل للصيدلي على نفس محادثة الواتساب ليخرج الطلب فوراً.' 
                        : 'Send the transfer screenshot to the pharmacist in the WhatsApp chat for instant dispatch.'}
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-purple-100/70 text-[11px] font-bold text-purple-900 flex items-center gap-2">
                  <HelpCircle size={15} className="shrink-0 text-purple-700" />
                  <span>{isAr ? 'تنبيه: لا تقم بالتحويل الآن! انتظر حتى يؤكد الصيدلي معك إجمالي السعر أولاً.' : 'Notice: Do not transfer now! Confirm the exact total with the pharmacist first.'}</span>
                </div>
              </div>
            )}

            {paymentMethod === 'VodafoneCash' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-red-50/80 border border-red-200 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-red-200/80 pb-2.5">
                  <span className="font-black text-sm text-[#DC2626] flex items-center gap-2">
                    <Wallet size={18} />
                    <span>{isAr ? 'خطوات التحويل عبر فودافون كاش:' : 'Vodafone Cash Instructions:'}</span>
                  </span>
                  <span className="text-[11px] font-bold text-[#DC2626]">3 خطوات</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#DC2626] text-white font-black flex items-center justify-center text-[11px] shrink-0 mt-0.5">1</span>
                    <p className="text-slate-800 font-medium">
                      {isAr 
                        ? 'أرسل الطلب للصيدلي على واتساب لمعرفة السعر الإجمالي بدقة والتأكد من توافر الأصناف.' 
                        : 'Send the order to the pharmacist via WhatsApp to verify total price and stock availability.'}
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#DC2626] text-white font-black flex items-center justify-center text-[11px] shrink-0 mt-0.5">2</span>
                    <div className="w-full">
                      <p className="text-slate-800 font-medium mb-1.5">
                        {isAr ? 'حوّل المبلغ إلى رقم محفظة الصيدلية التالي:' : 'Transfer the total to our official pharmacy wallet:'}
                      </p>

                      <div className="flex items-center justify-between bg-white border border-red-200 p-2.5 rounded-xl shadow-sm max-w-sm">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">{isAr ? 'رقم محفظة فودافون كاش:' : 'Wallet Number:'}</span>
                          <span className="font-mono font-black text-slate-900 text-sm sm:text-base tracking-wider">{PAYMENT_INFO.VodafoneCash.number}</span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => copyToClipboard(PAYMENT_INFO.VodafoneCash.number)} 
                          className="p-2 text-[#DC2626] hover:bg-red-50 rounded-xl flex items-center gap-1 font-bold text-xs"
                        >
                          <Copy size={15} />
                          <span>{isAr ? 'نسخ الرقم' : 'Copy'}</span>
                        </button>
                      </div>

                      <a 
                        href={PAYMENT_INFO.VodafoneCash.link} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-1.5 text-xs text-[#DC2626] font-bold hover:underline mt-2"
                      >
                        <ExternalLink size={13} />
                        <span>{isAr ? 'أو افتح رابط الدفع المباشر من فودافون' : 'Or open direct Vodafone Cash link'}</span>
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#DC2626] text-white font-black flex items-center justify-center text-[11px] shrink-0 mt-0.5">3</span>
                    <p className="text-slate-800 font-medium">
                      {isAr 
                        ? 'أرسل صورة رسالة التأكيد (SMS) للصيدلي عبر واتساب لتأكيد خروج الدواء.' 
                        : 'Send the confirmation SMS screenshot to the pharmacist via WhatsApp to dispatch your medicine.'}
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-red-100/70 text-[11px] font-bold text-red-950 flex items-center gap-2">
                  <HelpCircle size={15} className="shrink-0 text-[#DC2626]" />
                  <span>{isAr ? 'تنبيه: لا تقم بالتحويل الآن! انتظر رسالة الصيدلي أولاً لتحديد المبلغ.' : 'Notice: Do not transfer now! Wait for the pharmacist message to know the total.'}</span>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: Order Summary & Confirm WhatsApp */}
        <div className="lg:col-span-1 sticky top-28 space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-lg space-y-5">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>{isAr ? 'ملخص الطلب' : 'Order Summary'}</span>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                {cartItems.length} {isAr ? 'أصناف' : 'items'} ({totalUnits} {isAr ? 'قطعة' : 'units'})
              </span>
            </h3>
            
            {/* Scrollable Items Mini-List */}
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div key={item._id} className="flex justify-between items-center text-xs font-bold text-slate-700 py-1 border-b border-slate-50">
                  <span className="truncate max-w-[170px]">{item.title}</span>
                  <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                    ×{item.quantity || 1}
                  </span>
                </div>
              ))}
            </div>

            {/* Selected Payment Tag in Summary */}
            <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-50 border border-slate-200/80 font-bold">
              <span className="text-slate-500">{isAr ? 'طريقة الدفع:' : 'Payment:'}</span>
              <span className={paymentMethod ? 'text-slate-900 font-black' : 'text-amber-600 font-bold'}>
                {paymentMethod ? (
                  paymentMethod === 'CashOnDelivery' 
                    ? (isAr ? 'الدفع عند الاستلام' : 'Cash on Delivery') 
                    : (paymentMethod === 'InstaPay' ? 'انستا باي' : 'فودافون كاش')
                ) : (
                  isAr ? 'لم تحدد بعد' : 'Not chosen'
                )}
              </span>
            </div>

            {/* Customer Notes */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>{isAr ? 'ملاحظات للصيدلي (اختياري)' : 'Notes (Optional)'}</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="2"
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 outline-none focus:border-[#DC2626] transition-all resize-none"
                placeholder={isAr ? 'أي ملاحظات بخصوص العنوان أو مواعيد التسليم...' : 'Any delivery or item instructions...'}
              />
            </div>

            {/* Confirm CTA - Disabled / Greyed out if address or payment is missing */}
            <SquircleButton 
              variant="primary" 
              fullWidth 
              loading={isProcessing} 
              icon={MessageCircle}
              onClick={handlePlaceOrder}
              disabled={mode !== 'list' || !selectedAddrId || !paymentMethod}
              className={`!py-3.5 !rounded-2xl shadow-md text-xs sm:text-sm font-bold tracking-tight transition-all ${
                (!selectedAddrId || !paymentMethod || mode !== 'list') 
                  ? '!bg-slate-300 !text-slate-500 cursor-not-allowed opacity-60 shadow-none' 
                  : 'hover:shadow-red-500/20 active:scale-95'
              }`}
            >
              {!selectedAddrId 
                ? (isAr ? 'يرجى اختيار عنوان التوصيل' : 'Select Delivery Address')
                : !paymentMethod 
                  ? (isAr ? 'يرجى اختيار طريقة الدفع أولاً' : 'Select Payment Method')
                  : (isAr ? 'إرسال وتأكيد الطلب عبر واتساب' : 'Confirm Order via WhatsApp')}
            </SquircleButton>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium text-center">
              <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
              <span>{isAr ? 'تسجيل مباشر للطلب — تأكيد نهائي عبر واتساب' : 'Direct order saving — WhatsApp verification'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Address Modal */}
      {addressToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative border border-slate-100 animate-scale-up">
            <button 
              onClick={() => setAddressToDelete(null)}
              disabled={isProcessing}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center mt-1">
              <div className="bg-red-50 p-3.5 rounded-full mb-3 text-[#DC2626]">
                <AlertTriangle size={28} />
              </div>
              
              <h3 className="text-base font-black text-slate-900 mb-1">
                {isAr ? 'حذف العنوان؟' : 'Delete Address?'}
              </h3>
              
              <p className="text-slate-500 text-xs font-medium mb-6">
                {isAr ? 'هل أنت متأكد من حذف هذا العنوان من حسابك؟' : 'Are you sure you want to delete this address?'}
              </p>

              <div className="flex gap-2.5 w-full">
                <button 
                  onClick={() => setAddressToDelete(null)}
                  disabled={isProcessing}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                
                <button 
                  onClick={confirmDelete}
                  disabled={isProcessing}
                  className="flex-1 py-2.5 bg-[#DC2626] hover:bg-red-700 text-white font-bold text-xs rounded-xl"
                >
                  {isProcessing ? '...' : (isAr ? 'حذف' : 'Delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Checkout = () => {
  const { user } = useAuth();
  const { cartItems } = useCart();
  if (!cartItems || cartItems.length === 0) return <Navigate to="/cart" />;
  return <CheckoutContent key={user ? user._id : 'guest'} />;
};

export default Checkout;