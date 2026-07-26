import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { Mail, Lock, LogIn, CheckCircle2, ChevronRight, Activity, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google.');
    }
  };

  return (
    <div className="flex h-screen w-full bg-[var(--color-background)] font-sans">
      
      {/* Left Side - Brand & Illustration */}
      <div className="hidden lg:flex flex-col w-[45%] bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] p-12 relative overflow-hidden justify-between">
        {/* Animated Shapes / Background */}
        <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>

        <div className="relative z-10 flex items-center">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center mr-3 shadow-lg shadow-primary/30">
            <CheckCircle2 size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-text-primary tracking-tight">Nayaruvi</h1>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-bold text-text-primary leading-[1.2] mb-6">
            Manage your work,<br/>
            <span className="text-primary">beautifully.</span>
          </h2>
          <p className="text-lg text-text-secondary font-medium leading-relaxed mb-8">
            The world's simplest, most intuitive project management tool. Designed for speed, clarity, and elegance.
          </p>
          
          <div className="flex items-center space-x-4">
            <div className="flex -space-x-3">
              {[1,2,3,4].map(i => (
                <img key={i} src={`https://ui-avatars.com/api/?name=User+${i}&background=random&color=fff`} className="w-10 h-10 rounded-full border-2 border-[#E0E7FF] shadow-sm relative z-10" alt="avatar" />
              ))}
            </div>
            <p className="text-sm font-semibold text-text-primary">
              Join 10,000+ teams worldwide.
            </p>
          </div>
        </div>
        
        <div className="relative z-10 text-sm font-semibold text-text-secondary">
          © 2026 Nayaruvi Inc.
        </div>
      </div>

      {/* Right Side - Login Card */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white relative">
        <div className="w-full max-w-[420px]">
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-text-primary mb-2">Welcome back</h2>
            <p className="text-text-secondary font-medium">Please enter your details to sign in.</p>
          </div>

          <button 
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center py-3 px-4 bg-white border border-[var(--color-border)] rounded-[12px] text-sm font-bold text-text-primary hover:bg-[#F8FAFC] transition-colors shadow-softer mb-6"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>

          <div className="flex items-center mb-6">
            <div className="flex-1 h-px bg-[var(--color-border)]"></div>
            <span className="px-4 text-xs font-semibold text-text-secondary uppercase">Or with email</span>
            <div className="flex-1 h-px bg-[var(--color-border)]"></div>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-danger/10 border border-danger/20 rounded-[10px] text-danger text-sm font-medium flex items-center">
              <AlertCircle size={16} className="mr-2 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-text-primary mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full bg-[#F8FAFC] border border-[var(--color-border)] rounded-[12px] pl-10 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-text-primary mb-1.5">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full bg-[#F8FAFC] border border-[var(--color-border)] rounded-[12px] pl-10 pr-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 mb-6">
              <label className="flex items-center cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-[var(--color-border)] text-primary focus:ring-primary/20 accent-primary" />
                <span className="ml-2 text-sm font-medium text-text-secondary">Remember me</span>
              </label>
              <a href="#" className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">Forgot password?</a>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-[12px] text-sm font-bold transition-all shadow-md shadow-primary/30 flex items-center justify-center group disabled:opacity-70"
            >
              {loading ? (
                <Activity size={18} className="animate-spin" />
              ) : (
                <>
                  Continue
                  <ChevronRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          <p className="text-center text-sm font-medium text-text-secondary mt-8">
            Don't have an account? <a href="#" className="font-bold text-primary hover:text-primary/80">Sign up</a>
          </p>

        </div>
      </div>
    </div>
  );
}
