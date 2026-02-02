import React, { useState, useEffect } from 'react';
import { Loader2, Calendar, User, Package, Eye, X, Phone, MapPin, Mail, ArrowRight, Search, CreditCard, Smartphone, Wallet, Banknote } from 'lucide-react';
import { toast } from 'react-hot-toast';

import api from '../../utils/axios';
import { useApp } from '../../context/AppContext';
import GlassCard from '../../components/ui/GlassCard';

const Orders = () => {
  const { lang } = useApp();
  
  // --- STATE ---
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]); // ✅ For Search
  const [searchTerm, setSearchTerm] = useState('');         // ✅ Search Input
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // --- FETCH ORDERS ---
  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders');
      setOrders(data);
      setFilteredOrders(data); // Initialize filtered list
    } catch (error) {
      console.error("Orders Error:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // --- SEARCH HANDLER ---
  useEffect(() => {
    if (!searchTerm) {
      setFilteredOrders(orders);
    } else {
      const lowerTerm = searchTerm.toLowerCase();
      const filtered = orders.filter(order => 
        (order.user?.name || '').toLowerCase().includes(lowerTerm) ||
        (order._id || '').toLowerCase().includes(lowerTerm)
      );
      setFilteredOrders(filtered);
    }
  }, [searchTerm, orders]);

  // --- HANDLERS ---
  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await api.put(`/orders/${id}/status`, { status: newStatus });
      const updateList = (prev) => prev.map(order => 
        order._id === id ? { ...order, status: newStatus } : order
      );
      setOrders(updateList);
      setFilteredOrders(updateList); // Update filtered view too
      toast.success(lang === 'en' ? 'Status Updated' : 'تم تحديث الحالة');
    } catch (error) {
      toast.error("Update failed");
      console.error("Update Error:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  // --- HELPERS ---
  const getStatusStyles = (status) => {
    switch (status?.toLowerCase()) {
      case 'new': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'delivered': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const getPaymentBadge = (method) => {
    switch (method) {
      case 'InstaPay':
        return (
          <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold uppercase">
            <Smartphone size={12} /> InstaPay
          </span>
        );
      case 'VodafoneCash':
        return (
          <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold uppercase">
            <Wallet size={12} /> VF Cash
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase">
            <Banknote size={12} /> Cash
          </span>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64 text-slate-400">
      <Loader2 className="animate-spin text-[#DC2626]" size={40} />
    </div>
  );

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      
      {/* 1. PAGE HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 border-b border-white/10 pb-6">
        
        {/* Title Section */}
        <div className="flex items-center gap-4">
          <div className="bg-[#DC2626] p-3 rounded-2xl shadow-lg shadow-red-900/20">
            <Package className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-black uppercase tracking-tighter">
              {lang === 'ar' ? 'إدارة الطلبات' : 'Manage Orders'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-slate-400 text-sm font-bold">
                {filteredOrders.length} {lang === 'ar' ? 'طلب' : 'Orders Found'}
              </p>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="w-full md:w-auto relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="text-slate-500 group-focus-within:text-[#DC2626] transition-colors" size={18} />
          </div>
          <input 
            type="text" 
            placeholder={lang === 'ar' ? 'بحث باسم العميل أو رقم الطلب...' : 'Search by Customer Name or ID...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-80 bg-[#1E293B] border border-slate-700 text-white text-sm font-medium py-3 pl-10 pr-4 rounded-xl focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626] placeholder-slate-500 transition-all shadow-lg"
          />
        </div>
      </div>

      {/* 2. DESKTOP TABLE (High Contrast) */}
      <div className="hidden md:block rounded-3xl overflow-hidden border border-slate-700 bg-[#1E293B] shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0F172A] border-b border-slate-700 text-slate-400 text-xs font-black uppercase tracking-widest">
              <th className="px-6 py-5">Order ID</th>
              <th className="px-6 py-5">Customer</th>
              <th className="px-6 py-5">Date</th>
              <th className="px-6 py-5">Amount</th>
              <th className="px-6 py-5">Payment</th> {/* ✅ Added Column */}
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {filteredOrders.map((order) => (
              <tr key={order._id} className="group hover:bg-slate-800/50 transition-colors duration-200">
                
                {/* ID */}
                <td className="px-6 py-4">
                  <span className="font-mono text-sm font-bold text-slate-300 bg-slate-900 px-2 py-1 rounded-md border border-slate-700">
                    #{order._id.slice(-6).toUpperCase()}
                  </span>
                </td>

                {/* Customer */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-700 p-2 rounded-full shrink-0">
                      <User size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm leading-tight">
                        {order.user?.name || 'Guest User'}
                      </p>
                      <p className="text-xs text-slate-400">{order.user?.email}</p>
                    </div>
                  </div>
                </td>

                {/* Date */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                    <Calendar size={14} className="text-slate-500" />
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                </td>

                {/* Amount */}
                <td className="px-6 py-4">
                  <p className="font-black text-lg text-white">
                    {(order.totalAmount || 0).toLocaleString()} <span className="text-xs text-[#DC2626] font-bold">EGP</span>
                  </p>
                </td>

                {/* Payment Method (✅ New) */}
                <td className="px-6 py-4">
                  {getPaymentBadge(order.paymentMethod)}
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <span className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase border tracking-wide ${getStatusStyles(order.status)}`}>
                    {order.status}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-3">
                    {/* Status Select */}
                    <div className="relative group/select">
                      <select 
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        disabled={updatingId === order._id}
                        className="appearance-none bg-[#0F172A] border border-slate-600 hover:border-slate-400 text-white text-xs font-bold py-2 pl-3 pr-8 rounded-xl cursor-pointer focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626] transition-all disabled:opacity-50"
                      >
                        <option value="New">New</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      
                      {/* Chevron / Loader */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        {updatingId === order._id ? (
                          <Loader2 size={12} className="animate-spin text-[#DC2626]" />
                        ) : (
                          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* View Button */}
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 bg-[#DC2626]/10 hover:bg-[#DC2626] text-[#DC2626] hover:text-white rounded-xl transition-all border border-[#DC2626]/20 shadow-sm"
                      title="View Full Details"
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            <Search size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold">No orders found matching "{searchTerm}"</p>
          </div>
        )}
      </div>

      {/* 3. MOBILE CARDS (Responsive Layout) */}
      <div className="md:hidden space-y-4">
        {filteredOrders.map((order) => (
          <GlassCard key={order._id} variant="dark" className="p-5 border border-slate-700 bg-[#1E293B]">
            {/* Top Row: ID & Date */}
            <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
               <span className="font-mono text-xs font-bold bg-slate-900 px-2 py-1 rounded text-slate-300">
                 #{order._id.slice(-6).toUpperCase()}
               </span>
               <span className="text-xs text-slate-400 flex items-center gap-1">
                 <Calendar size={12} />
                 {new Date(order.createdAt).toLocaleDateString()}
               </span>
            </div>

            {/* Middle Row: User & Status */}
            <div className="flex justify-between items-start mb-4">
               <div>
                  <h3 className="text-white font-bold text-lg">{order.user?.name || 'Guest'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                     {getPaymentBadge(order.paymentMethod)} {/* ✅ Payment Badge */}
                     <span className="text-xs text-slate-500 font-medium">|</span>
                     <p className="text-sm font-black text-[#DC2626]">{(order.totalAmount || 0).toLocaleString()} EGP</p>
                  </div>
               </div>
               <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase border ${getStatusStyles(order.status)}`}>
                  {order.status}
               </span>
            </div>

            {/* Bottom Row: Actions */}
            <div className="flex gap-3 pt-2">
               <div className="relative flex-1">
                  <select 
                    value={order.status}
                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-600 text-white text-sm font-bold py-3 px-4 rounded-xl outline-none"
                  >
                    <option value="New">New</option>
                    <option value="Processing">Processing</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
               </div>
               <button 
                  onClick={() => setSelectedOrder(order)}
                  className="px-4 bg-[#DC2626] text-white rounded-xl flex items-center justify-center shadow-lg shadow-red-900/20 active:scale-95 transition-transform"
               >
                  <ArrowRight size={20} />
               </button>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* 4. MODAL: VIEW DETAILS */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl bg-[#0F172A] border border-slate-700 rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-[#1E293B] p-6 border-b border-slate-700 flex justify-between items-start rounded-t-3xl">
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                   Order Details
                   <span className="px-3 py-1 bg-[#DC2626] text-white text-xs rounded-full">#{selectedOrder._id.slice(-6).toUpperCase()}</span>
                </h3>
                <div className="flex items-center gap-3 mt-2">
                   {getPaymentBadge(selectedOrder.paymentMethod)} {/* ✅ Badge in Modal */}
                   <p className="text-slate-400 text-sm flex items-center gap-1">
                      <Calendar size={12}/> {formatDate(selectedOrder.createdAt)}
                   </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="p-2 bg-slate-800 hover:bg-[#DC2626] text-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-8">
              
              {/* Manual Payment Verification (If exists) */}
              {selectedOrder.paymentResult?.id && selectedOrder.paymentResult.id !== 'cash_on_delivery' && (
                <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex items-start gap-3">
                  <div className="bg-yellow-500/10 p-2 rounded-lg text-yellow-500">
                    <Eye size={20} />
                  </div>
                  <div>
                    <h4 className="text-yellow-500 font-bold text-sm uppercase">Manual Payment Verification</h4>
                    <p className="text-slate-400 text-xs mt-1">
                      The customer entered the following Transaction ID or Note:
                    </p>
                    <p className="text-white font-mono font-bold text-lg mt-1 bg-black/30 p-2 rounded border border-slate-700 inline-block">
                      {selectedOrder.paymentResult.id}
                    </p>
                  </div>
                </div>
              )}

              {/* Customer Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Section: Customer */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-[#DC2626] uppercase tracking-widest mb-4">
                    Customer Information
                  </h4>
                  
                  <div className="bg-[#1E293B] p-4 rounded-2xl border border-slate-700 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-slate-800 p-2.5 rounded-xl text-slate-300">
                        <User size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Full Name</p>
                        <p className="text-white font-bold">{selectedOrder.user?.name || 'Guest'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="bg-slate-800 p-2.5 rounded-xl text-slate-300">
                        <Mail size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Email Address</p>
                        <p className="text-white font-bold">{selectedOrder.user?.email || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="bg-slate-800 p-2.5 rounded-xl text-slate-300">
                        <Phone size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Phone Number</p>
                        <p className="text-white font-mono tracking-wider">
                           {selectedOrder.shippingAddress?.phone || selectedOrder.user?.phone || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Delivery */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-[#DC2626] uppercase tracking-widest mb-4">
                    Delivery Details
                  </h4>
                  
                  <div className="bg-[#1E293B] p-4 rounded-2xl border border-slate-700 h-full">
                    <div className="flex gap-4">
                      <div className="bg-slate-800 p-2.5 rounded-xl text-slate-300 h-fit">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Shipping Address</p>
                        <p className="text-white font-bold leading-relaxed text-lg">
                          {selectedOrder.shippingAddress?.city || 'Unknown City'}
                        </p>
                        <p className="text-slate-300 text-sm mt-1">
                          {selectedOrder.shippingAddress?.street || 'Unknown Street'}
                        </p>
                        {selectedOrder.shippingAddress?.aptNumber && (
                           <p className="text-slate-400 text-xs mt-1">Apt/Building: {selectedOrder.shippingAddress.aptNumber}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items List */}
              <div>
                <h4 className="text-xs font-black text-[#DC2626] uppercase tracking-widest mb-4">
                  Order Summary
                </h4>
                <div className="bg-[#1E293B] rounded-2xl border border-slate-700 overflow-hidden">
                  {selectedOrder.orderItems.map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-4 border-b border-slate-700 last:border-0 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <span className="bg-[#0F172A] text-white w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm border border-slate-700">
                          {item.qty || 1}
                        </span>
                        <div>
                          <p className="text-white font-bold">{item.name}</p>
                          <p className="text-xs text-slate-500">Unit Price: {(item.price || 0)} EGP</p>
                        </div>
                      </div>
                      <p className="text-white font-mono font-bold">
                        {((item.price || 0) * (item.qty || 1)).toLocaleString()} EGP
                      </p>
                    </div>
                  ))}
                  
                  {/* Total Footer */}
                  <div className="bg-[#0F172A] p-4 flex justify-between items-center">
                    <span className="text-slate-400 font-bold uppercase text-xs tracking-wider">Total Amount</span>
                    <span className="text-2xl font-black text-[#DC2626]">
                      {(selectedOrder.totalAmount || 0).toLocaleString()} <span className="text-sm text-slate-500">EGP</span>
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="p-6 bg-[#1E293B] border-t border-slate-700 rounded-b-3xl flex justify-end">
               <button 
                 onClick={() => setSelectedOrder(null)}
                 className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all"
               >
                 Close Details
               </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Orders;