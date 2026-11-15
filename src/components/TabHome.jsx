import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { usePalette } from '../context/PaletteContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency, formatDate, CategoryIcon, PrivacyAmount } from './CategoryIcon';
import { SmartSpotlightBar } from './SmartSpotlightBar';
import { SavingsGoalsWidget } from './SavingsGoalsWidget';
import { MonthRolloverBanner } from './MonthRolloverBanner';
import { WalletSelectorPills } from './WalletSelectorPills';
import { PayCycleCompass } from './PayCycleCompass';
import {
  ChevronLeft,
  ChevronRight,
  Target,
  Trash2,
  PiggyBank,
  Compass,
  Sparkles,
  Lightbulb,
  Plus,
  AlertCircle,
  Calculator,
  ArrowDown,
  ArrowUp,
  X,
  Clock
} from 'lucide-react';
import { Modal, message } from 'antd';

export const TabHome = ({ onOpenSheet }) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { palette } = usePalette();
  const {
    monthlyTransactions,
    monthlyMetrics,
    categoryMetaMap,
    previousMonthComparison,
    monthLabel,
    savingTargetPercent,
    savingsGoals,
    currentDate,
    updateSavingTarget,
    addTransaction,
    deleteTransaction
  } = useFinance();

  // Target Risparmio
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [tempTarget, setTempTarget] = useState(savingTargetPercent);

  // Consiglio Intelligente FLOW
  const [showSmartTip, setShowSmartTip] = useState(false);

  const handleSaveTarget = async () => {
    await updateSavingTarget(tempTarget);
    setTargetModalOpen(false);
    message.success(`Nuovo target di risparmio impostato al ${tempTarget}%!`);
  };

  const handleDelete = async (id, note, category) => {
    await deleteTransaction(id);
    message.info(`Operazione "${note || category}" eliminata.`);
  };

  const recentTransactions = monthlyTransactions.slice(0, 8);
  const {
    expense,
    income,
    topCategory,
    potentialSaving15,
    dailySpendable,
    remainingDays,
    recurringList
  } = monthlyMetrics;

  // Calcolo Spese Fisse Future / In Arrivo nel mese corrente non ancora registrate
  const todayDate = new Date().getDate();
  const upcomingFixedExpenses = (recurringList || [])
    .filter(rec => rec.type === 'expense')
    .map(rec => {
      const recDay = rec.recurring_day || 1;
      const diffDays = recDay - todayDate;
      const isRecorded = monthlyTransactions.some(
        t => t.category.toLowerCase() === rec.category.toLowerCase() && t.type === 'expense'
      );
      return {
        ...rec,
        diffDays,
        isRecorded
      };
    })
    .filter(item => !item.isRecorded && item.diffDays >= 0)
    .sort((a, b) => a.diffDays - b.diffDays);

  // Funzione 1-Tap per segnare la spesa fissa come pagata
  const handleMarkFixedPaid = async (item) => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await addTransaction({
        type: 'expense',
        amount: item.amount,
        category: item.category,
        note: `Spesa fissa: ${item.category}`,
        date: todayStr
      });
      message.success(`✓ Segnato pagato: ${item.category} (${formatCurrency(item.amount)})`);
    } catch (err) {
      console.error("Errore segna pagato:", err);
      message.error("Errore durante la registrazione della spesa fissa.");
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 1. Header / Smart Spotlight Bar (In Cima Immediata) */}
      <SmartSpotlightBar />

      {/* 2. Barra a pillole dei Conti (Principale, Tutti, + Conto) - Margine compatto mt-2 mb-3 */}
      <div className="mt-2 mb-3 px-0.5">
        <WalletSelectorPills />
      </div>

      {/* Banner Intelligente Chiusura Mese (Rollover del Cashflow nel Salvadanaio) */}
      <MonthRolloverBanner />

      {/* ========================================================= */}
      {/* 3. SCHEDE / PULSANTI DI ENTRATE E USCITE                  */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Card Totale Entrate */}
        <div
          className="apple-card rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-colors shadow-xs"
          style={{ backgroundColor: !isDark && palette?.incomeCardBg ? palette.incomeCardBg : undefined }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#86868B] dark:text-gray-400">
              Totale Entrate
            </span>
            <button
              type="button"
              onClick={() => onOpenSheet('income')}
              className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white flex items-center justify-center transition cursor-pointer shadow-sm hover:shadow-md"
              title="Aggiungi Entrata"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          <div className="my-1.5 sm:my-2">
            <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#34C759] tracking-tight block">
              <PrivacyAmount amount={income} />
            </span>
          </div>
        </div>

        {/* Card Totale Uscite */}
        <div
          className="apple-card rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-colors shadow-xs"
          style={{ backgroundColor: !isDark && palette?.expenseCardBg ? palette.expenseCardBg : undefined }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#86868B] dark:text-gray-400">
              Totale Uscite
            </span>
            <button
              type="button"
              onClick={() => onOpenSheet('expense')}
              className="w-8 h-8 rounded-full bg-rose-500 hover:bg-rose-600 active:scale-95 text-white flex items-center justify-center transition cursor-pointer shadow-sm hover:shadow-md"
              title="Registra Spesa"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          <div className="my-1.5 sm:my-2">
            <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#FF3B30] tracking-tight block">
              <PrivacyAmount amount={expense} />
            </span>

            {/* Confronto Mese Scorso compatto */}
            {previousMonthComparison && (
              <div className="mt-1">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold border ${previousMonthComparison.isLower
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40'
                      : 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40'
                    }`}
                  title={`Confronto sui primi ${previousMonthComparison.daysChecked} giorni del mese`}
                >
                  {previousMonthComparison.isLower ? (
                    <>
                      <ArrowDown className="w-2.5 h-2.5" />
                      <span>{Math.abs(previousMonthComparison.diffPercent).toFixed(0)}% vs scorso</span>
                    </>
                  ) : (
                    <>
                      <ArrowUp className="w-2.5 h-2.5" />
                      <span>+{Math.abs(previousMonthComparison.diffPercent).toFixed(0)}% vs scorso</span>
                    </>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. CARD CASHFLOW (CON BUSSOLA GIORNALIERA) E SALVADANAIO  */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Scheda Cashflow */}
        <div
          className="relative overflow-hidden rounded-3xl apple-card p-5 sm:p-6 flex flex-col justify-between transition-colors shadow-xs"
          style={{ backgroundColor: !isDark && palette?.savingsCardBg ? palette.savingsCardBg : undefined }}
        >
          <div className="space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-[#34C759]">
                  <PiggyBank className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#86868B] dark:text-gray-400 block">
                    Cashflow
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Tasto a comparsa Consiglio FLOW */}
                {topCategory && topCategory.total > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowSmartTip(!showSmartTip)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer border ${showSmartTip
                        ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-700'
                        : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/40'
                      }`}
                    title="Tocca per aprire/chiudere il consiglio intelligente"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>💡 Consiglio FLOW</span>
                    {showSmartTip && <X className="w-3 h-3 ml-0.5" />}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setTempTarget(savingTargetPercent);
                    setTargetModalOpen(true);
                  }}
                  className="px-2 py-1 rounded-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-[11px] font-semibold text-[#007AFF] dark:text-sky-300 flex items-center gap-1 transition cursor-pointer border border-blue-100 dark:border-blue-800/40"
                >
                  <Target className="w-3 h-3" />
                  <span>Target: {savingTargetPercent}%</span>
                </button>
              </div>
            </div>

            <div>
              <div className="text-2xl lg:text-3xl font-extrabold tracking-tight text-[#1D1D1F] dark:text-white">
                <PrivacyAmount amount={monthlyMetrics.netSavings} />
              </div>
              <div className="text-xs text-[#86868B] dark:text-gray-400 mt-0.5 font-medium">
                {monthlyMetrics.savingsRate.toFixed(1)}% delle entrate mensili
              </div>
            </div>

            {/* Popover fluid Consiglio FLOW */}
            {showSmartTip && topCategory && topCategory.total > 0 && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/90 to-orange-50/70 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-800/40 animate-fade-in relative space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <span>Analisi Risparmio FLOW</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSmartTip(false)}
                    className="text-amber-700 hover:text-amber-950 dark:text-amber-400 cursor-pointer p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-amber-900/90 dark:text-gray-200 leading-relaxed text-[11px]">
                  La tua uscita più consistente di questo mese è <strong className="font-bold underline text-[#1D1D1F] dark:text-white">{topCategory.name}</strong> (<PrivacyAmount amount={topCategory.total} />).
                </p>

                <div className="bg-white/90 dark:bg-[#1C1C1E] border border-amber-200/60 dark:border-white/10 rounded-xl p-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#86868B] dark:text-gray-400 block font-medium">Se riduci questa voce del 15%:</span>
                    <span className="text-xs font-extrabold text-[#34C759]">
                      +<PrivacyAmount amount={potentialSaving15} /> accantonabili
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-[#34C759] font-bold px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800/40">
                    +15%
                  </span>
                </div>
              </div>
            )}

            {/* Progresso target */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs text-[#86868B] dark:text-gray-400 font-medium">
                <span>Progresso target (<PrivacyAmount amount={monthlyMetrics.targetAmount} />)</span>
                <span className="font-bold text-[#1D1D1F] dark:text-white">{Math.round(monthlyMetrics.progressToTarget)}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#34C759] rounded-full transition-all duration-500"
                  style={{ width: `${monthlyMetrics.progressToTarget}%` }}
                />
              </div>
            </div>

            {/* Bussola Giornaliera */}
            <div className="mt-2 pt-3 border-t border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-1.5 mb-2">
                <Compass className="w-3.5 h-3.5 text-[#007AFF] dark:text-sky-400" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#007AFF] dark:text-sky-300">
                  Bussola Giornaliera
                </span>
              </div>

              {income === 0 ? (
                <div className="text-xs text-[#86868B] dark:text-gray-400 italic">
                  Inserisci le entrate del mese per attivare la Bussola Giornaliera.
                </div>
              ) : dailySpendable > 0 ? (
                <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl p-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-800 dark:text-emerald-300 block font-medium">
                      Spendibile oggi ({remainingDays} gg rimasti):
                    </span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      fino a <PrivacyAmount amount={dailySpendable} /> / giorno
                    </span>
                    <span className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 block mt-0.5">
                      Cashflow disponibile: <PrivacyAmount amount={monthlyMetrics.remainingMonthlyBudget} />
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                    In Target
                  </span>
                </div>
              ) : (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 rounded-2xl p-2.5 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#FF3B30] shrink-0" />
                  <span className="text-xs text-red-700 dark:text-red-300 font-medium leading-tight">
                    Cashflow esaurito (le uscite del mese superano o eguagliano le entrate).
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scheda Salvadanaio (Affiancata a Cashflow) */}
        <div>
          <SavingsGoalsWidget />
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4B. BUSSOLA CICLO (STIPENDIO / TARGET) - OPZIONALE       */}
      {/* ========================================================= */}
      <div className="px-0.5">
        <PayCycleCompass />
      </div>

      {/* ========================================================= */}
      {/* RIGA 5: ULTIME OPERAZIONI (SENZA TASTO +) & FISSI PREDITTIVI */}
      {/* ========================================================= */}
      {/* ========================================================= */}
      <div className="apple-card rounded-3xl p-5 sm:p-6 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F] dark:text-white block">
              Ultime Operazioni ({monthlyTransactions.length})
            </span>
            <span className="text-[11px] text-[#86868B] dark:text-gray-400">
              Registrate in {monthLabel}
            </span>
          </div>
        </div>

        {/* Bannerini Predittivi Spese Fisse in Arrivo */}
        {upcomingFixedExpenses.length > 0 && (
          <div className="space-y-2 pt-1">
            {upcomingFixedExpenses.slice(0, 3).map((item) => {
              const isToday = item.diffDays === 0;

              return (
                <div
                  key={item.id}
                  className={`p-2.5 sm:p-3 rounded-2xl border flex items-center justify-between gap-2 transition ${isToday
                      ? 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40 text-amber-950 dark:text-amber-200'
                      : 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/30 text-blue-950 dark:text-blue-200'
                    }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-base select-none shrink-0">⏳</span>
                    <div className="text-xs truncate">
                      <span className="font-semibold block truncate">
                        {isToday ? (
                          <>
                            <strong className="text-amber-600 dark:text-amber-400 font-extrabold">Oggi</strong> spenderai{' '}
                            <strong className="font-extrabold text-[#1D1D1F] dark:text-white">{formatCurrency(item.amount)}</strong> per{' '}
                            <strong className="font-bold underline">{item.category}</strong> (spesa fissa)
                          </>
                        ) : (
                          <>
                            Tra <strong className="font-extrabold text-blue-600 dark:text-sky-300">{item.diffDays} {item.diffDays === 1 ? 'giorno' : 'giorni'}</strong> spenderai{' '}
                            <strong className="font-extrabold text-[#1D1D1F] dark:text-white">{formatCurrency(item.amount)}</strong> per{' '}
                            <strong className="font-bold underline">{item.category}</strong> (spesa fissa)
                          </>
                        )}
                      </span>
                      <span className="text-[10px] text-[#86868B] dark:text-gray-400 block">
                        Giorno {item.recurring_day} del mese • Non ancora addebitata
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMarkFixedPaid(item)}
                      className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-xs font-bold text-white transition cursor-pointer shadow-xs flex items-center gap-1"
                      title="Registra immediatamente questa spesa nel mese corrente"
                    >
                      <span>✓ Segna pagato</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenSheet('expense')}
                      className="hidden sm:inline-flex px-2 py-1 rounded-xl bg-white dark:bg-[#2C2C2E] border border-gray-200/80 dark:border-white/10 text-xs font-semibold text-[#86868B] dark:text-gray-300 hover:text-[#007AFF] transition cursor-pointer"
                    >
                      Dettagli
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Lista Transazioni */}
        {recentTransactions.length === 0 ? (
          <div className="py-8 px-4 text-center space-y-1.5 bg-gray-50/60 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
            <p className="text-xs font-semibold text-[#1D1D1F] dark:text-white">
              Nessuna operazione questo mese
            </p>
            <p className="text-[11px] text-[#86868B] dark:text-gray-400">
              Usa la barra Spotlight in alto o i pulsanti + su Entrate/Uscite per registrare la prima voce.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/10">
            {recentTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              const meta = categoryMetaMap[tx.category] || { icon: 'Tag', color: isIncome ? '#34C759' : '#007AFF' };

              return (
                <div
                  key={tx.id}
                  className="py-2.5 flex items-center justify-between group hover:bg-gray-50/80 dark:hover:bg-white/5 rounded-xl px-1.5 transition"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${meta.color}15` }}
                    >
                      <CategoryIcon
                        name={meta.icon}
                        className="w-4 h-4"
                        color={meta.color}
                      />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold text-[#1D1D1F] dark:text-white truncate">
                        {tx.category}
                      </div>
                      <div className="text-[10px] text-[#86868B] dark:text-gray-400 truncate">
                        {formatDate(tx.date)} {tx.note && `• ${tx.note}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className={`text-xs font-bold ${isIncome ? 'text-[#34C759]' : 'text-[#1D1D1F] dark:text-white'
                        }`}
                    >
                      <PrivacyAmount amount={tx.amount} prefix={isIncome ? '+' : '-'} />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(tx.id, tx.note, tx.category)}
                      className="p-1 rounded-md text-gray-400 hover:text-[#FF3B30] transition cursor-pointer"
                      title="Elimina"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modale Modifica Target di Risparmio */}
      <Modal
        title="Modifica Target di Risparmio"
        open={targetModalOpen}
        onOk={handleSaveTarget}
        onCancel={() => setTargetModalOpen(false)}
        okText="Salva Target"
        cancelText="Annulla"
        centered
      >
        <div className="py-4 space-y-4">
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Scegli quale percentuale delle tue entrate mensili desideri accantonare come risparmio:
          </p>
          <div className="text-center py-2">
            <span className="text-4xl font-extrabold text-blue-600 dark:text-sky-400">
              {tempTarget}%
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="80"
            step="5"
            value={tempTarget}
            onChange={(e) => setTempTarget(Number(e.target.value))}
            className="w-full accent-blue-600 dark:accent-sky-400"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-semibold">
            <span>5% (Minimo)</span>
            <span>30% (Default)</span>
            <span>80% (FIRE)</span>
          </div>
        </div>
      </Modal>
    </div>
  );
};
