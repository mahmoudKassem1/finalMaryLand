import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useApp } from '../../context/AppContext';
import { Link } from 'react-router-dom';
import SquircleButton from '../../components/ui/SquircleButton';
import { 
  Trash2, Plus, Minus, ShoppingBag, ArrowLeft, 
  MessageCircle, HelpCircle, ChevronDown, CheckCircle2,
  ArrowRight
} from 'lucide-react';
import Breadcrumbs from '../../components/navigation/Breadcrumbs';
import BackButton from '../../components/navigation/BackButton';

const WHATSAPP_NUMBER = '201000076890';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, getCartCount } = useCart();
  const { lang } = useApp();

  const [isSummaryInfoOpen, setIsSummaryInfoOpen] = useState(false);

  // Robust language check
  const isAr = !lang || String(lang).toLowerCase().startsWith('ar');
  const totalUnits = getCartCount();

  // Secondary quick price inquiry
  const inquireViaWhatsApp = () => {
    let message = '';

    if (isAr) {
      const itemsList = cartItems
        .map((item, idx) => `${idx + 1}. ${item.title} (الكمية: ${item.quantity || 1})`)
        .join('\n');

      message = `مرحباً صيدلية ماريلاند، أود فقط الاستفسار المبدئي عن أسعار هذه الأصناف قبل تأكيد الطلب:\n\nالأصناف:\n${itemsList}\n\nإجمالي الوحدات: ${totalUnits}\nشكراً لكم!`;
    } else {
      const itemsList = cartItems
        .map((item, idx) => `${idx + 1}. ${item.title} (Qty: ${item.quantity || 1})`)
        .join('\n');

      message = `Hello Maryland Pharmacy, I would just like a quick price check for these items before placing my order:\n\nItems:\n${itemsList}\n\nTotal Units: ${totalUnits}\nThank you!`;
    }

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // --- EMPTY CART VIEW ---
  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] max-w-6xl mx-auto px-4 pb-20 animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between gap-3 mb-8">
          <Breadcrumbs />
          <BackButton fallback="/" label={isAr ? 'الرئيسية' : 'Home'} />
        </div>
        <div className="flex flex-col items-center justify-center space-y-6 text-center py-12">
          <div className="bg-slate-100 p-8 rounded-full shadow-inner">
            <ShoppingBag size={64} className="text-slate-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            {isAr ? 'سلة المشتريات فارغة' : 'Your cart is empty'}
          </h2>
          <p className="text-slate-500 max-w-sm text-sm sm:text-base font-medium">
            {isAr ? 'يبدو أنك لم تقم بإضافة أي أصناف أو أدوية بعد.' : "Looks like you haven't added any medications or products yet."}
          </p>
          <Link to="/">
            <SquircleButton 
              variant="primary" 
              className="!py-3.5 !px-8 !rounded-2xl shadow-md hover:shadow-red-500/20 active:scale-95 transition-all text-sm font-bold tracking-tight"
            >
              <span>{isAr ? 'العودة للتسوق' : 'Continue Shopping'}</span>
            </SquircleButton>
          </Link>
        </div>
      </div>
    );
  }

  // --- ACTIVE CART VIEW ---
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20 px-3 sm:px-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between gap-3">
        <Breadcrumbs />
        <BackButton fallback="/" label={isAr ? 'رجوع' : 'Back'} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">
            {isAr ? 'سلة المشتريات والاستفسار' : 'Cart & Inquiry List'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {isAr ? 'راجع الأصناف وحدد الكميات قبل الانتقال للتأكيد' : 'Review items and adjust quantities before proceeding'}
          </p>
        </div>
        <span className="text-xs sm:text-sm font-black text-slate-700 bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full">
          {isAr ? `${cartItems.length} أصناف` : `${cartItems.length} items`}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* 1. ITEMS LIST */}
        <div className="lg:col-span-2 space-y-3.5">
          {cartItems.map((item) => (
            <div 
              key={item._id} 
              className="p-4 sm:p-5 flex items-center justify-between gap-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 transition-all"
            >
              {/* Product Visual & Details */}
              <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 overflow-hidden">
                  {(item.image || item.imageURL) ? (
                    <img 
                      src={item.image || item.imageURL} 
                      alt={item.title} 
                      className="w-full h-full object-contain p-2" 
                    />
                  ) : (
                    <span className="text-2xl">💊</span>
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-2 leading-snug">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>{isAr ? 'السعر يتحدد مع الصيدلي' : 'Price confirmed on request'}</span>
                  </div>
                </div>
              </div>

              {/* Quantity Controls & Remove Action */}
              <div className="flex items-center gap-3 sm:gap-5 shrink-0">
                <div className="flex items-center bg-slate-100 border border-slate-200/80 rounded-xl px-1.5 py-1">
                  <button 
                    onClick={() => updateQuantity(item._id, (item.quantity || 1) - 1)} 
                    className="p-1 text-slate-600 hover:text-red-600 transition-colors disabled:opacity-30"
                    disabled={(item.quantity || 1) <= 1}
                  >
                    <Minus size={14} />
                  </button>
                  
                  <span className="w-7 text-center font-black text-xs sm:text-sm text-slate-900">
                    {item.quantity || 1}
                  </span>
                  
                  <button 
                    onClick={() => updateQuantity(item._id, (item.quantity || 1) + 1)} 
                    className="p-1 text-slate-600 hover:text-red-600 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button 
                  onClick={() => removeFromCart(item._id)} 
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  title={isAr ? 'حذف الصنف' : 'Remove item'}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 2. ORDER SUMMARY */}
        <div className="lg:col-span-1 sticky top-28 space-y-4">
          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-lg space-y-5">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3.5 flex items-center justify-between">
              <span>{isAr ? 'ملخص القائمة' : 'Inquiry Summary'}</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {isAr ? 'طلب مجمع' : 'Bulk Order'}
              </span>
            </h3>

            {/* Metrics */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs sm:text-sm font-semibold text-slate-600">
                <span>{isAr ? 'عدد الأصناف' : 'Unique Items'}</span>
                <span className="font-black text-slate-900">{cartItems.length}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm font-semibold text-slate-600">
                <span>{isAr ? 'إجمالي القطع والوحدات' : 'Total Units'}</span>
                <span className="font-black text-slate-900">{totalUnits}</span>
              </div>

              {/* Collapsible Info Notice */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 transition-all mt-4">
                <button
                  type="button"
                  onClick={() => setIsSummaryInfoOpen(!isSummaryInfoOpen)}
                  className="w-full flex items-center justify-between text-left text-xs font-bold text-emerald-900 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <HelpCircle size={15} className="text-emerald-700" />
                    <span>{isAr ? 'كيف يتم معرفة الأسعار؟' : 'How does pricing work?'}</span>
                  </span>
                  <ChevronDown 
                    size={14} 
                    className={`text-emerald-700 transition-transform duration-300 ${isSummaryInfoOpen ? 'rotate-180' : ''}`} 
                  />
                </button>

                <div className={`grid transition-all duration-300 ease-in-out ${
                  isSummaryInfoOpen ? 'grid-rows-[1fr] opacity-100 mt-2.5 pt-2.5 border-t border-emerald-200/70' : 'grid-rows-[0fr] opacity-0'
                }`}>
                  <p className="overflow-hidden text-[11px] leading-relaxed text-emerald-800 font-medium">
                    {isAr
                      ? 'قم بمتابعة إتمام الطلب لتسجيل العنوان ورقم هاتفك، وسيقوم صيدلي ماريلاند بمراسلتك بالأسعار المحدثة والتأكيد فوراً.'
                      : 'Proceed to enter your delivery address and phone number, and a Maryland pharmacist will message you immediately with live prices and confirmation.'}
                  </p>
                </div>
              </div>
            </div>

            {/* --- ACTION BUTTONS HIERARCHY --- */}
            <div className="space-y-2.5 pt-2">
              {/* PRIMARY PROMINENT CTA: Leads to Checkout */}
              <Link to="/checkout" className="w-full block">
                <SquircleButton 
                  variant="primary" 
                  fullWidth 
                  className="!py-3.5 !rounded-2xl shadow-lg hover:shadow-red-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span className="text-xs sm:text-sm font-black tracking-tight">
                    {isAr ? 'متابعة بيانات التوصيل وتأكيد الطلب' : 'Proceed to Delivery & Order'}
                  </span>
                  <ArrowRight size={17} className={isAr ? 'rotate-180' : ''} />
                </SquircleButton>
              </Link>

              {/* SECONDARY DISCRETE BUTTON: For quick casual price inquiries */}
              <button
                type="button"
                onClick={inquireViaWhatsApp}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95"
              >
                <MessageCircle size={15} className="text-emerald-600" />
                <span>{isAr ? 'استفسار سريع عن الأسعار فقط (واتساب)' : 'Quick price check only (WhatsApp)'}</span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium pt-2 text-center">
              <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
              <span>{isAr ? 'تسجيل آمن — الدفع والتأكيد مع الصيدلي' : 'Safe ordering — Payment verified with pharmacist'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;