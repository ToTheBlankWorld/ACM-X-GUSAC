import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * NovaCart store state: shopping cart + signed-in customer.
 * The cart is client-side only (no orders exist in this environment);
 * the signed-in user mirrors the store login API response.
 */
const StoreContext = createContext(null);

const CART_KEY = 'novacart_cart_v1';
const USER_KEY = 'novacart_user_v1';

function loadCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function StoreProvider({ children }) {
  const [cart, setCart] = useState(loadCart);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  });
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = useCallback((product, qty = 1) => {
    setCart((items) => {
      const existing = items.find((i) => i.id === product.id);
      if (existing) {
        return items.map((i) => (i.id === product.id ? { ...i, qty: Math.min(99, i.qty + qty) } : i));
      }
      const { id, name, price, compare_at: compareAt, icon, tint, category } = product;
      return [...items, { id, name, price, compare_at: compareAt, icon, tint, category, qty }];
    });
  }, []);

  const setQty = useCallback((id, qty) => {
    setCart((items) =>
      qty <= 0
        ? items.filter((i) => i.id !== id)
        : items.map((i) => (i.id === id ? { ...i, qty: Math.min(99, qty) } : i))
    );
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart((items) => items.filter((i) => i.id !== id));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const signInUser = useCallback((u) => {
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const { cartCount, subtotal } = useMemo(() => {
    return cart.reduce(
      (acc, i) => ({
        cartCount: acc.cartCount + i.qty,
        subtotal: acc.subtotal + i.qty * i.price,
      }),
      { cartCount: 0, subtotal: 0 }
    );
  }, [cart]);

  const value = useMemo(
    () => ({
      cart, cartCount, subtotal,
      addToCart, setQty, removeFromCart, clearCart,
      cartOpen, setCartOpen,
      user, signInUser, signOut,
    }),
    [cart, cartCount, subtotal, addToCart, setQty, removeFromCart, clearCart, cartOpen, user, signInUser, signOut]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
