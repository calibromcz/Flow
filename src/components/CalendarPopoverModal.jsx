import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, CategoryIcon, PrivacyAmount } from './CategoryIcon';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  X, 
  Plus, 
  Trash2, 
  CalendarPlus 
} from 'lucide-react';
import { exportToPhoneCalendar } from '../utils/calendarReminder';
import { message } from 'antd';

export const CalendarPopoverModal = ({ isOpen, onClose }) => {
  const { 
    currentDate, 
    monthLabel, 
    monthlyTransactions, 
    monthlyMetrics,
    categoryMetaMap,
    prevMonth,
    nextMonth
  } = useFinance();

  const [selectedDay, setSelectedDay] = useState(null);
  const [calendarNotes, setCalendarNotes] = useState({});
  const [newNoteText, setNewNoteText] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('09:00');
  const [newReminderAmount, setNewReminderAmount] = useState('');
  const [newReminderNote, setNewReminderNote] = useState('');
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);

  // Caricamento sicuro di flow_calendar_notes da localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('flow_calendar_notes');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setCalendarNotes(parsed);
        }
      }
    } catch (e) {
      console.warn("Impossibile leggere flow_calendar_notes da localStorage:", e);
    }
  }, []);

  const saveNotesToStorage = (updated) => {
    setCalendarNotes(updated);
    try {
      localStorage.setItem('flow_calendar_notes', JSON.stringify(updated));
    } catch (e) {
      console.warn("Errore salvataggio flow_calendar_notes:", e);
    }
  };

  const handleAddNote = (dateStr) => {
    const text = newNoteText.trim();
    if (!text) return;

    const list = Array.isArray(calendarNotes[dateStr]) ? [...calendarNotes[dateStr]] : [];
    const newNoteObj = {
      id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text,
      time: newReminderTime || '09:00',
      amount: newReminderAmount ? parseFloat(String(newReminderAmount).replace(',', '.')) : null,
      note: newReminderNote.trim(),
      createdAt: new Date().toISOString()
    };
    list.push(newNoteObj);

    const updated = {
      ...calendarNotes,
      [dateStr]: list
    };
    saveNotesToStorage(updated);
    setNewNoteText('');
    setNewReminderAmount('');
    setNewReminderNote('');
    setIsAdvancedModalOpen(false);
    message.success("Promemoria aggiunto!");
  };

  const handleDeleteNote = (dateStr, noteId) => {
    const list = Array.isArray(calendarNotes[dateStr]) ? calendarNotes[dateStr] : [];
    const filtered = list.filter(n => n.id !== noteId);
    const updated = { ...calendarNotes };
    if (filtered.length > 0) {
      updated[dateStr] = filtered;
    } else {
      delete updated[dateStr];
    }
    saveNotesToStorage(updated);
    message.info("Nota rimossa");
  };

  const handleExportNoteToPhone = (noteItem, dateStr) => {
    try {
      // Estrai eventuale cifra dalla nota se non già impostata
      let finalAmt = noteItem.amount;
      if (finalAmt === undefined || finalAmt === null) {
        const match = noteItem.text.match(/(\d+(?:[.,]\d{1,2})?)\s*€?/);
        finalAmt = match ? parseFloat(match[1].replace(',', '.')) : undefined;
      }

      exportToPhoneCalendar({
        title: noteItem.text,
        amount: finalAmt,
        dateStr,
        timeStr: noteItem.time || '09:00',
        isRecurringMonthly: false,
        note: noteItem.note || noteItem.text
      });
      message.success("File .ics generato! Toccalo per aggiungerlo al tuo Calendario del telefono.");
    } catch (err) {
      console.error(err);
      message.error("Errore esportazione calendario.");
    }
  };

  const handleExportFixedToPhone = (fixedItem) => {
    try {
      exportToPhoneCalendar({
        title: `Fisso: ${fixedItem.category}`,
        amount: fixedItem.amount,
        recurringDay: Number(fixedItem.recurring_day || 1),
        isRecurringMonthly: true,
        note: fixedItem.note || 'Spesa fissa mensile FLOW'
      });
      message.success("Promemoria ricorrente scaricato per il tuo Calendario!");
    } catch (err) {
      console.error(err);
      message.error("Errore esportazione promemoria.");
    }
  };

  if (!isOpen) return null;

  // Protezione ultra sicura per date e array
  const safeDate = currentDate instanceof Date && !isNaN(currentDate.getTime()) ? currentDate : new Date();
  const year = safeDate.getFullYear();
  const month = safeDate.getMonth(); // 0-indexed

  const safeMonthlyTx = Array.isArray(monthlyTransactions) ? monthlyTransactions : [];
  const safeRecurring = Array.isArray(monthlyMetrics?.recurringList) ? monthlyMetrics.recurringList : [];
  const safeMetaMap = categoryMetaMap || {};

  // Calcolo griglia giorni del mese 100% nativo
  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  // Primo giorno del mese
  const firstDayInstance = new Date(year, month, 1);
  let startDayOffset = firstDayInstance.getDay() - 1;
  if (startDayOffset === -1) startDayOffset = 6;

  // Numero totale giorni nel mese
  const totalDays = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < startDayOffset; i++) {
    calendarDays.push({ dayNumber: null, isCurrentMonth: false });
  }

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({
      dayNumber: d,
      dateStr,
      isCurrentMonth: true
    });
  }

  // Mappa statistiche giornaliere
  const dayStatsMap = {};
  safeMonthlyTx.forEach(tx => {
    if (!tx || !tx.date) return;
    const d = tx.date;
    if (!dayStatsMap[d]) {
      dayStatsMap[d] = {
        hasIncome: false,
        hasExpense: false,
        totalIncome: 0,
        totalExpense: 0,
        transactions: []
      };
    }
    const amt = Number(tx.amount || 0);
    if (tx.type === 'income') {
      dayStatsMap[d].hasIncome = true;
      dayStatsMap[d].totalIncome += amt;
    } else {
      dayStatsMap[d].hasExpense = true;
      dayStatsMap[d].totalExpense += amt;
    }
    dayStatsMap[d].transactions.push(tx);
  });

  // Mappa fissi previsti per giorno del mese
  const fixedByDayMap = {};
  safeRecurring.forEach(rec => {
    if (!rec) return;
    const day = Number(rec.recurring_day || 1);
    if (!fixedByDayMap[day]) fixedByDayMap[day] = [];
    fixedByDayMap[day].push(rec);
  });

  const today = new Date();
  const isCurrentActualMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDayNumber = today.getDate();

  // Dati giorno selezionato
  let selectedDayData = null;
  if (selectedDay) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    const stats = dayStatsMap[dateStr] || { hasIncome: false, hasExpense: false, totalIncome: 0, totalExpense: 0, transactions: [] };
    const fixedList = fixedByDayMap[selectedDay] || [];
    const notesList = Array.isArray(calendarNotes[dateStr]) ? calendarNotes[dateStr] : [];

    selectedDayData = {
      day: selectedDay,
      dateStr,
      stats,
      fixedList,
      notesList
    };
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm sm:max-w-md bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl rounded-3xl p-5 shadow-2xl border border-neutral-200/80 dark:border-white/10 space-y-3.5 transition-all text-[#1D1D1F] dark:text-white max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Popover */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#007AFF] dark:text-sky-400 flex items-center justify-center shrink-0">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F] dark:text-white block leading-tight">
                Calendario Movimenti
              </span>
              <span className="text-[11px] text-[#86868B] dark:text-gray-400">
                {monthLabel || `${year}-${month + 1}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Navigatore Mese */}
            <div className="flex items-center gap-1 bg-neutral-100/80 dark:bg-white/10 border border-neutral-200/60 dark:border-white/10 p-0.5 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setSelectedDay(null);
                  if (typeof prevMonth === 'function') prevMonth();
                }}
                className="w-6 h-6 rounded-lg bg-white dark:bg-[#3A3A3C] shadow-xs flex items-center justify-center text-neutral-700 dark:text-gray-200 hover:bg-neutral-50 active:scale-95 transition cursor-pointer"
                title="Mese precedente"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedDay(null);
                  if (typeof nextMonth === 'function') nextMonth();
                }}
                className="w-6 h-6 rounded-lg bg-white dark:bg-[#3A3A3C] shadow-xs flex items-center justify-center text-neutral-700 dark:text-gray-200 hover:bg-neutral-50 active:scale-95 transition cursor-pointer"
                title="Mese successivo"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Chiudi Popover */}
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/20 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              title="Chiudi calendario"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Griglia Giorni della Settimana (Lun - Dom) */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[#86868B] dark:text-gray-400 select-none pb-0.5">
          {daysOfWeek.map(d => (
            <div key={d} className="py-0.5">{d}</div>
          ))}
        </div>

        {/* Griglia Giorni del Mese */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {calendarDays.map((item, index) => {
            if (!item.isCurrentMonth) {
              return <div key={`empty-${index}`} className="h-9 sm:h-10" />;
            }

            const day = item.dayNumber;
            const isToday = isCurrentActualMonth && day === todayDayNumber;
            const isSelected = selectedDay === day;
            const stats = dayStatsMap[item.dateStr];
            const hasFixed = Boolean(fixedByDayMap[day] && fixedByDayMap[day].length > 0);
            const hasNotes = Boolean(calendarNotes[item.dateStr] && calendarNotes[item.dateStr].length > 0);

            return (
              <button
                key={item.dateStr}
                type="button"
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`h-9 sm:h-10 rounded-xl flex flex-col items-center justify-center transition cursor-pointer relative select-none ${
                  isSelected
                    ? 'bg-[#007AFF] text-white shadow-xs scale-105 z-10'
                    : isToday
                    ? 'bg-blue-50 dark:bg-sky-950/40 text-[#007AFF] dark:text-sky-300 font-black border border-blue-200 dark:border-sky-800/40'
                    : 'hover:bg-neutral-100 dark:hover:bg-white/10 text-[#1D1D1F] dark:text-gray-200'
                }`}
              >
                <span className={`text-xs font-semibold ${isSelected ? 'font-black text-white' : ''}`}>
                  {day}
                </span>

                {/* Pallini colorati indicatori: Verde (Entrata), Rosso (Uscita), Blu/Ambra (Fisso o Nota) */}
                <div className="flex items-center gap-0.5 mt-0.5 h-1.5">
                  {stats?.hasIncome && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-emerald-300' : 'bg-emerald-500'
                      }`}
                      title="Entrata registrata"
                    />
                  )}
                  {stats?.hasExpense && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-rose-200' : 'bg-rose-500'
                      }`}
                      title="Uscita registrata"
                    />
                  )}
                  {(hasFixed || hasNotes) && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-amber-300' : 'bg-amber-500'
                      }`}
                      title={hasNotes ? "Nota o scadenza programmata" : "Spesa fissa programmata"}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legenda Compatta */}
        <div className="pt-2 border-t border-neutral-100 dark:border-white/10 flex flex-wrap items-center justify-between text-[10px] text-[#86868B] dark:text-gray-400 gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Entrata
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Uscita
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Fissi / Note
            </span>
          </div>
          {selectedDay && (
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="text-[10px] font-semibold text-[#007AFF] hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>Deseleziona</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Dettaglio del Giorno Selezionato */}
        {selectedDayData && (
          <div className="p-3.5 rounded-2xl bg-neutral-50/90 dark:bg-white/5 border border-neutral-200/80 dark:border-white/10 animate-fade-in space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1D1D1F] dark:text-white">
                📅 {selectedDay} {monthLabel}
              </span>
              <div className="flex items-center gap-2 text-xs font-bold">
                {selectedDayData.stats.totalIncome > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(selectedDayData.stats.totalIncome)}
                  </span>
                )}
                {selectedDayData.stats.totalExpense > 0 && (
                  <span className="text-rose-600 dark:text-rose-400">
                    -{formatCurrency(selectedDayData.stats.totalExpense)}
                  </span>
                )}
              </div>
            </div>

            {/* Note / Scadenze personali di questo giorno */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                  Note & Scadenze Personali:
                </span>
                <span className="text-[10px] text-neutral-400">
                  {selectedDayData.notesList.length} note
                </span>
              </div>

              {/* Elenco note esistenti */}
              {selectedDayData.notesList.length > 0 && (
                <div className="space-y-1.5 max-h-32 overflow-y-auto no-scrollbar">
                  {selectedDayData.notesList.map((noteItem) => (
                    <div
                      key={noteItem.id}
                      className="p-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/40 text-xs flex items-center justify-between gap-2 text-amber-950 dark:text-amber-200"
                    >
                      <span className="font-semibold truncate leading-tight">
                        📝 {noteItem.text}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleExportNoteToPhone(noteItem, selectedDayData.dateStr)}
                          className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                          title="Aggiungi al Calendario Telefono (.ics)"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Aggiungi al Calendario Telefono</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(selectedDayData.dateStr, noteItem.id)}
                          className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-500 transition cursor-pointer"
                          title="Elimina nota"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Campo input rapido per aggiungere nuova nota */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddNote(selectedDayData.dateStr);
                }}
                className="space-y-2 pt-0.5"
              >
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Titolo promemoria (es. Rata Mutuo)..."
                    className="flex-1 bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 border border-neutral-200/80 dark:border-neutral-700 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                  />
                  <button
                    type="submit"
                    disabled={!newNoteText.trim()}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs shrink-0 flex items-center gap-1"
                    title="Salva promemoria"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Salva</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  <input
                    type="time"
                    value={newReminderTime}
                    onChange={(e) => setNewReminderTime(e.target.value)}
                    className="bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white border border-neutral-200/80 dark:border-neutral-700 rounded-xl px-2 py-1 text-[11px] outline-none"
                    title="Ora promemoria"
                  />
                  <input
                    type="text"
                    value={newReminderAmount}
                    onChange={(e) => setNewReminderAmount(e.target.value)}
                    placeholder="Importo € (opz.)"
                    className="bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 border border-neutral-200/80 dark:border-neutral-700 rounded-xl px-2 py-1 text-[11px] outline-none"
                  />
                  <input
                    type="text"
                    value={newReminderNote}
                    onChange={(e) => setNewReminderNote(e.target.value)}
                    placeholder="Nota (opz.)"
                    className="bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 border border-neutral-200/80 dark:border-neutral-700 rounded-xl px-2 py-1 text-[11px] outline-none"
                  />
                </div>
              </form>
            </div>

            {/* Fissi Previsti in questa data */}
            {selectedDayData.fixedList.length > 0 && (
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-sky-400 block">
                  Fissi Mensili in Scadenza:
                </span>
                {selectedDayData.fixedList.map((f, i) => (
                  <div
                    key={`popover-fixed-${i}`}
                    className="p-2 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/40 text-xs flex items-center justify-between text-blue-950 dark:text-sky-200"
                  >
                    <div className="truncate">
                      <span className="font-semibold block truncate">⏳ {f.category}</span>
                      <span className="text-[10px] text-blue-600 dark:text-sky-300 font-bold">
                        {formatCurrency(f.amount)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleExportFixedToPhone(f)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-[10px] font-bold transition active:scale-95 cursor-pointer shadow-2xs shrink-0"
                      title="Salva promemoria ricorrente sul telefono"
                    >
                      <CalendarPlus className="w-3 h-3" />
                      <span>Salva su telefono</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Movimenti del giorno */}
            {selectedDayData.stats.transactions.length > 0 && (
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#86868B] dark:text-gray-400 block">
                  Movimenti Registrati:
                </span>
                <div className="space-y-1 max-h-36 overflow-y-auto no-scrollbar">
                  {selectedDayData.stats.transactions.map(tx => {
                    const isInc = tx.type === 'income';
                    const meta = safeMetaMap[tx.category] || { icon: 'Tag', color: isInc ? '#34C759' : '#007AFF' };
                    return (
                      <div
                        key={tx.id}
                        className="p-1.5 rounded-xl bg-white dark:bg-[#2C2C2E] border border-neutral-100 dark:border-white/5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <div
                            className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${meta.color || '#007AFF'}15` }}
                          >
                            <CategoryIcon name={meta.icon || 'Tag'} className="w-3 h-3" color={meta.color || '#007AFF'} />
                          </div>
                          <span className="font-semibold truncate">{tx.category}</span>
                        </div>
                        <span className={`font-extrabold shrink-0 ${isInc ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#1D1D1F] dark:text-white'}`}>
                          <PrivacyAmount amount={tx.amount} prefix={isInc ? '+' : '-'} />
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedDayData.stats.transactions.length === 0 && selectedDayData.fixedList.length === 0 && selectedDayData.notesList.length === 0 && (
              <p className="text-xs text-[#86868B] dark:text-gray-400 italic py-1">
                Nessun movimento o scadenza registrata per questa data.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
