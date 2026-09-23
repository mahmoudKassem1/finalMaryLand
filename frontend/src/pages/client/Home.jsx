import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShoppingCart, AlertCircle, Loader2, ChevronRight, 
  ShieldCheck, Truck, Clock, Award, Sparkles,
  HeartPulse, Baby, Stethoscope, Pill, Apple, Star
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { useApp } from '../../context/AppContext';
import { useCart } from '../../context/CartContext';
import api from '../../utils/axios';

import GlassCard from '../../components/ui/GlassCard';
import SquircleButton from '../../components/ui/SquircleButton';
import PriceInquiryNotice from '../../components/PriceInquiryNotice';

// Assets
import HeroImg from '../../assets/hero.jpeg';
import SignatureImg from '../../assets/sig.png';
import logo from '../../assets/logo.png';

const Home = () => {
  const { lang, t } = useApp();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  const bestSellersRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [marylandProducts, setMarylandProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Single active accordion ID across the whole page
  const [openNoticeProductId, setOpenNoticeProductId] = useState(null);

  const handleToggleNotice = (productId) => {
    setOpenNoticeProductId((prevId) => (prevId === productId ? null : productId));
  };

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/products?limit=100&t=${new Date().getTime()}`);
        setProducts(data.products || []);
      } catch (err) {
        setError(lang === 'en' ? "Failed to load products." : "فشل تحميل المنتجات.");
        console.error(err);
      }
    };

    const fetchMarylandProducts = async () => {
      try {
        const { data } = await api.get('/products?category=maryland-products&limit=100');
        setMarylandProducts(data.products || []);
      } catch (err) {
        console.error("Failed to load Maryland products", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllProducts();
    fetchMarylandProducts();
  }, [lang]);

  const categories = useMemo(() => [
    { id: 'beauty', label: { en: 'Beauty', ar: 'الجمال' }, icon: Sparkles, path: '/category/beauty' },
    { id: 'personal', label: { en: 'Personal Care', ar: 'العناية الشخصية' }, icon: HeartPulse, path: '/category/personal-care' },
    { id: 'baby', label: { en: 'Mom & Baby', ar: 'الأم والطفل' }, icon: Baby, path: '/category/mom-and-baby' },
    { id: 'health', label: { en: 'Health Care', ar: 'الرعاية الصحية' }, icon: Stethoscope, path: '/category/health-care' },
    { id: 'meds', label: { en: 'Medication', ar: 'الأدوية' }, icon: Pill, path: '/category/medication' },
    { id: 'vitamins', label: { en: 'Vitamins', ar: 'الفيتامينات' }, icon: Apple, path: '/category/vitamins' },
    { id: 'maryland', label: { en: 'Maryland', ar: 'ماريلاند' }, icon: Star, path: '/category/maryland-products' },
  ], []);

  const randomBestSellers = useMemo(() => {
    if (!products || products.length === 0) return [];

    const filteredProducts = products.filter(
      (p) =>
        p.category !== "maryland-products" &&
        p.category !== "maryland" &&
        p.isMaryland !== true
    );

    const safeProducts = filteredProducts.length > 0 ? filteredProducts : products;
    const shuffled = [...safeProducts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 8);
  }, [products]);

  const scrollToBestSellers = () => {
    bestSellersRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
      <Loader2 size={40} className="animate-spin mb-4 text-[#DC2626]" />
      <p className="font-bold tracking-widest uppercase text-sm">loading Home...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] text-red-500">
      <AlertCircle size={40} className="mb-4" />
      <p className="font-bold">{error}</p>
      <SquircleButton variant="secondary" className="mt-4" onClick={() => window.location.reload()}>Try Again</SquircleButton>
    </div>
  );

  return (
    <div className="pb-8 -mt-[90px] overflow-x-hidden bg-[#f8fafc]"> 
      {/* 1. HERO SECTION */}
      <section className="relative w-full overflow-hidden bg-white z-0">
        <div className="relative w-full h-[500px] sm:h-[600px] md:h-[700px] flex items-center justify-center bg-white">
          <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-12 z-10">
            <img 
              src={logo} 
              alt="Pharmacy Logo" 
              className="w-auto h-auto max-w-[280px] sm:max-w-[400px] md:max-w-[500px] object-contain block drop-shadow-sm opacity-90" 
            />
          </div>

          <div className={`absolute inset-0 z-20 transition-all duration-500 bg-gradient-to-t from-black/80 via-black/20 to-transparent sm:bg-gradient-to-t ${
            lang === 'en' ? 'sm:bg-gradient-to-tr' : 'sm:bg-gradient-to-tl'
          }`}>
            <div className={`container mx-auto h-full px-6 sm:px-12 flex items-end pb-12 sm:pb-20 ${
              lang === 'en' ? 'justify-start' : 'justify-end'
            }`}>
              <div className={`max-w-xl flex flex-col space-y-4 sm:space-y-6 animate-fade-in ${
                lang === 'en' ? 'items-start text-left' : 'items-end text-right'
              }`}>
                <div className={`space-y-2 flex flex-col ${lang === 'en' ? 'items-start' : 'items-end'}`}>
                  <h1 className="text-4xl sm:text-7xl font-black uppercase leading-[1.0] sm:leading-[0.9] text-white drop-shadow-lg tracking-tight">
                    <span className="whitespace-nowrap">{lang === 'en' ? "Trusted" : "رعاية"}</span> <br />
                    <span className="text-[#DC2626] drop-shadow-[0_0_20px_rgba(220,38,38,0.5)] whitespace-nowrap">
                      {lang === 'en' ? "Care" : "موثوقة"}
                    </span>
                  </h1>
                  <p className="inline-block px-3 py-1 bg-black/30 backdrop-blur-sm rounded-lg text-white text-[10px] sm:text-lg font-bold uppercase tracking-[0.2em] mt-3">
                    {lang === 'en' ? "Quality Pharmaceutical Excellence" : "تميز دوائي بجودة عالية"}
                  </p>
                </div>

                <div className="relative group pt-4">
                  <div className="absolute -inset-1 bg-[#DC2626] rounded-xl blur-2xl opacity-40 group-hover:opacity-100 transition duration-500"></div>
                  <SquircleButton 
                    variant="primary" 
                    className="relative !py-3.5 sm:!py-5 !px-9 sm:!px-14 text-xs sm:text-lg shadow-2xl font-black"
                    onClick={scrollToBestSellers}
                  >
                    {lang === 'en' ? "Shop Now" : "تسوق الآن"}
                  </SquircleButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST BAR */}
      <section className="bg-white border-y border-slate-100 py-6 relative z-10 overflow-hidden">
        <div className="flex whitespace-nowrap overflow-hidden">
          <div className="flex animate-marquee items-center gap-12 sm:gap-24 py-2">
            {[...Array(2)].map((_, outerIndex) => (
              <div key={outerIndex} className="flex items-center gap-12 sm:gap-24 shrink-0">
                {[
                  { icon: Truck, t: { en: "Fast Delivery", ar: "توصيل سريع" }, d: { en: "Under 24h", ar: "خلال ٢٤ ساعة" } },
                  { icon: ShieldCheck, t: { en: "100% Original", ar: "أصلي ١٠٠٪" }, d: { en: "Certified", ar: "منتجات معتمدة" } },
                  { icon: Clock, t: { en: "Support 24/7", ar: "دعم متواصل" }, d: { en: "Professional", ar: "صيادلة متخصصون" } },
                  { icon: Award, t: { en: "Best Prices", ar: "أفضل الأسعار" }, d: { en: "Top Deals", ar: "عروض يومية" } },
                ].map((item, i) => (
                  <div key={`${outerIndex}-${i}`} className="flex items-center gap-4 shrink-0">
                    <item.icon className="text-[#DC2626] shrink-0" size={32} />
                    <div className="flex flex-col leading-none">
                      <span className="font-black text-sm text-[#0F172A] uppercase tracking-tight">
                        {item.t[lang]}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">
                        {item.d[lang]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            display: flex;
            width: max-content;
            animation: marquee 40s linear infinite;
          }
          [dir="rtl"] .animate-marquee {
            animation: marquee-rtl 40s linear infinite;
          }
          @keyframes marquee-rtl {
            0% { transform: translateX(0); }
            100% { transform: translateX(50%); }
          }
        `}} />
      </section>

      {/* 3. CATEGORIES SECTION */}
      <section className="py-16 mt-4 sm:mt-10 bg-slate-50/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center mb-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] uppercase tracking-tighter">
              {lang === 'en' ? 'Explore Our Categories' : 'استكشف أقسامنا'}
            </h2>
            <div className="h-1 w-12 bg-[#DC2626] rounded-full mt-2"></div>
          </div>

          <div
            className="no-scrollbar snap-x snap-mandatory"
            style={{ overflowX: 'auto', overflowY: 'visible' }}
          >
            <div className="flex gap-4 sm:gap-10 px-6 sm:px-8 py-8 justify-start sm:justify-center">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={cat.path}
                  className="flex flex-col items-center gap-3 shrink-0 snap-center group"
                >
                  <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-white flex items-center justify-center shadow-md ring-2 ring-slate-100 transition-all duration-300 ease-out group-hover:ring-[#DC2626]/50 group-hover:ring-[3px] group-hover:shadow-[0_8px_30px_rgba(220,38,38,0.18)] group-hover:scale-110 group-hover:-translate-y-1">
                    <div className="absolute inset-0 rounded-full bg-[#DC2626] opacity-0 group-hover:opacity-[0.06] transition-opacity duration-300" />
                    <cat.icon
                      size={32}
                      className="relative z-10 text-[#DC2626] transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <span className="text-[10px] sm:text-xs font-black uppercase text-[#0F172A] tracking-tighter transition-colors duration-200 group-hover:text-[#DC2626] whitespace-nowrap">
                    {cat.label[lang]}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-3 sm:px-4 space-y-20 mt-16">
        {/* 4. MARYLAND SHOWCASE (Horizontal Touch-Scroll Carousel) */}
        <section className="space-y-6">
          <div className="flex items-end justify-between px-1">
            <h2 className="text-2xl sm:text-4xl font-black text-[#0F172A] uppercase tracking-tighter">
              {lang === 'en' ? 'Maryland Exclusive' : 'حصري ماريلاند'}
            </h2>
            <Link to="/category/maryland-products" className="text-[#DC2626] font-bold text-xs sm:text-sm underline flex items-center gap-1 group">
              {lang === 'en' ? 'View All' : 'عرض الكل'} 
              <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          
          <div className="flex overflow-x-auto gap-3.5 sm:gap-6 pb-6 pt-1 no-scrollbar snap-x">
            {marylandProducts.map((product) => (
              <div key={product._id} className="w-[185px] sm:w-[260px] md:w-[280px] shrink-0 snap-start">
                <ProductCard 
                  product={product} 
                  addToCart={addToCart} 
                  navigate={navigate} 
                  lang={lang} 
                  t={t}
                  isNoticeOpen={openNoticeProductId === product._id}
                  onToggleNotice={() => handleToggleNotice(product._id)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* 5. FEATURED PRODUCTS (2-per-row on Mobile, 4-per-row on Desktop) */}
        <section ref={bestSellersRef} className="space-y-6 pb-10 scroll-mt-32">
          <div className="flex items-center gap-3 px-1">
            <Sparkles className="text-[#DC2626]" size={24} />
            <h2 className="text-2xl sm:text-4xl font-black text-[#0F172A] uppercase tracking-tighter">
              {lang === 'en' ? 'Featured products' : 'منتجات مميزة'}
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 pt-1">
            {randomBestSellers.map((product) => (
              <div key={product._id} className="w-full">
                <ProductCard 
                  product={product} 
                  addToCart={addToCart} 
                  navigate={navigate} 
                  lang={lang} 
                  t={t}
                  isNoticeOpen={openNoticeProductId === product._id}
                  onToggleNotice={() => handleToggleNotice(product._id)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* 6. TRANSITION & SIGNATURE SECTION */}
        <section className="relative mt-16">
          <div className="relative w-full overflow-hidden">
            <img
              src={HeroImg}
              alt="Contact Maryland Pharmacy"
              className="w-full h-[280px] sm:h-[420px] lg:h-[520px] object-cover object-center brightness-[0.55] contrast-110"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4">
              <Link
                to="/contact"
                className="bg-white/10 backdrop-blur-md text-white border border-white/30 px-8 py-3 rounded-full font-black uppercase tracking-tighter text-sm hover:bg-white/20 hover:border-white/50 transition-all duration-300 hover:scale-105"
              >
                {lang === 'en' ? 'Get in Touch' : 'تواصل معنا'}
              </Link>
            </div>
          </div>

          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center justify-center py-12 border-t border-slate-100/50">
              <div className="max-w-md text-center space-y-3">
                <p className="text-[#DC2626] font-black uppercase tracking-[0.3em] text-[10px]">
                  {lang === 'en' ? "Our Commitment" : "التزامنا"}
                </p>
                <p className="text-slate-600 text-sm sm:text-base italic font-medium leading-relaxed">
                  {lang === 'en'
                    ? '"Quality medicine and a lifetime of professional care is our promise to you."'
                    : '"دواء عالي الجودة ورعاية مهنية تدوم مدى الحياة هو وعدنا لك."'}
                </p>
                <div className="pt-6 relative group">
                  <img
                    src={SignatureImg}
                    alt="Signature"
                    className="h-20 sm:h-28 mx-auto object-contain brightness-0 opacity-70 transition-all duration-500 group-hover:opacity-100 group-hover:scale-110"
                  />
                  <div className="w-12 h-0.5 bg-[#DC2626]/20 mx-auto mt-2 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

// Perfectly unified Product Card used by both sections
const ProductCard = ({ 
  product, 
  addToCart, 
  navigate, 
  lang, 
  t, 
  isNoticeOpen, 
  onToggleNotice 
}) => (
  <div 
    onClick={() => navigate(`/category/${product.category}/${product._id}`)} 
    className="cursor-pointer group h-full flex flex-col select-none"
  >
    <GlassCard className="p-3 sm:p-4 flex flex-col justify-between h-full transition-all duration-300 hover:shadow-xl border-slate-100 bg-white rounded-2xl">
      <div className="flex-1 flex flex-col">
        {/* Responsive Aspect-Square Frame for Perfectly Matching Images */}
        <div className="relative aspect-square w-full bg-white rounded-xl mb-3 flex items-center justify-center border border-slate-50 overflow-hidden shrink-0">
          <img 
            src={product.imageURL || product.image} 
            alt={product.title} 
            className="w-full h-full object-contain p-2 sm:p-3 transition-transform duration-500 group-hover:scale-105" 
          />
          {product.isMaryland && (
            <div className="absolute top-2 left-2 bg-[#DC2626] text-white text-[8px] sm:text-[9px] px-2 py-0.5 rounded-full font-black tracking-wider shadow-md">
              MARYLAND
            </div>
          )}
        </div>

        {/* Constrained 2-line title */}
        <h3 className="text-[11px] sm:text-xs md:text-sm font-black mb-1.5 text-[#0F172A] line-clamp-2 h-7 sm:h-9 uppercase group-hover:text-[#DC2626] transition-colors leading-tight">
          {product.title}
        </h3>
        
        {/* Coordinated Notice Accordion */}
        <div className="mt-auto">
          <PriceInquiryNotice 
            product={product} 
            compact={true} 
            lang={lang} 
            isOpen={isNoticeOpen}
            onToggle={onToggleNotice}
          />
        </div>
      </div>

      {/* Cart CTA */}
      <div className="mt-2.5" onClick={(e) => e.stopPropagation()}>
        <SquircleButton 
          variant="primary" 
          fullWidth 
          className="!py-2 sm:!py-2.5 !rounded-xl" 
          onClick={(e) => { 
            e.stopPropagation(); 
            addToCart(product); 
            toast.success(lang === 'en' ? 'Added to cart' : 'تم الإضافة للسلة'); 
          }}
        >
          <div className="flex items-center justify-center gap-1.5">
            <ShoppingCart size={15} />
            <span className="uppercase text-[9px] sm:text-[10px] font-bold">
              {t.cart || (lang === 'en' ? "Add" : "أضف")}
            </span>
          </div>
        </SquircleButton>
      </div>
    </GlassCard>
  </div>
);

export default Home;