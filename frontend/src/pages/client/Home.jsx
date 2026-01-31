import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShoppingCart, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { useApp } from '../../context/AppContext';
import { useCart } from '../../context/CartContext';
import api from '../../utils/axios'; // Import backend bridge

import GlassCard from '../../components/ui/GlassCard';
import SquircleButton from '../../components/ui/SquircleButton';

const Home = () => {
  const { t, lang } = useApp();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { categoryName } = useParams();

  // 1. State for Data & UI
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- NEW: PAGINATION STATE ---
  const [visibleCount, setVisibleCount] = useState(6);
  const PRODUCTS_PER_PAGE = 6;

  // 2. Fetch Products from Backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Fetch ALL products from backend
        const { data } = await api.get('/products');
        // Handle both formats: { products: [...] } OR [...]
        setProducts(data.products || data); 
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []); // Runs once on mount

  // --- NEW: Reset pagination when category changes ---
  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_PAGE);
  }, [categoryName]);

  // 3. Filter & Sort Logic (Client Side)
  // Logic: If 'categoryName' exists in URL (e.g., /category/beauty), filter by it.
  // Otherwise, show all.
  const filteredProducts = products
    .filter(p => !categoryName || p.category === categoryName)
    .sort((a) => (a.isMaryland ? -1 : 1)); // Show Maryland products first

  // --- NEW: Sliced products for pagination ---
  const visibleProducts = filteredProducts.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + PRODUCTS_PER_PAGE);
  };

  // 4. Loading State UI
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-slate-400">
        <Loader2 size={40} className="animate-spin mb-4 text-[#DC2626]" />
        <p className="font-bold tracking-widest uppercase text-sm">Loading Products...</p>
      </div>
    );
  }

  // 5. Error State UI
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-red-500">
        <AlertCircle size={40} className="mb-4" />
        <p className="font-bold">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 text-slate-600 underline text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-[#0F172A] uppercase tracking-tight">
            {!categoryName ? (lang === 'en' ? "Maryland Exclusive" : "حصري ماريلاند") : (t[`cat_${categoryName}`] || categoryName)}
          </h1>
          <p className="text-[#DC2626] font-bold text-sm mt-1">
            {lang === 'en' ? "Trusted Pharmaceutical Solutions" : "حلول صيدلانية موثوقة"}
          </p>
        </div>
      </div>
      
      {/* Empty State (If no products match filter) */}
      {filteredProducts.length === 0 ? (
        <div className="p-10 text-center text-slate-400 font-bold bg-white/50 rounded-3xl border border-white/60">
          {lang === 'en' ? "No products found in this category." : "لا توجد منتجات في هذا القسم."}
        </div>
      ) : (
        <>
          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleProducts.map((product) => (
              <div 
                key={product._id} // MongoDB uses _id
                onClick={() => {
                  navigate(`/category/${product.category}/${product._id}`);
                }}
                className="h-full cursor-pointer group"
              >
                <GlassCard 
                  className="p-6 flex flex-col justify-between h-full transition-all duration-300 hover:border-[#DC2626]/50 hover:shadow-xl hover:shadow-red-500/5"
                >
                  {/* Top Content: Non-interactive */}
                  <div className="pointer-events-none">
                    {/* Image / Placeholder Area */}
                    <div className="bg-slate-100 rounded-3xl h-48 mb-4 flex items-center justify-center relative overflow-hidden transition-transform duration-500 group-hover:scale-[1.02]">
                      
                      {/* If product has imageURL OR image, show it. Else show Placeholder */}
                      {(product.imageURL || product.image) ? (
                        <img 
                          src={product.imageURL || product.image} 
                          alt={product.title} 
                          className="w-full h-full object-contain p-4 mix-blend-multiply"
                        />
                      ) : (
                        <div className="text-[#DC2626] font-black opacity-20 text-4xl select-none">
                          {product.category?.substring(0,2).toUpperCase()}
                        </div>
                      )}

                      {/* Maryland Badge */}
                      {product.isMaryland && (
                        <span className="absolute top-4 left-4 bg-[#DC2626] text-white text-[10px] px-3 py-1 rounded-full font-black tracking-widest animate-pulse shadow-lg shadow-red-500/20">
                          MARYLAND BRAND
                        </span>
                      )}
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-xl font-black mb-1 text-[#0F172A] line-clamp-2">
                      {product.title}
                    </h3>
                    
                    {/* Price */}
                    <p className="text-[#DC2626] font-mono font-black text-lg mb-6">
                      {product.price} <small className="text-[10px]">{lang === 'en' ? 'EGP' : 'ج.م'}</small>
                    </p>
                  </div>

                  {/* Action Area */}
                  <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
                    <SquircleButton 
                      variant="primary" 
                      fullWidth 
                      icon={ShoppingCart}
                      onClick={(e) => {
                        e.stopPropagation(); 
                        addToCart(product);
                        // Added Toast for better UX
                        toast.success(lang === 'en' ? 'Added to cart' : 'تم الإضافة للسلة');
                      }}
                    >
                      {t.cart || (lang === 'en' ? "Add to Cart" : "أضف للسلة")}
                    </SquircleButton>
                  </div>
                </GlassCard>
              </div>
            ))}
          </div>

          {/* --- NEW: LOAD MORE BUTTON --- */}
          {visibleCount < filteredProducts.length && (
            <div className="text-center mt-12">
              <SquircleButton
                variant="secondary"
                onClick={handleLoadMore}
                className="!px-12 !py-4 text-sm font-bold"
              >
                {t.load_more || (lang === 'en' ? 'Load More' : 'تحميل المزيد')}
              </SquircleButton>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;