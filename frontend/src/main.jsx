import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './assets/index.css';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { AdminProvider } from './context/AdminContext';
import { CartProvider } from './context/CartContext';
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <AuthProvider>
          <AdminProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </AdminProvider>
        </AuthProvider>
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);