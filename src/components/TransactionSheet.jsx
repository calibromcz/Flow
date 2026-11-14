import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CategoryIcon } from './CategoryIcon';
import { X, Delete, Plus, Check } from 'lucide-react';
import { message, Modal } from 'antd';

export const TransactionSheet = ({ isOpen, onClose, defaultType = 'expense' }) => {
  const { categories, addTransaction, addCategory } = useFinance();
  const [type, setType] = useState(defaultType); // 'expense' | 'income'
  const [displayAmount, setDisplayAmount] = useState('0');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [note, setNote] = useState('');
  const [customCatModal, setCustomCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#007AFF');
  const [newCatIcon, setNewCatIcon] = useState('Tag');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      setDisplayAmount('0');
      setNote('');
      const defaultList = categories[defaultType] || [];
      if (defaultList.length > 0) {
        setSelectedCategory(defaultList[0]);
      }
    }
  }, [isOpen, defaultType, categories]);

  const handleTypeChange = (newType) => {
    setType(newType);
    const list = categories[newType] || [];
    if (list.length > 0) {
      setSelectedCategory(list[0]);
    }
  };

  const handleKeyPress = (val) => {
    if (val === 'backspace') {
      if (displayAmount.length <= 1) {
        setDisplayAmount('0');
      } else {
        setDisplayAmount(displayAmount.slice(0, -1));
      }
      return;
    }

    if (val === '.') {
      if (displayAmount.includes('.')) return;
      setDisplayAmount(displayAmount + '.');
      return;
    }

    if (displayAmount.includes('.')) {
      const parts = displayAmount.split('.');
      if (parts[1] && parts[1].length >= 2) return;
    }

    if (!displayAmount.includes('.') && displayAmount.length >= 8) return;

    if (displayAmount === '0') {
      setDisplayAmount(val);
    } else {
      setDisplayAmount(displayAmount + val);
    }
  };

  const handleSave = async () => {
    const numeric = parseFloat(displayAmount);
    if (!numeric || numeric <= 0) {
      message.error("Inserisci un importo valido maggiore di zero.");
      return;
    }

    if (!selectedCategory) {
      message.error("Seleziona una categoria.");
      return;
    }

    setSaving(true);
    try {
      await addTransaction({
        type,
        amount: numeric,
        category: selectedCategory.name,
        note: note.trim(),
        date: new Date().toISOString().split('T')[0]
      });

      message.success(type === 'income' ? "Entrata registrata su Supabase!" : "Spesa registrata su Supabase!");
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
        icon: newCatIcon,
        color: newCatColor
      });
      setSelectedCategory(created);
      setNewCatName('');
      setCustomCatModal(false);
      message.success("Nuova categoria salvata su Supabase!");
    } catch (err) {
      message.error("Errore salvataggio categoria.");
    }
  };

  if (!isOpen) return null;

  const currentCategoryList = categories[type] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-white rounded-t-[36px] shadow-ios-sheet max-h-[92vh] flex flex-col overflow-hidden animate-slide-up"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 8px)' }}
      >
        {/* Handle bar per swipe */}
        <div className="w-full pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.5 bg-slate-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-5 py-2 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Segmented Control Uscita / Entrata */}
          <div className="bg-[#E5E5EA]/80 p-1 rounded-full flex items-center">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`px-4 py-1 text-xs font-bold rounded-full transition-all ${
                type === 'expense'
                  ? 'bg-[#FF3B30] text-white shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              Uscita
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`px-4 py-1 text-xs font-bold rounded-full transition-all ${
                type === 'income'
                  ? 'bg-[#34C759] text-white shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              Entrata
            </button>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-4">
          {/* Display Gigante Importo stile Apple Pay */}
          <div className="text-center py-2">
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
              {type === 'expense' ? 'Importo Spesa' : 'Importo Entrata'}
            </div>
            <div className="flex items-center justify-center">
              <span className={`text-3xl font-light mr-1 ${type === 'expense' ? 'text-[#FF3B30]' : 'text-[#34C759]'}`}>
                €
              </span>
              <span className="text-5xl font-extrabold tracking-tight text-slate-900">
                {displayAmount}
              </span>
            </div>
          </div>

          {/* Nota opzionale rapida */}
          <div className="bg-[#F5F5F7] rounded-2xl px-3.5 py-2 flex items-center">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Aggiungi una nota (es. Spesa, Benzina, Bolletta)..."
              className="w-full bg-transparent text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none"
            />
          </div>

          {/* Categorie Scroll Orizzontale */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Categoria
              </span>
              <button
                type="button"
                onClick={() => setCustomCatModal(true)}
                className="text-xs font-semibold text-blue-600 flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuova</span>
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {currentCategoryList.map((cat) => {
                const isSelected = selectedCategory?.name === cat.name;
                return (
                  <button
                    key={cat.id || cat.name}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-2xl transition-all border ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm scale-105'
                        : 'bg-[#F5F5F7] text-slate-700 border-transparent hover:bg-slate-200/70'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : `${cat.color}20` }}
                    >
                      <CategoryIcon
                        name={cat.icon}
                        className="w-3.5 h-3.5"
                        color={isSelected ? '#FFFFFF' : cat.color}
                      />
                    </div>
                    <span className="text-xs font-semibold whitespace-nowrap">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tastierino Numerico iOS Nativo */}
          <div className="bg-[#F5F5F7] p-3 rounded-3xl">
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeyPress(digit)}
                  className="h-12 bg-white rounded-2xl font-bold text-lg text-slate-800 shadow-sm hover:bg-slate-50 active:scale-95 transition flex items-center justify-center"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleKeyPress('backspace')}
                className="h-12 bg-white rounded-2xl font-bold text-slate-800 shadow-sm hover:bg-slate-50 active:scale-95 transition flex items-center justify-center text-slate-500"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Conferma Bottom */}
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className={`w-full py-3.5 rounded-2xl text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-50 ${
              type === 'expense' ? 'bg-[#FF3B30] hover:bg-red-600' : 'bg-[#34C759] hover:bg-emerald-600'
            }`}
          >
            <span>{saving ? 'Registrazione...' : `Conferma ${type === 'expense' ? 'Spesa' : 'Entrata'}`}</span>
            <span className="font-mono bg-white/20 px-2 py-0.5 rounded-lg text-xs">
              € {displayAmount}
            </span>
          </button>
        </div>
      </div>

      {/* Modal Nuova Categoria Custom */}
      <Modal
        title="Nuova Categoria Supabase"
        open={customCatModal}
        onOk={handleCreateCustomCategory}
        onCancel={() => setCustomCatModal(false)}
        okText="Salva Categoria"
        cancelText="Annulla"
        centered
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Nome Categoria
            </label>
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="es. Animali, Palestra, Libri..."
              className="w-full bg-[#F5F5F7] rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">
              Colore iOS
            </label>
            <div className="flex gap-2 flex-wrap">
              {['#007AFF', '#34C759', '#FF3B30', '#FF9500', '#AF52DE', '#5856D6', '#5AC8FA', '#FF2D55'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewCatColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition ${newCatColor === c ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
