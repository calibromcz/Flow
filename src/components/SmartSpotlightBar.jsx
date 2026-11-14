import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from './CategoryIcon';
import { Sparkles, CornerDownLeft, ArrowUpRight, ArrowDownLeft, Tag, Check, ChevronDown } from 'lucide-react';
import { message, Dropdown } from 'antd';
import { parseAmount } from '../utils/numberUtils';
import { FlowIcon } from './FlowLogo';

export const SmartSpotlightBar = () => {
  const { categories, addTransaction, transactions } = useFinance();
  const [inputVal, setInputVal] = useState('');
  const [manualType, setManualType] = useState(null); // 'income' | 'expense' | null
  const [selectedCategoryOverride, setSelectedCategoryOverride] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  // Calcolo automatico delle 3-4 spese più frequenti (o fallback smart)
  const frequentQuickPills = useMemo(() => {
    const expenseTx = (transactions || []).filter(t => t.type === 'expense');
    const counts = {};

    expenseTx.forEach(t => {
      const key = `${(t.note || t.category || '').trim().toLowerCase()}|${Number(t.amount)}|${t.category}`;
      if (!counts[key]) {
        counts[key] = {
          label: `${t.note ? t.note : t.category} ${formatCurrency(t.amount)}`,
          note: t.note || t.category,
          amount: Number(t.amount),
          category: t.category,
          count: 0
        };
      }
      counts[key].count += 1;
    });

    const sorted = Object.values(counts)
      .filter(item => item.amount > 0)
      .sort((a, b) => b.count - a.count);

    if (sorted.length >= 3) {
      return sorted.slice(0, 4);
    }

    // Default smart se l'utente ha pochi movimenti registrati
    const defaultSuggestions = [
      { label: '☕ Caffè 1,50 €', note: 'Caffè', amount: 1.5, category: 'Alimentari & Ristoranti' },
      { label: '🍕 Pizza 12,00 €', note: 'Pizza', amount: 12, category: 'Alimentari & Ristoranti' },
      { label: '⛽ Benzina 30,00 €', note: 'Benzina', amount: 30, category: 'Trasporti & Auto' }
    ];

    // Combina i frequenti dell'utente con i default senza duplicare
    const combined = [...sorted];
    for (const def of defaultSuggestions) {
      if (combined.length >= 3) break;
      if (!combined.some(c => c.note.toLowerCase() === def.note.toLowerCase())) {
        combined.push(def);
      }
    }
    return combined;
  }, [transactions]);

  const handleQuickPillTap = async (pill) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await addTransaction({
        type: 'expense',
        amount: pill.amount,
        category: pill.category,
        note: pill.note,
        date: todayStr
      });
      message.success(`✓ Aggiunto in 1 Tap: ${pill.note} (${formatCurrency(pill.amount)})`);
    } catch (err) {
      console.error("Errore quick pill:", err);
      message.error("Errore durante l'inserimento rapido.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const SYNONYM_MAP = {
    'pizza': 'Alimentari & Ristoranti',
    'ristorante': 'Alimentari & Ristoranti',
    'cena': 'Alimentari & Ristoranti',
    'pranzo': 'Alimentari & Ristoranti',
    'bar': 'Alimentari & Ristoranti',
    'caffè': 'Alimentari & Ristoranti',
    'caffe': 'Alimentari & Ristoranti',
    'spesa': 'Alimentari & Ristoranti',
    'supermercato': 'Alimentari & Ristoranti',
    'esselunga': 'Alimentari & Ristoranti',
    'conad': 'Alimentari & Ristoranti',
    'coop': 'Alimentari & Ristoranti',
    'benzina': 'Trasporti & Auto',
    'diesel': 'Trasporti & Auto',
    'carburante': 'Trasporti & Auto',
    'treno': 'Trasporti & Auto',
    'metro': 'Trasporti & Auto',
    'autostrada': 'Trasporti & Auto',
    'telepass': 'Trasporti & Auto',
    'parcheggio': 'Trasporti & Auto',
    'taxi': 'Trasporti & Auto',
    'uber': 'Trasporti & Auto',
    'affitto': 'Casa & Affitto',
    'mutuo': 'Casa & Affitto',
    'condominio': 'Casa & Affitto',
    'luce': 'Bollette & Utenze',
    'gas': 'Bollette & Utenze',
    'enel': 'Bollette & Utenze',
    'bolletta': 'Bollette & Utenze',
    'wifi': 'Bollette & Utenze',
    'internet': 'Bollette & Utenze',
    'cinema': 'Shopping & Svago',
    'film': 'Shopping & Svago',
    'abiti': 'Shopping & Svago',
    'vestiti': 'Shopping & Svago',
    'zara': 'Shopping & Svago',
    'amazon': 'Shopping & Svago',
    'apple': 'Tecnologia & Abbonamenti',
    'spotify': 'Tecnologia & Abbonamenti',
    'netflix': 'Tecnologia & Abbonamenti',
    'icloud': 'Tecnologia & Abbonamenti',
    'stipendio': 'Stipendio',
    'bonus': 'Stipendio',
    'salario': 'Stipendio',
    'freelance': 'Freelance & Extra',
    'consulenza': 'Freelance & Extra',
    'extra': 'Freelance & Extra',
    'dividendi': 'Investimenti & Dividendi',
    'crypto': 'Investimenti & Dividendi',
    'regalo': 'Regali & Rimborsi',
    'rimborso': 'Regali & Rimborsi'
  };

  const parsedResult = useMemo(() => {
    const raw = inputVal.trim();
    if (!raw) return null;

    let autoType = raw.startsWith('+') ? 'income' : 'expense';
    let cleanText = raw.startsWith('+') ? raw.slice(1).trim() : raw;

    const numberMatch = cleanText.match(/\b\d+([.,]\d{1,2})?\b/);
    if (!numberMatch) return null;

    const amount = parseAmount(numberMatch[0]);
    if (isNaN(amount) || amount <= 0) return null;

    const textWithoutAmount = cleanText.replace(numberMatch[0], '').trim();
    const words = textWithoutAmount.toLowerCase().split(/\s+/).filter(Boolean);

    // Se l'utente non ha impostato uno switch manuale, deduzione automatica
    let effectiveType = manualType || autoType;

    const availableCategories = categories[effectiveType] || [];
    let detectedCategory = null;

    if (selectedCategoryOverride) {
      detectedCategory = { name: selectedCategoryOverride };
    } else {
      for (const w of words) {
        if (SYNONYM_MAP[w]) {
          const targetName = SYNONYM_MAP[w];
          const found = availableCategories.find(c => c.name.toLowerCase() === targetName.toLowerCase());
          if (found) {
            detectedCategory = found;
            if (!manualType && ['Stipendio', 'Freelance & Extra', 'Investimenti & Dividendi', 'Regali & Rimborsi'].includes(targetName)) {
              effectiveType = 'income';
            }
            break;
          }
        }

        const direct = availableCategories.find(c => c.name.toLowerCase().includes(w));
        if (direct) {
          detectedCategory = direct;
          break;
        }
      }

      if (!detectedCategory) {
        detectedCategory = availableCategories[0] || { name: effectiveType === 'income' ? 'Stipendio' : 'Alimentari & Ristoranti' };
      }
    }

    let note = textWithoutAmount;
    if (note) {
      note = note.charAt(0).toUpperCase() + note.slice(1);
    } else {
      note = detectedCategory.name;
    }

    return {
      type: effectiveType,
      amount,
      category: detectedCategory.name,
      note
    };
  }, [inputVal, manualType, selectedCategoryOverride, categories]);

  const handleConfirm = async () => {
    if (!parsedResult) return;

    setSubmitting(true);
    try {
      await addTransaction({
        type: parsedResult.type,
        amount: parsedResult.amount,
        category: parsedResult.category,
        note: parsedResult.note,
        date: new Date().toISOString().split('T')[0]
      });

      message.success(
        `${parsedResult.type === 'income' ? 'Entrata' : 'Spesa'} registrata: ${formatCurrency(parsedResult.amount)} (${parsedResult.category})`
      );
      setInputVal('');
      setManualType(null);
      setSelectedCategoryOverride(null);
      inputRef.current?.blur();
    } catch {
      message.error("Errore durante l'inserimento rapido.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleConfirm();
  };

  const currentAvailableCategories = categories[parsedResult?.type || manualType || 'expense'] || [];
  const categoryMenuItems = currentAvailableCategories.map(cat => ({
    key: cat.name,
    label: cat.name,
    onClick: () => setSelectedCategoryOverride(cat.name)
  }));

  return (
    <div className="relative w-full">
      <form onSubmit={handleFormSubmit} className="relative flex items-center">
        <div className="relative w-full apple-card rounded-2xl p-2.5 sm:p-3 flex items-center gap-3 transition-all focus-within:ring-2 focus-within:ring-[#007AFF]/40 focus-within:border-[#007AFF]">
          <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-white/10 flex items-center justify-center shrink-0 border border-neutral-200/60 dark:border-white/10 shadow-2xs">
            <FlowIcon size={20} className="w-5 h-5 shrink-0" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              // Reset override se l'utente svuota
              if (!e.target.value.trim()) {
                setManualType(null);
                setSelectedCategoryOverride(null);
              }
            }}
            placeholder="⚡ Inserimento rapido: es. &quot;Pizza 18&quot; o &quot;150 Bonus&quot;"
            className="w-full bg-transparent text-xs sm:text-sm font-medium text-[#1D1D1F] dark:text-white placeholder:text-[#86868B] outline-none"
          />

          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <kbd className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-[#3A3A3C] border border-gray-200 dark:border-white/10 text-[10px] font-mono font-bold text-[#86868B] dark:text-gray-300">
              ⌘K
            </kbd>
          </div>
        </div>
      </form>

      {/* Pillole 1-Tap iOS Style per Spese Abitudinarie Frequenti */}
      {frequentQuickPills.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] dark:text-gray-400 shrink-0 pl-1 select-none">
            1-Tap:
          </span>
          {frequentQuickPills.map((pill, idx) => (
            <button
              key={`${pill.note}-${pill.amount}-${idx}`}
              type="button"
              onClick={() => handleQuickPillTap(pill)}
              disabled={submitting}
              className="rounded-full px-3 py-1 text-xs font-medium bg-neutral-200/70 dark:bg-neutral-800/80 hover:bg-neutral-300/80 dark:hover:bg-neutral-700/80 text-[#1D1D1F] dark:text-white border border-black/5 dark:border-white/10 shadow-2xs hover:scale-105 active:scale-95 transition cursor-pointer shrink-0 flex items-center gap-1"
              title={`Registra subito ${pill.note} (${formatCurrency(pill.amount)})`}
            >
              <span>{pill.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Riconoscimento Live + Switch Uscita/Entrata + Categoria + Tasto Conferma */}
      {parsedResult && (
        <div className="mt-2.5 p-3 apple-card rounded-2xl border border-blue-200/80 dark:border-sky-500/30 animate-fade-in shadow-xs flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Switch compatto a pillola per Uscita / Entrata */}
            <div className="inline-flex bg-gray-100 dark:bg-white/10 p-0.5 rounded-xl border border-gray-200/60 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  setManualType('expense');
                  setSelectedCategoryOverride(null);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  parsedResult.type === 'expense'
                    ? 'bg-[#F25449] text-white shadow-xs'
                    : 'text-[#86868B] hover:text-[#1D1D1F] dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                <span>− Uscita</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setManualType('income');
                  setSelectedCategoryOverride(null);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  parsedResult.type === 'income'
                    ? 'bg-[#32B87A] text-white shadow-xs'
                    : 'text-[#86868B] hover:text-[#1D1D1F] dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                <span>+ Entrata</span>
              </button>
            </div>

            {/* Importo Rilevato */}
            <span className="font-extrabold text-sm text-[#1D1D1F] dark:text-white px-1">
              {formatCurrency(parsedResult.amount)}
            </span>

            {/* 2. Badge Categoria Riconosciuta Cliccabile */}
            <Dropdown menu={{ items: categoryMenuItems }} trigger={['click']}>
              <button
                type="button"
                className="px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200/70 text-[#1D1D1F] dark:text-gray-200 text-xs font-semibold flex items-center gap-1.5 border border-gray-200/60 dark:border-white/10 cursor-pointer transition active:scale-95"
                title="Tocca per cambiare categoria al volo"
              >
                <Tag className="w-3 h-3 text-[#007AFF]" />
                <span className="font-bold">{parsedResult.category}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
            </Dropdown>

            {parsedResult.note && (
              <span className="text-xs text-[#86868B] dark:text-gray-400 italic truncate max-w-[120px] sm:max-w-xs">
                "{parsedResult.note}"
              </span>
            )}
          </div>

          {/* 3. Pulsante Esplicito Conferma */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="px-4 py-1.5 rounded-xl bg-[#007AFF] hover:bg-blue-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer ml-auto"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Conferma</span>
          </button>
        </div>
      )}
    </div>
  );
};
