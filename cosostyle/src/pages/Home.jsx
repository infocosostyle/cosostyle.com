import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Container, Truck, RefreshCw, Star, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import Manifesto from '../components/Manifesto';
import ProductCard from '../components/ProductCard';
import { api } from '../lib/api';
import SEO from '../components/SEO';
import { useAppContext } from '../context/AppContext';

export default function Home() {
  const { subscribeNewsletter } = useAppContext();
  const [products, setProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  // Flash Sale Countdown (resets every 24 hours from page load)
  const [flashSaleEnd] = useState(() => {
    const end = new Date();
    end.setHours(end.getHours() + 12);
    return end;
  });
  const [countdown, setCountdown] = useState({ hours: 11, minutes: 59, seconds: 59 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = flashSaleEnd - now;
      if (diff <= 0) {
        setCountdown({ hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({ hours, minutes, seconds });
    }, 1000);
    return () => clearInterval(timer);
  }, [flashSaleEnd]);

  useEffect(() => {
    async function loadHomeData() {
      try {
        setLoading(true);
        const productList = await api.getProducts();
        setProducts(productList);
        const bannerList = await api.getBanners();
        setBanners(bannerList);
      } catch (err) {
        console.error('Failed to load homepage telemetry:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  // Slider timing auto cycle
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners]);

  const handleNextBanner = () => setActiveBannerIdx((prev) => (prev + 1) % banners.length);
  const handlePrevBanner = () => setActiveBannerIdx((prev) => (prev - 1 + banners.length) % banners.length);

  const handleSubscribeNewsletter = async (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterLoading(true);
    const success = await subscribeNewsletter(newsletterEmail);
    if (success) {
      setNewsletterSubscribed(true);
      setNewsletterEmail('');
    }
    setNewsletterLoading(false);
  };

  const pad = (n) => String(n).padStart(2, '0');

  // Split products into categories for Home sections
  const studioPicks = products.slice(0, 4);
  const bestSellers = products.filter(p => p.tag === 'BESTSELLER' || p.tag === 'LIMITED').slice(0, 4);
  const newArrivals = products.filter(p => p.tag === 'NEW').slice(0, 4);
  const flashSaleProducts = products.slice(0, 4); // Use first 4 with discount display

  return (
    <div className="w-full bg-black">
      <SEO title="Luxury Fashion & Streetwear" description="CosoStyle crafts heavyweight 240 GSM organic cotton tees in limited batch runs." />

      {/* Hero Banner Section */}
      <section className="relative w-full min-h-[85vh] flex items-center overflow-hidden">
        {banners.length > 0 ? (
          <div className="absolute inset-0 w-full h-full">
            {banners.map((banner, idx) => (
              <div
                key={banner._id || idx}
                className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                  idx === activeBannerIdx ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                {banner.videoUrl ? (
                  <video
                    src={banner.videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover filter brightness-[0.4]"
                  />
                ) : (
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className="absolute inset-0 w-full h-full object-cover filter brightness-[0.4] scale-102"
                  />
                )}
                {/* Text Content overlay */}
                <div className="absolute inset-0 flex flex-col justify-center items-start px-6 md:px-16 lg:px-24 bg-gradient-to-r from-black/80 via-black/40 to-transparent">
                  <div className="max-w-4xl space-y-6">
                    <div className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 bg-brand-red rounded-full"></span>
                      <span className="text-[10px] font-black text-brand-red tracking-widest uppercase">AW '26 COLLECTION</span>
                    </div>
                    <h1 className="text-white text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black font-impact tracking-tight leading-[0.95] uppercase">
                      {banner.title.split('.')[0]}<br />
                      <span className="text-brand-red">{banner.title.split('.')[1] || 'PURE INTENT'}</span>
                    </h1>
                    <p className="text-neutral-300 text-xs md:text-sm max-w-lg leading-relaxed tracking-wide font-medium uppercase">
                      {banner.subtitle}
                    </p>
                    <div className="pt-6">
                      <Link
                        to={banner.link}
                        className="bg-brand-red hover:bg-red-700 text-white font-black text-xs tracking-widest px-8 py-4 flex items-center gap-3 uppercase transition-all duration-300 rounded-full shadow-lg hover:shadow-brand-red/20 inline-flex"
                      >
                        EXPLORE DROPS <ArrowRight size={14} strokeWidth={3} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Slider arrows */}
            {banners.length > 1 && (
              <>
                <button
                  onClick={handlePrevBanner}
                  className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/40 text-white hover:bg-brand-red transition rounded-full backdrop-blur-md border border-neutral-900"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={handleNextBanner}
                  className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/40 text-white hover:bg-brand-red transition rounded-full backdrop-blur-md border border-neutral-900"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>
        ) : (
          /* Fallback static poster banner */
          <div className="absolute inset-0 bg-neutral-950 flex flex-col justify-center items-start px-6 md:px-16 pt-16 pb-24">
            <h1 className="text-white text-6xl md:text-8xl font-black font-impact uppercase leading-none">
              PURE COTTON. <span className="text-brand-red">PURE INTENT.</span>
            </h1>
          </div>
        )}
      </section>

      {/* Feature Value Proposition Banner */}
      <section className="w-full bg-[#050507] py-10 border-y border-neutral-900 select-none">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex items-start gap-4">
            <ShieldCheck className="text-brand-red mt-0.5 shrink-0" size={18} />
            <div>
              <h4 className="text-[10px] font-black tracking-widest text-white uppercase">100% PURE COTTON</h4>
              <p className="text-[10px] text-neutral-500 font-semibold mt-1 uppercase">Combed & organic weave</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Container className="text-brand-red mt-0.5 shrink-0" size={18} />
            <div>
              <h4 className="text-[10px] font-black tracking-widest text-white uppercase">240 GSM HEAVYWEIGHT</h4>
              <p className="text-[10px] text-neutral-500 font-semibold mt-1 uppercase">Structured drape forms</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Truck className="text-brand-red mt-0.5 shrink-0" size={18} />
            <div>
              <h4 className="text-[10px] font-black tracking-widest text-white uppercase">FREE DISPATCH OVER ₹999</h4>
              <p className="text-[10px] text-neutral-500 font-semibold mt-1 uppercase">Worldwide express shipment</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <RefreshCw className="text-brand-red mt-0.5 shrink-0" size={18} />
            <div>
              <h4 className="text-[10px] font-black tracking-widest text-white uppercase">LIMITED BATCH RUNS</h4>
              <p className="text-[10px] text-neutral-500 font-semibold mt-1 uppercase">Zero inventory waste</p>
            </div>
          </div>
        </div>
      </section>

      {/* Category Navigation showcase - Circular Icons */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center space-y-2 mb-12">
          <span className="text-[10px] font-black text-brand-red tracking-widest uppercase">CATEGORIES</span>
          <h2 className="text-white text-3xl font-black font-impact tracking-wide uppercase">SHOP BY COLLECTION</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { name: 'Oversized Drops', slug: 'oversized', desc: 'Relaxed geometry cuts', image: '/src/assets/tshirt 5/05-05-2025 christian00499.jpg' },
            { name: 'Classic Cuts', slug: 'classic', desc: 'Minimal layout silhouettes', image: '/src/assets/tshirt 1/05-05-2025 christian00428.jpg' },
            { name: 'Graphic Tees', slug: 'graphic', desc: 'Vibrant studio illustrations', image: '/src/assets/tshirt 4/05-05-2025 christian00483.jpg' }
          ].map((cat) => (
            <Link
              to={`/shop?category=${cat.slug}`}
              key={cat.slug}
              className="group relative h-96 rounded-luxury overflow-hidden border border-neutral-900 flex flex-col justify-end p-6 bg-neutral-950"
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-transform duration-700 scale-100 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-0" />
              <div className="relative z-10 space-y-1">
                <span className="text-[9px] font-black text-brand-red tracking-widest uppercase">EXPLORE COLLECTION</span>
                <h3 className="text-white font-bold text-lg uppercase tracking-wide">{cat.name}</h3>
                <p className="text-neutral-400 text-[10px] font-medium uppercase">{cat.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Best Sellers section */}
      <section className="max-w-7xl mx-auto px-6 py-16 space-y-12">
        <div className="flex items-end justify-between border-b border-neutral-900 pb-4">
          <div>
            <span className="text-[10px] font-black text-brand-red tracking-widest uppercase block mb-1">BEST SELLERS</span>
            <h2 className="text-white text-3xl font-black font-impact tracking-wide uppercase">TRENDING PIECES</h2>
          </div>
          <Link to="/shop" className="text-[10px] font-black text-neutral-500 hover:text-white tracking-widest uppercase flex items-center gap-1.5 transition">
            VIEW ALL <ArrowRight size={10} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="aspect-[3/4] bg-neutral-950 rounded-luxury animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {bestSellers.map((product) => <ProductCard key={product.id} {...product} />)}
          </div>
        )}
      </section>

      {/* ── FLASH SALE SECTION ─────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-red-950/40 via-black to-red-950/40 border-y border-red-900/30 py-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-brand-red rounded-full flex items-center justify-center animate-pulse">
                <Zap size={16} className="text-white" />
              </div>
              <div>
                <span className="text-[10px] font-black text-brand-red tracking-widest uppercase block">LIMITED TIME</span>
                <h2 className="text-white text-3xl font-black font-impact tracking-wide uppercase">FLASH SALE — 15% OFF</h2>
              </div>
            </div>

            {/* Countdown Timer */}
            <div className="flex items-center gap-3">
              <span className="text-neutral-500 text-[10px] font-black tracking-widest uppercase">ENDS IN:</span>
              {[pad(countdown.hours), pad(countdown.minutes), pad(countdown.seconds)].map((val, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className="bg-neutral-950 border border-neutral-800 rounded-lg w-14 h-14 flex flex-col items-center justify-center shadow-lg">
                    <span className="text-white font-black text-xl tabular-nums">{val}</span>
                    <span className="text-neutral-600 text-[8px] font-bold tracking-widest uppercase">
                      {['HRS', 'MIN', 'SEC'][i]}
                    </span>
                  </div>
                  {i < 2 && <span className="text-brand-red font-black text-xl">:</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Flash Sale Products */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => <div key={i} className="aspect-[3/4] bg-neutral-950 rounded-luxury animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
              {flashSaleProducts.map((product) => (
                <div key={product.id} className="relative">
                  {/* Flash Sale badge overlay */}
                  <div className="absolute top-2 left-2 z-20 bg-brand-red text-white text-[8px] font-black tracking-widest px-2.5 py-1 rounded-full shadow-lg uppercase flex items-center gap-1">
                    <Zap size={8} /> 15% OFF
                  </div>
                  <ProductCard {...product} />
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="text-center mt-10">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white font-black text-xs tracking-widest px-10 py-4 uppercase transition rounded-full shadow-lg hover:shadow-brand-red/20"
            >
              SHOP FLASH SALE <ArrowRight size={14} strokeWidth={3} />
            </Link>
            <p className="text-neutral-600 text-[9px] font-bold tracking-widest uppercase mt-3">Use code COSO15 at checkout</p>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="max-w-7xl mx-auto px-6 py-20 space-y-12">
        <div className="flex items-end justify-between border-b border-neutral-900 pb-4">
          <div>
            <span className="text-[10px] font-black text-brand-red tracking-widest uppercase block mb-1">NEW ARRIVALS</span>
            <h2 className="text-white text-3xl font-black font-impact tracking-wide uppercase">THE LATEST INVENTORY</h2>
          </div>
          <Link to="/shop" className="text-[10px] font-black text-neutral-500 hover:text-white tracking-widest uppercase flex items-center gap-1.5 transition">
            SHOP THE INVENTORY <ArrowRight size={10} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-neutral-950 rounded-luxury animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        )}
      </section>

      {/* Lookbook / Outfit Inspiration */}
      <section className="bg-neutral-950/20 py-24 border-y border-neutral-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <span className="text-[10px] font-black text-brand-red tracking-widest uppercase block">STUDIO CHRONICLES</span>
              <h2 className="text-white text-4xl sm:text-5xl font-black font-impact tracking-tight uppercase leading-none">
                AW '26 STYLE LOOKBOOK
              </h2>
              <p className="text-neutral-400 text-xs md:text-sm leading-relaxed uppercase">
                Minimal shapes meet absolute drape stability. Witness the collection styled on set in the industrial warehouse chronicles. Each setup layers raw textures with fine heavyweight cotton jersey.
              </p>
              <div className="pt-2">
                <Link to="/blog" className="inline-flex items-center gap-2 text-[10px] font-black text-brand-red hover:underline tracking-widest uppercase">
                  EXPLORE THE DIARY <ArrowRight size={12} />
                </Link>
              </div>
            </div>
            <div className="lg:col-span-7 grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="aspect-[3/4] bg-neutral-950 rounded-luxury overflow-hidden border border-neutral-900">
                  <img src="/src/assets/tshirt 1/05-05-2025 christian00438.jpg" className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition duration-700" alt="" />
                </div>
                <div className="aspect-square bg-neutral-950 rounded-luxury overflow-hidden border border-neutral-900">
                  <img src="/src/assets/tshirt 2/05-05-2025 christian00452.jpg" className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition duration-700" alt="" />
                </div>
              </div>
              <div className="space-y-4 pt-12">
                <div className="aspect-square bg-neutral-950 rounded-luxury overflow-hidden border border-neutral-900">
                  <img src="/src/assets/tshirt 3/05-05-2025 christian00474.jpg" className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition duration-700" alt="" />
                </div>
                <div className="aspect-[3/4] bg-neutral-950 rounded-luxury overflow-hidden border border-neutral-900">
                  <img src="/src/assets/tshirt 5/05-05-2025 christian00510.jpg" className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition duration-700" alt="" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Testimonials */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <div className="space-y-2 mb-16">
          <span className="text-[10px] font-black text-brand-red tracking-widest uppercase">TESTIMONIALS</span>
          <h2 className="text-white text-3xl font-black font-impact tracking-wide uppercase">VERIFIED VERDICTS</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { quote: 'Collar stays completely stiff even after dozens of machine washes. Absolute masterpiece weight.', author: 'AARON K., MUMBAI' },
            { quote: 'The oversized cut is perfect. Does not sag down like polyester options. Truly boxy drape.', author: 'REBECCA L., NEW DELHI' },
            { quote: 'No branding labels, no flash. Just rich heavy cotton jersey. Highly recommended drop.', author: 'SIDDHARTH M., BANGALORE' }
          ].map((test, index) => (
            <div key={index} className="bg-neutral-950/20 p-8 border border-neutral-900/60 rounded-luxury shadow-luxury space-y-4 flex flex-col justify-between">
              <div className="flex justify-center gap-1.5 text-brand-red">
                {[...Array(5)].map((_, i) => <Star key={i} size={12} className="fill-brand-red" />)}
              </div>
              <p className="text-neutral-400 text-xs font-semibold leading-relaxed uppercase">
                "{test.quote}"
              </p>
              <span className="text-[9px] text-white font-black tracking-widest block uppercase">
                {test.author}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="bg-neutral-950/40 py-20 border-t border-neutral-900 select-none">
        <div className="max-w-md mx-auto px-6 text-center space-y-6">
          <span className="text-[10px] font-black text-brand-red tracking-widest uppercase block">JOIN THE CLUB</span>
          <h2 className="text-white text-3xl font-black font-impact tracking-wide uppercase">DISCOVER DROP ANNOUNCEMENTS</h2>
          <p className="text-neutral-500 text-xs uppercase leading-relaxed font-semibold">
            Subscribe to receive private invitations for early drop reservations and limited discount vouchers.
          </p>

          {newsletterSubscribed ? (
            <div className="p-4 bg-green-950/20 border border-green-800 text-green-400 rounded-full text-xs font-black tracking-widest uppercase">
              ✓ THANK YOU FOR JOINING THE CATALOG LIST.
            </div>
          ) : (
            <form onSubmit={handleSubscribeNewsletter} className="flex gap-2">
              <input
                type="email"
                required
                placeholder="YOUR EMAIL ADDRESS"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="bg-black border border-neutral-900 focus:border-neutral-600 text-white text-[10px] font-bold tracking-widest placeholder-neutral-700 outline-none w-full p-3.5 px-6 rounded-full transition uppercase"
              />
              <button
                type="submit"
                disabled={newsletterLoading}
                className="bg-brand-red hover:bg-red-700 disabled:opacity-60 text-white font-black text-[10px] tracking-widest px-8 rounded-full uppercase transition flex items-center gap-2 cursor-pointer shrink-0"
              >
                {newsletterLoading ? '...' : 'JOIN'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}