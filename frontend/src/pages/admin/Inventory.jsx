import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Plus, Trash2, Edit3, Package, Save, X,
  UploadCloud, Star, Loader2, AlertTriangle, RotateCcw, Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axios';
import { useApp } from '../../context/AppContext';
import GlassCard from '../../components/ui/GlassCard';
import SquircleButton from '../../components/ui/SquircleButton';
import { toast } from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────
const LIMIT = 20; // Smaller page size works better for lazy loading

const CATEGORIES = [
  { value: '',                  label: 'All Categories',   labelAr: 'كل الأقسام'      },
  { value: 'medication',        label: 'Medication',       labelAr: 'أدوية'            },
  { value: 'beauty',            label: 'Beauty',           labelAr: 'تجميل'            },
  { value: 'personal-care',     label: 'Personal Care',    labelAr: 'عناية شخصية'      },
  { value: 'mom-and-baby',      label: 'Mom & Baby',       labelAr: 'أم وطفل'          },
  { value: 'vitamins',          label: 'Vitamins',         labelAr: 'فيتامينات'        },
  { value: 'maryland-products', label: 'Maryland',         labelAr: 'ماريلاند'         },
];

// ─── Component ────────────────────────────────────────────────────────────────
const Inventory = () => {
  const { lang } = useApp();
  const navigate = useNavigate();

  // ── Data & pagination state ──
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage]             = useState(1);
  const [hasMore, setHasMore]       = useState(true);
  const [total, setTotal]           = useState(0);

  // ── Filter state ──
  const [searchQuery, setSearchQuery]   = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);

  // ── Edit state ──
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm]             = useState({});
  const [imageFile, setImageFile]           = useState(null);
  const [imagePreview, setImagePreview]     = useState(null);
  const [isSaving, setIsSaving]             = useState(false);

  // ── Infinite scroll sentinel ──
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  // ── Debounce search ──
  const searchTimerRef = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(val), 350);
  };

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async (pageNum, isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      const params = {
        page: pageNum,
        limit: LIMIT,
        ...(showLowStock           && { lowStock: true }),
        ...(activeCategory         && { category: activeCategory }),
        ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
      };

      const { data } = await api.get('/products', { params });

      const incoming = data.products || data || [];
      const serverHasMore = data.hasMore ?? (incoming.length === LIMIT);

      if (isInitial) {
        setProducts(incoming);
      } else {
        setProducts(prev => {
          // Deduplicate by _id in case of edge-case double-fetch
          const existingIds = new Set(prev.map(p => p._id));
          const fresh = incoming.filter(p => !existingIds.has(p._id));
          return [...prev, ...fresh];
        });
      }

      setHasMore(serverHasMore);
      setTotal(data.total ?? 0);
    } catch (err) {
      toast.error('Failed to load inventory');
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [showLowStock, activeCategory, debouncedSearch]);

  // Reset + refetch whenever filters change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchProducts(1, true);
  }, [showLowStock, activeCategory, debouncedSearch, fetchProducts]);

  // ─── Infinite scroll via IntersectionObserver ────────────────────────────
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchProducts(nextPage, false);
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);

    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingMore, loading, page, fetchProducts]);

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(prev => prev.filter(p => p._id !== id));
      setTotal(prev => prev - 1);
      toast.success(lang === 'en' ? 'Product deleted' : 'تم حذف المنتج');
    } catch {
      toast.error('Failed to delete product');
    }
  };

  // ─── Edit handlers ────────────────────────────────────────────────────────
  const startEdit = (product) => {
    setEditingProduct(product._id);
    setEditForm({
      title:       product.title,
      price:       product.price,
      stock:       product.stock,
      category:    product.category,
      description: product.description,
      image:       product.imageURL || product.image,
      isMaryland:  product.isMaryland === true,
    });
    setImagePreview(product.imageURL || product.image);
    setImageFile(null);
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setEditForm({});
    setImageFile(null);
    setImagePreview(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImageFile(null);
    setImagePreview(null);
    setEditForm(prev => ({ ...prev, image: '' }));
    const input = document.getElementById('file-upload');
    if (input) input.value = '';
  };

  const uploadImageToCloudinary = async () => {
    if (!imageFile) return editForm.image;
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('upload_preset', 'pharmacy_upload');
    formData.append('cloud_name', 'dmfylmsqu');
    const res = await fetch('https://api.cloudinary.com/v1_1/dmfylmsqu/image/upload', {
      method: 'POST',
      body: formData,
    });
    const fileData = await res.json();
    if (!fileData.secure_url) throw new Error(fileData.error?.message || 'Cloudinary error');
    return fileData.secure_url;
  };

  const saveEdit = async () => {
    setIsSaving(true);
    try {
      const finalImageUrl  = await uploadImageToCloudinary();
      const finalIsMaryland = editForm.category === 'maryland-products' ? true : editForm.isMaryland;

      const { data } = await api.put(`/products/${editingProduct}`, {
        ...editForm,
        isMaryland: finalIsMaryland,
        image: finalImageUrl,
      });

      setProducts(prev => prev.map(p => p._id === editingProduct ? data : p));
      toast.success(lang === 'en' ? 'Product updated' : 'تم تحديث المنتج');
      cancelEdit();
    } catch {
      toast.error('Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setActiveCategory('');
    setShowLowStock(false);
  };

  const hasActiveFilters = showLowStock || activeCategory || debouncedSearch;

  // ─── Styles ───────────────────────────────────────────────────────────────
  const inputClasses = 'w-full p-4 rounded-2xl bg-[#0F172A] border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626] transition-all duration-300';
  const labelClasses = 'text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1 block';

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-black flex items-center gap-2">
            <Package className="text-[#DC2626]" />
            {lang === 'ar' ? 'إدارة المخزون' : 'Inventory Management'}
          </h2>
          {total > 0 && (
            <p className="text-sm text-slate-400 mt-0.5 ml-8">
              {total.toLocaleString()} {lang === 'ar' ? 'منتج إجمالي' : 'total products'}
              {products.length < total && (
                <span className="text-slate-500">
                  {' '}· {lang === 'ar' ? `عرض ${products.length}` : `showing ${products.length}`}
                </span>
              )}
            </p>
          )}
        </div>

        {!editingProduct && (
          <div className="flex flex-wrap w-full gap-2 lg:justify-end items-center">
            {/* Search */}
            <div className="group relative flex-1 min-w-[180px] max-w-xs">
              <input
                type="text"
                placeholder={lang === 'ar' ? 'بحث في المنتجات...' : 'Search products...'}
                className="w-full rounded-xl border border-white/10 bg-[#0F172A] py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 transition-all focus:border-[#DC2626] focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#DC2626] transition-colors" />
            </div>

            {/* Low Stock */}
            <button
              onClick={() => setShowLowStock(v => !v)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-tighter transition-all border-2 h-[46px] ${
                showLowStock
                  ? 'bg-[#DC2626] border-[#DC2626] text-white shadow-lg shadow-red-500/20'
                  : 'bg-[#0F172A] border-white/10 text-slate-400 hover:border-[#DC2626] hover:text-white'
              }`}
            >
              <AlertTriangle size={14} className={showLowStock ? 'animate-pulse' : ''} />
              {lang === 'ar' ? 'النواقص' : 'Low Stock'}
            </button>

            {/* Reset */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-black border-2 border-black text-white font-black text-[10px] uppercase tracking-tighter hover:bg-zinc-800 transition-all h-[46px]"
              >
                <RotateCcw size={14} />
                {lang === 'ar' ? 'إعادة ضبط' : 'Reset'}
              </button>
            )}

            {/* Add Product */}
            <SquircleButton
              onClick={() => navigate('/management-panel/add-product')}
              variant="primary"
              className="shrink-0 h-[46px]"
            >
              <Plus size={18} />
              <span>{lang === 'ar' ? 'إضافة' : 'Add'}</span>
            </SquircleButton>
          </div>
        )}
      </div>

      {/* ── Category Filter Pills ── */}
      {!editingProduct && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <Filter size={14} className="text-slate-500 shrink-0" />
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-black uppercase tracking-tight transition-all duration-200 border ${
                  isActive
                    ? 'bg-[#DC2626] border-[#DC2626] text-white shadow-md shadow-red-900/30'
                    : 'bg-[#0F172A] border-white/10 text-slate-400 hover:border-white/30 hover:text-white'
                }`}
              >
                {lang === 'ar' ? cat.labelAr : cat.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Edit Form ── */}
      {editingProduct ? (
        <GlassCard variant="dark" className="p-8 border-2 border-[#DC2626]/50 animate-fade-in shadow-[0_0_40px_rgba(0,0,0,0.3)]">
          <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-[#DC2626] p-2 rounded-lg">
                <Edit3 size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Edit Product</h3>
            </div>
            <button onClick={cancelEdit} className="p-3 bg-white/5 rounded-full hover:bg-[#DC2626] hover:text-white text-slate-400 transition-all duration-300">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Image + Maryland toggle */}
            <div className="col-span-1 space-y-6">
              <div>
                <label className={labelClasses}>Product Image</label>
                <div className="relative h-64 w-full rounded-3xl border-2 border-dashed border-white/20 bg-black/20 hover:border-[#DC2626] transition-all duration-300 overflow-hidden group">
                  {imagePreview ? (
                    <div className="absolute inset-0 z-10 bg-[#0F172A] flex items-center justify-center">
                      <img src={imagePreview} alt="Preview" className="h-full w-full object-contain p-2" />
                      <button onClick={handleRemoveImage} className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg z-50">
                        <Trash2 size={14} />
                      </button>
                      <label htmlFor="file-upload" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer z-40">
                        <UploadCloud size={32} className="text-white mb-2" />
                        <p className="text-white font-bold text-sm">Click to Change</p>
                      </label>
                    </div>
                  ) : (
                    <label htmlFor="file-upload" className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 group-hover:text-[#DC2626] transition-colors cursor-pointer z-10">
                      <UploadCloud size={48} className="mb-4" />
                      <p className="font-bold text-sm">Click to Upload</p>
                    </label>
                  )}
                  <input id="file-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </div>
              </div>

              {/* Maryland toggle */}
              <div
                className={`p-4 rounded-2xl border backdrop-blur-md transition-all duration-300 cursor-pointer flex items-center justify-between select-none ${
                  editForm.isMaryland ? 'border-[#DC2626] bg-[#DC2626]/20' : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
                onClick={() => setEditForm(prev => ({ ...prev, isMaryland: !prev.isMaryland }))}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg transition-colors ${editForm.isMaryland ? 'bg-[#DC2626] text-white' : 'bg-white/10 text-slate-400'}`}>
                    <Star size={20} fill={editForm.isMaryland ? 'currentColor' : 'none'} />
                  </div>
                  <div>
                    <p className={`font-bold text-sm transition-colors ${editForm.isMaryland ? 'text-white' : 'text-slate-400'}`}>Maryland Exclusive</p>
                    <p className="text-[10px] text-slate-500">Prioritize on Home Page</p>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${editForm.isMaryland ? 'bg-[#DC2626]' : 'bg-slate-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-md ${editForm.isMaryland ? 'left-7' : 'left-1'}`} />
                </div>
              </div>
            </div>

            {/* Fields */}
            <div className="col-span-1 lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className={labelClasses}>Product Title</label>
                  <input type="text" value={editForm.title || ''} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className={inputClasses} />
                </div>
                <div className="space-y-1">
                  <label className={labelClasses}>Category</label>
                  <div className="relative">
                    <select
                      value={editForm.category || ''}
                      onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                      className={`${inputClasses} appearance-none cursor-pointer [&>option]:bg-[#0F172A] [&>option]:text-white`}
                    >
                      {CATEGORIES.filter(c => c.value).map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className={labelClasses}>Price (EGP)</label>
                  <input type="number" value={editForm.price || ''} onChange={e => setEditForm({ ...editForm, price: e.target.value })} className={inputClasses} />
                </div>
                <div className="space-y-1">
                  <label className={labelClasses}>Stock Quantity</label>
                  <input type="number" value={editForm.stock ?? ''} onChange={e => setEditForm({ ...editForm, stock: e.target.value })} className={inputClasses} />
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelClasses}>Description</label>
                <textarea rows="4" value={editForm.description || ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className={`${inputClasses} resize-none`} />
              </div>

              <div className="pt-4 flex gap-4">
                <button onClick={cancelEdit} className="flex-1 py-4 rounded-2xl border border-white/10 text-white font-bold hover:bg-white/5 transition-colors">
                  Cancel
                </button>
                <div className="flex-1">
                  <SquircleButton onClick={saveEdit} loading={isSaving} variant="primary" fullWidth icon={Save}>
                    Save Changes
                  </SquircleButton>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

      ) : (
        /* ── Product List ── */
        <div className="space-y-3">

          {/* Initial loading skeleton */}
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-2xl bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/5 animate-pulse"
                  style={{ animationDelay: `${i * 80}ms` }}
                />
              ))}
            </div>
          )}

          {/* Product rows */}
          {!loading && products.map((product, idx) => (
            <GlassCard
              key={product._id}
              variant="dark"
              className={`p-4 flex items-center justify-between group hover:border-[#DC2626]/50 hover:bg-white/5 transition-all duration-300
                ${product.stock < 10 ? 'border-l-4 border-l-red-600 shadow-[inset_10px_0_20px_-10px_rgba(220,38,38,0.2)]' : ''}
              `}
              style={{ animationDelay: `${(idx % LIMIT) * 30}ms` }}
            >
              <div className="flex items-center gap-4 min-w-0">
                {/* Thumbnail */}
                <div className="w-16 h-16 bg-white rounded-xl p-1.5 flex items-center justify-center overflow-hidden shadow-lg relative shrink-0">
                  {(product.imageURL || product.image) ? (
                    <img
                      src={product.imageURL || product.image}
                      alt={product.title}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <Package size={24} className="text-slate-300" />
                  )}
                  {product.isMaryland && (
                    <div className="absolute top-0 right-0 p-1 bg-[#DC2626] rounded-bl-lg shadow-md z-10">
                      <Star size={10} className="text-white" fill="white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0">
                  <h3 className="font-bold text-white text-base leading-tight group-hover:text-[#DC2626] transition-colors truncate max-w-[220px] sm:max-w-none">
                    {product.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs mt-1">
                    <span className="text-slate-500 uppercase tracking-wider">{product.category}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold ${
                      product.stock > 10 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {product.stock} {lang === 'ar' ? 'مخزون' : 'in stock'}
                    </span>
                    {product.isMaryland && (
                      <span className="text-[#DC2626] font-bold text-[9px] border border-[#DC2626]/50 px-1.5 py-0.5 rounded bg-[#DC2626]/10 uppercase">
                        Exclusive
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Price + Actions */}
              <div className="flex items-center gap-4 shrink-0">
                <p className="font-black text-lg text-[#DC2626] whitespace-nowrap hidden sm:block">
                  {product.price} <span className="text-xs text-slate-500">EGP</span>
                </p>
                <div className="flex gap-2 opacity-100 sm:opacity-40 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(product)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-[#DC2626] text-slate-300 hover:text-white transition-all shadow-lg hover:shadow-red-900/40"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-red-950 text-slate-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}

          {/* ── Infinite scroll sentinel ── */}
          <div ref={sentinelRef} className="h-4" />

          {/* Loading more spinner */}
          {loadingMore && (
            <div className="flex justify-center py-6">
              <div className="flex items-center gap-3 text-slate-500">
                <Loader2 size={20} className="animate-spin text-[#DC2626]" />
                <span className="text-sm font-bold uppercase tracking-widest">
                  {lang === 'ar' ? 'تحميل المزيد...' : 'Loading more...'}
                </span>
              </div>
            </div>
          )}

          {/* End of list */}
          {!hasMore && products.length > 0 && (
            <div className="flex items-center gap-4 py-6">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-xs text-slate-600 font-bold uppercase tracking-widest">
                {lang === 'ar' ? `تم عرض كل ${products.length} منتج` : `All ${products.length} products loaded`}
              </span>
              <div className="flex-1 h-px bg-white/5" />
            </div>
          )}

          {/* Empty state */}
          {!loading && products.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <Package size={48} className="mx-auto text-slate-700" />
              <p className="font-bold text-slate-500">
                {lang === 'ar' ? 'لا توجد منتجات' : 'No products found'}
              </p>
              {hasActiveFilters && (
                <button onClick={resetFilters} className="text-xs text-[#DC2626] font-bold uppercase tracking-wider hover:underline">
                  {lang === 'ar' ? 'مسح الفلاتر' : 'Clear filters'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Inventory;