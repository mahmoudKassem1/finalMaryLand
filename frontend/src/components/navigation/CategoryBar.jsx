import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Apple,
  Baby,
  HeartPulse,
  Package,
  Pill,
  Sparkles,
  Star,
  Stethoscope,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const CATEGORIES = [
  { id: 'all', label: { en: 'All Products', ar: 'كل المنتجات' }, icon: Package, path: '/shop' },
  { id: 'beauty', label: { en: 'Beauty', ar: 'الجمال' }, icon: Sparkles, path: '/category/beauty' },
  { id: 'personal', label: { en: 'Personal Care', ar: 'العناية الشخصية' }, icon: HeartPulse, path: '/category/personal-care' },
  { id: 'baby', label: { en: 'Mom & Baby', ar: 'الأم والطفل' }, icon: Baby, path: '/category/mom-and-baby' },
  { id: 'health', label: { en: 'Health Care', ar: 'الرعاية الصحية' }, icon: Stethoscope, path: '/category/health-care' },
  { id: 'medication', label: { en: 'Medication', ar: 'الأدوية' }, icon: Pill, path: '/category/medication' },
  { id: 'vitamins', label: { en: 'Vitamins', ar: 'الفيتامينات' }, icon: Apple, path: '/category/vitamins' },
  { id: 'maryland', label: { en: 'Maryland', ar: 'ماريلاند' }, icon: Star, path: '/category/maryland-products' },
];

const CategoryBar = () => {
  const { lang } = useApp();
  const location = useLocation();
  const isAr = lang === 'ar';

  return (
    <section className="py-10 sm:py-14 bg-slate-50/50" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center mb-6 sm:mb-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] uppercase tracking-tight">
            {isAr ? 'استكشف أقسامنا' : 'Explore Our Categories'}
          </h2>
          <div className="h-1 w-12 bg-[#DC2626] rounded-full mt-2" />
        </div>

        <div className="overflow-x-auto no-scrollbar snap-x snap-mandatory">
          <div className="flex gap-4 sm:gap-8 px-4 sm:px-6 py-4 justify-start sm:justify-center min-w-max">
            {CATEGORIES.map((category) => {
              const isActive = location.pathname === category.path
                || location.pathname.startsWith(`${category.path}/`);

              return (
                <Link
                  key={category.id}
                  to={category.path}
                  aria-current={isActive ? 'page' : undefined}
                  className="flex flex-col items-center gap-3 shrink-0 snap-center group"
                >
                  <div className={`relative w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-white flex items-center justify-center shadow-md ring-2 transition-all duration-300 ease-out group-hover:ring-[#DC2626]/60 group-hover:shadow-[0_8px_30px_rgba(220,38,38,0.18)] group-hover:scale-105 ${isActive ? 'ring-[#DC2626]' : 'ring-slate-100'}`}>
                    <category.icon size={32} className="relative z-10 text-[#DC2626] transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <span className={`text-[10px] sm:text-xs font-black uppercase tracking-tight transition-colors duration-200 whitespace-nowrap ${isActive ? 'text-[#DC2626]' : 'text-[#0F172A] group-hover:text-[#DC2626]'}`}>
                    {category.label[isAr ? 'ar' : 'en']}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategoryBar;