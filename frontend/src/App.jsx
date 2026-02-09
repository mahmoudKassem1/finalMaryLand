import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Direct Context Imports
import { useApp } from './context/AppContext';
import { useAuth } from './context/AuthContext';
import { useAdmin } from './context/AdminContext';

// Layout Components
import Header from './components/layout/Header';
import AdminHeader from './components/layout/AdminHeader';
import Footer from './components/layout/Footer';

// Client Pages
import Home from './pages/client/Home';
import Login from './pages/client/Login';
import Signup from './pages/client/Signup';
import ForgetPassword from './pages/client/ForgetPassword';
import ResetPassword from './pages/client/ResetPassword';
import ProductDetails from './pages/client/ProductDetails';
import Cart from './pages/client/Cart';
import Checkout from './pages/client/Checkout';
import ContactUs from './pages/client/ContactUs';
import SearchPage from './pages/client/SearchPage';
import MyOrders from './pages/client/MyOrders'; 
import CategoryPage from './pages/client/CategoryPage';
import Profile from './pages/client/Profile'; // ✅ Added Profile Page

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import Orders from './pages/admin/Orders';
import AddProduct from './pages/admin/AddProduct';
import Inventory from './pages/admin/Inventory';
import Settings from './pages/admin/Settings';

/**
 * 🔒 CLIENT ROUTE GUARD
 * Uses: AuthContext (User Token)
 */
const ClientRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) return <div className="min-h-[80vh] flex items-center justify-center font-bold text-[#0F172A]">Verifying Session...</div>;
  
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  
  return children;
};

/**
 * 🔒 ADMIN ROUTE GUARD
 * Uses: AdminContext (Admin Token)
 * Strictly separates admin logic from client logic.
 */
const AdminRoute = ({ children }) => {
  const { adminUser, isAdminLoading } = useAdmin();
  const token = localStorage.getItem('adminToken'); // Check specifically for admin token

  if (isAdminLoading) {
    return <div className="min-h-[80vh] flex items-center justify-center font-bold text-[#DC2626]">Accessing System...</div>;
  }

  // If no admin user in state AND no admin token in storage -> Redirect
  if (!adminUser && !token) {
    return <Navigate to="/management/login" replace />;
  }

  return children;
};

const App = () => {
  const { lang } = useApp();
  const location = useLocation();

  // Logic to determine which Header/Footer to show
  const isManagementPath = location.pathname.startsWith('/management-panel');
  const isManagementLogin = location.pathname === '/management/login';
  const authPaths = ['/login', '/signup', '/forget-password', '/management/login'];
  const isAuthPage = authPaths.includes(location.pathname);

  return (
    <div 
      dir={lang === 'ar' ? 'rtl' : 'ltr'} 
      className={`min-h-screen liquid-bg transition-all duration-500 ${lang === 'ar' ? 'font-arabic' : ''}`}
    >
      <Toaster position="top-center" reverseOrder={false} />
      
      {/* 1. CONDITIONAL HEADERS */}
      {/* Only show AdminHeader if in management panel AND not on login page */}
      {isManagementPath && !isManagementLogin && <AdminHeader />}
      
      {/* Show Client Header everywhere else, except auth pages and management panel */}
      {!isManagementPath && !isAuthPage && <Header />}
      
      {/* 2. MAIN CONTENT AREA */}
      <main className={`container mx-auto px-4 min-h-[85vh] pb-20 transition-all duration-500 ${
        isManagementPath 
          ? 'pt-8' 
          : isAuthPage 
            ? 'pt-10 sm:pt-16' 
            : 'pt-44 sm:pt-48' 
      }`}>
        <Routes>
          {/* --- Public Client Routes --- */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forget-password" element={<ForgetPassword />} />
          <Route path="/reset-password/:resettoken" element={<ResetPassword />} />
          <Route path="/contact" element={<ContactUs />} />
          
          {/* Category Page (Dynamic Slug) */}
          <Route path="/category/:slug" element={<CategoryPage />} />
          
          {/* Product Details (Both Direct and Nested support) */}
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/category/:categoryName/:id" element={<ProductDetails />} />
          
          <Route path="/cart" element={<Cart />} />
          <Route path="/search" element={<SearchPage />} />

          {/* --- Protected Client Routes --- */}
          <Route path="/checkout" element={<ClientRoute><Checkout /></ClientRoute>} />
          <Route path="/my-orders" element={<ClientRoute><MyOrders /></ClientRoute>} />
          <Route path="/profile" element={<ClientRoute><Profile /></ClientRoute>} /> {/* ✅ Added Profile Route */}

          {/* --- Management Actor Routes --- */}
          <Route path="/management/login" element={<AdminLogin />} />
          
          {/* 🛠️ ADMIN NESTED ROUTES (Protected by AdminRoute) */}
          <Route 
            path="/management-panel/*" 
            element={
              <AdminRoute>
                <Routes>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/add-product" element={<AddProduct />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </AdminRoute>
            } 
          />

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* 3. CONDITIONAL FOOTER */}
      {!isAuthPage && !isManagementPath && <Footer />}
    </div>
  );
};

export default App;
// Deployment Fix v3