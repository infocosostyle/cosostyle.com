import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ChevronDown, SlidersHorizontal, X, Grid3X3, List, Eye } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { api } from '../lib/api';
import { PRODUCTS as mockProducts } from '../lib/mockApi';
import SEO from '../components/SEO';
import { useRecentlyViewed } from '../context/AppContext';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { recentlyViewed } = useRecentlyViewed();

  // URL Param Syncs
  const currentCategory = searchParams.get('category') || 'all';
  const urlSearchQuery = searchParams.get('search') || '';

  // Products State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // View Mode
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [displayCount, setDisplayCount] = useState(12);

  // Filter States
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [selectedSize, setSelectedSize] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');
  const [maxPrice, setMaxPrice] = useState(600);
  const [selectedAvailability, setSelectedAvailability] = useState('all');
  const [selectedFit, setSelectedFit] = useState('all');
  const [selectedNeck, setSelectedNeck] = useState('all');
  const [selectedPattern, setSelectedPattern] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        const list = await api.getProducts();
        setProducts(list && list.length > 0 ? list : mockProducts);
      } catch (err) {
        console.warn('Backend unavailable, using local catalog:', err.message);
        setProducts(mockProducts);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  // Sync state search query if URL changes
  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  const setCategoryFilter = (category) => {
    if (category === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category);
    }
    setSearchParams(searchParams);
  };

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    if (val) {
      searchParams.set('search', val);
    } else {
      searchParams.delete('search');
    }
    setSearchParams(searchParams);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedSize('all');
    setSelectedColor('all');
    setMaxPrice(600);
    setSelectedAvailability('all');
    setSelectedFit('all');
    setSelectedNeck('all');
    setSelectedPattern('all');
    setSortBy('newest');
    setDisplayCount(12);
    setSearchParams({});
  };

  // 1. FILTERING LOGIC
  const filteredProducts = products.filter((product) => {
    const matchesCategory = currentCategory === 'all' || product.category === currentCategory;
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSize = selectedSize === 'all' || (product.sizes || []).includes(selectedSize);
    const matchesColor = selectedColor === 'all' || (product.color || '').toLowerCase().includes(selectedColor.toLowerCase());
    const matchesPrice = product.price <= maxPrice;
    const matchesAvailability = selectedAvailability === 'all' || product.availability === selectedAvailability;

    // Advanced spec extraction filters
    const matchesFit = selectedFit === 'all' || (product.specs || []).some(spec => spec.toLowerCase().includes('fit') && spec.toLowerCase().includes(selectedFit.toLowerCase()));
    const matchesNeck = selectedNeck === 'all' || product.title.toLowerCase().includes(selectedNeck.toLowerCase()) || (product.specs || []).some(spec => spec.toLowerCase().includes('collar') && spec.toLowerCase().includes(selectedNeck.toLowerCase()));
    const matchesPattern = selectedPattern === 'all' || (selectedPattern === 'graphic' ? product.category === 'graphic' : product.category !== 'graphic');

    return matchesCategory && matchesSearch && matchesSize && matchesColor && matchesPrice && matchesAvailability && matchesFit && matchesNeck && matchesPattern;
  });

  // 2. SORTING LOGIC
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'popular') return b.rating - a.rating;
    return b.id - a.id;
  });

  // 3. PAGINATION (Load More)
  const displayedProducts = sortedProducts.slice(0, displayCount);
  const hasMore = sortedProducts.length > displayCount;

  const sortLabel = {
    newest: 'NEWEST DROP',
    'price-low': 'PRICE: LOW TO HIGH',
    'price-high': 'PRICE: HIGH TO LOW',
    popular: 'MOST POPULAR'
  }[sortBy];

  return (
    <div className="w-full bg-black min-h-screen py-12">
      <SEO title="Shop Collection" description="Discover our full collection of premium organic cotton tees." />

      <div className="max-w-7xl mx-auto px-4">
        
        {/* Layout Categorized Header Segment Wrapper */}
        <div className="pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-neutral-900">
          <div>
            <span className="text-[10px] font-black text-brand-red tracking-widest uppercase block mb-1">COLLECTION</span>
            <h1 className="text-white text-5xl font-black font-impact tracking-tight uppercase">
              SHOP ALL TEES
            </h1>
          </div>
          <span className="text-neutral-500 text-xs font-bold uppercase tracking-wider">
            {sortedProducts.length} ARTICLES DISPLAYED
          </span>
        </div>

        {/* Primary filter trigger bar & Search */}
        <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 mb-8 border-b border-neutral-900">
          
          {/* Quick Filter Selection Tabs - Rounded Luxury Style */}
          <div className="flex flex-wrap gap-1.5">
            {['all', 'classic', 'graphic', 'oversized'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-5 py-2 text-[10px] font-black tracking-widest uppercase rounded-full transition-all cursor-pointer ${
                  currentCategory === cat
                    ? 'bg-brand-red text-white'
                    : 'bg-neutral-950/40 text-neutral-500 hover:text-white hover:bg-neutral-900/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">

            {/* Search Input Box */}
            <div className="relative flex items-center bg-neutral-950 border border-neutral-900 focus-within:border-neutral-700 transition rounded-full px-3 py-1">
              <input
                type="text"
                placeholder="Search tees..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="bg-transparent text-white px-2 py-1 pl-6 text-[10px] font-bold tracking-widest placeholder-neutral-700 focus:outline-none w-full md:w-56 uppercase"
              />
              <Search className="absolute left-4.5 text-neutral-700" size={12} />
            </div>

            {/* Grid / List Toggle */}
            <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-900 rounded-full p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-full transition cursor-pointer ${
                  viewMode === 'grid' ? 'bg-brand-red text-white' : 'text-neutral-500 hover:text-white'
                }`}
                title="Grid View"
              >
                <Grid3X3 size={12} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-full transition cursor-pointer ${
                  viewMode === 'list' ? 'bg-brand-red text-white' : 'text-neutral-500 hover:text-white'
                }`}
                title="List View"
              >
                <List size={12} />
              </button>
            </div>

            {/* Mobile Filters Toggle Button */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="lg:hidden flex items-center gap-2 border border-neutral-900 bg-neutral-950 hover:bg-neutral-900/80 px-4 py-2 text-[10px] font-black tracking-widest text-neutral-400 hover:text-white cursor-pointer rounded-full"
            >
              <SlidersHorizontal size={12} />
              FILTERS
            </button>

            {/* Sorting Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                className="relative flex items-center bg-[#0C0C0F] border border-neutral-900 px-4 py-2 text-[10px] font-black tracking-widest text-neutral-400 hover:text-white cursor-pointer select-none rounded-full"
              >
                <span>{sortLabel}</span>
                <ChevronDown size={12} className="ml-2 text-neutral-600" />
              </button>

              {isSortDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsSortDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-[#0F0F11] border border-neutral-900 rounded-luxury shadow-luxury z-20">
                    {[
                      { id: 'newest', name: 'NEWEST DROP' },
                      { id: 'price-low', name: 'PRICE: LOW TO HIGH' },
                      { id: 'price-high', name: 'PRICE: HIGH TO LOW' },
                      { id: 'popular', name: 'MOST POPULAR' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setSortBy(opt.id);
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-[10px] font-bold tracking-widest uppercase transition ${
                          sortBy === opt.id ? 'text-brand-red bg-neutral-900/50' : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                        }`}
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>
        </div>

        {/* Split Grid for Filters & Listings */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Filters Sidebar Column - Hidden on Mobile unless toggled */}
          <div className={`lg:col-span-3 space-y-6 ${showMobileFilters ? 'block animate-slide-down' : 'hidden lg:block'}`}>
            
            {/* Filter Section: Size */}
            <div className="bg-neutral-950/20 p-6 rounded-luxury border border-neutral-900/40">
              <h4 className="text-white text-[10px] font-black tracking-widest uppercase mb-4 border-b border-neutral-900/50 pb-2">
                FILTER BY SIZE
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {['all', 'S', 'M', 'L', 'XL', '2XL'].map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`w-10 h-10 text-[9px] font-black tracking-widest uppercase rounded-full border transition cursor-pointer flex items-center justify-center ${
                      selectedSize === sz
                        ? 'bg-brand-red border-brand-red text-white'
                        : 'border-neutral-900 text-neutral-500 hover:text-white hover:border-neutral-700'
                    }`}
                  >
                    {sz === 'all' ? 'ALL' : sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Section: Color */}
            <div className="bg-neutral-950/20 p-6 rounded-luxury border border-neutral-900/40">
              <h4 className="text-white text-[10px] font-black tracking-widest uppercase mb-4 border-b border-neutral-900/50 pb-2">
                FILTER BY COLOR
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {['all', 'white', 'black', 'navy', 'green', 'pink', 'blue'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-3 py-1.5 text-[9px] font-black tracking-widest uppercase border transition cursor-pointer rounded-full ${
                      selectedColor === color
                        ? 'bg-brand-red border-brand-red text-white'
                        : 'border-neutral-900 text-neutral-500 hover:text-white hover:border-neutral-700'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Section: Fit */}
            <div className="bg-neutral-950/20 p-6 rounded-luxury border border-neutral-900/40">
              <h4 className="text-white text-[10px] font-black tracking-widest uppercase mb-4 border-b border-neutral-900/50 pb-2">
                FIT STYLE
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {['all', 'boxy', 'streetwear', 'relaxed', 'polo'].map((fit) => (
                  <button
                    key={fit}
                    onClick={() => setSelectedFit(fit)}
                    className={`px-3 py-1.5 text-[9px] font-black tracking-widest uppercase border transition cursor-pointer rounded-full ${
                      selectedFit === fit
                        ? 'bg-brand-red border-brand-red text-white'
                        : 'border-neutral-900 text-neutral-500 hover:text-white hover:border-neutral-700'
                    }`}
                  >
                    {fit}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Section: Neck Style */}
            <div className="bg-neutral-950/20 p-6 rounded-luxury border border-neutral-900/40">
              <h4 className="text-white text-[10px] font-black tracking-widest uppercase mb-4 border-b border-neutral-900/50 pb-2">
                NECKLINE
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {['all', 'round neck', 'polo neck', 'crew neck'].map((neck) => (
                  <button
                    key={neck}
                    onClick={() => setSelectedNeck(neck)}
                    className={`px-3 py-1.5 text-[9px] font-black tracking-widest uppercase border transition cursor-pointer rounded-full ${
                      selectedNeck === neck
                        ? 'bg-brand-red border-brand-red text-white'
                        : 'border-neutral-900 text-neutral-500 hover:text-white hover:border-neutral-700'
                    }`}
                  >
                    {neck.replace(' neck', '')}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Section: Pattern */}
            <div className="bg-neutral-950/20 p-6 rounded-luxury border border-neutral-900/40">
              <h4 className="text-white text-[10px] font-black tracking-widest uppercase mb-4 border-b border-neutral-900/50 pb-2">
                PATTERN
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {['all', 'solid', 'graphic'].map((patt) => (
                  <button
                    key={patt}
                    onClick={() => setSelectedPattern(patt)}
                    className={`px-3 py-1.5 text-[9px] font-black tracking-widest uppercase border transition cursor-pointer rounded-full ${
                      selectedPattern === patt
                        ? 'bg-brand-red border-brand-red text-white'
                        : 'border-neutral-900 text-neutral-500 hover:text-white hover:border-neutral-700'
                    }`}
                  >
                    {patt}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Section: Price Slider */}
            <div className="bg-neutral-950/20 p-6 rounded-luxury border border-neutral-900/40">
              <div className="flex justify-between items-center mb-4 border-b border-neutral-900/50 pb-2">
                <h4 className="text-white text-[10px] font-black tracking-widest uppercase">
                  MAXIMUM PRICE
                </h4>
                <span className="text-[10px] text-neutral-400 font-bold">₹{maxPrice}</span>
              </div>
              <input
                type="range"
                min="200"
                max="600"
                step="10"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                className="w-full accent-brand-red bg-neutral-900 cursor-pointer h-1 rounded-none outline-none"
              />
              <div className="flex justify-between text-[8px] text-neutral-600 font-bold mt-2">
                <span>₹200</span>
                <span>₹600</span>
              </div>
            </div>

            {/* Filter Section: Availability */}
            <div className="bg-neutral-950/20 p-6 rounded-luxury border border-neutral-900/40">
              <h4 className="text-white text-[10px] font-black tracking-widest uppercase mb-4 border-b border-neutral-900/50 pb-2">
                STOCK AVAILABILITY
              </h4>
              <div className="space-y-2.5 text-[9px] font-bold tracking-widest uppercase">
                {[
                  { id: 'all', label: 'SHOW ALL' },
                  { id: 'in-stock', label: 'IN STOCK ONLY' },
                  { id: 'low-stock', label: 'LIMITED RUN STOCK' }
                ].map((av) => (
                  <label key={av.id} className="flex items-center gap-2.5 cursor-pointer text-neutral-500 hover:text-white select-none">
                    <input
                      type="radio"
                      name="availability"
                      checked={selectedAvailability === av.id}
                      onChange={() => setSelectedAvailability(av.id)}
                      className="accent-brand-red cursor-pointer"
                    />
                    <span className={selectedAvailability === av.id ? 'text-white' : ''}>{av.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Reset Filters */}
            <button
              onClick={clearAllFilters}
              className="w-full bg-neutral-950 hover:bg-neutral-900 border border-neutral-900 hover:border-neutral-700 text-neutral-400 hover:text-white text-[10px] font-black tracking-widest py-3 uppercase transition rounded-full flex items-center justify-center gap-2 cursor-pointer"
            >
              <X size={12} />
              RESET FILTERS
            </button>

          </div>

          {/* Product Grid / List Column */}
          <div className="lg:col-span-9">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 animate-pulse">
                {[...Array(6)].map((_, i) => <div key={i} className="aspect-[3/4] bg-neutral-950 rounded-luxury" />)}
              </div>
            ) : sortedProducts.length > 0 ? (
              <div className="space-y-8">
                {/* Grid View */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-12 animate-fade-in">
                    {displayedProducts.map((product) => <ProductCard key={product.id} {...product} />)}
                  </div>
                )}

                {/* List View */}
                {viewMode === 'list' && (
                  <div className="flex flex-col gap-4 animate-fade-in">
                    {displayedProducts.map((product) => (
                      <Link
                        key={product.id}
                        to={`/product/${product.id}`}
                        className="flex gap-5 bg-neutral-950/20 border border-neutral-900/40 rounded-luxury p-4 hover:border-neutral-700 transition group"
                      >
                        <div className="w-24 h-28 shrink-0 rounded-lg overflow-hidden bg-neutral-900">
                          <img src={product.image} alt={product.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition duration-500" loading="lazy" />
                        </div>
                        <div className="flex flex-col justify-between flex-1 min-w-0">
                          <div>
                            <span className="text-[8px] font-black text-brand-red tracking-widest uppercase">{product.category}</span>
                            <h3 className="text-white font-bold text-sm uppercase mt-0.5 truncate">{product.title}</h3>
                            <p className="text-neutral-500 text-[10px] mt-1 line-clamp-2">{product.description}</p>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-white font-black text-sm">₹{product.price?.toFixed(2)}</span>
                            {product.tag && (
                              <span className="bg-brand-red text-white text-[7px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase">{product.tag}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Load More */}
                {hasMore && (
                  <div className="flex flex-col items-center gap-3 pt-4">
                    <button
                      onClick={() => setDisplayCount(prev => prev + 12)}
                      className="bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-600 text-white font-black text-[10px] tracking-widest px-10 py-3.5 rounded-full uppercase transition cursor-pointer"
                    >
                      LOAD MORE ({sortedProducts.length - displayCount} remaining)
                    </button>
                    <p className="text-neutral-600 text-[9px] font-bold tracking-wider uppercase">
                      Showing {displayedProducts.length} of {sortedProducts.length} products
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full text-center py-24 border border-dashed border-neutral-900 rounded-luxury flex flex-col justify-center items-center gap-4">
                <span className="text-xs font-bold tracking-widest text-neutral-600 uppercase">NO PRODUCTS MATCH YOUR ACTIVE FILTERS</span>
                <button
                  onClick={clearAllFilters}
                  className="bg-brand-red hover:bg-red-700 text-white font-black text-[10px] tracking-widest px-6 py-2.5 uppercase transition cursor-pointer rounded-full"
                >
                  CLEAR FILTERS
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Recently Viewed Section */}
        {recentlyViewed.length > 0 && (
          <section className="mt-20 pt-12 border-t border-neutral-900">
            <div className="flex items-center gap-3 mb-8">
              <Eye size={14} className="text-brand-red" />
              <h3 className="text-white font-black text-xs tracking-widest uppercase">RECENTLY VIEWED</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {recentlyViewed.slice(0, 5).map((product) => <ProductCard key={product.id} {...product} />)}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}