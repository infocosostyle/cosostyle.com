import React, { useState } from 'react';
import { Mail, Phone, MapPin, CheckCircle, ArrowRight } from 'lucide-react';
import { useToasts } from '../context/AppContext';
import SEO from '../components/SEO';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { addToast } = useToasts();

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !message) {
      addToast('All fields are required.', 'error');
      return;
    }
    if (message.length < 10) {
      addToast('Message must be at least 10 characters long.', 'error');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      addToast('Message sent! We will get back to you shortly.', 'success');
      setName('');
      setEmail('');
      setMessage('');
    }, 1000);
  };

  return (
    <div className="w-full bg-black min-h-screen py-16">
      <SEO title="Contact Us" description="Have questions about our heavyweight cotton tees or limited drops? Get in touch with the CosoStyle studio." />

      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Side: Contact Information & Mock Dark Map */}
        <div className="lg:col-span-5 space-y-8">
          <div>
            <span className="text-[10px] text-brand-red font-black tracking-widest uppercase block mb-1">CONNECT</span>
            <h1 className="text-white text-4xl font-black font-impact tracking-tight uppercase leading-none">
              COSOSTYLE STUDIO
            </h1>
            <p className="text-neutral-500 text-xs mt-3 uppercase tracking-wider font-semibold">
              Drop in, call, or email our creative space in Manhattan.
            </p>
          </div>

          <div className="space-y-4 text-xs font-bold tracking-widest text-neutral-400 uppercase">
            <div className="flex items-center gap-4 py-3 border-b border-neutral-900">
              <MapPin size={16} className="text-brand-red shrink-0" />
              <span>104 MERCER ST, SOHO, NEW YORK, NY 10012</span>
            </div>
            <div className="flex items-center gap-4 py-3 border-b border-neutral-900">
              <Mail size={16} className="text-brand-red shrink-0" />
              <a href="mailto:studio@cosostyle.com" className="hover:text-white transition">STUDIO@COSOSTYLE.COM</a>
            </div>
            <div className="flex items-center gap-4 py-3 border-b border-neutral-900">
              <Phone size={16} className="text-brand-red shrink-0" />
              <span>+1 (212) 555-0199</span>
            </div>
          </div>

          {/* Interactive Dark Map Card Grid Graphic */}
          <div className="border border-neutral-905 bg-neutral-950 p-6 relative overflow-hidden flex flex-col justify-between h-48 select-none">
            {/* abstract grid styling */}
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/3 w-3 h-3 bg-brand-red/20 border border-brand-red rounded-full flex items-center justify-center animate-ping" />
            <div className="absolute top-1/2 left-1/3 w-1.5 h-1.5 bg-brand-red rounded-full z-10" />

            <span className="text-[10px] text-brand-red font-black tracking-widest uppercase z-10">STUDIO LOCATOR GPS</span>
            <div className="z-10">
              <p className="text-white text-xs font-black uppercase">SOHO, MANHATTAN</p>
              <p className="text-[9px] text-neutral-500 font-bold uppercase mt-1">40.7233° N, 73.9992° W • MON-SAT 11AM-7PM</p>
            </div>
          </div>
        </div>

        {/* Right Side: Message Submission Form */}
        <div className="lg:col-span-7 border border-neutral-900 p-8 bg-neutral-950/20">
          <h3 className="text-white font-black text-xs tracking-widest uppercase border-b border-neutral-900 pb-3 mb-6">
            SEND DIRECT INQUIRY
          </h3>

          {success ? (
            <div className="text-center py-12 space-y-4 animate-fade-in">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-950/20 border border-green-800 text-green-400">
                <CheckCircle size={20} />
              </div>
              <h4 className="text-white font-black text-sm tracking-widest uppercase">INQUIRY RECEIVED</h4>
              <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider max-w-sm mx-auto leading-relaxed">
                Thank you for contacting CosoStyle. A studio coordinator will follow up on your request within 24 business hours.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="text-xs font-black text-brand-red hover:underline tracking-widest uppercase pt-4 block mx-auto cursor-pointer"
              >
                SEND ANOTHER INQUIRY
              </button>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 tracking-widest uppercase mb-2">FULL NAME</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-black border border-neutral-900 focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 transition"
                  placeholder="E.G. CHRIS T."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 tracking-widest uppercase mb-2">EMAIL ADDRESS</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-black border border-neutral-900 focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 transition"
                  placeholder="EMAIL@EXAMPLE.COM"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-bold text-neutral-500 tracking-widest uppercase">MESSAGE DETAILS</label>
                  <span className="text-[9px] text-neutral-600 font-bold uppercase">{message.length} CHARS</span>
                </div>
                <textarea
                  required
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-black border border-neutral-900 focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 transition resize-none"
                  placeholder="INQUIRE ABOUT WHOLESALE, RE-STOCKS, DYES, OR TEXTILES..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-red hover:bg-red-700 text-white font-black text-xs tracking-widest py-4 uppercase transition duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? 'SENDING INQUIRY...' : 'SEND INQUIRY'}
                <ArrowRight size={14} />
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
