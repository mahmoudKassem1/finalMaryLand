import React from 'react';
import { Link } from 'react-router-dom'; 
import { useApp } from '../../context/AppContext';
import { 
  Phone, 
  MessageCircle, 
  Facebook, 
  MapPin, 
  Instagram, 
  ArrowRight, 
  Code, 
  CreditCard, 
  Share2, 
  Wallet 
} from 'lucide-react'; 
import Logo from '../ui/Logo';

// ✅ Logic defined OUTSIDE with standard component naming to satisfy linter
const ActionButton = ({ href, icon: IconComponent, label, colorClass }) => (
  <a 
    href={href} 
    target="_blank" 
    rel="noopener noreferrer"
    className={`flex items-center gap-2 bg-white/5 ${colorClass} px-3 py-2.5 rounded-xl transition-all duration-300 text-slate-300 justify-center md:justify-start`}
  >
    <IconComponent size={18} className="shrink-0" />
    <span className="text-xs sm:text-sm font-bold truncate">{label}</span>
  </a>
);

const Footer = () => {
  const { lang } = useApp();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0F172A] text-white pt-12 pb-8 border-t border-white/5" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* 1. BRAND SECTION */}
          <div className="space-y-6">
            <div className="inline-block p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-inner">
              <Logo size="h-10 sm:h-12" showText={false} />
            </div>
            <div className="space-y-2">
              <h3 className="text-[#DC2626] font-black text-2xl tracking-tighter uppercase leading-none">
                Maryland <span className="text-white/90">Pharmacy</span>
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                {lang === 'ar' 
                  ? 'نحن نقدم أفضل الحلول الطبية والمنتجات الحصرية بجودة عالمية.' 
                  : 'Providing top-tier medical solutions and exclusive products with global standards.'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <MapPin size={16} className="text-[#DC2626]" />
              <span>{lang === 'ar' ? 'الإسكندرية، مصر' : 'Alexandria, Egypt'}</span>
            </div>
          </div>
          
          {/* 2. CONTACT INFO */}
          <div className="space-y-6">
            <h4 className="font-black text-xs uppercase tracking-widest text-[#DC2626]">
              {lang === 'ar' ? 'تواصل معنا' : 'Contact Us'}
            </h4>
            <ul className="space-y-3">
              {[ '+201000686866', '+201000076890', '+201033520476' ].map((num) => (
                <li key={num} className="flex items-center gap-3 group">
                  <MessageCircle size={18} className="text-emerald-500 transition-transform group-hover:scale-110" />
                  <a href={`https://wa.me/${num.replace('+', '')}`} className="text-slate-300 hover:text-white font-mono text-sm transition-colors">
                    {num}
                  </a>
                </li>
              ))}
            </ul>
            <div className="pt-4 border-t border-white/5 space-y-2">
               <div className="flex items-center gap-3 text-slate-300 font-mono text-sm">
                  <Phone size={16} className="text-slate-500" /> 03 5408605
               </div>
               <div className="flex items-center gap-3 text-slate-300 font-mono text-sm">
                  <Phone size={16} className="text-slate-500" /> 03 5499475
               </div>
            </div>
          </div>

          {/* 3. PAYMENT METHODS - Smart Grid Layout */}
          <div className="space-y-6">
            <h4 className="font-black text-xs uppercase tracking-widest text-[#DC2626]">
              {lang === 'ar' ? 'الدفع الإلكتروني' : 'Payments'}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-3">
              <ActionButton 
                href="https://ipn.eg/S/yousry360218/instapay/6xwQ60Clickthelinktosendmoneytoyousry360218@instapayPoweredbyInstaPay" 
                icon={CreditCard} 
                label="InstaPay" 
                colorClass="hover:bg-purple-600 hover:text-white" 
              />
              <ActionButton 
                href="https://vf.eg/vfcash?id=mt&qrId=hvSwTd" 
                icon={Wallet} 
                label="Vodafone" 
                colorClass="hover:bg-[#E60000] hover:text-white" 
              />
              <ActionButton 
                href="https://link.gettap.co/16f0df" 
                icon={ArrowRight} 
                label="Tap" 
                colorClass="hover:bg-blue-500 hover:text-white" 
              />
            </div>
          </div>

          {/* 4. SOCIAL MEDIA - Smart Grid Layout */}
          <div className="space-y-6">
            <h4 className="font-black text-xs uppercase tracking-widest text-[#DC2626]">
              {lang === 'ar' ? 'تابعنا' : 'Social Media'}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-3">
              <ActionButton 
                href="https://www.facebook.com/share/1GUYMi3dKK/?mibextid=wwXIfr" 
                icon={Facebook} 
                label="Facebook" 
                colorClass="hover:bg-[#1877F2] hover:text-white" 
              />
              <ActionButton 
                href="https://www.instagram.com/marylandpharmacy2020?igsh=MWZhNm51eHdqYWptcg==" 
                icon={Instagram} 
                label="Instagram" 
                colorClass="hover:bg-[#E1306C] hover:text-white" 
              />
              <ActionButton 
                href="https://www.threads.com/@marylandpharmacy2020?invite=0" 
                icon={Share2} 
                label="Threads" 
                colorClass="hover:bg-white hover:text-black" 
              />
            </div>
          </div>
        </div>
        
        {/* BOTTOM COPYRIGHT */}
        <div className="border-t border-white/5 pt-8 flex flex-col items-center gap-3 text-center">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
            © {currentYear} MARYLAND PHARMACY.
          </p>
          <a 
            href="https://www.linkedin.com/in/mahmoud-kassem-91aa22305/"
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-slate-600 hover:text-[#DC2626] text-[10px] font-black uppercase tracking-widest transition-colors duration-300"
          >
            <Code size={10} className="stroke-[3]" />
            {lang === 'ar' ? 'تصميم وتطوير محمود قاسم' : 'Designed & Developed by Mahmoud Kassem'}
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;