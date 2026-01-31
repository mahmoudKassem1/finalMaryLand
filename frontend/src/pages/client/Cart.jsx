import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useApp } from '../../context/AppContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../utils/axios'; // ✅ Import API to fetch settings
import GlassCard from '../../components/ui/GlassCard';
import SquircleButton from '../../components/ui/SquircleButton';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const { lang } = useApp();
  const navigate = useNavigate();

  // ✅ STATE: Dynamic Delivery Fee (Default to 30 just in case)
  const [deliveryFee, setDeliveryFee] = useState(30);

  // ✅ EFFECT: Fetch Fee from Backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        // Ensure we only update if a valid number comes back
        if (data && typeof data.deliveryFee === 'number') {
          setDeliveryFee(data.deliveryFee);
        }
      } catch (error) {
        console.error("Failed to fetch delivery fee:", error);
      }
    };

    fetchSettings();
  }, []);

  const subtotal = getCartTotal();
  // ✅ LOGIC: Use dynamic deliveryFee state
  const shipping = subtotal > 500 ? 0 : deliveryFee; 
  const total = subtotal + shipping;

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="bg-slate-100 p-8 rounded-full">
          <ShoppingBag size={64} className="text-slate-300" />
        </div>
        <h2 className="text-3xl font-black text-[#0F172A]">
          {lang === 'en' ? 'Your cart is empty' : 'سلة المشتريات فارغة'}
        </h2>
        <p className="text-slate-500 max-w-xs">
          {lang === 'en' ? 'Looks like you haven\'t added any medications yet.' : 'يبدو أنك لم تقم بإضافة أي أدوية بعد.'}
        </p>
        <Link to="/">
          <SquircleButton variant="primary" icon={ArrowLeft}>
            {lang === 'en' ? 'Continue Shopping' : 'العودة للتسوق'}
          </SquircleButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <h1 className="text-4xl font-black text-[#0F172A] uppercase tracking-tight">
        {lang === 'en' ? 'Shopping Cart' : 'سلة المشتريات'}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 1. ITEMS LIST */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <GlassCard key={item._id} className="p-4 sm:p-6 flex items-center gap-4 sm:gap-6 border-transparent hover:border-[#DC2626]/20 transition-all">
              
              {/* Product Image or Placeholder */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden">
                {(item.image || item.imageURL) ? (
                  <img 
                    src={item.image || item.imageURL} 
                    alt={item.title} 
                    className="w-full h-full object-contain mix-blend-multiply p-2" 
                  />
                ) : (
                  <span className="text-3xl">💊</span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black text-[#0F172A] truncate">
                  {item.title}
                </h3>
                <p className="text-[#DC2626] font-mono font-bold text-sm">
                  {item.price} EGP
                </p>
                
                {/* Quantity Controls */}
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center bg-slate-100 rounded-xl px-2 py-1">
                    <button 
                      onClick={() => updateQuantity(item._id, (item.quantity || 1) - 1)} 
                      className="p-1 hover:text-[#DC2626]"
                    >
                      <Minus size={16}/>
                    </button>
                    
                    <span className="px-3 font-black text-sm">{item.quantity || 1}</span>
                    
                    <button 
                      onClick={() => updateQuantity(item._id, (item.quantity || 1) + 1)} 
                      className="p-1 hover:text-[#DC2626]"
                    >
                      <Plus size={16}/>
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => removeFromCart(item._id)} 
                    className="text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="hidden sm:block text-right">
                <p className="text-xl font-black text-[#0F172A]">
                  {item.price * (item.quantity || 1)} <small className="text-[10px]">EGP</small>
                </p>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* 2. ORDER SUMMARY */}
        <div className="lg:col-span-1">
          <GlassCard className="p-8 sticky top-48 bg-[#0F172A] text-white">
            <h3 className="text-xl font-black mb-6 uppercase tracking-widest border-b border-white/10 pb-4">
              {lang === 'en' ? 'Summary' : 'ملخص الطلب'}
            </h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-slate-400 font-bold">
                <span>{lang === 'en' ? 'Subtotal' : 'المجموع'}</span>
                <span>{subtotal} EGP</span>
              </div>
              <div className="flex justify-between text-slate-400 font-bold">
                <span>{lang === 'en' ? 'Shipping' : 'التوصيل'}</span>
                <span>
                  {shipping === 0 
                    ? (lang === 'en' ? 'FREE' : 'مجاني') 
                    : `${shipping} EGP`
                  }
                </span>
              </div>
              <div className="flex justify-between text-xl font-black pt-4 border-t border-white/10">
                <span>{lang === 'en' ? 'Total' : 'الإجمالي'}</span>
                <span className="text-[#DC2626]">{total} EGP</span>
              </div>
            </div>

            <SquircleButton 
              variant="primary" 
              fullWidth 
              icon={ArrowRight}
              onClick={() => navigate('/checkout')}
            >
              {lang === 'en' ? 'Proceed to Checkout' : 'إتمام الطلب'}
            </SquircleButton>

            <p className="text-[10px] text-slate-500 mt-6 text-center font-bold uppercase tracking-tighter">
              {lang === 'en' ? 'Secure encrypted transaction' : 'عملية دفع آمنة ومشفرة'}
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Cart;