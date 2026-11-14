import React, { createContext, useContext, useState, useEffect } from 'react';

const PaletteContext = createContext();

export const DEFAULT_PALETTE = {
  appBg: '#F5F5F7',
  incomeCardBg: '#FFFFFF',
  expenseCardBg: '#FFFFFF',
  savingsCardBg: '#FFFFFF',
  goalsCardBg: '#FFFFFF',
  categoriesCardBg: '#FFFFFF',
  primaryAccent: '#007AFF',
  incomeColor: '#32B87A',
  expenseColor: '#F25449'
};

export const PaletteProvider = ({ children }) => {
  const [palette, setPalette] = useState(() => {
    try {
      const saved = localStorage.getItem('flow_custom_palette');
      if (saved) {
        return { ...DEFAULT_PALETTE, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Errore lettura palette:", e);
    }
    return DEFAULT_PALETTE;
  });

  useEffect(() => {
    try {
      localStorage.setItem('flow_custom_palette', JSON.stringify(palette));
    } catch (e) {
      console.error("Errore salvataggio palette:", e);
    }

    // Applica le variabili CSS al root document per consentire personalizzazione in tempo reale
    const root = document.documentElement;
    if (palette.appBg) {
      root.style.setProperty('--flow-app-bg', palette.appBg);
    }
    if (palette.primaryAccent) {
      root.style.setProperty('--flow-accent', palette.primaryAccent);
    }
    if (palette.incomeColor) {
      root.style.setProperty('--flow-income', palette.incomeColor);
    }
    if (palette.expenseColor) {
      root.style.setProperty('--flow-expense', palette.expenseColor);
    }
  }, [palette]);

  const updatePalette = (key, value) => {
    setPalette(prev => ({ ...prev, [key]: value }));
  };

  const resetToDefaultPalette = () => {
    setPalette(DEFAULT_PALETTE);
    localStorage.removeItem('flow_custom_palette');
    const root = document.documentElement;
    root.style.removeProperty('--flow-app-bg');
    root.style.removeProperty('--flow-accent');
    root.style.removeProperty('--flow-income');
    root.style.removeProperty('--flow-expense');
  };

  return (
    <PaletteContext.Provider value={{ palette, updatePalette, resetToDefaultPalette, DEFAULT_PALETTE }}>
      {children}
    </PaletteContext.Provider>
  );
};

export const usePalette = () => useContext(PaletteContext);

