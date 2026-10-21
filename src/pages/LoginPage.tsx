import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DEMO_USERS } from '../services/seedData';
import { UserProfile, UserRole } from '../types';
import { 
  HardHat, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft,
  AlertCircle, 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  KeyRound, 
  User,
  ShieldAlert
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (role: UserRole) => void;
  onBackToHome?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBackToHome }) => {
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick fill demo account
  const handleQuickFill = (user: UserProfile) => {
    setIdentifier(user.username || user.email);
    setPassword(user.demoPassword || 'admin123');
    setErrorMessage(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    setTimeout(() => {
      const res = login(identifier, password);
      setIsSubmitting(false);

      if (res.success && res.user) {
        onLoginSuccess(res.user.role);
      } else {
        setErrorMessage(res.error || 'Invalid credentials. Please verify your credentials or choose a demo profile.');
      }
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative selection:bg-amber-400 selection:text-slate-950">
      {/* Background Architectural Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="max-w-xl w-full space-y-6 relative z-10 my-auto">
        {onBackToHome && (
          <div className="flex justify-start">
            <button
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-amber-400 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>← Back to Public Portfolio</span>
            </button>
          </div>
        )}

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 mb-1">
            <HardHat className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            ArthiBuild
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Construction Project Tracking, Package Customization & Customer Management System
          </p>
        </div>

        {/* Primary Login Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white tracking-tight">
              Portal Authentication
            </h2>
            <p className="text-xs text-slate-400">
              Enter your authorized credentials to access your construction workspace.
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div 
              role="alert" 
              className="p-3.5 bg-rose-950/70 border border-rose-700/80 rounded-xl flex items-start gap-2.5 text-xs text-rose-200 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                {errorMessage}
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Username / Email Input */}
            <div className="space-y-1.5">
              <label 
                htmlFor="identifier" 
                className="block text-xs font-semibold text-slate-300"
              >
                Username or Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="identifier"
                  type="text"
                  required
                  autoFocus
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="e.g. arthi or arthi@arthibuild.com"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-950/70 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono transition-colors"
                />
              </div>
            </div>

            {/* Password Input with Show/Hide Toggle */}
            <div className="space-y-1.5">
              <label 
                htmlFor="password" 
                className="block text-xs font-semibold text-slate-300"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter account password"
                  className="w-full pl-10 pr-11 py-2.5 text-xs bg-slate-950/70 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md hover:shadow-amber-500/10 flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Explicit Corporate Registration Restriction Notice */}
          <div className="pt-4 border-t border-slate-800 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
              <span>Public user registration is disabled for enterprise compliance.</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Authorized profiles are provisioned strictly by Arthi Construction administrators.
            </p>
          </div>
        </div>

        {/* Demo Credentials Quick-Fill Cards */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-slate-200">
                Demo Access Credentials (Local Prototype)
              </h3>
            </div>
            <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
              Click to Auto-Fill
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Select any predefined role below to test role-tailored dashboards and permissions without a backend database:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {DEMO_USERS.map(user => {
              const isSelected = identifier.toLowerCase() === user.username.toLowerCase() || identifier.toLowerCase() === user.email.toLowerCase();

              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleQuickFill(user)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 group cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-amber-400/80 ring-1 ring-amber-400/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-amber-400 border border-slate-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {user.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                        {user.name.split(' ')[0]}
                      </span>
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                      User: <strong className="text-slate-300">{user.username}</strong>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Pass: <span className="text-amber-300/80">{user.demoPassword}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-[11px] text-slate-500 font-mono">
          ArthiBuild v1.0 · Client-Side Local Storage · Chennai, Tamil Nadu
        </div>
      </div>
    </div>
  );
};
