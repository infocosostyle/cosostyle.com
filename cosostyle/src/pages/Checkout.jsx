import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, useCart, useToasts } from '../context/AppContext';
import { api } from '../lib/api';
import SEO from '../components/SEO';

export default function Checkout() {
  const { user, addresses, saveAddress } = useAuth();
  const {
    cart,
    cartSubtotal,
    discountAmount,
    taxAmount,
    cartTotal,
    couponCode,
    applyCoupon,
    removeCoupon,
    clearCart
  } = useCart();
  const { addToast } = useToasts();
  const navigate = useNavigate();

  // Redirect if empty
  useEffect(() => {
    if (cart.length === 0) {
      addToast('Your bag is empty. Please add items before checking out.', 'info');
      navigate('/shop');
    }
  }, [cart, navigate]);

  // Form States
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [promoInput, setPromoInput] = useState('');
  
  // Address States
  const [selectedAddrId, setSelectedAddrId] = useState(null);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [shippingName, setShippingName] = useState('');
  const [shippingStreet, setShippingStreet] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingState, setShippingState] = useState('');
  const [shippingZip, setShippingZip] = useState('');
  const [shippingCountry, setShippingCountry] = useState('India');

  // Gift wrapping and order notes
  const [isGiftWrapping, setIsGiftWrapping] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  // Payment States
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' | 'upi' | 'netbanking' | 'wallet' | 'cod'
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [upiId, setUpiId] = useState('');
  const [netBankingBank, setNetBankingBank] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && addresses.length > 0) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      setSelectedAddrId(def.id);
      setIsAddingNewAddress(false);
    } else {
      setIsAddingNewAddress(true);
    }
  }, [user, addresses]);

  const handleApplyPromo = async (e) => {
    e.preventDefault();
    if (!promoInput) return;
    const success = await applyCoupon(promoInput);
    if (success) setPromoInput('');
  };

  const getShippingCost = () => {
    if (cartSubtotal > 999 && shippingMethod === 'standard') return 0;
    if (shippingMethod === 'standard') return 99;
    if (shippingMethod === 'express') return 250;
    if (shippingMethod === 'overnight') return 450;
    return 99;
  };

  const giftCost = isGiftWrapping ? 50 : 0;
  const finalShipping = getShippingCost();
  const finalTotal = cartSubtotal - discountAmount + finalShipping + taxAmount + giftCost;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);

    let activeShippingAddress = null;

    if (user && !isAddingNewAddress) {
      const selected = addresses.find((a) => a.id === selectedAddrId);
      if (selected) {
        activeShippingAddress = {
          name: selected.name,
          street: selected.street,
          city: selected.city,
          state: selected.state,
          zip: selected.zip,
          country: selected.country
        };
      }
    }

    if (!activeShippingAddress) {
      if (!shippingName || !shippingStreet || !shippingCity || !shippingState || !shippingZip) {
        addToast('Please complete shipping address details.', 'error');
        setLoading(false);
        return;
      }
      activeShippingAddress = {
        name: shippingName,
        street: shippingStreet,
        city: shippingCity,
        state: shippingState,
        zip: shippingZip,
        country: shippingCountry
      };

      if (user) {
        await saveAddress({
          type: 'Shipping',
          ...activeShippingAddress,
          isDefault: addresses.length === 0
        });
      }
    }

    // Input Validations by Payment Method
    if (paymentMethod === 'card') {
      if (!cardNumber || !cardExpiry || !cardCvc) {
        addToast('Please enter credit card details.', 'error');
        setLoading(false);
        return;
      }
    } else if (paymentMethod === 'upi') {
      if (!upiId || !upiId.includes('@')) {
        addToast('Please enter a valid UPI ID (e.g., name@okaxis).', 'error');
        setLoading(false);
        return;
      }
    } else if (paymentMethod === 'netbanking') {
      if (!netBankingBank) {
        addToast('Please select your preferred banking portal.', 'error');
        setLoading(false);
        return;
      }
    } else if (paymentMethod === 'wallet') {
      if (!selectedWallet) {
        addToast('Please select your wallet option.', 'error');
        setLoading(false);
        return;
      }
    }

    if (!user) {
      if (!guestEmail || !guestEmail.includes('@')) {
        addToast('Please enter a valid guest email address.', 'error');
        setLoading(false);
        return;
      }
    }

    try {
      const order = await api.createOrder({
        items: cart,
        subtotal: cartSubtotal,
        shipping: finalShipping,
        tax: taxAmount,
        discount: discountAmount,
        total: finalTotal,
        shippingAddress: activeShippingAddress,
        notes: orderNotes,
        giftWrapped: isGiftWrapping,
        guestEmail: !user ? guestEmail : undefined,
        paymentDetails: {
          method: paymentMethod,
          last4: cardNumber ? cardNumber.slice(-4) : (upiId ? upiId : (netBankingBank ? netBankingBank : selectedWallet))
        }
      });
      clearCart();
      addToast('Order placed successfully!', 'success');
      navigate(`/order-confirmation/${order._id || order.id}`);
    } catch (err) {
      addToast('Order placement failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) return null;

  return (
    <div className="w-full bg-black min-h-screen py-12 select-none animate-fade-in text-white">
      <SEO title="Secure Checkout" />

      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Form */}
        <div className="lg:col-span-7 space-y-10">
          
          <div className="border-b border-neutral-900 pb-4">
            <h1 className="text-white text-4xl font-black font-impact tracking-widest uppercase">
              SECURE CHECKOUT
            </h1>
          </div>

          <form onSubmit={handlePlaceOrder} className="space-y-10">
            {/* 1. SHIPPING ADDRESS */}
            <div className="space-y-6">
              <h3 className="text-white font-black text-xs tracking-widest uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-brand-red rounded-full"></span>
                1. SHIPPING ADDRESS
              </h3>

              {user && addresses.length > 0 && !isAddingNewAddress && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddrId(addr.id)}
                        className={`p-5 rounded-luxury border bg-[#050507]/40 cursor-pointer flex flex-col justify-between transition-all ${
                          selectedAddrId === addr.id
                            ? 'border-brand-red bg-neutral-950/40 shadow-luxury'
                            : 'border-neutral-900/60 hover:border-neutral-700'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-white uppercase">{addr.name}</p>
                          <p className="text-[10px] text-neutral-500 font-semibold mt-2 uppercase">
                            {addr.street}, {addr.city}, {addr.state} - {addr.zip}
                          </p>
                          <p className="text-[9px] text-neutral-600 font-bold tracking-wider mt-1 uppercase">
                            {addr.country}
                          </p>
                        </div>
                        {addr.isDefault && (
                          <span className="text-[8px] font-black text-brand-red tracking-widest uppercase mt-4 block">
                            DEFAULT ADDRESS
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => { setIsAddingNewAddress(true); setSelectedAddrId(null); }}
                    className="text-[10px] font-black text-brand-red tracking-widest hover:underline uppercase cursor-pointer"
                  >
                    + ADD NEW ADDRESS
                  </button>
                </div>
              )}

              {isAddingNewAddress && (
                <div className="space-y-4 animate-fade-in">
                  {!user && (
                    <div className="border border-neutral-900 bg-neutral-950/20 p-4 rounded-luxury space-y-2 mb-2 text-left">
                      <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">GUEST EMAIL FOR UPDATES</label>
                      <input
                        type="email"
                        required
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="bg-black border border-neutral-900 rounded-full focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 transition"
                        placeholder="GUEST@EMAIL.COM"
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">RECIPIENT NAME</label>
                      <input
                        type="text"
                        required
                        value={shippingName}
                        onChange={(e) => setShippingName(e.target.value)}
                        className="bg-black border border-neutral-900 rounded-full focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 transition"
                        placeholder="BHAVYA ANAND"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">STREET ADDRESS</label>
                      <input
                        type="text"
                        required
                        value={shippingStreet}
                        onChange={(e) => setShippingStreet(e.target.value)}
                        className="bg-black border border-neutral-900 rounded-full focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 transition"
                        placeholder="STUDIO 201, NARIMAN POINT"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="col-span-2">
                      <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">CITY</label>
                      <input
                        type="text"
                        required
                        value={shippingCity}
                        onChange={(e) => setShippingCity(e.target.value)}
                        className="bg-black border border-neutral-900 rounded-full focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 transition"
                        placeholder="MUMBAI"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">STATE</label>
                      <input
                        type="text"
                        required
                        value={shippingState}
                        onChange={(e) => setShippingState(e.target.value)}
                        className="bg-black border border-neutral-900 rounded-full focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 transition"
                        placeholder="MAHARASHTRA"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">PIN CODE</label>
                      <input
                        type="text"
                        required
                        value={shippingZip}
                        onChange={(e) => setShippingZip(e.target.value)}
                        className="bg-black border border-neutral-900 rounded-full focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 transition"
                        placeholder="400021"
                      />
                    </div>
                  </div>

                  {user && addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsAddingNewAddress(false)}
                      className="text-[10px] font-black text-neutral-500 hover:text-white tracking-widest uppercase cursor-pointer"
                    >
                      RETURN TO SAVED ADDRESSES
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 2. SHIPPING SPEED */}
            <div className="space-y-6">
              <h3 className="text-white font-black text-xs tracking-widest uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-brand-red rounded-full"></span>
                2. SHIPPING DELIVERY METHOD
              </h3>

              <div className="space-y-3">
                {[
                  { id: 'standard', name: 'STANDARD COURIER', desc: 'Ships in 5-10 business days', price: cartSubtotal > 999 ? 'FREE' : '₹99.00' },
                  { id: 'express', name: 'EXPRESS AIRWAY', desc: 'Ships in 2-3 business days', price: '₹250.00' },
                  { id: 'overnight', name: 'OVERNIGHT DRAPE', desc: 'Guaranteed next morning delivery', price: '₹450.00' }
                ].map((meth) => (
                  <label
                    key={meth.id}
                    className={`flex items-center justify-between p-4 px-6 border bg-[#050507]/40 rounded-luxury cursor-pointer transition-all ${
                      shippingMethod === meth.id
                        ? 'border-brand-red bg-neutral-950/40 shadow-luxury'
                        : 'border-neutral-900/60 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="radio"
                        name="shipping_method"
                        checked={shippingMethod === meth.id}
                        onChange={() => setShippingMethod(meth.id)}
                        className="accent-brand-red cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-white uppercase block">{meth.name}</span>
                        <span className="text-[9px] text-neutral-500 font-semibold uppercase mt-0.5">{meth.desc}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-white tracking-widest">{meth.price}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* OPTIONAL ADDONS: GIFT WRAP & NOTES */}
            <div className="space-y-6">
              <h3 className="text-white font-black text-xs tracking-widest uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-brand-red rounded-full"></span>
                ADDITIONAL SERVICES & NOTES
              </h3>
              
              <div className="p-5 border border-neutral-900 bg-[#050507]/40 rounded-luxury space-y-4">
                <label className="flex items-center gap-3 cursor-pointer select-none text-xs font-bold uppercase text-neutral-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={isGiftWrapping}
                    onChange={(e) => setIsGiftWrapping(e.target.checked)}
                    className="accent-brand-red cursor-pointer"
                  />
                  <span>ADD PREMIUM GIFT WRAPPING (ADD ₹50.00)</span>
                </label>
                
                <div>
                  <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">ORDER NOTES / DELIVERY INSTRUCTIONS</label>
                  <textarea
                    rows={3}
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="bg-black border border-neutral-900 rounded-luxury focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 transition resize-none uppercase"
                    placeholder="E.G. LEAVE AT THE FRONT DOOR, PRIVATE PACKAGING REQUEST"
                  />
                </div>
              </div>
            </div>

            {/* 3. PAYMENT GATEWAY */}
            <div className="space-y-6">
              <h3 className="text-white font-black text-xs tracking-widest uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-brand-red rounded-full"></span>
                3. SECURE PAYMENT DETAILS
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 border-b border-neutral-900 pb-4">
                {[
                  { id: 'card', label: 'CARDS' },
                  { id: 'upi', label: 'UPI' },
                  { id: 'netbanking', label: 'NET BANK' },
                  { id: 'wallet', label: 'WALLETS' },
                  { id: 'cod', label: 'COD' }
                ].map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`py-3.5 text-[9px] font-black tracking-widest uppercase border transition rounded-full cursor-pointer ${
                      paymentMethod === method.id
                        ? 'bg-brand-red border-brand-red text-white'
                        : 'border-neutral-900 bg-neutral-950/40 text-neutral-400 hover:border-neutral-600'
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>

              {paymentMethod === 'card' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">CARD NUMBER</label>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                      className="bg-black border border-neutral-900 rounded-full focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 transition"
                      placeholder="4242 4242 4242 4242"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">EXPIRY DATE</label>
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value.slice(0, 5))}
                        className="bg-black border border-neutral-900 rounded-full focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 transition"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">CVV/CVC</label>
                      <input
                        type="password"
                        required
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="bg-black border border-neutral-900 rounded-full focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 transition"
                        placeholder="•••"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'upi' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">UPI ID (VPA)</label>
                    <input
                      type="text"
                      required
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="bg-black border border-neutral-900 rounded-full focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 transition uppercase"
                      placeholder="alex@okaxis"
                    />
                  </div>
                  <div className="p-4 bg-neutral-950/20 border border-neutral-900 rounded-luxury text-center">
                    <p className="text-[10px] text-brand-red font-bold uppercase tracking-wider">
                      UPI TRANSACTION VERIFICATION REQUEST
                    </p>
                    <p className="text-[9px] text-neutral-500 font-semibold uppercase mt-1">
                      A request will be sent to your UPI client App to authorize the ₹{finalTotal.toFixed(2)} payment.
                    </p>
                  </div>
                </div>
              )}

              {paymentMethod === 'netbanking' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">PREFERRED BANK PORTAL</label>
                    <select
                      value={netBankingBank}
                      onChange={(e) => setNetBankingBank(e.target.value)}
                      className="bg-black border border-neutral-900 rounded-full focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 transition uppercase"
                      required
                    >
                      <option value="">-- SELECT BANK --</option>
                      <option value="HDFC Bank">HDFC BANK</option>
                      <option value="ICICI Bank">ICICI BANK</option>
                      <option value="State Bank of India">STATE BANK OF INDIA</option>
                      <option value="Axis Bank">AXIS BANK</option>
                      <option value="Kotak Mahindra Bank">KOTAK MAHINDRA BANK</option>
                    </select>
                  </div>
                </div>
              )}

              {paymentMethod === 'wallet' && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">SELECT WALLET PROVIDER</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['PayTM', 'PhonePe', 'Amazon Pay', 'Google Pay'].map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setSelectedWallet(w)}
                          className={`py-3 text-[10px] font-black tracking-widest border uppercase transition rounded-full cursor-pointer ${
                            selectedWallet === w
                              ? 'bg-brand-red border-brand-red text-white'
                              : 'border-neutral-900 bg-neutral-950/40 text-neutral-400 hover:border-neutral-600'
                          }`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'cod' && (
                <div className="bg-neutral-950/20 border border-neutral-900/40 p-6 rounded-luxury text-center animate-fade-in space-y-2">
                  <p className="text-[10px] text-brand-red font-bold uppercase tracking-wider">
                    CASH ON DELIVERY ENABLED
                  </p>
                  <p className="text-[9px] text-neutral-500 font-semibold uppercase">
                    Pay our courier agent in cash or scanning QR code upon home package arrival. An additional cash handling fee may apply.
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-red hover:bg-red-700 text-white font-black text-xs tracking-widest py-4 uppercase transition duration-300 rounded-full shadow-lg hover:shadow-brand-red/20 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'PROCESSING TRANSACTION...' : `PLACE ORDER • ₹${finalTotal.toFixed(2)}`}
            </button>
          </form>
        </div>

        {/* Right Sidebar summary block */}
        <div className="lg:col-span-5 space-y-8">
          
          <div className="p-6 bg-[#050507]/60 rounded-luxury shadow-luxury border border-neutral-900/40">
            <h3 className="text-white font-black text-xs tracking-widest uppercase border-b border-neutral-950 pb-3 mb-6">
              ORDER SUMMARY
            </h3>

            {/* Items list */}
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1 border-b border-neutral-950 pb-6 mb-6">
              {cart.map((item) => (
                <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-4">
                  <div className="w-12 h-16 bg-neutral-950 rounded-luxury border border-neutral-900/40 overflow-hidden shrink-0">
                    <img src={item.image} className="w-full h-full object-cover object-top" alt="" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-[11px] font-bold text-white uppercase line-clamp-1">{item.title}</p>
                    <p className="text-[9px] text-neutral-500 font-semibold uppercase mt-0.5">
                      SIZE: {item.size} • QTY: {item.quantity}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-white">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Promo code */}
            <div className="border-b border-neutral-950 pb-6 mb-6">
              {couponCode ? (
                <div className="flex items-center justify-between bg-green-950/20 border border-green-800/30 px-4 py-2.5 rounded-full">
                  <span className="text-[9px] font-black text-green-400 tracking-widest uppercase">
                    PROMO {couponCode} APPLIED
                  </span>
                  <button
                    onClick={removeCoupon}
                    className="text-[9px] font-black text-neutral-500 hover:text-white uppercase cursor-pointer"
                  >
                    REMOVE
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ENTER PROMO CODE (E.G. COSO10)"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    className="bg-black border border-neutral-900 rounded-full focus:border-neutral-600 text-white text-[9px] font-black tracking-widest placeholder-neutral-700 outline-none p-3 px-4 w-full uppercase"
                  />
                  <button
                    type="submit"
                    className="bg-neutral-955 bg-[#050507] border border-neutral-900 hover:border-neutral-700 text-white px-5 text-[9px] font-black tracking-widest hover:bg-neutral-900 uppercase transition rounded-full cursor-pointer"
                  >
                    APPLY
                  </button>
                </form>
              )}
            </div>

            {/* Calculation breakdown */}
            <div className="space-y-3 text-[10px] font-bold tracking-widest uppercase text-neutral-500 border-b border-neutral-950 pb-6 mb-6">
              <div className="flex justify-between items-center">
                <span>BAG SUBTOTAL</span>
                <span className="text-white">₹{cartSubtotal.toFixed(2)}</span>
              </div>
              
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-green-500">
                  <span>DISCOUNT</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span>ESTIMATED TAX (8%)</span>
                <span className="text-white">₹{taxAmount.toFixed(2)}</span>
              </div>

              {isGiftWrapping && (
                <div className="flex justify-between items-center text-white">
                  <span>GIFT WRAPPING ADDON</span>
                  <span>₹50.00</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span>SHIPPING CHARGES</span>
                <span className="text-white">
                  {finalShipping === 0 ? 'FREE' : `₹${finalShipping.toFixed(2)}`}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs font-black tracking-widest uppercase">
              <span className="text-neutral-300">ESTIMATED TOTAL</span>
              <span className="text-white text-base">₹{finalTotal.toFixed(2)}</span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
