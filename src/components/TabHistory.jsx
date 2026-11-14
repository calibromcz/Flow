import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, CategoryIcon, PrivacyAmount } from './CategoryIcon';
import { exportMonthlyReportExcel } from '../utils/exportExcel';
import { exportMonthlyReportPdf } from '../utils/exportPdf';
import { downloadIcsReminder, openGoogleCalendarReminder } from '../utils/calendarReminder';
import { 
  Search, 
  Download, 
  Trash2, 
  FileSpreadsheet, 
  FileText, 
  Repeat, 
  CalendarPlus, 
  BellRing,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  PiggyBank
} from 'lucide-react';
import { Modal, message, Dropdown } from 'antd';

export const TabHistory = () => {
  const { user } = useAuth();
  const { 
    transactions, 
    monthlyTransactions, 
    monthlyMetrics, 
    categoryMetaMap, 
    monthLabel, 
    currentDate, 
    prevMonth,
    nextMonth,
    savingTargetPercent, 
    savingsGoals, 
    deleteTransaction,
    toggleRecurring 
  } = useFinance();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const uniqueCategories = useMemo(() => {
    const set = new Set();
    transactions.forEach(t => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchNote = t.note?.toLowerCase().includes(query);
        const matchCategory = t.category?.toLowerCase().includes(query);
        const matchAmount = String(t.amount).includes(query);
        if (!matchNote && !matchCategory && !matchAmount) return false;
      }
      return true;
    });
  }, [transactions, typeFilter, categoryFilter, search]);

  const handleExportExcel = () => {
    try {
      const filename = exportMonthlyReportExcel({
        monthLabel,
        currentDate,
        userName: user?.name || 'Utente FLOW',
        monthlyTransactions: monthlyTransactions.length > 0 ? monthlyTransactions : transactions,
        monthlyMetrics,
        savingTargetPercent,
        savingsGoals
      });
      message.success(`Resoconto Excel di ${monthLabel} scaricato! (${filename})`);
    } catch (err) {
      console.error("Errore esportazione Excel:", err);
      message.error("Errore durante la creazione del file Excel.");
    }
  };

  const handleExportPdf = () => {
    try {
      exportMonthlyReportPdf({
        currentMonth: currentDate,
        monthlyTransactions: monthlyTransactions.length > 0 ? monthlyTransactions : transactions,
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
        fixedExpenses: monthlyMetrics.recurringList || [],
        dailyBudget: monthlyMetrics.dailySpendable,
        userName: user?.name || 'Utente FLOW'
      });
      message.success(`Report PDF di ${monthLabel} scaricato con successo!`);
    } catch (err) {
      console.error("Errore esportazione PDF:", err);
      message.error("Errore durante la creazione del report PDF.");
    }
  };

  const exportCSV = () => {
    if (filteredTransactions.length === 0) {
      message.warning("Nessun movimento da esportare.");
      return;
    }

    const headers = ['Data', 'Tipo', 'Categoria', 'Importo (€)', 'Nota', 'Ricorrente'];
    const rows = filteredTransactions.map(t => [
      t.date,
      t.type === 'income' ? 'Entrata' : 'Uscita',
      `"${t.category}"`,
      Number(t.amount).toFixed(2),
      `"${(t.note || '').replace(/"/g, '""')}"`,
      t.is_recurring ? 'Sì' : 'No'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `flow_movimenti_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success("CSV scaricato!");
  };

  const handleDelete = (id, note, category) => {
    Modal.confirm({
      title: "Eliminare questo movimento?",
      content: note ? `Vuoi davvero eliminare "${note}"?` : `Vuoi eliminare il movimento "${category}"?`,
      okText: "Elimina",
      okType: "danger",
      cancelText: "Annulla",
      centered: true,
      onOk: async () => {
        await deleteTransaction(id);
        message.success("Movimento rimosso.");
      }
    });
  };

  return (
    <div className="space-y-4 pb-20">
      {/* 1. PANORAMICA MENSILE & SELETTORE MESE */}
      <div className="apple-card p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#1D1D1F] dark:text-white tracking-tight">Panoramica Mensile</h2>
          <p className="text-xs text-[#86868B] dark:text-gray-400">Riepilogo entrate, uscite e bussola di spesa</p>
        </div>

        {/* Selettore Mese */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-gray-100/80 dark:bg-black/30 border border-gray-200/60 dark:border-white/10 p-1 rounded-2xl">
          <button
            type="button"
            onClick={prevMonth}
            className="w-7 h-7 rounded-xl bg-white dark:bg-[#3A3A3C] shadow-xs flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#48484A] active:scale-95 transition cursor-pointer"
            title="Mese precedente"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-[#1D1D1F] dark:text-white min-w-[125px] text-center px-1">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="w-7 h-7 rounded-xl bg-white dark:bg-[#3A3A3C] shadow-xs flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#48484A] active:scale-95 transition cursor-pointer"
            title="Mese successivo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sintesi Rapida Mese (Entrate, Uscite, Saldo) */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="apple-card rounded-2xl p-3 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] dark:text-gray-400 block">
            Entrate
          </span>
          <span className="text-sm sm:text-base font-extrabold text-[#34C759]">
            <PrivacyAmount amount={monthlyMetrics?.income || 0} prefix="+" />
          </span>
        </div>
        <div className="apple-card rounded-2xl p-3 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] dark:text-gray-400 block">
            Uscite
          </span>
          <span className="text-sm sm:text-base font-extrabold text-[#F25449]">
            <PrivacyAmount amount={monthlyMetrics?.expense || 0} prefix="-" />
          </span>
        </div>
        <div className="apple-card rounded-2xl p-3 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] dark:text-gray-400 block">
            Cashflow
          </span>
          <span className={`text-sm sm:text-base font-extrabold ${(monthlyMetrics?.netSavings || 0) >= 0 ? 'text-[#007AFF] dark:text-sky-400' : 'text-[#FF3B30]'}`}>
            <PrivacyAmount amount={monthlyMetrics?.netSavings || 0} prefix={(monthlyMetrics?.netSavings || 0) >= 0 ? '+' : ''} />
          </span>
        </div>
      </div>

      {/* 2. Barra di Ricerca iOS Style & Filtri */}
      <div className="space-y-3">
        <div className="apple-card rounded-2xl p-2.5 flex items-center gap-2 shadow-xs">
          <Search className="w-4 h-4 text-[#86868B] ml-1" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca nota, importo o categoria..."
            className="w-full bg-transparent text-xs font-medium text-[#1D1D1F] dark:text-white placeholder:text-[#86868B] outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-xs text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white px-1"
            >
              Cancella
            </button>
          )}
        </div>

        {/* Filtri iOS Segmented */}
        <div className="flex gap-2 items-center overflow-x-auto no-scrollbar pb-1">
          <div className="bg-[#E5E5EA]/80 dark:bg-[#2C2C2E] p-1 rounded-2xl flex items-center flex-shrink-0">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-xl transition ${typeFilter === 'all' ? 'bg-white dark:bg-[#1C1C1E] text-[#1D1D1F] dark:text-white shadow-2xs' : 'text-[#86868B] dark:text-gray-400'}`}
            >
              Tutti
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('expense')}
              className={`px-3 py-1 text-xs font-semibold rounded-xl transition ${typeFilter === 'expense' ? 'bg-white dark:bg-[#1C1C1E] text-[#FF3B30] shadow-2xs' : 'text-[#86868B] dark:text-gray-400'}`}
            >
              Uscite
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('income')}
              className={`px-3 py-1 text-xs font-semibold rounded-xl transition ${typeFilter === 'income' ? 'bg-white dark:bg-[#1C1C1E] text-[#34C759] shadow-2xs' : 'text-[#86868B] dark:text-gray-400'}`}
            >
              Entrate
            </button>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="apple-card rounded-2xl px-3 py-1.5 text-xs font-medium text-[#1D1D1F] dark:text-white outline-none flex-shrink-0"
          >
            <option value="all">Tutte le categorie</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista Movimenti Storico */}
      <div className="apple-card rounded-3xl p-6 shadow-xs">
        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#86868B] dark:text-gray-400">
            Nessun movimento trovato per questi criteri.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/10">
            {filteredTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              const meta = categoryMetaMap[tx.category] || { icon: 'Tag', color: isIncome ? '#34C759' : '#007AFF' };

              return (
                <div
                  key={tx.id}
                  className="py-3.5 flex items-center justify-between group hover:bg-gray-50/80 dark:hover:bg-white/5 rounded-2xl px-2 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${meta.color}15` }}
                    >
                      <CategoryIcon
                        name={meta.icon}
                        className="w-5 h-5"
                        color={meta.color}
                      />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#1D1D1F] dark:text-white flex items-center gap-1.5">
                        <span>{tx.category}</span>
                        {tx.is_recurring && (
                          <Dropdown
                            menu={{
                              items: [
                                {
                                  key: 'ics',
                                  label: '📲 Calendario Telefono (.ics)',
                                  onClick: () => {
                                    downloadIcsReminder(tx);
                                    message.success("Promemoria .ics scaricato!");
                                  }
                                },
                                {
                                  key: 'google',
                                  label: '🗓️ Google Calendar',
                                  onClick: () => {
                                    openGoogleCalendarReminder(tx);
                                  }
                                }
                              ]
                            }}
                            trigger={['click']}
                          >
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-[#007AFF] dark:bg-blue-950/40 dark:text-sky-300 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-800/40 cursor-pointer"
                              title="Aggiungi promemoria al Calendario"
                            >
                              <Repeat className="w-2.5 h-2.5" />
                              <span>Ricorrente</span>
                              <BellRing className="w-2.5 h-2.5 text-blue-500" />
                            </button>
                          </Dropdown>
                        )}
                      </div>
                      <div className="text-xs text-[#86868B] dark:text-gray-400 flex items-center gap-1.5">
                        <span>{formatDate(tx.date)}</span>
                        {tx.note && <span>• {tx.note}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <div
                        className={`text-sm font-bold ${
                          isIncome ? 'text-[#34C759]' : 'text-[#1D1D1F] dark:text-white'
                        }`}
                      >
                        {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(tx.id, tx.note, tx.category)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[#FF3B30] hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                      title="Elimina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Scheda Esportazione e Report Documenti (SECONDA CARD IN BASSO) */}
      <div className="apple-card rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[#1D1D1F] dark:text-white">Documenti & Report Ufficiali</h2>
          <p className="text-xs text-[#86868B] dark:text-gray-400">Esportazione certificata dei movimenti ({filteredTransactions.length}) in PDF, Excel e CSV</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportPdf}
            className="px-4 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white text-xs font-bold flex items-center gap-2 shadow-sm hover:shadow-md transition cursor-pointer"
            title="Scarica il resoconto mensile in PDF"
          >
            <FileText className="w-4 h-4 stroke-[2.5]" />
            <span>📄 Scarica PDF (.pdf)</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold flex items-center gap-2 shadow-sm hover:shadow-md transition cursor-pointer"
            title="Scarica il resoconto mensile in file Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 stroke-[2.5]" />
            <span>📊 Scarica Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={exportCSV}
            className="px-3.5 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-[#1D1D1F] dark:text-gray-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            title="Esporta CSV semplice"
          >
            <Download className="w-3.5 h-3.5 text-[#86868B]" />
            <span>CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
