import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, Bot, Trash2, ChevronDown, Maximize2, Minimize2, Copy, Check, RotateCcw, Download, ShoppingBag, Heart, User, Search, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { PRODUCTS as mockProducts } from '../lib/mockApi';
import { useAuth, useCart, useWishlist, useToasts } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

// Quick prompt chips shown on empty chat
const QUICK_PROMPTS = [
  { label: '📏 Sizing Guide', text: 'I need size advice. I am 175cm and 70kg. What size should I pick?' },
  { label: '👕 Best Sellers', text: 'What are your most popular streetwear drops right now?' },
  { label: '🎨 Outfit Help', text: 'How do I style an oversized black t-shirt?' },
  { label: '🔄 Returns', text: 'What is your return and refund policy?' },
  { label: '💳 Payments', text: 'What payment methods do you accept and do you offer COD?' },
  { label: '🚚 Shipping', text: 'How long does delivery take?' }
];

export default function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const WELCOME_MESSAGE = {
    sender: 'bot',
    text: "Hi 👋\nI'm the CoSoStyle AI Fashion Assistant.\n\nI'm here to help you find the perfect outfit, answer product questions, recommend sizes, and assist you throughout your shopping experience.",
    rawText: "Welcome message",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    id: 'welcome'
  };

  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Product Catalog loading in frontend
  const [catalog, setCatalog] = useState({});
  const [selectedSizes, setSelectedSizes] = useState({}); // productId -> size
  const [copiedId, setCopiedId] = useState(null); // tracking last copied message

  const { user } = useAuth();
  const { cart, addToCart, removeFromCart, updateCartQuantity } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToast } = useToasts();
  
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Load products catalog on mount to enable rendering recommended product cards
  useEffect(() => {
    async function loadCatalog() {
      try {
        let prods;
        try {
          prods = await api.getProducts();
          if (!prods || prods.length === 0) prods = mockProducts;
        } catch {
          prods = mockProducts;
        }
        const map = {};
        prods.forEach(p => {
          map[p.id] = p;
        });
        setCatalog(map);
      } catch (err) {
        console.warn('AI assistant using local catalog fallback');
      }
    }
    loadCatalog();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setUnreadCount(0);
    }
  }, [isOpen, isMinimized]);

  const addMessage = (sender, text, rawText = '', recommendIds = [], actionObj = null) => {
    const msg = {
      sender,
      text,
      rawText: rawText || text,
      recommendIds,
      actionObj,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      id: Date.now()
    };
    setMessages((prev) => [...prev, msg]);
    if (sender === 'bot' && !isOpen) {
      setUnreadCount((c) => c + 1);
    }
    return msg;
  };

  const handleSend = async (textToSend, customHistory) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    setInputValue('');
    setError('');

    // Add user message if not regenerating
    if (!customHistory) {
      addMessage('user', text, text);
    }
    setLoading(true);

    const activeHistory = customHistory || messages;
    // Format conversation history (excluding welcome message and capping at last 15 exchanges)
    const historyPayload = activeHistory
      .filter((m) => m.id !== 'welcome')
      .slice(-15)
      .map(m => ({
        sender: m.sender,
        text: m.text,
        rawText: m.rawText
      }));

    try {
      const token = localStorage.getItem('coso_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // API call to backend chatbot route
      const response = await fetch('http://localhost:5001/api/chatbot', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          cart: cart.map(i => ({
            id: i.id,
            title: i.title,
            size: i.size,
            color: i.color,
            quantity: i.quantity,
            price: i.price
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Server error communicating with AI Assistant.');
      }

      // Stream response reader
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      const botMsgId = Date.now();
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        id: botMsgId,
        recommendIds: [],
        actionObj: null
      }]);

      let botText = '';
      let sseBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop() || ''; // Hold onto incomplete last line

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6).trim();
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                botText += parsed.text;
                setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, text: botText } : m));
              } else if (parsed.error) {
                setError(parsed.error);
              }
            } catch (e) {
              // Ignore partial JSON parse errors
            }
          }
        }
      }

      // Stream finalized, parse action and recommendation XML tags
      let actionObj = null;
      let recommendIds = [];

      const recRegex = /<products_recommend>([\s\S]*?)<\/products_recommend>/;
      const recMatch = botText.match(recRegex);
      if (recMatch) {
        try {
          recommendIds = JSON.parse(recMatch[1].trim());
        } catch (e) {
          console.error('Failed to parse recommended product IDs:', e);
        }
      }

      const actionRegex = /<chat_action>([\s\S]*?)<\/chat_action>/;
      const actionMatch = botText.match(actionRegex);
      if (actionMatch) {
        try {
          actionObj = JSON.parse(actionMatch[1].trim());
        } catch (e) {
          console.error('Failed to parse chat action:', e);
        }
      }

      // Strip the XML tags out from the final text displayed
      const cleanText = botText
        .replace(recRegex, '')
        .replace(actionRegex, '')
        .trim();

      setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, text: cleanText, recommendIds, actionObj, rawText: botText } : m));

      // Trigger the action if returned
      if (actionObj) {
        executeAction(actionObj);
      }

    } catch (err) {
      setError(err.message || 'Could not connect to AI. Please try again.');
      console.error('AI assistant streaming error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Perform actions triggered by the AI
  const executeAction = async (actionObj) => {
    const { action, productId, size, color, quantity, path, query, orderId } = actionObj;
    
    switch (action) {
      case 'ADD_TO_CART': {
        const product = catalog[productId];
        if (product) {
          const ok = addToCart(product, size || 'M', color || product.color, quantity || 1);
          if (ok) {
            addToast(`Added ${product.title} (${size || 'M'}) to your bag!`, 'success');
            // Programmatically slide out the shopping cart drawer
            window.dispatchEvent(new CustomEvent('coso:opencart'));
          }
        } else {
          addToast('Product not found in catalog.', 'error');
        }
        break;
      }
      case 'REMOVE_FROM_CART': {
        removeFromCart(productId, size, color);
        addToast('Removed item from bag.', 'info');
        break;
      }
      case 'UPDATE_CART_QUANTITY': {
        updateCartQuantity(productId, size, color, quantity);
        addToast('Updated item quantity.', 'success');
        break;
      }
      case 'OPEN_CART': {
        window.dispatchEvent(new CustomEvent('coso:opencart'));
        addToast('Opening shopping bag.', 'info');
        break;
      }
      case 'ADD_TO_WISHLIST': {
        toggleWishlist(productId);
        break;
      }
      case 'REMOVE_FROM_WISHLIST': {
        if (wishlist.includes(productId)) {
          toggleWishlist(productId);
        }
        break;
      }
      case 'SHOW_WISHLIST': {
        navigate('/wishlist');
        addToast('Opening wishlist.', 'info');
        break;
      }
      case 'SEARCH': {
        navigate(`/shop?search=${encodeURIComponent(query)}`);
        addToast(`Searching for "${query}"...`, 'info');
        break;
      }
      case 'NAVIGATE': {
        navigate(path);
        addToast(`Navigating to ${path.replace('/', '') || 'home'}...`, 'info');
        break;
      }
      case 'CANCEL_ORDER': {
        try {
          await api.cancelOrder(orderId);
          addToast(`Order #${orderId} cancelled successfully.`, 'success');
        } catch (err) {
          addToast(err.message || 'Failed to cancel order.', 'error');
        }
        break;
      }
      case 'RETURN_ORDER': {
        navigate('/dashboard');
        addToast('Redirecting to dashboard to request a return.', 'info');
        break;
      }
      default:
        console.warn('Unknown chatbot action:', action);
    }
  };

  const handleRegenerate = async (botMsgId) => {
    const idx = messages.findIndex(m => m.id === botMsgId);
    if (idx === -1) return;

    // Find the last user message preceding this bot message
    const userMsg = [...messages.slice(0, idx)].reverse().find(m => m.sender === 'user');
    if (!userMsg) return;

    // Slice message history to before the bot message
    const newMessages = messages.slice(0, idx);
    setMessages(newMessages);
    setError('');

    await handleSend(userMsg.text, newMessages);
  };

  const handleClearChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setError('');
  };

  const handleCopyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addToast('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadChat = () => {
    const mdContent = messages.map(m => {
      const name = m.sender === 'user' ? (user?.name || 'You') : 'COSO AI Stylist';
      return `### ${name} (${m.timestamp})\n\n${m.text}\n\n---\n`;
    }).join('\n');

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `cosostyle_chat_log.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Downloaded chat log.', 'success');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Custom Markdown parser supporting code blocks, bold, lists, and links
  const renderText = (text) => {
    if (!text) return '';

    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIdx = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        parts.push({ type: 'text', content: text.substring(lastIdx, match.index) });
      }
      parts.push({ type: 'code', lang: match[1], content: match[2] });
      lastIdx = codeBlockRegex.lastIndex;
    }
    if (lastIdx < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIdx) });
    }

    return parts.map((part, pIdx) => {
      if (part.type === 'code') {
        return (
          <pre key={pIdx} className="bg-neutral-950 border border-neutral-900 rounded-xl p-3.5 my-2.5 text-[10px] font-mono text-emerald-400 overflow-x-auto whitespace-pre">
            <code>{part.content}</code>
          </pre>
        );
      }

      const lines = part.content.split('\n');
      return lines.map((line, lIdx) => {
        const isListItem = line.trim().startsWith('- ') || line.trim().startsWith('* ');
        const cleanLine = isListItem ? line.trim().substring(2) : line;

        let lineTemp = [];
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        let linkMatch;
        let curIdx = 0;

        while ((linkMatch = linkRegex.exec(cleanLine)) !== null) {
          if (linkMatch.index > curIdx) {
            lineTemp.push({ type: 'text', content: cleanLine.substring(curIdx, linkMatch.index) });
          }
          lineTemp.push({ type: 'link', text: linkMatch[1], url: linkMatch[2] });
          curIdx = linkRegex.lastIndex;
        }
        if (curIdx < cleanLine.length) {
          lineTemp.push({ type: 'text', content: cleanLine.substring(curIdx) });
        }
        if (lineTemp.length === 0) {
          lineTemp.push({ type: 'text', content: cleanLine });
        }

        const finalLineParts = [];
        lineTemp.forEach((item, itemIdx) => {
          if (item.type === 'link') {
            finalLineParts.push(
              <a key={itemIdx} href={item.url} target="_blank" rel="noopener noreferrer" className="text-brand-red font-bold underline hover:text-red-400 mx-1">
                {item.text}
              </a>
            );
            return;
          }

          const boldParts = item.content.split(/(\*\*[^*]+\*\*)/g);
          boldParts.forEach((bp, bpIdx) => {
            if (bp.startsWith('**') && bp.endsWith('**')) {
              finalLineParts.push(
                <strong key={`${itemIdx}-${bpIdx}`} className="font-extrabold text-white dark:text-white text-[11.5px]">
                  {bp.slice(2, -2)}
                </strong>
              );
            } else {
              finalLineParts.push(bp);
            }
          });
        });

        if (isListItem) {
          return (
            <li key={lIdx} className="list-disc list-inside ml-2.5 my-1 text-neutral-350 text-[11px]">
              {finalLineParts}
            </li>
          );
        }

        return (
          <span key={lIdx} className="block min-h-[5px] text-[11px] leading-relaxed">
            {finalLineParts}
          </span>
        );
      });
    });
  };

  // Determine context-based suggested questions
  const getContextSuggestedQuestions = () => {
    if (messages.length <= 1) return [];

    const lastMsg = messages[messages.length - 1];
    if (lastMsg.sender === 'bot') {
      const txt = lastMsg.text.toLowerCase();
      if (txt.includes('size') || txt.includes('height') || txt.includes('fit')) {
        return [
          { label: '📏 Show size chart', text: 'Show me the size chart details.' },
          { label: '👕 Sizing for 180cm / 80kg', text: 'I am 180cm tall and weigh 80kg, what size fits me?' },
          { label: '🤔 Standard vs Oversized', text: 'Is your fit standard or oversized?' }
        ];
      }
      if (lastMsg.recommendIds && lastMsg.recommendIds.length > 0) {
        return [
          { label: '🛍️ Open my bag', text: 'Open my cart' },
          { label: '🎁 Do you have discount coupons?', text: 'What promo codes or discounts are available?' },
          { label: '🧼 Wash care instructions', text: 'How should I wash and care for these shirts?' }
        ];
      }
      if (txt.includes('order') || txt.includes('track') || txt.includes('delivered')) {
        return [
          { label: '📦 Can I cancel my order?', text: 'How do I cancel my order?' },
          { label: '🔄 How do returns work?', text: 'Tell me about return policy.' }
        ];
      }
    }
    return [
      { label: '🔥 New Streetwear Drops', text: 'Show me your new arrivals.' },
      { label: '🎫 First order coupon', text: 'Is there a coupon code for my first order?' }
    ];
  };

  const currentSuggestedQuestions = getContextSuggestedQuestions();

  return (
    <>
      {/* ── Floating Trigger Button ─────────────────────────────────── */}
      <button
        id="ai-assistant-toggle"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setIsMinimized(false);
        }}
        className="fixed bottom-6 right-6 z-[250] bg-brand-red text-white p-4.5 rounded-full shadow-[0_8px_30px_rgb(227,27,35,0.4)] hover:shadow-[0_8px_30px_rgb(227,27,35,0.7)] hover:scale-110 transition-all duration-300 cursor-pointer flex items-center justify-center group"
        title="COSO AI Fashion Stylist"
        aria-label="Open AI Fashion Stylist"
      >
        {isOpen ? (
          <X size={20} />
        ) : (
          <>
            <div className="relative">
              <Sparkles size={20} className="group-hover:animate-spin" />
              <span className="absolute -top-1.5 -right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-brand-red text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow">
                {unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* ── Slide-out Chat Drawer ──────────────────────────────────── */}
      <div
        className={`fixed inset-y-0 right-0 z-[300] w-full bg-[var(--color-card-bg)] border-l border-[var(--color-border-subtle)] shadow-[0_0_50px_rgba(0,0,0,0.6)] flex flex-col text-[var(--color-text-primary)] transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${isExpanded ? 'sm:max-w-[760px]' : 'sm:max-w-[380px]'}`}
        role="dialog"
        aria-label="COSO AI Fashion Stylist"
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 bg-[var(--color-manifesto-bg)] border-b border-[var(--color-border-subtle)] backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-brand-red to-red-950 flex items-center justify-center shrink-0 shadow-lg">
              <Sparkles size={14} className="text-white animate-pulse" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[var(--color-card-bg)]" />
            </div>
            <div>
              <h4 className="text-[var(--color-text-primary)] text-[11px] font-black tracking-widest uppercase">
                COSO AI Stylist
              </h4>
              <span className="text-[9px] text-green-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block" />
                Live Chat Support
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download conversation */}
            <button
              onClick={handleDownloadChat}
              title="Download chat history"
              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-manifesto-bg)]/80 rounded-lg transition cursor-pointer"
            >
              <Download size={13} />
            </button>
            {/* Clear conversation */}
            <button
              onClick={handleClearChat}
              title="Clear conversation"
              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-manifesto-bg)]/80 rounded-lg transition cursor-pointer"
            >
              <Trash2 size={13} />
            </button>
            {/* Toggle Expand Width */}
            <button
              onClick={() => setIsExpanded((p) => !p)}
              title={isExpanded ? 'Collapse panel' : 'Expand panel'}
              className="hidden sm:inline-block p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-manifesto-bg)]/80 rounded-lg transition cursor-pointer"
            >
              {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
            {/* Minimize */}
            <button
              onClick={() => setIsMinimized(true)}
              title="Minimize chat"
              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-manifesto-bg)]/80 rounded-lg transition cursor-pointer"
            >
              <ChevronDown size={14} />
            </button>
            {/* Close */}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-manifesto-bg)]/80 rounded-lg transition cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Chat Body ────────────────────────────────── */}
        {!isMinimized && (
          <>
            <div className="flex-grow overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-800 bg-[var(--color-card-bg)]">
              {messages.map((m) => (
                <div key={m.id} className="space-y-3">
                  <div className={`flex gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Bot avatar */}
                    {m.sender === 'bot' && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-red to-red-950 flex items-center justify-center shrink-0 mt-1 shadow-md">
                        <Bot size={11} className="text-white" />
                      </div>
                    )}

                    {/* Chat Bubble */}
                    <div
                      className={`relative group max-w-[85%] rounded-2xl px-4 py-3 text-[11px] leading-relaxed ${
                        m.sender === 'user'
                          ? 'bg-brand-red text-white rounded-tr-sm shadow-md'
                          : 'bg-[var(--color-manifesto-bg)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] rounded-tl-sm'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{renderText(m.text)}</div>
                      
                      <div className="flex items-center justify-between mt-1.5">
                        <span className={`text-[8px] font-semibold tracking-wider ${m.sender === 'user' ? 'text-red-200/80' : 'text-[var(--color-text-muted)]'}`}>
                          {m.timestamp}
                        </span>
                        
                        {/* Hover message utilities */}
                        {m.sender === 'bot' && m.id !== 'welcome' && (
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition duration-205 ml-3">
                            <button
                              onClick={() => handleCopyText(m.id, m.text)}
                              title="Copy response"
                              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-0.5 cursor-pointer"
                            >
                              {copiedId === m.id ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                            </button>
                            <button
                              onClick={() => handleRegenerate(m.id)}
                              title="Regenerate response"
                              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-0.5 cursor-pointer"
                            >
                              <RefreshCw size={10} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* User avatar */}
                    {m.sender === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-[var(--color-input-border)] border border-[var(--color-border-subtle)] flex items-center justify-center shrink-0 mt-1 text-[10px] font-black text-[var(--color-text-primary)] shadow-md">
                        {user?.name ? user.name[0].toUpperCase() : 'U'}
                      </div>
                    )}
                  </div>

                  {/* Render Product Recommendation Cards */}
                  {m.recommendIds && m.recommendIds.length > 0 && (
                    <div className="pl-10 pr-4 py-1">
                      <div className={`grid gap-3.5 ${isExpanded ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {m.recommendIds.map((id) => {
                          const prod = catalog[id];
                          if (!prod) return null;
                          const sizeSelected = selectedSizes[prod.id] || prod.sizes[0] || 'M';
                          const isWish = wishlist.includes(prod.id);

                          return (
                            <div
                              key={prod.id}
                              className="bg-[var(--color-manifesto-bg)] border border-[var(--color-border-subtle)] rounded-luxury p-3 flex flex-col justify-between shadow-md hover:border-neutral-700 transition duration-300"
                            >
                              <div className="flex gap-3">
                                {/* Thumbnail */}
                                <div
                                  className="w-16 h-20 bg-neutral-900 rounded-lg overflow-hidden shrink-0 border border-[var(--color-border-subtle)] cursor-pointer"
                                  onClick={() => {
                                    navigate(`/product/${prod.id}`);
                                    setIsOpen(false);
                                  }}
                                >
                                  <img src={prod.image} alt={prod.title} className="w-full h-full object-cover" />
                                </div>
                                
                                {/* Info */}
                                <div className="space-y-1 min-w-0">
                                  {prod.tag && (
                                    <span className="inline-block px-1.5 py-0.5 text-[7px] font-black tracking-widest bg-brand-red text-white uppercase rounded">
                                      {prod.tag}
                                    </span>
                                  )}
                                  <h5
                                    className="text-[var(--color-text-primary)] font-bold text-[10.5px] truncate cursor-pointer hover:text-brand-red transition"
                                    onClick={() => {
                                      navigate(`/product/${prod.id}`);
                                      setIsOpen(false);
                                    }}
                                  >
                                    {prod.title}
                                  </h5>
                                  <p className="text-brand-red font-black text-[11px]">₹{prod.price}</p>
                                  <p className="text-[var(--color-text-muted)] text-[8.5px] line-clamp-2 leading-relaxed">
                                    {prod.description}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-3 pt-3 border-t border-[var(--color-border-subtle)] space-y-2.5">
                                {/* Size selector */}
                                <div className="flex items-center justify-between gap-1.5">
                                  <span className="text-[8px] uppercase tracking-wider font-bold text-[var(--color-text-muted)]">Size:</span>
                                  <div className="flex gap-1 overflow-x-auto">
                                    {prod.sizes.map((sz) => (
                                      <button
                                        key={sz}
                                        onClick={() => setSelectedSizes(prev => ({ ...prev, [prod.id]: sz }))}
                                        className={`w-5 h-5 rounded-full text-[8px] font-extrabold flex items-center justify-center transition border cursor-pointer ${
                                          sizeSelected === sz
                                            ? 'bg-white text-black border-white'
                                            : 'bg-transparent text-[var(--color-text-primary)] border-neutral-800 hover:border-neutral-500'
                                        }`}
                                      >
                                        {sz}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      const ok = addToCart(prod, sizeSelected, prod.color, 1);
                                      if (ok) {
                                        addToast(`Added ${prod.title} (${sizeSelected}) to bag!`, 'success');
                                        window.dispatchEvent(new CustomEvent('coso:opencart'));
                                      }
                                    }}
                                    className="flex-grow bg-brand-red text-white py-1.5 px-2 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-red-600 transition flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <ShoppingBag size={10} /> Add to Bag
                                  </button>
                                  
                                  <button
                                    onClick={() => toggleWishlist(prod.id)}
                                    className={`p-1.5 border rounded-lg transition flex items-center justify-center cursor-pointer ${
                                      isWish
                                        ? 'bg-neutral-800 border-brand-red text-brand-red'
                                        : 'bg-transparent border-neutral-800 text-[var(--color-text-muted)] hover:text-white hover:border-neutral-500'
                                    }`}
                                    title="Toggle wishlist"
                                  >
                                    <Heart size={11} fill={isWish ? '#E31B23' : 'transparent'} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {loading && (
                <div className="flex gap-3 items-end">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-red to-red-950 flex items-center justify-center shrink-0 shadow-md">
                    <Bot size={11} className="text-white animate-pulse" />
                  </div>
                  <div className="bg-[var(--color-manifesto-bg)] border border-[var(--color-border-subtle)] rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center shadow-sm">
                    <span className="w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-[var(--color-text-muted)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              {/* Error log */}
              {error && (
                <div className="bg-red-950/20 border border-red-900/50 rounded-xl px-4 py-3 text-[10px] text-red-400 font-semibold shadow-sm">
                  ⚠️ {error}
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* ── Suggested Questions Chips ─────────────────────────────── */}
            <div className="px-4 pb-3 pt-1 flex flex-wrap gap-1.5 shrink-0 bg-[var(--color-card-bg)] border-t border-[var(--color-border-subtle)]/30">
              {(messages.length <= 1 ? QUICK_PROMPTS : currentSuggestedQuestions).map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q.text)}
                  disabled={loading}
                  className="text-[9px] font-bold border border-[var(--color-border-subtle)] bg-[var(--color-manifesto-bg)]/80 hover:bg-neutral-900 hover:border-neutral-600 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] tracking-wide px-3 py-1.5 rounded-full uppercase transition duration-200 cursor-pointer disabled:opacity-50"
                >
                  {q.label}
                </button>
              ))}
            </div>

            {/* ── Input Box Footer ──────────────────────────────── */}
            <div className="px-4 py-3.5 border-t border-[var(--color-border-subtle)] bg-[var(--color-manifesto-bg)]/80 backdrop-blur-sm shrink-0">
              <p className="text-[7.5px] text-[var(--color-text-muted)] font-bold tracking-widest uppercase text-center mb-2.5">
                AI replies by Gemini 2.0 Flash · CoSoStyle 2026
              </p>
              <div className="flex gap-2 items-center">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about sizing, fabric, order tracking..."
                  disabled={loading}
                  className="flex-grow bg-[var(--color-input-bg)] border border-[var(--color-input-border)] focus:border-neutral-500 rounded-xl text-[11px] text-[var(--color-text-primary)] font-medium placeholder-neutral-600 outline-none p-3 px-4 resize-none transition overflow-hidden leading-relaxed disabled:opacity-60"
                  style={{ minHeight: '42px', maxHeight: '100px' }}
                />
                <button
                  id="ai-send-button"
                  onClick={() => handleSend()}
                  disabled={loading || !inputValue.trim()}
                  className="p-3 bg-brand-red hover:bg-red-600 disabled:bg-neutral-800 disabled:text-neutral-600 text-white rounded-xl transition-all duration-200 flex items-center justify-center shrink-0 cursor-pointer shadow-md hover:shadow-brand-red/20 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <Send size={13} className={loading ? 'opacity-50' : ''} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Minimized state bar strip */}
        {isMinimized && (
          <div
            onClick={() => setIsMinimized(false)}
            className="px-5 py-4 text-[10px] text-[var(--color-text-muted)] font-black tracking-wider flex items-center justify-between cursor-pointer hover:bg-[var(--color-manifesto-bg)] hover:text-white transition select-none"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={11} className="text-brand-red animate-pulse" />
              <span>CLICK TO EXPAND COSO AI STYLIST</span>
            </div>
            <Maximize2 size={10} />
          </div>
        )}
      </div>

      {/* Backdrop overlay on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[290] bg-black/40 backdrop-blur-xs sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
