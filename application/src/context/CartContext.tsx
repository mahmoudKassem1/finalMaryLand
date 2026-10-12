import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';

export interface CartItem {
  _id: string;
  title: string;
  category: string;
  image?: string;
  stock?: number;
  unitPrice?: number;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  items: CartItem[];
  addToCart: (product: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalCount: number;
  totalPrice: number | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = 'maryland_pharmacy_cart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const cartRef = useRef(cart);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
          const parsedCart: unknown = JSON.parse(stored);
          if (!Array.isArray(parsedCart)) {
            throw new Error('Stored cart must be an array');
          }
          const storedCart = parsedCart as CartItem[];
          cartRef.current = storedCart;
          setCart(storedCart);

          const missingPriceItems = storedCart.filter(
            (item) => typeof item.unitPrice !== 'number' || !Number.isFinite(item.unitPrice)
          );
          const resolvedPrices = await Promise.all(
            missingPriceItems.map(async (item) => {
              try {
                const { data } = await apiClient.get(`/products/${encodeURIComponent(item._id)}`);
                if (typeof data?.price === 'number' && Number.isFinite(data.price)) {
                  return [item._id, data.price] as const;
                }
                console.warn(`Product ${item._id} did not include a valid price`);
              } catch (error) {
                console.warn(`Failed to refresh price for cart product ${item._id}`, error);
              }
              return null;
            })
          );

          if (isMounted) {
            const prices = new Map(
              resolvedPrices.filter((entry): entry is readonly [string, number] => entry !== null)
            );
            if (prices.size > 0) {
              const updatedCart = cartRef.current.map((item) => {
                const unitPrice = prices.get(item._id);
                return unitPrice === undefined ? item : { ...item, unitPrice };
              });
              cartRef.current = updatedCart;
              setCart(updatedCart);
              try {
                await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
              } catch (error) {
                console.warn('Failed to persist refreshed cart prices', error);
              }
            }
          }
        }
      } catch (e) {
        console.warn('Failed to load cart', e);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const saveCart = useCallback(async (updated: CartItem[]) => {
    cartRef.current = updated;
    setCart(updated);
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist cart', e);
    }
  }, []);

  const addToCart = useCallback((product: Omit<CartItem, 'quantity'>) => {
    const currentCart = cartRef.current;
    const existing = currentCart.find((item) => item._id === product._id);
    if (existing) {
      void saveCart(
        currentCart.map((item) =>
          item._id === product._id
            ? { ...item, ...product, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      void saveCart([...currentCart, { ...product, quantity: 1 }]);
    }
  }, [saveCart]);

  const updateQuantity = useCallback((id: string, delta: number) => {
    const updated = cartRef.current
      .map((item) => {
        if (item._id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean) as CartItem[];
    void saveCart(updated);
  }, [saveCart]);

  const removeFromCart = useCallback((id: string) => {
    void saveCart(cartRef.current.filter((item) => item._id !== id));
  }, [saveCart]);

  const clearCart = useCallback(() => {
    void saveCart([]);
  }, [saveCart]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const hasKnownPrices = cart.every(
    (item) => typeof item.unitPrice === 'number' && Number.isFinite(item.unitPrice)
  );
  const totalPrice =
    cart.length === 0
      ? 0
      : hasKnownPrices
        ? cart.reduce((sum, item) => sum + (item.unitPrice ?? 0) * item.quantity, 0)
        : null;

  return (
    <CartContext.Provider
      value={{
        cart,
        items: cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalCount: totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};