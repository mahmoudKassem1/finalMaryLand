import React from 'react';
import { useApp } from '../../context/AppContext';
import GlassCard from '../../components/ui/GlassCard';
import SquircleButton from '../../components/ui/SquircleButton';
import { Phone, MessageCircle, MapPin, Facebook, Instagram, Clock, Send, Navigation } from 'lucide-react';

const ContactUs = () => {
  const { lang } = useApp();

  const contacts = {
    whatsapp: ['+201000686866', '+201000076890', '+201033520476'],
    landline: ['03 5408605', '03 5499475'],
    facebook: "https://www.facebook.com/share/1GUYMi3dKK/?mibextid=wwXIfr",
    instagram: "https://www.instagram.com/marylandpharmacy2020?igsh=MWZhNm51eHdqYWptcg==",
    // Updated to exact coordinates for Maryland Pharmacy (Miami Branch)
    coordinates: "31.2668,29.9895"
  };

  const handleGetDirections = () => {
    // Detect iOS devices
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // Use exact coordinates for navigation to ensure accuracy
    const url = isIOS 
      ? `maps://maps.apple.com/?q=${contacts.coordinates}`
      : `https://www.google.com/maps/search/?api=1&query=${contacts.coordinates}`;
    
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20 animate-fade-in" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black text-[#0F172A] uppercase tracking-tighter">
          {lang === 'en' ? 'Contact' : 'تواصل'} <span className="text-[#DC2626]">{lang === 'en' ? 'Us' : 'معنا'}</span>
        </h1>
        <p className="text-slate-500 font-bold max-w-lg mx-auto text-sm sm:text-base">
          {lang === 'en' 
            ? "We are here to help you 24/7. Reach out through any of our channels." 
            : "نحن هنا لمساعدتك على مدار الساعة. تواصل معنا عبر أي من قنواتنا."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT: Contact Methods */}
        <div className="space-y-6">
          <GlassCard className="p-6 sm:p-8 space-y-8">
            <section>
              <h3 className="flex items-center gap-2 text-[#DC2626] font-black text-xs uppercase tracking-widest mb-4">
                <MessageCircle size={18} /> {lang === 'en' ? 'WhatsApp' : 'واتساب'}
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {contacts.whatsapp.map(num => (
                  <a key={num} href={`https://wa.me/${num.replace('+', '')}`} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl hover:bg-emerald-50 transition-colors group">
                    <span className="font-mono font-bold text-[#0F172A] text-sm sm:text-base">{num}</span>
                    <Send size={16} className="text-emerald-500 group-hover:translate-x-1 transition-transform" />
                  </a>
                ))}
              </div>
            </section>

            <section>
              <h3 className="flex items-center gap-2 text-[#DC2626] font-black text-xs uppercase tracking-widest mb-4">
                <Phone size={18} /> {lang === 'en' ? 'Landline' : 'الخط الأرضي'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {contacts.landline.map(num => (
                  <a key={num} href={`tel:${num.replace(/\s/g, '')}`} className="p-4 bg-slate-50 rounded-2xl font-mono font-bold text-center hover:bg-red-50 transition-colors text-sm">
                    {num}
                  </a>
                ))}
              </div>
            </section>

            {/* Social Media Buttons */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SquircleButton 
                variant="secondary" 
                fullWidth 
                icon={Facebook}
                onClick={() => window.open(contacts.facebook, '_blank')}
                className="bg-blue-500 text-blue-600 hover:bg-blue-100 border-blue-100"
              >
                Facebook
              </SquircleButton>

              <SquircleButton 
                variant="secondary" 
                fullWidth 
                icon={Instagram}
                onClick={() => window.open(contacts.instagram, '_blank')}
                className="bg-pink-500 text-white-600 hover:bg-pink-100 border-pink-100"
              >
                Instagram
              </SquircleButton>
            </section>

          </GlassCard>
        </div>

        {/* RIGHT: Location & Map */}
        <div className="space-y-6">
          <GlassCard className="p-0 overflow-hidden h-full flex flex-col">
            <div className="p-6 sm:p-8 space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="flex items-center gap-2 text-[#DC2626] font-black text-xs uppercase tracking-widest">
                    <MapPin size={18} /> {lang === 'en' ? 'Location' : 'الموقع'}
                  </h3>
                  <p className="font-black text-[#0F172A] text-lg">
                    {lang === 'en' ? 'Alexandria, Egypt' : 'الإسكندرية، مصر'}
                  </p>
                </div>
                <div className="bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase">
                  <Clock size={12} /> {lang === 'en' ? '24 Hours' : '٢٤ ساعة'}
                </div>
              </div>

              {/* GET DIRECTIONS BUTTON */}
              <SquircleButton 
                variant="primary" 
                fullWidth 
                icon={Navigation}
                onClick={handleGetDirections}
              >
                {lang === 'en' ? 'Get Directions' : 'الحصول على الاتجاهات'}
              </SquircleButton>
            </div>
            
            {/* Embedded Google Map */}
            <div className="flex-1 min-h-[300px] bg-slate-100 relative">
              <iframe 
                title="Maryland Location"
                // Using precise coordinates to pin "Maryland Pharmacy" exactly on the map
                src={`https://maps.google.com/maps?q=${contacts.coordinates}+(Maryland+Pharmacy)&hl=${lang}&z=16&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '350px' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;