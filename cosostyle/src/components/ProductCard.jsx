import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ArrowUpDown, Eye, Share2, Star, ShoppingBag, X, Zap } from 'lucide-react';
import { useWishlist, useCart, useToasts } from '../context/AppContext';

export default function ProductCard({ id, title, price, tag, image, category, description, rating, inventory, availability }) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { addToast } = useToasts();
  const navigate = useNavigate();

  const saved = isInWishlist(id);
  const [isCompared, setIsCompared] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [selectedSize, setSelectedSize] = useState('M');

  const updateCompareStatus = () => {
    const list = JSON.parse(localStorage.getItem('coso_compare_list') || '[]');
    setIsCompared(list.includes(id));
  };

  useEffect(() => {
    updateCompareStatus();
    window.addEventListener('coso_compare_update', updateCompareStatus);
    return () => window.removeEventListener('coso_compare_update', updateCompareStatus);
  }, [id]);

  const handleHeartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(id);
  };

  const handleCompareClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    let list = JSON.parse(localStorage.getItem('coso_compare_list') || '[]');
    if (list.includes(id)) {
      list = list.filter(cid => cid !== id);
      setIsCompared(false);
    } else {
      if (list.length >= 3) {
        addToast('You can compare a maximum of 3 products.', 'error');
        return;
      }
      list.push(id);
      setIsCompared(true);
    }
    localStorage.setItem('coso_compare_list', JSON.stringify(list));
    window.dispatchEvent(new Event('coso_compare_update'));
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowQuickView(true);
  };

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const shareData = {
      title: `CoSoStyle — ${title}`,
      text: `Check out ${title} on CoSoStyle`,
      url: `${window.location.origin}/product/${id}`
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (_e) { /* user cancelled share */ }
    } else {
      await navigator.clipboard.writeText(shareData.url);
      addToast('Product link copied to clipboard!', 'success');
    }
  };

  const handleQuickAddToCart = (e) => {
    e.stopPropagation();
    addToCart({ id, title, price, image, category }, 1, selectedSize);
    addToast(`${title} added to cart!`, 'success');
    setShowQuickView(false);
  };

  // Badge logic
  const isLowStock = inventory !== undefined && inventory <= 10 && inventory > 0;
  const isOutOfStock = availability === 'out-of-stock' || inventory === 0;

  return (
    <>
      <div className="group relative flex flex-col bg-[#0A0A0C] rounded-luxury shadow-md hover:shadow-luxury hover:-translate-y-1 transition-luxury overflow-hidden p-2 select-none">
        {/* Image Container */}
        <div className="relative aspect-[3.4/4] w-full bg-brand-card-bg rounded-t-[10px] overflow-hidden block">

          {/* Badges */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
            {tag && (
              <span className={`text-[8px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase ${
                tag === 'SALE' || tag === 'LIMITED' ? 'bg-brand-red text-white' :
                tag === 'NEW' ? 'bg-white text-black' :
                tag === 'BESTSELLER' ? 'bg-yellow-400 text-black' :
                'bg-brand-red text-white'
              }`}>
                {tag}
              </span>
            )}
            {isLowStock && !isOutOfStock && (
              <span className="text-[7px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase bg-orange-500/90 text-white flex items-center gap-1">
                <Zap size={6} /> LOW STOCK
              </span>
            )}
            {isOutOfStock && (
              <span className="text-[7px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase bg-neutral-700 text-neutral-400">
                SOLD OUT
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
            {/* Wishlist */}
            <button
              onClick={handleHeartClick}
              className={`p-2 rounded-full bg-black/40 backdrop-blur-md cursor-pointer transition-colors ${saved ? 'text-brand-red' : 'text-neutral-400 hover:text-brand-red'}`}
              title="Add to Wishlist"
            >
              <Heart size={12} className={saved ? 'fill-brand-red text-brand-red' : ''} />
            </button>
            {/* Compare */}
            <button
              onClick={handleCompareClick}
              className={`p-2 rounded-full bg-black/40 backdrop-blur-md cursor-pointer transition-colors ${isCompared ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}
              title="Compare products"
            >
              <ArrowUpDown size={12} className={isCompared ? 'text-black' : ''} />
            </button>
            {/* Share */}
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-black/40 text-neutral-400 hover:text-white backdrop-blur-md cursor-pointer transition-colors"
              title="Share product"
            >
              <Share2 size={12} />
            </button>
          </div>

          {/* Product Image */}
          <Link to={`/product/${id}`} className="block w-full h-full">
            <img
              src={image}
              alt={title}
              className={`w-full h-full object-cover object-top transition-all duration-700 scale-100 group-hover:scale-105 ${isOutOfStock ? 'filter grayscale opacity-60' : 'filter grayscale group-hover:grayscale-0'}`}
              loading="lazy"
            />
          </Link>

          {/* Quick View overlay on hover */}
          <div className="absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 transition-all duration-300 p-3">
            <button
              onClick={handleQuickView}
              className="w-full flex items-center justify-center gap-2 bg-black/80 backdrop-blur-md hover:bg-brand-red text-white text-[9px] font-black tracking-widest uppercase py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              <Eye size={10} /> QUICK VIEW
            </button>
          </div>
        </div>

        {/* Card Footer */}
        <div className="pt-4 pb-2 px-2 flex flex-col bg-transparent">
          <span className="text-[8px] font-black tracking-widest text-brand-red mb-1 uppercase">
            {category || 'ESSENTIAL'}
          </span>
          <div className="flex items-baseline justify-between gap-2">
            <Link
              to={`/product/${id}`}
              className="text-neutral-200 hover:text-white font-bold text-xs tracking-wide truncate max-w-[80%] uppercase transition-colors"
            >
              {title}
            </Link>
            <span className="text-white font-bold text-xs">
              ₹{price?.toFixed(2)}
            </span>
          </div>

          {/* Star rating display */}
          {rating && (
            <div className="flex items-center gap-1 mt-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={8}
                  className={i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-700'}
                />
              ))}
              <span className="text-neutral-600 text-[8px] font-bold ml-0.5">{rating?.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick View Modal ──────────────────────────────────────────── */}
      {showQuickView && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" onClick={() => setShowQuickView(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* Modal */}
          <div
            className="relative bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden z-10 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowQuickView(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition cursor-pointer z-20"
            >
              <X size={14} />
            </button>

            <div className="flex gap-0">
              {/* Product Image */}
              <div className="w-52 h-64 shrink-0 bg-neutral-900 overflow-hidden">
                <img src={image} alt={title} className="w-full h-full object-cover" />
              </div>

              {/* Product Info */}
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                  <span className="text-[8px] font-black text-brand-red tracking-widest uppercase">{category}</span>
                  <h3 className="text-white font-black text-base uppercase mt-1 leading-tight">{title}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-white font-black text-xl">₹{price?.toFixed(2)}</span>
                    {tag && <span className="bg-brand-red text-white text-[7px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase">{tag}</span>}
                  </div>

                  {rating && (
                    <div className="flex items-center gap-1 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} className={i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-700'} />
                      ))}
                      <span className="text-neutral-500 text-[9px] font-bold ml-1">{rating?.toFixed(1)}</span>
                    </div>
                  )}

                  {description && (
                    <p className="text-neutral-500 text-[10px] mt-3 leading-relaxed line-clamp-3">{description}</p>
                  )}
                </div>

                {/* Size Selector */}
                <div className="mt-4">
                  <span className="text-neutral-500 text-[9px] font-black tracking-widest uppercase block mb-2">Size</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {['XS', 'S', 'M', 'L', 'XL', '2XL'].map(sz => (
                      <button
                        key={sz}
                        onClick={() => setSelectedSize(sz)}
                        className={`w-8 h-8 text-[9px] font-black rounded-full border transition cursor-pointer ${
                          selectedSize === sz
                            ? 'bg-brand-red border-brand-red text-white'
                            : 'border-neutral-700 text-neutral-400 hover:border-white hover:text-white'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleQuickAddToCart}
                    disabled={isOutOfStock}
                    className="flex-1 flex items-center justify-center gap-2 bg-brand-red hover:bg-red-700 disabled:bg-neutral-800 disabled:text-neutral-600 text-white font-black text-[9px] tracking-widest uppercase py-3 rounded-full transition cursor-pointer"
                  >
                    <ShoppingBag size={11} />
                    {isOutOfStock ? 'SOLD OUT' : 'ADD TO BAG'}
                  </button>
                  <button
                    onClick={() => { setShowQuickView(false); navigate(`/product/${id}`); }}
                    className="px-4 border border-neutral-700 hover:border-white text-neutral-400 hover:text-white font-black text-[9px] tracking-widest uppercase rounded-full transition cursor-pointer"
                  >
                    FULL DETAILS
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}