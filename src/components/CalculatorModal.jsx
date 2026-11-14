import React, { useState, useEffect, useCallback } from 'react';
import { X, Delete, ArrowRight, CornerDownLeft, Sparkles, History, Check } from 'lucide-react';
import { message } from 'antd';

export const CalculatorModal = ({ isOpen, onClose, onUseAmount, initialAmount = null }) => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState([
    { expr: '45.00 + 12.50', res: '57.50' },
    { expr: '120.00 - 20%', res: '96.00' },
    { expr: '84.00 ÷ 3', res: '28.00' }
  ]);
  const [justCalculated, setJustCalculated] = useState(false);

  // Inizializza con importo predefinito se fornito
  useEffect(() => {
    if (isOpen) {
      if (initialAmount && !isNaN(Number(initialAmount)) && Number(initialAmount) > 0) {
        setDisplay(String(initialAmount));
        setExpression('');
      } else if (!justCalculated) {
        setDisplay('0');
        setExpression('');
      }
    }
  }, [isOpen, initialAmount]);

  // Gestione Input Numerico
  const handleDigit = useCallback((d) => {
    setDisplay((prev) => {
      if (justCalculated || prev === '0') {
        setJustCalculated(false);
        return d;
      }
      if (prev.length >= 10) return prev;
      return prev + d;
    });
  }, [justCalculated]);

  // Gestione Virgola / Punto Decimale
  const handleDot = useCallback(() => {
    setDisplay((prev) => {
      if (justCalculated) {
        setJustCalculated(false);
        return '0.';
      }
      if (prev.includes('.')) return prev;
      return prev + '.';
    });
  }, [justCalculated]);

  // Gestione Operatori (+, -, ×, ÷)
  const handleOperator = useCallback((op) => {
    const currentVal = parseFloat(display) || 0;
    setExpression(`${currentVal} ${op} `);
    setDisplay('0');
    setJustCalculated(false);
  }, [display]);

  // Percentuale (%)
  const handlePercent = useCallback(() => {
    const val = parseFloat(display) || 0;
    if (expression) {
      // Se c'è un'espressione tipo "100 - ", applica percentuale sul primo numero
      const match = expression.match(/^([\d.]+)\s*([+\-×÷])\s*$/);
      if (match) {
        const base = parseFloat(match[1]);
        const calculatedPercent = (base * val) / 100;
        setDisplay(String(calculatedPercent));
        return;
      }
    }
    setDisplay(String(val / 100));
  }, [display, expression]);

  // Tasto Cancella (C / AC)
  const handleClear = useCallback(() => {
    setDisplay('0');
    setExpression('');
    setJustCalculated(false);
  }, []);

  // Tasto Backspace
  const handleBackspace = useCallback(() => {
    if (justCalculated) {
      handleClear();
      return;
    }
    setDisplay((prev) => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  }, [justCalculated, handleClear]);

  // Inversione Segno (+/-)
  const handleToggleSign = useCallback(() => {
    setDisplay((prev) => {
      if (prev === '0') return prev;
      return prev.startsWith('-') ? prev.slice(1) : '-' + prev;
    });
  }, []);

  // Esegui Calcolo (=)
  const handleEquals = useCallback(() => {
    if (!expression) return;
    const match = expression.match(/^([\d.]+)\s*([+\-×÷])\s*$/);
    if (!match) return;

    const num1 = parseFloat(match[1]);
    const op = match[2];
    const num2 = parseFloat(display) || 0;
    let res = 0;

    switch (op) {
      case '+':
        res = num1 + num2;
        break;
      case '-':
        res = num1 - num2;
        break;
      case '×':
        res = num1 * num2;
        break;
      case '÷':
        if (num2 === 0) {
          message.error("Impossibile dividere per zero");
          return;
        }
        res = num1 / num2;
        break;
      default:
        return;
    }

    // Arrotonda a massimo 2 decimali per la valuta
    const finalRes = Math.round(res * 100) / 100;
    const fullExpr = `${num1} ${op} ${num2}`;

    setHistory((prev) => [
      { expr: fullExpr, res: String(finalRes) },
      ...prev.slice(0, 2)
    ]);

    setExpression(`${fullExpr} =`);
    setDisplay(String(finalRes));
    setJustCalculated(true);
  }, [expression, display]);

  // Supporto Tastiera Fisica
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      // Ignora se si sta scrivendo dentro un input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === '.' || e.key === ',') {
        e.preventDefault();
        handleDot();
      } else if (e.key === '+') {
        e.preventDefault();
        handleOperator('+');
      } else if (e.key === '-') {
        e.preventDefault();
        handleOperator('-');
      } else if (e.key === '*' || e.key === 'x') {
        e.preventDefault();
        handleOperator('×');
      } else if (e.key === '/') {
        e.preventDefault();
        handleOperator('÷');
      } else if (e.key === '%' ) {
        e.preventDefault();
        handlePercent();
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleDigit, handleDot, handleOperator, handlePercent, handleEquals, handleBackspace, onClose]);

  // Convalida e invio importo
  const handleConfirmAmount = () => {
    const numeric = parseFloat(display);
    if (isNaN(numeric) || numeric <= 0) {
      message.error("Esegui un calcolo o inserisci un importo valido maggiore di zero.");
      return;
    }
    if (onUseAmount) {
      onUseAmount(numeric);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/35 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div 
        className="w-full max-w-sm apple-card rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl border border-gray-100 dark:border-white/10 flex flex-col"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 12px) + 8px)' }}
      >
        {/* Barra di trascinamento mobile */}
        <div className="w-full pt-3 pb-1 flex justify-center sm:hidden">
          <div className="w-10 h-1 bg-gray-300 dark:bg-neutral-600 rounded-full"></div>
        </div>

        {/* Header Calcolatrice */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-orange-500/10 text-[#FF9500] flex items-center justify-center font-bold text-xs">
              ±
            </div>
            <div>
              <span className="font-bold text-sm text-[#1D1D1F] dark:text-white block leading-tight">
                Calcolatrice iOS
              </span>
              <span className="text-[10px] text-[#86868B] dark:text-gray-400">
                Supporta tastiera fisica (Invio, + - * /)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#2C2C2E] flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Display Calcolatrice iOS */}
        <div className="p-5 pb-3 bg-gray-50/80 dark:bg-black/30 border-b border-gray-100 dark:border-white/10 text-right select-all">
          <div className="text-xs font-mono font-medium text-[#86868B] dark:text-gray-400 h-5 truncate">
            {expression || ' '}
          </div>
          <div className="text-4xl sm:text-5xl font-light tracking-tight text-[#1D1D1F] dark:text-white font-mono truncate">
            {display}
          </div>
        </div>

        {/* Tastierino iOS: 4 Colonne */}
        <div className="p-4 grid grid-cols-4 gap-2 sm:gap-2.5">
          {/* Riga 1: C, +/-, %, ÷ */}
          <button
            type="button"
            onClick={handleClear}
            className="h-12 sm:h-13 rounded-2xl bg-gray-200/70 dark:bg-white/15 text-[#1D1D1F] dark:text-white font-bold text-base hover:bg-gray-300/80 active:scale-95 transition cursor-pointer"
          >
            {display !== '0' || expression ? 'C' : 'AC'}
          </button>
          <button
            type="button"
            onClick={handleToggleSign}
            className="h-12 sm:h-13 rounded-2xl bg-gray-200/70 dark:bg-white/15 text-[#1D1D1F] dark:text-white font-bold text-base hover:bg-gray-300/80 active:scale-95 transition cursor-pointer"
          >
            ±
          </button>
          <button
            type="button"
            onClick={handlePercent}
            className="h-12 sm:h-13 rounded-2xl bg-gray-200/70 dark:bg-white/15 text-[#1D1D1F] dark:text-white font-bold text-base hover:bg-gray-300/80 active:scale-95 transition cursor-pointer"
          >
            %
          </button>
          <button
            type="button"
            onClick={() => handleOperator('÷')}
            className="h-12 sm:h-13 rounded-2xl bg-[#FF9500] hover:bg-[#e08500] text-white font-bold text-xl active:scale-95 transition shadow-xs cursor-pointer"
          >
            ÷
          </button>

          {/* Riga 2: 7, 8, 9, × */}
          {['7', '8', '9'].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleDigit(n)}
              className="h-12 sm:h-13 rounded-2xl bg-white dark:bg-[#2C2C2E] border border-gray-100 dark:border-white/10 text-[#1D1D1F] dark:text-white font-semibold text-xl hover:bg-gray-50 active:scale-95 transition shadow-2xs cursor-pointer"
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleOperator('×')}
            className="h-12 sm:h-13 rounded-2xl bg-[#FF9500] hover:bg-[#e08500] text-white font-bold text-xl active:scale-95 transition shadow-xs cursor-pointer"
          >
            ×
          </button>

          {/* Riga 3: 4, 5, 6, - */}
          {['4', '5', '6'].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleDigit(n)}
              className="h-12 sm:h-13 rounded-2xl bg-white dark:bg-[#2C2C2E] border border-gray-100 dark:border-white/10 text-[#1D1D1F] dark:text-white font-semibold text-xl hover:bg-gray-50 active:scale-95 transition shadow-2xs cursor-pointer"
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleOperator('-')}
            className="h-12 sm:h-13 rounded-2xl bg-[#FF9500] hover:bg-[#e08500] text-white font-bold text-xl active:scale-95 transition shadow-xs cursor-pointer"
          >
            -
          </button>

          {/* Riga 4: 1, 2, 3, + */}
          {['1', '2', '3'].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleDigit(n)}
              className="h-12 sm:h-13 rounded-2xl bg-white dark:bg-[#2C2C2E] border border-gray-100 dark:border-white/10 text-[#1D1D1F] dark:text-white font-semibold text-xl hover:bg-gray-50 active:scale-95 transition shadow-2xs cursor-pointer"
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleOperator('+')}
            className="h-12 sm:h-13 rounded-2xl bg-[#FF9500] hover:bg-[#e08500] text-white font-bold text-xl active:scale-95 transition shadow-xs cursor-pointer"
          >
            +
          </button>

          {/* Riga 5: 0, ., ⌫, = */}
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 sm:h-13 rounded-2xl bg-white dark:bg-[#2C2C2E] border border-gray-100 dark:border-white/10 text-[#1D1D1F] dark:text-white font-semibold text-xl hover:bg-gray-50 active:scale-95 transition shadow-2xs cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDot}
            className="h-12 sm:h-13 rounded-2xl bg-white dark:bg-[#2C2C2E] border border-gray-100 dark:border-white/10 text-[#1D1D1F] dark:text-white font-semibold text-xl hover:bg-gray-50 active:scale-95 transition shadow-2xs cursor-pointer"
          >
            ,
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 sm:h-13 rounded-2xl bg-gray-100 dark:bg-white/10 text-[#86868B] dark:text-gray-300 flex items-center justify-center hover:bg-gray-200 active:scale-95 transition cursor-pointer"
            title="Cancella ultima cifra"
          >
            <Delete className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleEquals}
            className="h-12 sm:h-13 rounded-2xl bg-[#FF9500] hover:bg-[#e08500] text-white font-bold text-xl active:scale-95 transition shadow-xs cursor-pointer"
          >
            =
          </button>
        </div>

        {/* Cronologia Recente (ultime 3 operazioni cliccabili) */}
        {history.length > 0 && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#86868B] dark:text-gray-400 mb-1.5">
              <History className="w-3 h-3" />
              <span>Cronologia recente:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {history.map((h, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setDisplay(h.res);
                    setExpression(`${h.expr} =`);
                    setJustCalculated(true);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-gray-100/80 dark:bg-white/5 hover:bg-gray-200/80 text-[11px] font-mono text-[#1D1D1F] dark:text-gray-300 transition cursor-pointer border border-gray-200/50 dark:border-white/10"
                >
                  {h.expr} = <strong className="text-[#007AFF]">{h.res}</strong>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pulsante Primario Blu Apple iOS: "Usa questo importo" */}
        <div className="p-4 pt-2">
          <button
            type="button"
            onClick={handleConfirmAmount}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#007AFF] hover:bg-blue-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Usa {display} € per una Spesa / Entrata</span>
          </button>
        </div>
      </div>
    </div>
  );
};

