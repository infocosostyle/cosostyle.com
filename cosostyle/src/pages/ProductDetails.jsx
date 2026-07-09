import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, ChevronDown, ChevronUp, Star, ZoomIn, Info, X, Sparkles } from 'lucide-react';
import { useCart, useWishlist, useRecentlyViewed, useToasts } from '../context/AppContext';
import { api } from '../lib/api';
import SEO from '../components/SEO';

export default function ProductDetails() {
  const { id } = useParams();
  const productId = parseInt(id);

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToRecentlyViewed, recentlyViewed } = useRecentlyViewed();
  const { addToast } = useToasts();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeAccordion, setActiveAccordion] = useState(0); // 0: Details, 1: Specs, 2: Care, 3: Shipping
  const [zoomLevel, setZoomLevel] = useState(false);
  const [zoomCoords, setZoomCoords] = useState({ x: 0, y: 0 });

  // Extended states
  const [activeVariant, setActiveVariant] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [frequentlyBought, setFrequentlyBought] = useState(null);
  const [isCompared, setIsCompared] = useState(false);

  // Size Guide & Pincode states
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState('');

  // AI Size Finder States
  const [isAiSizeOpen, setIsAiSizeOpen] = useState(false);
  const [userHeight, setUserHeight] = useState('');
  const [userWeight, setUserWeight] = useState('');
  const [suggestedSize, setSuggestedSize] = useState('');

  // Reviews states
  const [reviews, setReviews] = useState([]);
  const [newReviewUser, setNewReviewUser] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    async function loadProductDetails() {
      try {
        setLoading(true);
        const data = await api.getProduct(productId);
        setProduct(data);
        addToRecentlyViewed(data);

        // Fetch reviews
        const commentList = await api.getReviews(productId);
        setReviews(commentList);

        // Fetch related and bundle products
        const allProds = await api.getProducts();
        const related = allProds
          .filter((p) => p.category === data.category && p.id !== data.id)
          .slice(0, 3);
        setRelatedProducts(related);

        const bundle = allProds.find((p) => p.id !== data.id);
        setFrequentlyBought(bundle || null);
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProductDetails();
  }, [productId]);

  // Sync variant size selection
  useEffect(() => {
    if (product && selectedSize) {
      const variant = (product.variants || []).find(v => v.size === selectedSize);
      setActiveVariant(variant || null);
      if (variant && variant.images && variant.images.length > 0) {
        const imgIdx = product.images.findIndex(img => img === variant.images[0]);
        if (imgIdx !== -1) {
          setActiveImageIdx(imgIdx);
        }
      }
    } else {
      setActiveVariant(null);
    }
  }, [selectedSize, product]);

  // Sync compare status
  useEffect(() => {
    const list = JSON.parse(localStorage.getItem('coso_compare_list') || '[]');
    setIsCompared(list.includes(productId));
  }, [productId]);

  const handleToggleCompare = () => {
    let list = JSON.parse(localStorage.getItem('coso_compare_list') || '[]');
    if (list.includes(productId)) {
      list = list.filter(cid => cid !== productId);
      setIsCompared(false);
      addToast('Removed from comparison list.', 'info');
    } else {
      if (list.length >= 3) {
        addToast('You can compare a maximum of 3 products.', 'error');
        return;
      }
      list.push(productId);
      setIsCompared(true);
      addToast('Added to comparison list. Drawer will appear at the bottom.', 'success');
    }
    localStorage.setItem('coso_compare_list', JSON.stringify(list));
    window.dispatchEvent(new Event('coso_compare_update'));
  };

  const currentPrice = activeVariant ? activeVariant.price : (product ? product.price : 0);
  const currentInventory = activeVariant ? activeVariant.inventory : (product ? product.inventory : 0);
  const isOutOfStock = selectedSize && currentInventory === 0;

  const handleAddBundleToCart = () => {
    if (!selectedSize) {
      addToast('Please select a size for the main product first', 'error');
      return;
    }
    // Add main with active variant price adjustments
    addToCart({ ...product, price: currentPrice }, selectedSize, product.color, 1);
    
    // Add bundle item
    const bundleSize = frequentlyBought.sizes[0] || 'M';
    const bundlePrice = frequentlyBought.price * 0.85; // 15% discount
    addToCart({ ...frequentlyBought, price: bundlePrice }, bundleSize, frequentlyBought.color, 1);
    addToast('Bundle added to bag with 15% discount!', 'success');
  };

  const calculateAiSize = () => {
    const h = parseFloat(userHeight);
    const w = parseFloat(userWeight);
    if (!h || !w) {
      addToast('Please enter both height and weight.', 'error');
      return;
    }
    
    let computedSize;
    if (h < 170) {
      computedSize = w < 60 ? 'S' : 'M';
    } else if (h >= 170 && h < 180) {
      computedSize = w < 72 ? 'M' : 'L';
    } else {
      computedSize = w < 85 ? 'L' : 'XL';
    }

    if (product && !product.sizes.includes(computedSize)) {
      computedSize = product.sizes[0] || 'M';
    }
    setSuggestedSize(computedSize);
    addToast(`AI Recommended size calculated: ${computedSize}`, 'info');
  };

  if (loading) {
    return (
      <div className="w-full bg-black min-h-[70vh] flex justify-center items-center">
        <SEO title="Loading Product" />
        <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="w-full bg-black min-h-[70vh] flex flex-col justify-center items-center text-center px-4">
        <SEO title="Product Not Found" />
        <h2 className="text-white font-black font-impact tracking-widest text-3xl uppercase mb-4">
          PRODUCT NOT FOUND
        </h2>
        <p className="text-neutral-500 text-xs tracking-wider mb-8 max-w-xs">
          The item you are searching for does not exist in our store catalog.
        </p>
        <Link 
          to="/shop" 
          className="bg-brand-red hover:bg-red-700 text-white font-black text-xs tracking-widest px-8 py-3.5 uppercase transition rounded-full"
        >
          SHOP THE DROP
        </Link>
      </div>
    );
  }

  const toggleAccordion = (idx) => {
    setActiveAccordion(activeAccordion === idx ? null : idx);
  };

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomCoords({ x, y });
  };

  const handleCheckPincode = () => {
    if (pincode.length < 6) {
      setPincodeStatus('PLEASE ENTER A VALID 6-DIGIT PINCODE');
      return;
    }
    // Simulate check
    if (pincode.startsWith('11') || pincode.startsWith('40') || pincode.startsWith('56') || pincode.startsWith('60')) {
      setPincodeStatus('⚡ EXPRESS DELIVERABLE (IN 2-3 BUSINESS DAYS)');
    } else {
      setPincodeStatus('✓ STANDARD DELIVERABLE (IN 4-6 BUSINESS DAYS)');
    }
  };

  const handleAddReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newReviewUser || !newReviewComment) {
      addToast('Please fill out all fields.', 'error');
      return;
    }
    setSubmittingReview(true);
    try {
      const added = await api.addReview(product.id, {
        user: newReviewUser,
        rating: newReviewRating,
        comment: newReviewComment
      });
      setReviews((prev) => [added, ...prev]);
      setNewReviewUser('');
      setNewReviewComment('');
      setNewReviewRating(5);
      addToast('Review submitted successfully!', 'success');
    } catch (err) {
      addToast('Failed to submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleLikeReview = async (reviewMongoId) => {
    try {
      const updated = await api.likeReview(product.id, reviewMongoId);
      setReviews((prev) =>
        prev.map((r) => (r._id === reviewMongoId ? { ...r, likes: updated.likes, helpful: true } : r))
      );
      addToast('Review helpful vote recorded.', 'success');
    } catch (err) {
      // Ignored
    }
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "image": window.location.origin + product.image,
    "description": product.description,
    "sku": `COSO-${product.id}`,
    "offers": {
      "@type": "Offer",
      "priceCurrency": "INR",
      "price": product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.availability === 'in-stock' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "url": window.location.href
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": Math.max(1, reviews.length)
    }
  };

  return (
    <div className="w-full bg-black min-h-screen py-12 md:py-20 select-none">
      <SEO title={product.title} description={product.description} image={product.image} jsonLd={productSchema} />

      <div className="max-w-7xl mx-auto px-4">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-neutral-500 uppercase mb-8">
          <Link to="/" className="hover:text-white transition">HOME</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-white transition">SHOP</Link>
          <span>/</span>
          <span className="text-white">{product.title}</span>
        </div>

        {/* Split Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-24">
          
          {/* Left Media Stage Column */}
          <div className="lg:col-span-7 flex flex-col md:flex-row gap-4">
            
            {/* Vertical thumbnails */}
            <div className="flex md:flex-col gap-2 order-2 md:order-1 overflow-x-auto md:overflow-x-visible">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-16 h-20 md:w-20 md:h-24 bg-neutral-950 rounded-luxury overflow-hidden shrink-0 border transition-all cursor-pointer ${
                    idx === activeImageIdx ? 'border-brand-red' : 'border-transparent hover:border-neutral-700'
                  }`}
                >
                  <img src={img} className="w-full h-full object-cover object-top" alt="" />
                </button>
              ))}
            </div>

            {/* Main Stage with Zoom */}
            <div 
              className="flex-grow aspect-[3.2/4] bg-neutral-950 rounded-luxury overflow-hidden relative cursor-zoom-in order-1 md:order-2 shadow-luxury"
              onMouseEnter={() => setZoomLevel(true)}
              onMouseLeave={() => setZoomLevel(false)}
              onMouseMove={handleMouseMove}
            >
              <img 
                src={product.images[activeImageIdx]} 
                alt={product.title}
                className={`w-full h-full object-cover object-top transition-transform duration-100 ${
                  zoomLevel ? 'scale-[2.0]' : 'scale-100'
                }`}
                style={
                  zoomLevel 
                    ? { transformOrigin: `${zoomCoords.x}% ${zoomCoords.y}%` } 
                    : undefined
                }
              />
              {!zoomLevel && (
                <div className="absolute bottom-4 right-4 bg-black/50 border border-neutral-950 p-2.5 rounded-full text-white/80 pointer-events-none backdrop-blur-sm">
                  <ZoomIn size={14} />
                </div>
              )}
            </div>

          </div>

          {/* Right configurations column */}
          <div className="lg:col-span-5 flex flex-col justify-start">
            
            <div className="pb-6 mb-6 border-b border-neutral-950">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="bg-brand-red text-white text-[8px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase">
                  {product.tag}
                </span>
                <span className="text-[9px] text-neutral-500 font-bold tracking-widest uppercase">
                  {product.category} STYLE
                </span>
              </div>
              
              <h1 className="text-white text-3xl sm:text-4xl font-black font-impact tracking-tight uppercase leading-none mb-3">
                {product.title}
              </h1>

              <div className="flex items-center gap-6">
                <div className="text-2xl font-bold text-white">₹{currentPrice.toFixed(2)}</div>
                
                <div className="flex items-center gap-1.5 border border-neutral-950 px-3 py-1 bg-neutral-950/40 rounded-full">
                  <Star size={10} className="fill-brand-red text-brand-red" />
                  <span className="text-xs font-bold text-white">{product.rating}</span>
                  <span className="text-[9px] text-neutral-500 font-bold uppercase">
                    ({reviews.length} reviews)
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Stock Indicator Badge */}
            <div className="mb-6 flex gap-2">
              <span className={`px-4 py-1.5 border rounded-full text-[9px] font-black tracking-widest uppercase ${
                isOutOfStock
                  ? 'text-brand-red bg-brand-red/10 border-brand-red/20'
                  : currentInventory <= 5
                  ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
                  : 'text-green-500 bg-green-500/10 border-green-500/20'
              }`}>
                {isOutOfStock
                  ? 'OUT OF STOCK'
                  : currentInventory <= 5
                  ? `LOW STOCK: ONLY ${currentInventory} PIECES LEFT`
                  : 'IN STOCK - READY TO DISPATCH'}
              </span>
            </div>

            <p className="text-neutral-400 text-xs leading-relaxed tracking-wide mb-6">
              {product.description}
            </p>

            {/* AI Outfit Guide Recommendation */}
            <div className="mb-6 p-4 bg-neutral-950/20 border border-neutral-900/60 rounded-luxury space-y-2 text-left animate-fade-in select-none">
              <span className="text-[9px] text-green-400 font-black tracking-widest uppercase flex items-center gap-1.5">
                <Sparkles size={11} className="animate-pulse" />
                AI STYLING OUTFIT GUIDE
              </span>
              <p className="text-[10px] text-neutral-400 font-semibold leading-relaxed uppercase">
                {product.color === 'Pink' 
                  ? 'PAIR THIS PINK POLO NECK T-SHIRT WITH COSOSTYLE ONYX BLACK ROUND NECK TEE AS A LAYERED Streetwear STATEMENT.' 
                  : product.color === 'Sky Blue'
                  ? 'PAIR THIS SKY BLUE POLO SHIRT WITH LIGHT-WASH DISTRESSED DENIM OR CHINO PANTS FOR A CLEAN SUMMER RETRO LOOK.'
                  : `MATCH THIS ${product.color.toUpperCase()} TEE WITH CONTRAST CARGO SHORTS AND SNEAKERS FOR AN EFFORTLESS BOX DRAKE FIT.`}
              </p>
            </div>

            {/* Colors list */}
            <div className="mb-6">
              <span className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-2">
                Color: {product.color}
              </span>
              <div className="flex gap-2">
                {product.colors.map((c) => (
                  <div
                    key={c.name}
                    title={c.name}
                    className={`w-6 h-6 border rounded-full ${c.class} flex items-center justify-center p-0.5`}
                  >
                    <span className="w-full h-full rounded-full" style={{ backgroundColor: c.value }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Size list */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase">
                  SELECT SIZE
                </span>
                <div className="flex gap-4">
                  <button
                    onClick={() => setIsAiSizeOpen(true)}
                    className="text-[9px] font-black text-green-400 hover:underline tracking-widest uppercase cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles size={10} />
                    AI SIZE FINDER
                  </button>
                  <button
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="text-[9px] font-black text-brand-red hover:underline tracking-widest uppercase cursor-pointer"
                  >
                    SIZE GUIDE
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-12 h-12 rounded-full text-xs font-black tracking-widest border uppercase transition-all cursor-pointer flex items-center justify-center ${
                      selectedSize === size
                        ? 'bg-brand-red border-brand-red text-white'
                        : 'border-neutral-900 bg-neutral-950 text-neutral-400 hover:border-neutral-600 hover:text-white'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mb-8">
              <div className="flex items-center border border-neutral-950 bg-neutral-950/40 rounded-full px-2 shrink-0">
                <button
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="px-3 py-3 text-neutral-500 hover:text-white cursor-pointer"
                >
                  -
                </button>
                <span className="px-2 text-xs font-black text-white w-6 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(prev => prev + 1)}
                  className="px-3 py-3 text-neutral-500 hover:text-white cursor-pointer"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => {
                  if (!selectedSize) {
                    addToast('Please select a size first.', 'error');
                    return;
                  }
                  if (isOutOfStock) {
                    addToast('This variant is out of stock.', 'error');
                    return;
                  }
                  addToCart({ ...product, price: currentPrice }, selectedSize, product.color, quantity);
                }}
                disabled={isOutOfStock}
                className="flex-grow bg-brand-red hover:bg-red-700 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-black text-xs tracking-widest py-4 uppercase transition duration-300 rounded-full shadow-lg hover:shadow-brand-red/20 cursor-pointer disabled:cursor-not-allowed"
              >
                {isOutOfStock ? 'OUT OF STOCK' : 'ADD TO BAG'}
              </button>

              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-4 border rounded-full cursor-pointer transition ${
                  isInWishlist(product.id)
                    ? 'border-brand-red bg-brand-red/10 text-brand-red'
                    : 'border-neutral-900 bg-neutral-950 text-neutral-400 hover:border-neutral-600 hover:text-white'
                }`}
              >
                <Heart size={16} className={isInWishlist(product.id) ? 'fill-brand-red' : ''} />
              </button>

              {/* Compare toggle button */}
              <button
                onClick={handleToggleCompare}
                className={`px-4 py-2 border rounded-full text-[9px] font-black tracking-widest uppercase transition cursor-pointer ${
                  isCompared
                    ? 'bg-white text-black border-white'
                    : 'border-neutral-900 bg-neutral-950 text-neutral-400 hover:text-white hover:border-neutral-700'
                }`}
              >
                {isCompared ? 'COMPARED' : 'COMPARE'}
              </button>
            </div>

            {/* Pincode Availability Checker */}
            <div className="mb-8 p-4 bg-neutral-950/20 border border-neutral-900 rounded-luxury space-y-3">
              <span className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase">
                DELIVERY AVAILABILITY CHECKER
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ENTER PINCODE (E.G. 400021)"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="bg-black border border-neutral-900 focus:border-neutral-600 text-[10px] text-white font-bold tracking-widest p-2 px-4 rounded-full outline-none w-full uppercase"
                />
                <button
                  type="button"
                  onClick={handleCheckPincode}
                  className="bg-[#050507] border border-neutral-900 hover:border-neutral-700 hover:bg-neutral-900 text-white font-black text-[9px] tracking-widest px-6 rounded-full uppercase transition cursor-pointer"
                >
                  CHECK
                </button>
              </div>
              {pincodeStatus && (
                <p className={`text-[9px] font-bold uppercase tracking-wider ${pincodeStatus.includes('not') ? 'text-brand-red' : 'text-green-500'}`}>
                  {pincodeStatus}
                </p>
              )}
            </div>

            {/* Accordions */}
            <div className="space-y-px border-t border-neutral-950">
              
              <div className="py-4 border-b border-neutral-950">
                <button
                  onClick={() => toggleAccordion(0)}
                  className="w-full flex items-center justify-between text-left text-xs font-black tracking-widest uppercase text-white hover:text-brand-red transition cursor-pointer"
                >
                  <span>FABRIC & DETAILS</span>
                  {activeAccordion === 0 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {activeAccordion === 0 && (
                  <div className="text-neutral-500 text-[11px] font-semibold mt-3 tracking-wide leading-relaxed uppercase space-y-2.5">
                    <div><span className="text-neutral-400 font-bold">Fabric:</span> {product.fabric}</div>
                    <div><span className="text-neutral-400 font-bold">Material:</span> {product.material}</div>
                    <div><span className="text-neutral-400 font-bold">Fit Style:</span> {product.fitType}</div>
                    <div><span className="text-neutral-400 font-bold">Sleeve:</span> {product.sleeveType}</div>
                    <div><span className="text-neutral-400 font-bold">Neck Type:</span> {product.neckType}</div>
                    <div><span className="text-neutral-400 font-bold">Pattern:</span> {product.pattern}</div>
                    <div><span className="text-neutral-400 font-bold">Occasion:</span> {product.occasion}</div>
                    {product.highlights && product.highlights.length > 0 && (
                      <div className="mt-2">
                        <span className="text-neutral-400 font-bold block mb-1">Highlights:</span>
                        <ul className="list-disc list-inside space-y-1">
                          {product.highlights.map((h, i) => <li key={i}>{h}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="py-4 border-b border-neutral-950">
                <button
                  onClick={() => toggleAccordion(1)}
                  className="w-full flex items-center justify-between text-left text-xs font-black tracking-widest uppercase text-white hover:text-brand-red transition cursor-pointer"
                >
                  <span>SPECIFICATIONS</span>
                  {activeAccordion === 1 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {activeAccordion === 1 && (
                  <div className="text-neutral-500 text-[11px] font-semibold mt-3 tracking-wide space-y-2.5 uppercase">
                    {product.specs && product.specs.length > 0 && (
                      <ul className="space-y-1 list-disc list-inside mb-3">
                        {product.specs.map((spec, sidx) => (
                          <li key={sidx}>{spec}</li>
                        ))}
                      </ul>
                    )}
                    <div><span className="text-neutral-400 font-bold">Brand:</span> {product.brandInfo}</div>
                    <div><span className="text-neutral-400 font-bold">SKU:</span> {product.sku || `COSO-${product.id}`}</div>
                    <div><span className="text-neutral-400 font-bold">Country of Origin:</span> {product.countryOfOrigin}</div>
                    <div><span className="text-neutral-400 font-bold">Package Contents:</span> {product.packageContents}</div>
                  </div>
                )}
              </div>

              <div className="py-4 border-b border-neutral-950">
                <button
                  onClick={() => toggleAccordion(2)}
                  className="w-full flex items-center justify-between text-left text-xs font-black tracking-widest uppercase text-white hover:text-brand-red transition cursor-pointer"
                >
                  <span>CARE & WASH INSTRUCTIONS</span>
                  {activeAccordion === 2 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {activeAccordion === 2 && (
                  <p className="text-neutral-500 text-[11px] font-semibold mt-3 tracking-wide leading-relaxed uppercase">
                    {product.washCare || product.careInstructions || 'Wash cold, hang to dry.'}
                  </p>
                )}
              </div>

              <div className="py-4 border-b border-neutral-950">
                <button
                  onClick={() => toggleAccordion(3)}
                  className="w-full flex items-center justify-between text-left text-xs font-black tracking-widest uppercase text-white hover:text-brand-red transition cursor-pointer"
                >
                  <span>SHIPPING & RETURNS</span>
                  {activeAccordion === 3 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {activeAccordion === 3 && (
                  <p className="text-neutral-500 text-[11px] font-semibold mt-3 tracking-wide leading-relaxed uppercase">
                    Easy 10-day returns and exchanges. Retain all original brand tags, packaging, and invoices. Refund processing takes 3-5 business days. Free standard courier dispatch on all store orders above ₹999.
                  </p>
                )}
              </div>

            </div>

          </div>

        </div>

        {/* Reviews Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-16 mb-24 border-t border-neutral-950">
          <div className="lg:col-span-4 space-y-8">
            <div>
              <h3 className="text-white text-2xl font-black font-impact tracking-widest uppercase mb-2">
                CUSTOMER REVIEWS
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex text-brand-red">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="fill-brand-red text-brand-red" />
                  ))}
                </div>
                <span className="text-xs font-bold text-white uppercase">{product.rating} OUT OF 5</span>
              </div>
            </div>

            {/* Review Form */}
            <form onSubmit={handleAddReviewSubmit} className="bg-neutral-950/20 border border-neutral-900/40 p-6 rounded-luxury space-y-4">
              <h4 className="text-white font-black text-xs tracking-widest uppercase">WRITE A REVIEW</h4>
              
              <div>
                <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">YOUR NAME</label>
                <input
                  type="text"
                  required
                  value={newReviewUser}
                  onChange={(e) => setNewReviewUser(e.target.value)}
                  className="bg-black border border-neutral-900 focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-2.5 transition"
                  placeholder="CHRIS T."
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1 flex items-center justify-between">
                  <span>RATING</span>
                  <span className="text-neutral-400">{newReviewRating} STARS</span>
                </label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((stars) => (
                    <button
                      key={stars}
                      type="button"
                      onClick={() => setNewReviewRating(stars)}
                      className="text-brand-red hover:scale-110 transition cursor-pointer"
                    >
                      <Star size={18} className={stars <= newReviewRating ? 'fill-brand-red text-brand-red' : 'text-neutral-700'} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">COMMENTS</label>
                <textarea
                  required
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  rows={4}
                  className="bg-black border border-neutral-900 focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-2.5 transition resize-none"
                  placeholder="WHAT DO YOU THINK?"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full bg-brand-red hover:bg-red-700 text-white font-black text-xs tracking-widest py-3 uppercase transition duration-300 rounded-full cursor-pointer disabled:opacity-50"
              >
                {submittingReview ? 'SUBMITTING...' : 'SUBMIT REVIEW'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <h4 className="text-neutral-400 font-bold text-xs tracking-widest uppercase border-b border-neutral-950 pb-2">
              VERIFIED FEEDBACK ({reviews.length})
            </h4>
            {reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((rev) => (
                  <div key={rev._id || rev.id} className="bg-neutral-950/10 border border-neutral-900/40 p-5 rounded-luxury space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-white uppercase">{rev.user}</span>
                        <div className="flex">
                           {[...Array(5)].map((_, i) => (
                             <Star key={i} size={10} className={i < rev.rating ? 'fill-brand-red text-brand-red' : 'text-neutral-800'} />
                           ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-neutral-600 font-bold tracking-widest">{rev.date}</span>
                    </div>
                    <p className="text-neutral-400 text-xs tracking-wide leading-relaxed font-medium uppercase">
                      "{rev.comment}"
                    </p>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => !rev.helpful && handleLikeReview(rev._id)}
                        disabled={rev.helpful}
                        className={`text-[8px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full border transition cursor-pointer flex items-center gap-1.5 ${
                          rev.helpful
                            ? 'bg-neutral-900 border-neutral-900 text-brand-red'
                            : 'border-neutral-900 text-neutral-500 hover:text-white hover:border-neutral-700'
                        }`}
                      >
                        HELPFUL ({rev.likes})
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-600 font-semibold tracking-wider py-8">
                NO FEEDBACK REGISTERED FOR THIS DROP YET. BE THE FIRST.
              </p>
            )}
          </div>
        </div>

        {/* Frequently Bought Together Section */}
        {frequentlyBought && (
          <div className="pt-16 mb-24 border-t border-neutral-950">
            <h3 className="text-white text-2xl font-black font-impact tracking-widest uppercase mb-8">
              FREQUENTLY BOUGHT TOGETHER
            </h3>
            <div className="bg-[#050507] border border-neutral-900 p-6 rounded-luxury flex flex-col md:flex-row items-center justify-between gap-8 max-w-4xl">
              <div className="flex flex-wrap items-center gap-6">
                {/* Main Product Card snippet */}
                <div className="flex items-center gap-4">
                  <img src={product.image} className="w-16 h-20 object-cover object-top rounded-luxury bg-neutral-900 border border-neutral-900" alt="" />
                  <div>
                    <h5 className="text-[11px] font-black uppercase text-neutral-200 line-clamp-1">{product.title}</h5>
                    <span className="text-xs font-bold text-white">₹{currentPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-xl font-bold text-neutral-600">+</div>

                {/* Bundle Item Card snippet */}
                <div className="flex items-center gap-4">
                  <img src={frequentlyBought.image} className="w-16 h-20 object-cover object-top rounded-luxury bg-neutral-900 border border-neutral-900" alt="" />
                  <div>
                    <Link to={`/product/${frequentlyBought.id}`} className="text-[11px] font-black uppercase text-neutral-200 hover:text-brand-red line-clamp-1">
                      {frequentlyBought.title}
                    </Link>
                    <span className="text-xs font-bold text-white">₹{frequentlyBought.price.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Price calculation and bundle purchase */}
              <div className="flex flex-col md:items-end gap-2 text-right">
                <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                  TOTAL VALUE: <span className="line-through">₹{(currentPrice + frequentlyBought.price).toFixed(2)}</span>
                </div>
                <div className="text-xl font-black text-brand-red uppercase">
                  BUNDLE PRICE: ₹{((currentPrice + frequentlyBought.price) * 0.85).toFixed(2)}
                </div>
                <div className="text-[9px] text-green-500 font-bold uppercase tracking-widest">
                  SAVE 15% INSTANTLY WITH THE STUDIO BUNDLE
                </div>
                <button
                  onClick={handleAddBundleToCart}
                  className="mt-2 bg-brand-red hover:bg-red-700 text-white font-black text-[10px] tracking-widest px-8 py-3.5 uppercase rounded-full transition shadow-lg hover:shadow-brand-red/20 cursor-pointer"
                >
                  ADD BUNDLE TO BAG
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Related Products Grid */}
        {relatedProducts.length > 0 && (
          <div className="pt-16 mb-24 border-t border-neutral-950">
            <h3 className="text-white text-2xl font-black font-impact tracking-widest uppercase mb-8">
              RELATED DROPS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {relatedProducts.map((p) => (
                <div key={p.id} className="bg-[#050507] border border-neutral-900 p-4 rounded-luxury space-y-4 hover:border-neutral-850 transition">
                  <Link to={`/product/${p.id}`} className="block aspect-[3/4] bg-neutral-900 rounded-luxury overflow-hidden border border-neutral-900">
                    <img src={p.image} className="w-full h-full object-cover object-top hover:scale-105 transition duration-500" alt="" />
                  </Link>
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] text-neutral-500 font-bold uppercase">{p.category}</span>
                      <span className="text-[8px] bg-neutral-900 border border-neutral-800 text-brand-red font-black px-1.5 py-0.5 rounded-full uppercase">{p.tag}</span>
                    </div>
                    <Link to={`/product/${p.id}`} className="text-xs font-black uppercase text-white hover:text-brand-red line-clamp-1 block transition">
                      {p.title}
                    </Link>
                    <div className="text-xs font-bold text-neutral-300">₹{p.price.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recently Viewed Grid */}
        {recentlyViewed && recentlyViewed.length > 1 && (
          <div className="pt-16 mb-24 border-t border-neutral-950">
            <h3 className="text-white text-2xl font-black font-impact tracking-widest uppercase mb-8">
              RECENTLY VIEWED
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {recentlyViewed.filter(p => p.id !== productId).slice(0, 6).map((p) => (
                <div key={p.id} className="bg-[#050507]/40 border border-neutral-900 p-3 rounded-luxury space-y-3 hover:border-neutral-800 transition">
                  <Link to={`/product/${p.id}`} className="block aspect-[3/4] bg-neutral-900 rounded-luxury overflow-hidden border border-neutral-900">
                    <img src={p.image} className="w-full h-full object-cover object-top hover:scale-105 transition duration-300" alt="" />
                  </Link>
                  <div className="space-y-1">
                    <Link to={`/product/${p.id}`} className="text-[10px] font-black uppercase text-white hover:text-brand-red line-clamp-1 block transition">
                      {p.title}
                    </Link>
                    <div className="text-[10px] font-bold text-neutral-400">₹{p.price.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Size Guide Modal Overlay */}
      {isSizeGuideOpen && (
        <div className="fixed inset-0 z-[300] flex justify-center items-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setIsSizeGuideOpen(false)}></div>
          <div className="relative bg-neutral-950 border border-neutral-900 p-8 rounded-luxury max-w-xl w-full space-y-6 z-10 animate-scale-up text-white">
            <div className="flex justify-between items-center border-b border-neutral-900 pb-4">
              <h3 className="font-black font-impact tracking-widest text-xl uppercase">STUDIO SIZE CHART</h3>
              <button onClick={() => setIsSizeGuideOpen(false)} className="text-neutral-500 hover:text-white transition cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-neutral-400 text-xs leading-relaxed uppercase">
              All measurements are in inches. Our drops use a boxy, slightly relaxed streetwear cut. For a normal fit, select your standard size. For an extreme oversized drop, select one size up.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs uppercase tracking-wider border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 text-[10px] text-neutral-500 font-bold">
                    <th className="py-3 pr-4">SIZE</th>
                    <th className="py-3 px-4 text-center">CHEST</th>
                    <th className="py-3 px-4 text-center">LENGTH</th>
                    <th className="py-3 pl-4 text-center">SHOULDER</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900 font-semibold">
                  {product.sizeChart ? (
                    Object.keys(product.sizeChart).map((sizeKey) => (
                      <tr key={sizeKey} className="hover:bg-neutral-900/40">
                        <td className="py-3 pr-4 font-bold text-white">{sizeKey}</td>
                        <td className="py-3 px-4 text-center">{product.sizeChart[sizeKey].chest}</td>
                        <td className="py-3 px-4 text-center">{product.sizeChart[sizeKey].length}</td>
                        <td className="py-3 pl-4 text-center">{product.sizeChart[sizeKey].shoulder || 'N/A'}</td>
                      </tr>
                    ))
                  ) : (
                    [
                      { sz: 'S', chest: '42 in', len: '27.5 in', sh: '17.5 in' },
                      { sz: 'M', chest: '44 in', len: '28.5 in', sh: '18.0 in' },
                      { sz: 'L', chest: '46 in', len: '29.5 in', sh: '18.5 in' },
                      { sz: 'XL', chest: '48 in', len: '30.5 in', sh: '19.0 in' },
                      { sz: '2XL', chest: '50 in', len: '31.5 in', sh: '19.5 in' }
                    ].map((row) => (
                      <tr key={row.sz} className="hover:bg-neutral-900/40">
                        <td className="py-3 pr-4 font-bold text-white">{row.sz}</td>
                        <td className="py-3 px-4 text-center">{row.chest}</td>
                        <td className="py-3 px-4 text-center">{row.len}</td>
                        <td className="py-3 pl-4 text-center">{row.sh}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* AI Size Finder Modal Overlay */}
      {isAiSizeOpen && (
        <div className="fixed inset-0 z-[300] flex justify-center items-center p-4 select-none">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setIsAiSizeOpen(false)}></div>
          <div className="relative bg-neutral-950 border border-neutral-900 p-8 rounded-luxury max-w-sm w-full space-y-6 z-10 animate-scale-up text-white text-left">
            <div className="flex justify-between items-center border-b border-neutral-900 pb-4">
              <h3 className="font-black font-impact tracking-widest text-lg uppercase flex items-center gap-1.5">
                <Sparkles size={16} className="text-green-400 animate-pulse" />
                AI SIZE SUGGESTER
              </h3>
              <button onClick={() => setIsAiSizeOpen(false)} className="text-neutral-500 hover:text-white transition cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">HEIGHT (IN CM)</label>
                <input
                  type="number"
                  value={userHeight}
                  onChange={(e) => setUserHeight(e.target.value)}
                  placeholder="e.g. 175"
                  className="bg-black border border-neutral-900 focus:border-neutral-500 text-white text-xs font-semibold tracking-wider outline-none w-full p-3 px-4 rounded-full transition"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1">WEIGHT (IN KG)</label>
                <input
                  type="number"
                  value={userWeight}
                  onChange={(e) => setUserWeight(e.target.value)}
                  placeholder="e.g. 70"
                  className="bg-black border border-neutral-900 focus:border-neutral-500 text-white text-xs font-semibold tracking-wider outline-none w-full p-3 px-4 rounded-full transition"
                />
              </div>

              <button
                onClick={calculateAiSize}
                className="w-full bg-green-500 hover:bg-green-600 text-black font-black text-xs tracking-widest py-3.5 uppercase transition duration-300 rounded-full cursor-pointer shadow-lg hover:shadow-green-500/10"
              >
                CALCULATE SUGGESTED SIZE
              </button>

              {suggestedSize && (
                <div className="border border-green-500/20 bg-green-950/10 p-4 rounded-luxury space-y-3 animate-fade-in text-center">
                  <span className="block text-[9px] text-green-400 font-bold tracking-widest uppercase">RECOMMENDED SIZE</span>
                  <span className="block text-white text-3xl font-black font-impact tracking-widest uppercase">{suggestedSize}</span>
                  <button
                    onClick={() => {
                      setSelectedSize(suggestedSize);
                      setIsAiSizeOpen(false);
                    }}
                    className="bg-white hover:bg-neutral-200 text-black font-black text-[9px] tracking-widest px-4 py-2 rounded-full uppercase transition cursor-pointer"
                  >
                    APPLY & SELECT SIZE
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
