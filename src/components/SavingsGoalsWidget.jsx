import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';
import { usePalette } from '../context/PaletteContext';
import { formatCurrency, PrivacyAmount } from './CategoryIcon';
import { parseAmount } from '../utils/numberUtils';
import { Target, Plus, Trash2, ArrowDownToLine, Snowflake, Sparkles } from 'lucide-react';
import { Modal, message } from 'antd';

export const SavingsGoalsWidget = () => {
  const { savingsGoals, addSavingsGoal, depositToSavingsGoal, deleteSavingsGoal, monthlyMetrics } = useFinance();
  const { isDark } = useTheme();
  const { palette } = usePalette();
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newColor, setNewColor] = useState('#007AFF');
  const [customDepositModal, setCustomDepositModal] = useState(false);
  const [activeGoalId, setActiveGoalId] = useState(null);
  const [customAmount, setCustomAmount] = useState('');

  // Modale Accantona dal Cashflow attuale
  const [cashflowDepositModal, setCashflowDepositModal] = useState(false);
  const [cashflowAmount, setCashflowAmount] = useState('');
  const [cashflowGoalId, setCashflowGoalId] = useState(null);

  const currentCashflow = monthlyMetrics?.netSavings || 0;

  const handleOpenCashflowDeposit = () => {
    if (savingsGoals.length === 0) {
      message.info("Crea prima un salvadanaio obiettivo.");
      return;
    }
    setCashflowGoalId(savingsGoals[0]?.id || null);
    const suggested = currentCashflow > 0 ? String(Math.min(currentCashflow, 100)) : '';
    setCashflowAmount(suggested);
    setCashflowDepositModal(true);
  };

  const handleConfirmCashflowDeposit = async () => {
    const val = parseAmount(cashflowAmount);
    if (!val || val <= 0) {
      message.error("Inserisci un importo valido da accantonare.");
      return;
    }
    if (!cashflowGoalId) {
      message.error("Seleziona un salvadanaio.");
      return;
    }
    await depositToSavingsGoal(cashflowGoalId, val);
    setCashflowDepositModal(false);
    setCashflowAmount('');
    message.success(`${formatCurrency(val)} accantonati con successo dal tuo Cashflow!`);
  };

  const handleCreateGoal = async () => {
    const targetNum = parseAmount(newTarget);
    if (!newTitle.trim() || !targetNum || targetNum <= 0) {
      message.error("Inserisci un titolo e un importo target valido.");
      return;
    }
    await addSavingsGoal({
      title: newTitle.trim(),
      target_amount: targetNum,
      current_amount: 0,
      color: newColor
    });
    setNewTitle('');
    setNewTarget('');
    setModalOpen(false);
    message.success("Nuovo salvadanaio creato!");
  };

  const handleCustomDeposit = async () => {
    const val = parseAmount(customAmount);
    if (!val || val <= 0) {
      message.error("Inserisci un importo valido.");
      return;
    }
    await depositToSavingsGoal(activeGoalId, val);
    setCustomAmount('');
    setCustomDepositModal(false);
    message.success(`Accantonati ${formatCurrency(val)} nel salvadanaio!`);
  };

  return (
    <div
      className="apple-card rounded-3xl p-6 space-y-4 transition-colors shadow-xs"
      style={{ backgroundColor: !isDark && palette?.goalsCardBg ? palette.goalsCardBg : undefined }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#007AFF] dark:text-sky-400 flex items-center justify-center">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#86868B] dark:text-gray-400 block leading-tight">
              Salvadanaio
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {savingsGoals.length > 0 && (
            <button
              type="button"
              onClick={handleOpenCashflowDeposit}
              className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-200/70 dark:border-neutral-700/70 transition-all shrink-0 cursor-pointer active:scale-95"
              title="Accantona liquidità nel Salvadanaio o Freezer"
            >
              <Snowflake className="w-3.5 h-3.5 stroke-[1.75] text-sky-500" />
              <span>Accantona</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-[#007AFF] dark:text-sky-400 flex items-center justify-center transition cursor-pointer border border-blue-100 dark:border-blue-800/40 active:scale-95"
            title="Nuovo Obiettivo"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {savingsGoals.length === 0 ? (
        <div className="py-10 px-4 text-center space-y-2 bg-gray-50/60 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
          <div className="w-10 h-10 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-[#007AFF]">
            <Target className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-[#1D1D1F] dark:text-white">
            Nessun obiettivo attivo
          </p>
          <p className="text-[11px] text-[#86868B] dark:text-gray-400">
            Crea il tuo primo salvadanaio toccando "+ Nuovo Obiettivo".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {savingsGoals.map((goal) => {
            const current = Number(goal.current_amount || 0);
            const target = Number(goal.target_amount || 1);
            const percent = Math.min(100, Math.round((current / target) * 100));
            const remaining = Math.max(0, target - current);

            const radius = 34;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (percent / 100) * circumference;

            return (
              <div
                key={goal.id}
                className="bg-gray-50/80 dark:bg-white/5 rounded-2xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden border border-gray-100 dark:border-white/10 hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#1D1D1F] dark:text-white truncate">
                    {goal.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteSavingsGoal(goal.id)}
                    className="text-gray-400 hover:text-[#FF3B30] p-1 transition cursor-pointer"
                    title="Elimina obiettivo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        stroke="currentColor"
                        className="text-gray-200 dark:text-neutral-700"
                        strokeWidth="7"
                        fill="transparent"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        stroke={goal.color || '#007AFF'}
                        strokeWidth="7"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xs font-black text-[#1D1D1F] dark:text-white">
                        {percent}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-extrabold text-[#1D1D1F] dark:text-white">
                      <PrivacyAmount amount={current} />
                    </div>
                    <div className="text-[11px] text-[#86868B] dark:text-gray-400">
                      Target: <PrivacyAmount amount={target} />
                    </div>
                    <div className="text-[10px] text-[#34C759] font-semibold">
                      {remaining === 0 ? "🎉 Obiettivo Raggiunto!" : (
                        <span>Mancano: <PrivacyAmount amount={remaining} /></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3 Pulsanti Rapidi */}
                <div className="pt-2 border-t border-gray-100 dark:border-white/10 grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => depositToSavingsGoal(goal.id, 10)}
                    className="py-1 px-1 bg-white dark:bg-[#3A3A3C] hover:bg-gray-50 dark:hover:bg-[#48484A] text-[#1D1D1F] dark:text-gray-100 font-bold text-[11px] rounded-xl shadow-2xs border border-gray-200/80 dark:border-white/10 active:scale-95 transition cursor-pointer"
                  >
                    +10 €
                  </button>
                  <button
                    type="button"
                    onClick={() => depositToSavingsGoal(goal.id, 25)}
                    className="py-1 px-1 bg-white dark:bg-[#3A3A3C] hover:bg-gray-50 dark:hover:bg-[#48484A] text-[#1D1D1F] dark:text-gray-100 font-bold text-[11px] rounded-xl shadow-2xs border border-gray-200/80 dark:border-white/10 active:scale-95 transition cursor-pointer"
                  >
                    +25 €
                  </button>
                  <button
                    type="button"
                    onClick={() => depositToSavingsGoal(goal.id, 50)}
                    className="py-1 px-1 bg-white dark:bg-[#3A3A3C] hover:bg-gray-50 dark:hover:bg-[#48484A] text-[#1D1D1F] dark:text-gray-100 font-bold text-[11px] rounded-xl shadow-2xs border border-gray-200/80 dark:border-white/10 active:scale-95 transition cursor-pointer"
                  >
                    +50 €
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveGoalId(goal.id);
                      setCustomDepositModal(true);
                    }}
                    className="py-1 px-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-[#007AFF] dark:text-sky-400 font-bold text-[10px] rounded-xl border border-blue-100 dark:border-blue-800/40 active:scale-95 transition truncate cursor-pointer"
                  >
                    Altro
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nuovo Obiettivo */}
      <Modal
        title="Crea Nuovo Salvadanaio Obiettivo"
        open={modalOpen}
        onOk={handleCreateGoal}
        onCancel={() => setModalOpen(false)}
        okText="Crea Obiettivo"
        cancelText="Annulla"
        centered
      >
        <div className="space-y-3.5 pt-2">
          {/* Suggerimento Rapido: Freezer (Consigliato) */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Snowflake className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-neutral-900 dark:text-white">Freezer</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-sky-500 text-white px-1.5 py-0.2 rounded-full">
                    Consigliato
                  </span>
                </div>
                <span className="text-[10px] text-sky-800 dark:text-sky-300">
                  Conto deposito & liquidità congelata
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setNewTitle('Freezer');
                setNewColor('#00A3E0');
              }}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-neutral-800 hover:bg-sky-100 text-sky-700 dark:text-sky-300 text-xs font-bold transition border border-sky-200 dark:border-sky-700 cursor-pointer shadow-2xs"
            >
              Usa Freezer
            </button>
          </div>

          {/* Micro-box esplicativo se Freezer è selezionato */}
          {newTitle.trim().toLowerCase() === 'freezer' && (
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 bg-neutral-100/80 dark:bg-neutral-800/60 p-2.5 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 flex items-start gap-2 animate-fade-in">
              <Snowflake className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" strokeWidth={1.75} />
              <p className="leading-relaxed">
                Liquidità sul Conto Deposito: sottratta dalla Bussola Giornaliera senza contare come spesa.
              </p>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-1">
              Nome Obiettivo
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="es. Freezer, Fondo Emergenza, Vacanze..."
              className="w-full bg-gray-100 dark:bg-[#3A3A3C] rounded-xl px-3 py-2 text-sm outline-none border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-1">
              Importo Target (€)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              placeholder="es. 1000"
              className="w-full bg-gray-100 dark:bg-[#3A3A3C] rounded-xl px-3 py-2 text-sm outline-none border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block mb-1">
              Colore Anello
            </label>
            <div className="flex gap-2">
              {['#007AFF', '#00A3E0', '#34C759', '#AF52DE', '#FF9500', '#FF2D55', '#5856D6'].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition cursor-pointer ${newColor === c ? 'border-gray-900 dark:border-white scale-110 shadow-xs' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Accantonamento Libero */}
      <Modal
        title="Accantona Importo Libero"
        open={customDepositModal}
        onOk={handleCustomDeposit}
        onCancel={() => setCustomDepositModal(false)}
        okText="Accantona"
        cancelText="Annulla"
        centered
      >
        <div className="py-2 space-y-2">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block">
            Importo da aggiungere al salvadanaio (€)
          </label>
          <input
            type="number"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="es. 120"
            className="w-full bg-gray-100 dark:bg-[#3A3A3C] rounded-xl px-3 py-2.5 text-base font-bold outline-none border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
          />
        </div>
      </Modal>

      {/* Modal Accantona dal Cashflow Attuale */}
      <Modal
        title="📥 Accantona dal Cashflow Attuale"
        open={cashflowDepositModal}
        onOk={handleConfirmCashflowDeposit}
        onCancel={() => setCashflowDepositModal(false)}
        okText="Accantona nel Salvadanaio"
        cancelText="Annulla"
        centered
      >
        <div className="py-3 space-y-3.5">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 flex items-center justify-between text-xs">
            <span className="text-[#86868B] dark:text-gray-300">Cashflow Netto Attuale:</span>
            <span className={`font-extrabold ${currentCashflow >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
              {formatCurrency(currentCashflow)}
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#1D1D1F] dark:text-gray-200 block mb-1">
              Scegli il Salvadanaio
            </label>
            <select
              value={cashflowGoalId || ''}
              onChange={(e) => setCashflowGoalId(e.target.value)}
              className="w-full bg-gray-100 dark:bg-[#3A3A3C] rounded-xl px-3 py-2 text-xs font-bold outline-none border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
            >
              {savingsGoals.map(g => (
                <option key={g.id} value={g.id}>
                  {g.title} ({formatCurrency(g.current_amount || 0)} / {formatCurrency(g.target_amount || 0)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#1D1D1F] dark:text-gray-200 block mb-1">
              Quanto vuoi versare? (€)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={cashflowAmount}
              onChange={(e) => setCashflowAmount(e.target.value)}
              placeholder="es. 50,00"
              className="w-full bg-gray-100 dark:bg-[#3A3A3C] rounded-xl px-3 py-2 text-sm font-bold outline-none border border-gray-200 dark:border-white/10 text-[#34C759]"
            />
          </div>

          {currentCashflow > 0 && (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCashflowAmount(String(Math.min(currentCashflow, 50)))}
                className="text-[11px] font-bold text-[#007AFF] hover:underline"
              >
                +50 €
              </button>
              <button
                type="button"
                onClick={() => setCashflowAmount(String(Math.min(currentCashflow, 100)))}
                className="text-[11px] font-bold text-[#007AFF] hover:underline"
              >
                +100 €
              </button>
              <button
                type="button"
                onClick={() => setCashflowAmount(String(currentCashflow))}
                className="text-[11px] font-bold text-[#34C759] hover:underline"
              >
                Tutto ({formatCurrency(currentCashflow)})
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
