import React, { createContext, useState, useContext } from 'react';
import api from '../utils/axios'; // Import our backend bridge

// eslint-disable-next-line react-refresh/only-export-components
export const AdminContext = createContext(null);

export const AdminProvider = ({ children }) => {
  // 1. Initialize state from LocalStorage (Sync)
  const [adminUser, setAdminUser] = useState(() => {
    const savedAdmin = localStorage.getItem('maryland_admin');
    return savedAdmin ? JSON.parse(savedAdmin) : null;
  });

  const [isAdminLoading, setIsAdminLoading] = useState(false);

  // 2. Real Backend Login Logic
  const adminLogin = async (email, password) => {
    setIsAdminLoading(true);
    
    try {
      // POST request to http://localhost:5000/api/admin/login
      const { data } = await api.post('/admin/login', { email, password });

      // Structure the admin data for the app
      const adminData = {
        name: 'System Manager',
        role: 'admin',
        email: data.email, // Backend returns email
      };

      // 3. Save to Storage
      // Important: We save 'adminToken' so axios.js can find it later!
      setAdminUser(adminData);
      localStorage.setItem('maryland_admin', JSON.stringify(adminData));
      localStorage.setItem('adminToken', data.token); 

      setIsAdminLoading(false);
      return { success: true };

    } catch (error) {
      console.error("Admin Login Failed:", error.response?.data?.message);
      setIsAdminLoading(false);
      return { 
        success: false, 
        error: error.response?.data?.message || "Invalid Admin Credentials" 
      };
    }
  };

  const adminLogout = () => {
    setAdminUser(null);
    localStorage.removeItem('maryland_admin');
    localStorage.removeItem('adminToken'); // Clear the token
  };

  return (
    <AdminContext.Provider
      value={{
        adminUser,
        isAdminLoading,
        login: adminLogin,   // ✅ Exposed as 'login' for consistency
        logout: adminLogout, // ✅ Exposed as 'logout' to match AdminHeader
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};