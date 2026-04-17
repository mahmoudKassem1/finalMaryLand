import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Trash2, Edit3, Package, Save, X, UploadCloud, Star, ChevronDown, Loader2, AlertTriangle, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axios'; 
import { useApp } from '../../context/AppContext';
import GlassCard from '../../components/ui/GlassCard';
import SquircleButton from '../../components/ui/SquircleButton';
import { toast } from 'react-hot-toast';

const Inventory = () => {
  const { lang } = useApp();
  const navigate = useNavigate();
  
  // --- STATE ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // ✅ NEW: Filter & Pagination States
  const [showLowStock, setShowLowStock] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 50; 

  // Edit Mode States
  const [editingProduct, setEditingProduct] = useState(null); 
  const [editForm, setEditForm] = useState({}); 
  const [imageFile, setImageFile] = useState(null); 
  const [imagePreview, setImagePreview] = useState(null); 
  const [isSaving, setIsSaving] = useState(false);

  // --- 1. FETCH PRODUCTS (Paginated & Filtered) ---
  const fetchProducts = useCallback(async (pageNum, isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      // Sending filter and page params to backend
      const { data } = await api.get('/products', {
        params: {
          page: pageNum,
          limit: LIMIT,
          lowStock: showLowStock,
          search: searchQuery
        }
      }); 

      const newProducts = data.products || data;
      
      if (isInitial) {
        setProducts(newProducts);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
      }

      setHasMore(newProducts.length === LIMIT);
    } catch (error) {
      toast.error("Failed to load inventory");
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [showLowStock, searchQuery]);

  // Effect to reset list when filter or search changes
  useEffect(() => {
    setPage(1);
    fetchProducts(1, true);
  }, [showLowStock, searchQuery, fetchProducts]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage, false);
  };

  // --- 2. DELETE HANDLER ---
  const handleDelete = async (id) => {
    if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(prev => prev.filter(p => p._id !== id));
      toast.success(lang === 'en' ? 'Product Deleted' : 'تم حذف المنتج');
    } catch (error) {
      toast.error("Failed to delete product");
      console.error(error);
    }
  };

  // --- 3. EDIT HANDLERS ---
  const startEdit = (product) => {
    setEditingProduct(product._id);
    setEditForm({
      title: product.title,
      price: product.price,
      stock: product.stock,
      category: product.category,
      description: product.description,
      image: product.imageURL || product.image, 
      isMaryland: product.isMaryland === true 
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
    if (file) {
      setImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  const handleRemoveImage = (e) => {
    e.preventDefault(); 
    e.stopPropagation();
    setImageFile(null);
    setImagePreview(null);
    setEditForm(prev => ({ ...prev, image: '' }));
    const fileInput = document.getElementById('file-upload');
    if (fileInput) fileInput.value = "";
  };

  // --- 4. CLOUDINARY UPLOAD ---
  const uploadImageToCloudinary = async () => {
    if (!imageFile) return editForm.image;
    const data = new FormData();
    data.append("file", imageFile);
    const CLOUD_NAME = "dmfylmsqu"; 
    const UPLOAD_PRESET = "pharmacy_upload"; 
    data.append("upload_preset", UPLOAD_PRESET); 
    data.append("cloud_name", CLOUD_NAME);   
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "post",
        body: data
      });
      const fileData = await res.json();
      if (!fileData.url) throw new Error(fileData.error?.message || "Cloudinary error");
      return fileData.secure_url; 
    } catch (error) {
      console.error("Cloudinary Error:", error);
      throw new Error("Image upload failed");
    }
  };

  const saveEdit = async () => {
    setIsSaving(true);
    try {
      let finalImageUrl = editForm.image;
      if (imageFile) {
        finalImageUrl = await uploadImageToCloudinary();
      }
      if (editForm.category === 'maryland-products') { editForm.isMaryland = true; }
      const finalIsMaryland = editForm.category === 'maryland-products' ? true : editForm.isMaryland;

      const { data } = await api.put(`/products/${editingProduct}`, {
        ...editForm,
        isMaryland: finalIsMaryland,
        image: finalImageUrl 
      });

      setProducts(prev => prev.map(p => (p._id === editingProduct ? data : p)));
      toast.success(lang === 'en' ? 'Product Updated' : 'تم تحديث المنتج');
      cancelEdit();
    } catch (error) {
      toast.error("Failed to update product");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClasses = "w-full p-4 rounded-2xl bg-[#0F172A] border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626] transition-all duration-300";
  const labelClasses = "text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1 block";

  if (loading && page === 1) return <div className="p-8 text-center animate-pulse text-slate-400">Loading Inventory...</div>;

  return (
    <div className="space-y-6">
      
      {/* --- HEADER WITH SEARCH & FILTER BUTTONS --- */}
<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
  <h2 className="text-2xl font-black text-black flex items-center gap-2 shrink-0">
    <Package className="text-[#DC2626]" />
    {lang === 'ar' ? 'إدارة المخزون' : 'Inventory Management'}
  </h2>
  
  {!editingProduct && (
    <div className="flex flex-wrap w-full gap-2 sm:gap-3 lg:justify-end items-center">
      
      {/* Search Input */}
      <div className="group relative flex-1 min-w-[180px] max-w-md">
        <input 
          type="text" 
          placeholder={lang === 'ar' ? 'بحث...' : 'Search...'} 
          className="w-full rounded-xl border border-white/10 bg-[#0F172A] py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 transition-all focus:border-[#DC2626] focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#DC2626]" />
      </div>

      {/* ✅ Low Stock Button - Fixed Visibility */}
      <button 
        onClick={() => setShowLowStock(!showLowStock)}
        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-tighter transition-all border-2 h-[46px] ${
          showLowStock 
          ? 'bg-[#DC2626] border-[#DC2626] text-white shadow-lg shadow-red-500/20' 
          : 'bg-[#0F172A] border-white/10 text-slate-400 hover:border-[#DC2626] hover:text-white'
        }`}
      >
        <AlertTriangle size={14} className={showLowStock ? 'animate-pulse' : ''} />
        <span>{lang === 'ar' ? 'النواقص' : 'Low Stock'}</span>
      </button>

      {/* ✅ Reset Button - Theme Following */}
      {(showLowStock || searchQuery) && (
        <button 
          onClick={() => {
            setShowLowStock(false);
            setSearchQuery('');
          }}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-black border-2 border-black text-white font-black text-[10px] uppercase tracking-tighter hover:bg-zinc-800 transition-all h-[46px]"
        >
          <RotateCcw size={14} />
          <span>{lang === 'ar' ? 'إعادة ضبط' : 'Reset'}</span>
        </button>
      )}

      {/* Add Product Button */}
      <SquircleButton 
        onClick={() => navigate('/management-panel/add-product')} 
        variant="primary" 
        className="shrink-0 h-[46px]"
      >
        <Plus size={20} />
        <span className="hidden xs:inline">{lang === 'ar' ? 'إضافة' : 'Add'}</span>
      </SquircleButton>
      
    </div>
  )}
</div>

      {/* --- EDIT FORM SECTION (Full Original Logic) --- */}
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
               <X size={20}/>
             </button>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="col-span-1 space-y-6">
               <div>
                 <label className={labelClasses}>Product Image</label>
                 <div className="relative h-64 w-full rounded-3xl border-2 border-dashed border-white/20 bg-black/20 hover:border-[#DC2626] transition-all duration-300 overflow-hidden group">
                    {imagePreview ? (
                      <div className="absolute inset-0 z-10 bg-[#0F172A] flex items-center justify-center">
                        <img src={imagePreview} alt="Preview" className="h-full w-full object-contain p-2" />
                        <button onClick={handleRemoveImage} className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg z-50"><Trash2 size={14} /></button>
                        <label htmlFor="file-upload" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer z-40">
                           <UploadCloud size={32} className="text-white mb-2"/>
                           <p className="text-white font-bold text-sm">Click to Change</p>
                        </label>
                      </div>
                    ) : (
                      <label htmlFor="file-upload" className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 group-hover:text-[#DC2626] transition-colors cursor-pointer z-10">
                        <UploadCloud size={48} className="mb-4"/>
                        <p className="font-bold text-sm">Click to Upload</p>
                      </label>
                    )}
                    <input id="file-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                 </div>
               </div>
               <div className={`p-4 rounded-2xl border backdrop-blur-md transition-all duration-300 cursor-pointer flex items-center justify-between select-none ${editForm.isMaryland ? 'border-[#DC2626] bg-[#DC2626]/20' : 'border-white/10 bg-white/5 hover:bg-white/10'}`} onClick={() => setEditForm(prev => ({...prev, isMaryland: !prev.isMaryland}))}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-colors ${editForm.isMaryland ? 'bg-[#DC2626] text-white' : 'bg-white/10 text-slate-400'}`}><Star size={20} fill={editForm.isMaryland ? "currentColor" : "none"} /></div>
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

             <div className="col-span-1 lg:col-span-2 space-y-6">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <label className={labelClasses}>Product Title</label>
                    <input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className={inputClasses} />
                 </div>
                 <div className="space-y-1">
                    <label className={labelClasses}>Category</label>
                    <div className="relative">
                      <select value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} className={`${inputClasses} appearance-none cursor-pointer [&>option]:bg-[#0F172A] [&>option]:text-white`}>
                        <option value="medication">Medication</option>
                        <option value="beauty">Beauty</option>
                        <option value="personal-care">Personal Care</option>
                        <option value="mom-and-baby">Mom & Baby</option>
                        <option value="vitamins">Vitamins</option>
                        <option value="maryland-products">Maryland Products</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    </div>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <label className={labelClasses}>Price (EGP)</label>
                    <input type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} className={inputClasses} />
                 </div>
                 <div className="space-y-1">
                    <label className={labelClasses}>Stock Quantity</label>
                    <input type="number" value={editForm.stock} onChange={e => setEditForm({...editForm, stock: e.target.value})} className={inputClasses} />
                 </div>
               </div>
               <div className="space-y-1">
                  <label className={labelClasses}>Description</label>
                  <textarea rows="4" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className={`${inputClasses} resize-none`} />
               </div>
               <div className="pt-4 flex gap-4">
                 <button onClick={cancelEdit} className="flex-1 py-4 rounded-2xl border border-white/10 text-white font-bold hover:bg-white/5 transition-colors">Cancel</button>
                 <div className="flex-1">
                    <SquircleButton onClick={saveEdit} loading={isSaving} variant="primary" fullWidth icon={Save}>Save Changes</SquircleButton>
                 </div>
               </div>
             </div>
           </div>
        </GlassCard>
      ) : (
        /* --- LIST VIEW --- */
        <div className="grid gap-4">
          {products.map((product) => (
            <GlassCard key={product._id} variant="dark" className={`p-4 flex items-center justify-between group hover:border-[#DC2626]/50 hover:bg-white/5 transition-all duration-300 ${product.stock < 10 ? 'border-l-4 border-l-red-600 shadow-[inset_10px_0_20px_-10px_rgba(220,38,38,0.2)]' : ''}`}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-xl p-2 flex items-center justify-center overflow-hidden shadow-lg relative shrink-0">
                  <img src={product.imageURL || product.image} alt={product.title} className="w-full h-full object-contain" />
                  {product.isMaryland && (
                    <div className="absolute top-0 right-0 p-1 bg-[#DC2626] rounded-bl-lg shadow-md z-10"><Star size={10} className="text-white" fill="white" /></div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg leading-tight group-hover:text-[#DC2626] transition-colors">{product.title}</h3>
                  <div className="flex items-center gap-3 text-xs mt-1">
                    <span className="text-slate-400 uppercase tracking-wider">{product.category}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold ${product.stock > 10 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {product.stock} {lang === 'ar' ? 'في المخزون' : 'In Stock'}
                    </span>
                    {product.isMaryland && <span className="text-[#DC2626] font-bold text-[10px] border border-[#DC2626] px-1 rounded bg-[#DC2626]/10">EXCLUSIVE</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <p className="font-black text-xl text-[#DC2626] whitespace-nowrap hidden sm:block">{product.price} <span className="text-xs text-slate-500">EGP</span></p>
                <div className="flex gap-2 opacity-100 sm:opacity-50 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(product)} className="p-2 rounded-lg bg-white/5 hover:bg-[#DC2626] text-slate-300 hover:text-white transition-all shadow-lg hover:shadow-red-900/40"><Edit3 size={18} /></button>
                  <button onClick={() => handleDelete(product._id)} className="p-2 rounded-lg bg-white/5 hover:bg-red-950 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
            </GlassCard>
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="pt-6 flex justify-center">
              <button 
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-3 px-10 py-4 bg-[#0F172A] border border-white/10 rounded-2xl text-white font-black uppercase tracking-tighter hover:bg-[#DC2626] hover:border-[#DC2626] transition-all disabled:opacity-50 shadow-xl"
              >
                {loadingMore ? <Loader2 size={20} className="animate-spin" /> : (lang === 'ar' ? 'تحميل المزيد' : 'Load More Products')}
                {!loadingMore && <ChevronDown size={20} />}
              </button>
            </div>
          )}
          
          {products.length === 0 && !loading && (
             <div className="p-12 text-center text-slate-500">
               <Package size={48} className="mx-auto mb-4 opacity-20" />
               <p className="font-bold">No products found.</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Inventory;