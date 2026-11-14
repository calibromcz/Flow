import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CategoryIcon } from './CategoryIcon';
import { IconPicker } from './IconPicker';
import { 
  X, 
  Plus, 
  Repeat, 
  Tag, 
  ShoppingCart, 
  Briefcase, 
  Home, 
  Sparkles, 
  Car, 
  Utensils 
} from 'lucide-react';
import { message, Modal } from 'antd';
import { parseAmount } from '../utils/numberUtils';

export const TransactionModal = ({ isOpen, onClose, defaultType = 'expense', presetAmount = null }) => {
  const { categories, addTransaction, addCategory } = useFinance();
  const [type, setType] = useState(defaultType);
  const [amountStr, setAmountStr] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [note, setNote] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modale creazione categoria personalizzata
  const [customCatModal, setCustomCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#007AFF');
  const [newCatIcon, setNewCatIcon] = useState('ShoppingCart');
  const [newCatIsFixed, setNewCatIsFixed] = useState(false);
  const [newCatFixedAmount, setNewCatFixedAmount] = useState('');
  const [newCatFixedDay, setNewCatFixedDay] = useState(1);

  const amountInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      if (presetAmount !== null && presetAmount !== undefined && Number(presetAmount) > 0) {
        setAmountStr(String(presetAmount));
      } else {
        setAmountStr('');
      }
      setNote('');
      setTxDate(new Date().toISOString().split('T')[0]);
      setIsRecurring(false);
      const defaultList = Array.isArray(categories?.[defaultType]) ? categories[defaultType] : [];
      if (defaultList.length > 0) {
        setSelectedCategory(defaultList[0]);
      } else {
        setSelectedCategory(null);
      }
      setTimeout(() => {
        amountInputRef.current?.focus();
        amountInputRef.current?.select();
      }, 50);
    }
  }, [isOpen, defaultType, presetAmount, categories]);

  const handleCategorySelect = (cat) => {
    if (!cat) return;
    setSelectedCategory(cat);
    if (cat.is_fixed) {
      setIsRecurring(true);
      if (cat.fixed_amount && (!amountStr || amountStr === '0')) {
        setAmountStr(String(cat.fixed_amount));
      }
    }
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    const list = Array.isArray(categories?.[newType]) ? categories[newType] : [];
    if (list.length > 0) {
      handleCategorySelect(list[0]);
    } else {
      setSelectedCategory(null);
    }
  };

  // Smart Math Inline (valutazione sicura di espressioni come 12+4.50 o 50-15)
  const evaluateInlineMath = (str) => {
    if (!str) return '';
    const clean = str.replace(',', '.').replace(/\s+/g, '');
    // Supporta numeri, +, -, *, /, decimali
    if (/^[\d+/*.-]+$/.test(clean) && /[+/*-]/.test(clean)) {
      try {
        // Valutazione aritmetica sicura con Function limitata a espressioni matematiche
        // eslint-disable-next-line no-new-func
        const res = Function(`"use strict"; return (${clean})`)();
        if (typeof res === 'number' && !isNaN(res) && isFinite(res) && res >= 0) {
          return String(Math.round(res * 100) / 100);
        }
      } catch {
        // Se l'espressione non è ancora terminata lascia la stringa com'è
      }
    }
    return str;
  };

  const handleAmountBlur = () => {
    const evaluated = evaluateInlineMath(amountStr);
    if (evaluated !== amountStr) {
      setAmountStr(evaluated);
    }
  };

  const handleAddChip = (delta) => {
    const evaluated = evaluateInlineMath(amountStr);
    const current = parseAmount(evaluated);
    const nextVal = Math.round((current + delta) * 100) / 100;
    setAmountStr(String(nextVal));
    amountInputRef.current?.focus();
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const evaluated = evaluateInlineMath(amountStr);
    const numeric = parseAmount(evaluated);

    if (!numeric || numeric <= 0) {
      message.error("Inserisci un importo valido maggiore di zero.");
      amountInputRef.current?.focus();
      return;
    }

    if (!selectedCategory) {
      message.error("Seleziona una categoria.");
      return;
    }

    setSaving(true);
    try {
      const day = txDate ? new Date(txDate).getDate() : new Date().getDate();
      await addTransaction({
        type,
        amount: numeric,
        category: selectedCategory.name,
        note: note.trim(),
        date: txDate || new Date().toISOString().split('T')[0],
        is_recurring: isRecurring,
        recurring_day: day
      });

      message.success(
        isRecurring
          ? `${type === 'income' ? 'Entrata' : 'Spesa'} ricorrente salvata!`
          : `${type === 'income' ? 'Entrata' : 'Spesa'} registrata!`
      );
      onClose();
    } catch (err) {
      console.error(err);
      message.error(err.message || "Errore durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCustomCategory = async () => {
    if (!newCatName.trim()) {
      message.error("Inserisci un nome per la categoria.");
      return;
    }

    try {
      const created = await addCategory(type, {
        name: newCatName.trim(),
        icon: newCatIcon || 'ShoppingCart',
        color: newCatColor || '#007AFF',
        is_fixed: newCatIsFixed,
        fixed_amount: newCatIsFixed && newCatFixedAmount ? Number(newCatFixedAmount) : null,
        fixed_day: newCatIsFixed ? Number(newCatFixedDay || 1) : 1
      });
      if (created) {
        handleCategorySelect(created);
      }
      setNewCatName('');
      setNewCatIsFixed(false);
      setNewCatFixedAmount('');
      setNewCatFixedDay(1);
      setCustomCatModal(false);
      message.success(newCatIsFixed ? "Nuova categoria fissa salvata!" : "Nuova categoria salvata!");
    } catch {
      message.error("Errore salvataggio categoria.");
    }
  };

  if (!isOpen) return null;

  const currentCategoryList = Array.isArray(categories?.[type]) ? categories[type] : [];
  const isExpense = type === 'expense';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-md p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 dark:border-white/10 text-[#1D1D1F] dark:text-white"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)' }}
      >
        {/* Maniglia iOS Mobile */}
        <div className="w-full pt-3 pb-1 flex justify-center sm:hidden">
          <div className="w-10 h-1 bg-gray-300 dark:bg-neutral-600 rounded-full" />
        </div>

        {/* Header con Switch Rapido (Segmented Control iOS) & Chiudi */}
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-100 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Segmented Control iOS */}
          <div className="bg-gray-100 dark:bg-neutral-800 p-1 rounded-2xl flex items-center gap-1 border border-black/5 dark:border-white/10">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                isExpense
                  ? 'bg-[#FF3B30] text-white shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>🔴 Uscita</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                !isExpense
                  ? 'bg-[#32B87A] text-white shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>🟢 Entrata</span>
            </button>
          </div>

          <div className="w-8" />
        </div>

        {/* Form Corpo: Apple Pay Style */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[82vh] no-scrollbar">
          {/* 1. Input Importo Gigante e Centrato */}
          <div className="text-center space-y-2">
            <span className="text-[11px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 block">
              {isExpense ? 'Quanto hai speso?' : 'Quanto hai incassato?'}
            </span>

            <div className="flex items-center justify-center gap-1">
              <span className={`text-3xl sm:text-4xl font-semibold select-none ${isExpense ? 'text-[#FF3B30]' : 'text-[#32B87A]'}`}>
                €
              </span>
              <input
                ref={amountInputRef}
                type="text"
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                onBlur={handleAmountBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAmountBlur();
                    handleSave();
                  }
                }}
                placeholder="0,00"
                className={`text-4xl sm:text-5xl font-black text-center bg-transparent outline-none w-56 sm:w-64 tracking-tight transition ${
                  isExpense ? 'text-[#FF3B30] dark:text-[#FF453A]' : 'text-[#32B87A] dark:text-[#30D158]'
                } placeholder-gray-300 dark:placeholder-neutral-700`}
              />
            </div>

            {/* Chip Somma Rapida (+5 €, +10 €, +20 €, +50 €) */}
            <div className="flex items-center justify-center gap-2 pt-1">
              {[5, 10, 20, 50].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => handleAddChip(delta)}
                  className="px-3 py-1 rounded-full text-xs font-bold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700 transition active:scale-95 cursor-pointer shadow-2xs"
                >
                  +{delta} €
                </button>
              ))}
            </div>
          </div>

          {/* 2. Selezione Categorie a Pillole 1-Tap */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Categoria
              </span>
              <button
                type="button"
                onClick={() => setCustomCatModal(true)}
                className="text-xs font-semibold text-[#007AFF] dark:text-sky-400 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuova</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto no-scrollbar p-0.5">
              {currentCategoryList.map((cat) => {
                const isSelected = selectedCategory?.name === cat.name;
                return (
                  <button
                    key={cat.id || cat.name}
                    type="button"
                    onClick={() => handleCategorySelect(cat)}
                    className={`rounded-xl px-3 py-2 text-xs font-medium flex items-center gap-2 transition active:scale-95 cursor-pointer border ${
                      isSelected
                        ? isExpense
                          ? 'bg-[#FF3B30] text-white border-transparent shadow-xs font-bold'
                          : 'bg-[#32B87A] text-white border-transparent shadow-xs font-bold'
                        : 'bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-700/80 text-neutral-900 dark:text-white border-neutral-200/60 dark:border-neutral-700'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : `${cat.color || '#007AFF'}20` }}
                    >
                      <CategoryIcon
                        name={cat.icon}
                        className="w-3.5 h-3.5"
                        color={isSelected ? '#FFFFFF' : cat.color || '#007AFF'}
                      />
                    </div>
                    <span className="truncate">{cat.name}</span>
                    {cat.is_fixed && (
                      <span className="text-[9px] px-1 py-0.5 rounded font-black bg-white/20 text-white">
                        Fissa
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Nota e Data su una Sola Riga Compatta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Cosa hai pagato? (opzionale)"
                className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 border border-neutral-200 dark:border-neutral-700 rounded-2xl px-3.5 py-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-[#007AFF]"
              />
            </div>
            <div>
              <input
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-2xl px-3 py-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#007AFF]"
              />
            </div>
          </div>

          {/* Opzione Ricorrenza Mese (Fisso) */}
          <div className="bg-neutral-100 dark:bg-neutral-800/80 p-3 rounded-2xl flex items-center justify-between border border-neutral-200/60 dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <Repeat className={`w-4 h-4 ${isRecurring ? 'text-[#007AFF] dark:text-sky-400' : 'text-neutral-400'}`} />
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Ripeti automaticamente ogni mese
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsRecurring(!isRecurring)}
              className={`w-11 h-6 rounded-full p-0.5 transition cursor-pointer ${
                isRecurring ? 'bg-[#007AFF]' : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-sm transition transform ${
                  isRecurring ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 4. Unico Pulsante di Conferma Pieno */}
          <button
            type="submit"
            disabled={saving}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm text-white shadow-sm hover:shadow-md transition active:scale-98 cursor-pointer disabled:opacity-50 ${
              isExpense
                ? 'bg-[#FF3B30] hover:bg-rose-600'
                : 'bg-[#32B87A] hover:bg-emerald-600'
            }`}
          >
            {saving
              ? 'Salvataggio in corso...'
              : isExpense
              ? 'Registra Uscita'
              : 'Aggiungi Entrata'}
          </button>
        </form>
      </div>

      {/* Modale Creazione Categoria */}
      <Modal
        title="Crea Nuova Categoria"
        open={customCatModal}
        onOk={handleCreateCustomCategory}
        onCancel={() => setCustomCatModal(false)}
        okText="Salva Categoria"
        cancelText="Annulla"
        centered
        destroyOnClose={false}
        maskClosable={false}
      >
        <div 
          className="space-y-4 pt-2"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div>
            <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
              Nome Categoria
            </label>
            <input
              type="text"
              value={newCatName}
              onChange={(e) => {
                e.stopPropagation();
                setNewCatName(e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="es. Animali, Palestra, Libri..."
              className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-bold outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
              Colore iOS
            </label>
            <div className="flex gap-2 flex-wrap">
              {['#007AFF', '#34C759', '#FF3B30', '#FF9500', '#AF52DE', '#5856D6', '#5AC8FA', '#FF2D55'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setNewCatColor(c);
                  }}
                  className={`w-7 h-7 rounded-full border-2 transition cursor-pointer ${
                    newCatColor === c ? 'border-neutral-900 dark:border-white scale-110 shadow-xs' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <IconPicker
            selectedIcon={newCatIcon}
            onSelectIcon={(iconName) => setNewCatIcon(iconName)}
            color={newCatColor}
          />
        </div>
      </Modal>
    </div>
  );
};
