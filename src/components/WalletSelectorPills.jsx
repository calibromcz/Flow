import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { 
  Wallet, 
  Users, 
  User, 
  Plus, 
  Trash2, 
  Layers, 
  ChevronRight, 
  Sparkles,
  Check,
  Copy,
  Share2,
  KeyRound
} from 'lucide-react';
import { Modal, message } from 'antd';

export const WalletSelectorPills = () => {
  const { 
    wallets, 
    activeWalletId, 
    setActiveWalletId, 
    addWallet, 
    deleteWallet,
    joinSharedWallet
  } = useFinance();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('create'); // 'create' | 'join'
  const [walletName, setWalletName] = useState('');
  const [walletType, setWalletType] = useState('personal'); // 'personal' | 'shared'
  const [walletColor, setWalletColor] = useState('#007AFF');
  const [inputShareCode, setInputShareCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Trova il conto attualmente attivo se è condiviso
  const activeWallet = wallets.find(w => w.id === activeWalletId);
  const isCurrentShared = activeWallet && activeWallet.type === 'shared';

  const handleCreate = () => {
    if (modalTab === 'join') {
      if (!inputShareCode.trim()) {
        message.error("Inserisci il codice invito a 6 caratteri.");
        return;
      }
      joinSharedWallet(inputShareCode);
      setInputShareCode('');
      setCreateModalOpen(false);
      return;
    }

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

  const copyShareCode = (code) => {
    if (!code) return;
    try {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      message.success(`Codice invito ${code} copiato negli appunti!`);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      message.info(`Codice invito: ${code}`);
    }
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

  return (
    <div className="w-full space-y-1.5">
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
            setModalTab('create');
            setWalletName('');
            setWalletType('personal');
            setWalletColor('#007AFF');
            setInputShareCode('');
            setCreateModalOpen(true);
          }}
          className="rounded-full px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1 text-[#007AFF] dark:text-sky-400 bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/40 transition active:scale-95 cursor-pointer shrink-0"
          title="Aggiungi nuovo conto o unisciti a un conto condiviso"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Conto</span>
        </button>
      </div>

      {/* Badge Informativo Conto Condiviso con Codice a 6 Cifre e Tap per Copiare */}
      {isCurrentShared && activeWallet?.shareCode && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-purple-50/90 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/40 text-purple-900 dark:text-purple-200 text-[11px] animate-fade-in">
          <div className="flex items-center gap-1.5 font-medium">
            <Users className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Condiviso · </span>
            <span className="font-mono font-bold tracking-wider bg-purple-200/60 dark:bg-purple-900/60 px-1.5 py-0.5 rounded text-[10px]">
              {activeWallet.shareCode}
            </span>
          </div>
          <button
            type="button"
            onClick={() => copyShareCode(activeWallet.shareCode)}
            className="flex items-center gap-1 font-bold text-purple-700 dark:text-purple-300 hover:text-purple-950 dark:hover:text-white px-2 py-0.5 rounded-lg hover:bg-purple-200/50 dark:hover:bg-purple-900/40 transition cursor-pointer"
            title="Copia codice di condivisione"
          >
            {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copiedCode ? 'Copiato!' : 'Copia Codice Invito'}</span>
          </button>
        </div>
      )}

      {/* Modale Gestione / Creazione Conto */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#007AFF] flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm">Gestione Conti & Portafogli</span>
          </div>
        }
        open={createModalOpen}
        onOk={handleCreate}
        onCancel={() => setCreateModalOpen(false)}
        okText={modalTab === 'join' ? "Unisciti al Conto" : "Crea Conto"}
        cancelText="Annulla"
        centered
      >
        <div className="space-y-4 pt-2">
          {/* Selettore Tab "Crea Nuovo" vs "Unisciti con Codice" */}
          <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setModalTab('create')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                modalTab === 'create'
                  ? 'bg-white dark:bg-[#1C1C1E] text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              + Nuovo Conto
            </button>
            <button
              type="button"
              onClick={() => setModalTab('join')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                modalTab === 'join'
                  ? 'bg-white dark:bg-[#1C1C1E] text-purple-700 dark:text-purple-300 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Unisciti con Codice</span>
            </button>
          </div>

          {modalTab === 'create' ? (
            <>
              <div>
                <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
                  Nome del Conto
                </label>
                <input
                  type="text"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  placeholder="es. Spese Casa, Conto 2, Cointestato, Viaggio..."
                  className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
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
                        Genera codice a 6 caratteri & split al 50%
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
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
                  Codice di Condivisione (6 caratteri)
                </label>
                <input
                  type="text"
                  value={inputShareCode}
                  onChange={(e) => setInputShareCode(e.target.value.toUpperCase())}
                  placeholder="es. FLW-84K"
                  className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-sm font-mono font-bold tracking-widest text-center uppercase outline-none focus:border-purple-500"
                  maxLength={10}
                />
              </div>

              <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/30 text-xs text-purple-900 dark:text-purple-200 leading-relaxed">
                <span className="font-bold block mb-1">Come funziona la sincronizzazione tra 2 smartphone?</span>
                Chiedi al partner di aprire il suo conto condiviso su FLOW e toccare <strong>"Copia Codice Invito"</strong>. Incolla il codice qui per connettervi allo stesso conto condiviso.
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

