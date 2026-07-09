import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // --- AUTH STATE ---
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [referralCode, setReferralCode] = useState('');

  // --- CART STATE ---
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('coso_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [savedForLater, setSavedForLater] = useState(() => {
    const saved = localStorage.getItem('coso_cart_saved');
    return saved ? JSON.parse(saved) : [];
  });
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  // --- WISHLIST STATE ---
  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem('coso_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  // --- TOAST NOTIFICATIONS STATE ---
  const [toasts, setToasts] = useState([]);

  // --- RECENTLY VIEWED STATE ---
  const [recentlyViewed, setRecentlyViewed] = useState(() => {
    const saved = localStorage.getItem('coso_recently_viewed');
    return saved ? JSON.parse(saved) : [];
  });

  // Load active user session from server on startup
  useEffect(() => {
    async function loadSession() {
      const token = localStorage.getItem('coso_token');
      if (token) {
        try {
          const profile = await api.getProfile();
          setUser(profile);
          setAddresses(profile.addresses || []);
          setLoyaltyPoints(profile.loyaltyPoints || 0);
          setReferralCode(profile.referralCode || '');
        } catch (err) {
          localStorage.removeItem('coso_token');
          setUser(null);
        }
      }
      setAuthLoading(false);
    }
    loadSession();
  }, []);

  // Sync Cart to LocalStorage
  useEffect(() => {
    localStorage.setItem('coso_cart', JSON.stringify(cart));
  }, [cart]);

  // Sync Saved for Later to LocalStorage
  useEffect(() => {
    localStorage.setItem('coso_cart_saved', JSON.stringify(savedForLater));
  }, [savedForLater]);

  // Sync Wishlist to LocalStorage
  useEffect(() => {
    localStorage.setItem('coso_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Sync Recently Viewed to LocalStorage
  useEffect(() => {
    localStorage.setItem('coso_recently_viewed', JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);


  // --- TOAST CONTROLLERS ---
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };


  // --- AUTH CONTROLLERS ---
  const login = async (email, password, rememberMe) => {
    try {
      const res = await api.login(email, password);
      localStorage.setItem('coso_token', res.token);
      setUser(res.user);
      setAddresses(res.user.addresses || []);
      setLoyaltyPoints(res.user.loyaltyPoints || 0);
      setReferralCode(res.user.referralCode || '');
      addToast(`Welcome back, ${res.user.name}!`, 'success');
      return res.user;
    } catch (err) {
      addToast(err.message || 'Login failed.', 'error');
      throw err;
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await api.register(name, email, password);
      localStorage.setItem('coso_token', res.token);
      setUser(res.user);
      setAddresses([]);
      setLoyaltyPoints(res.user.loyaltyPoints || 50);
      setReferralCode(res.user.referralCode || '');
      addToast('Account created! You earned 50 welcome points 🎉', 'success');
      return res.user;
    } catch (err) {
      addToast(err.message || 'Registration failed.', 'error');
      throw err;
    }
  };

  const logout = async () => {
    localStorage.removeItem('coso_token');
    setUser(null);
    setAddresses([]);
    setLoyaltyPoints(0);
    setReferralCode('');
    addToast('Logged out successfully.', 'info');
  };

  const updateProfile = async (profileData) => {
    try {
      const updatedUser = await api.updateProfile(profileData);
      setUser(updatedUser);
      if (updatedUser.loyaltyPoints !== undefined) setLoyaltyPoints(updatedUser.loyaltyPoints);
      addToast('Profile changes saved.', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update profile.', 'error');
      throw err;
    }
  };

  const subscribeNewsletter = async (email) => {
    try {
      const res = await api.subscribeNewsletter(email);
      addToast(res.message || 'Subscribed successfully!', 'success');
      return true;
    } catch (err) {
      addToast(err.message || 'Subscription failed.', 'error');
      return false;
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    try {
      await api.changePassword(oldPassword, newPassword);
      addToast('Password updated successfully.', 'success');
    } catch (err) {
      addToast(err.message || 'Incorrect old password.', 'error');
      throw err;
    }
  };

  const saveAddress = async (address) => {
    try {
      const updatedAddresses = await api.saveAddress(address);
      setAddresses(updatedAddresses);
      addToast(address.id ? 'Address updated.' : 'Address added.', 'success');
    } catch (err) {
      addToast(err.message || 'Address save error.', 'error');
    }
  };

  const deleteAddress = async (id) => {
    try {
      const updatedAddresses = await api.deleteAddress(id);
      setAddresses(updatedAddresses);
      addToast('Address deleted.', 'success');
    } catch (err) {
      addToast(err.message || 'Address delete error.', 'error');
    }
  };


  // --- CART CONTROLLERS ---
  const addToCart = (product, size, color, quantity = 1) => {
    if (!size) {
      addToast('Please select a size', 'error');
      return false;
    }

    const existingIdx = cart.findIndex(
      (item) => item.id === product.id && item.size === size && item.color === color
    );

    if (existingIdx > -1) {
      setCart((prev) => {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      });
      addToast(`Increased quantity of ${product.title} in bag`, 'success');
    } else {
      setCart((prev) => [
        ...prev,
        {
          id: product.id,
          title: product.title,
          price: product.price,
          image: product.image,
          category: product.category,
          size,
          color,
          quantity
        }
      ]);
      addToast(`${product.title} added to bag`, 'success');
    }
    return true;
  };

  const removeFromCart = (id, size, color) => {
    const item = cart.find((i) => i.id === id && i.size === size && i.color === color);
    if (item) {
      addToast(`Removed ${item.title} from bag`, 'info');
    }
    setCart((prev) => prev.filter((i) => !(i.id === id && i.size === size && i.color === color)));
  };

  const updateCartQuantity = (id, size, color, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id, size, color);
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.id === id && i.size === size && i.color === color ? { ...i, quantity } : i
      )
    );
  };

  const saveForLaterItem = (item) => {
    removeFromCart(item.id, item.size, item.color);
    setSavedForLater((prev) => {
      if (prev.some((i) => i.id === item.id && i.size === item.size && i.color === item.color)) {
        return prev;
      }
      return [...prev, item];
    });
    addToast(`Saved ${item.title} for later`, 'info');
  };

  const moveToCart = (item) => {
    setSavedForLater((prev) =>
      prev.filter((i) => !(i.id === item.id && i.size === item.size && i.color === item.color))
    );
    addToCart(item, item.size, item.color, item.quantity);
  };

  const removeSavedForLater = (id, size, color) => {
    setSavedForLater((prev) =>
      prev.filter((i) => !(i.id === id && i.size === size && i.color === color))
    );
    addToast('Item removed', 'info');
  };

  const applyCoupon = async (code) => {
    try {
      const res = await api.validateCoupon(code);
      setCouponCode(res.code);
      setDiscountPercent(res.discountPercent);
      addToast(`Promo code ${res.code} applied successfully!`, 'success');
      return true;
    } catch (err) {
      addToast(err.message || 'Invalid promo code', 'error');
      return false;
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setDiscountPercent(0);
    addToast('Promo code removed', 'info');
  };

  const clearCart = () => {
    setCart([]);
    setCouponCode('');
    setDiscountPercent(0);
  };

  // Cart Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = cartSubtotal * discountPercent;
  const shippingCost = cartSubtotal > 999 || cartSubtotal === 0 ? 0 : 99;
  const taxAmount = (cartSubtotal - discountAmount) * 0.08;
  const cartTotal = cartSubtotal - discountAmount + shippingCost + taxAmount;


  // --- WISHLIST CONTROLLERS ---
  const toggleWishlist = (productId) => {
    const isAlreadyWishlisted = wishlist.includes(productId);
    if (isAlreadyWishlisted) {
      setWishlist((prev) => prev.filter((id) => id !== productId));
      addToast('Removed from wishlist', 'info');
    } else {
      setWishlist((prev) => [...prev, productId]);
      addToast('Added to wishlist', 'success');
    }
  };

  const isInWishlist = (productId) => wishlist.includes(productId);


  // --- RECENTLY VIEWED CONTROLLERS ---
  const addToRecentlyViewed = (product) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      return [product, ...filtered].slice(0, 5); // Keep last 5
    });
  };

  return (
    <AppContext.Provider
      value={{
        // Auth
        user,
        addresses,
        authLoading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        saveAddress,
        deleteAddress,
        subscribeNewsletter,

        // Loyalty
        loyaltyPoints,
        referralCode,

        // Cart
        cart,
        savedForLater,
        couponCode,
        discountPercent,
        cartSubtotal,
        discountAmount,
        shippingCost,
        taxAmount,
        cartTotal,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        saveForLaterItem,
        moveToCart,
        removeSavedForLater,
        applyCoupon,
        removeCoupon,
        clearCart,

        // Wishlist
        wishlist,
        toggleWishlist,
        isInWishlist,

        // Recently Viewed
        recentlyViewed,
        addToRecentlyViewed,

        // Toasts
        toasts,
        addToast,
        removeToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// Custom hooks
export const useAuth = () => useContext(AppContext);
export const useCart = () => useContext(AppContext);
export const useWishlist = () => useContext(AppContext);
export const useToasts = () => useContext(AppContext);
export const useRecentlyViewed = () => useContext(AppContext);
export const useAppContext = () => useContext(AppContext);
