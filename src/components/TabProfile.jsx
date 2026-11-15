import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { exportMonthlyReportExcel } from '../utils/exportExcel';
import { exportMonthlyReportPdf } from '../utils/exportPdf';
import { LinkedFinancialAppsProfileCard } from './LinkedFinancialApps';
import { EmailQuickAccessCard } from './EmailQuickAccess';
import { 
  Trash2, 
  LogOut, 
  FileSpreadsheet, 
  FileText, 
  ExternalLink, 
  TrendingUp,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import { message, Modal } from 'antd';

const FAQ_ITEMS = [
  {
    q: "Come funziona la barra rapida Spotlight e le Pillole 1-Tap?",
    a: "Puoi registrare una spesa scrivendo semplicemente in cima alla Dashboard (es. 'Pizza 12') oppure toccando una delle pillole 1-Tap sotto la barra, che ti ripropongono in automatico le tue spese più frequenti."
  },
  {
    q: "Cos'è la Bussola Giornaliera nel Cashflow?",
    a: "È l'importo massimo che puoi spendere ogni giorno da oggi fino a fine mese per restare in attivo, calcolato dividendo il tuo Cashflow disponibile per i giorni rimanenti del mese."
  },
  {
    q: "Come funzionano i Fissi Mensili e il tasto 'Segna pagato'?",
    a: "Impostando le tue uscite ricorrenti (affitto, bollette, abbonamenti) in Analisi, FLOW ti avvisa in anticipo nella sezione Recenti. Quando il pagamento avviene, ti basta premere '✓ Segna pagato' per registrarlo in un tocco."
  },
  {
    q: "Come si usa il Tetto Stabilito?",
    a: "Premi il tasto '+' in Tetto Stabilito (in Analisi) per scegliere o creare una categoria e assegnarle un budget massimo mensile. La barra e la percentuale cambieranno colore (Verde, Giallo, Rosso) man mano che registri nuove uscite in quella categoria."
  },
  {
    q: "A cosa serve il Simulatore d'Acquisto e gli Ammortamenti?",
    a: "Il Simulatore in Analisi ti permette di testare l'impatto di un acquisto importante sul tuo budget giornaliero prima di comprarlo. Gli Ammortamenti ti aiutano a spalmare il costo di una grossa spesa su più mesi."
  },
  {
    q: "Come esporto i miei dati in PDF o Excel?",
    a: "Vai nella sezione Documenti: lì trovi la Panoramica Mensile completa, la ricerca per note e i pulsanti per scaricare il report mensile in formato PDF o foglio Excel (.xlsx)."
  }
];

export const TabProfile = () => {
  const { user, logout } = useAuth();
  const { 
    profile, 
    savingTargetPercent, 
    resetAllUserData, 
    monthlyTransactions, 
    transactions,
    monthlyMetrics, 
    savingsGoals, 
    monthLabel, 
    currentDate,
    categoryMetaMap
  } = useFinance();

  const [isFaqSectionOpen, setIsFaqSectionOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  const handleResetData = () => {
    Modal.confirm({
      title: "Sei sicuro di voler azzerare tutti i dati?",
      content: "Questa azione rimuoverà tutti i movimenti registrati e i salvadanai sia dal dispositivo che da Supabase. Non potrai annullare questa operazione.",
      okText: "Sì, Azzera Tutto",
      okType: "danger",
      cancelText: "Annulla",
      centered: true,
      onOk: async () => {
        await resetAllUserData();
      }
    });
  };

  const handleLogout = () => {
    Modal.confirm({
      title: "Vuoi uscire da FLOW?",
      content: "Tutti i tuoi dati rimangono sincronizzati in sicurezza sul cloud.",
      okText: "Esci",
      cancelText: "Annulla",
      centered: true,
      onOk: () => {
        logout();
      }
    });
  };

  const handleExportExcel = () => {
    try {
      exportMonthlyReportExcel({
        transactions,
        monthLabel,
        monthlyMetrics,
        savingsGoals,
        savingTargetPercent
      });
      message.success("File Excel scaricato con successo!");
    } catch (err) {
      console.error(err);
      message.error("Errore durante l'esportazione Excel.");
    }
  };

  const handleExportPdf = () => {
    try {
      exportMonthlyReportPdf({
        monthLabel,
        currentDate,
        monthlyMetrics,
        monthlyTransactions,
        savingsGoals,
        categories: Object.entries(categoryMetaMap || {}).map(([name, meta]) => ({
          name,
          ...meta
        })),
        savingTargetPercent
      });
      message.success("Report PDF generato con successo!");
    } catch (err) {
      console.error(err);
      message.error("Errore durante la generazione del PDF.");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-20">
      {/* ========================================================= */}
      {/* 1. INFO UTENTE & BADGE PROFILO                            */}
      {/* ========================================================= */}
      <div className="apple-card rounded-3xl p-5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#007AFF] to-indigo-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            {profile?.full_name ? profile.full_name[0].toUpperCase() : user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <div className="text-sm font-bold text-[#1D1D1F] dark:text-white">
              {profile?.full_name || user?.name || 'Utente FLOW'}
            </div>
            <div className="text-xs text-[#86868B] dark:text-gray-400">{user?.email}</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-sky-400 px-2 py-0.5 rounded-full">
                Target Risparmio: {savingTargetPercent}%
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="p-2.5 rounded-2xl text-[#86868B] hover:text-[#FF3B30] hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
          title="Esci dall'account"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* ========================================================= */}
      {/* 2. GUIDA RAPIDA & FAQ (BARRA COMPATTA IN CIMA)            */}
      {/* ========================================================= */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900/90 border border-slate-200/80 dark:border-white/10 shadow-xs transition-all overflow-hidden">
        <button
          type="button"
          onClick={() => setIsFaqSectionOpen(prev => !prev)}
          className="w-full p-3.5 flex items-center justify-between text-left select-none cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/5 transition"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-blue-500/10 dark:bg-blue-400/15 flex items-center justify-center text-[#007AFF] dark:text-sky-400 shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              Guida Rapida & FAQ
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-[#007AFF] dark:text-sky-400 shrink-0">
            <span>{isFaqSectionOpen ? 'Chiudi' : 'Mostra'}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isFaqSectionOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>

        {isFaqSectionOpen && (
          <div className="p-4 pt-2 border-t border-slate-200/80 dark:border-white/10 divide-y divide-slate-200/70 dark:divide-white/10 bg-white dark:bg-zinc-900/95 animate-fade-in">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="py-2.5 first:pt-1 last:pb-1">
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left flex items-center justify-between gap-3 text-xs font-semibold text-slate-900 dark:text-white hover:text-[#007AFF] dark:hover:text-sky-400 transition cursor-pointer select-none"
                  >
                    <span className="leading-snug">{item.q}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-zinc-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#007AFF] dark:text-sky-400' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-2 text-xs text-slate-600 dark:text-zinc-300 leading-relaxed pr-6 animate-fadeIn font-normal">
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 3. LANCIO RAPIDO SERVIZI BANCARI                          */}
      {/* ========================================================= */}
      <LinkedFinancialAppsProfileCard />

      {/* ========================================================= */}
      {/* 3.1 ACCESSO RAPIDO EMAIL (Smartphone Native)              */}
      {/* ========================================================= */}
      <EmailQuickAccessCard />

      {/* ========================================================= */}
      {/* 4. CARD: INVESTIMENTI & MERCATI ("Le mie finanze")        */}
      {/* ========================================================= */}
      <div className="rounded-3xl p-5 bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm transition">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <TrendingUp className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
                STRUMENTO CONSIGLIATO
              </div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white mt-0.5">
                Investimenti, ETF & Azioni
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed max-w-xl">
                Ti serve qualcosa di più dettagliato per monitorare le tue azioni, gli ETF, i titoli e il tuo portafoglio d'investimento? Utilizza l'app dedicata.
              </p>
            </div>
          </div>

          <a
            href="https://cucurucho-finance.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-semibold text-xs transition shadow-sm shrink-0 self-start sm:self-center"
          >
            <span>Le mie finanze</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. ESPORTAZIONE DATI (EXCEL & REPORT PDF)                 */}
      {/* ========================================================= */}
      <div className="apple-card rounded-3xl p-5 sm:p-6 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#86868B] dark:text-gray-400">
            Esportazione & Backup
          </span>
          <span className="text-xs font-semibold text-[#007AFF] dark:text-sky-400">
            {transactions.length} movimenti salvati
          </span>
        </div>

        <p className="text-xs text-[#86868B] dark:text-gray-400">
          Scarica tutti i dati registrati nell'app per archiviazione personale o dichiarazione fiscale:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleExportPdf}
            className="p-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-900/50 flex items-center justify-center gap-2 font-bold text-xs transition cursor-pointer active:scale-95 shadow-2xs"
          >
            <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Scarica Report Mensile PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/50 flex items-center justify-center gap-2 font-bold text-xs transition cursor-pointer active:scale-95 shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Esporta Storico Completo Excel</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. ZONA RESET DATI                                        */}
      {/* ========================================================= */}
      <div className="apple-card rounded-3xl p-5 border border-red-100 dark:border-red-950/40 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FF3B30]">
            Gestione & Pulizia Dati
          </span>
          <span className="text-[10px] text-[#86868B]">Inizio da zero</span>
        </div>

        <p className="text-xs text-[#86868B] dark:text-gray-400 leading-relaxed">
          Vuoi ripartire da zero senza movimenti? Cliccando il pulsante sottostante svuoterai completamente lo storico transazioni e i salvadanai sia in locale che sul database Supabase.
        </p>

        <button
          type="button"
          onClick={handleResetData}
          className="px-4 py-2 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Azzera Tutti i Dati e Riparti da Zero</span>
        </button>
      </div>
    </div>
  );
};
