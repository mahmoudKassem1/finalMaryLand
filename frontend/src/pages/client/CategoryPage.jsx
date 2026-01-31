import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowRight, Package, Loader2, Grid } from 'lucide-react';
import { toast } from 'react-hot-toast';

import api from '../../utils/axios';
import { useCart } from '../../context/CartContext';
import { useApp } from '../../context/AppContext';

import GlassCard from '../../components/ui/GlassCard';
import SquircleButton from '../../components/ui/SquircleButton';

const CategoryPage = () => {
  const { slug } = useParams(); // Gets 'medication', 'beauty', etc. from URL
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { lang, t } = useApp();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ LOGIC: Start showing only 6 items
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setLoading(true);
      // Reset visible count when category changes
      setVisibleCount(6); 
      
      try {
        const { data } = await api.get('/products');
        
        // Handle new API structure { products: [...] } or old [...]
        const allProducts = data.products || data || [];
        
        // Filter by the category slug from URL
        // We compare lowercase to ensure matches
        const filtered = allProducts.filter(p => 
          p.category && p.category.toLowerCase() === slug.toLowerCase()
        );
        
        setProducts(filtered);
      } catch (error) {
        console.error("Failed to load category", error);
        toast.error(lang === 'en' ? 'Failed to load products' : 'فشل تحميل المنتجات');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [slug, lang]);

  // ✅ LOGIC: Load More Handler
  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 6);
  };

  // ✅ LOGIC: Slice the array to show only visible items
  const visibleProducts = products.slice(0, visibleCount);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 size={40} className="animate-spin mb-4 text-[#DC2626]" />
        <p className="font-bold uppercase tracking-widest">{lang === 'en' ? 'Loading Category...' : 'جاري التحميل...'}</p>
      </div>
    );
  }

  // Helper to format category title (e.g., "personal-care" -> "Personal Care")
  const formatTitle = (str) => {
    if (!str) return '';
    if (str === 'maryland-products') return lang === 'en' ? 'Maryland Products' : 'منتجات ماريلاند';
    return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="space-y-8 animate-fade-in min-h-[60vh] pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-black text-[#0F172A] uppercase tracking-tight flex items-center gap-3">
          <Grid className="text-[#DC2626]" />
          {formatTitle(slug)}
        </h1>
        <p className="text-slate-500 font-medium mt-2">
          {lang === 'en' 
            ? `Browse our collection of ${formatTitle(slug)} items` 
            : `تصفح مجموعتنا من ${formatTitle(slug)}`
          }
        </p>
      </div>

      {/* --- NO PRODUCTS FOUND --- */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-slate-50 rounded-3xl border border-slate-100">
          <Package size={64} className="text-slate-300" />
          <h3 className="text-xl font-bold text-slate-600">
            {lang === 'en' ? 'No products found in this category.' : 'لا توجد منتجات في هذا القسم.'}
          </h3>
          <SquircleButton variant="secondary" onClick={() => navigate('/')}>
             {lang === 'en' ? 'Back to Home' : 'العودة للرئيسية'}
          </SquircleButton>
        </div>
      ) : (
        <>
          {/* --- PRODUCTS GRID --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleProducts.map((product) => (
              <div 
                key={product._id} 
                onClick={() => navigate(`/product/${product._id}`)}
                className="cursor-pointer group h-full"
              >
                <GlassCard className="p-6 h-full flex flex-col justify-between hover:border-[#DC2626]/30 transition-all">
                  <div>
                      <div className="bg-slate-100 rounded-3xl h-48 mb-4 flex items-center justify-center overflow-hidden relative">
                          {/* Image Logic */}
                          {(product.image || product.imageURL) ? (
                              <img 
                                  src={product.image || product.imageURL} 
                                  alt={product.title} 
                                  className="w-full h-full object-contain mix-blend-multiply p-4 group-hover:scale-105 transition-transform duration-500" 
                              />
                          ) : (
                              <div className="text-[#DC2626] font-black opacity-20 text-4xl uppercase">
                                  {product.category?.substring(0,2) || 'RX'}
                              </div>
                          )}
                          
                          {/* Out of Stock Overlay */}
                          {product.stock === 0 && (
                             <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                               <span className="bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-full">
                                 {lang === 'en' ? 'Out of Stock' : 'غير متوفر'}
                               </span>
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
                          disabled={product.stock === 0}
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

          {/* --- LOAD MORE BUTTON --- */}
          {/* Only show if there are more products to show */}
          {visibleCount < products.length && (
            <div className="flex justify-center pt-8">
              <button 
                onClick={handleLoadMore}
                className="group flex items-center gap-2 px-8 py-4 bg-white border-2 border-[#DC2626] text-[#DC2626] rounded-2xl font-black uppercase tracking-widest hover:bg-[#DC2626] hover:text-white transition-all shadow-lg hover:shadow-[#DC2626]/30"
              >
                {lang === 'en' ? 'Load More Products' : 'تحميل المزيد من المنتجات'}
                <ArrowRight size={20} className={`transition-transform duration-300 ${lang === 'en' ? 'group-hover:translate-x-1' : 'group-hover:-translate-x-1 rotate-180'}`} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CategoryPage;