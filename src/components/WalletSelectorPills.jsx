import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  Wallet, 
  Users, 
  User, 
  Plus, 
  Trash2, 
  Layers, 
  MessageCircle, 
  Check, 
  ArrowRightLeft, 
  Share2,
  TrendingDown,
  Info
} from 'lucide-react';
import { Modal, message } from 'antd';
import { formatCurrency, PrivacyAmount } from './CategoryIcon';

export const WalletSelectorPills = () => {
  const { 
    wallets, 
    activeWalletId, 
    setActiveWalletId, 
    addWallet, 
    deleteWallet,
    monthlyTransactions,
    transactions
  } = useFinance();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [walletName, setWalletName] = useState('');
  const [walletType, setWalletType] = useState('personal'); // 'personal' | 'shared'
  const [walletColor, setWalletColor] = useState('#007AFF');
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Conto attualmente attivo
  const activeWallet = wallets.find(w => w.id === activeWalletId);
  const isCurrentShared = activeWallet && activeWallet.type === 'shared';

  const handleCreate = () => {
    if (!walletName.trim()) {
      message.error("Inserisci un nome per il conto.");
      return;
    }

    addWallet({
      name: walletName.trim(),
      type: walletType,
      color: walletColor
    });

    setWalletName('');
    setWalletType('personal');
    setWalletColor('#007AFF');
    setCreateModalOpen(false);
  };

  const confirmDelete = (e, wallet) => {
    e.stopPropagation();
    if (wallet.id === 'main') {
      message.warning("Il conto Principale non può essere eliminato.");
      return;
    }

    Modal.confirm({
      title: `Eliminare il conto "${wallet.name}"?`,
      content: "Le spese registrate in questo conto rimarranno memorizzate e passeranno al conto Principale.",
      okText: "Elimina",
      okType: "danger",
      cancelText: "Annulla",
      centered: true,
      onOk: () => {
        deleteWallet(wallet.id);
      }
    });
  };

  // 2. CALCOLO METRICHE PERFEZIONATE SPLIT 50/50 SUI CONTI CONDIVISI
  const sharedMetrics = useMemo(() => {
    if (!isCurrentShared) return null;

    // Movimenti appartenenti a questo conto condiviso
    const currentList = (monthlyTransactions || []).filter(
      t => (t.walletId || 'main') === activeWalletId && t.type === 'expense'
    );

    let totalCoupleExpense = 0; // Totale reale speso dalla coppia (intero)
    let myTotalExpense = 0;     // Quota totale a mio carico (50% per spese divise o 100%)
    let paidByMe = 0;          // Importo totale anticipato fisicamente da me
    let paidByPartner = 0;     // Importo totale anticipato dal partner

    currentList.forEach(t => {
      const recordedAmt = Number(t.amount) || 0;
      const rawAmt = Number(t.rawAmount) || (t.isSplit50 ? recordedAmt * 2 : recordedAmt);

      if (t.isSplit50) {
        totalCoupleExpense += rawAmt;
        myTotalExpense += recordedAmt; // mia quota (50%)
        if (t.payer === 'partner') {
          paidByPartner += rawAmt;
        } else {
          // Default: pagato da me
          paidByMe += rawAmt;
        }
      } else {
        totalCoupleExpense += recordedAmt;
        myTotalExpense += recordedAmt;
        if (t.payer === 'partner') {
          paidByPartner += recordedAmt;
        } else {
          paidByMe += recordedAmt;
        }
      }
    });

    // Calcolo Saldo Dare / Avere:
    // Quota partner = totalCoupleExpense - myTotalExpense
    // Se io ho pagato X e la mia quota è Y:
    // saldo = paidByMe - myTotalExpense.
    // Se saldo > 0: Il partner mi deve dare `saldo` €.
    // Se saldo < 0: Io devo dare `Math.abs(saldo)` € al partner.
    const partnerQuota = Math.max(0, totalCoupleExpense - myTotalExpense);
    const balance = paidByMe - myTotalExpense;

    return {
      totalCoupleExpense,
      myTotalExpense,
      partnerQuota,
      paidByMe,
      paidByPartner,
      balance,
      transactionsCount: currentList.length
    };
  }, [isCurrentShared, monthlyTransactions, activeWalletId]);

  // Invio o Copia Riepilogo Condivisione (WhatsApp / Clipboard)
  const handleShareSummary = () => {
    if (!sharedMetrics || !activeWallet) return;

    let balanceText = "Siamo pari! Nessun debito pendente. 🤝";
    if (sharedMetrics.balance > 0.01) {
      balanceText = `👉 *Mi devi dare: ${formatCurrency(sharedMetrics.balance)}*`;
    } else if (sharedMetrics.balance < -0.01) {
      balanceText = `👉 *Ti devo dare: ${formatCurrency(Math.abs(sharedMetrics.balance))}*`;
    }

    const messageLines = [
      `📊 *Riepilogo Spese - Conto "${activeWallet.name}"*`,
      `━━━━━━━━━━━━━━━━━━`,
      `• *Totale Speso Coppia:* ${formatCurrency(sharedMetrics.totalCoupleExpense)}`,
      `• *La mia quota (50%):* ${formatCurrency(sharedMetrics.myTotalExpense)}`,
      `• *Anticipato da me:* ${formatCurrency(sharedMetrics.paidByMe)}`,
      `• *Anticipato da te:* ${formatCurrency(sharedMetrics.paidByPartner)}`,
      `━━━━━━━━━━━━━━━━━━`,
      `⚖️ *SALDO FINALE:*`,
      balanceText,
      `━━━━━━━━━━━━━━━━━━`,
      `_Inviato da FLOW (Finanza Personale)_`
    ];

    const fullText = messageLines.join('\n');
    const encoded = encodeURIComponent(fullText);
    const waUrl = `https://wa.me/?text=${encoded}`;

    try {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    } catch {
      navigator.clipboard.writeText(fullText);
      message.success("Riepilogo copiato negli appunti!");
    }
  };

  return (
    <div className="w-full space-y-2">
      {/* Barra orizzontale a pillole stile Apple */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {/* Pillola "Tutti i conti" */}
        <button
          type="button"
          onClick={() => setActiveWalletId('all')}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer shrink-0 select-none border ${
            activeWalletId === 'all'
              ? 'bg-[#1D1D1F] text-white dark:bg-white dark:text-[#1D1D1F] border-transparent shadow-xs font-bold'
              : 'bg-white/80 dark:bg-[#1C1C1E]/80 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white border-neutral-200/70 dark:border-white/10'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Tutti</span>
        </button>

        {/* Singoli Conti */}
        {wallets.map((w) => {
          const isActive = activeWalletId === w.id;
          const isShared = w.type === 'shared';

          return (
            <div key={w.id} className="relative group shrink-0">
              <button
                type="button"
                onClick={() => setActiveWalletId(w.id)}
                className={`rounded-full pl-3 pr-2.5 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer select-none border ${
                  isActive
                    ? 'bg-[#1D1D1F] text-white dark:bg-white dark:text-[#1D1D1F] border-transparent shadow-xs font-bold'
                    : 'bg-white/80 dark:bg-[#1C1C1E]/80 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white border-neutral-200/70 dark:border-white/10'
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: w.color || (isShared ? '#AF52DE' : '#007AFF') }}
                />
                {isShared ? (
                  <Users className="w-3.5 h-3.5 opacity-80" />
                ) : (
                  <Wallet className="w-3.5 h-3.5 opacity-80" />
                )}
                <span>{w.name}</span>

                {isShared && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                    isActive ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black' : 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                  }`}>
                    50%
                  </span>
                )}

                {/* Tasto elimina conto (solo per conti secondari) */}
                {w.id !== 'main' && (
                  <span
                    onClick={(e) => confirmDelete(e, w)}
                    className="ml-0.5 p-0.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 text-neutral-400 hover:text-red-600 transition"
                    title={`Elimina conto ${w.name}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </span>
                )}
              </button>
            </div>
          );
        })}

        {/* Bottone compatto "+ Conto" */}
        <button
          type="button"
          onClick={() => {
            setWalletName('');
            setWalletType('personal');
            setWalletColor('#007AFF');
            setCreateModalOpen(true);
          }}
          className="rounded-full px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1 text-[#007AFF] dark:text-sky-400 bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/40 transition active:scale-95 cursor-pointer shrink-0"
          title="Aggiungi nuovo conto o portafoglio"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Conto</span>
        </button>
      </div>

      {/* CARD DETTAGLIO SPLIT 50/50 PER IL CONTO CONDIVISO ATTIVO */}
      {isCurrentShared && sharedMetrics && (
        <div className="apple-card rounded-2xl p-3.5 sm:p-4 bg-gradient-to-br from-purple-50/80 via-white to-purple-50/30 dark:from-[#1C1C1E] dark:via-[#1C1C1E] dark:to-purple-950/20 border border-purple-200/80 dark:border-purple-800/40 shadow-xs animate-fade-in space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                  Riepilogo Split 50/50 · {activeWallet.name}
                </span>
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  {sharedMetrics.transactionsCount} {sharedMetrics.transactionsCount === 1 ? 'uscita registrata' : 'uscite registrate'} questo mese
                </span>
              </div>
            </div>

            {/* Pulsante rapido Condividi Riepilogo */}
            <button
              type="button"
              onClick={handleShareSummary}
              className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
              title="Condividi o copia il riepilogo con i conti già fatti"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedSummary ? 'Inviato / Copiato!' : 'Condividi Riepilogo'}</span>
            </button>
          </div>

          {/* Griglia Metriche: Totale Coppia | Mia Quota | Saldo Anticipi */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-white/5 border border-purple-100/80 dark:border-white/5">
              <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 block truncate">
                Totale Speso Coppia
              </span>
              <span className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white block mt-0.5">
                <PrivacyAmount amount={sharedMetrics.totalCoupleExpense} />
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-white/5 border border-purple-100/80 dark:border-white/5">
              <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 block truncate">
                Tua Quota (50%)
              </span>
              <span className="text-sm sm:text-base font-extrabold text-purple-700 dark:text-purple-300 block mt-0.5">
                <PrivacyAmount amount={sharedMetrics.myTotalExpense} />
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-white/5 border border-purple-100/80 dark:border-white/5">
              <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 block truncate">
                {sharedMetrics.balance >= 0 ? "Credito per te" : "Debito per te"}
              </span>
              <span className={`text-sm sm:text-base font-extrabold block mt-0.5 ${
                sharedMetrics.balance > 0.01 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : sharedMetrics.balance < -0.01 
                  ? 'text-rose-600 dark:text-rose-400' 
                  : 'text-neutral-600 dark:text-neutral-300'
              }`}>
                <PrivacyAmount amount={Math.abs(sharedMetrics.balance)} />
              </span>
            </div>
          </div>

          {/* Spiegazione intuitiva chi deve dare a chi */}
          <div className="p-2 rounded-xl bg-purple-100/60 dark:bg-purple-950/40 text-[11px] font-medium text-purple-900 dark:text-purple-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
              <span>
                {sharedMetrics.balance > 0.01 ? (
                  <>Hai anticipato più spese: <strong>il partner ti deve {formatCurrency(sharedMetrics.balance)}</strong></>
                ) : sharedMetrics.balance < -0.01 ? (
                  <>Il partner ha anticipato più spese: <strong>gli devi {formatCurrency(Math.abs(sharedMetrics.balance))}</strong></>
                ) : (
                  <>I conti sono perfettamente in pareggio!</>
                )}
              </span>
            </div>
            <span className="text-[10px] opacity-75 hidden sm:inline">
              (Anticipati: Tu {formatCurrency(sharedMetrics.paidByMe)} · Partner {formatCurrency(sharedMetrics.paidByPartner)})
            </span>
          </div>
        </div>
      )}

      {/* Modale Creazione Conto */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#007AFF] flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm">Crea Nuovo Conto / Portafoglio</span>
          </div>
        }
        open={createModalOpen}
        onOk={handleCreate}
        onCancel={() => setCreateModalOpen(false)}
        okText="Crea Conto"
        cancelText="Annulla"
        centered
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
              Nome del Conto
            </label>
            <input
              type="text"
              value={walletName}
              onChange={(e) => setWalletName(e.target.value)}
              placeholder="es. Spese Casa, Conto 2, Cointestato, Viaggio..."
              className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-[#007AFF]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
              Tipologia Conto
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setWalletType('personal');
                  setWalletColor('#007AFF');
                }}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
                  walletType === 'personal'
                    ? 'border-[#007AFF] bg-blue-50/80 dark:bg-blue-950/40 text-[#007AFF]'
                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <User className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs font-bold block">Personale</span>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block leading-tight">
                    Spese e incassi 100% a tuo carico
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setWalletType('shared');
                  setWalletColor('#AF52DE');
                }}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
                  walletType === 'shared'
                    ? 'border-purple-500 bg-purple-50/80 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <Users className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs font-bold block">Condiviso / Cointestato</span>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block leading-tight">
                    Supporto split 50/50 & resoconto WhatsApp
                  </span>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
              Colore Distintivo
            </label>
            <div className="flex gap-2 flex-wrap">
              {['#007AFF', '#34C759', '#AF52DE', '#FF9500', '#FF3B30', '#5856D6', '#5AC8FA', '#FF2D55', '#30B0C7'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setWalletColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition cursor-pointer ${
                    walletColor === c ? 'border-neutral-900 dark:border-white scale-110 shadow-xs' : 'border-transparent'
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
