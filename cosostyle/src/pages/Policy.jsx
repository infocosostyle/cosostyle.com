import React from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function Policy() {
  const { type } = useParams();

  const policyData = {
    shipping: {
      title: 'SHIPPING POLICY',
      desc: 'Information regarding logistics, tracking, and international shipping rates.',
      content: [
        'DELIVERY RATES & SPEED: CosoStyle provides standard international shipping to most global destinations. Shipping is free for orders exceeding ₹999. Standard delivery fees of ₹99 apply to other orders. Overnight and express options are calculated dynamically during checkout.',
        'PROCESSING TIMES: Orders are processed in our Soho studio within 1-2 business days. Limited edition drop periods may require an additional processing day.',
        'DELIVERY ESTIMATES: Standard shipping takes 5-10 business days. Express shipping takes 2-3 business days. Overnight delivery is delivered next morning.',
        'DUTIES & TAXES: Customers are responsible for any custom duties or import clearance fees calculated by local regulatory agencies.'
      ]
    },
    returns: {
      title: 'RETURNS & EXCHANGES',
      desc: 'Simple return guidelines and exchange policies.',
      content: [
        '30-DAY RETURNING WINDOW: We accept returns on unworn, unwashed, and undamaged items with original product labels attached within 30 days of shipment receipt.',
        'EASY EXCHANGES: Exchange size requests can be initiated directly from your member dashboard. Replacement items are shipped free of charge.',
        'REFUND TIMELINES: Approved returns are processed within 5 business days. Funds are credited back to the original payment card or method.',
        'EXCLUSIONS: Gift vouchers, personalized items, and clearance archive items are final sale.'
      ]
    },
    privacy: {
      title: 'PRIVACY POLICY',
      desc: 'How we manage, store, and safeguard your personal profile information.',
      content: [
        'PROFILE COLLECTION: We store name, billing/shipping addresses, phone numbers, and email accounts to process orders and improve customer experiences.',
        'SECURITY ENCRYPTION: All credentials and card transactions are encrypted using secure sockets layer (SSL) certificates and secure hash models.',
        'COOKIES & CACHES: Caches are utilized to store login sessions and cart item arrays in your browser storage.',
        'THIRD PARTY AGENTS: Your data is never sold. Information is shared strictly with shipping couriers and payment gateways to process transactions.'
      ]
    },
    terms: {
      title: 'TERMS & CONDITIONS',
      desc: 'Legal rules, intellectual properties, and conditions of purchase.',
      content: [
        'INTELLECTUAL RIGHTS: All designs, photography, branding, logo configurations, and text assets are property of CosoStyle OPC Pvt. Ltd.',
        'INVENTORY CAPS: Our heavyweight tees are created in limited runs. Adding an item to your bag does not reserve stock. Checkout must be completed to lock inventory.',
        'PRICING CHANGES: We reserve the right to modify pricing matrices or discontinue drop drops without prior notice.',
        'LIMIT OF LIABILITY: CosoStyle is not liable for indirect damages, delivery carrier delay disruptions, or sizing choice mismatches.'
      ]
    }
  }[type] || {
    title: 'STUDIO POLICY CENTER',
    desc: 'Review CosoStyle operational guidelines.',
    content: ['Select a policy category from the footer navigation to display specific terms and legal parameters.']
  };

  return (
    <div className="w-full bg-black min-h-screen py-16 md:py-24">
      <SEO title={policyData.title} description={policyData.desc} />

      <div className="max-w-3xl mx-auto px-4 space-y-12 animate-fade-in">
        
        {/* Back Link */}
        <Link 
          to="/" 
          className="inline-block text-[10px] font-black text-neutral-500 hover:text-white transition tracking-widest uppercase mb-4"
        >
          ← RETURN TO BASE
        </Link>

        {/* Headers */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-1 h-3 bg-brand-red inline-block" />
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">COSOSTYLE LEGAL</span>
          </div>
          <h1 className="text-white text-3xl sm:text-4xl md:text-5xl font-black font-impact tracking-tight uppercase leading-tight">
            {policyData.title}
          </h1>
          <p className="text-neutral-400 text-xs font-semibold uppercase tracking-wider border-l-2 border-brand-red pl-4 leading-relaxed">
            {policyData.desc}
          </p>
        </div>

        {/* Content list */}
        <div className="text-neutral-500 text-xs tracking-wide space-y-8 font-medium border-t border-neutral-900/60 pt-10">
          {policyData.content.map((para, idx) => (
            <div key={idx} className="space-y-2 leading-relaxed">
              <span className="text-[10px] text-white font-black tracking-widest uppercase block mb-1">
                ARTICLE 0{idx + 1}
              </span>
              <p className="uppercase">{para}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
