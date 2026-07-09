import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Search, Clock, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';

export default function SearchOverlay({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('coso_search_history');
    return saved ? JSON.parse(saved) : [];
  });
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const trendingSearches = ['oversized', 'classic', 'shadow', 'heavyweight', 'drop 01'];

  // Load live products on open
  useEffect(() => {
    async function loadSearchProducts() {
      if (isOpen) {
        try {
          const list = await api.getProducts();
          setProducts(list);
        } catch (err) {
          console.error('Failed to load search catalog:', err);
        }
      }
    }
    loadSearchProducts();
  }, [isOpen]);

  // Handle focus
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle Escape Key Close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const handleSearchSubmit = (searchQuery) => {
    const cleanQuery = searchQuery.trim();
    if (!cleanQuery) return;

    // Add to history
    const updatedHistory = [cleanQuery, ...history.filter((h) => h !== cleanQuery)].slice(0, 5);
    setHistory(updatedHistory);
    localStorage.setItem('coso_search_history', JSON.stringify(updatedHistory));

    onClose();
    navigate(`/shop?search=${encodeURIComponent(cleanQuery)}`);
  };

  const removeHistoryItem = (e, index) => {
    e.stopPropagation();
    const updated = history.filter((_, idx) => idx !== index);
    setHistory(updated);
    localStorage.setItem('coso_search_history', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('coso_search_history');
  };

  // Live filter suggestions (max 4 matches)
  const suggestions = products.filter((p) =>
    p.title.toLowerCase().includes(query.toLowerCase()) ||
    p.category.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 4);

  return (
    <div className="fixed inset-0 z-[250] bg-black/98 backdrop-blur-xl flex flex-col pt-24 px-6 md:px-16 animate-fade-in">
      {/* Top row controls */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between border-b border-neutral-900 pb-4 mb-12">
        <div className="flex items-center gap-4 flex-grow">
          <Search size={20} className="text-neutral-500" />
          <input
            ref={inputRef}
            type="text"
            placeholder="TYPE TO SEARCH TEES..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(query)}
            className="bg-transparent text-white font-black font-impact tracking-widest text-xl sm:text-2xl md:text-3xl placeholder-neutral-800 outline-none w-full uppercase"
          />
        </div>
        <button
          onClick={onClose}
          className="text-neutral-500 hover:text-white p-2 border border-neutral-900 hover:border-neutral-700 transition cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      {/* Body content */}
      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-12 overflow-y-auto pb-24">
        {/* Suggestion list */}
        <div className="md:col-span-7 space-y-8">
          {query ? (
            <div>
              <h4 className="text-[10px] font-bold text-brand-red tracking-widest uppercase mb-4">
                SUGGESTIONS
              </h4>
              {suggestions.length > 0 ? (
                <div className="space-y-4">
                  {suggestions.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => {
                        onClose();
                        navigate(`/product/${product.id}`);
                      }}
                      className="group flex items-center gap-4 cursor-pointer border border-neutral-950 hover:border-neutral-900 bg-neutral-950/20 p-2 hover:bg-neutral-950/60 transition duration-200"
                    >
                      <div className="w-12 h-16 bg-neutral-900 border border-neutral-900 overflow-hidden shrink-0">
                        <img src={product.image} className="w-full h-full object-cover object-top" alt="" />
                      </div>
                      <div className="flex-grow">
                        <p className="text-xs font-bold text-white group-hover:text-brand-red transition uppercase">
                          {product.title}
                        </p>
                        <p className="text-[10px] text-neutral-500 font-semibold mt-0.5 uppercase">
                          {product.category} • ₹{product.price.toFixed(2)}
                        </p>
                      </div>
                      <ArrowRight size={12} className="text-neutral-600 group-hover:text-white transition group-hover:translate-x-1" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-600 font-semibold tracking-wider">
                  NO PRODUCTS MATCH YOUR SEARCH
                </p>
              )}
            </div>
          ) : (
            <div>
              <h4 className="text-[10px] font-bold text-brand-red tracking-widest uppercase mb-4">
                TRENDING NOW
              </h4>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setQuery(term);
                      handleSearchSubmit(term);
                    }}
                    className="border border-neutral-900 hover:border-white text-neutral-400 hover:text-white px-4 py-2 text-[10px] font-black tracking-widest uppercase transition duration-150 cursor-pointer"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* History column */}
        <div className="md:col-span-5 space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
            <h4 className="text-[10px] font-bold text-neutral-500 tracking-widest uppercase">
              SEARCH HISTORY
            </h4>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-[9px] font-bold text-brand-red tracking-widest uppercase hover:underline cursor-pointer"
              >
                CLEAR ALL
              </button>
            )}
          </div>

          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((term, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setQuery(term);
                    handleSearchSubmit(term);
                  }}
                  className="flex items-center justify-between text-xs text-neutral-400 hover:text-white font-semibold tracking-wider cursor-pointer group py-1"
                >
                  <div className="flex items-center gap-3">
                    <Clock size={12} className="text-neutral-600" />
                    <span className="uppercase group-hover:text-brand-red transition">{term}</span>
                  </div>
                  <button
                    onClick={(e) => removeHistoryItem(e, index)}
                    className="text-neutral-700 hover:text-white transition p-1 cursor-pointer"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-neutral-600 font-bold tracking-widest uppercase">
              YOUR SEARCH HISTORY IS EMPTY
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
