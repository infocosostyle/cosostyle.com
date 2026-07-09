import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, X, Trash2, Plus, Minus, Sun, Moon } from 'lucide-react';
import { useAuth, useCart, useWishlist } from '../context/AppContext';
import SearchOverlay from './SearchOverlay';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart, cartSubtotal, updateCartQuantity, removeFromCart } = useCart();
  const { wishlist } = useWishlist();
  
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [theme, setTheme] = useState(() => localStorage.getItem('coso_theme') || 'dark');

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('coso_theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleOpenCart = () => setIsBagOpen(true);
    const handleCloseCart = () => setIsBagOpen(false);
    window.addEventListener('coso:opencart', handleOpenCart);
    window.addEventListener('coso:closecart', handleCloseCart);
    return () => {
      window.removeEventListener('coso:opencart', handleOpenCart);
      window.removeEventListener('coso:closecart', handleCloseCart);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  const navigate = useNavigate();

  const bannerItems = [
    "100% PURE COTTON",
    "FREE SHIPPING OVER ₹999",
    "NEW DROP",
    "LIMITED INVENTORY"
  ];

  const renderMarqueeTrack = () => (
    <div className="flex items-center gap-16 shrink-0 pr-16">
      {bannerItems.map((item, idx) => (
        <span key={idx} className="flex items-center gap-16 whitespace-nowrap">
          {item} <span className="text-neutral-600">•</span>
          {item} <span className="text-neutral-500">•</span>
        </span>
      ))}
    </div>
  );

  return (
    <>
      <header className="w-full bg-black border-b border-neutral-900 sticky top-0 z-50">
        
        {/* Infinite Moving Announcement Ribbon */}
        <div className="w-full bg-brand-red text-white py-2 text-[11px] font-black tracking-widest uppercase overflow-hidden flex select-none">
          <div className="animate-marquee flex">
            {renderMarqueeTrack()}
            {renderMarqueeTrack()}
          </div>
        </div>

        {/* Main Navbar Row Elements */}
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between relative">
          
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="md:hidden text-white p-2 hover:text-brand-red cursor-pointer flex flex-col gap-1.5 justify-center"
          >
            <span className="block w-6 h-0.5 bg-white"></span>
            <span className="block w-6 h-0.5 bg-white"></span>
            <span className="block w-4 h-0.5 bg-white"></span>
          </button>

          {/* Logo Brand Wrapper */}
          <Link to="/" className="flex items-center h-12">
            <img 
              src="/src/assets/logo.jpg" 
              alt="CosoStyle Logo" 
              className="h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div className="hidden bg-neutral-900 border border-neutral-800 px-3 py-1.5 tracking-tighter">
              <span className="text-white font-medium text-sm">coso</span>
              <span className="text-brand-red font-black text-sm">style</span>
            </div>
          </Link>

          {/* Primary Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold tracking-widest text-neutral-400">
            <NavLink to="/" className={({ isActive }) => isActive ? "text-brand-red animate-pulse" : "hover:text-white transition"}>HOME</NavLink>
            <NavLink to="/shop" className={({ isActive }) => isActive ? "text-brand-red animate-pulse" : "hover:text-white transition"} end>SHOP</NavLink>
            <NavLink to="/shop?category=oversized" className="hover:text-white transition">OVERSIZED</NavLink>
            <NavLink to="/shop?category=graphic" className="hover:text-white transition">GRAPHIC</NavLink>
            <NavLink to="/shop?category=classic" className="hover:text-white transition">CLASSIC</NavLink>
          </nav>

          {/* Utility Icon Actions Row */}
          <div className="flex items-center gap-5 text-white relative h-10">
            
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme} 
              className="hover:text-brand-red text-white transition-colors duration-200 cursor-pointer block p-1"
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={18} strokeWidth={2.5} /> : <Sun size={18} strokeWidth={2.5} />}
            </button>

            {/* Search Trigger Button */}
            <button 
              onClick={() => setIsSearchOverlayOpen(true)} 
              className="hover:text-brand-red text-white transition-colors duration-200 cursor-pointer block p-1"
            >
              <Search size={18} strokeWidth={2.5} />
            </button>
            
            {/* Wishlist Heart Redirect Link */}
            <Link to="/wishlist" className="hover:text-brand-red text-white transition block p-1 relative">
              <Heart size={18} strokeWidth={2.5} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-brand-red text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-black scale-95">
                  {wishlist.length}
                </span>
              )}
            </Link>
            
            {/* Shopping Bag Open Drawer Handler */}
            <button onClick={() => setIsBagOpen(true)} className="hover:text-brand-red transition cursor-pointer relative block p-1">
              <ShoppingBag size={18} strokeWidth={2.5} />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-brand-red text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-black scale-95">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>

            {/* Auth Menu Dropdown Controls */}
            <div className="relative">
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="hover:text-brand-red transition cursor-pointer block p-1">
                <User size={18} strokeWidth={2.5} />
              </button>

              {/* Context Dropdown Box Overlay */}
              {isUserMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)}></div>
                  <div className="absolute right-0 mt-4 w-48 bg-[#0F0F11] border border-neutral-800 py-2 shadow-2xl z-20">
                    {user ? (
                      <>
                        <div className="px-4 py-2 border-b border-neutral-900">
                          <p className="text-[10px] text-neutral-500 font-bold tracking-wider">LOGGED IN AS</p>
                          <p className="text-xs font-bold text-white truncate uppercase">{user.name}</p>
                        </div>
                        <button 
                          onClick={() => { setIsUserMenuOpen(false); navigate('/dashboard'); }} 
                          className="w-full text-left px-4 py-3 text-xs font-bold tracking-wider text-neutral-300 hover:bg-neutral-900 transition cursor-pointer"
                        >
                          Dashboard
                        </button>
                        {user.role === 'admin' && (
                          <button 
                            onClick={() => { setIsUserMenuOpen(false); navigate('/admin'); }} 
                            className="w-full text-left px-4 py-3 text-xs font-bold tracking-wider text-brand-red hover:bg-neutral-900 transition border-t border-neutral-950 cursor-pointer"
                          >
                            Admin Panel
                          </button>
                        )}
                        <button 
                          onClick={() => { setIsUserMenuOpen(false); logout(); navigate('/'); }} 
                          className="w-full text-left px-4 py-3 text-xs font-bold tracking-wider text-brand-red hover:bg-neutral-900 transition border-t border-neutral-900 cursor-pointer"
                        >
                          Log Out
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => { setIsUserMenuOpen(false); navigate('/auth?tab=login'); }} 
                          className="w-full text-left px-4 py-3 text-xs font-bold tracking-wider text-neutral-300 hover:bg-neutral-900 transition cursor-pointer"
                        >
                          Log In
                        </button>
                        <button 
                          onClick={() => { setIsUserMenuOpen(false); navigate('/auth?tab=register'); }} 
                          className="w-full text-left px-4 py-3 text-xs font-bold tracking-wider text-brand-red hover:bg-neutral-900 transition border-t border-neutral-900 cursor-pointer"
                        >
                          Sign Up
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/80" onClick={() => setIsMobileMenuOpen(false)}></div>
            <div className="relative w-72 h-full bg-black border-r border-neutral-900 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-neutral-900 pb-4 mb-8">
                  <span className="text-white font-black font-impact tracking-widest text-lg uppercase">MENU</span>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="text-white"><X size={20} /></button>
                </div>
                <nav className="flex flex-col gap-6 text-sm font-black tracking-widest">
                  <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-red transition">HOME</Link>
                  <Link to="/shop" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-red transition">SHOP ALL</Link>
                  <Link to="/shop?category=oversized" onClick={() => setIsMobileMenuOpen(false)} className="text-neutral-400 hover:text-white transition">OVERSIZED</Link>
                  <Link to="/shop?category=graphic" onClick={() => setIsMobileMenuOpen(false)} className="text-neutral-400 hover:text-white transition">GRAPHIC</Link>
                  <Link to="/shop?category=classic" onClick={() => setIsMobileMenuOpen(false)} className="text-neutral-400 hover:text-white transition">CLASSIC</Link>
                </nav>
              </div>
              <div className="border-t border-neutral-900 pt-6 text-xs text-neutral-600 font-bold tracking-widest uppercase">
                COSOSTYLE AW '26
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Slide-out Sidebar Cart Drawer */}
      {isBagOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsBagOpen(false)}
          ></div>

          {/* Drawer Body Panel */}
          <div className="w-full max-w-md h-full bg-black border-l border-neutral-900 p-6 relative flex flex-col justify-between z-10">
            
            <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
              <h2 className="text-white font-black font-impact tracking-widest text-xl uppercase">YOUR BAG</h2>
              <button 
                onClick={() => setIsBagOpen(false)}
                className="text-neutral-400 hover:text-white transition p-1 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {cart.length > 0 ? (
              <>
                {/* Scrollable Cart Items Container */}
                <div className="flex-grow overflow-y-auto py-6 space-y-6 pr-1">
                  {cart.map((item) => (
                    <div 
                      key={`${item.id}-${item.size}-${item.color}`}
                      className="flex gap-4 border-b border-neutral-900/60 pb-6"
                    >
                      {/* Image Preview Block */}
                      <Link 
                        to={`/product/${item.id}`} 
                        onClick={() => setIsBagOpen(false)}
                        className="w-20 aspect-[3/4] bg-neutral-950 border border-neutral-905 overflow-hidden shrink-0"
                      >
                        <img src={item.image} className="w-full h-full object-cover object-top" alt={item.title} />
                      </Link>

                      {/* Item Content details */}
                      <div className="flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <Link 
                              to={`/product/${item.id}`}
                              onClick={() => setIsBagOpen(false)}
                              className="text-white hover:text-brand-red transition font-bold text-xs tracking-wider uppercase line-clamp-1"
                            >
                              {item.title}
                            </Link>
                            <button 
                              onClick={() => removeFromCart(item.id, item.size, item.color)}
                              className="text-neutral-500 hover:text-brand-red transition cursor-pointer shrink-0"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <p className="text-[10px] text-neutral-500 font-bold uppercase mt-1">
                            Size: {item.size} • Color: {item.color}
                          </p>
                        </div>

                        {/* Increment / Decrement actions */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-neutral-900 bg-neutral-950">
                            <button 
                              onClick={() => updateCartQuantity(item.id, item.size, item.color, item.quantity - 1)}
                              className="p-1.5 text-neutral-400 hover:text-white cursor-pointer"
                            >
                              <Minus size={10} />
                            </button>
                            <span className="px-3 text-xs font-bold text-white">{item.quantity}</span>
                            <button 
                              onClick={() => updateCartQuantity(item.id, item.size, item.color, item.quantity + 1)}
                              className="p-1.5 text-neutral-400 hover:text-white cursor-pointer"
                            >
                              <Plus size={10} />
                            </button>
                          </div>
                          <span className="text-white font-bold text-xs">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal Checkout CTA block */}
                <div className="border-t border-neutral-900 pt-6 space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold tracking-widest uppercase">
                    <span className="text-neutral-500">SUBTOTAL</span>
                    <span className="text-white">₹{cartSubtotal.toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-neutral-500 font-semibold tracking-wide">
                    Shipping & taxes calculated at checkout. Free shipping over ₹999.
                  </p>
                  <button 
                    onClick={() => {
                      setIsBagOpen(false);
                      navigate('/checkout');
                    }}
                    className="w-full bg-brand-red hover:bg-red-700 text-white font-black text-xs tracking-widest py-4 uppercase transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    SECURE CHECKOUT
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-center px-4">
                <h3 className="text-white font-black font-impact tracking-widest text-2xl uppercase mb-2">BAG IS EMPTY</h3>
                <p className="text-neutral-500 text-xs tracking-wide max-w-xs mb-8">
                  Add some heavyweight cotton to your collection.
                </p>
                <Link 
                  to="/shop" 
                  onClick={() => setIsBagOpen(false)}
                  className="bg-brand-red hover:bg-red-700 text-white font-black text-xs tracking-widest px-8 py-3.5 uppercase transition"
                >
                  SHOP THE COLLECTION
                </Link>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Full-Screen Search Overlay Component */}
      <SearchOverlay 
        isOpen={isSearchOverlayOpen} 
        onClose={() => setIsSearchOverlayOpen(false)} 
      />
    </>
  );
}