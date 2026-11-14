import React, { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { PrivacyProvider } from './context/PrivacyContext';
import { PaletteProvider } from './context/PaletteContext';
import { MainApp } from './components/MainApp';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ConfigProvider, theme as antdTheme } from 'antd';
import itIT from 'antd/locale/it_IT';

// Icone Lucide per CATEGORY_ICONS / ICON_MAP
import {
  Tag,
  Plus,
  Wallet,
  Snowflake,
  Mail,
  Inbox,
  Send,
  AtSign,
  CalendarPlus,
  Share2,
  ShoppingCart,
  ShoppingBag,
  Utensils,
  Coffee,
  Pizza,
  Wine,
  IceCream,
  Croissant,
  Home,
  Lightbulb,
  Droplets,
  Wifi,
  Wrench,
  Sofa,
  Sparkles,
  Key,
  Car,
  Fuel,
  Bus,
  Train,
  Plane,
  Bike,
  MapPin,
  Compass,
  Dices,
  Gamepad2,
  Music,
  Film,
  BookOpen,
  Ticket,
  Trophy,
  Camera,
  HeartPulse,
  Pill,
  Dumbbell,
  Scissors,
  Shirt,
  Watch,
  PawPrint,
  Stethoscope,
  Briefcase,
  Landmark,
  TrendingUp,
  CreditCard,
  Gift,
  Smartphone,
  Package,
  HelpCircle,
  ChevronDown,
  ArrowUpRight,
  ExternalLink
} from 'lucide-react';

export const ICON_MAP = {
  Tag,
  Plus,
  Wallet,
  Snowflake,
  Mail,
  Inbox,
  Send,
  AtSign,
  CalendarPlus,
  Share2,
  ShoppingCart,
  ShoppingBag,
  Utensils,
  Coffee,
  Pizza,
  Wine,
  IceCream,
  Croissant,
  Home,
  Lightbulb,
  Droplets,
  Wifi,
  Wrench,
  Sofa,
  Sparkles,
  Key,
  Car,
  Fuel,
  Bus,
  Train,
  Plane,
  Bike,
  MapPin,
  Compass,
  Dices,
  Gamepad2,
  Music,
  Film,
  BookOpen,
  Ticket,
  Trophy,
  Camera,
  HeartPulse,
  Pill,
  Dumbbell,
  Scissors,
  Shirt,
  Watch,
  PawPrint,
  Stethoscope,
  Briefcase,
  Landmark,
  TrendingUp,
  CreditCard,
  Gift,
  Smartphone,
  Package,
  HelpCircle,
  ChevronDown,
  ArrowUpRight,
  ExternalLink
};

export const CATEGORY_ICONS = ICON_MAP;

// Helper sicuro per renderizzare le icone senza mai far crashare React
export const renderSafeIcon = (iconName, props = {}) => {
  const IconComp = (typeof iconName === 'string' && ICON_MAP[iconName]) ? ICON_MAP[iconName] : Tag;
  return <IconComp {...props} />;
};

// 1. DEEP LINK BANCHE (Apertura diretta app nativa smartphone)
export const BANK_SCHEMES = {
  ing: 'ing://',
  satispay: 'satispay://',
  paypal: 'paypal://',
  revolut: 'revolut://',
  intesa: 'intesasanpaolo://',
  intesasanpaolo: 'intesasanpaolo://',
  isybank: 'isybank://',
  unicredit: 'unicredit://',
  fineco: 'fineco://',
  postepay: 'postepay://',
  bancoposta: 'bancoposta://',
  bbva: 'bbva://',
  n26: 'n26://',
  hype: 'hype://',
  traderepublic: 'traderepublic://'
};

export const openNativeBankApp = (schemeUrl) => {
  if (!schemeUrl) return;
  try {
    window.location.href = schemeUrl;
  } catch {
    window.open(schemeUrl, '_self');
  }
};

// 2. ACCESSO RAPIDO EMAIL (Apertura diretta client email nativo)
export const EMAIL_SCHEMES = {
  appleMail: 'message://',
  gmail: 'googlegmail://',
  outlook: 'ms-outlook://',
  spark: 'readdle-spark://',
  yahoo: 'ymail://',
  proton: 'protonmail://',
  libero: 'liberomail://'
};

export const openNativeEmailApp = (schemeUrl) => {
  if (!schemeUrl) return;
  try {
    window.location.href = schemeUrl;
  } catch {
    window.open(schemeUrl, '_self');
  }
};

// 3. GENERATORE DI PROMEMORIA CALENDARIO .ICS PER TELEFONO (iOS / Android con VALARM a -30m)
export const generateIcsContent = ({ title, dateStr, timeStr = '09:00', amount, note }) => {
  const pad = (n) => String(n).padStart(2, '0');
  const [y, m, d] = (dateStr || new Date().toISOString().split('T')[0]).split('-').map(Number);
  const [hh, mm] = (timeStr || '09:00').split(':').map(Number);
  const startDate = new Date(Date.UTC(y, m - 1, d, hh || 9, mm || 0, 0));
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

  const formatUtc = (dt) =>
    dt.getUTCFullYear() +
    pad(dt.getUTCMonth() + 1) +
    pad(dt.getUTCDate()) +
    'T' +
    pad(dt.getUTCHours()) +
    pad(dt.getUTCMinutes()) +
    pad(dt.getUTCSeconds()) +
    'Z';

  const dtStamp = formatUtc(new Date());
  const dtStart = formatUtc(startDate);
  const dtEnd = formatUtc(endDate);
  const uid = `flow-reminder-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@flow.app`;
  const summary = `${title || 'Promemoria FLOW'}${amount ? ` (${Number(amount).toFixed(2)} €)` : ''}`;
  const desc = `Promemoria registrato su FLOW - Finanza Personale.${amount ? `\\nImporto: ${Number(amount).toFixed(2)} €` : ''}${note ? `\\nNota: ${note}` : ''}`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FLOW//FLOW Finanza Personale//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${desc}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    `DESCRIPTION:Promemoria: ${summary}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
};

export const downloadIcsReminder = ({ title, dateStr, timeStr, amount, note }) => {
  const icsText = generateIcsContent({ title, dateStr, timeStr, amount, note });
  const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(title || 'Promemoria').replace(/[^a-zA-Z0-9_-]/g, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 300);
};

// Calcolo sicuro Bussola Giornaliera: solo ed esclusivamente Cashflow (Entrate - Uscite) / Giorni Rimanenti
export const calculateDailyCompass = ({ totalIncome, totalExpenses, daysInMonth, currentDay }) => {
  const safeIncome = Number(totalIncome) || 0;
  const safeExpenses = Number(totalExpenses) || 0;
  const safeCashflow = safeIncome - safeExpenses;
  const today = new Date();
  const safeDaysInMonth = daysInMonth ? Number(daysInMonth) : new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const safeCurrentDay = currentDay ? Number(currentDay) : today.getDate();
  const remainingDays = Math.max(1, safeDaysInMonth - safeCurrentDay + 1);
  const dailyCompassBudget = safeCashflow > 0 ? (safeCashflow / remainingDays) : 0;
  const roundedDailyBudget = Math.round(dailyCompassBudget * 100) / 100;

  return {
    safeIncome,
    safeExpenses,
    safeCashflow,
    remainingDays,
    dailyCompassBudget: roundedDailyBudget,
    formattedDailyBudget: new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(roundedDailyBudget),
    formattedCashflow: new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(safeCashflow)
  };
};

function AppContent() {
  const { isDark } = useTheme();

  // Sanitizzazione categorie salvate in localStorage all'avvio: assicura che icon sia stringa
  useEffect(() => {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('flusso_prod_v1_categories_') || key.includes('categories'))) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            let modified = false;
            ['expense', 'income'].forEach(type => {
              if (Array.isArray(parsed?.[type])) {
                parsed[type] = parsed[type].map(cat => {
                  if (typeof cat.icon !== 'string') {
                    modified = true;
                    return { ...cat, icon: (cat.icon && typeof cat.icon.name === 'string') ? cat.icon.name : 'Tag' };
                  }
                  return cat;
                });
              }
            });
            if (modified) {
              localStorage.setItem(key, JSON.stringify(parsed));
            }
          }
        }
      }
    } catch {
      // Ignora errori di parsing su chiavi non correlate
    }
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#F5F5F7] dark:bg-[#000000] text-[#1D1D1F] dark:text-white">
      <ConfigProvider
        locale={itIT}
        theme={{
          algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            colorPrimary: isDark ? '#0A84FF' : '#007AFF',
            borderRadius: 18,
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif',
            colorBgContainer: isDark ? '#1C1C1E' : '#FFFFFF',
            colorBgElevated: isDark ? '#2C2C2E' : '#FFFFFF',
            colorBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB',
            colorText: isDark ? '#FFFFFF' : '#1D1D1F',
            colorTextSecondary: isDark ? '#8E8E93' : '#86868B',
          },
        }}
      >
        <AuthProvider>
          <FinanceProvider>
            <PrivacyProvider>
              <PaletteProvider>
                <ErrorBoundary>
                  <MainApp />
                </ErrorBoundary>
              </PaletteProvider>
            </PrivacyProvider>
          </FinanceProvider>
        </AuthProvider>
      </ConfigProvider>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
