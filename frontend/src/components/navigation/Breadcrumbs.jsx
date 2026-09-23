import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const LABELS = {
  category: { en: 'Category', ar: 'القسم' },
  product: { en: 'Product', ar: 'المنتج' },
  search: { en: 'Search', ar: 'البحث' },
  cart: { en: 'Cart', ar: 'السلة' },
  checkout: { en: 'Checkout', ar: 'إتمام الطلب' },
  'my-orders': { en: 'My Orders', ar: 'طلباتي' },
  contact: { en: 'Contact Us', ar: 'تواصل معنا' },
  'management-panel': { en: 'Management', ar: 'الإدارة' },
  orders: { en: 'Orders', ar: 'الطلبات' },
  inventory: { en: 'Inventory', ar: 'المخزون' },
  'add-product': { en: 'Add Product', ar: 'إضافة منتج' },
  settings: { en: 'Settings', ar: 'الإعدادات' },
};

const formatSegment = (segment, lang) => {
  const label = LABELS[segment];
  if (label) return label[lang === 'ar' ? 'ar' : 'en'];
  return decodeURIComponent(segment)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const Breadcrumbs = ({ items }) => {
  const location = useLocation();
  const { lang } = useApp();
  const isAr = lang === 'ar';
  const segments = location.pathname.split('/').filter(Boolean);
  const generatedItems = segments.map((segment, index) => ({
    label: formatSegment(segment, lang),
    path: `/${segments.slice(0, index + 1).join('/')}`,
  }));
  const breadcrumbItems = items || generatedItems;
  const Separator = isAr ? ChevronLeft : ChevronRight;

  return (
    <nav aria-label={isAr ? 'مسار الصفحة' : 'Breadcrumb'} dir={isAr ? 'rtl' : 'ltr'} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
      <Link to="/" aria-label={isAr ? 'الرئيسية' : 'Home'} className="flex min-h-10 min-w-10 items-center justify-center rounded-xl hover:bg-slate-100 hover:text-[#DC2626] transition-colors">
        <Home size={15} />
      </Link>
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={`${item.path || item.label}-${index}`}>
          <Separator size={14} className="shrink-0 text-slate-300" />
          {item.path && index < breadcrumbItems.length - 1 ? (
            <Link to={item.path} className="rounded-lg px-1.5 py-2 hover:text-[#DC2626] transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="px-1.5 py-2 text-slate-700" aria-current="page">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
