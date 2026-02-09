import React from 'react';
import { Link } from 'react-router-dom'; 
import { useApp } from '../../context/AppContext';
import { Phone, MessageCircle, Facebook, MapPin, Instagram, ArrowRight, Code } from 'lucide-react'; 
import Logo from '../ui/Logo';

const Footer = () => {
  const { lang } = useApp();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0F172A] text-white pt-12 pb-8 border-t border-white/5" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          {/* 1. BRAND SECTION & CONTACT LINK */}
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
                  ? 'نحن نقدم أفضل الحلول الطبية والمنتجات الحصرية بجودة عالمية في قلب الإسكندرية.' 
                  : 'Providing top-tier medical solutions and exclusive products with global standards in the heart of Alexandria.'}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <MapPin size={16} className="text-[#DC2626]" />
                <span>{lang === 'ar' ? 'الإسكندرية، مصر' : 'Alexandria, Egypt'}</span>
              </div>

              <Link 
                to="/contact" 
                className="inline-flex items-center gap-2 text-sm font-bold text-white hover:text-[#DC2626] transition-colors group"
              >
                {lang === 'ar' ? 'تواصل معنا الآن' : 'Contact Us Now'}
                <ArrowRight size={16} className={`transition-transform ${lang === 'ar' ? 'group-hover:-translate-x-1 rotate-180' : 'group-hover:translate-x-1'}`} />
              </Link>
            </div>
          </div>
          
          {/* 2. CONTACT INFO */}
          <div className="space-y-6">
            <div>
              <h4 className="font-black text-xs uppercase tracking-widest text-[#DC2626] mb-4">
                {lang === 'ar' ? 'موبايل و واتساب' : 'Mobile & WhatsApp'}
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
            </div>
          </div>

          {/* 3. LANDLINE & SOCIAL */}
          <div className="space-y-6">
            <div>
              <h4 className="font-black text-xs uppercase tracking-widest text-[#DC2626] mb-4">
                {lang === 'ar' ? 'الخط الأرضي' : 'Landline'}
              </h4>
              <ul className="space-y-3 text-slate-300 font-mono text-sm">
                <li className="flex items-center gap-3">
                  <Phone size={16} className="text-slate-500" /> 03 5408605
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={16} className="text-slate-500" /> 03 5499475
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-xs uppercase tracking-widest text-[#DC2626] mb-3">
                {lang === 'ar' ? 'تابعنا' : 'Follow Us'}
              </h4>
              
              <div className="flex flex-wrap gap-3">
                <a 
                  href="https://www.facebook.com/share/1GUYMi3dKK/?mibextid=wwXIfr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white/5 hover:bg-[#1877F2] hover:text-white px-4 py-2 rounded-xl transition-all duration-300 text-slate-300"
                >
                  <Facebook size={20} />
                  <span className="text-sm font-bold">Facebook</span>
                </a>

                <a 
                  href="https://www.instagram.com/marylandpharmacy2020?igsh=MWZhNm51eHdqYWptcg==" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white/5 hover:bg-[#E1306C] hover:text-white px-4 py-2 rounded-xl transition-all duration-300 text-slate-300"
                >
                  <Instagram size={20} />
                  <span className="text-sm font-bold">Instagram</span>
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* BOTTOM COPYRIGHT & DEVELOPER CREDIT */}
        <div className="border-t border-white/5 pt-8 flex flex-col items-center gap-3 text-center">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
            © {currentYear} MARYLAND PHARMACY. ALL RIGHTS RESERVED.
          </p>
          
          {/* ✅ DEVELOPER CREDIT */}
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