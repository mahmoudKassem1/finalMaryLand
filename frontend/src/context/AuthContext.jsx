import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/axios';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Check for User Session on Load
  useEffect(() => {
    const checkLoggedIn = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('userInfo');

      if (storedToken && storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    };

    checkLoggedIn();
  }, []);

  // 2. Login Function
  const login = async (email, password) => {
    try {
      // ✅ Using '/users/login' to match our backend structure
      const { data } = await api.post('/users/login', { email, password });
      
      // Save data to LocalStorage
      localStorage.setItem('userInfo', JSON.stringify(data));
      localStorage.setItem('token', data.token); // ✅ Client Token only
      
      setUser(data);
      return { success: true };
    } catch (error) {
      console.error("Login Failed:", error.response?.data?.message);
      return { 
        success: false, 
        error: error.response?.data?.message || "Invalid credentials" 
      };
    }
  };

  // 3. Register Function
  const register = async (name, email, password, phone) => {
    try {
      // ✅ Using '/users/register'
      const { data } = await api.post('/users/register', { name, email, password, phone });
      
      localStorage.setItem('userInfo', JSON.stringify(data));
      localStorage.setItem('token', data.token);
      
      setUser(data);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || "Registration failed" 
      };
    }
  };

  // 4. Logout Function (FIXED)
  const logout = () => {
    // ✅ Remove ONLY Client data
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    
    
    
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};