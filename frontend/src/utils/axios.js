import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const userToken = localStorage.getItem('token');
    const adminToken = localStorage.getItem('adminToken');
    const method = config.method.toLowerCase();
    
    // Normalize URL to avoid slash issues
    const url = config.url || '';

    // --- 1. IDENTIFY ADMIN ROUTES ---
    
    // A. Standard Admin Paths
    const isDashboard = url.includes('/admin');
    const isSettings = url.includes('/settings') && method === 'put';
    
    // B. Product Management (POST, PUT, DELETE)
    const isProductAdmin = url.includes('/products') && ['post', 'put', 'delete'].includes(method);
    
    // C. Order Management (The Tricky Part)
    // - Admin Fetch List: GET /orders (Exact match)
    // - Admin Update Status: PUT /orders/123/status
    // - Client Fetch My Orders: GET /orders/myorders (Must NOT be Admin)
    const isOrderList = url === '/orders' && method === 'get'; 
    const isOrderStatus = url.includes('/orders') && url.includes('/status') && method === 'put';
    
    const shouldUseAdminToken = isDashboard || isSettings || isProductAdmin || isOrderList || isOrderStatus;

    if (shouldUseAdminToken) {
      // 🔒 Use Admin Token
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    } else {
      // 👤 Use User Token (Client Side: create order, my orders, etc.)
      if (userToken) {
        config.headers.Authorization = `Bearer ${userToken}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;