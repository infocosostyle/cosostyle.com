import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, useToasts } from '../context/AppContext';
import { api } from '../lib/api';
import { BarChart3, ShoppingBag, FolderKanban, Ticket, ShieldCheck, Eye, Plus, Trash2, ArrowRight, RefreshCw, FileText, Check, X, Users, Image } from 'lucide-react';
import SEO from '../components/SEO';

export default function Admin() {
  const { user, authLoading } = useAuth();
  const { addToast } = useToasts();
  const navigate = useNavigate();

  // Access check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      addToast('Access denied. Administrator credentials required.', 'error');
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'orders' | 'returns' | 'products' | 'coupons' | 'banners' | 'blogs' | 'users'
  const [analytics, setAnalytics] = useState(null);
  const [adminOrders, setAdminOrders] = useState([]);
  const [adminReturns, setAdminReturns] = useState([]);
  const [products, setProducts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [adminBanners, setAdminBanners] = useState([]);
  const [adminBlogs, setAdminBlogs] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states for creating products
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('classic');
  const [newColor, setNewColor] = useState('Black');
  const [newDescription, setNewDescription] = useState('');
  const [newSizes, setNewSizes] = useState(['S', 'M', 'L', 'XL']);
  const [newSpecs, setNewSpecs] = useState('');
  const [newImage, setNewImage] = useState('/src/assets/tshirt 3/05-05-2025 christian00466.jpg');

  // Advanced fields
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newSku, setNewSku] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('crews');
  const [newCollectionName, setNewCollectionName] = useState('Essentials Drop 01');
  const [newFabric, setNewFabric] = useState('100% Combed Cotton');
  const [newMaterial, setNewMaterial] = useState('Cotton');
  const [newFitType, setNewFitType] = useState('Regular Fit');
  const [newSleeveType, setNewSleeveType] = useState('Half Sleeve');
  const [newNeckType, setNewNeckType] = useState('Round Neck');
  const [newPattern, setNewPattern] = useState('Solid');
  const [newOccasion, setNewOccasion] = useState('Casual');
  const [newWashCare, setNewWashCare] = useState('Wash cold inside out.');
  const [newCountryOfOrigin, setNewCountryOfOrigin] = useState('India');
  const [newPackageContents, setNewPackageContents] = useState('1 T-Shirt');
  const [newSeoTitle, setNewSeoTitle] = useState('');
  const [newSeoDescription, setNewSeoDescription] = useState('');
  const [newInventory, setNewInventory] = useState('100');

  // Form states for creating coupons
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newDiscountPercent, setNewDiscountPercent] = useState('');

  // Form states for Banners
  const [newBannerTitle, setNewBannerTitle] = useState('');
  const [newBannerSubtitle, setNewBannerSubtitle] = useState('');
  const [newBannerImage, setNewBannerImage] = useState('/src/assets/hero.png');
  const [newBannerLink, setNewBannerLink] = useState('/shop');

  // Form states for Blogs
  const [newBlogTitle, setNewBlogTitle] = useState('');
  const [newBlogCategory, setNewBlogCategory] = useState('STUDIO NEWS');
  const [newBlogImage, setNewBlogImage] = useState('/src/assets/tshirt 1/05-05-2025 christian00425.jpg');
  const [newBlogExcerpt, setNewBlogExcerpt] = useState('');
  const [newBlogContent, setNewBlogContent] = useState('');
  const [newBlogTags, setNewBlogTags] = useState('FABRIC, STYLE');
  const [newBlogReadTime, setNewBlogReadTime] = useState('4 MIN');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const data = await api.getAnalytics();
      setAnalytics(data);
      
      const orders = await api.getAdminOrders();
      setAdminOrders(orders);

      const returnsList = await api.getAdminReturns();
      setAdminReturns(returnsList);

      const catalog = await api.getProducts();
      setProducts(catalog);

      const bannersList = await api.getBanners();
      setAdminBanners(bannersList);

      const blogsList = await api.getBlogs();
      setAdminBlogs(blogsList);

      const usersList = await api.getAdminUsers();
      setAdminUsers(usersList);
    } catch (err) {
      addToast('Failed to retrieve administrator telemetry data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAdminData();
    }
  }, [user]);

  if (authLoading || !user || user.role !== 'admin') {
    return (
      <div className="w-full bg-black min-h-[70vh] flex justify-center items-center">
        <SEO title="Restricted Area" />
        <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- ACTIONS ---

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const updated = await api.updateOrderStatus(orderId, newStatus);
      setAdminOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: updated.status } : o)));
      addToast('Order dispatch status updated.', 'success');
      
      // Refresh telemetry
      const data = await api.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      addToast('Failed to update status.', 'error');
    }
  };

  const handleUpdateReturnStatus = async (returnId, approvedStatus) => {
    try {
      const statusStr = approvedStatus ? 'Approved' : 'Rejected';
      await api.updateReturnStatus(returnId, statusStr);
      addToast(`Return request ${statusStr.toLowerCase()} successfully.`, 'success');
      fetchAdminData();
    } catch (err) {
      addToast('Failed to update return request.', 'error');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newTitle || !newPrice || !newDescription) {
      addToast('Please enter title, price, and description.', 'error');
      return;
    }

    try {
      const generatedSku = newSku || `CS-${Date.now()}`;
      const parsedPrice = parseFloat(newPrice);
      const payload = {
        title: newTitle.toUpperCase(),
        price: parsedPrice,
        sku: generatedSku,
        category: newCategory,
        subcategory: newSubcategory,
        collectionName: newCollectionName,
        color: newColor,
        description: newDescription,
        image: newImage,
        images: [newImage],
        colors: [{ name: newColor, value: newColor === 'Black' ? '#0A0A0A' : '#FFFFFF', class: newColor === 'Black' ? 'bg-black border-neutral-900' : 'bg-white border-neutral-300' }],
        sizes: newSizes,
        specs: newSpecs ? newSpecs.split('\n').filter(Boolean) : ['100% Cotton combed ringspun'],
        highlights: ['Studio exclusive drop'],
        availability: 'in-stock',
        tag: 'NEW',
        fabric: newFabric,
        material: newMaterial,
        fitType: newFitType,
        sleeveType: newSleeveType,
        neckType: newNeckType,
        pattern: newPattern,
        occasion: newOccasion,
        washCare: newWashCare,
        countryOfOrigin: newCountryOfOrigin,
        packageContents: newPackageContents,
        seoTitle: newSeoTitle || newTitle,
        seoDescription: newSeoDescription || newDescription,
        inventory: parseInt(newInventory) || 100,
        variants: newSizes.map(sz => ({
          sku: `${generatedSku}-${sz}`,
          size: sz,
          color: newColor,
          price: parsedPrice,
          inventory: 25,
          images: [newImage]
        }))
      };

      await api.createProduct(payload);
      addToast('Product inserted in catalog.', 'success');
      
      // Reset
      setNewTitle('');
      setNewPrice('');
      setNewDescription('');
      setNewSpecs('');
      setNewSku('');
      setNewSeoTitle('');
      setNewSeoDescription('');
      
      // Refresh
      const catalog = await api.getProducts();
      setProducts(catalog);
    } catch (err) {
      addToast('Failed to insert product.', 'error');
    }
  };

  const handleDeleteProduct = async (productMongoId) => {
    if (!window.confirm('Delete this product from catalog?')) return;
    try {
      await api.deleteProduct(productMongoId);
      addToast('Product removed.', 'success');
      setProducts((prev) => prev.filter((p) => p._id !== productMongoId));
    } catch (err) {
      addToast('Failed to delete product.', 'error');
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!newCouponCode || !newDiscountPercent) return;
    try {
      await api.createCoupon(newCouponCode, newDiscountPercent);
      addToast('Promo coupon voucher created.', 'success');
      setNewCouponCode('');
      setNewDiscountPercent('');
      
      fetchAdminData();
    } catch (err) {
      addToast('Failed to create coupon.', 'error');
    }
  };

  const handleAddBanner = async (e) => {
    e.preventDefault();
    if (!newBannerTitle || !newBannerSubtitle || !newBannerImage) return;
    try {
      await api.createBanner({
        title: newBannerTitle.toUpperCase(),
        subtitle: newBannerSubtitle,
        image: newBannerImage,
        link: newBannerLink
      });
      addToast('Banner added successfully!', 'success');
      setNewBannerTitle('');
      setNewBannerSubtitle('');
      
      fetchAdminData();
    } catch (err) {
      addToast('Failed to create banner.', 'error');
    }
  };

  const handleDeleteBanner = async (bannerId) => {
    if (!window.confirm('Delete this banner slide?')) return;
    try {
      await api.deleteBanner(bannerId);
      addToast('Banner deleted.', 'success');
      fetchAdminData();
    } catch (err) {
      addToast('Failed to delete banner.', 'error');
    }
  };

  const handleAddBlog = async (e) => {
    e.preventDefault();
    if (!newBlogTitle || !newBlogExcerpt || !newBlogContent) return;
    try {
      await api.createBlog({
        title: newBlogTitle.toUpperCase(),
        category: newBlogCategory,
        image: newBlogImage,
        excerpt: newBlogExcerpt,
        content: newBlogContent,
        slug: newBlogTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        tags: newBlogTags.split(',').map(t => t.trim()),
        readTime: newBlogReadTime
      });
      addToast('Blog editorial article posted.', 'success');
      setNewBlogTitle('');
      setNewBlogExcerpt('');
      setNewBlogContent('');
      
      fetchAdminData();
    } catch (err) {
      addToast('Failed to post blog article.', 'error');
    }
  };

  const handleDeleteBlog = async (blogId) => {
    if (!window.confirm('Delete this blog post?')) return;
    try {
      await api.deleteBlog(blogId);
      addToast('Blog article deleted.', 'success');
      fetchAdminData();
    } catch (err) {
      addToast('Failed to delete article.', 'error');
    }
  };

  const handleUpdateUserRole = async (userId, role) => {
    try {
      await api.updateUserRole(userId, role);
      addToast('User role updated.', 'success');
      fetchAdminData();
    } catch (err) {
      addToast('Failed to modify user role.', 'error');
    }
  };

  return (
    <div className="w-full bg-black min-h-screen py-16 text-white select-none">
      <SEO title="Studio Administration" />

      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header Block */}
        <div className="border-b border-neutral-900 pb-6 mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <span className="text-[10px] text-brand-red font-black tracking-widest uppercase block mb-1">
              TELEMETRY OPERATIONS
            </span>
            <h1 className="text-white text-5xl font-black font-impact tracking-tight uppercase">
              STUDIO CONTROL PANEL
            </h1>
          </div>
          <span className="text-neutral-500 text-xs font-bold uppercase tracking-wider">
            ADMIN: <span className="text-white font-black">{user.name.toUpperCase()}</span>
          </span>
        </div>

        {/* Admin Navigation Options */}
        <div className="flex border-b border-neutral-900 overflow-x-auto gap-2 mb-12 scrollbar-none">
          {[
            { id: 'analytics', name: 'ANALYTICS KPIs', icon: BarChart3 },
            { id: 'orders', name: 'ORDERS', icon: ShoppingBag },
            { id: 'returns', name: 'RETURNS', icon: RefreshCw },
            { id: 'products', name: 'CATALOG', icon: FolderKanban },
            { id: 'coupons', name: 'VOUCHERS', icon: Ticket },
            { id: 'banners', name: 'BANNERS CMS', icon: Image },
            { id: 'blogs', name: 'BLOGS CMS', icon: FileText },
            { id: 'users', name: 'ROLE MANAGER', icon: Users }
          ].map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-5 text-[10px] font-black tracking-widest uppercase transition-all border-b shrink-0 cursor-pointer flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'text-white border-brand-red'
                    : 'text-neutral-500 border-transparent hover:text-neutral-300'
                }`}
              >
                <TabIcon size={12} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin mx-auto my-24"></div>
        ) : (
          <div className="animate-fade-in">
            
            {/* TAB: ANALYTICS KPIs */}
            {activeTab === 'analytics' && analytics && (
              <div className="space-y-12 animate-fade-in">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'GROSS REVENUE', value: `₹${analytics.kpis.revenue.toFixed(2)}` },
                    { label: 'TOTAL ORDERS', value: analytics.kpis.ordersCount },
                    { label: 'MEMBERS INDEX', value: analytics.kpis.usersCount },
                    { label: 'CONVERSION RATIO', value: analytics.kpis.conversionRate }
                  ].map((card, idx) => (
                    <div key={idx} className="bg-neutral-950/20 p-6 rounded-luxury shadow-luxury border border-neutral-900/40">
                      <span className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase block mb-1">
                        {card.label}
                      </span>
                      <span className="text-white text-3xl font-black font-impact tracking-tight uppercase">
                        {card.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* SVG Visual Sales bar chart */}
                <div className="bg-neutral-950/20 p-8 rounded-luxury border border-neutral-900/40 space-y-6">
                  <h3 className="text-white font-black text-xs tracking-widest uppercase flex items-center gap-2">
                    <span className="w-1 h-3 bg-brand-red inline-block" />
                    SALES DISTRIBUTION BY CATEGORY
                  </h3>

                  {analytics.categoryChart.length > 0 ? (
                    <div className="space-y-4 pt-4 max-w-xl">
                      {analytics.categoryChart.map((bar) => {
                        const totalSalesVal = analytics.categoryChart.reduce((sum, item) => sum + item.value, 0) || 1;
                        const pct = ((bar.value / totalSalesVal) * 100).toFixed(0);

                        return (
                          <div key={bar.name} className="space-y-1.5 uppercase text-[10px] font-bold tracking-widest text-neutral-400">
                            <div className="flex justify-between">
                              <span className="text-white">{bar.name}</span>
                              <span>₹{bar.value.toFixed(2)} ({pct}%)</span>
                            </div>
                            <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-brand-red rounded-full transition-all duration-1000"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest py-6">
                      NO SALES REGISTERED YET TO CALCULATE DISTRIBUTION.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB: ORDER REGISTRY MANAGEMENT */}
            {activeTab === 'orders' && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-white font-black text-xs tracking-widest uppercase border-b border-neutral-900 pb-2 mb-6">
                  GLOBAL DISPATCH MANAGER
                </h3>

                {adminOrders.length > 0 ? (
                  <div className="space-y-4">
                    {adminOrders.map((ord) => (
                      <div 
                        key={ord._id} 
                        className="bg-neutral-950/20 border border-neutral-900/40 p-6 rounded-luxury flex flex-col lg:flex-row justify-between gap-6"
                      >
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-4 text-[10px] font-bold tracking-widest uppercase text-neutral-500">
                            <div>ORDER: <span className="text-white">{ord.id}</span></div>
                            <div>DATE: <span className="text-white">{ord.date}</span></div>
                            <div>USER: <span className="text-white">{ord.userEmail}</span></div>
                            <div>TOTAL: <span className="text-white">₹{ord.total.toFixed(2)}</span></div>
                          </div>

                          {/* Items list */}
                          <div className="space-y-2 pl-4 border-l border-neutral-900">
                            {ord.items.map((item, idx) => (
                              <p key={idx} className="text-[10px] font-semibold text-neutral-400 uppercase">
                                {item.title} (x{item.quantity}) • SIZE: {item.size}
                              </p>
                            ))}
                          </div>
                        </div>

                        {/* Dispatch Actions Selector */}
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-[9px] font-bold tracking-widest uppercase text-neutral-500">
                            DISPATCH PIPELINE STATUS:
                          </div>
                          <select
                            value={ord.status}
                            onChange={(e) => handleUpdateStatus(ord._id, e.target.value)}
                            className="bg-black border border-neutral-900 text-xs font-semibold tracking-wider p-2 rounded-full text-white cursor-pointer uppercase"
                          >
                            <option value="Placed">PLACED</option>
                            <option value="Processing">PROCESSING</option>
                            <option value="Shipped">SHIPPED</option>
                            <option value="Delivered">DELIVERED</option>
                            <option value="Cancelled">CANCELLED</option>
                            <option value="Return Requested">RETURN REQUESTED</option>
                            <option value="Refunded">REFUNDED</option>
                            <option value="Return Rejected">RETURN REJECTED</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider py-8 text-center border border-dashed border-neutral-900">
                    No orders placed yet.
                  </p>
                )}
              </div>
            )}

            {/* TAB: RETURNS MANAGER */}
            {activeTab === 'returns' && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-white font-black text-xs tracking-widest uppercase border-b border-neutral-900 pb-2 mb-6">
                  RETURN & REFUNDS VERIFIER
                </h3>

                {adminReturns.length > 0 ? (
                  <div className="space-y-4">
                    {adminReturns.map((ret) => (
                      <div 
                        key={ret._id} 
                        className="bg-neutral-950/20 border border-neutral-900/40 p-6 rounded-luxury flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
                      >
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-4 text-[10px] font-bold tracking-widest uppercase text-neutral-500">
                            <div>ORDER ID: <span className="text-white">{ret.orderId}</span></div>
                            <div>USER: <span className="text-white">{ret.userEmail}</span></div>
                            <div>REFUND AMOUNT: <span className="text-white">₹{ret.refundAmount.toFixed(2)}</span></div>
                            <div>STATUS:{' '}
                              <span className={ret.status === 'Approved' ? 'text-green-500' : ret.status === 'Rejected' ? 'text-brand-red' : 'text-yellow-500'}>
                                {ret.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <p className="text-neutral-400 text-xs font-semibold uppercase">REASON: {ret.reason}</p>
                          <div className="pl-4 border-l border-neutral-900 text-[10px] text-neutral-500 space-y-1 uppercase font-semibold">
                            {ret.items.map((i, idx) => <p key={idx}>{i.title} (x{i.quantity}) - SIZE: {i.size}</p>)}
                          </div>
                        </div>

                        {ret.status === 'Pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateReturnStatus(ret._id, true)}
                              className="bg-green-900/30 hover:bg-green-700 border border-green-800 text-green-400 hover:text-white text-[9px] font-black tracking-widest px-4 py-2 rounded-full uppercase transition cursor-pointer flex items-center gap-1.5"
                            >
                              <Check size={10} /> APPROVE
                            </button>
                            <button
                              onClick={() => handleUpdateReturnStatus(ret._id, false)}
                              className="bg-red-950/30 hover:bg-brand-red border border-red-900 text-brand-red hover:text-white text-[9px] font-black tracking-widest px-4 py-2 rounded-full uppercase transition cursor-pointer flex items-center gap-1.5"
                            >
                              <X size={10} /> REJECT
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider py-8 text-center border border-dashed border-neutral-900">
                    No return request submissions.
                  </p>
                )}
              </div>
            )}

            {/* TAB: PRODUCT CATALOG */}
            {activeTab === 'products' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
                
                {/* Catalog Creator Form */}
                <form onSubmit={handleAddProduct} className="lg:col-span-4 bg-[#050507]/40 border border-neutral-900 p-6 rounded-luxury space-y-4">
                  <h3 className="text-white font-black text-xs tracking-widest uppercase border-b border-neutral-900 pb-2 mb-4">
                    INSERT PRODUCT
                  </h3>

                  <div>
                    <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">PRODUCT NAME</label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="bg-black border border-neutral-900 rounded-full focus:border-neutral-550 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-2.5 px-4 transition uppercase"
                      placeholder="COSOSTYLE CLASSIC T-SHIRT"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">PRICE (INR)</label>
                      <input
                        type="number"
                        required
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="bg-black border border-neutral-900 rounded-full focus:border-neutral-550 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-2.5 px-4 transition uppercase"
                        placeholder="399"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">COLOR</label>
                      <input
                        type="text"
                        required
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        className="bg-black border border-neutral-900 rounded-full focus:border-neutral-550 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-2.5 px-4 transition uppercase"
                        placeholder="Black"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">CATEGORY</label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="bg-black border border-neutral-900 rounded-full focus:border-neutral-550 text-white text-xs font-semibold tracking-wider outline-none w-full p-2.5 px-4 cursor-pointer transition uppercase"
                      >
                        <option value="classic">CLASSIC CUTS</option>
                        <option value="graphic">GRAPHIC TEES</option>
                        <option value="oversized">OVERSIZED DROPS</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">LOCAL ASSET IMAGE</label>
                      <input
                        type="text"
                        value={newImage}
                        onChange={(e) => setNewImage(e.target.value)}
                        className="bg-black border border-neutral-900 rounded-full focus:border-neutral-550 text-white text-xs font-semibold tracking-wider outline-none w-full p-2.5 px-4 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">DESCRIPTION</label>
                    <textarea
                      required
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      rows={3}
                      className="bg-black border border-neutral-900 rounded-luxury focus:border-neutral-550 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 transition resize-none uppercase"
                      placeholder="ENTER HIGH-DENSITY FABRIC DETAILS..."
                    />
                  </div>

                  {/* Advanced toggle button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="text-[9px] font-black text-brand-red tracking-widest uppercase hover:underline cursor-pointer"
                    >
                      {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
                    </button>
                  </div>

                  {showAdvanced && (
                    <div className="space-y-3 pt-3 border-t border-neutral-900 text-left">
                      <div>
                        <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">SKU</label>
                        <input
                          type="text"
                          value={newSku}
                          onChange={(e) => setNewSku(e.target.value)}
                          className="bg-black border border-neutral-900 rounded-full focus:border-neutral-550 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-2.5 px-4 transition uppercase"
                          placeholder="E.G. CS-POLO-PINK"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">SUBCATEGORY</label>
                          <input
                            type="text"
                            value={newSubcategory}
                            onChange={(e) => setNewSubcategory(e.target.value)}
                            className="bg-black border border-neutral-900 rounded-full focus:border-neutral-550 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-2.5 px-4 transition uppercase"
                            placeholder="polos / crews"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">COLLECTION</label>
                          <input
                            type="text"
                            value={newCollectionName}
                            onChange={(e) => setNewCollectionName(e.target.value)}
                            className="bg-black border border-neutral-900 rounded-full focus:border-neutral-550 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-2.5 px-4 transition uppercase"
                            placeholder="Summer Polo Series"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">FABRIC</label>
                          <input
                            type="text"
                            value={newFabric}
                            onChange={(e) => setNewFabric(e.target.value)}
                            className="bg-black border border-neutral-900 rounded-full focus:border-neutral-550 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-2.5 px-4 transition uppercase"
                            placeholder="100% Pique Cotton"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">FIT TYPE</label>
                          <input
                            type="text"
                            value={newFitType}
                            onChange={(e) => setNewFitType(e.target.value)}
                            className="bg-black border border-neutral-900 rounded-full focus:border-neutral-550 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-2.5 px-4 transition uppercase"
                            placeholder="Regular Fit"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">NECK TYPE</label>
                          <input
                            type="text"
                            value={newNeckType}
                            onChange={(e) => setNewNeckType(e.target.value)}
                            className="bg-black border border-neutral-900 rounded-full focus:border-neutral-550 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-2.5 px-4 transition uppercase"
                            placeholder="Polo Neck"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">SLEEVE TYPE</label>
                          <input
                            type="text"
                            value={newSleeveType}
                            onChange={(e) => setNewSleeveType(e.target.value)}
                            className="bg-black border border-neutral-900 rounded-full focus:border-neutral-550 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-2.5 px-4 transition uppercase"
                            placeholder="Half Sleeve"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">COUNTRY</label>
                          <input
                            type="text"
                            value={newCountryOfOrigin}
                            onChange={(e) => setNewCountryOfOrigin(e.target.value)}
                            className="bg-black border border-neutral-900 rounded-full focus:border-neutral-550 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-2.5 px-4 transition uppercase"
                            placeholder="India"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">TOTAL STOCK</label>
                          <input
                            type="number"
                            value={newInventory}
                            onChange={(e) => setNewInventory(e.target.value)}
                            className="bg-black border border-neutral-900 rounded-full focus:border-neutral-550 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-2.5 px-4 transition uppercase"
                            placeholder="100"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">SEO TITLE</label>
                        <input
                          type="text"
                          value={newSeoTitle}
                          onChange={(e) => setNewSeoTitle(e.target.value)}
                          className="bg-black border border-neutral-900 rounded-full focus:border-neutral-550 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-2.5 px-4 transition uppercase"
                          placeholder="Buy Cosostyle..."
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-brand-red hover:bg-red-700 text-white font-black text-xs tracking-widest py-3.5 uppercase transition duration-300 rounded-full cursor-pointer shadow-md"
                  >
                    ADD PRODUCT TO STORE
                  </button>
                </form>

                {/* Catalog Listing Column */}
                <div className="lg:col-span-8 space-y-4">
                  <h3 className="text-white font-black text-xs tracking-widest uppercase border-b border-neutral-950 pb-2 mb-4">
                    CATALOG REGISTRY ({products.length})
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[75vh] overflow-y-auto pr-1 border border-neutral-900/60 p-4 rounded-luxury bg-neutral-950/20">
                    {products.map((p) => (
                      <div key={p._id} className="p-4 bg-black border border-neutral-900 rounded-luxury flex gap-4">
                        <div className="w-16 aspect-[3/4] bg-neutral-950 rounded-luxury overflow-hidden border border-neutral-900 shrink-0">
                          <img src={p.image} className="w-full h-full object-cover object-top" alt="" />
                        </div>
                        <div className="flex-grow flex flex-col justify-between">
                          <div>
                            <span className="text-[8px] font-black text-brand-red tracking-widest uppercase">{p.category} STYLE</span>
                            <h4 className="text-white font-bold text-xs uppercase line-clamp-1 mt-0.5">{p.title}</h4>
                            <p className="text-white font-bold text-xs mt-1">₹{p.price.toFixed(2)}</p>
                          </div>
                          
                          <button
                            onClick={() => handleDeleteProduct(p._id)}
                            className="bg-neutral-950 hover:bg-neutral-900 border border-neutral-900 hover:border-brand-red text-neutral-500 hover:text-brand-red text-[8px] font-black tracking-widest px-3 py-1.5 rounded-full uppercase transition w-max cursor-pointer"
                          >
                            DELETE Product
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* TAB: PROMO VOUCHERS */}
            {activeTab === 'coupons' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
                
                {/* Coupon Creator */}
                <form onSubmit={handleCreateCoupon} className="lg:col-span-4 bg-[#050507]/40 border border-neutral-900 p-6 rounded-luxury space-y-4">
                  <h3 className="text-white font-black text-xs tracking-widest uppercase border-b border-neutral-900 pb-2 mb-4">
                    CREATE PROMO VOUCHER
                  </h3>

                  <div>
                    <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">PROMO CODE</label>
                    <input
                      type="text"
                      required
                      value={newCouponCode}
                      onChange={(e) => setNewCouponCode(e.target.value)}
                      className="bg-black border border-neutral-900 rounded-full focus:border-neutral-550 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-2.5 px-4 transition uppercase"
                      placeholder="COSO50"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">DISCOUNT PERCENTAGE</label>
                    <input
                      type="number"
                      required
                      value={newDiscountPercent}
                      onChange={(e) => setNewDiscountPercent(e.target.value)}
                      className="bg-black border border-neutral-900 rounded-full focus:border-neutral-550 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-2.5 px-4 transition uppercase"
                      placeholder="50"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-brand-red hover:bg-red-700 text-white font-black text-xs tracking-widest py-3.5 uppercase transition duration-300 rounded-full cursor-pointer shadow-md"
                  >
                    ADD VOUCHER
                  </button>
                </form>

                {/* Vouchers list */}
                <div className="lg:col-span-8 space-y-4">
                  <h3 className="text-white font-black text-xs tracking-widest uppercase border-b border-neutral-950 pb-2 mb-4">
                    VOUCHERS IN CIRCULATION
                  </h3>
                  
                  {analytics.kpis && (
                    <div className="p-4 bg-neutral-950/20 border border-neutral-900/40 rounded-luxury">
                      <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Active Coupons loaded correctly in DB. Ready for Checkout verification.</p>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB: BANNERS CMS */}
            {activeTab === 'banners' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
                
                {/* Banner Creator Form */}
                <form onSubmit={handleAddBanner} className="lg:col-span-4 bg-[#050507]/40 border border-neutral-900 p-6 rounded-luxury space-y-4">
                  <h3 className="text-white font-black text-xs tracking-widest uppercase border-b border-neutral-900 pb-2 mb-4">
                    INSERT HOME BANNER
                  </h3>

                  <div>
                    <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">BANNER TITLE</label>
                    <input
                      type="text"
                      required
                      value={newBannerTitle}
                      onChange={(e) => setNewBannerTitle(e.target.value)}
                      className="bg-black border border-neutral-900 rounded-full focus:border-neutral-550 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-2.5 px-4 transition uppercase"
                      placeholder="PURE COTTON. PURE INTENT."
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">BANNER SUBTITLE</label>
                    <input
                      type="text"
                      required
                      value={newBannerSubtitle}
                      onChange={(e) => setNewBannerSubtitle(e.target.value)}
                      className="bg-black border border-neutral-900 rounded-full focus:border-neutral-550 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-2.5 px-4 transition uppercase"
                      placeholder="Heavyweight organic cotton drops with zero compromises."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">IMAGE PATH/URL</label>
                      <input
                        type="text"
                        required
                        value={newBannerImage}
                        onChange={(e) => setNewBannerImage(e.target.value)}
                        className="bg-black border border-neutral-900 rounded-full focus:border-neutral-550 text-white text-xs font-semibold tracking-wider outline-none w-full p-2.5 px-4 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">LINK PATH</label>
                      <input
                        type="text"
                        required
                        value={newBannerLink}
                        onChange={(e) => setNewBannerLink(e.target.value)}
                        className="bg-black border border-neutral-900 rounded-full focus:border-neutral-550 text-white text-xs font-semibold tracking-wider outline-none w-full p-2.5 px-4 transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-brand-red hover:bg-red-700 text-white font-black text-xs tracking-widest py-3.5 uppercase transition duration-300 rounded-full cursor-pointer shadow-md"
                  >
                    PUBLISH BANNER
                  </button>
                </form>

                {/* Banner list */}
                <div className="lg:col-span-8 space-y-4">
                  <h3 className="text-white font-black text-xs tracking-widest uppercase border-b border-neutral-950 pb-2 mb-4">
                    ACTIVE BANNERS IN DISPLAY ({adminBanners.length})
                  </h3>

                  <div className="space-y-3">
                    {adminBanners.map((b) => (
                      <div key={b._id} className="p-4 bg-[#0A0A0C] border border-neutral-900 rounded-luxury flex justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-12 bg-neutral-950 border border-neutral-900 overflow-hidden shrink-0">
                            <img src={b.image} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white uppercase">{b.title}</h4>
                            <p className="text-[9px] text-neutral-500 uppercase mt-0.5">{b.subtitle}</p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleDeleteBanner(b._id)}
                          className="text-neutral-500 hover:text-brand-red p-2 transition cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* TAB: BLOGS CMS */}
            {activeTab === 'blogs' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
                
                {/* Blog Editor */}
                <form onSubmit={handleAddBlog} className="lg:col-span-5 bg-[#050507]/40 border border-neutral-900 p-6 rounded-luxury space-y-4 max-h-[85vh] overflow-y-auto pr-1">
                  <h3 className="text-white font-black text-xs tracking-widest uppercase border-b border-neutral-900 pb-2 mb-4">
                    POST EDITORIAL ARTICLE
                  </h3>

                  <div>
                    <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">ARTICLE TITLE</label>
                    <input
                      type="text"
                      required
                      value={newBlogTitle}
                      onChange={(e) => setNewBlogTitle(e.target.value)}
                      className="bg-black border border-neutral-900 rounded-full focus:border-neutral-550 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-2.5 px-4 transition uppercase"
                      placeholder="THE ART OF DRAPING COTTON"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">CATEGORY</label>
                      <input
                        type="text"
                        required
                        value={newBlogCategory}
                        onChange={(e) => setNewBlogCategory(e.target.value)}
                        className="bg-black border border-neutral-900 rounded-full focus:border-neutral-550 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-2.5 px-4 transition uppercase"
                        placeholder="STUDIO NEWS"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">IMAGE PATH</label>
                      <input
                        type="text"
                        required
                        value={newBlogImage}
                        onChange={(e) => setNewBlogImage(e.target.value)}
                        className="bg-black border border-neutral-900 rounded-full focus:border-neutral-550 text-white text-xs font-semibold tracking-wider outline-none w-full p-2.5 px-4 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">TAGS (COMMA SEPARATED)</label>
                      <input
                        type="text"
                        value={newBlogTags}
                        onChange={(e) => setNewBlogTags(e.target.value)}
                        className="bg-black border border-neutral-900 rounded-full focus:border-neutral-550 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-2.5 px-4 transition uppercase"
                        placeholder="FABRIC, STREETWEAR"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">READ TIME</label>
                      <input
                        type="text"
                        value={newBlogReadTime}
                        onChange={(e) => setNewBlogReadTime(e.target.value)}
                        className="bg-black border border-neutral-900 rounded-full focus:border-neutral-550 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-2.5 px-4 transition uppercase"
                        placeholder="4 MIN"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">EXCERPT (SHORT INTRO)</label>
                    <textarea
                      required
                      value={newBlogExcerpt}
                      onChange={(e) => setNewBlogExcerpt(e.target.value)}
                      rows={2}
                      className="bg-black border border-neutral-900 rounded-luxury focus:border-neutral-550 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 transition resize-none uppercase"
                      placeholder="ENTER INTRODUCTORY EXCERPT..."
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">CONTENT BODY</label>
                    <textarea
                      required
                      value={newBlogContent}
                      onChange={(e) => setNewBlogContent(e.target.value)}
                      rows={6}
                      className="bg-black border border-neutral-900 rounded-luxury focus:border-neutral-550 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 transition resize-none"
                      placeholder="ENTER FULL CONTENT PARAGRAPHS..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-brand-red hover:bg-red-700 text-white font-black text-xs tracking-widest py-3.5 uppercase transition duration-300 rounded-full cursor-pointer shadow-md"
                  >
                    PUBLISH ARTICLE
                  </button>
                </form>

                {/* Articles Listing */}
                <div className="lg:col-span-7 space-y-4">
                  <h3 className="text-white font-black text-xs tracking-widest uppercase border-b border-neutral-950 pb-2 mb-4">
                    PUBLISHED ARTICLES ({adminBlogs.length})
                  </h3>

                  <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-1">
                    {adminBlogs.map((blg) => (
                      <div key={blg._id} className="p-4 bg-[#0A0A0C] border border-neutral-900 rounded-luxury flex justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 aspect-video bg-neutral-950 border border-neutral-900 overflow-hidden shrink-0">
                            <img src={blg.image} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white uppercase line-clamp-1">{blg.title}</h4>
                            <p className="text-[8px] font-bold text-neutral-500 uppercase mt-0.5">{blg.category} • {blg.date}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteBlog(blg._id)}
                          className="text-neutral-500 hover:text-brand-red p-2 transition cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* TAB: ROLE MANAGER */}
            {activeTab === 'users' && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-white font-black text-xs tracking-widest uppercase border-b border-neutral-900 pb-2 mb-6">
                  STUDIO USERS & CREDENTIALS
                </h3>

                <div className="overflow-x-auto bg-neutral-950/20 border border-neutral-900/40 rounded-luxury p-6">
                  <table className="w-full text-left text-xs uppercase tracking-wider border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-900 text-[10px] text-neutral-500 font-bold">
                        <th className="py-3 pr-4">NAME</th>
                        <th className="py-3 px-4">EMAIL</th>
                        <th className="py-3 px-4 text-center">ROLE</th>
                        <th className="py-3 pl-4 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900 font-semibold text-neutral-300">
                      {adminUsers.map((u) => (
                        <tr key={u._id} className="hover:bg-neutral-900/20">
                          <td className="py-3 pr-4 font-bold text-white">{u.name}</td>
                          <td className="py-3 px-4 text-neutral-400 lowercase">{u.email}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest ${
                              u.role === 'admin' ? 'bg-brand-red/10 text-brand-red' : 'bg-neutral-900 text-neutral-500'
                            }`}>
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 pl-4 text-right">
                            {u.email !== 'admin@cosostyle.com' && (
                              <select
                                value={u.role}
                                onChange={(e) => handleUpdateUserRole(u._id, e.target.value)}
                                className="bg-black border border-neutral-900 text-[9px] font-black p-2 rounded-full cursor-pointer uppercase text-white"
                              >
                                <option value="user">USER</option>
                                <option value="admin">ADMIN</option>
                              </select>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
