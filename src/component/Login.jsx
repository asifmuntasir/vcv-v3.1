import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  School
} from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API Network Request
    setTimeout(() => {
      setIsLoading(false);
      // Pass mock user data back to parent
      onLoginSuccess({
        id: 'host_' + Math.floor(Math.random() * 1000),
        name: 'Admin Host',
        email: email,
        role: 'admin'
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-slate-900 font-sans">
      
      {/* --- 1. Background Layer (Unique Design) --- */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=2832&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: '0.4', // Dimmed for readability
        }}
      />
      
      {/* Gradient Overlay for depth */}
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-slate-950 via-slate-900/90 to-indigo-950/50" />

      {/* Animated Elements (Floating Orbs) */}
      <div className="absolute top-[-10%] left-[-5%] w-72 h-72 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-700" />

      {/* --- 2. The Login Card --- */}
      <div className="relative z-10 w-full max-w-[440px] px-4">
        
        {/* Glassmorphism Effect */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl rounded-3xl overflow-hidden ring-1 ring-white/5">
          
          {/* Header */}
          <div className="pt-10 pb-8 text-center relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
            
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-6 transform hover:scale-105 transition-transform duration-300">
              <School className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">VCV</h1>
            <p className="text-indigo-200/70 text-sm font-medium tracking-wide uppercase">Virtual Class Venture</p>
          </div>

          {/* Form */}
          <div className="px-8 pb-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider ml-1">
                  Email
                </label>
                <div 
                  className={`group flex items-center bg-slate-950/40 border rounded-xl transition-all duration-300 ${
                    focusedField === 'email' 
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="pl-4 pr-3 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full bg-transparent py-4 text-white placeholder-slate-600 focus:outline-none font-medium text-sm"
                    placeholder="host@school.edu"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider ml-1">
                  Password
                </label>
                <div 
                  className={`group flex items-center bg-slate-950/40 border rounded-xl transition-all duration-300 ${
                    focusedField === 'password' 
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="pl-4 pr-3 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full bg-transparent py-4 text-white placeholder-slate-600 focus:outline-none font-medium text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-3 pr-4 text-slate-500 hover:text-white transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full relative group overflow-hidden bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-900/20 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? 'Accessing Secure Portal...' : 'Sign In to Dashboard'}
                  {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </span>
                {/* Shine Effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
              </button>

            </form>
          </div>
          
          {/* Footer Security Badge */}
          <div className="bg-slate-950/30 p-4 text-center border-t border-white/5 backdrop-blur-sm">
            <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5 uppercase tracking-widest font-semibold">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> 
              256-Bit Encrypted Connection
            </p>
          </div>

        </div>
        
        <div className="mt-8 text-center space-y-2">
            <p className="text-slate-500 text-xs">Need help accessing your account?</p>
            <a href="#" className="text-indigo-400 text-xs hover:text-indigo-300 transition-colors border-b border-indigo-400/30 pb-0.5">Contact Compilemama.com</a>
        </div>

      </div>
    </div>
  );
}