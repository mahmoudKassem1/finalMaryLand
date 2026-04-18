import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
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
  const location = useLocation();
  const { addToCart } = useCart();
  const { lang, t } = useApp();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  // ✅ Restore page from navigation state if user came back from a product page
  const [currentPage, setCurrentPage] = useState(location.state?.returnPage || 1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const normalizeCategorySlug = (slug) => {
      if (slug === 'maryland-products') return 'maryland-products';
      return slug?.replace(/-/g, ' ').toUpperCase();
    };

    const fetchCategoryProducts = async () => {
      setLoading(true);

      try {
        const categoryQuery = normalizeCategorySlug(slug);
        const { data } = await api.get(`/products?category=${encodeURIComponent(categoryQuery)}&page=${currentPage}`);
        
        const fetchedProducts = Array.isArray(data.products) ? data.products : [];
        setProducts(fetchedProducts);
        setTotalPages(data.pages || 1);
      } catch (error) {
        console.error("Failed to load category", error);
        toast.error(lang === 'en' ? 'Failed to load products' : 'فشل تحميل المنتجات');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [slug, lang, currentPage]);

  const visibleProducts = products;

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ✅ Navigate to product while passing the current page so we can restore it on back
  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`, {
      state: { fromCategory: slug, fromPage: currentPage }
    });
  };

  const formatTitle = (str) => {
    if (!str) return '';
    if (str === 'maryland-products') return lang === 'en' ? 'Maryland Products' : 'منتجات ماريلاند';
    return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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
                ? `Showing ${products.length} product${products.length !== 1 ? 's' : ''} on this page`
                : `عرض ${products.length} منتج على هذه الصفحة`}
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
                onClick={() => handleProductClick(product._id)}
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

              {/* Page Indicator */}
              <span className="px-3 py-2 text-sm font-bold text-slate-500">
                {lang === 'en' ? `Page ${currentPage} of ${totalPages}` : `صفحة ${currentPage} من ${totalPages}`}
              </span>

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