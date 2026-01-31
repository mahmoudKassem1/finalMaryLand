import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext'; 
import GlassCard from '../../components/ui/GlassCard';
import SquircleButton from '../../components/ui/SquircleButton';
import { ShieldCheck, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // ✅ FIX: Destructure 'login' (instead of adminLogin)
  const { login, isAdminLoading } = useAdmin();
  const navigate = useNavigate();

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ FIX: Call 'login' function
    const result = await login(email, password);
    
    // 2. Handle Result
    if (result.success) {
      toast.success('Management Access Granted');
      navigate('/management-panel');
    } else {
      // Show the specific error message from the backend
      toast.error(result.error || 'Invalid Managerial Credentials');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 animate-fade-in">
      <div className="flex justify-center mb-8">
        <div className="bg-[#0F172A] p-4 rounded-3xl shadow-2xl">
          <ShieldCheck className="text-[#DC2626] w-12 h-12" />
        </div>
      </div>
      
      <GlassCard variant="dark" className="p-10 border-[#DC2626]/30">
        <h2 className="text-2xl font-black mb-2 text-center text-white">Management Portal</h2>
        <p className="text-slate-400 text-xs text-center mb-8 uppercase tracking-widest">
          Authorized Personnel Only
        </p>
        
        <form onSubmit={handleAdminSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 px-2">Manager Email</label>
            <input 
              type="email" 
              className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-[#DC2626] transition-all placeholder:text-slate-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@maryland.com"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 px-2">Access Key</label>
            <div className="relative">
              <input 
                type="password" 
                className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-[#DC2626] transition-all placeholder:text-slate-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
              <Lock className="absolute right-4 top-4 text-white/20 w-5 h-5" />
            </div>
          </div>
          
          <SquircleButton 
            variant="primary" 
            fullWidth 
            className="mt-4"
            disabled={isAdminLoading} 
          >
            {isAdminLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={18} /> Verifying...
              </span>
            ) : (
              'Initialize Session'
            )}
          </SquircleButton>
        </form>
      </GlassCard>
    </div>
  );
};

export default AdminLogin;