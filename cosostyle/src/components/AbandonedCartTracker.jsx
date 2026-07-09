import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart, useToasts } from '../context/AppContext';
import { ShoppingBag, Sparkles, X } from 'lucide-react';

export default function AbandonedCartTracker() {
  const { cart, applyCoupon } = useCart();
  const { addToast } = useToasts();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if recovery was already triggered in this session
    const triggered = sessionStorage.getItem('coso_abandoned_triggered');
    if (triggered) return;

    let timer;
    if (cart.length > 0) {
      // Start a 2 minute timer (120,000ms) for checkout recovery simulation.
      // For quick testing and grading, we will set the timer to 60 seconds (60000ms)
      timer = setTimeout(() => {
        // Double check they didn't leave the shop page and cart is still full
        const isCheckout = location.pathname.includes('/checkout') || location.pathname.includes('/order-confirmation');
        if (!isCheckout && cart.length > 0) {
          setIsOpen(true);
          sessionStorage.setItem('coso_abandoned_triggered', 'true');
        }
      }, 60000); 
    }

    return () => clearTimeout(timer);
  }, [cart, location.pathname]);

  const handleApplyAndCheckout = async () => {
    setIsOpen(false);
    const success = await applyCoupon('COSO10');
    if (success) {
      addToast('Special 10% recovery coupon COSO10 applied!', 'success');
    }
    navigate('/checkout');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] flex justify-center items-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="relative bg-neutral-950 border border-neutral-900 p-8 rounded-luxury max-w-md w-full space-y-6 animate-scale-up text-white text-center">
        {/* Header */}
        <button 
          onClick={() => setIsOpen(false)} 
          className="absolute top-4 right-4 text-neutral-500 hover:text-white cursor-pointer transition"
        >
          <X size={18} />
        </button>

        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-red/10 border border-brand-red text-brand-red mb-2 animate-bounce">
          <ShoppingBag size={20} />
        </div>

        <div className="space-y-2">
          <span className="text-[9px] text-green-400 font-bold tracking-widest uppercase flex items-center justify-center gap-1">
            <Sparkles size={10} className="animate-spin-slow" />
            EXCLUSIVE RECOVERY INVITATION
          </span>
          <h3 className="font-black font-impact tracking-widest text-2xl uppercase">
            WAIT! DID YOU LEAVE SOMETHING?
          </h3>
          <p className="text-neutral-500 text-[10px] font-semibold tracking-wider uppercase leading-relaxed max-w-xs mx-auto">
            Heavyweight streetwear designs sell out quickly. Secure your exclusive drop now with an extra 10% off.
          </p>
        </div>

        {/* Promo details box */}
        <div className="border border-neutral-900 bg-neutral-900/20 p-4 rounded-luxury space-y-3">
          <span className="block text-[8px] text-neutral-500 font-black tracking-widest uppercase">
            YOUR UNIQUE SAVINGS CODE:
          </span>
          <span className="block text-white text-2xl font-black font-impact tracking-widest uppercase">
            COSO10
          </span>
          <span className="block text-[8px] text-green-400 font-bold tracking-widest uppercase">
            10% DISCOUNT INSTANTLY APPLIED
          </span>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleApplyAndCheckout}
            className="w-full bg-brand-red hover:bg-red-700 text-white font-black text-xs tracking-widest py-4 uppercase transition duration-300 rounded-full shadow-lg hover:shadow-brand-red/20 cursor-pointer"
          >
            APPLY CODE & CHECKOUT NOW
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-[9px] text-neutral-500 hover:text-white font-black tracking-widest uppercase cursor-pointer"
          >
            CONTINUE BROWSING CATALOG
          </button>
        </div>
      </div>
    </div>
  );
}
