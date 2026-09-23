import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const BackButton = ({ fallback = '/', label, onClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useApp();
  const isAr = lang === 'ar';
  const Icon = isAr ? ArrowRight : ArrowLeft;

  const goBack = () => {
    if (onClick) {
      onClick();
      return;
    }
    if (location.key && location.key !== 'default') {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={label || (isAr ? 'رجوع' : 'Go back')}
      title={label || (isAr ? 'رجوع' : 'Go back')}
      className="inline-flex min-h-10 min-w-10 items-center justify-center gap-2 rounded-xl bg-slate-100 p-2.5 text-slate-700 hover:bg-slate-200 hover:text-[#DC2626] active:scale-95 transition-all"
    >
      <Icon size={18} />
      {label && <span className="text-xs font-bold">{label}</span>}
    </button>
  );
};

export default BackButton;
