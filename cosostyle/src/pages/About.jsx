import React from 'react';
import SEO from '../components/SEO';

export default function About() {
  const timeline = [
    { year: '2024', title: 'STUDIO INCUBATION', desc: 'CosoStyle is formed by three designers in a loft with a single knitting machine and a goal to create heavy box-drape cotton without fillers.' },
    { year: '2025', title: 'DROP 01 LAUNCH', desc: 'After 18 months of fiber sourcing, we launch our first collection of 5 heavy box tees. The drop sells out within 48 hours.' },
    { year: '2026', title: 'CIRCULAR SYSTEM', desc: 'We transition our entire supply line to combed organic cotton and implement low-impact botanical washes, cementing our ecological dedication.' }
  ];

  return (
    <div className="w-full bg-black min-h-screen py-16 md:py-24">
      <SEO title="About Us" description="CosoStyle crafts heavyweight 240 GSM organic cotton tees in small batches. Explore our brand story, mission, and sustainability efforts." />

      <div className="max-w-4xl mx-auto px-4 space-y-24">
        
        {/* Intro */}
        <div className="border-b border-neutral-900 pb-8 text-center space-y-4">
          <div className="inline-block border border-neutral-805 px-3 py-1.5 uppercase text-brand-red text-[10px] font-black tracking-widest">
            OUR STORY
          </div>
          <h1 className="text-white text-5xl md:text-6xl font-black font-impact tracking-tight uppercase leading-none">
            WE BELIEVE IN<br />
            <span className="text-brand-red">STRUCTURE & SILENCE.</span>
          </h1>
          <p className="text-neutral-400 text-xs md:text-sm tracking-wide leading-relaxed max-w-xl mx-auto font-medium">
            Trends fade, but structural form lasts. CosoStyle was born from an obsession with the perfect drape. We do not make fast fashion; we make garments to outlast seasons.
          </p>
        </div>

        {/* Brand Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="border border-neutral-900 p-8 space-y-4 bg-neutral-950/20">
            <h3 className="text-white font-black text-sm tracking-widest uppercase">OUR MISSION</h3>
            <p className="text-neutral-500 text-[11px] font-semibold tracking-wide leading-relaxed uppercase">
              To strip away the noise of fast fashion, providing premium heavyweight garments focused on box architecture, clean drape lines, and organic textile integrity.
            </p>
          </div>
          <div className="border border-neutral-900 p-8 space-y-4 bg-neutral-950/20">
            <h3 className="text-white font-black text-sm tracking-widest uppercase">OUR VISION</h3>
            <p className="text-neutral-500 text-[11px] font-semibold tracking-wide leading-relaxed uppercase">
              A minimalist wardrobe built on structure. We envision a future where clothing is purchased less frequently but valued more deeply, creating a slower, healthier cycle.
            </p>
          </div>
        </div>

        {/* Timeline Timeline */}
        <div className="space-y-8">
          <h3 className="text-white font-black text-lg tracking-widest uppercase border-b border-neutral-900 pb-3">
            CHRONOLOGY
          </h3>
          <div className="space-y-8 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-neutral-900">
            {timeline.map((item, idx) => (
              <div key={idx} className="relative pl-10 space-y-1">
                {/* Marker point */}
                <div className="absolute left-[9px] top-1.5 w-2 h-2 rounded-full bg-brand-red border border-black z-10" />
                <span className="text-[10px] text-brand-red font-black tracking-widest block">
                  {item.year} — {item.title}
                </span>
                <p className="text-neutral-500 text-[11px] font-semibold tracking-wide leading-relaxed uppercase max-w-2xl">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Sustainability commitment */}
        <div className="border border-neutral-900 bg-neutral-950 p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="space-y-2">
            <h3 className="text-white font-black text-sm tracking-widest uppercase">
              ENVIRONMENTAL COMMITMENT
            </h3>
            <p className="text-neutral-500 text-[11px] font-semibold tracking-wide leading-relaxed uppercase max-w-xl">
              Every garment is created with 100% organic cotton, sourced from local cooperatives that minimize water irrigation. We dye with bio-enzyme washed pigmentation and pack orders in compostable cornstarch mailers. No microplastics. No compromises.
            </p>
          </div>
          <span className="text-brand-red font-black text-sm tracking-widest uppercase border-l-2 border-brand-red pl-4 shrink-0">
            MADE TO OUTLAST
          </span>
        </div>

      </div>
    </div>
  );
}
