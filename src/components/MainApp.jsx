import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';
import { usePrivacy } from '../context/PrivacyContext';
import { usePalette } from '../context/PaletteContext';
import { LoginScreen } from './LoginScreen';
import { TabHome } from './TabHome';
import { TabAnalytics } from './TabAnalytics';
import { TabHistory } from './TabHistory';
import { TabProfile } from './TabProfile';
import { TransactionModal } from './TransactionModal';
import { CalculatorModal } from './CalculatorModal';
import { CalendarPopoverModal } from './CalendarPopoverModal';
import { FlowLogo, FlowIcon } from './FlowLogo';
import { 
  LayoutDashboard, 
  BarChart3, 
  History, 
  UserCircle2, 
  Plus, 
  LogOut,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Calculator,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Modal } from 'antd';

export const MainApp = () => {
  const { user, loading, logout } = useAuth();
  const { profile } = useFinance();
  const { isDark, toggleTheme } = useTheme();
  const { isPrivacyMode, togglePrivacy } = usePrivacy();
  const { palette } = usePalette();
  const [currentTab, setCurrentTab] = useState('home');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState('expense');
  const [modalPresetAmount, setModalPresetAmount] = useState(null);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isFaqSectionOpen, setIsFaqSectionOpen] = useState(false);

  // Shortcut Cmd+J / Ctrl+J per aprire la Calcolatrice
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setCalculatorOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenModal = (type = 'expense', preset = null) => {
    setModalDefaultType(type);
    setModalPresetAmount(preset);
    setModalOpen(true);
  };

  const handleUseCalculatorAmount = (amount) => {
    setCalculatorOpen(false);
    handleOpenModal('expense', amount);
  };

  const handleLogout = () => {
    Modal.confirm({
      title: "Vuoi uscire?",
      content: "Tornerai alla schermata di accesso.",
      okText: "Esci",
      okType: "danger",
      cancelText: "Annulla",
      centered: true,
      onOk: async () => {
        await logout();
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F5F7] dark:bg-[#000000] text-[#1D1D1F] dark:text-white transition-colors duration-300">
        <div className="flex flex-col items-center gap-3">
          <FlowIcon size={44} />
          <span className="text-xs font-semibold text-[#86868B] dark:text-gray-300 tracking-wider">Caricamento FLOW...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen w-full bg-[#F5F5F7] dark:bg-[#000000] text-[#1D1D1F] dark:text-white transition-colors duration-300 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <LoginScreen />
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Analisi & Fissi', icon: BarChart3 },
    { id: 'history', label: 'Storico & Documenti', icon: History },
    { id: 'profile', label: 'Profilo & Studio', icon: UserCircle2 },
  ];

  const renderContent = () => {
    switch (currentTab) {
      case 'home':
        return <TabHome onOpenSheet={handleOpenModal} />;
      case 'analytics':
        return <TabAnalytics />;
      case 'history':
        return <TabHistory />;
      case 'profile':
        return <TabProfile />;
      default:
        return <TabHome onOpenSheet={handleOpenModal} />;
    }
  };

  return (
    <div 
      className="min-h-screen w-full bg-[#F5F5F7] dark:bg-[#000000] text-[#1D1D1F] dark:text-white transition-colors duration-300 flex flex-col md:flex-row font-sans antialiased selection:bg-blue-100 dark:selection:bg-blue-900/40"
      style={{ backgroundColor: !isDark && palette?.appBg ? palette.appBg : undefined }}
    >
      {/* ========================================================= */}
      {/* DESKTOP SIDEBAR FISSA (Frosted Glass Apple HIG) */}
      {/* ========================================================= */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white/75 dark:bg-[#1C1C1E]/60 backdrop-blur-2xl border-r border-gray-200/60 dark:border-white/10 p-6 shrink-0 fixed inset-y-0 left-0 z-30 justify-between shadow-xs">
        <div className="space-y-6">
          {/* Logo Brand FLOW + Privacy Toggle + Theme Switch */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <FlowIcon size={38} />
              <div>
                <span className="font-extrabold text-base tracking-[0.18em] text-[#1D1D1F] dark:text-white block leading-tight">
                  FLOW
                </span>
                <div className="flex items-center gap-1.5 text-[10px] text-[#32B87A] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#32B87A] animate-pulse" />
                  <span>Cloud Live</span>
                </div>
              </div>
            </div>

            {/* Controlli Privacy, Calcolatrice, Calendario & Theme */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCalendarOpen(true)}
                className="p-2 rounded-xl text-[#86868B] hover:text-[#007AFF] hover:bg-blue-50 dark:hover:bg-white/10 transition cursor-pointer"
                title="Calendario Scadenze & Movimenti"
              >
                <CalendarIcon className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setCalculatorOpen(true)}
                className="p-2 rounded-xl text-[#86868B] hover:text-[#FF9500] hover:bg-orange-50 dark:hover:bg-white/10 transition cursor-pointer"
                title="Calcolatrice iOS (Cmd + J)"
              >
                <Calculator className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={togglePrivacy}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  isPrivacyMode 
                    ? 'text-[#007AFF] bg-blue-50 dark:bg-blue-900/30' 
                    : 'text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/10'
                }`}
                title={isPrivacyMode ? "Disattiva Privacy" : "Attiva Privacy"}
              >
                {isPrivacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-xl text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-yellow-400 hover:bg-gray-100/80 dark:hover:bg-white/10 transition cursor-pointer"
                title={isDark ? "Tema Chiaro" : "Dark Mode"}
              >
                {isDark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Pulsante Primario Nuovo Movimento Desktop */}
          <button
            type="button"
            onClick={() => handleOpenModal('expense')}
            className="w-full py-3.5 px-4 rounded-full bg-[#007AFF] hover:bg-blue-600 dark:bg-[#0A84FF] dark:hover:bg-blue-500 text-white font-bold text-sm shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Nuovo Movimento</span>
          </button>

          {/* Menu Navigazione Desktop */}
          <nav className="space-y-1 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#1D1D1F] text-white dark:bg-white dark:text-[#1D1D1F] shadow-sm'
                      : 'text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-gray-100/70 dark:hover:bg-white/10'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white dark:text-[#1D1D1F]' : 'text-[#86868B]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar: Info Utente & Logout */}
        <div className="pt-4 border-t border-gray-100 dark:border-white/10 flex items-center justify-between px-1">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#007AFF] to-indigo-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              {profile?.full_name ? profile.full_name[0].toUpperCase() : user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-[#1D1D1F] dark:text-white block truncate leading-tight">
                {profile?.full_name || user?.name}
              </span>
              <span className="text-[10px] text-[#86868B] dark:text-gray-400 block truncate">
                {user?.email}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-xl text-[#86868B] hover:text-[#FF3B30] hover:bg-red-50 dark:hover:bg-red-950/30 transition shrink-0 cursor-pointer"
            title="Esci"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MOBILE TOP HEADER (< md) — Frosted Glass Apple HIG con Safe Area iOS (iPhone 17 Ready) */}
      {/* ========================================================= */}
      <header 
        className="md:hidden sticky top-0 z-50 bg-white/85 dark:bg-[#1C1C1E]/80 backdrop-blur-2xl border-b border-gray-200/60 dark:border-white/10 px-5 pt-[max(env(safe-area-inset-top,0px)+1rem,2.75rem)] pb-3 flex items-center justify-between shadow-xs transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-white/10 flex items-center justify-center shrink-0 border border-neutral-200/60 dark:border-white/10 shadow-2xs">
            <FlowIcon size={20} />
          </div>
          <span className="font-extrabold text-base tracking-[0.18em] text-[#1D1D1F] dark:text-white">
            FLOW
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCalendarOpen(true)}
            className="p-2 rounded-xl text-[#86868B] hover:text-[#007AFF] transition"
            title="Calendario"
          >
            <CalendarIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setCalculatorOpen(true)}
            className="p-2 rounded-xl text-[#86868B] hover:text-[#FF9500] transition"
            title="Calcolatrice iOS (Cmd + J)"
          >
            <Calculator className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={togglePrivacy}
            className={`p-2 rounded-xl transition ${isPrivacyMode ? 'text-[#007AFF] bg-blue-50 dark:bg-blue-900/30' : 'text-[#86868B]'}`}
            title="Privacy"
          >
            {isPrivacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-[#86868B] transition"
            title="Tema"
          >
            {isDark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-xl text-[#86868B] hover:text-[#FF3B30] transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================================= */}
      <main className="flex-1 md:ml-64 lg:ml-72 p-3 sm:p-5 md:p-6 lg:p-8 pb-28 md:pb-10 min-h-screen overflow-x-hidden">
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
          {renderContent()}
        </div>
      </main>

      {/* ========================================================= */}
      {/* MOBILE BOTTOM TAB BAR (< md) — Frosted Glass Apple HIG */}
      {/* ========================================================= */}
      <nav 
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/85 dark:bg-[#1C1C1E]/80 backdrop-blur-2xl border-t border-gray-200/60 dark:border-white/10 px-5 pt-2.5 shadow-lg"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 12px)' }}
      >
        <div className="flex items-center justify-around">
          <button
            type="button"
            onClick={() => setCurrentTab('home')}
            className={`flex flex-col items-center gap-1 py-1 transition-all ${
              currentTab === 'home' ? 'text-[#007AFF] font-bold' : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px]">Home</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('analytics')}
            className={`flex flex-col items-center gap-1 py-1 transition-all ${
              currentTab === 'analytics' ? 'text-[#007AFF] font-bold' : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px]">Analisi</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenModal('expense')}
            className="w-12 h-12 -mt-5 rounded-full bg-[#007AFF] text-white flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
            title="Nuovo Movimento"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('history')}
            className={`flex flex-col items-center gap-1 py-1 transition-all ${
              currentTab === 'history' ? 'text-[#007AFF] font-bold' : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-[10px]">Documenti</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentTab('profile')}
            className={`flex flex-col items-center gap-1 py-1 transition-all ${
              currentTab === 'profile' ? 'text-[#007AFF] font-bold' : 'text-[#86868B] hover:text-[#1D1D1F]'
            }`}
          >
            <UserCircle2 className="w-5 h-5" />
            <span className="text-[10px]">Profilo</span>
          </button>
        </div>
      </nav>

      {/* Modal / Bottom Sheet Movimento */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setModalPresetAmount(null);
        }}
        defaultType={modalDefaultType}
        presetAmount={modalPresetAmount}
      />

      {/* Calcolatrice Globale iOS */}
      <CalculatorModal
        isOpen={calculatorOpen}
        onClose={() => setCalculatorOpen(false)}
        onUseAmount={handleUseCalculatorAmount}
      />

      {/* Popover Calendario a Scomparsa */}
      <CalendarPopoverModal
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
      />
    </div>
  );
};
