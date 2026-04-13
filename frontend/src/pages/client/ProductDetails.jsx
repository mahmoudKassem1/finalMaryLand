import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowRight, ShieldCheck, ArrowLeft, Truck, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

import GlassCard from '../../components/ui/GlassCard';
import SquircleButton from '../../components/ui/SquircleButton';
import { useCart } from '../../context/CartContext';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/axios'; 

const ProductDetails = () => {
  const { id } = useParams(); 
  const { addToCart } = useCart();
  const { lang, t } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();

  // 1. State for Data
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 2. Fetch Product Logic
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/products/${id}`);
        // Support both naming conventions just in case
        setProduct({
            ...data,
            image: data.image || data.imageURL 
        });
      } catch (err) {
        console.error("Fetch Error:", err);
        setError("Product not found or deleted");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleCheckout = () => {
    if (!product) return;
    
    addToCart(product);
    toast.success(lang === 'en' ? 'Added to cart' : 'تم الإضافة للسلة');

    if (!user) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
    } else {
      navigate('/checkout');
    }
  };

  // 3. Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <Loader2 size={40} className="animate-spin mb-4 text-[#DC2626]" />
        <p className="font-bold tracking-widest uppercase text-sm">Loading...</p>
      </div>
    );
  }

  // 4. Error State
  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <AlertCircle size={40} className="mb-4 text-red-500" />
        <p className="font-bold">{lang === 'en' ? 'Product not found' : 'المنتج غير موجود'}</p>
        <button onClick={() => navigate('/')} className="mt-4 underline hover:text-[#DC2626]">
          {t.back_to_shop || 'Go Home'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[#0F172A] font-bold hover:text-[#DC2626] transition-all group"
      >
        {lang === 'en' ? (
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        ) : (
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        )}
        <span>{t.back_to_shop || (lang === 'en' ? 'Back to Shop' : 'العودة للمتجر')}</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* ✅ LEFT: Image Section (Updated for Perfect Dimensions) */}
        <div className="relative">
          {/* Decorative Red Blur behind image */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-[#DC2626]/20 rounded-full blur-[80px] -z-10" />
          
          <GlassCard className="p-4 sm:p-8 flex flex-col items-center justify-center border-0 bg-white/50 backdrop-blur-xl">
            <div className="w-full relative rounded-3xl overflow-hidden bg-white shadow-sm border border-slate-100">
              {/* Aspect Ratio Container (Square by default, adapts to content) */}
              <div className="aspect-square w-full flex items-center justify-center p-4">
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.title} 
                    className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-300">
                    <span className="text-6xl mb-2">💊</span>
                    <span className="text-xs font-bold uppercase tracking-widest">No Image</span>
                  </div>
                )}
              </div>

              {/* Branding Tag Overlay */}
              {product.isMaryland && (
                <div className="absolute top-4 left-4 bg-[#DC2626] text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg z-10">
                   EXCLUSIVE
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* RIGHT: Details Section */}
        <div className="space-y-8 pt-4">
          <div>
            <span className="bg-[#DC2626]/10 text-[#DC2626] px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-[#DC2626]/20">
              {product.category || 'Pharmacy'}
            </span>
            <h1 className="text-4xl sm:text-5xl font-black mt-6 text-[#0F172A] leading-tight">
              {product.title}
            </h1>
            <div className="flex items-baseline gap-2 mt-4">
               <p className="text-5xl font-mono font-black text-[#DC2626]">{product.price}</p>
               <span className="font-bold text-xl text-[#0F172A]">{t.egp || (lang === 'en' ? 'EGP' : 'ج.م')}</span>
            </div>
          </div>

          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed text-lg">
              {product.description || (lang === 'en' 
                ? `High-quality pharmaceutical grade product exclusively formulated for Maryland Pharmacy.`
                : `منتج عالي الجودة تم تركيبه خصيصاً لصيدلية ماريلاند.`
              )}
            </p>
          </div>

          {/* Info Badges */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`flex items-center gap-3 p-4 rounded-2xl border ${product.stock > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
              <ShieldCheck className={product.stock > 0 ? "text-emerald-600" : "text-red-600"} />
              <div className="flex flex-col">
                <span className={`font-bold text-xs ${product.stock > 0 ? "text-emerald-700" : "text-red-700"}`}>
                    {lang === 'en' ? 'Availability' : 'التوفر'}
                </span>
                <span className={`text-sm font-bold ${product.stock > 0 ? "text-emerald-900" : "text-red-900"}`}>
                  {product.stock > 0 
                    ? (lang === 'en' ? 'In Stock' : 'متوفر')
                    : (lang === 'en' ? 'Out of Stock' : 'غير متوفر')
                  }
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <Truck className="text-blue-600" />
              <div className="flex flex-col">
                <span className="text-blue-700 font-bold text-xs">
                    {lang === 'en' ? 'Shipping' : 'الشحن'}
                </span>
                <span className="text-blue-900 font-bold text-sm">
                    {t.express_delivery || (lang === 'en' ? 'Fast Delivery' : 'توصيل سريع')}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-200">
            <SquircleButton 
              variant="secondary" 
              className="flex-1 !py-5 shadow-lg border-2 border-slate-100" 
              icon={ShoppingCart}
              onClick={() => {
                addToCart(product);
                toast.success(lang === 'en' ? 'Added to cart' : 'تم الإضافة للسلة');
              }}
              disabled={product.stock === 0}
            >
              {t.add_to_cart || (lang === 'en' ? 'Add to Cart' : 'أضف للسلة')}
            </SquircleButton>
            
            <SquircleButton 
              variant="primary" 
              className="flex-1 !py-5 shadow-xl shadow-red-900/20" 
              icon={ArrowRight}
              onClick={handleCheckout}
              disabled={product.stock === 0}
            >
              {t.checkout || (lang === 'en' ? 'Buy Now' : 'شراء الآن')}
            </SquircleButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;