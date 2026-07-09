import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, Info } from 'lucide-react';
import { FAQ_ITEMS } from '../lib/mockApi';
import SEO from '../components/SEO';

export default function Faq() {
  const [activeCategory, setActiveCategory] = useState(FAQ_ITEMS[0].category);
  const [expandedIndices, setExpandedIndices] = useState({}); // Stores expanded question indexes by category
  const [searchQuery, setSearchQuery] = useState('');

  const toggleQuestion = (category, qIdx) => {
    const key = `${category}-${qIdx}`;
    setExpandedIndices((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Filter FAQs based on search query
  const filteredFaqs = FAQ_ITEMS.map((cat) => {
    const filteredQuestions = cat.questions.filter(
      (item) =>
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return {
      category: cat.category,
      questions: filteredQuestions
    };
  }).filter((cat) => cat.questions.length > 0);

  return (
    <div className="w-full bg-black min-h-screen py-16 md:py-24">
      <SEO title="FAQ" description="Have questions about CosoStyle garments? Read our FAQ regarding fit guide, shipping rates, and sizing recommendations." />

      <div className="max-w-4xl mx-auto px-4 space-y-12">
        
        {/* Header Block */}
        <div className="border-b border-neutral-900 pb-8 text-center space-y-4">
          <div className="inline-block border border-neutral-850 px-3 py-1.5 uppercase text-brand-red text-[10px] font-black tracking-widest">
            SUPPORT HUB
          </div>
          <h1 className="text-white text-5xl md:text-6xl font-black font-impact tracking-tight uppercase leading-none">
            FREQUENTLY ASKED<br />
            <span className="text-brand-red">QUESTIONS</span>
          </h1>
          
          {/* FAQ Search Bar */}
          <div className="max-w-md mx-auto relative flex items-center bg-neutral-950 border border-neutral-900 focus-within:border-neutral-700 transition mt-6">
            <input
              type="text"
              placeholder="SEARCH QUESTIONS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-white px-4 py-3 pl-10 text-[10px] font-black tracking-widest placeholder-neutral-700 focus:outline-none w-full uppercase"
            />
            <Search className="absolute left-3.5 text-neutral-700" size={14} />
          </div>
        </div>

        {/* Tab-like Category Selectors (Hidden when searching) */}
        {!searchQuery && (
          <div className="flex border-b border-neutral-900 overflow-x-auto gap-2">
            {FAQ_ITEMS.map((cat) => (
              <button
                key={cat.category}
                onClick={() => setActiveCategory(cat.category)}
                className={`pb-4 px-4 text-[10px] font-black tracking-widest uppercase transition-colors border-b shrink-0 cursor-pointer ${
                  activeCategory === cat.category
                    ? 'text-white border-brand-red'
                    : 'text-neutral-500 border-transparent hover:text-neutral-300'
                }`}
              >
                {cat.category}
              </button>
            ))}
          </div>
        )}

        {/* Accordions List Workspace */}
        <div className="space-y-8">
          {searchQuery ? (
            // Search Results Layout
            filteredFaqs.length > 0 ? (
              filteredFaqs.map((cat) => (
                <div key={cat.category} className="space-y-4">
                  <h3 className="text-brand-red font-black text-xs tracking-widest uppercase mb-4 border-b border-neutral-950 pb-2">
                    {cat.category}
                  </h3>
                  <div className="space-y-px">
                    {cat.questions.map((item, qIdx) => {
                      const key = `${cat.category}-${qIdx}`;
                      const isExpanded = expandedIndices[key];

                      return (
                        <div key={qIdx} className="border-b border-neutral-900 py-4">
                          <button
                            onClick={() => toggleQuestion(cat.category, qIdx)}
                            className="w-full flex items-center justify-between text-left text-xs font-black tracking-widest uppercase text-white hover:text-brand-red transition cursor-pointer"
                          >
                            <span>{item.q}</span>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          {isExpanded && (
                            <p className="text-neutral-500 text-[11px] font-semibold mt-3 tracking-wide leading-relaxed uppercase animate-slide-down">
                              {item.a}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="border border-dashed border-neutral-900 py-16 text-center">
                <span className="text-xs text-neutral-600 font-bold uppercase tracking-wider">
                  NO RESULTS MATCHING YOUR INQUIRY SEARCH FILTER.
                </span>
              </div>
            )
          ) : (
            // Tabbed Category Layout
            FAQ_ITEMS.filter((cat) => cat.category === activeCategory).map((cat) => (
              <div key={cat.category} className="space-y-px border-t border-neutral-900/40">
                {cat.questions.map((item, qIdx) => {
                  const key = `${cat.category}-${qIdx}`;
                  const isExpanded = expandedIndices[key];

                  return (
                    <div key={qIdx} className="border-b border-neutral-900 py-4">
                      <button
                        onClick={() => toggleQuestion(cat.category, qIdx)}
                        className="w-full flex items-center justify-between text-left text-xs font-black tracking-widest uppercase text-white hover:text-brand-red transition cursor-pointer"
                      >
                        <span>{item.q}</span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      {isExpanded && (
                        <p className="text-neutral-500 text-[11px] font-semibold mt-3 tracking-wide leading-relaxed uppercase animate-slide-down">
                          {item.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Quick Sizing Guide Box */}
        <div className="border border-neutral-900 bg-neutral-950/20 p-6 flex items-start gap-4">
          <Info size={18} className="text-brand-red mt-0.5 shrink-0" />
          <div className="space-y-2">
            <h4 className="text-white font-black text-xs tracking-widest uppercase">
              STUDIO FIT REMINDER
            </h4>
            <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider leading-relaxed">
              CosoStyle tees implement an extended shoulder cut with box drafting (true boxy shape). If you prefer a tighter, streamlined profile, select one size below your normal metrics. Feel free to contact studio support for custom advice.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
