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
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Failed to parse user info:", error);
          localStorage.removeItem('userInfo');
        }
      }
      setLoading(false);
    };

    checkLoggedIn();
  }, []);

  // 2. Login Function
  const login = async (email, password) => {
    try {
      const { data } = await api.post('/users/login', { email, password });
      
      localStorage.setItem('userInfo', JSON.stringify(data));
      localStorage.setItem('token', data.token);
      
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

  // 3. Register Function (FIXED)
  const register = async (userData) => {
    try {
      // ✅ We send 'userData' directly. Do NOT wrap it in { }
      const { data } = await api.post('/users/register', userData);
      
      localStorage.setItem('userInfo', JSON.stringify(data));
      localStorage.setItem('token', data.token);
      
      setUser(data);
      return { success: true };
    } catch (error) {
      console.error("Registration Failed:", error.response?.data?.message);
      return { 
        success: false, 
        error: error.response?.data?.message || "Registration failed" 
      };
    }
  };

  // 4. Logout Function
  const logout = () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    setUser(null);
    // Optional: Redirect to login or home if needed
    // window.location.href = '/login'; 
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom Hook
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};