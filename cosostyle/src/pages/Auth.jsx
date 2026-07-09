import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth, useToasts } from '../context/AppContext';
import { api } from '../lib/api';
import SEO from '../components/SEO';

export default function Auth() {
  const { user, login } = useAuth();
  const { addToast } = useToasts();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const initialTab = searchParams.get('tab') || 'login';
  const [activeTab, setActiveTab] = useState(initialTab); // 'login' | 'register'
  
  // Login options
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' | 'otp'
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

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
        if (loginMethod === 'password') {
          await login(email, password, rememberMe);
        } else {
          // OTP login flow
          setOtpLoading(true);
          const res = await api.verifyOtp(email, otpCode);
          localStorage.setItem('coso_token', res.token);
          // Set user session in context by reloading page or dispatching event
          window.location.reload(); // Hard refresh to trigger AppContext loading session
          addToast(`Welcome back, ${res.user.name}!`, 'success');
        }
      } else {
        // Register flow
        const res = await api.register(name, email, password);
        // Register logs them in automatically
      }
      navigate('/dashboard');
    } catch (err) {
      addToast(err.message || 'Authentication failed.', 'error');
    } finally {
      setLoading(false);
      setOtpLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!email) {
      addToast('Please enter your email first.', 'error');
      return;
    }
    setOtpLoading(true);
    try {
      const res = await api.sendOtp(email);
      setOtpSent(true);
      addToast(res.message, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to send OTP code.', 'error');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const res = await api.loginGoogle('google_demo@cosostyle.com', 'Google User Demo', 'google12345');
      localStorage.setItem('coso_token', res.token);
      window.location.reload();
      addToast(`Welcome back, ${res.user.name}!`, 'success');
      navigate('/dashboard');
    } catch (err) {
      addToast('Google login simulation failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const [recoveryStep, setRecoveryStep] = useState('none'); // 'none' | 'request' | 'reset'
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newRecoveryPassword, setNewRecoveryPassword] = useState('');
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
      const res = await api.forgotPassword(recoveryEmail);
      addToast(res.message, 'success');
      setRecoveryStep('reset');
    } catch (err) {
      addToast(err.message || 'Recovery request failed.', 'error');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!recoveryCode || !newRecoveryPassword) {
      addToast('Please fill in all fields.', 'error');
      return;
    }
    setRecoveryLoading(true);
    try {
      const res = await api.resetPassword(recoveryEmail, recoveryCode, newRecoveryPassword);
      addToast(res.message, 'success');
      setRecoveryStep('none');
      setEmail(recoveryEmail);
      setLoginMethod('password');
    } catch (err) {
      addToast(err.message || 'Reset password failed.', 'error');
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
              ENTER REGISTERED EMAIL
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
              {recoveryLoading ? 'SENDING CODE...' : 'SEND RECOVERY CODE'}
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

  if (recoveryStep === 'reset') {
    return (
      <div className="w-full bg-black min-h-screen py-16 flex flex-col justify-center items-center px-4 select-none animate-fade-in text-white">
        <SEO title="Choose New Password" />
        <div className="w-full max-w-md bg-neutral-950/20 border border-neutral-900/40 p-8 rounded-luxury shadow-luxury space-y-8">
          <div className="text-center">
            <h2 className="text-white text-3xl font-black font-impact tracking-widest uppercase">
              CREATE NEW PASSWORD
            </h2>
            <p className="text-neutral-500 text-[10px] tracking-widest font-black uppercase mt-1">
              ENTER RECOVERY CODE & PASSWORD
            </p>
          </div>

          <form onSubmit={handleResetPasswordSubmit} className="space-y-5">
            <div>
              <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1.5">RECOVERY CODE</label>
              <input
                type="text"
                required
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="bg-black border border-neutral-900 focus:border-neutral-550 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 rounded-full transition"
                placeholder="ENTER 6-DIGIT CODE"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1.5">NEW PASSWORD</label>
              <input
                type="password"
                required
                value={newRecoveryPassword}
                onChange={(e) => setNewRecoveryPassword(e.target.value)}
                className="bg-black border border-neutral-900 focus:border-neutral-550 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 rounded-full transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={recoveryLoading}
              className="w-full bg-brand-red hover:bg-red-700 text-white font-black text-xs tracking-widest py-4 uppercase transition duration-300 rounded-full shadow-lg hover:shadow-brand-red/20 cursor-pointer disabled:opacity-40"
            >
              {recoveryLoading ? 'SAVING...' : 'RESET PASSWORD'}
            </button>

            <button
              type="button"
              onClick={() => setRecoveryStep('request')}
              className="w-full text-center text-[9px] font-bold tracking-widest uppercase text-neutral-500 hover:text-white transition cursor-pointer"
            >
              RESEND RECOVERY CODE
            </button>
          </form>
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

        {/* Login Method Sub-Toggle for OTP vs Password */}
        {activeTab === 'login' && (
          <div className="flex border border-neutral-900 bg-black/40 rounded-full p-1 max-w-[280px] mx-auto text-[9px] font-black tracking-widest uppercase">
            <button
              type="button"
              onClick={() => setLoginMethod('password')}
              className={`w-1/2 py-2 rounded-full transition cursor-pointer ${
                loginMethod === 'password' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              PASSWORD
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('otp')}
              className={`w-1/2 py-2 rounded-full transition cursor-pointer ${
                loginMethod === 'otp' ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              OTP CODE
            </button>
          </div>
        )}

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

          {activeTab === 'login' && loginMethod === 'otp' ? (
            <div className="space-y-4 animate-fade-in">
              <div className="flex gap-2 items-end">
                <div className="flex-grow">
                  <label className="block text-[9px] font-bold text-neutral-500 tracking-widest uppercase mb-1.5">VERIFICATION CODE (OTP)</label>
                  <input
                    type="text"
                    required={otpSent}
                    disabled={!otpSent}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="bg-black border border-neutral-900 focus:border-neutral-550 text-white text-xs font-semibold tracking-wider placeholder-neutral-700 outline-none w-full p-3 px-4 rounded-full transition disabled:opacity-40"
                    placeholder="ENTER 6-DIGIT CODE"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading}
                  className="bg-[#050507] border border-neutral-900 hover:border-neutral-700 text-white text-[9px] font-black tracking-widest p-4 px-6 rounded-full uppercase transition shrink-0 cursor-pointer disabled:opacity-40"
                >
                  {otpSent ? 'RESEND' : 'SEND CODE'}
                </button>
              </div>
            </div>
          ) : (
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
          )}

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
            className="w-full bg-[#08080A] hover:bg-[#121214] border border-neutral-900 hover:border-neutral-700 text-white font-black text-[9px] tracking-widest py-4 uppercase transition rounded-full cursor-pointer flex items-center justify-center gap-2"
          >
            CONTINUE WITH GOOGLE
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
