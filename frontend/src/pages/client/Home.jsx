import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  AlertCircle, Loader2, ChevronRight, 
  ShieldCheck, Truck, Clock, Award, Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useCart } from '../../context/CartContext';
import api from '../../utils/axios';

import GlassCard from '../../components/ui/GlassCard';
import SquircleButton from '../../components/ui/SquircleButton';
import CategoryBar from '../../components/navigation/CategoryBar';
import ProductCard from '../../components/ProductCard';

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
      <div className="mt-4 sm:mt-10">
        <CategoryBar />
      </div>

      <div className="container mx-auto px-3 sm:px-4 space-y-20 mt-16">
        {/* 4. MARYLAND SHOWCASE (Horizontal Touch-Scroll Carousel) */}
        <section className="space-y-6">
          <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-2xl sm:text-4xl font-black text-[#0F172A] uppercase tracking-tighter">
              {lang === 'en' ? 'Maryland Exclusive' : 'حصري ماريلاند'}
            </h2>
            <div className="flex shrink-0 items-center gap-2 self-end sm:gap-3">
              <Link to="/category/maryland-products" className="text-[#DC2626] font-bold text-xs sm:text-sm underline flex items-center gap-1 group">
              {lang === 'en' ? 'View All' : 'عرض الكل'} 
                <ChevronRight size={16} className={`transition-transform group-hover:translate-x-1 ${lang === 'ar' ? 'rotate-180' : ''}`} />
              </Link>
            </div>
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

          {/* See More -> full shop page */}
          <div className="flex justify-center pt-4">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-xl border border-[#DC2626] px-6 py-3 text-sm font-bold text-[#DC2626] transition-all hover:bg-red-50"
            >
              {lang === 'en' ? 'See More' : 'عرض المزيد'}
              <ChevronRight size={16} className={lang === 'ar' ? 'rotate-180' : ''} />
            </Link>
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

export default Home;