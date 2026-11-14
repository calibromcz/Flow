import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';
import { usePalette } from '../context/PaletteContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, CategoryIcon, PrivacyAmount } from './CategoryIcon';
import { parseAmount } from '../utils/numberUtils';
import { exportMonthlyReportExcel } from '../utils/exportExcel';
import { exportMonthlyReportPdf } from '../utils/exportPdf';
import { IconPicker } from './IconPicker';
import { 
  downloadIcsReminder, 
  downloadAllRecurringIcs, 
  openGoogleCalendarReminder 
} from '../utils/calendarReminder';
import { 
  Sparkles, 
  TrendingDown, 
  PieChart, 
  Info, 
  ChevronLeft, 
  ChevronRight, 
  FileSpreadsheet, 
  FileText, 
  CreditCard, 
  Trash2, 
  CheckCircle2, 
  Calendar, 
  Layers, 
  Repeat, 
  CalendarPlus,
  Calculator,
  Compass,
  Plus
} from 'lucide-react';
import { Modal, message, Dropdown } from 'antd';

export const TabAnalytics = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { palette } = usePalette();
  const { 
    monthlyTransactions,
    monthlyMetrics, 
    monthLabel, 
    currentDate,
    prevMonth,
    nextMonth,
    savingTargetPercent,
    savingsGoals,
    categories,
    categoryMetaMap,
    updateCategoryMonthlyLimit,
    addCategory,
    updateCategory,
    amortizations,
    addAmortization,
    updateAmortizationProgress,
    deleteAmortization,
    addTransaction
  } = useFinance();

  // Simulatore Spesa / Impatto Acquisto
  const [simulatedAmount, setSimulatedAmount] = useState('80');
  const [simulatedCategory, setSimulatedCategory] = useState('Alimentari & Ristoranti');

  const numSimulated = parseAmount(simulatedAmount);
  const currentDailySpendable = monthlyMetrics.dailySpendable || 0;
  const remainingDays = monthlyMetrics.remainingDays || 1;
  const newBudgetAfterPurchase = (monthlyMetrics.remainingMonthlyBudget || 0) - numSimulated;
  const newDailySpendable = Math.max(0, newBudgetAfterPurchase / remainingDays);

  const handleApplySimulatedExpense = async () => {
    if (!numSimulated || numSimulated <= 0) {
      message.error("Inserisci un importo valido da simulare.");
      return;
    }
    await addTransaction({
      type: 'expense',
      amount: numSimulated,
      category: simulatedCategory,
      note: 'Acquisto simulato e confermato',
      date: new Date().toISOString().split('T')[0]
    });
    message.success(`Spesa di ${formatCurrency(numSimulated)} registrata!`);
  };

  const { 
    categoryTotals, 
    expense, 
    income, 
    topCategory, 
    potentialSaving15, 
    netSavings, 
    savingsRate,
    recurringList
  } = monthlyMetrics;

  // Stato per Modale Categoria Fissa / Ricorrenze
  const [fixedModalOpen, setFixedModalOpen] = useState(false);
  const [fixedCatName, setFixedCatName] = useState('');
  const [fixedCatType, setFixedCatType] = useState('expense');
  const [fixedCatAmount, setFixedCatAmount] = useState('');
  const [fixedCatDay, setFixedCatDay] = useState(1);
  const [fixedCatColor, setFixedCatColor] = useState('#007AFF');
  const [fixedCatIcon, setFixedCatIcon] = useState('Tag');
  const [editingCategoryName, setEditingCategoryName] = useState(null);

  const handleOpenNewFixedModal = (presetType = 'expense') => {
    setEditingCategoryName(null);
    setFixedCatName('');
    setFixedCatType(presetType);
    setFixedCatAmount('');
    setFixedCatDay(1);
    setFixedCatColor(presetType === 'income' ? '#32B87A' : '#007AFF');
    setFixedCatIcon(presetType === 'income' ? 'Briefcase' : 'Home');
    setFixedModalOpen(true);
  };

  const handleEditFixedCategory = (cat) => {
    setEditingCategoryName(cat.name);
    setFixedCatName(cat.name);
    setFixedCatType(cat.type || 'expense');
    setFixedCatAmount(cat.fixed_amount ? String(cat.fixed_amount) : '');
    setFixedCatDay(cat.fixed_day || 1);
    setFixedCatColor(cat.color || '#007AFF');
    setFixedCatIcon(cat.icon || 'Tag');
    setFixedModalOpen(true);
  };

  const handleSaveFixedCategory = async () => {
    if (!fixedCatName.trim()) {
      message.error("Inserisci il nome del fisso / categoria.");
      return;
    }

    const payload = {
      name: fixedCatName.trim(),
      type: fixedCatType,
      color: fixedCatColor,
      icon: fixedCatIcon,
      is_fixed: true,
      fixed_amount: fixedCatAmount ? parseAmount(fixedCatAmount) : null,
      fixed_day: Number(fixedCatDay || 1)
    };

    if (editingCategoryName) {
      await updateCategory(editingCategoryName, payload);
      message.success(`Fisso "${payload.name}" aggiornato!`);
    } else {
      await addCategory(fixedCatType, payload);
      message.success(`Nuovo fisso "${payload.name}" salvato!`);
    }
    setFixedModalOpen(false);
  };

  // Stato per Modale Tetto Spesa Categoria (Semaforo)
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [selectedCategoryForLimit, setSelectedCategoryForLimit] = useState(null);
  const [tempLimitValue, setTempLimitValue] = useState('');

  // Modale Unificato: Imposta Tetto / Crea Categoria
  const [newBudgetModalOpen, setNewBudgetModalOpen] = useState(false);
  const [budgetTab, setBudgetTab] = useState('existing'); // 'existing' | 'new'
  const [selectedCatNameForBudget, setSelectedCatNameForBudget] = useState('');
  const [newCatNameForBudget, setNewCatNameForBudget] = useState('');
  const [newCatTypeForBudget, setNewCatTypeForBudget] = useState('expense'); // 'expense' | 'income'
  const [newCatIconForBudget, setNewCatIconForBudget] = useState('ShoppingCart');
  const [budgetAmountInput, setBudgetAmountInput] = useState('');


  const handleOpenLimitModal = (cat) => {
    setSelectedCategoryForLimit(cat);
    setTempLimitValue(cat.monthly_limit ? String(cat.monthly_limit) : '');
    setLimitModalOpen(true);
  };

  const handleOpenNewBudgetModal = () => {
    const firstCat = categories?.expense?.[0]?.name || '';
    setSelectedCatNameForBudget(firstCat);
    setNewCatNameForBudget('');
    setNewCatTypeForBudget('expense');
    setNewCatIconForBudget('ShoppingCart');
    setBudgetAmountInput('');
    setBudgetTab('existing');
    setNewBudgetModalOpen(true);
  };

  const handleSaveUnifiedBudget = async () => {
    const limitNum = parseAmount(budgetAmountInput);
    if (!limitNum || limitNum <= 0) {
      message.error("Inserisci un importo di tetto valido maggiore di 0 €.");
      return;
    }

    let targetCatName = selectedCatNameForBudget;

    if (budgetTab === 'new') {
      const cleanName = newCatNameForBudget.trim();
      if (!cleanName) {
        message.error("Inserisci il nome della nuova categoria.");
        return;
      }
      targetCatName = cleanName;
      // Salva la nuova categoria globalmente
      await addCategory(newCatTypeForBudget, {
        name: cleanName,
        icon: newCatIconForBudget || (newCatTypeForBudget === 'income' ? 'Briefcase' : 'ShoppingCart'),
        color: newCatTypeForBudget === 'income' ? '#32B87A' : '#007AFF',
        monthly_limit: limitNum
      });
      message.success(`Categoria "${cleanName}" creata con tetto di ${formatCurrency(limitNum)}!`);
    } else {
      if (!targetCatName) {
        message.error("Seleziona una categoria.");
        return;
      }
      await updateCategoryMonthlyLimit(targetCatName, limitNum);
      message.success(`Tetto di ${formatCurrency(limitNum)} impostato per "${targetCatName}"!`);
    }

    setNewBudgetModalOpen(false);
  };

  // Stato per Modale Nuovo Ammortamento (Finanziaria a Te Stesso)
  const [amortModalOpen, setAmortModalOpen] = useState(false);
  const [amortTitle, setAmortTitle] = useState('');
  const [amortTotal, setAmortTotal] = useState('');
  const [amortInstallments, setAmortInstallments] = useState(4);
  const [amortStartMonth, setAmortStartMonth] = useState(new Date().toISOString().slice(0, 7));
  const [amortCategory, setAmortCategory] = useState('Acquisto Straordinario');


  const handleSaveCategoryLimit = async () => {
    if (!selectedCategoryForLimit) return;
    const parsed = tempLimitValue.trim() === '' ? null : parseAmount(tempLimitValue);
    await updateCategoryMonthlyLimit(
      selectedCategoryForLimit.name,
      parsed
    );
    setLimitModalOpen(false);
    message.success(`Tetto per ${selectedCategoryForLimit.name} salvato!`);
  };

  const handleCreateAmortization = () => {
    const totalNum = parseAmount(amortTotal);
    if (!amortTitle.trim() || !totalNum || totalNum <= 0) {
      message.error("Inserisci una causale e un importo totale valido.");
      return;
    }
    const numInst = Number(amortInstallments) || 1;
    addAmortization({
      title: amortTitle.trim(),
      totalAmount: totalNum,
      installments: Math.max(1, numInst),
      paidInstallments: 0,
      startMonth: amortStartMonth,
      category: amortCategory
    });
    setAmortTitle('');
    setAmortTotal('');
    setAmortInstallments(4);
    setAmortModalOpen(false);
  };

  // Calcolo totale rate mensili attive di ammortamento
  const totalMonthlyAmortizationImpact = (amortizations || []).reduce((acc, curr) => {
    if (curr.paidInstallments < curr.installments) {
      const monthlyRate = curr.totalAmount / curr.installments;
      return acc + monthlyRate;
    }
    return acc;
  }, 0);

  const handleExportExcel = () => {
    try {
      const filename = exportMonthlyReportExcel({
        monthLabel,
        currentDate,
        userName: user?.name || 'Utente FLOW',
        monthlyTransactions,
        monthlyMetrics,
        savingTargetPercent,
        savingsGoals
      });
      message.success(`Resoconto Excel scaricato! (${filename})`);
    } catch (err) {
      console.error(err);
      message.error("Errore esportazione Excel.");
    }
  };

  const handleExportPdf = () => {
    try {
      exportMonthlyReportPdf({
        currentMonth: currentDate,
        monthlyTransactions,
        totals: {
          income: monthlyMetrics.income,
          expense: monthlyMetrics.expense,
          netSavings: monthlyMetrics.netSavings
        },
        categories: Object.entries(categoryMetaMap || {}).map(([name, meta]) => ({
          name,
          ...meta
        })),
        savingsGoals,
        fixedExpenses: recurringList || [],
        dailyBudget: monthlyMetrics.dailySpendable,
        userName: user?.name || 'Utente FLOW'
      });
      message.success(`Report PDF di ${monthLabel} scaricato con successo!`);
    } catch (err) {
      console.error(err);
      message.error("Errore durante la creazione del report PDF.");
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* 1. SEZIONE: AMMORTAMENTI SPESA (FINANZIARIA PERSONALE A TE STESSO) */}
      <div className="apple-card rounded-3xl p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#1D1D1F] dark:text-white block">
                  Ammortamenti Spesa (Finanziaria Personale)
                </span>
                {totalMonthlyAmortizationImpact > 0 && (
                  <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800/40">
                    Quota mese: {formatCurrency(totalMonthlyAmortizationImpact)}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#86868B] dark:text-gray-400">
                Spalma le spese straordinarie su più mesi senza intaccare il budget di un solo mese.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAmortModalOpen(true)}
            className="px-3.5 py-1.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs flex items-center shadow-sm transition cursor-pointer self-start sm:self-auto"
          >
            <span>Diluisci Spesa</span>
          </button>
        </div>

        {(!amortizations || amortizations.length === 0) ? (
          <div className="py-8 px-4 text-center space-y-1.5 bg-gray-50/70 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
            <p className="text-xs font-semibold text-[#1D1D1F] dark:text-white">
              Nessun ammortamento attivo
            </p>
            <p className="text-[11px] text-[#86868B] dark:text-gray-400 max-w-sm mx-auto">
              Hai fatto un acquisto importante (smartphone, assicurazione annuale o tagliando)? 
              Tocca <strong>"+ Diluisci Spesa"</strong> per rateizzarlo virtualmente a te stesso.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {amortizations.map((item) => {
              const monthlyRate = item.totalAmount / item.installments;
              const isCompleted = item.paidInstallments >= item.installments;
              const progressPct = Math.round((item.paidInstallments / item.installments) * 100);
              const remainingAmount = Math.max(0, item.totalAmount - (monthlyRate * item.paidInstallments));

              return (
                <div 
                  key={item.id}
                  className="p-4 rounded-2xl bg-gray-50/90 dark:bg-white/5 border border-gray-100 dark:border-white/10 space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-xs text-[#1D1D1F] dark:text-white block leading-tight">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-[#86868B] dark:text-gray-400 block mt-0.5">
                        Totale: <strong>{formatCurrency(item.totalAmount)}</strong> • Partenza: {item.startMonth}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 block">
                        {formatCurrency(monthlyRate)} / mese
                      </span>
                      <span className="text-[9px] text-[#86868B] block">
                        {isCompleted ? 'Completato ✓' : `Residuo: ${formatCurrency(remainingAmount)}`}
                      </span>
                    </div>
                  </div>

                  {/* Barra di avanzamento rate */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-[#86868B] dark:text-gray-400 font-semibold">
                      <span>Rata {item.paidInstallments} di {item.installments} pagate</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="w-full bg-gray-200/80 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-[#32B87A]' : 'bg-indigo-600'}`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Controlli Rata (+1 rata, -1 rata, Elimina) */}
                  <div className="flex items-center justify-between pt-1 border-t border-gray-200/50 dark:border-white/10">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateAmortizationProgress(item.id, 1)}
                        disabled={isCompleted}
                        className="px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] transition cursor-pointer disabled:opacity-40"
                      >
                        Salda 1 Rata
                      </button>

                      {item.paidInstallments > 0 && (
                        <button
                          type="button"
                          onClick={() => updateAmortizationProgress(item.id, -1)}
                          className="px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/10 text-[#86868B] font-bold text-[10px] transition cursor-pointer"
                        >
                          - 1 Rata
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteAmortization(item.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition cursor-pointer"
                      title="Elimina ammortamento"
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

      {/* 3. FISSI MENSILI E RICORRENZE ATTIVE */}
      <div 
        className="apple-card rounded-3xl p-5 sm:p-6 space-y-3 transition-colors shadow-xs"
        style={{ backgroundColor: !isDark && palette?.categoriesCardBg ? palette.categoriesCardBg : undefined }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Repeat className="w-4 h-4 text-[#007AFF] dark:text-sky-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F] dark:text-gray-200">
              Fissi Mensili ({recurringList?.length || 0})
            </span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => handleOpenNewFixedModal('expense')}
              className="px-3.5 py-1.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs flex items-center shadow-sm transition cursor-pointer"
            >
              <span>Aggiungi Fisso</span>
            </button>

            {recurringList && recurringList.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  downloadAllRecurringIcs(recurringList);
                  message.success(`Tutte le ${recurringList.length} scadenze fisse esportate nel calendario (.ics)!`);
                }}
                className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-[#007AFF] dark:text-sky-300 font-bold text-[11px] flex items-center gap-1.5 transition border border-blue-100 dark:border-blue-800/40 cursor-pointer"
                title="Scarica un unico file .ics per Apple Calendar / Google con ripetizione mensile"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>Esporta .ics</span>
              </button>
            )}
          </div>
        </div>

        {(!recurringList || recurringList.length === 0) ? (
          <div className="py-6 px-4 text-center space-y-1.5 bg-gray-50/60 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
            <p className="text-xs font-semibold text-[#1D1D1F] dark:text-white">
              Nessun fisso impostato
            </p>
            <p className="text-[11px] text-[#86868B] dark:text-gray-400 max-w-sm mx-auto">
              Usa il pulsante in alto per aggiungere affitti, mutui, abbonamenti o stipendi.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recurringList.map(rec => {
              const isCatFixed = Boolean(rec.is_category_fixed);
              const calendarMenuItems = [
                {
                  key: 'ics',
                  label: (
                    <div className="flex items-center gap-2 py-1">
                      <span className="text-base">📲</span>
                      <div>
                        <span className="font-bold text-xs text-[#1D1D1F] block">Calendario Telefono (.ics)</span>
                        <span className="text-[10px] text-[#86868B] block">Apple Calendar (iPhone/Mac), Android</span>
                      </div>
                    </div>
                  ),
                  onClick: () => {
                    downloadIcsReminder(rec);
                    message.success(`Promemoria .ics scaricato per il giorno ${rec.recurring_day || 1}!`);
                  }
                },
                {
                  key: 'google',
                  label: (
                    <div className="flex items-center gap-2 py-1">
                      <span className="text-base">🗓️</span>
                      <div>
                        <span className="font-bold text-xs text-[#1D1D1F] block">Google Calendar</span>
                        <span className="text-[10px] text-[#86868B] block">Apre evento ricorrente su Google</span>
                      </div>
                    </div>
                  ),
                  onClick: () => {
                    openGoogleCalendarReminder(rec);
                    message.info("Apertura Google Calendar...");
                  }
                }
              ];

              return (
                <div
                  key={rec.id}
                  className="bg-gray-50/80 dark:bg-white/5 border border-gray-100 dark:border-white/10 p-3 rounded-2xl flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${rec.type === 'income' ? 'bg-[#32B87A]' : 'bg-[#F25449]'}`} />
                    <div className="truncate">
                      <div className="flex items-center gap-1.5 flex-wrap truncate">
                        <span className="font-bold text-[#1D1D1F] dark:text-white truncate">{rec.category}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md font-bold bg-blue-50 text-[#007AFF] dark:bg-blue-950/40 dark:text-sky-300">
                          Giorno {rec.recurring_day || 1}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#86868B] dark:text-gray-400 block truncate">
                        {rec.note || (rec.type === 'income' ? 'Entrata fissa' : 'Uscita fissa')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`font-extrabold ${rec.type === 'income' ? 'text-[#32B87A]' : 'text-[#1D1D1F] dark:text-white'}`}>
                      <PrivacyAmount amount={rec.amount} prefix={rec.type === 'income' ? '+' : '-'} />
                    </span>

                    <Dropdown menu={{ items: calendarMenuItems }} trigger={['click']} placement="bottomRight">
                      <button
                        type="button"
                        className="p-1 rounded-lg bg-white dark:bg-[#3A3A3C] border border-gray-200/60 dark:border-white/10 text-[#007AFF] dark:text-sky-300 shadow-2xs hover:bg-blue-50 cursor-pointer"
                        title="Promemoria calendario"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                      </button>
                    </Dropdown>

                    {isCatFixed && (
                      <button
                        type="button"
                        onClick={() => handleEditFixedCategory(categoryMetaMap[rec.category] || rec)}
                        className="text-[11px] text-[#007AFF] hover:underline px-1.5 py-0.5 cursor-pointer font-bold"
                      >
                        Modifica
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. TETTO STABILITO (CON ICONA SEMAFORO & TASTO +) */}
      <div 
        className="apple-card rounded-3xl p-6 space-y-4 shadow-xs"
        style={{ backgroundColor: !isDark && palette?.categoriesCardBg ? palette.categoriesCardBg : undefined }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base select-none">🚦</span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F] dark:text-gray-200 block leading-tight">
                Tetto Stabilito
              </span>
              <span className="text-[11px] text-[#86868B] dark:text-gray-400">
                Budget mensile per categoria con allerta a semaforo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-bold text-[#1D1D1F] dark:text-white mr-1 hidden sm:inline">
              Uscite Totali: {formatCurrency(expense)}
            </span>

            {/* Pulsante + Imposta Tetto / Nuova Categoria */}
            <button
              type="button"
              onClick={handleOpenNewBudgetModal}
              className="px-3.5 py-1.5 rounded-2xl bg-[#007AFF] hover:bg-blue-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              title="Aggiungi o imposta un tetto a una categoria"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Imposta Tetto</span>
            </button>
          </div>
        </div>

        {(() => {
          // Recupera tutte le categorie con un limite impostato o che hanno speso nel mese
          const allExpenseCats = categories?.expense || [];
          
          // Mappa di tutte le categorie rilevanti per Tetto Stabilito
          const budgetedItems = allExpenseCats
            .map(c => {
              const spent = monthlyTransactions
                .filter(t => t.type === 'expense' && t.category?.toLowerCase() === c.name.toLowerCase())
                .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
              const limit = c.monthly_limit ? Number(c.monthly_limit) : null;
              return {
                ...c,
                spent,
                limit
              };
            })
            // Mostra in cima le categorie con tetto attivo, poi quelle con spesa
            .filter(item => (item.limit !== null && item.limit > 0) || item.spent > 0)
            .sort((a, b) => {
              if (a.limit && !b.limit) return -1;
              if (!a.limit && b.limit) return 1;
              return b.spent - a.spent;
            });

          if (budgetedItems.length === 0) {
            return (
              <div className="py-8 px-4 text-center space-y-1.5 bg-gray-50/60 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                <p className="text-xs font-semibold text-[#1D1D1F] dark:text-white">
                  Nessun tetto spesa impostato
                </p>
                <p className="text-[11px] text-[#86868B] dark:text-gray-400">
                  Tocca <strong>"+ Imposta Tetto"</strong> per associare un budget massimo a una categoria (es. 150 € per Ristoranti).
                </p>
              </div>
            );
          }

          return (
            <div className="space-y-3 pt-1">
              {budgetedItems.map((item) => {
                const limit = item.limit;
                const ratio = limit ? Math.round((item.spent / limit) * 100) : null;
                const isOver = ratio !== null && ratio >= 100;
                const overAmount = isOver ? item.spent - limit : 0;

                // Colori dinamici a semaforo
                let trafficBg = 'bg-[#32B87A]';
                let trafficText = 'text-[#32B87A]';
                let badgeBg = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40';

                if (ratio !== null) {
                  if (ratio >= 100) {
                    trafficBg = 'bg-[#F25449]';
                    trafficText = 'text-[#F25449]';
                    badgeBg = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40';
                  } else if (ratio >= 75) {
                    trafficBg = 'bg-[#F59E0B]';
                    trafficText = 'text-[#F59E0B]';
                    badgeBg = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40';
                  }
                }

                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleOpenLimitModal(item)}
                    className="w-full text-left p-3.5 sm:p-4 rounded-2xl bg-neutral-50/80 dark:bg-white/5 hover:bg-neutral-100/80 dark:hover:bg-white/10 transition space-y-2.5 cursor-pointer border border-neutral-200/60 dark:border-neutral-700/80 shadow-2xs"
                    title="Tocca per modificare o rimuovere il tetto"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${item.color || '#007AFF'}15` }}
                        >
                          <CategoryIcon name={item.icon || 'Tag'} className="w-4 h-4" color={item.color || '#007AFF'} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#1D1D1F] dark:text-white leading-tight">
                              {item.name}
                            </span>
                            {ratio !== null && (
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${badgeBg}`}>
                                {ratio}%
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#86868B] dark:text-gray-400 block mt-0.5">
                            {limit ? (
                              <>
                                <strong>{formatCurrency(item.spent)}</strong> di {formatCurrency(limit)} max
                              </>
                            ) : (
                              <>Speso: <strong>{formatCurrency(item.spent)}</strong> • Nessun tetto</>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        {isOver ? (
                          <div className="text-right">
                            <span className="text-xs font-black text-[#F25449] block">
                              +{formatCurrency(overAmount)}
                            </span>
                            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block">
                              oltre il tetto
                            </span>
                          </div>
                        ) : limit ? (
                          <div className="text-right">
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block">
                              {formatCurrency(Math.max(0, limit - item.spent))}
                            </span>
                            <span className="text-[10px] text-[#86868B] dark:text-gray-400 font-medium block">
                              rimanenti
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-semibold text-[#007AFF] hover:underline block">
                            + Imposta tetto
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Barra di Caricamento Dinamica Fluida */}
                    <div className="w-full bg-neutral-200/80 dark:bg-neutral-700/60 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${limit ? trafficBg : 'bg-neutral-400'}`}
                        style={{ width: `${Math.min(100, ratio !== null ? ratio : (item.spent > 0 ? 100 : 0))}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* 4. SIMULATORE SPESA / IMPATTO ACQUISTO */}
      <div className="apple-card rounded-3xl p-5 sm:p-6 space-y-3.5 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-bold text-[#1D1D1F] dark:text-white block">
              Simulatore Spesa & Impatto Budget
            </span>
            <p className="text-xs text-[#86868B] dark:text-gray-400">
              Calcola prima di spendere come cambia la tua bussola giornaliera ({remainingDays} gg rimasti).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <div>
            <label className="text-[11px] font-semibold text-[#86868B] dark:text-gray-400 block mb-1">Importo ipotetico (€)</label>
            <input
              type="number"
              value={simulatedAmount}
              onChange={(e) => setSimulatedAmount(e.target.value)}
              placeholder="80"
              className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 border border-neutral-200 dark:border-neutral-700 rounded-2xl px-3 py-2 text-xs outline-none font-bold"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-[#86868B] dark:text-gray-400 block mb-1">Categoria Spesa</label>
            <select
              value={simulatedCategory}
              onChange={(e) => setSimulatedCategory(e.target.value)}
              className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-2xl px-3 py-2 text-xs outline-none"
            >
              {Object.keys(categoryMetaMap || {}).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30 text-xs leading-relaxed text-[#1D1D1F] dark:text-gray-200">
          Se spendi <strong className="font-extrabold text-[#1D1D1F] dark:text-white">{formatCurrency(numSimulated)}</strong> ora, la bussola spendibile giornaliera passa da{' '}
          <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(currentDailySpendable)}/g</strong> a{' '}
          <strong className={`font-bold ${newDailySpendable > 0 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}`}>
            {formatCurrency(newDailySpendable)}/g
          </strong>.
        </div>

        <button
          type="button"
          onClick={handleApplySimulatedExpense}
          className="w-full py-2.5 rounded-2xl bg-[#007AFF] hover:bg-blue-600 active:scale-98 text-white font-bold text-xs shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>Conferma e Registra come Spesa Reale ({formatCurrency(numSimulated)})</span>
        </button>
      </div>

      {/* 5. Riepilogo Salute Finanziaria */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-5 shadow-xs border border-slate-100 dark:border-[#2C2C2E] space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
          Salute Finanziaria
        </span>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#F5F5F7] dark:bg-[#2C2C2E]/60 p-3 rounded-2xl border border-transparent dark:border-[#38383A]">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Tasso di Risparmio</span>
            <span className={`text-lg font-bold ${savingsRate >= 20 ? 'text-[#34C759] dark:text-[#30D158]' : 'text-amber-500'}`}>
              {savingsRate.toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
              {savingsRate >= 30 ? 'Ottimo livello' : savingsRate >= 15 ? 'Buon livello' : 'Margine migliorabile'}
            </span>
          </div>

          <div className="bg-[#F5F5F7] dark:bg-[#2C2C2E]/60 p-3 rounded-2xl border border-transparent dark:border-[#38383A]">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Residuo Mese</span>
            <span className={`text-lg font-bold ${netSavings >= 0 ? 'text-slate-900 dark:text-white' : 'text-[#FF3B30] dark:text-[#FF453A]'}`}>
              {formatCurrency(netSavings)}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
              {netSavings >= 0 ? 'In attivo' : 'In disavanzo'}
            </span>
          </div>
        </div>
      </div>

      {/* Modale Modifica Tetto Spesa Categoria */}
      <Modal
        title={selectedCategoryForLimit ? `Tetto Spesa: ${selectedCategoryForLimit.name}` : "Tetto Categoria"}
        open={limitModalOpen}
        onCancel={() => setLimitModalOpen(false)}
        onOk={handleSaveCategoryLimit}
        okText="Salva Tetto"
        cancelText="Annulla"
        centered
      >
        <div className="space-y-3 pt-2">
          <p className="text-xs text-[#86868B] dark:text-gray-400">
            Imposta un importo massimo di spesa mensile per <strong>{selectedCategoryForLimit?.name}</strong>. Il Semaforo ti avviserà se ti avvicini o superi la soglia (imposta a 0 per rimuovere il tetto).
          </p>
          <div>
            <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
              Importo Massimo Mensile (€)
            </label>
            <input
              type="number"
              value={tempLimitValue}
              onChange={(e) => setTempLimitValue(e.target.value)}
              placeholder="es. 150 (0 per rimuovere)"
              className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm font-bold outline-none"
            />
          </div>
        </div>
      </Modal>

      {/* Modale Unificato: Imposta Tetto / Crea Nuova Categoria al Volo */}
      <Modal
        title="Imposta Tetto o Crea Categoria"
        open={newBudgetModalOpen}
        onCancel={() => setNewBudgetModalOpen(false)}
        onOk={handleSaveUnifiedBudget}
        okText="Salva Tetto"
        cancelText="Annulla"
        centered
      >
        <div className="space-y-4 pt-2">
          {/* Segmented Control iOS: Esistente vs Nuova */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-2xl border border-neutral-200/60 dark:border-neutral-700">
            <button
              type="button"
              onClick={() => setBudgetTab('existing')}
              className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                budgetTab === 'existing'
                  ? 'bg-white dark:bg-neutral-700 text-[#1D1D1F] dark:text-white shadow-2xs'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              Categoria Esistente
            </button>
            <button
              type="button"
              onClick={() => setBudgetTab('new')}
              className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                budgetTab === 'new'
                  ? 'bg-white dark:bg-neutral-700 text-[#1D1D1F] dark:text-white shadow-2xs'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              + Nuova Categoria
            </button>
          </div>

          {budgetTab === 'existing' ? (
            <div>
              <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block mb-2">
                Scegli Categoria
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto no-scrollbar p-0.5">
                {(categories?.expense || []).map((cat) => {
                  const isSel = selectedCatNameForBudget === cat.name;
                  return (
                    <button
                      key={cat.id || cat.name}
                      type="button"
                      onClick={() => setSelectedCatNameForBudget(cat.name)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer border flex items-center gap-1.5 ${
                        isSel
                          ? 'bg-[#007AFF] text-white border-transparent shadow-xs'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700'
                      }`}
                    >
                      <CategoryIcon name={cat.icon || 'Tag'} className="w-3.5 h-3.5" color={isSel ? '#ffffff' : (cat.color || '#007AFF')} />
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
                  Nome Nuova Categoria
                </label>
                <input
                  type="text"
                  value={newCatNameForBudget}
                  onChange={(e) => {
                    e.stopPropagation();
                    setNewCatNameForBudget(e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="es. Ristoranti & Cene, Shopping, Hobby..."
                  className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
                  Tipo di Movimento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewCatTypeForBudget('expense');
                      setNewCatIconForBudget('ShoppingCart');
                    }}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      newCatTypeForBudget === 'expense'
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-[#FF3B30] border-rose-200 dark:border-rose-800/40'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border-transparent'
                    }`}
                  >
                    🔴 Uscita (Spesa)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewCatTypeForBudget('income');
                      setNewCatIconForBudget('Briefcase');
                    }}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      newCatTypeForBudget === 'income'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#32B87A] border-emerald-200 dark:border-emerald-800/40'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border-transparent'
                    }`}
                  >
                    🟢 Entrata
                  </button>
                </div>
              </div>

              {/* Selettore Icona Apple per la Nuova Categoria */}
              <div>
                <IconPicker
                  selectedIcon={newCatIconForBudget}
                  onSelectIcon={setNewCatIconForBudget}
                  color={newCatTypeForBudget === 'income' ? '#32B87A' : '#007AFF'}
                />
              </div>
            </div>
          )}

          {/* Importo Massimo Mensile */}
          <div>
            <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
              Importo Massimo Mensile (€)
            </label>
            <input
              type="number"
              step="1"
              value={budgetAmountInput}
              onChange={(e) => setBudgetAmountInput(e.target.value)}
              placeholder="es. 150"
              className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm font-bold outline-none"
            />
          </div>
        </div>
      </Modal>

      {/* Modale Nuovo Ammortamento (Finanziaria Personale) */}
      <Modal
        title="Nuovo Ammortamento (Finanziaria a Te Stesso)"
        open={amortModalOpen}
        onCancel={() => setAmortModalOpen(false)}
        onOk={handleCreateAmortization}
        okText="Attiva Ammortamento"
        cancelText="Annulla"
        centered
      >
        <div className="space-y-3.5 pt-2">
          <p className="text-xs text-[#86868B] dark:text-gray-400 leading-relaxed">
            Registra una spesa rilevante e dividila in quote mensili teoriche per monitorarne l'impatto sul tuo flusso di cassa.
          </p>

          <div>
            <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
              Titolo della spesa
            </label>
            <input
              type="text"
              value={amortTitle}
              onChange={(e) => setAmortTitle(e.target.value)}
              placeholder="es. iPhone 16 Pro, Assicurazione Auto, Dentista..."
              className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-bold outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
                Importo Totale (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={amortTotal}
                onChange={(e) => setAmortTotal(e.target.value)}
                placeholder="es. 900"
                className="w-full bg-neutral-100 dark:bg-neutral-800 text-[#FF3B30] dark:text-[#FF453A] placeholder-neutral-400 dark:placeholder-neutral-500 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm font-bold outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
                Numero di rate / mesi
              </label>
              <select
                value={amortInstallments}
                onChange={(e) => setAmortInstallments(Number(e.target.value))}
                className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-bold outline-none"
              >
                {[2, 3, 4, 5, 6, 8, 10, 12, 18, 24].map((n) => (
                  <option key={n} value={n}>
                    {n} mesi ({amortTotal ? formatCurrency(Number(amortTotal) / n) + '/mese' : `${n} rate`})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
              Mese di inizio ammortamento
            </label>
            <input
              type="month"
              value={amortStartMonth}
              onChange={(e) => setAmortStartMonth(e.target.value)}
              className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
            />
          </div>

          {amortTotal && Number(amortTotal) > 0 && (
            <div className="p-3 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-xs text-indigo-950 dark:text-indigo-200 font-bold">
              <span>Quota mensile virtuale:</span>
              <span className="text-sm text-indigo-700 dark:text-indigo-300">
                {formatCurrency(Number(amortTotal) / (Number(amortInstallments) || 1))} / mese
              </span>
            </div>
          )}
        </div>
      </Modal>

      {/* Modale Creazione / Modifica Categoria Fissa (Fissi Mensili) */}
      <Modal
        title={editingCategoryName ? `Modifica Fisso: ${editingCategoryName}` : "Nuovo Fisso Mensile"}
        open={fixedModalOpen}
        onCancel={() => setFixedModalOpen(false)}
        onOk={handleSaveFixedCategory}
        okText="Salva Fisso"
        cancelText="Annulla"
        centered
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
              Tipo di ricorrenza
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setFixedCatType('expense');
                  if (!editingCategoryName) {
                    setFixedCatColor('#007AFF');
                    setFixedCatIcon('Home');
                  }
                }}
                className={`py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  fixedCatType === 'expense'
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-[#FF3B30] border-rose-200 dark:border-rose-900/40'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border-transparent'
                }`}
              >
                Uscita Fissa
              </button>
              <button
                type="button"
                onClick={() => {
                  setFixedCatType('income');
                  if (!editingCategoryName) {
                    setFixedCatColor('#32B87A');
                    setFixedCatIcon('Briefcase');
                  }
                }}
                className={`py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  fixedCatType === 'income'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#32B87A] border-emerald-200 dark:border-emerald-900/40'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border-transparent'
                }`}
              >
                Entrata Fissa
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
              Nome categoria / spesa fissa
            </label>
            <input
              type="text"
              value={fixedCatName}
              onChange={(e) => setFixedCatName(e.target.value)}
              placeholder="es. Affitto, Stipendio, Netflix, Mutuo..."
              className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-bold outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
                Importo fisso (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={fixedCatAmount}
                onChange={(e) => setFixedCatAmount(e.target.value)}
                placeholder="es. 650"
                className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-bold outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
                Giorno del mese (1-31)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={fixedCatDay}
                onChange={(e) => setFixedCatDay(Math.min(31, Math.max(1, Number(e.target.value))))}
                placeholder="1"
                className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-bold outline-none"
              />
            </div>
          </div>

          {/* Selezione Icona */}
          <div>
            <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
              Icona
            </label>
            <IconPicker
              selectedIcon={fixedCatIcon}
              onSelect={setFixedCatIcon}
              currentColor={fixedCatColor}
            />
          </div>

          {/* Scelta colore */}
          <div>
            <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
              Colore distintivo
            </label>
            <div className="flex gap-2 flex-wrap">
              {['#007AFF', '#32B87A', '#F25449', '#FF9500', '#AF52DE', '#5856D6', '#FF2D55', '#30B0C7', '#64748B'].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFixedCatColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition cursor-pointer ${
                    fixedCatColor === c ? 'border-neutral-900 dark:border-white scale-110 shadow-sm' : 'border-transparent'
                  }`}
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
