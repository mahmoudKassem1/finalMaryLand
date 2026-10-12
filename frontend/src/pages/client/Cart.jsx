import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useApp } from '../../context/AppContext';
import SquircleButton from '../../components/ui/SquircleButton';
import Breadcrumbs from '../../components/navigation/Breadcrumbs';
import BackButton from '../../components/navigation/BackButton';
import { formatPrice, hasValidPrice } from '../../utils/formatPrice';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, getCartCount, getCartTotal } = useCart();
  const { lang } = useApp();
  const isAr = lang === 'ar';
  const totalUnits = getCartCount();
  const subtotal = getCartTotal();
  const hasAllPrices = cartItems.every((item) => hasValidPrice(item.price));

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] max-w-6xl mx-auto px-4 pb-20" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between gap-3 mb-8"><Breadcrumbs /><BackButton fallback="/" label={isAr ? 'الرئيسية' : 'Home'} /></div>
        <div className="flex flex-col items-center justify-center gap-5 text-center py-16">
          <div className="bg-slate-100 p-7 rounded-full"><ShoppingBag size={56} className="text-slate-400" /></div>
          <h2 className="text-2xl font-black text-slate-900">{isAr ? 'سلة المشتريات فارغة' : 'Your cart is empty'}</h2>
          <p className="text-slate-500 max-w-sm">{isAr ? 'أضف منتجات إلى سلتك لبدء الطلب.' : 'Add products to your cart to get started.'}</p>
          <Link to="/"><SquircleButton variant="primary" className="!py-3 !px-7">{isAr ? 'متابعة التسوق' : 'Continue Shopping'}</SquircleButton></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-7 pb-20 px-3 sm:px-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between gap-3"><Breadcrumbs /><BackButton fallback="/" label={isAr ? 'رجوع' : 'Back'} /></div>
      <header className="flex items-end justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{isAr ? 'سلة المشتريات' : 'Shopping Cart'}</h1>
          <p className="mt-1 text-sm text-slate-500">{isAr ? 'راجع المنتجات والأسعار والكميات قبل إتمام الطلب.' : 'Review your products, prices, and quantities before checkout.'}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">{cartItems.length} {isAr ? 'منتجات' : 'products'}</span>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <section className="lg:col-span-2 space-y-3" aria-label={isAr ? 'منتجات السلة' : 'Cart items'}>
          {cartItems.map((item) => {
            const quantity = Number(item.quantity) || 1;
            const priceAvailable = hasValidPrice(item.price);
            return (
              <article key={item._id} className="flex items-center gap-3 sm:gap-5 rounded-2xl border border-slate-200 bg-white p-3 sm:p-5 shadow-sm">
                <div className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                  {item.image ? <img src={item.image} alt={item.title} className="h-full w-full object-contain p-2" /> : <div className="grid h-full place-items-center text-2xl">💊</div>}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="line-clamp-2 text-sm sm:text-base font-bold text-slate-900">{item.title}</h2>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{isAr ? 'سعر الوحدة' : 'Unit price'}: <span className="font-black text-[#DC2626]">{priceAvailable ? formatPrice(item.price, lang) : (isAr ? 'جارٍ تحميل السعر' : 'Loading price')}</span></p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500">{isAr ? 'إجمالي المنتج' : 'Line total'}: <span className="font-black text-slate-800">{priceAvailable ? formatPrice(item.price * quantity, lang) : '—'}</span></p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                    <button type="button" aria-label={isAr ? 'تقليل الكمية' : 'Decrease quantity'} onClick={() => updateQuantity(item._id, quantity - 1)} disabled={quantity <= 1} className="rounded-lg p-1.5 text-slate-600 hover:bg-white hover:text-red-600 disabled:opacity-30"><Minus size={15} /></button>
                    <span className="w-8 text-center text-sm font-black text-slate-900">{quantity}</span>
                    <button type="button" aria-label={isAr ? 'زيادة الكمية' : 'Increase quantity'} onClick={() => updateQuantity(item._id, quantity + 1)} className="rounded-lg p-1.5 text-slate-600 hover:bg-white hover:text-red-600"><Plus size={15} /></button>
                  </div>
                  <button type="button" onClick={() => removeFromCart(item._id)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={14} />{isAr ? 'إزالة' : 'Remove'}</button>
                </div>
              </article>
            );
          })}
        </section>

        <aside className="sticky top-28 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-lg space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-black text-slate-900">{isAr ? 'ملخص السلة' : 'Cart Summary'}</h2>
            <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{totalUnits} {isAr ? 'وحدات' : 'units'}</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between gap-3 text-sm font-semibold text-slate-600"><span>{isAr ? 'المجموع الفرعي' : 'Subtotal'}</span><span className="font-black text-slate-900">{hasAllPrices ? formatPrice(subtotal, lang) : (isAr ? 'جارٍ تحميل الأسعار' : 'Loading prices')}</span></div>
            <div className="flex justify-between gap-3 text-xs text-slate-500"><span>{isAr ? 'رسوم التوصيل' : 'Delivery fee'}</span><span className="text-end">{isAr ? 'تُحدد بعد إرسال الطلب' : 'Confirmed after order submission'}</span></div>
            <p className="rounded-xl bg-blue-50 p-3 text-xs leading-relaxed text-blue-900">{isAr ? 'سيتم تأكيد رسوم التوصيل حسب منطقتك عبر واتساب بعد إرسال الطلب.' : 'Your delivery fee will be confirmed on WhatsApp after you submit your order.'}</p>
          </div>
          <Link to="/checkout" className="block">
            <SquircleButton variant="primary" fullWidth disabled={!hasAllPrices} className="!py-3.5 !rounded-2xl">
              <span className="flex items-center justify-center gap-2">{isAr ? 'متابعة إلى إتمام الطلب' : 'Continue to Checkout'}<ArrowRight size={17} className={isAr ? 'rotate-180' : ''} /></span>
            </SquircleButton>
          </Link>
          <div className="flex items-center justify-center gap-1.5 text-center text-[11px] font-medium text-slate-500"><CheckCircle2 size={14} className="shrink-0 text-emerald-600" />{isAr ? 'ستظهر تفاصيل الأسعار في رسالة تأكيد الطلب.' : 'Product prices will be included in your order message.'}</div>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
