import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import SEO from '../components/SEO';

export default function Blog() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBlogs() {
      try {
        const list = await api.getBlogs();
        setBlogs(list);
      } catch (err) {
        console.error('Failed to load blog articles:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBlogs();
  }, []);

  return (
    <div className="w-full bg-black min-h-screen py-16 md:py-24">
      <SEO title="Editorial Blog" description="Read our latest design diaries, fabric guides, and behind-the-scenes studio articles." />

      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header Block */}
        <div className="border-b border-neutral-900 pb-6 mb-12">
          <span className="text-[10px] text-brand-red font-black tracking-widest uppercase block mb-1">EDITORIALS</span>
          <h1 className="text-white text-5xl font-black font-impact tracking-tight uppercase">
            DESIGN DIARY & CHRONICLES
          </h1>
        </div>

        {loading ? (
          <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin mx-auto my-24"></div>
        ) : blogs.length > 0 ? (
          /* Blog Post Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((post) => (
              <article 
                key={post._id || post.id} 
                className="border border-neutral-900 bg-neutral-950/10 hover:border-neutral-700 transition flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail Image */}
                  <div className="aspect-video w-full bg-neutral-950 border-b border-neutral-900 overflow-hidden relative">
                    <img src={post.image} className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition duration-500" alt={post.title} />
                    <span className="absolute bottom-3 left-3 bg-brand-red text-white text-[9px] font-black tracking-widest px-2 py-0.5 z-10">
                      {post.category}
                    </span>
                  </div>

                  <div className="p-6 space-y-3">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">
                      {post.date}
                    </span>
                    <h3 className="text-white font-bold text-sm tracking-wide uppercase line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-neutral-500 text-[11px] font-medium tracking-wide leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <Link
                    to={`/blog/${post._id || post.id}`}
                    className="inline-block text-[10px] font-black text-brand-red hover:text-white transition tracking-widest uppercase"
                  >
                    READ ARTICLE →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest text-center py-24 border border-dashed border-neutral-900">
            No editorial posts found in the CMS.
          </p>
        )}

      </div>
    </div>
  );
}
