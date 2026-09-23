import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { HelpCircle, ChevronDown, MessageCircle } from 'lucide-react';

const PHARMACY_WHATSAPP_NUMBER = '201000076890';

const PriceInquiryNotice = ({ 
  product, 
  lang, 
  compact = false,
  isOpen: controlledIsOpen,
  onToggle: controlledOnToggle 
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const appContext = useApp();

  const isControlled = typeof controlledIsOpen === 'boolean';
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  // Prefer live context so hardcoded or stale props cannot desynchronize the notice.
  const resolvedLang = appContext?.lang || lang || (typeof document !== 'undefined' ? document.documentElement.lang : 'ar');
  const isAr = String(resolvedLang).toLowerCase().startsWith('ar');

  const t = {
    badge: isAr ? 'السعر عند الاستفسار' : 'Price on Request',
    title: isAr ? 'كيف يتم تحديد السعر؟' : 'How does pricing work?',
    description: isAr
      ? 'نظراً للتغيرات الدورية في الأسعار، يؤكد الصيدلي السعر الحالي فوراً عبر واتساب.'
      : 'Due to market fluctuations, our pharmacist confirms current prices directly via WhatsApp.',
    cta: isAr ? 'استفسار عبر واتساب' : 'Inquire via WhatsApp',
  };

  const productName = product?.title || product?.name || (isAr ? 'هذا الصنف' : 'this item');
  const productId = product?._id || '';

  const whatsappMessage = isAr
    ? `مرحباً صيدلية ماريلاند، أود الاستفسار عن السعر المحدث وتوفر هذا الصنف:\n• الاسم: ${productName}${productId ? `\n• الكود: ${productId}` : ''}\nشكراً لكم!`
    : `Hello Maryland Pharmacy, I would like to inquire about the current price and availability of:\n• Name: ${productName}${productId ? `\n• ID: ${productId}` : ''}\nThank you!`;

  const handleWhatsAppRedirect = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const url = `https://wa.me/${PHARMACY_WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, '_blank');
  };

  const toggleAccordion = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (isControlled && controlledOnToggle) {
      controlledOnToggle();
    } else {
      setInternalIsOpen((prev) => !prev);
    }
  };

  if (compact) {
    return (
      <div 
        dir={isAr ? 'rtl' : 'ltr'} 
        className="w-full my-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={toggleAccordion}
          className="w-full flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200/80 transition-all active:scale-[0.98] select-none"
        >
          <span className="flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span className="truncate">{t.badge}</span>
          </span>
          <ChevronDown
            size={12}
            className={`text-emerald-700 shrink-0 transition-transform duration-300 ease-out ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        <div
          className={`grid transition-all duration-300 ease-in-out ${
            isOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'
          }`}
        >
          <div className="overflow-hidden">
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-700 text-xs shadow-inner">
              <div className="flex items-center gap-1 font-bold text-slate-800 mb-1 text-[10px] sm:text-[11px]">
                <HelpCircle size={12} className="text-emerald-600 shrink-0" />
                <span className="truncate">{t.title}</span>
              </div>
              <p className="text-[9.5px] sm:text-[10.5px] leading-relaxed text-slate-600 mb-2 font-medium">
                {t.description}
              </p>
              <button
                type="button"
                onClick={handleWhatsAppRedirect}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] sm:text-[11px] transition-colors shadow-sm active:scale-95"
              >
                <MessageCircle size={12} />
                <span className="truncate">{t.cta}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="w-full my-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 transition-all"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="px-3.5 py-1 text-xs sm:text-sm font-black rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
          {t.badge}
        </span>

        <button
          type="button"
          onClick={toggleAccordion}
          className="text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-900 underline underline-offset-4 flex items-center gap-1.5"
        >
          <span>{t.title}</span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-300 ease-out ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100 mt-3 pt-3 border-t border-emerald-100' : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'
        }`}
      >
        <div className="overflow-hidden">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium mb-3">
            {t.description}
          </p>
          <button
            type="button"
            onClick={handleWhatsAppRedirect}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95"
          >
            <MessageCircle size={16} />
            <span>{t.cta}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PriceInquiryNotice;