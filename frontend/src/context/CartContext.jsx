import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/axios';

// eslint-disable-next-line react-refresh/only-export-components
export const CartContext = createContext();

const normalizeCartItem = (item) => {
  const parsedQuantity = Number(item.quantity ?? item.qty ?? 1);
  const parsedPrice = Number(item.price ?? item.unitPrice);

  return {
    _id: item._id,
    title: item.title || item.name || 'Product',
    image: item.image || item.imageURL || '',
    quantity: Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 1,
    price: Number.isFinite(parsedPrice) && parsedPrice >= 0 ? parsedPrice : undefined,
  };
};

const readSavedCart = () => {
  try {
    const savedCart = localStorage.getItem('maryland_cart');
    const parsedCart = savedCart ? JSON.parse(savedCart) : [];
    return Array.isArray(parsedCart) ? parsedCart.map(normalizeCartItem) : [];
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(readSavedCart);

  useEffect(() => {
    localStorage.setItem('maryland_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Older saved carts only contained product IDs and quantities. Refresh those prices from MongoDB.
  useEffect(() => {
    const productsMissingPrice = cartItems.filter((item) => item.price === undefined);
    if (!productsMissingPrice.length) return;

    let active = true;
    Promise.all(productsMissingPrice.map(async (item) => {
      try {
        const { data } = await api.get(`/products/${encodeURIComponent(item._id)}`);
        const price = Number(data?.price);
        return Number.isFinite(price) && price >= 0 ? [item._id, price] : null;
      } catch (error) {
        console.warn(`Unable to refresh price for ${item.title}`, error);
        return null;
      }
    })).then((results) => {
      if (!active) return;
      const prices = new Map(results.filter(Boolean));
      if (prices.size) {
        setCartItems((current) => current.map((item) => (
          prices.has(item._id) ? { ...item, price: prices.get(item._id) } : item
        )));
      }
    });

    return () => { active = false; };
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    setCartItems((prev) => {
      const normalizedProduct = normalizeCartItem(product);
      const existingItem = prev.find(item => item._id === product._id);
      if (existingItem) {
        return prev.map(item =>
          item._id === product._id
            ? { ...item, ...normalizedProduct, price: normalizedProduct.price ?? item.price, quantity: (item.quantity || 1) + quantity }
            : item
        );
      }
      return [...prev, { ...normalizedProduct, quantity }];
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    const quantity = Math.floor(Number(newQuantity));
    if (!Number.isFinite(quantity) || quantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map(item => item._id === productId ? { ...item, quantity } : item)
    );
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter(item => item._id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('maryland_cart');
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + (Number(item.quantity) || 0), 0);
  };

  const getCartTotal = () => cartItems.reduce((total, item) => (
    item.price === undefined ? total : total + item.price * item.quantity
  ), 0);

  // --- CHECKOUT LOGIC ---
  const checkout = async (orderData) => {
    try {
      const orderItems = cartItems.map(item => ({
        product: item._id, // Maps properly for backend schema
        quantity: item.quantity || 1
      }));

      const payload = {
        orderItems,
        shippingAddress: {
          street: orderData.street,
          city: orderData.city,
          aptNumber: orderData.aptNumber,
          phone: orderData.phone,
        },
        notes: orderData.notes || '',
      };

      // ✅ SAFETY FIX: Explicitly grab token to ensure it sends
      let token = '';
      const userStorage = localStorage.getItem('user');
      if (userStorage) {
        token = JSON.parse(userStorage).token;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      // ✅ Send payload WITH strict auth headers
      const { data } = await api.post('/orders', payload, config);
      
      clearCart();
      return { success: true, order: data };
    } catch (error) {
      console.error("Checkout Failed:", error.response?.data?.message);
      
      // Handle the "Ghost Token" unauthorized error gracefully
      if (error.response?.status === 401) {
         return { success: false, error: "Session expired. Please log out and log in again." };
      }

      return { 
        success: false, 
        error: error.response?.data?.message || "Failed to place order" 
      };
    }
  };

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      getCartCount,
      getCartTotal,
      checkout 
    }}>
      {children}
    </CartContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
