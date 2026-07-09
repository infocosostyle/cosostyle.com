import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Truck, FileText, ShoppingBag, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { useToasts } from '../context/AppContext';
import SEO from '../components/SEO';

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToasts();

  useEffect(() => {
    async function fetchOrder() {
      try {
        const found = await api.getOrder(id);
        setOrder(found);
      } catch (err) {
        console.error('Failed to load order confirmation details:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  const handleDownloadInvoice = () => {
    addToast(`Invoice_${id}.pdf is preparing for download...`, 'info');
    setTimeout(() => {
      addToast(`Invoice downloaded successfully!`, 'success');
      // Triggers printing simulation
      window.print();
    }, 1200);
  };

  if (loading) {
    return (
      <div className="w-full bg-black min-h-[70vh] flex justify-center items-center">
        <SEO title="Loading Order Detail" />
        <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="w-full bg-black min-h-[70vh] flex flex-col justify-center items-center text-center px-4">
        <SEO title="Order Not Found" />
        <h2 className="text-white font-black font-impact tracking-widest text-3xl uppercase mb-4">
          ORDER NOT FOUND
        </h2>
        <p className="text-neutral-500 text-xs tracking-wider mb-8 max-w-xs">
          The order ID reference could not be located in our processing registry.
        </p>
        <Link 
          to="/shop" 
          className="bg-brand-red hover:bg-red-700 text-white font-black text-xs tracking-widest px-8 py-3.5 uppercase transition"
        >
          DISCOVER COLLECTION
        </Link>
      </div>
    );
  }

  // Define tracking stage highlights
  const stages = ['Placed', 'Processing', 'Shipped', 'Delivered'];
  const activeIdx = stages.indexOf(order.status) !== -1 ? stages.indexOf(order.status) : 0;

  // Calculate mock delivery date (Order date + 5 days)
  const getDeliveryDate = () => {
    if (!order.date) return 'TBD';
    const dateObj = new Date(order.date);
    dateObj.setDate(dateObj.getDate() + 5);
    return dateObj.toDateString().toUpperCase();
  };

  return (
    <div className="w-full bg-black min-h-screen py-16 print:bg-white print:text-black">
      <SEO title="Order Confirmation" />

      <div className="max-w-3xl mx-auto px-4 space-y-12 print:max-w-full">
        
        {/* Success Alert Banner (Hidden when printing invoice) */}
        <div className="text-center space-y-4 print:hidden">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-950/20 border border-green-800 text-green-400 mb-2">
            <CheckCircle size={32} />
          </div>
          <h1 className="text-white text-4xl sm:text-5xl font-black font-impact tracking-widest uppercase">
            ORDER CONFIRMED
          </h1>
          <p className="text-neutral-500 text-xs font-semibold uppercase tracking-wider max-w-md mx-auto leading-relaxed">
            Thank you for purchasing heavyweight cotton. Your order reference is <span className="text-white font-bold">{order.id}</span>. An invoice receipt has been dispatched.
          </p>
        </div>

        {/* 1. ORDER TRACKING PROGRESS STATUS (Hidden when printing) */}
        <div className="border border-neutral-900 bg-neutral-950/20 p-6 space-y-6 print:hidden">
          <h3 className="text-white font-black text-xs tracking-widest uppercase flex items-center gap-2">
            <Truck size={14} className="text-brand-red" />
            ORDER DISPATCH PIPELINE
          </h3>

          {/* Stepper Node Lines */}
          <div className="relative flex justify-between items-center w-full pt-4">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-neutral-900 z-0"></div>
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-brand-red z-0 transition-all duration-500"
              style={{ width: `${(activeIdx / (stages.length - 1)) * 100}%` }}
            ></div>

            {stages.map((stage, idx) => {
              const isPast = idx <= activeIdx;
              const isActive = idx === activeIdx;

              return (
                <div key={stage} className="flex flex-col items-center z-10 relative">
                  <div 
                    className={`w-6 h-6 rounded-full flex items-center justify-center border text-[9px] font-black transition-all ${
                      isPast 
                        ? 'bg-brand-red border-brand-red text-white' 
                        : 'bg-black border-neutral-800 text-neutral-600'
                    } ${isActive ? 'ring-4 ring-brand-red/20' : ''}`}
                  >
                    {idx + 1}
                  </div>
                  <span className={`text-[9px] font-black tracking-wider uppercase mt-2.5 ${
                    isPast ? 'text-white' : 'text-neutral-600'
                  }`}>
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-neutral-900 pt-4 flex flex-col sm:flex-row justify-between gap-4 text-[10px] font-bold tracking-widest uppercase text-neutral-500">
            <div>
              ESTIMATED ARRIVAL: <span className="text-white">{getDeliveryDate()}</span>
            </div>
            <div>
              TRACKING ID: <span className="text-white">{order.trackingNumber}</span>
            </div>
          </div>
        </div>

        {/* 2. ORDER BREAKDOWN RECEIPT PANEL */}
        <div className="border border-neutral-900 bg-black p-8 space-y-6 print:border-none print:p-0">
          <div className="flex justify-between items-center border-b border-neutral-900 pb-4">
            <div>
              <span className="text-[10px] text-brand-red font-black tracking-widest uppercase block print:text-black">RECEIPT DETAILS</span>
              <span className="text-xs text-white font-bold tracking-wider uppercase print:text-black">DATE: {order.date}</span>
            </div>
            <button
              onClick={handleDownloadInvoice}
              className="text-[9px] font-black tracking-widest uppercase border border-neutral-800 hover:border-white text-neutral-400 hover:text-white px-3 py-2 flex items-center gap-2 transition cursor-pointer print:hidden"
            >
              <FileText size={12} />
              PRINT INVOICE
            </button>
          </div>

          {/* Items Summary Grid */}
          <div className="space-y-4 border-b border-neutral-900 pb-6 print:border-neutral-200">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center gap-4 text-xs font-semibold uppercase tracking-wider">
                <div className="flex-grow">
                  <span className="text-white font-bold block print:text-black">{item.title}</span>
                  <span className="text-[9px] text-neutral-500 font-bold block mt-0.5">
                    SIZE: {item.size} • COLOR: {item.color} • QTY: {item.quantity}
                  </span>
                </div>
                <span className="text-white font-bold print:text-black">₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Totals Calculation */}
          <div className="space-y-2 text-[10px] font-bold tracking-widest uppercase text-neutral-500 print:text-neutral-600">
            <div className="flex justify-between items-center">
              <span>SUBTOTAL</span>
              <span className="text-white print:text-black">₹{order.subtotal.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between items-center text-green-500">
                <span>DISCOUNT</span>
                <span>-₹{order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span>ESTIMATED TAX (8%)</span>
              <span className="text-white print:text-black">₹{order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center border-b border-neutral-900 pb-4 print:border-neutral-200">
              <span>SHIPPING FEE</span>
              <span className="text-white print:text-black">
                {order.shipping === 0 ? 'FREE' : `₹${order.shipping.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs font-black tracking-widest text-white uppercase pt-2 print:text-black">
              <span>TOTAL PAID</span>
              <span className="text-sm">₹{order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Delivery Coordinates info */}
          <div className="border-t border-neutral-900 pt-6 space-y-2 print:border-neutral-200">
            <h4 className="text-[10px] text-brand-red font-black tracking-widest uppercase print:text-black">SHIPPING COORDINATES</h4>
            <p className="text-xs text-neutral-400 font-bold uppercase print:text-black">{order.shippingAddress.name}</p>
            <p className="text-[10px] text-neutral-500 font-semibold uppercase leading-relaxed mt-0.5 print:text-neutral-600">
              {order.shippingAddress.street}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zip}<br />
              {order.shippingAddress.country}
            </p>
          </div>
        </div>

        {/* CTA Footer Navigation Buttons (Hidden when printing) */}
        <div className="flex flex-wrap gap-4 pt-4 justify-center print:hidden">
          <Link
            to="/shop"
            className="border border-neutral-850 hover:border-white text-white font-black text-[10px] tracking-widest px-8 py-4 uppercase transition flex items-center gap-2"
          >
            <ShoppingBag size={12} />
            CONTINUE SHOPPING
          </Link>
          <Link
            to="/dashboard"
            className="bg-brand-red hover:bg-red-700 text-white font-black text-[10px] tracking-widest px-8 py-4 uppercase transition flex items-center gap-2"
          >
            VIEW DASHBOARD
            <ArrowRight size={12} />
          </Link>
        </div>

      </div>
    </div>
  );
}
