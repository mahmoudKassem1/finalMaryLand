import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, ArrowRight, Package, Loader2, Grid, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

import api from '../../utils/axios';
import { useCart } from '../../context/CartContext';
import { useApp } from '../../context/AppContext';

import GlassCard from '../../components/ui/GlassCard';
import SquircleButton from '../../components/ui/SquircleButton';

const PRODUCTS_PER_PAGE = 6;

const CategoryPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { lang, t } = useApp();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setLoading(true);
      setCurrentPage(1);

      try {
        const { data } = await api.get(`/products?category=${slug}`);
        const allProducts = data.products || data || [];
        setProducts(allProducts);
      } catch (error) {
        console.error("Failed to load category", error);
        toast.error(lang === 'en' ? 'Failed to load products' : 'فشل تحميل المنتجات');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [slug, lang]);

  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const visibleProducts = products.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatTitle = (str) => {
    if (!str) return '';
    if (str === 'maryland-products') return lang === 'en' ? 'Maryland Products' : 'منتجات ماريلاند';
    return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Build page number array with ellipsis: [1, '...', 4, 5, 6, '...', 12]
  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    if (currentPage > 3) { pages.push(1); if (currentPage > 4) pages.push('...'); }
    for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) { if (currentPage < totalPages - 3) pages.push('...'); pages.push(totalPages); }
    return pages;
  };

  return (
    <div className="space-y-6 animate-fade-in min-h-[60vh] pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>

      {/* Back to Home */}
      <div className="flex items-center">
        <Link
          to="/"
          className="group flex items-center gap-2 text-slate-500 hover:text-[#DC2626] transition-colors font-bold text-sm uppercase tracking-tighter"
        >
          {lang === 'en' ? (
            <>
              <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </>
          ) : (
            <>
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              العودة للرئيسية
            </>
          )}
        </Link>
      </div>

      {/* Page Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-black text-[#0F172A] uppercase tracking-tight flex items-center gap-3">
          <Grid className="text-[#DC2626]" />
          {formatTitle(slug)}
        </h1>
        <p className="text-slate-500 font-medium mt-2">
          {lang === 'en'
            ? `Browse our collection of ${formatTitle(slug)} items`
            : `تصفح مجموعتنا من ${formatTitle(slug)}`}
        </p>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-slate-400">
          <Loader2 size={40} className="animate-spin mb-4 text-[#DC2626]" />
          <p className="font-bold uppercase tracking-widest">
            {lang === 'en' ? 'Loading Category...' : 'جاري التحميل...'}
          </p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-slate-50 rounded-3xl border border-slate-100">
          <Package size={64} className="text-slate-300" />
          <h3 className="text-xl font-bold text-slate-600">
            {lang === 'en' ? 'No products found in this category.' : 'لا توجد منتجات في هذا القسم.'}
          </h3>
          <SquircleButton variant="secondary" onClick={() => navigate('/')}>
            {lang === 'en' ? 'Explore Other Categories' : 'استكشف أقسام أخرى'}
          </SquircleButton>
        </div>
      ) : (
        <>
          {/* Results count + page indicator */}
          <div className="flex items-center justify-between text-sm text-slate-400 font-medium">
            <span>
              {lang === 'en'
                ? `Showing ${startIndex + 1}–${Math.min(startIndex + PRODUCTS_PER_PAGE, products.length)} of ${products.length} products`
                : `عرض ${startIndex + 1}–${Math.min(startIndex + PRODUCTS_PER_PAGE, products.length)} من ${products.length} منتج`}
            </span>
            <span>
              {lang === 'en'
                ? `Page ${currentPage} of ${totalPages}`
                : `صفحة ${currentPage} من ${totalPages}`}
            </span>
          </div>

          {/* Product Grid */}
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
            <div className="flex items-center justify-center gap-2 pt-8 flex-wrap">

              {/* Prev */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 font-black text-sm uppercase tracking-tight
                  transition-all duration-200
                  disabled:opacity-30 disabled:cursor-not-allowed
                  border-slate-200 text-slate-500 hover:border-[#DC2626] hover:text-[#DC2626]
                  disabled:hover:border-slate-200 disabled:hover:text-slate-500"
              >
                {lang === 'en' ? (
                  <><ChevronLeft size={16} /> Prev</>
                ) : (
                  <>السابق <ChevronRight size={16} /></>
                )}
              </button>

              {/* Page Numbers */}
              {getPageNumbers().map((page, idx) =>
                page === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 font-bold select-none">
                    ···
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 rounded-xl border-2 font-black text-sm transition-all duration-200
                      ${currentPage === page
                        ? 'bg-[#DC2626] border-[#DC2626] text-white shadow-lg shadow-[#DC2626]/25'
                        : 'border-slate-200 text-slate-500 hover:border-[#DC2626] hover:text-[#DC2626]'
                      }`}
                  >
                    {page}
                  </button>
                )
              )}

              {/* Next */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 font-black text-sm uppercase tracking-tight
                  transition-all duration-200
                  disabled:opacity-30 disabled:cursor-not-allowed
                  border-slate-200 text-slate-500 hover:border-[#DC2626] hover:text-[#DC2626]
                  disabled:hover:border-slate-200 disabled:hover:text-slate-500"
              >
                {lang === 'en' ? (
                  <>Next <ChevronRight size={16} /></>
                ) : (
                  <><ChevronLeft size={16} /> التالي</>
                )}
              </button>

            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CategoryPage;