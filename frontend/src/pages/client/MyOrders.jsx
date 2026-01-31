import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axios'; // Your axios instance
import { useApp } from '../../context/AppContext';
import GlassCard from '../../components/ui/GlassCard';
import SquircleButton from '../../components/ui/SquircleButton';
import { Package, Clock, Phone, AlertCircle, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lang } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/orders/myorders');
        
        // FILTER: Last 7 Days Only
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentOrders = data.filter(order => new Date(order.createdAt) >= sevenDaysAgo);
        setOrders(recentOrders);
      } catch (error) {
        console.error(error);
        toast.error(lang === 'en' ? 'Failed to load orders' : 'فشل تحميل الطلبات');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [lang]);

  // Helper to get status color/text
  const getStatusBadge = (status) => {
    switch (status) {
      case 'New': return { color: 'bg-blue-100 text-blue-600', icon: Clock, label: lang === 'en' ? 'Processing' : 'قيد التجهيز' };
      case 'Delivered': return { color: 'bg-emerald-100 text-emerald-600', icon: CheckCircle2, label: lang === 'en' ? 'Delivered' : 'تم التوصيل' };
      case 'Cancelled': return { color: 'bg-red-100 text-red-600', icon: XCircle, label: lang === 'en' ? 'Cancelled' : 'ملغي' };
      default: return { color: 'bg-slate-100 text-slate-600', icon: Package, label: status };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#DC2626]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-[#0F172A] uppercase tracking-tight">
          {lang === 'en' ? 'Recent Orders' : 'الطلبات الحديثة'}
        </h1>
        <p className="text-slate-500 font-medium">
          {lang === 'en' ? 'History of the last 7 days' : 'سجل طلبات آخر ٧ أيام'}
        </p>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {orders.length === 0 ? (
          <GlassCard className="p-12 text-center flex flex-col items-center gap-4">
            <div className="bg-slate-100 p-6 rounded-full text-slate-300">
              <Package size={48} />
            </div>
            <h3 className="text-xl font-bold text-slate-700">
              {lang === 'en' ? 'No recent orders' : 'لا يوجد طلبات حديثة'}
            </h3>
            <SquircleButton onClick={() => navigate('/')} variant="primary">
              {lang === 'en' ? 'Start Shopping' : 'ابدأ التسوق'}
            </SquircleButton>
          </GlassCard>
        ) : (
          orders.map((order) => {
            const statusObj = getStatusBadge(order.status || 'New');
            const StatusIcon = statusObj.icon;

            return (
              <GlassCard key={order._id} className="p-6 border-2 border-slate-100 hover:border-[#DC2626]/30 transition-all">
                
                {/* Order Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-6 border-b border-slate-100 gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-black text-lg text-[#0F172A]">#{order._id.slice(-6).toUpperCase()}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${statusObj.color}`}>
                        <StatusIcon size={14} />
                        {statusObj.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-bold uppercase">
                      {new Date(order.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-EG', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase font-bold">{lang === 'en' ? 'Total Amount' : 'الإجمالي'}</p>
                    <p className="text-2xl font-black text-[#DC2626]">{order.totalAmount || order.totalPrice} EGP</p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-3 mb-6">
                  {order.orderItems.map((item, idx) => {
                    // ✅ FIX: Smart Display Logic
                    // 1. Try 'item.product.title' (from populated DB)
                    // 2. Fallback to 'item.name' (from saved Order)
                    // 3. Last resort: "Unknown"
                    const displayName = item.product?.title || item.name || "Unknown Product";

                    return (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-3">
                          <span className="bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded-lg text-xs">
                            x{item.qty || item.quantity}
                          </span>
                          <span className="font-medium text-slate-700">
                            {displayName}
                          </span>
                        </div>
                        <span className="font-bold text-slate-900">{item.price} EGP</span>
                      </div>
                    );
                  })}
                </div>

                {/* Actions Footer */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <Package size={16} />
                    <span>{order.orderItems.length} {lang === 'en' ? 'Items' : 'عناصر'}</span>
                  </div>

                  {/* Cancel Button -> Contact Us */}
                  {(order.status === 'New' || !order.status) && (
                     <button 
                       onClick={() => navigate('/contact')}
                       className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors text-sm font-bold"
                     >
                       <Phone size={16} />
                       {lang === 'en' ? 'Contact to Cancel' : 'اتصل للإلغاء'}
                       <ArrowRight size={16} className={lang === 'ar' ? 'rotate-180' : ''} />
                     </button>
                  )}
                </div>

              </GlassCard>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyOrders;