import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Edit3, Package, Save, X, UploadCloud, Star } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit Mode States
  const [editingProduct, setEditingProduct] = useState(null); 
  const [editForm, setEditForm] = useState({}); 
  const [imageFile, setImageFile] = useState(null); 
  const [imagePreview, setImagePreview] = useState(null); 
  const [isSaving, setIsSaving] = useState(false);

  // --- 1. FETCH PRODUCTS ---
  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products'); 
      setProducts(data.products || data); 
    } catch (error) {
      toast.error("Failed to load inventory");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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
    
    // Set initial preview
    setImagePreview(product.imageURL || product.image);
    setImageFile(null);
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setEditForm({});
    setImageFile(null);
    setImagePreview(null);
  };

  // ✅ ROBUST PREVIEW HANDLER
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Create Object URL (Standard for previews)
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  // ✅ REMOVE IMAGE HANDLER
  const handleRemoveImage = (e) => {
    e.preventDefault(); 
    e.stopPropagation();
    setImageFile(null);
    setImagePreview(null);
    setEditForm(prev => ({ ...prev, image: '' }));
    
    // Reset file input value if possible (via ID or Ref, but simple null works for state)
    const fileInput = document.getElementById('file-upload');
    if (fileInput) fileInput.value = "";
  };

  // --- 4. CLOUDINARY UPLOAD ---
  const uploadImageToCloudinary = async () => {
    if (!imageFile) return editForm.image;

    const data = new FormData();
    data.append("file", imageFile);
    
    // YOUR KEYS
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
      
      if (!fileData.url) {
        throw new Error(fileData.error?.message || "Cloudinary error");
      }
      
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

      const { data } = await api.put(`/products/${editingProduct}`, {
        ...editForm,
        image: finalImageUrl 
      });

      setProducts(prev => prev.map(p => (p._id === editingProduct ? data : p)));
      
      toast.success(lang === 'en' ? 'Product Updated' : 'تم تحديث المنتج');
      cancelEdit();

    } catch (error) {
      console.error(error);
      toast.error("Failed to update product");
    } finally {
      setIsSaving(false);
    }
  };

  // Filter Logic
  const filteredProducts = products.filter(product => 
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const inputClasses = "w-full p-4 rounded-2xl bg-[#0F172A] border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626] transition-all duration-300";
  const labelClasses = "text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1 block";

  if (loading) return <div className="p-8 text-center animate-pulse text-slate-400">Loading Inventory...</div>;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          <Package className="text-[#DC2626]" />
          {lang === 'ar' ? 'إدارة المخزون' : 'Inventory Management'}
        </h2>
        
        {!editingProduct && (
          <div className="flex w-full gap-3 sm:w-auto">
            <div className="group relative flex-1 sm:w-64">
              <input 
                type="text" 
                placeholder={lang === 'ar' ? 'بحث...' : 'Search...'} 
                className="w-full rounded-xl border border-white/10 bg-[#0F172A] py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 transition-all focus:border-[#DC2626] focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#DC2626]" />
            </div>
            <SquircleButton onClick={() => navigate('/management-panel/add-product')} variant="primary" className="shrink-0">
              <Plus size={20} />
              <span className="hidden sm:inline">{lang === 'ar' ? 'إضافة' : 'Add'}</span>
            </SquircleButton>
          </div>
        )}
      </div>

      {/* --- EDIT FORM --- */}
      {editingProduct ? (
        <GlassCard variant="dark" className="p-8 border-2 border-[#DC2626]/50 animate-fade-in shadow-[0_0_40px_rgba(0,0,0,0.3)]">
           <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
             <div className="flex items-center gap-3">
               <div className="bg-[#DC2626] p-2 rounded-lg">
                 <Edit3 size={24} className="text-white" />
               </div>
               <h3 className="text-xl font-black text-white uppercase tracking-tight">Edit Product</h3>
             </div>
             <button 
                onClick={cancelEdit} 
                className="p-3 bg-white/5 rounded-full hover:bg-[#DC2626] hover:text-white text-slate-400 transition-all duration-300"
             >
               <X size={20}/>
             </button>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             
             {/* Left: Image Upload & Switch */}
             <div className="col-span-1 space-y-6">
               <div>
                 <label className={labelClasses}>Product Image</label>
                 
                 {/* ✅ FIX: Simplified Container */}
                 <div className="relative h-64 w-full rounded-3xl border-2 border-dashed border-white/20 bg-black/20 hover:border-[#DC2626] transition-all duration-300 overflow-hidden group">
                    
                    {/* 1. If Preview Exists -> Show Image */}
                    {imagePreview ? (
                      <div className="absolute inset-0 z-10 bg-[#0F172A] flex items-center justify-center">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="h-full w-full object-contain p-2" 
                        />
                        
                        {/* Remove Button (Highest Z-Index) */}
                        <button 
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg transition-transform hover:scale-110 z-50"
                          title="Remove Image"
                        >
                          <Trash2 size={14} />
                        </button>

                        {/* Hover Overlay for "Change" */}
                        <label 
                          htmlFor="file-upload" 
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer z-40"
                        >
                           <UploadCloud size={32} className="text-white mb-2"/>
                           <p className="text-white font-bold text-sm">Click to Change</p>
                        </label>
                      </div>
                    ) : (
                      /* 2. If No Preview -> Show Empty State */
                      <label 
                        htmlFor="file-upload" 
                        className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 group-hover:text-[#DC2626] transition-colors cursor-pointer z-10"
                      >
                        <UploadCloud size={48} className="mb-4"/>
                        <p className="font-bold text-sm">Click to Upload</p>
                        <p className="text-xs opacity-50 mt-1">PNG, JPG, WEBP</p>
                      </label>
                    )}

                    {/* The Hidden Input */}
                    <input 
                      id="file-upload"
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden" // Completely hidden, triggered by labels
                    />
                 </div>
               </div>

               {/* Maryland Exclusive Toggle */}
               <div 
                  className={`p-4 rounded-2xl border backdrop-blur-md transition-all duration-300 cursor-pointer flex items-center justify-between select-none ${editForm.isMaryland ? 'border-[#DC2626] bg-[#DC2626]/20' : 'border-white/10 bg-white/5 hover:bg-white/10'}`} 
                  onClick={() => setEditForm(prev => ({...prev, isMaryland: !prev.isMaryland}))}
               >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-colors ${editForm.isMaryland ? 'bg-[#DC2626] text-white' : 'bg-white/10 text-slate-400'}`}>
                      <Star size={20} fill={editForm.isMaryland ? "currentColor" : "none"} />
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

             {/* Right: Inputs */}
             <div className="col-span-1 lg:col-span-2 space-y-6">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="space-y-1">
                    <label className={labelClasses}>Product Title</label>
                    <input 
                      type="text" 
                      value={editForm.title} 
                      onChange={e => setEditForm({...editForm, title: e.target.value})}
                      className={inputClasses}
                    />
                 </div>
                 <div className="space-y-1">
                    <label className={labelClasses}>Category</label>
                    <div className="relative">
                      <select 
                        value={editForm.category} 
                        onChange={e => setEditForm({...editForm, category: e.target.value})}
                        className={`${inputClasses} appearance-none cursor-pointer [&>option]:bg-[#0F172A] [&>option]:text-white`}
                      >
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
                    <input 
                      type="number" 
                      value={editForm.price} 
                      onChange={e => setEditForm({...editForm, price: e.target.value})}
                      className={inputClasses}
                    />
                 </div>
                 <div className="space-y-1">
                    <label className={labelClasses}>Stock Quantity</label>
                    <input 
                      type="number" 
                      value={editForm.stock} 
                      onChange={e => setEditForm({...editForm, stock: e.target.value})}
                      className={inputClasses}
                    />
                 </div>
               </div>

               <div className="space-y-1">
                  <label className={labelClasses}>Description</label>
                  <textarea 
                    rows="4"
                    value={editForm.description} 
                    onChange={e => setEditForm({...editForm, description: e.target.value})}
                    className={`${inputClasses} resize-none`}
                  />
               </div>

               <div className="pt-4 flex gap-4">
                 <button 
                    onClick={cancelEdit}
                    className="flex-1 py-4 rounded-2xl border border-white/10 text-white font-bold hover:bg-white/5 transition-colors"
                 >
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
        // --- LIST VIEW ---
        <div className="grid gap-4">
          {filteredProducts.map((product) => (
            <GlassCard key={product._id} variant="dark" className="p-4 flex items-center justify-between group hover:border-[#DC2626]/50 hover:bg-white/5 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-xl p-2 flex items-center justify-center overflow-hidden shadow-lg relative">
                  <img src={product.imageURL || product.image} alt={product.title} className="w-full h-full object-contain" />
                  
                  {product.isMaryland && (
                    <div className="absolute top-0 right-0 p-1 bg-[#DC2626] rounded-bl-lg shadow-md z-10">
                      <Star size={10} className="text-white" fill="white" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg leading-tight group-hover:text-[#DC2626] transition-colors flex items-center gap-2">
                    {product.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs mt-1">
                    <span className="text-slate-400 uppercase tracking-wider">{product.category}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold ${product.stock > 5 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {product.stock} {lang === 'ar' ? 'في المخزون' : 'In Stock'}
                    </span>
                    {product.isMaryland && (
                      <span className="text-[#DC2626] font-bold text-[10px] border border-[#DC2626] px-1 rounded bg-[#DC2626]/10">
                        EXCLUSIVE
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <p className="font-black text-xl text-[#DC2626] whitespace-nowrap hidden sm:block">
                  {product.price} <span className="text-xs text-slate-500">EGP</span>
                </p>
                <div className="flex gap-2 opacity-100 sm:opacity-50 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(product)} className="p-2 rounded-lg bg-white/5 hover:bg-[#DC2626] text-slate-300 hover:text-white transition-all shadow-lg hover:shadow-red-900/40">
                    <Edit3 size={18} />
                  </button>
                  <button onClick={() => handleDelete(product._id)} className="p-2 rounded-lg bg-white/5 hover:bg-red-950 text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
          
          {filteredProducts.length === 0 && (
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