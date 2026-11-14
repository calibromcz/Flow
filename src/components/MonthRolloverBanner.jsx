import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, PrivacyAmount } from './CategoryIcon';
import { Sparkles, ArrowRight, X, PiggyBank, PlusCircle } from 'lucide-react';
import { Modal, message } from 'antd';

export const MonthRolloverBanner = () => {
  const { user } = useAuth();
  const { 
    previousMonthSummary, 
    savingsGoals, 
    depositToSavingsGoal, 
    addTransaction 
  } = useFinance();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [rolloverAmount, setRolloverAmount] = useState('');
  const [dismissed, setDismissed] = useState(false);

  if (!previousMonthSummary || previousMonthSummary.netCashflow <= 0) {
    return null;
  }

  const rolloverKey = `flow_rollover_handled_${previousMonthSummary.key}_${user?.id || 'guest'}`;
  const isHandled = localStorage.getItem(rolloverKey) === 'true';

  if (isHandled || dismissed) {
    return null;
  }

  const markHandled = () => {
    try {
      localStorage.setItem(rolloverKey, 'true');
    } catch (e) {
      console.error(e);
    }
    setDismissed(true);
  };

  const handleOpenGoalModal = () => {
    setSelectedGoalId(savingsGoals[0]?.id || null);
    setRolloverAmount(String(previousMonthSummary.netCashflow));
    setModalOpen(true);
  };

  const handleConfirmMoveToGoal = async () => {
    const amt = parseFloat(rolloverAmount);
    if (!amt || amt <= 0) {
      message.error("Inserisci un importo valido.");
      return;
    }
    if (!selectedGoalId) {
      message.error("Seleziona un salvadanaio obiettivo.");
      return;
    }

    await depositToSavingsGoal(selectedGoalId, amt);
    markHandled();
    setModalOpen(false);
    message.success(`🎉 ${formatCurrency(amt)} accantonati con successo nel tuo Salvadanaio!`);
  };

  const handleBringToCurrentMonth = async () => {
    const amt = previousMonthSummary.netCashflow;
    await addTransaction({
      type: 'income',
      amount: amt,
      category: 'Extra & Freelance',
      note: `Tesoretto da ${previousMonthSummary.monthName}`,
      date: new Date().toISOString().split('T')[0]
    });
    markHandled();
    message.success(`🎉 ${formatCurrency(amt)} aggiunti come tesoretto nel mese corrente!`);
  };

  const handleIgnore = () => {
    markHandled();
    message.info("Chiusura mese archiviata.");
  };

  return (
    <>
      <div className="apple-card rounded-3xl p-4 sm:p-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/30 dark:border-emerald-500/20 shadow-sm relative overflow-hidden animate-fade-in">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#34C759] to-emerald-400 text-white flex items-center justify-center shrink-0 shadow-sm text-lg">
              🎉
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Chiusura Mese Intelligente
                </span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                  Cashflow Positivo
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#1D1D1F] dark:text-white leading-tight">
                Hai chiuso {previousMonthSummary.monthName} con <span className="text-[#34C759]">+{formatCurrency(previousMonthSummary.netCashflow)}</span> di Cashflow netto!
              </h3>
              <p className="text-xs text-[#86868B] dark:text-gray-300">
                Come vuoi impiegare questo avanzo virtuoso?
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleIgnore}
            className="p-1 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition cursor-pointer"
            title="Ignora / Chiudi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Pulsanti Rapidi */}
        <div className="mt-3.5 pt-3 border-t border-emerald-500/15 flex flex-wrap items-center gap-2">
          {savingsGoals.length > 0 && (
            <button
              type="button"
              onClick={handleOpenGoalModal}
              className="px-3.5 py-1.5 rounded-2xl bg-[#34C759] hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <PiggyBank className="w-3.5 h-3.5" />
              <span>🎯 Sposta nel Salvadanaio</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleBringToCurrentMonth}
            className="px-3.5 py-1.5 rounded-2xl bg-white dark:bg-[#2C2C2E] hover:bg-gray-50 dark:hover:bg-[#38383A] active:scale-95 text-[#1D1D1F] dark:text-white font-bold text-xs flex items-center gap-1.5 border border-gray-200/80 dark:border-white/10 shadow-2xs transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#007AFF]" />
            <span>➕ Porta nel mese corrente</span>
          </button>

          <button
            type="button"
            onClick={handleIgnore}
            className="px-3 py-1.5 rounded-2xl text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] dark:text-gray-400 dark:hover:text-white transition cursor-pointer"
          >
            Archivia senza movimenti
          </button>
        </div>
      </div>

      {/* Modale Scelta Salvadanaio per Rollover */}
      <Modal
        title="🎯 Sposta Avanzo nel Salvadanaio"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleConfirmMoveToGoal}
        okText="Conferma Versamento"
        cancelText="Annulla"
        centered
      >
        <div className="space-y-3.5 pt-2">
          <p className="text-xs text-[#86868B] leading-relaxed">
            Seleziona il salvadanaio a cui destinare il Cashflow positivo di {previousMonthSummary.monthName}:
          </p>

          <div>
            <label className="text-xs font-semibold text-[#1D1D1F] dark:text-gray-200 block mb-1">
              Salvadanaio di destinazione
            </label>
            <select
              value={selectedGoalId || ''}
              onChange={(e) => setSelectedGoalId(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold outline-none"
            >
              {savingsGoals.map(g => (
                <option key={g.id} value={g.id}>
                  {g.title} (Attuale: {formatCurrency(g.current_amount || 0)} / Target: {formatCurrency(g.target_amount || 0)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#1D1D1F] dark:text-gray-200 block mb-1">
              Importo da accantonare (€) (Max: {formatCurrency(previousMonthSummary.netCashflow)})
            </label>
            <input
              type="number"
              step="0.01"
              max={previousMonthSummary.netCashflow}
              value={rolloverAmount}
              onChange={(e) => setRolloverAmount(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm font-bold outline-none text-[#34C759]"
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

