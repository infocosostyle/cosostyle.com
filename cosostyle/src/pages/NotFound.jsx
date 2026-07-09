import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function NotFound() {
  return (
    <div className="w-full bg-black min-h-[70vh] flex flex-col justify-center items-center text-center px-4">
      <SEO title="Page Not Found" />
      <div className="space-y-4">
        <h1 className="text-brand-red text-8xl md:text-9xl font-black font-impact tracking-tighter leading-none animate-pulse">
          404
        </h1>
        <h2 className="text-white text-2xl font-black font-impact tracking-widest uppercase">
          WORKSPACE NOT FOUND
        </h2>
        <p className="text-neutral-500 text-xs tracking-wider max-w-xs mx-auto leading-relaxed uppercase">
          The coordinate index location you request does not map to any studio route.
        </p>
        <div className="pt-6 flex flex-wrap gap-4 justify-center">
          <Link
            to="/"
            className="bg-neutral-900 border border-neutral-800 text-white font-black text-[10px] tracking-widest px-6 py-3.5 uppercase transition hover:bg-neutral-800"
          >
            HOME BASE
          </Link>
          <Link
            to="/shop"
            className="bg-brand-red hover:bg-red-700 text-white font-black text-[10px] tracking-widest px-6 py-3.5 uppercase transition"
          >
            DISCOVER TEES
          </Link>
        </div>
      </div>
    </div>
  );
}
