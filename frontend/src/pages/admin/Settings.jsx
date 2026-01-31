import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Mail, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../utils/axios';
import GlassCard from '../../components/ui/GlassCard';
import SquircleButton from '../../components/ui/SquircleButton';

const Settings = () => {
  const [deliveryFee, setDeliveryFee] = useState(0);
  // ✅ State for Emails
  const [notificationEmails, setNotificationEmails] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        setDeliveryFee(data.deliveryFee || 0);
        setNotificationEmails(data.notificationEmails || []);
      } catch (error) {
        toast.error('Failed to load settings');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // ✅ Add Email Logic
  const handleAddEmail = (e) => {
    e.preventDefault();
    if (!newEmail) return;
    if (notificationEmails.length >= 3) {
      return toast.error("Maximum 3 emails allowed");
    }
    if (!/\S+@\S+\.\S+/.test(newEmail)) {
      return toast.error("Invalid email format");
    }
    if (notificationEmails.includes(newEmail)) {
      return toast.error("Email already added");
    }

    setNotificationEmails([...notificationEmails, newEmail]);
    setNewEmail('');
  };

  // ✅ Remove Email Logic
  const handleRemoveEmail = (emailToRemove) => {
    setNotificationEmails(notificationEmails.filter(e => e !== emailToRemove));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings', { 
        deliveryFee, 
        notificationEmails // Send array to backend
      });
      toast.success('Settings Updated');
    } catch (error) {
      toast.error('Failed to save settings');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-3xl font-black text-white">Store Settings</h1>

      {/* Delivery Fee Section */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <DollarSign className="text-[#DC2626]" /> Delivery Configuration
        </h2>
        <div className="max-w-xs">
          <label className="text-slate-400 text-xs font-bold uppercase">Standard Delivery Fee (EGP)</label>
          <input 
            type="number" 
            value={deliveryFee}
            onChange={(e) => setDeliveryFee(Number(e.target.value))}
            className="w-full mt-2 bg-[#0F172A] border border-slate-700 rounded-xl p-3 text-white focus:border-[#DC2626] outline-none"
          />
        </div>
      </GlassCard>

      {/* ✅ Notification Emails Section */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Mail className="text-[#DC2626]" /> Order Notifications
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Add up to 3 email addresses that will receive alerts when a new order is placed.
        </p>

        {/* Add Email Form */}
        <form onSubmit={handleAddEmail} className="flex gap-2 mb-6">
          <input 
            type="email" 
            placeholder="Enter email address..."
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            disabled={notificationEmails.length >= 3}
            className="flex-1 bg-[#0F172A] border border-slate-700 rounded-xl p-3 text-white focus:border-[#DC2626] outline-none disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={notificationEmails.length >= 3}
            className="bg-[#DC2626] text-white px-4 rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
          </button>
        </form>

        {/* Email List */}
        <div className="space-y-2">
          {notificationEmails.map((email, index) => (
            <div key={index} className="flex items-center justify-between bg-[#0F172A]/50 border border-white/5 p-3 rounded-xl">
              <span className="text-white font-medium">{email}</span>
              <button 
                onClick={() => handleRemoveEmail(email)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {notificationEmails.length === 0 && (
            <p className="text-slate-500 italic text-sm">No emails added. Alerts will be sent to the default admin email.</p>
          )}
        </div>
      </GlassCard>

      <div className="pt-4">
        <SquircleButton onClick={handleSave} loading={saving} variant="primary" icon={Save}>
          Save All Changes
        </SquircleButton>
      </div>
    </div>
  );
};

export default Settings;