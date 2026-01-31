import React from 'react';
import { useApp } from '../../context/AppContext';

const GlassCard = ({ children, className = "", variant = "light" }) => {
  const { lang } = useApp();
  
  // Variants for different actors/pages
  const styles = {
    light: "bg-white/70 border-white/30 text-[#0F172A]",
    dark: "bg-[#0F172A]/80 border-white/10 text-white",
    red: "bg-[#DC2626]/10 border-[#DC2626]/20 text-[#0F172A]"
  };

  return (
    <div 
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className={`
        backdrop-blur-xl 
        rounded-[2.5rem] 
        border 
        shadow-2xl 
        transition-all 
        duration-300 
        ${styles[variant]} 
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default GlassCard;