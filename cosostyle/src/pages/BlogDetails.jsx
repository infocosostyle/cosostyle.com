import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import SEO from '../components/SEO';

export default function BlogDetails() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [otherPosts, setOtherPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPostDetails() {
      try {
        setLoading(true);
        const data = await api.getBlog(id);
        setPost(data);

        // Load other posts for recommendation
        const allBlogs = await api.getBlogs();
        const others = allBlogs.filter((p) => (p._id || p.id) !== id).slice(0, 2);
        setOtherPosts(others);
      } catch (err) {
        console.error('Failed to load blog details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPostDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="w-full bg-black min-h-[70vh] flex justify-center items-center">
        <SEO title="Loading Article" />
        <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="w-full bg-black min-h-[70vh] flex flex-col justify-center items-center text-center px-4">
        <SEO title="Article Not Found" />
        <h2 className="text-white font-black font-impact tracking-widest text-3xl uppercase mb-4">
          ARTICLE NOT FOUND
        </h2>
        <p className="text-neutral-500 text-xs tracking-wider mb-8 max-w-xs">
          The editorial article you are seeking does not exist in our system.
        </p>
        <Link 
          to="/blog" 
          className="bg-brand-red hover:bg-red-700 text-white font-black text-xs tracking-widest px-8 py-3.5 uppercase transition"
        >
          RETURN TO CHRONICLES
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-black min-h-screen py-12 md:py-20">
      <SEO title={post.title} description={post.excerpt} image={post.image} />

      <div className="max-w-3xl mx-auto px-4 space-y-10">
        
        {/* Back Link */}
        <Link 
          to="/blog" 
          className="inline-block text-[10px] font-black text-neutral-500 hover:text-white transition tracking-widest uppercase mb-4"
        >
          ← BACK TO CHRONICLES
        </Link>

        {/* Headers */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="bg-brand-red text-white text-[9px] font-black tracking-widest px-2 py-0.5 uppercase">
              {post.category}
            </span>
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">{post.date}</span>
          </div>
          <h1 className="text-white text-3xl sm:text-4xl md:text-5xl font-black font-impact tracking-tight uppercase leading-tight">
            {post.title}
          </h1>
          <p className="text-neutral-400 text-sm font-semibold uppercase tracking-wider border-l-2 border-brand-red pl-4 leading-relaxed">
            {post.excerpt}
          </p>
        </div>

        {/* Feature Image */}
        <div className="aspect-video w-full bg-neutral-950 border border-neutral-900 overflow-hidden">
          <img src={post.image} className="w-full h-full object-cover" alt="" />
        </div>

        {/* Content body */}
        <div className="text-neutral-400 text-sm md:text-base tracking-wide leading-relaxed space-y-6 font-medium">
          {post.content.split('\n\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        {/* Related posts */}
        {otherPosts.length > 0 && (
          <div className="border-t border-neutral-900 pt-16 mt-16 space-y-8">
            <h3 className="text-white font-black text-xs tracking-widest uppercase">
              OTHER EDITORIALS TO EXPLORE
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {otherPosts.map((op) => (
                <Link
                  to={`/blog/${op._id || op.id}`}
                  key={op._id || op.id}
                  className="group flex flex-col border border-neutral-905 bg-neutral-950/20 hover:border-neutral-700 transition"
                >
                  <div className="aspect-video w-full overflow-hidden bg-neutral-950">
                    <img src={op.image} className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition duration-500" alt="" />
                  </div>
                  <div className="p-4 space-y-2">
                    <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider block">{op.date}</span>
                    <h4 className="text-white font-bold text-xs tracking-wide uppercase group-hover:text-brand-red transition line-clamp-1">
                      {op.title}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
