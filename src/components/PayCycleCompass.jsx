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
  RotateCcw,
  Power,
  ChevronRight,
  TrendingDown,
  Info,
  X
} from 'lucide-react';
import { Modal, message } from 'antd';

/**
 * Calcola i giorni compresi tra due date ISO (YYYY-MM-DD),
 * normalizzando a mezzanotte locale.
 */
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

/**
 * Calcola il prossimo giorno X del mese (es. 15, 10, 27).
 * Se oggi è prima del giorno X, restituisce il giorno X del mese corrente,
 * altrimenti restituisce il giorno X del mese successivo.
 */
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

  // Verifica validità giorno per il mese (es. febbraio)
  const maxDays = new Date(targetYear, targetMonth + 1, 0).getDate();
  const safeDay = Math.min(targetDayNumber, maxDays);

  const mm = String(targetMonth + 1).padStart(2, '0');
  const dd = String(safeDay).padStart(2, '0');
  return `${targetYear}-${mm}-${dd}`;
};

export const PayCycleCompass = () => {
  const { monthlyMetrics, filteredTransactions, transactions } = useFinance();

  // Cashflow sicuro disponibile dal contesto finanziario
  const safeCashflow = Number(monthlyMetrics?.remainingMonthlyBudget ?? monthlyMetrics?.netSavings ?? 0);

  // 1. STATO PERSISTITO IN LOCALSTORAGE ('flow_pay_cycle_v1')
  const [cycleConfig, setCycleConfig] = useState(() => {
    try {
      const raw = localStorage.getItem('flow_pay_cycle_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            enabled: Boolean(parsed.enabled),
            targetDate: parsed.targetDate || getNextSpecificDayIso(15),
            startDate: parsed.startDate || getTodayIso(),
            initialBudget: Number(parsed.initialBudget) || 0,
            dailyAllowance: Number(parsed.dailyAllowance) || 0
          };
        }
      }
    } catch (e) {
      console.warn("Caricamento flow_pay_cycle_v1 fallito:", e);
    }

    return {
      enabled: false,
      targetDate: getNextSpecificDayIso(15),
      startDate: getTodayIso(),
      initialBudget: 0,
      dailyAllowance: 0
    };
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [tempTargetDate, setTempTargetDate] = useState(cycleConfig.targetDate || getNextSpecificDayIso(15));

  // Salvataggio su localStorage
  const saveCycleConfig = (newConfig) => {
    setCycleConfig(newConfig);
    try {
      localStorage.setItem('flow_pay_cycle_v1', JSON.stringify(newConfig));
    } catch (e) {
      console.error("Salvataggio flow_pay_cycle_v1:", e);
    }
  };

  // 2. LOGICA MATEMATICA PRECISA (ROLLOVER & ACCUMULO GIORNALIERO)
  const cycleData = useMemo(() => {
    if (!cycleConfig.enabled) {
      return null;
    }

    const todayIso = getTodayIso();
    const startIso = cycleConfig.startDate || todayIso;
    const targetIso = cycleConfig.targetDate || getNextSpecificDayIso(15);

    // Durata totale del ciclo in giorni (compresi inizio e fine)
    const totalCycleDays = Math.max(1, getDayDifference(startIso, targetIso) + 1);

    // Giorni rimanenti alla data target (incluso oggi)
    const rawRemaining = getDayDifference(todayIso, targetIso) + 1;
    const remainingDays = Math.max(1, rawRemaining);

    // Giorni trascorsi dall'inizio del ciclo a oggi (incluso oggi)
    const daysElapsed = Math.max(1, getDayDifference(startIso, todayIso) + 1);

    // Quota Base Giornaliera fissata all'inizio del ciclo
    const initialBudget = Number(cycleConfig.initialBudget) || 0;
    const baseDailyRate = cycleConfig.dailyAllowance > 0
      ? cycleConfig.dailyAllowance
      : (totalCycleDays > 0 ? Math.round((initialBudget / totalCycleDays) * 100) / 100 : 0);

    // Budget maturato/sbloccato fino ad oggi
    const unlockedBudget = baseDailyRate * daysElapsed;

    // Calcolo spese complessive registrate da startDate a oggi
    const txSource = Array.isArray(filteredTransactions) && filteredTransactions.length > 0
      ? filteredTransactions
      : (Array.isArray(transactions) ? transactions : []);

    let spentSinceStart = 0;
    let spentToday = 0;

    txSource.forEach(t => {
      if (t.type === 'expense' && t.date) {
        const amt = Number(t.amount) || 0;
        if (t.date >= startIso && t.date <= todayIso) {
          spentSinceStart += amt;
        }
        if (t.date === todayIso) {
          spentToday += amt;
        }
      }
    });

    // Disponibile OGGI (budget sbloccato fino a oggi - quanto speso finora nel ciclo)
    const availableToday = unlockedBudget - spentSinceStart;

    // Rollover accumulato dai giorni precedenti
    const accumulatedRollover = Math.max(0, availableToday - baseDailyRate);

    // Nuova media ricalcolata da domani a scadenza
    const futureCashflow = Math.max(0, initialBudget - spentSinceStart);
    const futureDailyRate = remainingDays > 0 ? Math.round((futureCashflow / remainingDays) * 100) / 100 : 0;

    // Percentuale di consumo della disponibilità odierna
    const budgetForTodayCap = Math.max(availableToday + spentToday, baseDailyRate);
    const progressToday = budgetForTodayCap > 0
      ? Math.min(100, Math.max(0, (spentToday / budgetForTodayCap) * 100))
      : 0;

    // Formattazione data target (es. "15 Dic")
    let targetFormatted = targetIso;
    try {
      const [tY, tM, tD] = targetIso.split('-').map(Number);
      const dObj = new Date(tY, tM - 1, tD);
      targetFormatted = dObj.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }).toUpperCase();
    } catch {}

    return {
      targetIso,
      targetFormatted,
      startIso,
      totalCycleDays,
      remainingDays,
      daysElapsed,
      baseDailyRate,
      unlockedBudget,
      spentSinceStart,
      spentToday,
      availableToday,
      accumulatedRollover,
      futureDailyRate,
      progressToday,
      isExpired: rawRemaining <= 0
    };
  }, [cycleConfig, filteredTransactions, transactions]);

  // Handler attivazione / ricalcolo
  const handleActivateCycle = () => {
    if (!tempTargetDate) {
      message.error("Seleziona una data di fine ciclo valida.");
      return;
    }

    const todayIso = getTodayIso();
    const diff = getDayDifference(todayIso, tempTargetDate);

    if (diff < 0) {
      message.error("La data di scadenza deve essere oggi o una data futura.");
      return;
    }

    const totalDays = Math.max(1, diff + 1);
    const currentBudget = safeCashflow > 0 ? safeCashflow : 0;
    const dailyRate = Math.round((currentBudget / totalDays) * 100) / 100;

    const newConfig = {
      enabled: true,
      targetDate: tempTargetDate,
      startDate: todayIso,
      initialBudget: currentBudget,
      dailyAllowance: dailyRate
    };

    saveCycleConfig(newConfig);
    setModalOpen(false);
    message.success(`Bussola Ciclo attivata fino al ${tempTargetDate}! Quota base: ${formatCurrency(dailyRate)}/g`);
  };

  const handleDeactivate = () => {
    saveCycleConfig({
      ...cycleConfig,
      enabled: false
    });
    setModalOpen(false);
    message.info("Bussola Ciclo disattivata.");
  };

  // Se disattivata: mostriamo solo la pillola/pulsante discreto ed elegante stile Apple
  if (!cycleConfig.enabled || !cycleData) {
    return (
      <div className="w-full">
        <button
          type="button"
          onClick={() => {
            setTempTargetDate(cycleConfig.targetDate || getNextSpecificDayIso(15));
            setModalOpen(true);
          }}
          className="w-full py-2.5 px-4 rounded-2xl bg-white/70 hover:bg-white dark:bg-[#1C1C1E]/60 dark:hover:bg-[#1C1C1E] border border-dashed border-neutral-300 dark:border-white/10 text-xs font-semibold text-neutral-600 dark:text-neutral-300 flex items-center justify-between transition-all duration-200 active:scale-[0.99] cursor-pointer group shadow-2xs"
          title="Attiva la Bussola Ciclo personalizzata fino al giorno dello stipendio"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#007AFF] flex items-center justify-center">
              <CalendarClock className="w-3.5 h-3.5" />
            </div>
            <span>+ Crea Bussola Ciclo (Stipendio / Data Target)</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-[#007AFF] dark:text-sky-400 font-bold">
            <span>Configura</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
          </div>
        </button>

        {/* Modale Configurazione */}
        <ConfigModal
          open={modalOpen}
          tempTargetDate={tempTargetDate}
          setTempTargetDate={setTempTargetDate}
          safeCashflow={safeCashflow}
          onClose={() => setModalOpen(false)}
          onActivate={handleActivateCycle}
          onDeactivate={handleDeactivate}
          isEnabled={cycleConfig.enabled}
        />
      </div>
    );
  }

  // Stato ATTIVATO: Card Compatta & Raffinata in perfetto Stile Apple Cupertino
  const isPositive = cycleData.availableToday >= 0;
  const isRolloverActive = cycleData.accumulatedRollover > 0.05;

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-3xl apple-card p-4 sm:p-5 border border-neutral-200/80 dark:border-white/10 shadow-xs bg-gradient-to-br from-white via-white to-blue-50/30 dark:from-[#1C1C1E] dark:via-[#1C1C1E] dark:to-blue-950/20 transition-all">
        {/* Barra superiore: Titolo, Badge Scadenza & Ingranaggio impostazioni */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#007AFF] flex items-center justify-center">
              <CalendarClock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#007AFF] dark:text-sky-300">
                  Bussola Ciclo · Fino al {cycleData.targetFormatted}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100/80 dark:bg-blue-900/40 text-[#007AFF] dark:text-sky-300">
                  {cycleData.remainingDays === 1 ? 'Oggi ultimo giorno' : `-${cycleData.remainingDays} giorni`}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setTempTargetDate(cycleConfig.targetDate);
              setModalOpen(true);
            }}
            className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition cursor-pointer"
            title="Modifica Bussola Ciclo"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Valore Principale: "Disponibile Oggi" con logica Rollover */}
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <div>
              <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 block">
                Disponibile Oggi (Rollover incluso)
              </span>
              <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                <PrivacyAmount amount={cycleData.availableToday} />
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block">
                Quota base ciclo
              </span>
              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200">
                {formatCurrency(cycleData.baseDailyRate)} / giorno
              </span>
            </div>
          </div>

          {/* Sottotitolo descrittivo & Badge accumulo */}
          <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 pt-0.5 flex-wrap gap-1">
            <span>
              Speso oggi: <strong className="font-semibold text-neutral-800 dark:text-neutral-200">{formatCurrency(cycleData.spentToday)}</strong>
            </span>

            {isRolloverActive ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                <span>+{formatCurrency(cycleData.accumulatedRollover)} risparmiati nei gg scorsi</span>
              </span>
            ) : (
              <span className="text-[10px] text-neutral-400">
                Media restante: {formatCurrency(cycleData.futureDailyRate)}/g
              </span>
            )}
          </div>

          {/* Sottile barra di progresso giornaliera */}
          <div className="w-full bg-neutral-100 dark:bg-white/10 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isPositive ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, cycleData.progressToday)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Modale Configurazione */}
      <ConfigModal
        open={modalOpen}
        tempTargetDate={tempTargetDate}
        setTempTargetDate={setTempTargetDate}
        safeCashflow={safeCashflow}
        onClose={() => setModalOpen(false)}
        onActivate={handleActivateCycle}
        onDeactivate={handleDeactivate}
        isEnabled={cycleConfig.enabled}
      />
    </div>
  );
};

/**
 * Modale di Configurazione e Gestione della Bussola Ciclo
 */
const ConfigModal = ({
  open,
  tempTargetDate,
  setTempTargetDate,
  safeCashflow,
  onClose,
  onActivate,
  onDeactivate,
  isEnabled
}) => {
  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#007AFF] flex items-center justify-center">
            <CalendarClock className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm">Bussola Ciclo (Stipendio / Target)</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      centered
    >
      <div className="space-y-4 pt-2 text-xs">
        <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-[11px]">
          Imposta la data del prossimo stipendio o di arrivo fondi. La Bussola calcolerà la quota giornaliera spendibile e accumulerà automaticamente nei giorni seguenti il budget che non spendi oggi.
        </p>

        {/* Selezione Data Target */}
        <div>
          <label className="font-semibold text-neutral-800 dark:text-neutral-200 block mb-1.5">
            Data Fine Ciclo (Prossimo Stipendio)
          </label>
          <input
            type="date"
            value={tempTargetDate}
            onChange={(e) => setTempTargetDate(e.target.value)}
            className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-[#007AFF]"
          />
        </div>

        {/* Pulsanti Rapidi Data */}
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
                  className={`py-2 px-2.5 rounded-xl border text-center transition cursor-pointer text-xs font-bold ${
                    isSelected
                      ? 'border-[#007AFF] bg-blue-50/80 dark:bg-blue-950/40 text-[#007AFF]'
                      : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  Il {dayNum} del mese
                </button>
              );
            })}
          </div>
        </div>

        {/* Anteprima Calcolo */}
        <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-white/10 space-y-1.5">
          <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
            <span>Cashflow disponibile attuale:</span>
            <strong className="text-neutral-900 dark:text-white font-bold">{formatCurrency(safeCashflow)}</strong>
          </div>
          <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
            <span>Giorni fino alla data:</span>
            <strong className="text-neutral-900 dark:text-white font-bold">
              {Math.max(1, getDayDifference(getTodayIso(), tempTargetDate) + 1)} giorni
            </strong>
          </div>
          <div className="flex justify-between text-[#007AFF] dark:text-sky-400 pt-1 border-t border-neutral-200/50 dark:border-white/10 font-bold">
            <span>Quota stimata:</span>
            <span>
              {formatCurrency(
                safeCashflow > 0
                  ? safeCashflow / Math.max(1, getDayDifference(getTodayIso(), tempTargetDate) + 1)
                  : 0
              )} / giorno
            </span>
          </div>
        </div>

        {/* Azioni */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={onActivate}
            className="w-full py-2.5 rounded-xl bg-[#007AFF] hover:bg-blue-600 active:scale-95 text-white font-bold text-xs shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{isEnabled ? 'Ricalcola e Aggiorna Ciclo' : 'Attiva Bussola Ciclo'}</span>
          </button>

          {isEnabled && (
            <button
              type="button"
              onClick={onDeactivate}
              className="w-full py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-600 dark:text-red-300 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Disattiva Bussola Ciclo</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
