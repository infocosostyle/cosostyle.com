import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, useToasts } from '../context/AppContext';
import { firebaseForgotPassword } from '../lib/firebaseAuth';
import SEO from '../components/SEO';

export default function Auth() {
  const { user, login, register, loginWithGoogle } = useAuth();
  const { addToast } = useToasts();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const initialTab = searchParams.get('tab') || 'login';
  const [activeTab, setActiveTab] = useState(initialTab); // 'login' | 'register'
  
  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync tab state with URL parameter changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'login' || tabParam === 'register') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (activeTab === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      // Errors are already toasted inside login/register in AppContext
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result) navigate('/dashboard');
    } catch (err) {
      // Error already toasted in AppContext
    } finally {
      setLoading(false);
    }
  };

  const [recoveryStep, setRecoveryStep] = useState('none'); // 'none' | 'request' | 'sent'
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  const handleForgotPassword = () => {
    setRecoveryStep('request');
  };

  const handleRequestRecovery = async (e) => {
    e.preventDefault();
    if (!recoveryEmail) {
      addToast('Please enter your email.', 'error');
      return;
    }
    setRecoveryLoading(true);
    try {
      await firebaseForgotPassword(recoveryEmail);
      addToast('Password reset email sent! Check your inbox.', 'success');
      setRecoveryStep('sent');
    } catch (err) {
      const msg = err.code === 'auth/user-not-found'
        ? 'No account found with this email.'
        : err.code === 'auth/invalid-email'
        ? 'Please enter a valid email address.'
        : 'Failed to send reset email. Try again.';
      addToast(msg, 'error');
    } finally {
      setRecoveryLoading(false);
    }
  };

  if (recoveryStep === 'request') {
    return (
      <div className="w-full bg-black min-h-screen py-16 flex flex-col justify-center items-center px-4 select-none animate-fade-in text-white">
        <SEO title="Reset Password" />
        <div className="w-full max-w-md bg-neutral-950/20 border border-neutral-900/40 p-8 rounded-luxury shadow-luxury space-y-8">
          <div className="text-center">
            <h2 className="text-white text-3xl font-black font-impact tracking-widest uppercase">
              PASSWORD RECOVERY
            </h2>
            <p className="text-neutral-500 text-[10px] tracking-widest font-black uppercase mt-1">
              ENTER YOUR REGISTERED EMAIL
            </p>
          </div>

          <form onSubmit={handleRequestRecovery} className="space-y-5">
            <div>
              <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1.5">EMAIL ADDRESS</label>
              <input
                type="email"
                required
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                className="bg-black border border-neutral-900 focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 rounded-full transition"
                placeholder="YOUR@EMAIL.COM"
              />
            </div>

            <button
              type="submit"
              disabled={recoveryLoading}
              className="w-full bg-brand-red hover:bg-red-700 text-white font-black text-xs tracking-widest py-4 uppercase transition duration-300 rounded-full shadow-lg hover:shadow-brand-red/20 cursor-pointer disabled:opacity-40"
            >
              {recoveryLoading ? 'SENDING...' : 'SEND RESET LINK'}
            </button>

            <button
              type="button"
              onClick={() => setRecoveryStep('none')}
              className="w-full text-center text-[9px] font-bold tracking-widest uppercase text-neutral-500 hover:text-white transition cursor-pointer"
            >
              BACK TO LOGIN
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (recoveryStep === 'sent') {
    return (
      <div className="w-full bg-black min-h-screen py-16 flex flex-col justify-center items-center px-4 select-none animate-fade-in text-white">
        <SEO title="Check Your Email" />
        <div className="w-full max-w-md bg-neutral-950/20 border border-neutral-900/40 p-8 rounded-luxury shadow-luxury space-y-8 text-center">
          <div className="text-5xl">📧</div>
          <div>
            <h2 className="text-white text-3xl font-black font-impact tracking-widest uppercase">
              CHECK YOUR EMAIL
            </h2>
            <p className="text-neutral-500 text-[10px] tracking-widest font-black uppercase mt-2">
              RESET LINK SENT TO
            </p>
            <p className="text-brand-red text-sm font-black tracking-wider mt-1">{recoveryEmail}</p>
          </div>
          <p className="text-neutral-500 text-xs leading-relaxed">
            Click the link in your email to reset your password. Check your spam folder if you don't see it.
          </p>
          <button
            type="button"
            onClick={() => setRecoveryStep('none')}
            className="w-full bg-brand-red hover:bg-red-700 text-white font-black text-xs tracking-widest py-4 uppercase transition duration-300 rounded-full shadow-lg cursor-pointer"
          >
            BACK TO LOGIN
          </button>
          <button
            type="button"
            onClick={handleRequestRecovery}
            disabled={recoveryLoading}
            className="w-full text-center text-[9px] font-bold tracking-widest uppercase text-neutral-500 hover:text-white transition cursor-pointer disabled:opacity-40"
          >
            {recoveryLoading ? 'RESENDING...' : 'RESEND EMAIL'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-black min-h-screen py-16 flex flex-col justify-center items-center px-4 select-none animate-fade-in text-white">
      <SEO title={activeTab === 'login' ? 'Member Login' : 'Register Account'} />

      {/* Auth Panel */}
      <div className="w-full max-w-md bg-neutral-950/20 border border-neutral-900/40 p-8 rounded-luxury shadow-luxury space-y-8">
        
        {/* Toggle options */}
        <div className="flex border-b border-neutral-950 pb-4 justify-center gap-8 text-[11px] font-black tracking-widest uppercase">
          <button
            onClick={() => setActiveTab('login')}
            className={`pb-1 cursor-pointer transition ${
              activeTab === 'login' ? 'text-white border-b-2 border-brand-red' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            MEMBER LOGIN
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`pb-1 cursor-pointer transition ${
              activeTab === 'register' ? 'text-white border-b-2 border-brand-red' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            CREATE ACCOUNT
          </button>
        </div>

        {/* Brand visual header */}
        <div className="text-center">
          <h2 className="text-white text-3xl font-black font-impact tracking-widest uppercase">
            {activeTab === 'login' ? 'SIGN IN' : 'REGISTER'}
          </h2>
          <p className="text-neutral-500 text-[10px] tracking-widest font-black uppercase mt-1">
            {activeTab === 'login' ? 'ENTER STUDIO CREDENTIALS' : 'JOIN THE COSOSTYLE CATALOG'}
          </p>
        </div>

        {/* Login Method — Password only (Firebase Auth) */}

        {/* Input Forms */}
        <form onSubmit={handleAuthSubmit} className="space-y-5">
          {activeTab === 'register' && (
            <div>
              <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1.5">FULL NAME</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-black border border-neutral-900 focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 rounded-full transition"
                placeholder="ALEX COSO"
              />
            </div>
          )}

          <div>
            <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1.5">EMAIL ADDRESS</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-black border border-neutral-900 focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 rounded-full transition"
              placeholder="YOUR@EMAIL.COM"
            />
          </div>

          <div>
              <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1.5">PASSWORD</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black border border-neutral-900 focus:border-neutral-500 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 rounded-full transition"
                placeholder="••••••••"
              />
            </div>

          {activeTab === 'login' && (
            <div className="flex justify-between items-center text-[9px] font-bold tracking-widest uppercase text-neutral-500">
              <label className="flex items-center gap-2.5 cursor-pointer hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-brand-red cursor-pointer"
                />
                <span>REMEMBER SESSION</span>
              </label>
              <button 
                type="button" 
                onClick={handleForgotPassword} 
                className="hover:text-white transition uppercase cursor-pointer"
              >
                FORGOT PASSWORD?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-red hover:bg-red-700 text-white font-black text-xs tracking-widest py-4 uppercase transition duration-300 rounded-full shadow-lg hover:shadow-brand-red/20 cursor-pointer disabled:opacity-40"
          >
            {loading ? 'AUTHENTICATING...' : activeTab === 'login' ? 'LOG IN' : 'REGISTER'}
          </button>

          {/* Social Social Sign In Channels */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-neutral-900"></div>
            <span className="flex-shrink mx-4 text-[9px] text-neutral-500 font-bold uppercase tracking-wider">OR</span>
            <div className="flex-grow border-t border-neutral-900"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-[#08080A] hover:bg-[#121214] border border-neutral-900 hover:border-neutral-700 text-white font-black text-[9px] tracking-widest py-4 uppercase transition rounded-full cursor-pointer flex items-center justify-center gap-3 disabled:opacity-40"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'SIGNING IN...' : 'CONTINUE WITH GOOGLE'}
          </button>
        </form>

        {/* Admin hint footnote */}
        <div className="border-t border-neutral-950 pt-4 text-center">
          <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-wider">
            FOR TEST ADMIN DEMOS, SIGN IN OR REGISTER AS:<br />
            <span className="text-brand-red font-black">admin@cosostyle.com</span> / PASSWORD: <span className="text-white font-black">admin123</span>
          </p>
        </div>

      </div>
    </div>
  );
}
