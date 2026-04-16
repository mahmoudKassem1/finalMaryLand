import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShoppingCart, AlertCircle, Loader2, ChevronRight, 
  ShieldCheck, Truck, Clock, Award, Sparkles,
  HeartPulse, Baby, Stethoscope, Pill, Apple, Star, Home as HomeIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { useApp } from '../../context/AppContext';
import { useCart } from '../../context/CartContext';
import api from '../../utils/axios';

import GlassCard from '../../components/ui/GlassCard';
import SquircleButton from '../../components/ui/SquircleButton';

// Assets
import HeroImg from '../../assets/hero.jpeg';
import SignatureImg from '../../assets/sig.png';

const Home = () => {
  const { lang, t } = useApp();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/products');
        setProducts(data.products || data);
      } catch (err) {
        setError(lang === 'en' ? "Failed to load products." : "فشل تحميل المنتجات.");
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [lang]);

  const categories = useMemo(() => [
    { id: 'home', label: { en: 'Home', ar: 'الرئيسية' }, icon: HomeIcon, path: '/' },
    { id: 'beauty', label: { en: 'Beauty', ar: 'الجمال' }, icon: Sparkles, path: '/category/beauty' },
    { id: 'personal', label: { en: 'Personal Care', ar: 'العناية الشخصية' }, icon: HeartPulse, path: '/category/personal-care' },
    { id: 'baby', label: { en: 'Mom & Baby', ar: 'الأم والطفل' }, icon: Baby, path: '/category/mom-and-baby' },
    { id: 'health', label: { en: 'Health Care', ar: 'الرعاية الصحية' }, icon: Stethoscope, path: '/category/health-care' },
    { id: 'meds', label: { en: 'Medication', ar: 'الأدوية' }, icon: Pill, path: '/category/medication' },
    { id: 'vitamins', label: { en: 'Vitamins', ar: 'الفيتامينات' }, icon: Apple, path: '/category/vitamins' },
    { id: 'maryland', label: { en: 'Maryland', ar: 'ماريلاند' }, icon: Star, path: '/category/maryland-products' },
  ], []);

  const randomBestSellers = useMemo(() => {
    return [...products].sort(() => 0.5 - Math.random()).slice(0, 8);
  }, [products]);

  const marylandProducts = useMemo(() => products.filter(p => p.isMaryland), [products]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
      <Loader2 size={40} className="animate-spin mb-4 text-[#DC2626]" />
      <p className="font-bold tracking-widest uppercase text-sm">Vitalizing Home...</p>
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
      
      {/* 1. HERO SECTION - Enhanced Visibility on Mobile */}
      <section className="relative w-full overflow-hidden bg-[#0F172A] z-0">
        {/* Set a min-height (min-h-[450px]) on mobile to prevent the squeezed look */}
        <div className="relative w-full min-h-[450px] sm:h-[700px]">
          <img 
            src={HeroImg} 
            alt="Pharmacy" 
            /* On mobile, use h-full + object-cover to ensure the area is filled beautifully */
            className="absolute inset-0 w-full h-full object-cover sm:object-cover block" 
          />
          {/* Darker overlay for mobile to ensure CTA text pop */}
          <div className="absolute inset-0 bg-gradient-to-b sm:bg-gradient-to-r from-black/80 via-black/40 sm:via-black/20 to-transparent flex items-center">
            <div className="container mx-auto px-6 sm:px-12 text-white pt-[100px] sm:pt-[112px]">
              <div className="max-w-2xl space-y-5 sm:space-y-6 text-center sm:text-left">
                <h1 className="text-4xl sm:text-7xl font-black uppercase leading-[0.95] sm:leading-[0.9] drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  {lang === 'en' ? "Trusted" : "رعاية"} <br />
                  <span className="text-[#DC2626] drop-shadow-[0_0_30px_rgba(220,38,38,0.7)]">
                    {lang === 'en' ? "Care" : "موثوقة"}
                  </span>
                </h1>
                
                {/* Mobile-friendly description */}
                <p className="text-slate-200 text-sm sm:text-lg font-medium max-w-sm mx-auto sm:mx-0">
                  {lang === 'en' 
                    ? "Premium pharmaceutical products and expert care at your fingertips." 
                    : "منتجات صيدلانية متميزة ورعاية خبراء بين يديك."}
                </p>

                <div className="relative group w-fit mx-auto sm:mx-0 pt-2">
                    <div className="absolute -inset-1 bg-[#DC2626] rounded-xl blur-xl opacity-50 group-hover:opacity-100 transition duration-500"></div>
                    <SquircleButton 
                      variant="primary" 
                      className="relative !py-4 sm:!py-5 !px-10 sm:!px-12 text-base sm:text-lg"
                      onClick={() => navigate('/category/medication')}
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
      <section className="bg-white border-y border-slate-100 py-8 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Truck, t: { en: "Fast Delivery", ar: "توصيل سريع" }, d: { en: "Under 24h", ar: "خلال ٢٤ ساعة" } },
              { icon: ShieldCheck, t: { en: "100% Original", ar: "أصلي ١٠٠٪" }, d: { en: "Certified", ar: "منتجات معتمدة" } },
              { icon: Clock, t: { en: "Support 24/7", ar: "دعم متواصل" }, d: { en: "Professional", ar: "صيادلة متخصصون" } },
              { icon: Award, t: { en: "Best Prices", ar: "أفضل الأسعار" }, d: { en: "Top Deals", ar: "عروض يومية" } },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 sm:justify-center">
                <item.icon className="text-[#DC2626] shrink-0" size={32} />
                <div className="flex flex-col leading-none">
                  <span className="font-black text-sm text-[#0F172A] uppercase tracking-tight">{item.t[lang]}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{item.d[lang]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. CATEGORIES SCROLLER */}
      <section className="py-16 mt-4 sm:mt-10 bg-slate-50/50"> 
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto gap-6 sm:gap-12 pb-6 no-scrollbar snap-x justify-start sm:justify-center">
            {categories.map((cat) => (
              <Link key={cat.id} to={cat.path} className="flex flex-col items-center gap-4 shrink-0 snap-center group">
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center transition-all duration-500 group-hover:border-[#DC2626] group-hover:scale-110 shadow-xl group-hover:shadow-[#DC2626]/20">
                  <cat.icon size={32} className="text-[#DC2626]" />
                </div>
                <span className="text-[10px] sm:text-xs font-black uppercase text-[#0F172A] transition-colors group-hover:text-[#DC2626]">
                  {cat.label[lang]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 space-y-24 mt-16">
        {/* 4. MARYLAND SHOWCASE */}
        <section className="space-y-8">
          <div className="flex items-end justify-between px-2">
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] uppercase tracking-tighter">
                {lang === 'en' ? 'Maryland Exclusive' : 'حصري ماريلاند'}
            </h2>
            <Link to="/category/maryland-products" className="text-[#DC2626] font-bold text-sm underline flex items-center gap-1 group">
               {lang === 'en' ? 'View All' : 'عرض الكل'} 
               <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="flex overflow-x-auto gap-6 pb-8 no-scrollbar snap-x">
            {marylandProducts.map((product) => (
              <div key={product._id} className="min-w-[260px] sm:min-w-[320px] snap-start">
                <ProductCard product={product} addToCart={addToCart} navigate={navigate} lang={lang} t={t} />
              </div>
            ))}
          </div>
        </section>

        {/* 5. BEST SELLERS */}
        <section className="space-y-10">
          <div className="flex items-center gap-4 px-2">
            <Sparkles className="text-[#DC2626]" size={28} />
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] uppercase tracking-tighter">
              {lang === 'en' ? 'Best Sellers' : 'الأكثر مبيعاً'}
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8">
            {randomBestSellers.map((product) => (
              <ProductCard key={product._id} product={product} addToCart={addToCart} navigate={navigate} lang={lang} t={t} />
            ))}
          </div>
        </section>

        {/* 6. SIGNATURE SECTION */}
        <section className="flex flex-col items-center justify-center py-8 border-t border-slate-100">
            <div className="max-w-md text-center space-y-2">
                <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">
                    {lang === 'en' ? "Our Commitment" : "التزامنا"}
                </p>
                <p className="text-slate-500 text-xs italic px-6">
                    {lang === 'en' 
                        ? "Quality medicine and a lifetime of professional care."
                        : "دواء عالي الجودة ورعاية مهنية تدوم مدى الحياة."}
                </p>
                <div className="pt-2">
                    <img 
                        src={SignatureImg} 
                        alt="Signature" 
                        className="h-20 sm:h-28 mx-auto object-contain brightness-0 opacity-80" 
                    />
                </div>
            </div>
        </section>
      </div>
    </div>
  );
};

const ProductCard = ({ product, addToCart, navigate, lang, t }) => (
  <div onClick={() => navigate(`/category/${product.category}/${product._id}`)} className="cursor-pointer group h-full">
    <GlassCard className="p-4 sm:p-5 flex flex-col justify-between h-full transition-all duration-300 hover:shadow-2xl border-slate-100 relative overflow-hidden bg-white">
      <div>
        <div className="relative h-44 sm:h-56 bg-white rounded-2xl mb-4 flex items-center justify-center border border-slate-50 overflow-hidden">
          <img src={product.imageURL || product.image} alt={product.title} className="w-full h-full object-contain p-4 transition-transform duration-700 group-hover:scale-110" />
          {product.isMaryland && <div className="absolute top-3 left-3 bg-[#DC2626] text-white text-[9px] px-3 py-1 rounded-full font-black tracking-widest shadow-lg">MARYLAND</div>}
        </div>
        <h3 className="text-xs sm:text-sm font-black mb-2 text-[#0F172A] line-clamp-2 uppercase group-hover:text-[#DC2626] transition-colors leading-tight">{product.title}</h3>
        <p className="text-[#DC2626] font-mono font-black text-sm sm:text-lg">{product.price} <span className="text-[10px] font-sans opacity-70">{lang === 'en' ? 'EGP' : 'ج.م'}</span></p>
      </div>
      <div className="mt-5" onClick={(e) => e.stopPropagation()}>
        <SquircleButton variant="primary" fullWidth className="!py-3" onClick={(e) => { e.stopPropagation(); addToCart(product); toast.success(lang === 'en' ? 'Added to cart' : 'تم الإضافة للسلة'); }}>
          <div className="flex items-center justify-center gap-2">
            <ShoppingCart size={18} />
            <span className="uppercase text-[10px] font-bold">{t.cart || (lang === 'en' ? "Buy" : "شراء")}</span>
          </div>
        </SquircleButton>
      </div>
    </GlassCard>
  </div>
);

export default Home;