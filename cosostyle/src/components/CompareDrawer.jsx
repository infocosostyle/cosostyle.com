import React, { useState, useEffect } from 'react';
import { X, ArrowUpDown, ShoppingBag } from 'lucide-react';
import { api } from '../lib/api';
import { useCart } from '../context/AppContext';

export default function CompareDrawer() {
  const [compareIds, setCompareIds] = useState([]);
  const [products, setProducts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { addToCart } = useCart();

  const loadCompareProducts = async (ids) => {
    try {
      const all = await api.getProducts();
      const filtered = all.filter(p => ids.includes(p.id));
      setProducts(filtered);
    } catch (err) {
      console.error('Failed to load compare products:', err);
    }
  };

  const updateCompareList = () => {
    const list = JSON.parse(localStorage.getItem('coso_compare_list') || '[]');
    setCompareIds(list);
    if (list.length > 0) {
      setIsOpen(true);
      loadCompareProducts(list);
    } else {
      setIsOpen(false);
      setProducts([]);
    }
  };

  useEffect(() => {
    updateCompareList();
    window.addEventListener('coso_compare_update', updateCompareList);
    return () => {
      window.removeEventListener('coso_compare_update', updateCompareList);
    };
  }, []);

  const handleRemove = (id) => {
    const updated = compareIds.filter(cid => cid !== id);
    localStorage.setItem('coso_compare_list', JSON.stringify(updated));
    window.dispatchEvent(new Event('coso_compare_update'));
  };

  const handleClearAll = () => {
    localStorage.setItem('coso_compare_list', JSON.stringify([]));
    window.dispatchEvent(new Event('coso_compare_update'));
  };

  if (!isOpen || compareIds.length === 0) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[200] bg-neutral-950 border-t border-neutral-900 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] transition-all duration-300 ${
      isMinimized ? 'h-14' : 'max-h-[85vh] h-auto md:max-h-[60vh]'
    }`}>
      {/* Header bar */}
      <div className="w-full h-14 bg-neutral-900 border-b border-neutral-900 px-6 flex justify-between items-center select-none">
        <div className="flex items-center gap-3">
          <ArrowUpDown size={14} className="text-brand-red animate-pulse" />
          <h4 className="text-white text-xs font-black tracking-widest uppercase">
            COMPARE PRODUCTS ({compareIds.length}/3)
          </h4>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-[9px] font-black tracking-widest uppercase text-neutral-400 hover:text-white cursor-pointer"
          >
            {isMinimized ? 'MAXIMIZE' : 'MINIMIZE'}
          </button>
          <button 
            onClick={handleClearAll}
            className="text-[9px] font-black tracking-widest uppercase text-neutral-400 hover:text-brand-red cursor-pointer"
          >
            CLEAR ALL
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-neutral-400 hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main comparative grid content */}
      {!isMinimized && (
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-56px)] md:max-h-[calc(60vh-56px)] bg-black/60 backdrop-blur-md">
          <div className="grid grid-cols-4 gap-4 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            {/* Criteria Column */}
            <div className="space-y-6 pt-24 font-bold border-r border-neutral-900 pr-4">
              <div className="h-20 flex items-center">PRODUCT</div>
              <div className="h-10 flex items-center border-t border-neutral-950">PRICE</div>
              <div className="h-10 flex items-center border-t border-neutral-950">RATING</div>
              <div className="h-10 flex items-center border-t border-neutral-950">FABRIC / MAT</div>
              <div className="h-10 flex items-center border-t border-neutral-950">FIT STYLE</div>
              <div className="h-10 flex items-center border-t border-neutral-950">COLLAR LINE</div>
              <div className="h-10 flex items-center border-t border-neutral-950">SLEEVE CUT</div>
              <div className="h-10 flex items-center border-t border-neutral-950">PATTERN</div>
              <div className="h-10 flex items-center border-t border-neutral-950">OCCASION</div>
              <div className="h-12 flex items-center border-t border-neutral-950">ACTION</div>
            </div>

            {/* Product Columns */}
            {[0, 1, 2].map((idx) => {
              const p = products[idx];
              if (!p) {
                return (
                  <div key={idx} className="border border-dashed border-neutral-900 bg-neutral-950/20 rounded-luxury flex flex-col justify-center items-center text-center p-8 select-none">
                    <span className="text-[10px] font-black text-neutral-700 tracking-widest uppercase">
                      ADD PRODUCT TO COMPARE
                    </span>
                  </div>
                );
              }
              return (
                <div key={p.id} className="space-y-6 text-white relative">
                  {/* Remove Button */}
                  <button 
                    onClick={() => handleRemove(p.id)}
                    className="absolute top-2 right-2 p-1 bg-black/80 hover:bg-brand-red border border-neutral-900 hover:border-brand-red rounded-full text-white/80 transition cursor-pointer"
                  >
                    <X size={10} />
                  </button>

                  {/* Header metadata */}
                  <div className="h-24 flex gap-3 items-center pr-8">
                    <img src={p.image} className="w-12 h-16 object-cover object-top bg-neutral-900 rounded-luxury" alt="" />
                    <div className="space-y-1">
                      <span className="text-[8px] bg-brand-red text-white font-black px-1.5 py-0.5 rounded-full uppercase">
                        {p.tag}
                      </span>
                      <h5 className="text-[10px] font-black font-impact tracking-tight uppercase line-clamp-2 leading-tight">
                        {p.title}
                      </h5>
                    </div>
                  </div>

                  {/* Details comparative listings */}
                  <div className="h-10 flex items-center border-t border-neutral-900 font-bold text-neutral-200">
                    ₹{p.price.toFixed(2)}
                  </div>
                  <div className="h-10 flex items-center border-t border-neutral-900 text-yellow-500 font-bold">
                    ★ {p.rating}
                  </div>
                  <div className="h-10 flex items-center border-t border-neutral-900 text-neutral-400 font-semibold line-clamp-1">
                    {p.fabric || '100% Cotton'}
                  </div>
                  <div className="h-10 flex items-center border-t border-neutral-900 text-neutral-400 font-semibold">
                    {p.fitType || 'Regular Fit'}
                  </div>
                  <div className="h-10 flex items-center border-t border-neutral-900 text-neutral-400 font-semibold">
                    {p.neckType || 'Round Neck'}
                  </div>
                  <div className="h-10 flex items-center border-t border-neutral-900 text-neutral-400 font-semibold">
                    {p.sleeveType || 'Half Sleeve'}
                  </div>
                  <div className="h-10 flex items-center border-t border-neutral-900 text-neutral-400 font-semibold line-clamp-1">
                    {p.pattern || 'Solid'}
                  </div>
                  <div className="h-10 flex items-center border-t border-neutral-900 text-neutral-400 font-semibold">
                    {p.occasion || 'Casual'}
                  </div>
                  <div className="h-12 flex items-center border-t border-neutral-900">
                    <button 
                      onClick={() => {
                        const size = p.sizes[0] || 'M';
                        addToCart(p, size, p.color, 1);
                      }}
                      className="bg-brand-red hover:bg-red-700 text-white font-black text-[9px] tracking-widest px-4 py-2 uppercase rounded-full transition flex items-center gap-1.5 cursor-pointer shadow-lg hover:shadow-brand-red/20"
                    >
                      <ShoppingBag size={10} />
                      ADD BAG
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
