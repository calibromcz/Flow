import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const THEME_VARIANTS = {
  light: {
    id: 'light',
    name: 'Light (Cupertino)',
    subtitle: 'Bianco puro e grigio Apple',
    isDark: false,
    appBg: '#F5F5F7',
    cardBg: '#FFFFFF',
    cardBorder: '#E5E7EB',
    textPrimary: '#1D1D1F',
    textSecondary: '#86868B',
    accent: '#007AFF',
    badgeBg: '#EBF5FF',
    badgeText: '#007AFF'
  },
  dark: {
    id: 'dark',
    name: 'Dark (OLED)',
    subtitle: 'Nero profondo a contrasto elevato',
    isDark: true,
    appBg: '#000000',
    cardBg: '#1C1C1E',
    cardBorder: 'rgba(255, 255, 255, 0.10)',
    textPrimary: '#F5F5F7',
    textSecondary: '#98989D',
    accent: '#0A84FF',
    badgeBg: 'rgba(10, 132, 255, 0.15)',
    badgeText: '#64D2FF'
  },
  ocean: {
    id: 'ocean',
    name: 'Blu Oceano / Artico',
    subtitle: 'Freschezza glaciale e accenti blu mare',
    isDark: false,
    appBg: '#EEF4FA',
    cardBg: '#FFFFFF',
    cardBorder: '#D0E2F2',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    accent: '#0071E3',
    badgeBg: '#E0F0FE',
    badgeText: '#0071E3'
  },
  sage: {
    id: 'sage',
    name: 'Verde Salvia / Foresta',
    subtitle: 'Toni naturali e rilassanti',
    isDark: false,
    appBg: '#EFF5F1',
    cardBg: '#FFFFFF',
    cardBorder: '#CDE0D5',
    textPrimary: '#14261D',
    textSecondary: '#52796F',
    accent: '#2E7D5B',
    badgeBg: '#E2F3E9',
    badgeText: '#2E7D5B'
  },
  warm: {
    id: 'warm',
    name: 'Sabbia / Titanio Caldo',
    subtitle: 'Eleganza accogliente e finitura sabbia',
    isDark: false,
    appBg: '#F5F2EB',
    cardBg: '#FFFCF7',
    cardBorder: '#E6DEC8',
    textPrimary: '#26221E',
    textSecondary: '#786F66',
    accent: '#8C6D46',
    badgeBg: '#F1E9DC',
    badgeText: '#8C6D46'
  }
};

export const ThemeProvider = ({ children }) => {
  const [themeVariant, setThemeVariant] = useState(() => {
    const saved = localStorage.getItem('flow_theme_variant');
    if (saved && THEME_VARIANTS[saved]) return saved;
    // Fallback retrocompatibile con flusso_theme
    const legacy = localStorage.getItem('flusso_theme');
    if (legacy === 'dark') return 'dark';
    return 'light';
  });

  const activeTheme = THEME_VARIANTS[themeVariant] || THEME_VARIANTS.light;
  const isDark = activeTheme.isDark;

  useEffect(() => {
    const root = document.documentElement;
    // Salva preferenza
    localStorage.setItem('flow_theme_variant', themeVariant);
    localStorage.setItem('flusso_theme', isDark ? 'dark' : 'light');

    // Applica classi dark se è dark
    if (isDark) {
      root.classList.add('dark', 'dark-theme');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark', 'dark-theme');
      root.classList.add('light');
    }

    // Applica le classi per le varianti
    root.classList.remove('theme-ocean', 'theme-sage', 'theme-warm');
    if (themeVariant === 'ocean') root.classList.add('theme-ocean');
    if (themeVariant === 'sage') root.classList.add('theme-sage');
    if (themeVariant === 'warm') root.classList.add('theme-warm');

    // Inietta variabili CSS per lo sfondo, card, bordi, testi e accenti
    root.style.setProperty('--flow-app-bg', activeTheme.appBg);
    root.style.setProperty('--flow-card-bg', activeTheme.cardBg);
    root.style.setProperty('--flow-card-border', activeTheme.cardBorder);
    root.style.setProperty('--flow-text-primary', activeTheme.textPrimary);
    root.style.setProperty('--flow-text-secondary', activeTheme.textSecondary);
    root.style.setProperty('--flow-accent', activeTheme.accent);

    document.body.style.backgroundColor = activeTheme.appBg;
    document.body.style.color = activeTheme.textPrimary;
  }, [themeVariant, activeTheme, isDark]);

  const setVariant = (variantId) => {
    if (THEME_VARIANTS[variantId]) {
      setThemeVariant(variantId);
    }
  };

  const toggleTheme = () => {
    setThemeVariant(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const setTheme = (mode) => {
    if (mode === 'dark') setThemeVariant('dark');
    else setThemeVariant('light');
  };

  return (
    <ThemeContext.Provider value={{ 
      themeVariant, 
      activeTheme, 
      setVariant, 
      themeMode: isDark ? 'dark' : 'light', 
      isDark, 
      toggleTheme, 
      setTheme,
      THEME_VARIANTS 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
