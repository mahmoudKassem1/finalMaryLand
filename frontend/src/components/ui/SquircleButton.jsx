import React from 'react';

const SquircleButton = ({ 
  children, 
  onClick, 
  icon: Icon, 
  variant = "primary", 
  className = "",
  fullWidth = false 
}) => {
  
  const variants = {
    // Brand Red for primary actions (Buy Now / Login)
    primary: "bg-[#DC2626] text-white hover:bg-black shadow-lg shadow-red-500/30",
    // Deep Black for secondary actions (Add to Cart)
    secondary: "bg-[#0F172A] text-white hover:bg-[#DC2626] shadow-lg shadow-black/20",
    // Outline for subtle actions
    outline: "bg-transparent border-2 border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626] hover:text-white"
  };

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center gap-2
        px-6 py-3 
        rounded-2xl 
        font-bold 
        text-sm
        transition-all 
        duration-300 
        active:scale-95
        ${fullWidth ? 'w-full' : 'w-auto'}
        ${variants[variant]}
        ${className}
      `}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

export default SquircleButton;