import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, ArrowRight, AlertCircle, Loader2, Home } from 'lucide-react';
import { toast } from 'react-hot-toast';

import api from '../../utils/axios';
import { useCart } from '../../context/CartContext';
import { useApp } from '../../context/AppContext';

import GlassCard from '../../components/ui/GlassCard';
import SquircleButton from '../../components/ui/SquircleButton';

const SearchPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { search } = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(search).get('q') || ''; 
  
  const { addToCart } = useCart();
  const { lang, t } = useApp();

  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/products');
        
        // ✅ FIX 1: Handle the new API structure { products: [...] }
        const allProducts = data.products || data;
        
        // Safety check: Ensure rendering doesn't crash if data isn't an array
        const productArray = Array.isArray(allProducts) ? allProducts : [];

        const filtered = productArray.filter(p => 
          (p.title && p.title.toLowerCase().includes(query.toLowerCase())) || 
          (p.category && p.category.toLowerCase().includes(query.toLowerCase()))
        );
        
        setProducts(filtered);
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      fetchSearchResults();
    }
  }, [query]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 size={40} className="animate-spin mb-4 text-[#DC2626]" />
        <p className="font-bold uppercase tracking-widest">{lang === 'en' ? 'Searching...' : 'جاري البحث...'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in min-h-[60vh]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black text-[#0F172A] uppercase tracking-tight flex items-center gap-3">
          <Search className="text-[#DC2626]" />
          {lang === 'en' ? 'Search Results' : 'نتائج البحث'}
        </h1>
        <p className="text-slate-500 font-medium mt-2">
          {lang === 'en' ? `Showing results for: ` : `نتائج البحث عن: `} 
          <span className="text-[#DC2626] font-black">"{query}"</span>
        </p>
      </div>

      {/* --- LOGIC: NO MATCH FOUND --- */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-6 bg-slate-50 rounded-3xl border border-slate-100">
          <div className="bg-white p-6 rounded-full shadow-lg">
             <AlertCircle size={64} className="text-slate-300" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#0F172A]">
               {lang === 'en' ? "We couldn't find any matches." : "لم نتمكن من العثور على أي منتجات."}
            </h2>
            <p className="text-slate-500 max-w-md mx-auto">
               {lang === 'en' 
                 ? `Double check your spelling or try searching for a different keyword like "Panadol" or "Vitamin".`
                 : `تأكد من الكتابة الصحيحة أو حاول البحث بكلمات أخرى مثل "بنادول" أو "فيتامين".`
               }
            </p>
          </div>
          <SquircleButton 
            variant="secondary" 
            icon={Home} 
            onClick={() => navigate('/')}
          >
            {lang === 'en' ? 'Back to Home' : 'العودة للرئيسية'}
          </SquircleButton>
        </div>
      ) : (
        /* --- LOGIC: RESULTS GRID --- */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div 
              key={product._id} 
              // ✅ Updated Navigation to match other pages
              onClick={() => navigate(`/product/${product._id}`)}
              className="cursor-pointer group h-full"
            >
              <GlassCard className="p-6 h-full flex flex-col justify-between hover:border-[#DC2626]/30 transition-all">
                <div>
                    <div className="bg-slate-100 rounded-3xl h-48 mb-4 flex items-center justify-center overflow-hidden">
                        {/* ✅ FIX 2: Check 'image' OR 'imageURL' */}
                        {(product.image || product.imageURL) ? (
                            <img 
                                src={product.image || product.imageURL} 
                                alt={product.title} 
                                className="w-full h-full object-contain mix-blend-multiply p-4" 
                            />
                        ) : (
                            <div className="text-[#DC2626] font-black opacity-20 text-4xl">
                                {product.category ? product.category.substring(0,2) : 'RX'}
                            </div>
                        )}
                    </div>
                    <h3 className="text-lg font-black text-[#0F172A] line-clamp-2 mb-2">{product.title}</h3>
                    <p className="text-[#DC2626] font-mono font-black text-lg">{product.price} EGP</p>
                </div>
                
                <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                    <SquircleButton 
                        variant="primary" 
                        fullWidth 
                        icon={ShoppingCart}
                        onClick={() => {
                            addToCart(product);
                            toast.success(lang === 'en' ? 'Added to cart' : 'تم الإضافة');
                        }}
                    >
                        {t.add_to_cart || (lang === 'en' ? 'Add' : 'أضف')}
                    </SquircleButton>
                </div>
              </GlassCard>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPage;