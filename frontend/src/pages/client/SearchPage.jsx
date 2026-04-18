import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, AlertCircle, Loader2, Home, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

import api from '../../utils/axios';
import { useCart } from '../../context/CartContext';
import { useApp } from '../../context/AppContext';

import GlassCard from '../../components/ui/GlassCard';
import SquircleButton from '../../components/ui/SquircleButton';

const SearchPage = () => {
  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(false);
  const [currentPage, setCurrentPage]   = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const { search } = useLocation();
  const navigate   = useNavigate();
  const query      = new URLSearchParams(search).get('q') || '';

  const { addToCart } = useCart();
  const { lang, t }   = useApp();

  // Reset to page 1 whenever the search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  useEffect(() => {
    if (!query.trim()) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const fetchSearchResults = async () => {
      setLoading(true);
      setError(false);

      try {
        // ✅ Server does the real search across title + category + description
        // with pagination — no downloading the whole DB
        const { data } = await api.get(
          `/products?search=${encodeURIComponent(query.trim())}&page=${currentPage}&limit=12`
        );

        const allProducts = Array.isArray(data) ? data : (data.products || []);
        setProducts(allProducts);
        setTotalPages(data.pages || 1);
        setTotalResults(data.total || allProducts.length);
      } catch (err) {
        console.error('Search failed:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 size={40} className="animate-spin mb-4 text-[#DC2626]" />
        <p className="font-bold uppercase tracking-widest">
          {lang === 'en' ? 'Searching...' : 'جاري البحث...'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400 space-y-4">
        <AlertCircle size={40} className="text-red-400" />
        <p className="font-bold">
          {lang === 'en' ? 'Something went wrong. Please try again.' : 'حدث خطأ. يرجى المحاولة مرة أخرى.'}
        </p>
        <SquircleButton variant="secondary" icon={Home} onClick={() => navigate('/')}>
          {lang === 'en' ? 'Back to Home' : 'العودة للرئيسية'}
        </SquircleButton>
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
          {lang === 'en' ? 'Showing results for: ' : 'نتائج البحث عن: '}
          <span className="text-[#DC2626] font-black">"{query}"</span>
          {totalResults > 0 && (
            <span className="text-slate-400 font-normal ml-2">
              ({totalResults} {lang === 'en' ? 'found' : 'نتيجة'})
            </span>
          )}
        </p>
      </div>

      {/* No Results */}
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
                ? `Double check your spelling or try a different keyword like "Panadol" or "Vitamin".`
                : `تأكد من الكتابة الصحيحة أو حاول البحث بكلمات أخرى مثل "بنادول" أو "فيتامين".`}
            </p>
          </div>
          <SquircleButton variant="secondary" icon={Home} onClick={() => navigate('/')}>
            {lang === 'en' ? 'Back to Home' : 'العودة للرئيسية'}
          </SquircleButton>
        </div>
      ) : (
        <>
          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                onClick={() => navigate(`/product/${product._id}`)}
                className="cursor-pointer group h-full"
              >
                <GlassCard className="p-6 h-full flex flex-col justify-between hover:border-[#DC2626]/30 transition-all">
                  <div>
                    <div className="bg-slate-100 rounded-3xl h-48 mb-4 flex items-center justify-center overflow-hidden relative">
                      {(product.image || product.imageURL) ? (
                        <img
                          src={product.image || product.imageURL}
                          alt={product.title}
                          className="w-full h-full object-contain mix-blend-multiply p-4 group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="text-[#DC2626] font-black opacity-20 text-4xl uppercase">
                          {product.category?.substring(0, 2) || 'RX'}
                        </div>
                      )}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 font-black text-sm uppercase tracking-tight
                  transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed
                  border-slate-200 text-slate-500 hover:border-[#DC2626] hover:text-[#DC2626]
                  disabled:hover:border-slate-200 disabled:hover:text-slate-500"
              >
                {lang === 'en' ? <><ChevronLeft size={16} /> Prev</> : <>السابق <ChevronRight size={16} /></>}
              </button>

              <span className="px-3 py-2 text-sm font-bold text-slate-500">
                {lang === 'en' ? `Page ${currentPage} of ${totalPages}` : `صفحة ${currentPage} من ${totalPages}`}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 font-black text-sm uppercase tracking-tight
                  transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed
                  border-slate-200 text-slate-500 hover:border-[#DC2626] hover:text-[#DC2626]
                  disabled:hover:border-slate-200 disabled:hover:text-slate-500"
              >
                {lang === 'en' ? <>Next <ChevronRight size={16} /></> : <><ChevronLeft size={16} /> التالي</>}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchPage;