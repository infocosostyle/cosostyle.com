import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import { api } from '../lib/api';
import SEO from '../components/SEO';

export default function Wishlist() {
  const { wishlist } = useWishlist();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWishlistProducts() {
      try {
        setLoading(true);
        const catalog = await api.getProducts();
        // Filter catalog items to those included in local wishlist state
        const saved = catalog.filter((item) => wishlist.includes(item.id));
        setProducts(saved);
      } catch (err) {
        console.error('Failed to load wishlist items:', err);
      } finally {
        setLoading(false);
      }
    }
    loadWishlistProducts();
  }, [wishlist]);

  return (
    <div className="w-full bg-black min-h-screen py-16 animate-fade-in">
      <SEO title="My Wishlist" description="View and manage your favorite saved CosoStyle tees." />

      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header Block */}
        <div className="pb-6 mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-neutral-950">
          <div>
            <span className="text-[10px] text-brand-red font-black tracking-widest uppercase block mb-1">SAVED ARTICLES</span>
            <h1 className="text-white text-5xl font-black font-impact tracking-tight uppercase">
              MY WISHLIST
            </h1>
          </div>
          <span className="text-neutral-500 text-xs font-bold uppercase tracking-wider">
            {wishlist.length} ITEMS SAVED
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-neutral-950 rounded-luxury" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {products.map((item) => (
              <ProductCard key={item.id} {...item} />
            ))}
          </div>
        ) : (
          <div className="w-full text-center py-24 border border-dashed border-neutral-900 rounded-luxury flex flex-col justify-center items-center gap-4">
            <span className="text-xs font-bold tracking-widest text-neutral-600 uppercase">
              YOUR WISHLIST REGISTER IS EMPTY
            </span>
            <p className="text-neutral-500 text-[10px] uppercase max-w-xs leading-relaxed font-semibold">
              Browse the catalog to save limited items before drop allocations sell out.
            </p>
            <Link
              to="/shop"
              className="bg-brand-red hover:bg-red-700 text-white font-black text-[10px] tracking-widest px-8 py-3.5 uppercase transition rounded-full mt-4"
            >
              SHOP CATALOG DROP
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}