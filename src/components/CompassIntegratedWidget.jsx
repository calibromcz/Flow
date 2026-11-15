import React, { useState, useEffect, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, PrivacyAmount } from './CategoryIcon';
import {
  Compass,
  CalendarClock,
  Settings,
  Sparkles,
  Calendar,
  Check,
  AlertCircle
} from 'lucide-react';
import { Modal, message } from 'antd';

const getDayDifference = (startIso, endIso) => {
  if (!startIso || !endIso) return 0;
  const [sY, sM, sD] = startIso.split('-').map(Number);
  const [eY, eM, eD] = endIso.split('-').map(Number);
  const start = new Date(sY, sM - 1, sD).getTime();
  const end = new Date(eY, eM - 1, eD).getTime();
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
};

const getTodayIso = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getNextSpecificDayIso = (targetDayNumber) => {
  const now = new Date();
  const currentDay = now.getDate();
  let targetYear = now.getFullYear();
  let targetMonth = now.getMonth();

  if (currentDay >= targetDayNumber) {
    targetMonth += 1;
    if (targetMonth > 11) {
      targetMonth = 0;
      targetYear += 1;
    }
  }

  const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
  const safeDay = Math.min(targetDayNumber, maxDays);

  const mm = String(targetMonth + 1).padStart(2, '0');
  const dd = String(safeDay).padStart(2, '0');
  return `${targetYear}-${mm}-${dd}`;
};

export const CompassIntegratedWidget = () => {
  const { monthlyMetrics, filteredTransactions, transactions } = useFinance();

  // Cashflow sicuro disponibile dal mese/wallet attivo
  const safeCashflow = Number(monthlyMetrics?.remainingMonthlyBudget ?? monthlyMetrics?.netSavings ?? 0);
  const dailySpendableMonth = Number(monthlyMetrics?.dailySpendable || 0);
  const remainingDaysMonth = Number(monthlyMetrics?.remainingDays || 1);
  const incomeMonth = Number(monthlyMetrics?.income || 0);

  // 1. STATO PERSISTITO IN LOCALSTORAGE: 'flow_pay_cycle_v1'
  const [cycleConfig, setCycleConfig] = useState(() => {
    try {
      const raw = localStorage.getItem('flow_pay_cycle_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            activeView: parsed.activeView || 'month', // 'month' | 'cycle'
            targetDate: parsed.targetDate || getNextSpecificDayIso(15),
            startDate: parsed.startDate || getTodayIso()
          };
        }
      }
    } catch (e) {
      console.warn("Lettura flow_pay_cycle_v1:", e);
    }
    return {
      activeView: 'month',
      targetDate: getNextSpecificDayIso(15),
      startDate: getTodayIso()
    };
  });

  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [tempTargetDate, setTempTargetDate] = useState(cycleConfig.targetDate);

  const saveConfig = (updated) => {
    setCycleConfig(updated);
    try {
      localStorage.setItem('flow_pay_cycle_v1', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSwitchView = (view) => {
    saveConfig({
      ...cycleConfig,
      activeView: view
    });
  };

  // 2. LOGICA MATEMATICA PRECISA CON ACCUMULO (ROLLOVER) NELLA MODALITÀ "CICLO"
  const cycleMetrics = useMemo(() => {
    const todayIso = getTodayIso();
    const startIso = cycleConfig.startDate || todayIso;
    const targetIso = cycleConfig.targetDate || getNextSpecificDayIso(15);

    // Giorni totali ciclo (da startDate a targetDate compresi)
    const totalCycleDays = Math.max(1, getDayDifference(startIso, targetIso) + 1);

    // Giorni mancanti da oggi (incluso oggi) a targetDate
    const remainingDaysCycle = Math.max(1, getDayDifference(todayIso, targetIso) + 1);

    // Giorni trascorsi da startDate a oggi compreso
    const daysElapsedUntilToday = Math.max(1, getDayDifference(startIso, todayIso) + 1);

    // Transazioni nel perimetro del portafoglio attivo
    const txSource = Array.isArray(filteredTransactions) && filteredTransactions.length > 0
      ? filteredTransactions
      : (Array.isArray(transactions) ? transactions : []);

    let expensesSinceStart = 0;
    let expensesBeforeToday = 0;
    let expensesToday = 0;

    txSource.forEach(t => {
      if (t.type === 'expense' && t.date) {
        const amt = Number(t.amount) || 0;
        if (t.date >= startIso && t.date <= todayIso) {
          expensesSinceStart += amt;
        }
        if (t.date >= startIso && t.date < todayIso) {
          expensesBeforeToday += amt;
        }
        if (t.date === todayIso) {
          expensesToday += amt;
        }
      }
    });

    // Budget iniziale del ciclo: cashflow attuale + quanto speso finora nel ciclo
    const cycleStartingBudget = Math.max(0, safeCashflow + expensesSinceStart);

    // Quota base giornaliera fissa del ciclo
    const baseDailyRate = totalCycleDays > 0 ? (cycleStartingBudget / totalCycleDays) : 0;

    // Budget sbloccato fino a oggi compreso
    const unlockedBudgetToday = baseDailyRate * daysElapsedUntilToday;

    // Spendibile OGGI con accumulo: (budget sbloccato fino ad oggi) - (spese fino a ieri) - (spese oggi)
    const availableToday = unlockedBudgetToday - expensesBeforeToday - expensesToday;

    // Quota accumulata dai giorni precedenti non spesi (se positivo rispetto a baseDailyRate)
    const accumulatedFromPast = Math.max(0, (unlockedBudgetToday - expensesBeforeToday) - baseDailyRate);

    // Formattazione data (es. 15 Dic)
    let formattedTarget = targetIso;
    try {
      const [y, m, d] = targetIso.split('-').map(Number);
      formattedTarget = new Date(y, m - 1, d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
    } catch {}

    return {
      targetIso,
      formattedTarget,
      totalCycleDays,
      remainingDaysCycle,
      daysElapsedUntilToday,
      baseDailyRate: Math.round(baseDailyRate * 100) / 100,
      availableToday: Math.round(availableToday * 100) / 100,
      accumulatedFromPast: Math.round(accumulatedFromPast * 100) / 100,
      expensesToday
    };
  }, [cycleConfig, filteredTransactions, transactions, safeCashflow]);

  const handleSaveDate = () => {
    if (!tempTargetDate) {
      message.error("Seleziona una data valida.");
      return;
    }
    const todayIso = getTodayIso();
    saveConfig({
      ...cycleConfig,
      targetDate: tempTargetDate,
      startDate: todayIso
    });
    setDateModalOpen(false);
    message.success(`Data ciclo impostata al ${tempTargetDate}!`);
  };

  const isCycleView = cycleConfig.activeView === 'cycle';

  return (
    <div className="mt-2 pt-3 border-t border-gray-100 dark:border-white/10 space-y-2.5">
      {/* Intestazione Sezione & Switch Segmented Control Apple Cupertino */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-[#007AFF] dark:text-sky-400" />
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#007AFF] dark:text-sky-300">
            {isCycleView ? 'Bussola Ciclo (Stipendio)' : 'Bussola Mese'}
          </span>
        </div>

        {/* Segmented Control iOS */}
        <div className="flex bg-gray-100 dark:bg-white/10 p-0.5 rounded-full text-[10px] font-bold">
          <button
            type="button"
            onClick={() => handleSwitchView('month')}
            className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
              !isCycleView
                ? 'bg-white dark:bg-[#1C1C1E] text-neutral-900 dark:text-white shadow-2xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Mese
          </button>
          <button
            type="button"
            onClick={() => handleSwitchView('cycle')}
            className={`px-2.5 py-0.5 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
              isCycleView
                ? 'bg-white dark:bg-[#1C1C1E] text-[#007AFF] dark:text-sky-400 shadow-2xs font-extrabold'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <span>Ciclo</span>
            <span className="text-[8px] bg-blue-100 dark:bg-blue-900/40 px-1 rounded-full text-[#007AFF] dark:text-sky-300">
              Rollover
            </span>
          </button>
        </div>
      </div>

      {/* VISTA 1: BUSSOLA MESE (STANDARD ESISTENTE) */}
      {!isCycleView ? (
        incomeMonth === 0 ? (
          <div className="text-xs text-[#86868B] dark:text-gray-400 italic">
            Inserisci le entrate del mese per attivare la Bussola Giornaliera.
          </div>
        ) : dailySpendableMonth > 0 ? (
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl p-2.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-emerald-800 dark:text-emerald-300 block font-medium">
                Spendibile oggi ({remainingDaysMonth} gg rimasti a fine mese):
              </span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                fino a <PrivacyAmount amount={dailySpendableMonth} /> / giorno
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
        )
      ) : (
        /* VISTA 2: BUSSOLA CICLO (CON ROLLOVER E ACCUMULO) */
        <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-2.5 space-y-1.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-blue-900 dark:text-sky-200 font-medium">
              Spendibile OGGI con accumulo:
            </span>
            <button
              type="button"
              onClick={() => {
                setTempTargetDate(cycleConfig.targetDate);
                setDateModalOpen(true);
              }}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-[#007AFF] dark:text-sky-300 hover:underline cursor-pointer"
              title="Cambia data target stipendio"
            >
              <Calendar className="w-3 h-3" />
              <span>Fino al {cycleMetrics.formattedTarget}</span>
            </button>
          </div>

          <div className="flex items-baseline justify-between flex-wrap gap-1">
            <span className={`text-base sm:text-lg font-black tracking-tight ${
              cycleMetrics.availableToday >= 0 
                ? 'text-emerald-600 dark:text-emerald-400' 
                : 'text-rose-600 dark:text-rose-400'
            }`}>
              <PrivacyAmount amount={cycleMetrics.availableToday} />
            </span>

            <span className="text-[10px] bg-blue-100/90 dark:bg-blue-900/50 text-[#007AFF] dark:text-sky-300 font-bold px-2 py-0.5 rounded-full">
              Mancano {cycleMetrics.remainingDaysCycle} gg
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-neutral-500 dark:text-neutral-400 pt-0.5 border-t border-blue-100/60 dark:border-white/5 flex-wrap gap-1">
            <span>
              Quota base: <strong className="font-semibold text-neutral-800 dark:text-neutral-200">{formatCurrency(cycleMetrics.baseDailyRate)}/g</strong>
            </span>
            {cycleMetrics.accumulatedFromPast > 0.05 ? (
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                Accumulato: +{formatCurrency(cycleMetrics.accumulatedFromPast)}
              </span>
            ) : (
              <span>Speso oggi: {formatCurrency(cycleMetrics.expensesToday)}</span>
            )}
          </div>
        </div>
      )}

      {/* Modale Scelta Data Stipendio */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#007AFF] flex items-center justify-center">
              <CalendarClock className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm">Data Fine Ciclo (Prossimo Stipendio)</span>
          </div>
        }
        open={dateModalOpen}
        onCancel={() => setDateModalOpen(false)}
        footer={null}
        centered
      >
        <div className="space-y-4 pt-2 text-xs">
          <p className="text-neutral-500 dark:text-neutral-400 text-[11px] leading-relaxed">
            Scegli il giorno in cui riceverai lo stipendio o il nuovo accredito. La Bussola calcolerà la quota giornaliera fissa e accumulerà automaticamente quanto non spendi oggi per i giorni successivi.
          </p>

          <div>
            <label className="font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
              Data Target
            </label>
            <input
              type="date"
              value={tempTargetDate}
              onChange={(e) => setTempTargetDate(e.target.value)}
              className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-[#007AFF]"
            />
          </div>

          <div>
            <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
              Scorciatoie Rapide
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[10, 15, 27].map((dayNum) => {
                const target = getNextSpecificDayIso(dayNum);
                const isSelected = tempTargetDate === target;

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => setTempTargetDate(target)}
                    className={`py-2 px-2 rounded-xl border text-center transition cursor-pointer text-xs font-bold ${
                      isSelected
                        ? 'border-[#007AFF] bg-blue-50 dark:bg-blue-950/40 text-[#007AFF]'
                        : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    Il {dayNum} del mese
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveDate}
            className="w-full py-2.5 rounded-xl bg-[#007AFF] hover:bg-blue-600 active:scale-95 text-white font-bold text-xs shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5 mt-2"
          >
            <Check className="w-4 h-4" />
            <span>Salva Data Ciclo</span>
          </button>
        </div>
      </Modal>
    </div>
  );
};
