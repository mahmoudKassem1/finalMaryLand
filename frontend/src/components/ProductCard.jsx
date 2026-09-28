import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import GlassCard from './ui/GlassCard';
import SquircleButton from './ui/SquircleButton';
import PriceInquiryNotice from './PriceInquiryNotice';

const ProductCard = ({
  product,
  addToCart,
  navigate,
  lang,
  t,
  isNoticeOpen,
  onToggleNotice,
}) => (
  <div
    onClick={() => navigate(`/category/${product.category}/${product._id}`)}
    className="cursor-pointer group h-full flex flex-col select-none"
  >
    <GlassCard className="p-3 sm:p-4 flex flex-col justify-between h-full transition-all duration-300 hover:shadow-xl border-slate-100 bg-white rounded-2xl">
      <div className="flex-1 flex flex-col">
        <div className="relative aspect-square w-full bg-white rounded-xl mb-3 flex items-center justify-center border border-slate-50 overflow-hidden shrink-0">
          {(product.imageURL || product.image) ? (
            <img
              src={product.imageURL || product.image}
              alt={product.title}
              className="w-full h-full object-contain p-2 sm:p-3 transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="text-[#DC2626] font-black opacity-20 text-4xl uppercase">
              {product.category?.substring(0, 2) || 'RX'}
            </span>
          )}
          {product.isMaryland && (
            <div className="absolute top-2 start-2 bg-[#DC2626] text-white text-[8px] sm:text-[9px] px-2 py-0.5 rounded-full font-black tracking-wider shadow-md">
              {lang === 'en' ? 'MARYLAND' : 'ماريلاند'}
            </div>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-slate-800 text-white text-[9px] sm:text-xs font-bold px-2 sm:px-3 py-1 rounded-full">
                {lang === 'en' ? 'Out of Stock' : 'غير متوفر'}
              </span>
            </div>
          )}
        </div>

        <h3 className="text-[11px] sm:text-xs md:text-sm font-black mb-1.5 text-[#0F172A] line-clamp-2 h-7 sm:h-9 uppercase group-hover:text-[#DC2626] transition-colors leading-tight">
          {product.title}
        </h3>
        <div className="mt-auto">
          <PriceInquiryNotice
            product={product}
            compact={true}
            lang={lang}
            isOpen={isNoticeOpen}
            onToggle={onToggleNotice}
          />
        </div>
      </div>

      <div className="mt-2.5" onClick={(event) => event.stopPropagation()}>
        <SquircleButton
          variant="primary"
          fullWidth
          className="!py-2 sm:!py-2.5 !rounded-xl"
          disabled={product.stock === 0}
          onClick={(event) => {
            event.stopPropagation();
            addToCart(product);
            toast.success(lang === 'en' ? 'Added to cart' : 'تم الإضافة للسلة');
          }}
        >
          <div className="flex items-center justify-center gap-1.5">
            <ShoppingCart size={15} />
            <span className="uppercase text-[9px] sm:text-[10px] font-bold">
              {t.addToCart || (lang === 'en' ? 'Add to Cart' : 'أضف للسلة')}
            </span>
          </div>
        </SquircleButton>
      </div>
    </GlassCard>
  </div>
);

export default ProductCard;