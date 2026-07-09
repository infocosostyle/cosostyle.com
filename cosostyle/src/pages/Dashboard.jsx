import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, useRecentlyViewed, useToasts, useAppContext } from '../context/AppContext';
import { api } from '../lib/api';
import { User, MapPin, ShoppingBag, ShieldCheck, Trash2, Edit3, Eye, Bell, RefreshCw, X, Check, Star, Copy, ArrowLeftRight } from 'lucide-react';
import SEO from '../components/SEO';

export default function Dashboard() {
  const { user, addresses, authLoading, updateProfile, changePassword, saveAddress, deleteAddress } = useAuth();
  const { loyaltyPoints, referralCode } = useAppContext();
  const { recentlyViewed } = useRecentlyViewed();
  const { addToast } = useToasts();
  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?tab=login');
    }
  }, [user, authLoading, navigate]);

  // Sidebar Menu State
  const [activeSubTab, setActiveSubTab] = useState('orders');
  
  // Orders & Returns State
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Profile Edit State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileEditing, setProfileEditing] = useState(false);

  // Address Modal State
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [addressId, setAddressId] = useState(null);
  const [addressName, setAddressName] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressZip, setAddressZip] = useState('');
  const [addressCountry, setAddressCountry] = useState('India');
  const [addressDefault, setAddressDefault] = useState(false);

  // Security Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);

  // Returns Action Modal
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnOrderId, setReturnOrderId] = useState('');
  const [returnItems, setReturnItems] = useState([]);
  const [returnReason, setReturnReason] = useState('');
  const [returnAmount, setReturnAmount] = useState(0);

  // Exchange Modal
  const [exchangeModalOpen, setExchangeModalOpen] = useState(false);
  const [exchangeOrderId, setExchangeOrderId] = useState('');
  const [exchangeReason, setExchangeReason] = useState('');
  const [exchangeNewSize, setExchangeNewSize] = useState('M');

  // Notifications
  const [notifications, setNotifications] = useState([]);

  // Fetch telemetry on load
  const loadDashboardTelemetry = async () => {
    try {
      setOrdersLoading(true);
      const list = await api.getOrders();
      setOrders(list);

      const retList = await api.getReturns();
      setReturns(retList);

      const notifList = await api.getNotifications();
      setNotifications(notifList);
    } catch (err) {
      addToast('Could not load portal telemetry details.', 'error');
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfilePhone(user.phone);
      loadDashboardTelemetry();
    }
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="w-full bg-black min-h-[70vh] flex justify-center items-center">
        <SEO title="Loading Profile" />
        <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- ACTIONS ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileName) return;
    try {
      await updateProfile({ name: profileName, phone: profilePhone });
      setProfileEditing(false);
    } catch (err) {
      // Handled
    }
  };

  const handleSecurityUpdate = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      addToast('Confirm password does not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      addToast('Password must be at least 6 characters.', 'error');
      return;
    }
    setSecurityLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      // Handled
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleOpenAddressForm = (addr = null) => {
    if (addr) {
      setAddressId(addr.id);
      setAddressName(addr.name);
      setAddressStreet(addr.street);
      setAddressCity(addr.city);
      setAddressState(addr.state);
      setAddressZip(addr.zip);
      setAddressCountry(addr.country);
      setAddressDefault(addr.isDefault);
    } else {
      setAddressId(null);
      setAddressName(user.name);
      setAddressStreet('');
      setAddressCity('');
      setAddressState('');
      setAddressZip('');
      setAddressCountry('India');
      setAddressDefault(addresses.length === 0);
    }
    setAddressFormOpen(true);
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (!addressName || !addressStreet || !addressCity || !addressState || !addressZip) return;
    
    await saveAddress({
      id: addressId,
      name: addressName,
      street: addressStreet,
      city: addressCity,
      state: addressState,
      zip: addressZip,
      country: addressCountry,
      isDefault: addressDefault,
      type: 'Shipping'
    });
    setAddressFormOpen(false);
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      const updated = await api.cancelOrder(orderId);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: updated.status } : o)));
      addToast('Order successfully cancelled.', 'success');
      loadDashboardTelemetry();
    } catch (err) {
      addToast(err.message || 'Failed to cancel order.', 'error');
    }
  };

  const handleOpenReturnModal = (ord) => {
    setReturnOrderId(ord._id);
    setReturnItems(ord.items);
    setReturnAmount(ord.total);
    setReturnReason('');
    setReturnModalOpen(true);
  };

  const handleConfirmReturn = async (e) => {
    e.preventDefault();
    if (!returnReason) {
      addToast('Please specify a return reason.', 'error');
      return;
    }
    try {
      await api.submitReturnRequest(returnOrderId, {
        reason: returnReason,
        items: returnItems,
        refundAmount: returnAmount
      });
      setReturnModalOpen(false);
      addToast('Return request submitted for verification.', 'success');
      loadDashboardTelemetry();
    } catch (err) {
      addToast('Failed to submit return request.', 'error');
    }
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      addToast('All notifications marked as read.', 'success');
    } catch { /* ignore */ }
  };

  const handleOpenExchangeModal = (ord) => {
    setExchangeOrderId(ord._id);
    setExchangeReason('');
    setExchangeNewSize('M');
    setExchangeModalOpen(true);
  };

  const handleConfirmExchange = async (e) => {
    e.preventDefault();
    if (!exchangeReason) {
      addToast('Please specify a reason for exchange.', 'error');
      return;
    }
    try {
      await api.submitExchangeRequest(exchangeOrderId, {
        reason: exchangeReason,
        newSize: exchangeNewSize
      });
      setExchangeModalOpen(false);
      addToast('Exchange request submitted successfully.', 'success');
      loadDashboardTelemetry();
    } catch (err) {
      addToast('Failed to submit exchange request.', 'error');
    }
  };

  return (
    <div className="w-full bg-black min-h-screen py-16 select-none animate-fade-in text-white">
      <SEO title="My Dashboard" />

      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header Block */}
        <div className="pb-6 mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-neutral-900">
          <div>
            <span className="text-[10px] text-brand-red font-black tracking-widest uppercase block mb-1">MEMBERSHIP PORTAL</span>
            <h1 className="text-white text-5xl font-black font-impact tracking-tight uppercase">
              STUDIO DASHBOARD
            </h1>
          </div>
          <div className="text-neutral-500 text-xs font-bold uppercase tracking-wider">
            WELCOME BACK, <span className="text-white font-black">{user.name.toUpperCase()}</span>
          </div>
        </div>

        {/* Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Vertical Menu */}
          <div className="lg:col-span-3 flex flex-row lg:flex-col pb-6 lg:pb-0 lg:pr-8 gap-1.5 overflow-x-auto lg:overflow-x-visible border-b lg:border-b-0 lg:border-r border-neutral-900">
            {[
              { id: 'orders', name: 'MY ORDERS', icon: ShoppingBag },
              { id: 'returns', name: 'RETURNS', icon: RefreshCw },
              { id: 'loyalty', name: 'LOYALTY POINTS', icon: Star },
              { id: 'notifications', name: 'NOTIFICATIONS', icon: Bell },
              { id: 'profile', name: 'PERSONAL DETAILS', icon: User },
              { id: 'addresses', name: 'SAVED ADDRESSES', icon: MapPin },
              { id: 'security', name: 'ACCOUNT SECURITY', icon: ShieldCheck }
            ].map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveSubTab(tab.id); setAddressFormOpen(false); }}
                  className={`w-full text-left px-5 py-3.5 text-[10px] font-black tracking-widest uppercase flex items-center gap-3 shrink-0 rounded-full cursor-pointer transition-all ${
                    activeSubTab === tab.id
                      ? 'bg-brand-red text-white shadow-lg shadow-brand-red/10'
                      : 'bg-transparent text-neutral-500 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <TabIcon size={12} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>

          {/* Right Workspace detail Content Box container */}
          <div className="lg:col-span-9">
            
            {/* TAB: MY ORDERS LIST */}
            {activeSubTab === 'orders' && (
              <div className="space-y-8 animate-fade-in">
                <h3 className="text-white font-black text-xs tracking-widest uppercase border-b border-neutral-900 pb-2 mb-6">
                  ORDER HISTORY
                </h3>

                {ordersLoading ? (
                  <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin mx-auto my-12"></div>
                ) : orders.length > 0 ? (
                  <div className="space-y-6">
                    {orders.map((ord) => (
                      <div key={ord._id} className="bg-neutral-950/20 border border-neutral-900/40 p-6 rounded-luxury shadow-luxury space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-neutral-900 pb-3 gap-2 text-[9px] font-bold tracking-widest uppercase text-neutral-500">
                          <div>
                            ORDER ID: <span className="text-white">{ord.id}</span>
                          </div>
                          <div>
                            DATE: <span className="text-white">{ord.date}</span>
                          </div>
                          <div>
                            STATUS:{' '}
                            <span 
                              className={
                                ord.status === 'Cancelled' || ord.status === 'Return Rejected'
                                  ? 'text-brand-red' 
                                  : ord.status === 'Delivered' || ord.status === 'Refunded'
                                  ? 'text-green-500' 
                                  : 'text-yellow-500'
                              }
                            >
                              {ord.status}
                            </span>
                          </div>
                          <div>
                            TOTAL: <span className="text-white">₹{ord.total.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-4">
                          {ord.items.map((item, index) => (
                            <div key={index} className="flex gap-4">
                              <div className="w-12 h-16 bg-neutral-950 border border-neutral-900/40 rounded-luxury overflow-hidden shrink-0">
                                <img src={item.image} className="w-full h-full object-cover object-top" alt="" />
                              </div>
                              <div className="flex-grow">
                                <p className="text-[11px] font-bold text-white uppercase">{item.title}</p>
                                <p className="text-[9px] text-neutral-500 font-semibold uppercase mt-0.5">
                                  SIZE: {item.size} • QTY: {item.quantity}
                                </p>
                              </div>
                              <span className="text-xs font-bold text-white">₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Actions line */}
                        <div className="flex flex-wrap gap-3 pt-4 border-t border-neutral-900 justify-end">
                          <Link
                            to={`/order-confirmation/${ord._id || ord.id}`}
                            className="border border-neutral-900 hover:border-neutral-700 text-white text-[8px] font-black tracking-widest px-4 py-2.5 rounded-full uppercase transition flex items-center gap-1.5"
                          >
                            <Eye size={10} />
                            TRACK / INVOICE
                          </Link>

                          {ord.status === 'Delivered' && (
                            <button
                              onClick={() => handleOpenReturnModal(ord)}
                              className="border border-brand-red text-brand-red hover:bg-brand-red hover:text-white text-[8px] font-black tracking-widest px-4 py-2.5 rounded-full uppercase transition cursor-pointer"
                            >
                              RETURN PRODUCTS
                            </button>
                          )}

                          {(ord.status === 'Placed' || ord.status === 'Processing') && (
                            <button
                              onClick={() => handleCancelOrder(ord._id)}
                              className="border border-brand-red text-brand-red hover:bg-brand-red hover:text-white text-[8px] font-black tracking-widest px-4 py-2.5 rounded-full uppercase transition cursor-pointer"
                            >
                              CANCEL ORDER
                            </button>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-neutral-900 rounded-luxury py-16 text-center">
                    <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">
                      No order transactions registered yet.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: RETURNS HISTORY */}
            {activeSubTab === 'returns' && (
              <div className="space-y-8 animate-fade-in">
                <h3 className="text-white font-black text-xs tracking-widest uppercase border-b border-neutral-900 pb-2 mb-6">
                  RETURN & REFUND REQUESTS
                </h3>

                {returns.length > 0 ? (
                  <div className="space-y-6">
                    {returns.map((ret) => (
                      <div key={ret._id} className="bg-neutral-950/20 border border-neutral-900/40 p-6 rounded-luxury shadow-luxury space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-neutral-900 pb-3 gap-2 text-[9px] font-bold tracking-widest uppercase text-neutral-500">
                          <div>ORDER REF: <span className="text-white">{ret.orderId}</span></div>
                          <div>STATUS:{' '}
                            <span className={ret.status === 'Approved' ? 'text-green-500' : ret.status === 'Rejected' ? 'text-brand-red' : 'text-yellow-500'}>
                              {ret.status.toUpperCase()}
                            </span>
                          </div>
                          <div>REFUND AMOUNT: <span className="text-white">₹{ret.refundAmount.toFixed(2)}</span></div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-neutral-400 uppercase">REASON: {ret.reason}</p>
                          <div className="pl-4 border-l border-neutral-900 space-y-1">
                            {ret.items.map((i, idx) => (
                              <p key={idx} className="text-[9px] font-semibold text-neutral-500 uppercase">{i.title} (x{i.quantity}) - SIZE: {i.size}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-neutral-900 rounded-luxury py-16 text-center">
                    <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">
                      No return requests lodged.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: LOYALTY POINTS */}
            {activeSubTab === 'loyalty' && (
              <div className="space-y-8 animate-fade-in">
                <h3 className="text-white font-black text-xs tracking-widest uppercase border-b border-neutral-900 pb-2 mb-6">
                  LOYALTY REWARDS PROGRAM
                </h3>

                {/* Points Balance Card */}
                <div className="bg-gradient-to-br from-brand-red/10 to-neutral-950 border border-red-900/30 rounded-2xl p-8 text-center">
                  <Star className="text-brand-red mx-auto mb-3" size={28} />
                  <div className="text-6xl font-black text-white mb-2">{loyaltyPoints}</div>
                  <div className="text-[10px] font-black text-brand-red tracking-widest uppercase">LOYALTY POINTS BALANCE</div>
                  <p className="text-neutral-500 text-[10px] mt-2 font-semibold">1 Point = ₹0.10 discount value</p>
                </div>

                {/* Referral Code */}
                {referralCode && (
                  <div className="bg-neutral-950/20 border border-neutral-900/40 rounded-xl p-5">
                    <h4 className="text-white font-black text-[10px] tracking-widest uppercase mb-3">YOUR REFERRAL CODE</h4>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-black border border-neutral-800 rounded-full px-4 py-2.5 font-black text-sm text-white tracking-widest text-center">
                        {referralCode}
                      </div>
                      <button
                        onClick={() => { navigator.clipboard.writeText(referralCode); addToast('Referral code copied!', 'success'); }}
                        className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-full transition cursor-pointer"
                        title="Copy referral code"
                      >
                        <Copy size={14} className="text-neutral-400" />
                      </button>
                    </div>
                    <p className="text-neutral-600 text-[9px] font-bold tracking-wider uppercase mt-2">
                      Share your code — earn 100 points per successful referral
                    </p>
                  </div>
                )}

                {/* How to Earn */}
                <div className="space-y-2">
                  <h4 className="text-white font-black text-[10px] tracking-widest uppercase mb-3">HOW TO EARN POINTS</h4>
                  {[
                    { action: 'Create an account', points: '50 pts (Welcome Bonus)' },
                    { action: 'Place an order', points: '10 pts per ₹100 spent' },
                    { action: 'Refer a friend', points: '100 pts per referral' },
                    { action: 'Write a product review', points: '20 pts' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-neutral-950/20 border border-neutral-900/40 rounded-xl px-4 py-3">
                      <span className="text-neutral-400 text-[10px] font-bold tracking-wider uppercase">{item.action}</span>
                      <span className="text-brand-red font-black text-[10px] tracking-wider">{item.points}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: NOTIFICATIONS */}
            {activeSubTab === 'notifications' && (
              <div className="space-y-8 animate-fade-in">
                <h3 className="text-white font-black text-xs tracking-widest uppercase border-b border-neutral-900 pb-2 mb-6">
                  STUDIO NOTIFICATIONS
                </h3>

                {notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <div 
                        key={notif._id} 
                        className={`p-4 border rounded-luxury flex justify-between items-center transition-all ${
                          notif.read 
                            ? 'bg-neutral-950/10 border-neutral-900/60 opacity-60' 
                            : 'bg-neutral-900/30 border-brand-red/30 shadow-md'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {!notif.read && <span className="w-1.5 h-1.5 bg-brand-red rounded-full"></span>}
                            <span className="text-xs font-bold text-white uppercase">{notif.title}</span>
                          </div>
                          <p className="text-[10px] text-neutral-400 uppercase font-medium">{notif.message}</p>
                        </div>
                        
                        {!notif.read && (
                          <button
                            onClick={() => handleMarkNotificationRead(notif._id)}
                            className="p-1 text-neutral-500 hover:text-white hover:bg-neutral-900 rounded-full transition cursor-pointer"
                            title="Mark as Read"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-neutral-900 rounded-luxury py-16 text-center">
                    <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">
                      Your inbox notification list is empty.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: PERSONAL DETAILS */}
            {activeSubTab === 'profile' && (
              <div className="space-y-8 animate-fade-in bg-neutral-950/20 p-8 border border-neutral-900/40 rounded-luxury">
                <h3 className="text-white font-black text-xs tracking-widest uppercase border-b border-neutral-900 pb-2 mb-6">
                  PERSONAL ACCOUNT DETAILS
                </h3>

                {!profileEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-xs font-bold uppercase tracking-wider">
                      <div>
                        <span className="text-neutral-500 block text-[9px]">FULL NAME</span>
                        <span className="text-white mt-1 block">{user.name}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-[9px]">EMAIL ADDRESS</span>
                        <span className="text-white mt-1 block">{user.email}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-[9px]">MOBILE PHONE</span>
                        <span className="text-white mt-1 block">{user.phone || 'NOT REGISTERED'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setProfileEditing(true)}
                      className="border border-neutral-900 hover:border-neutral-700 text-white text-[8px] font-black tracking-widest px-6 py-3 rounded-full uppercase transition mt-6 cursor-pointer"
                    >
                      EDIT PROFILE
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">FULL NAME</label>
                        <input
                          type="text"
                          required
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="bg-black border border-neutral-900 rounded-full focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">PHONE NUMBER</label>
                        <input
                          type="text"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          className="bg-black border border-neutral-900 rounded-full focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 transition"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                      <button
                        type="submit"
                        className="bg-brand-red hover:bg-red-700 text-white text-[8px] font-black tracking-widest px-6 py-3 rounded-full uppercase transition cursor-pointer"
                      >
                        SAVE CHANGES
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfileEditing(false)}
                        className="border border-neutral-900 hover:border-neutral-700 text-white text-[8px] font-black tracking-widest px-6 py-3 rounded-full uppercase transition cursor-pointer"
                      >
                        CANCEL
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB: SAVED ADDRESSES */}
            {activeSubTab === 'addresses' && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex justify-between items-center border-b border-neutral-900 pb-2 mb-6">
                  <h3 className="text-white font-black text-xs tracking-widest uppercase">
                    DELIVERY COORDINATES
                  </h3>
                  <button
                    onClick={() => handleOpenAddressForm()}
                    className="bg-[#050507] border border-neutral-900 hover:border-neutral-700 text-white text-[8px] font-black tracking-widest px-4 py-2 rounded-full uppercase transition cursor-pointer"
                  >
                    + NEW ADDRESS
                  </button>
                </div>

                {addressFormOpen && (
                  <form onSubmit={handleAddressSubmit} className="bg-neutral-950/20 border border-neutral-900/40 p-6 rounded-luxury space-y-4 mb-8">
                    <h4 className="text-white text-[10px] font-black tracking-widest uppercase mb-4 border-b border-neutral-900/50 pb-2">
                      {addressId ? 'EDIT ADDRESS' : 'NEW SHIPPINGS ADDRESS'}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">RECIPIENT NAME</label>
                        <input
                          type="text"
                          required
                          value={addressName}
                          onChange={(e) => setAddressName(e.target.value)}
                          className="bg-black border border-neutral-900 rounded-full focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">STREET ADDRESS</label>
                        <input
                          type="text"
                          required
                          value={addressStreet}
                          onChange={(e) => setAddressStreet(e.target.value)}
                          className="bg-black border border-neutral-900 rounded-full focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="col-span-2">
                        <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">CITY</label>
                        <input
                          type="text"
                          required
                          value={addressCity}
                          onChange={(e) => setAddressCity(e.target.value)}
                          className="bg-black border border-neutral-900 rounded-full focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">STATE</label>
                        <input
                          type="text"
                          required
                          value={addressState}
                          onChange={(e) => setAddressState(e.target.value)}
                          className="bg-black border border-neutral-900 rounded-full focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">PIN CODE</label>
                        <input
                          type="text"
                          required
                          value={addressZip}
                          onChange={(e) => setAddressZip(e.target.value)}
                          className="bg-black border border-neutral-900 rounded-full focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 transition"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer select-none text-[10px] font-bold uppercase text-neutral-400">
                      <input
                        type="checkbox"
                        checked={addressDefault}
                        onChange={(e) => setAddressDefault(e.target.checked)}
                        className="accent-brand-red"
                      />
                      <span>SET AS DEFAULT ADDRESS</span>
                    </label>

                    <div className="flex gap-2 pt-4">
                      <button
                        type="submit"
                        className="bg-brand-red hover:bg-red-700 text-white text-[8px] font-black tracking-widest px-6 py-3 rounded-full uppercase transition cursor-pointer"
                      >
                        SAVE ADDRESS
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddressFormOpen(false)}
                        className="border border-neutral-900 hover:border-neutral-700 text-white text-[8px] font-black tracking-widest px-6 py-3 rounded-full uppercase transition cursor-pointer"
                      >
                        CANCEL
                      </button>
                    </div>
                  </form>
                )}

                {addresses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="p-6 rounded-luxury border border-neutral-900 bg-neutral-950/20 space-y-4 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="text-white font-bold text-xs uppercase">{addr.name}</span>
                            <div className="flex gap-2">
                              <button onClick={() => handleOpenAddressForm(addr)} className="text-neutral-500 hover:text-white transition"><Edit3 size={12} /></button>
                              <button onClick={() => deleteAddress(addr.id)} className="text-neutral-500 hover:text-brand-red transition"><Trash2 size={12} /></button>
                            </div>
                          </div>
                          <p className="text-[10px] text-neutral-500 font-semibold mt-2 uppercase">
                            {addr.street}, {addr.city}, {addr.state} - {addr.zip}
                          </p>
                          <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-wider mt-1">{addr.country}</p>
                        </div>
                        {addr.isDefault && (
                          <span className="text-[8px] font-black text-brand-red tracking-widest uppercase block pt-4">DEFAULT ADDRESS</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider py-8 text-center border border-dashed border-neutral-900">
                    No coordinates registered.
                  </p>
                )}
              </div>
            )}

            {/* TAB: ACCOUNT SECURITY */}
            {activeSubTab === 'security' && (
              <form onSubmit={handleSecurityUpdate} className="space-y-6 animate-fade-in bg-neutral-950/20 p-8 border border-neutral-900/40 rounded-luxury max-w-lg">
                <h3 className="text-white font-black text-xs tracking-widest uppercase border-b border-neutral-900 pb-2 mb-6">
                  UPDATE PASSWORD
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">OLD PASSWORD</label>
                    <input
                      type="password"
                      required
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="bg-black border border-neutral-900 rounded-full focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 transition"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">NEW PASSWORD</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-black border border-neutral-900 rounded-full focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 transition"
                      placeholder="•••••••• (MIN 6 CHARS)"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">CONFIRM PASSWORD</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-black border border-neutral-900 rounded-full focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 transition"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={securityLoading}
                  className="bg-brand-red hover:bg-red-700 text-white text-[8px] font-black tracking-widest px-8 py-3.5 rounded-full uppercase transition cursor-pointer disabled:opacity-40"
                >
                  {securityLoading ? 'UPDATING...' : 'CHANGE PASSWORD'}
                </button>
              </form>
            )}

          </div>

        </div>

      </div>

      {/* Return Request Modal */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-[200] flex justify-center items-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setReturnModalOpen(false)}></div>
          <form 
            onSubmit={handleConfirmReturn}
            className="relative bg-neutral-950 border border-neutral-900 p-8 rounded-luxury max-w-lg w-full space-y-6 z-10 animate-scale-up text-white"
          >
            <div className="flex justify-between items-center border-b border-neutral-900 pb-4">
              <h3 className="font-black font-impact tracking-widest text-xl uppercase">LODGE RETURN REQUEST</h3>
              <button type="button" onClick={() => setReturnModalOpen(false)} className="text-neutral-500 hover:text-white transition">
                <X size={20} />
              </button>
            </div>

            <p className="text-neutral-400 text-xs leading-relaxed uppercase">
              Specify your reason for returning item(s) from order ID: <span className="text-white font-bold">{returnOrderId}</span>. Estimated refund amount: <span className="text-white font-bold">₹{returnAmount.toFixed(2)}</span>.
            </p>

            <div>
              <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1.5">REASON FOR RETURN</label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="bg-black border border-neutral-900 rounded-full focus:border-neutral-550 text-white text-xs font-semibold tracking-wider outline-none w-full p-3 px-4 transition uppercase"
                required
              >
                <option value="">-- SELECT REASON --</option>
                <option value="Size didn't fit properly">SIZE DIDN'T FIT PROPERLY</option>
                <option value="Fabric quality not as expected">FABRIC QUALITY NOT AS EXPECTED</option>
                <option value="Incorrect color or item received">INCORRECT COLOR OR ITEM RECEIVED</option>
                <option value="Damaged during airway courier dispatch">DAMAGED DURING AIRWAY COURIER DISPATCH</option>
                <option value="Changed my mind">CHANGED MY MIND</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2 justify-end">
              <button
                type="submit"
                className="bg-brand-red hover:bg-red-700 text-white text-[8px] font-black tracking-widest px-6 py-3 rounded-full uppercase transition cursor-pointer"
              >
                CONFIRM SUBMISSION
              </button>
              <button
                type="button"
                onClick={() => setReturnModalOpen(false)}
                className="border border-neutral-900 hover:border-neutral-700 text-white text-[8px] font-black tracking-widest px-6 py-3 rounded-full uppercase transition cursor-pointer"
              >
                CANCEL
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
