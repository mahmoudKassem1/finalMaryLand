import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import api from '../../utils/axios';
import { useApp } from '../../context/AppContext';
import { useCart } from '../../context/CartContext';
import CategoryBar from '../../components/navigation/CategoryBar';
import Breadcrumbs from '../../components/navigation/Breadcrumbs';
import BackButton from '../../components/navigation/BackButton';
import ProductCard from '../../components/ProductCard';

const PAGE_SIZE = 24;
const CATEGORY_OPTIONS = [
  { value: 'all', en: 'All categories', ar: 'كل الأقسام' },
  { value: 'beauty', en: 'Beauty', ar: 'الجمال' },
  { value: 'personal-care', en: 'Personal Care', ar: 'العناية الشخصية' },
  { value: 'mom-and-baby', en: 'Mom & Baby', ar: 'الأم والطفل' },
  { value: 'health-care', en: 'Health Care', ar: 'الرعاية الصحية' },
  { value: 'medication', en: 'Medication', ar: 'الأدوية' },
  { value: 'vitamins', en: 'Vitamins', ar: 'الفيتامينات' },
  { value: 'maryland-products', en: 'Maryland', ar: 'ماريلاند' },
];

// Builds [1, '...', 4, 5, 6, '...', 12] style page list
const getPageNumbers = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push('start-ellipsis');
  for (let p = start; p <= end; p += 1) pages.push(p);
  if (end < total - 1) pages.push('end-ellipsis');
  pages.push(total);
  return pages;
};

const Shop = () => {
  const { lang, t } = useApp();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const isAr = lang === 'ar';
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [openNoticeProductId, setOpenNoticeProductId] = useState(null);

  // Fetch ONLY the current page from the server
  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    const fetchProducts = async () => {
      setLoading(true);
      setError(false);
      try {
        const { data } = await api.get('/products', {
          params: { page: currentPage, limit: PAGE_SIZE, category, sort },
          signal: controller.signal,
        });
        if (ignore) return;
        const list = Array.isArray(data.products) ? data.products : [];
        setProducts(list);
        setTotalProducts(Number(data.total) || list.length);
        setTotalPages(Math.max(1, Number(data.pages) || 1));
      } catch (fetchError) {
        if (ignore || fetchError?.code === 'ERR_CANCELED' || fetchError?.name === 'CanceledError') return;
        console.error('Failed to load shop products', fetchError);
        setError(true);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [currentPage, category, sort, reloadKey]);

  const handleCategoryChange = (value) => {
    setCategory(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value) => {
    setSort(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    setOpenNoticeProductId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navButtonClass = `flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 font-black text-sm uppercase tracking-tight
    transition-all duration-200
    disabled:opacity-30 disabled:cursor-not-allowed
    border-slate-200 text-slate-500 hover:border-[#DC2626] hover:text-[#DC2626]
    disabled:hover:border-slate-200 disabled:hover:text-slate-500`;

  return (
    <div className="min-h-[60vh] pb-16 animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <Breadcrumbs />
        <BackButton fallback="/" label={isAr ? 'رجوع' : 'Back'} />
      </div>

      <CategoryBar />

      <section className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl sm:text-3xl font-black text-[#0F172A]">
              <ShoppingBag className="text-[#DC2626] shrink-0" />
              {isAr ? 'جميع المنتجات' : 'Shop All Products'}
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {isAr ? `${totalProducts} منتج` : `${totalProducts} products`}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:max-w-md">
            <select
              value={category}
              onChange={(event) => handleCategoryChange(event.target.value)}
              aria-label={isAr ? 'تصفية حسب القسم' : 'Filter by category'}
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#DC2626]"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option[isAr ? 'ar' : 'en']}</option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(event) => handleSortChange(event.target.value)}
              aria-label={isAr ? 'ترتيب المنتجات' : 'Sort products'}
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#DC2626]"
            >
              <option value="latest">{isAr ? 'الأحدث' : 'Latest'}</option>
              <option value="featured">{isAr ? 'مميزة' : 'Featured'}</option>
              <option value="name">{isAr ? 'الاسم أ-ي' : 'Name A-Z'}</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6" aria-label={isAr ? 'جار تحميل المنتجات' : 'Loading products'}>
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-2xl border border-slate-100 bg-white p-3 sm:p-4">
                <div className="aspect-square rounded-xl bg-slate-100" />
                <div className="mt-3 h-8 rounded bg-slate-100" />
                <div className="mt-3 h-9 rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white text-center">
            <AlertCircle size={36} className="text-[#DC2626]" />
            <p className="font-bold text-[#0F172A]">{isAr ? 'تعذر تحميل المنتجات' : 'Unable to load products'}</p>
            <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="rounded-xl bg-[#DC2626] px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700">
              {isAr ? 'إعادة المحاولة' : 'Try Again'}
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white py-16 text-center font-semibold text-slate-500">
            {isAr ? 'لم يتم العثور على منتجات.' : 'No products found.'}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  addToCart={addToCart}
                  navigate={navigate}
                  lang={lang}
                  t={t}
                  isNoticeOpen={openNoticeProductId === product._id}
                  onToggleNotice={() => setOpenNoticeProductId((current) => current === product._id ? null : product._id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 pt-8">

                {/* Prev */}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={navButtonClass}
                >
                  {!isAr ? (
                    <><ChevronLeft size={16} /> Prev</>
                  ) : (
                    <>السابق <ChevronRight size={16} /></>
                  )}
                </button>

                {/* Page numbers: 1 2 3 ... */}
                <div className="flex items-center gap-1.5">
                  {getPageNumbers(currentPage, totalPages).map((page) => (
                    typeof page === 'number' ? (
                      <button
                        key={page}
                        type="button"
                        onClick={() => handlePageChange(page)}
                        aria-label={isAr ? `صفحة ${page}` : `Page ${page}`}
                        aria-current={page === currentPage ? 'page' : undefined}
                        className={`h-10 min-w-10 px-3 rounded-xl border-2 font-black text-sm transition-all duration-200 ${
                          page === currentPage
                            ? 'border-[#DC2626] bg-[#DC2626] text-white'
                            : 'border-slate-200 text-slate-500 hover:border-[#DC2626] hover:text-[#DC2626]'
                        }`}
                      >
                        {page}
                      </button>
                    ) : (
                      <span key={page} className="px-1 text-sm font-bold text-slate-400">...</span>
                    )
                  ))}
                </div>

                {/* Next */}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={navButtonClass}
                >
                  {!isAr ? (
                    <>Next <ChevronRight size={16} /></>
                  ) : (
                    <><ChevronLeft size={16} /> التالي</>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default Shop;