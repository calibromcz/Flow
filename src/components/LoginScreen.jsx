import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FlowLogo } from './FlowLogo';
import { 
  ArrowRight, 
  Lock, 
  Mail, 
  User, 
  Sun, 
  Moon, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  UserPlus, 
  LogIn 
} from 'lucide-react';
import { message } from 'antd';

export const LoginScreen = () => {
  const { loginCloud, registerCloud, authNotice } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      message.error("Inserisci sia l'email che la password.");
      return;
    }

    if (password.length < 6) {
      message.error("La password deve contenere almeno 6 caratteri.");
      return;
    }

    if (authMode === 'register') {
      if (password !== confirmPassword) {
        message.error("Le password non coincidono.");
        return;
      }
    }

    setSubmitting(true);
    try {
      if (authMode === 'register') {
        const nameToUse = fullName.trim() || cleanEmail.split('@')[0];
        await registerCloud(cleanEmail, password, nameToUse);
        message.success(`Account creato con successo! Benvenuto in FLOW, ${nameToUse}!`);
      } else {
        await loginCloud(cleanEmail, password);
        message.success("Accesso effettuato con successo!");
      }
    } catch (err) {
      console.error(err);
      message.error(err.message || "Errore durante l'autenticazione.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full apple-card rounded-[32px] p-6 sm:p-8 border border-neutral-200/80 dark:border-white/10 shadow-xl relative animate-fade-in bg-white dark:bg-neutral-900">
      {/* Quick Theme Toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-neutral-800 dark:hover:text-yellow-400 transition cursor-pointer"
        title={isDark ? "Passa a Tema Chiaro" : "Passa a Dark Mode OLED"}
      >
        {isDark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* Top Branding FLOW Style */}
      <div className="flex flex-col items-center text-center">
        <div className="mb-2">
          <FlowLogo size={70} showText={true} isDark={isDark} />
        </div>
        <p className="text-xs text-[#86868B] dark:text-gray-400 mt-1">
          Finanza Personale Minimalista • Cloud Sicuro Supabase
        </p>
      </div>

      {authNotice && (
        <div className="mt-4 p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-800 dark:text-sky-300 leading-relaxed">
          {authNotice}
        </div>
      )}

      {/* Segmented Control iOS (Accedi | Registrati) */}
      <div className="mt-6 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-2xl grid grid-cols-2 gap-1 border border-neutral-200/60 dark:border-neutral-700/60">
        <button
          type="button"
          onClick={() => setAuthMode('login')}
          className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            authMode === 'login'
              ? 'bg-white dark:bg-neutral-700 text-[#1D1D1F] dark:text-white shadow-xs'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Accedi</span>
        </button>

        <button
          type="button"
          onClick={() => setAuthMode('register')}
          className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            authMode === 'register'
              ? 'bg-white dark:bg-neutral-700 text-[#1D1D1F] dark:text-white shadow-xs'
              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Registrati</span>
        </button>
      </div>

      {/* Form di Autenticazione */}
      <form onSubmit={handleSubmit} className="space-y-3.5 mt-5">
        {/* Campo Nome (solo in modalità Registrazione) */}
        {authMode === 'register' && (
          <div className="animate-fade-in">
            <label className="block text-[11px] font-semibold text-[#86868B] dark:text-gray-300 mb-1 ml-1">
              Il tuo Nome Completo
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="es. Mario Rossi"
                className="w-full bg-[#F5F5F7] dark:bg-neutral-800 rounded-xl pl-10 pr-3 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-[#007AFF]/40 border border-transparent focus:border-[#007AFF] text-[#1D1D1F] dark:text-white transition"
              />
            </div>
          </div>
        )}

        {/* Campo Email */}
        <div>
          <label className="block text-[11px] font-semibold text-[#86868B] dark:text-gray-300 mb-1 ml-1">
            Indirizzo Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@esempio.com"
              className="w-full bg-[#F5F5F7] dark:bg-neutral-800 rounded-xl pl-10 pr-3 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-[#007AFF]/40 border border-transparent focus:border-[#007AFF] text-[#1D1D1F] dark:text-white transition"
            />
          </div>
        </div>

        {/* Campo Password con Toggle Mostra/Nascondi */}
        <div>
          <label className="block text-[11px] font-semibold text-[#86868B] dark:text-gray-300 mb-1 ml-1">
            Password (min. 6 caratteri)
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#F5F5F7] dark:bg-neutral-800 rounded-xl pl-10 pr-10 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-[#007AFF]/40 border border-transparent focus:border-[#007AFF] text-[#1D1D1F] dark:text-white transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition p-1 cursor-pointer"
              title={showPassword ? "Nascondi password" : "Mostra password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Conferma Password (solo Registrazione) */}
        {authMode === 'register' && (
          <div className="animate-fade-in">
            <label className="block text-[11px] font-semibold text-[#86868B] dark:text-gray-300 mb-1 ml-1">
              Conferma Password
            </label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#F5F5F7] dark:bg-neutral-800 rounded-xl pl-10 pr-3 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-[#007AFF]/40 border border-transparent focus:border-[#007AFF] text-[#1D1D1F] dark:text-white transition"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-3 py-3.5 px-4 rounded-xl bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F] font-bold text-xs hover:bg-black dark:hover:bg-neutral-100 active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <span>
            {submitting 
              ? (authMode === 'register' ? 'Creazione account...' : 'Accesso in corso...') 
              : (authMode === 'register' ? 'Crea Account FLOW' : 'Accedi a FLOW')}
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <p className="text-[10px] text-center text-[#86868B] dark:text-gray-400 pt-1 leading-relaxed">
          {authMode === 'register' ? (
            <>
              Hai già un account?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="text-[#007AFF] dark:text-sky-400 font-semibold hover:underline cursor-pointer"
              >
                Accedi qui
              </button>
            </>
          ) : (
            <>
              Non hai ancora un account?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className="text-[#007AFF] dark:text-sky-400 font-semibold hover:underline cursor-pointer"
              >
                Registrati gratis
              </button>
            </>
          )}
        </p>
      </form>
    </div>
  );
};
