import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Star, Package, ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

import api from '../../utils/axios'; 
import { useApp } from '../../context/AppContext';
import GlassCard from '../../components/ui/GlassCard';
import SquircleButton from '../../components/ui/SquircleButton';

const AddProduct = () => {
  const { lang } = useApp();
  const navigate = useNavigate();

  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    stock: '',
    category: 'medication', 
    description: '',
    isMaryland: false
  });

  // --- HANDLERS ---
  
  // 1. File Selection (Robust FileReader)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      e.target.value = null; // Reset input to allow re-selection
    }
  };

  // 2. Remove Image
  const handleRemoveImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setImageFile(null);
    setImagePreview(null);
  };

  // 3. Cloudinary Upload
  const uploadImageToCloudinary = async () => {
    if (!imageFile) return "";

    const data = new FormData();
    data.append("file", imageFile);
    
    // ✅ ACTUAL KEYS APPLIED
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
        console.error("Cloudinary Response:", fileData);
        throw new Error(fileData.error?.message || "Cloudinary error");
      }
      
      return fileData.secure_url;
    } catch (error) {
      console.error("Cloudinary Error:", error);
      throw new Error("Image upload failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.price || !formData.description) {
      return toast.error("Please fill in the required text fields");
    }

    setLoading(true);

    try {
      let imageUrl = "";

      // Upload if file exists
      if (imageFile) {
        imageUrl = await uploadImageToCloudinary();
      }

      // Prepare Payload
      const payload = {
        ...formData,
        price: Number(formData.price), 
        stock: Number(formData.stock) || 0,
        image: imageUrl // Sends string URL or empty string
      };

      // Send to Backend
      await api.post('/products', payload);

      toast.success(lang === 'en' ? 'Product Created Successfully' : 'تم إضافة المنتج بنجاح');
      navigate('/management-panel');

    } catch (error) {
      console.error("Submission Error:", error);
      const errMsg = error.response?.data?.message || error.message || "Failed to create product";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full p-4 rounded-2xl bg-[#0F172A] border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626] transition-all duration-300";
  const labelClasses = "text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1 block";

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-fade-in">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-3xl font-black text-black uppercase tracking-tighter flex items-center gap-2">
            Add New Product
          </h2>
          <p className="text-slate-400 text-sm font-bold">Create a new item in your inventory</p>
        </div>
      </div>

      <GlassCard variant="dark" className="p-8 border-2 border-[#DC2626]/20 shadow-2xl">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Image & Switch */}
          <div className="col-span-1 space-y-6">
            
            {/* Image Uploader */}
            <div>
              <label className={labelClasses}>Product Image <span className="text-slate-600 normal-case">(Optional)</span></label>
              
              {/* ✅ FIXED UPLOAD UI */}
              <div className="group border-2 border-dashed border-white/20 rounded-3xl p-4 text-center hover:border-[#DC2626] hover:bg-[#DC2626]/5 transition-all duration-300 relative h-80 flex flex-col items-center justify-center cursor-pointer bg-black/20 overflow-hidden">
                
                {/* Input (Z-50) */}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" 
                />
                
                {imagePreview ? (
                  <div className="relative h-full w-full flex items-center justify-center bg-[#0F172A]">
                    {/* Image (Z-10) */}
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="h-full w-full object-contain z-10 p-2" 
                    />
                    
                    {/* Hover Overlay (Z-20) */}
                    <div className="absolute inset-0 bg-black/60 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-white font-bold flex items-center gap-2">
                        <UploadCloud size={20}/> Change Image
                      </p>
                    </div>

                    {/* Remove Button (Z-60) */}
                    <button 
                       onClick={handleRemoveImage}
                       className="absolute top-2 right-2 z-[60] p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg transition-transform hover:scale-110"
                       title="Remove Image"
                    >
                       <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  /* Empty State (Z-10) */
                  <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-[#DC2626] transition-colors z-10 pointer-events-none">
                    <UploadCloud size={48} className="mx-auto mb-4"/>
                    <p className="font-bold text-sm">Click to Upload</p>
                    <p className="text-xs opacity-50 mt-1">PNG, JPG up to 5MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Maryland Exclusive Switch */}
            <div 
              className={`p-4 rounded-2xl border backdrop-blur-md transition-all duration-300 cursor-pointer flex items-center justify-between select-none ${formData.isMaryland ? 'border-[#DC2626] bg-[#DC2626]/20' : 'border-white/10 bg-white/5 hover:bg-white/10'}`} 
              onClick={() => setFormData(prev => ({...prev, isMaryland: !prev.isMaryland}))}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-colors ${formData.isMaryland ? 'bg-[#DC2626] text-white' : 'bg-white/10 text-slate-400'}`}>
                  <Star size={20} fill={formData.isMaryland ? "currentColor" : "none"} />
                </div>
                <div>
                  <p className={`font-bold text-sm transition-colors ${formData.isMaryland ? 'text-white' : 'text-slate-400'}`}>Maryland Exclusive</p>
                  <p className="text-[10px] text-slate-500">Prioritize on Home Page</p>
                </div>
              </div>
              
              <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${formData.isMaryland ? 'bg-[#DC2626]' : 'bg-slate-700'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-md ${formData.isMaryland ? 'left-7' : 'left-1'}`} />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Inputs */}
          <div className="col-span-1 lg:col-span-2 space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className={labelClasses}>Product Title</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className={inputClasses}
                  placeholder="e.g. Panadol Advance"
                />
              </div>
              <div className="space-y-1">
                <label className={labelClasses}>Category</label>
                <div className="relative">
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})}
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
                  value={formData.price} 
                  onChange={e => setFormData({...formData, price: e.target.value})}
                  className={inputClasses}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1">
                <label className={labelClasses}>Stock Quantity</label>
                <input 
                  type="number" 
                  value={formData.stock} 
                  onChange={e => setFormData({...formData, stock: e.target.value})}
                  className={inputClasses}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelClasses}>Description</label>
              <textarea 
                rows="5"
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})}
                className={`${inputClasses} resize-none`}
                placeholder="Enter product details..."
              />
            </div>

            <div className="pt-4">
              <SquircleButton 
                type="submit" 
                loading={loading} 
                variant="primary" 
                fullWidth 
                icon={Package}
                className="py-4 text-base"
              >
                Publish Product
              </SquircleButton>
            </div>

          </div>
        </form>
      </GlassCard>
    </div>
  );
};

export default AddProduct;