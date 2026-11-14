import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Trash2, 
  ExternalLink, 
  Check, 
  Smartphone,
  X
} from 'lucide-react';
import { Modal, message } from 'antd';

/**
 * Dizionario Completo Deep Link Schemi Nativi per App Bancarie
 * Su iOS / Android apre direttamente l'app nativa dello smartphone.
 */
export const BANK_SCHEMES = {
  // ING
  'ing': 'ing://',
  'ing direct': 'ing://',
  'ing bank': 'ing://',
  'conto arancio': 'ing://',

  // Pagamenti & Fintech
  'satispay': 'satispay://',
  'paypal': 'paypal://',
  'revolut': 'revolut://',
  'wise': 'wise://',
  'hype': 'hype://',
  'n26': 'n26://',
  'bbva': 'bbva://',
  'isybank': 'isybank://',
  'illimity': 'illimity://',

  // Grandi Banche Italiane
  'intesa': 'intesasanpaolo://',
  'intesa sanpaolo': 'intesasanpaolo://',
  'intesasanpaolo': 'intesasanpaolo://',
  'unicredit': 'unicredit://',
  'buddybank': 'unicredit://',
  'fineco': 'fineco://',
  'finecobank': 'fineco://',
  'poste': 'postepay://',
  'postepay': 'postepay://',
  'bancoposta': 'bancoposta://',
  'poste italiane': 'postepay://',
  'bper': 'bper://',
  'bper banca': 'bper://',
  'credem': 'credem://',
  'mediolanum': 'mediolanum://',
  'banca mediolanum': 'mediolanum://',
  'flowe': 'flowe://',
  'mps': 'mps://',
  'monte dei paschi': 'mps://',
  'widiba': 'widiba://',
  'bnl': 'bnl://',
  'hello bank': 'hellobank://',
  'credit agricole': 'creditagricole://',
  'crédit agricole': 'creditagricole://',

  // Investimenti & Carte
  'trade republic': 'traderepublic://',
  'scalable capital': 'scalablecapital://',
  'amex': 'amex://',
  'american express': 'amex://'
};

export const BANK_UNIVERSAL_LINKS = BANK_SCHEMES;

/**
 * Risolve l'URL o Schema nativo bancario
 */
export const resolveBankUrl = (name = '', manualUrl = '') => {
  const cleanName = (name || '').trim().toLowerCase();
  const cleanManual = (manualUrl || '').trim();

  // 1. Se manualUrl ha uno schema personalizzato o http
  if (cleanManual && (cleanManual.includes('://') || cleanManual.startsWith('http'))) {
    return cleanManual;
  }

  // 2. Risoluzione tramite dizionario Scheme
  for (const [key, scheme] of Object.entries(BANK_SCHEMES)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return scheme;
    }
  }

  // 3. Fallback scheme pulito dal nome
  if (cleanName) {
    const slug = cleanName.replace(/[^a-z0-9]/g, '');
    return `${slug}://`;
  }
  return 'ing://';
};

export const PRESET_APPS = [
  {
    id: 'ing',
    name: 'ING',
    category: 'Banca',
    color: '#FF6200',
    textColor: '#FFFFFF',
    iconText: 'ING',
    scheme: 'ing://',
    webUrl: 'ing://',
    description: 'Conto Corrente Arancio'
  },
  {
    id: 'satispay',
    name: 'Satispay',
    category: 'Pagamenti',
    color: '#F9423A',
    textColor: '#FFFFFF',
    iconText: 'S',
    scheme: 'satispay://',
    webUrl: 'satispay://',
    description: 'Pagamenti smart & cashback'
  },
  {
    id: 'paypal',
    name: 'PayPal',
    category: 'Pagamenti',
    color: '#0070BA',
    textColor: '#FFFFFF',
    iconText: 'P',
    scheme: 'paypal://',
    webUrl: 'paypal://',
    description: 'Conto & trasferimenti rapidi'
  },
  {
    id: 'revolut',
    name: 'Revolut',
    category: 'Banca',
    color: '#191C1F',
    textColor: '#FFFFFF',
    iconText: 'R',
    scheme: 'revolut://',
    webUrl: 'revolut://',
    description: 'Conto multivaluta & carte'
  },
  {
    id: 'intesasanpaolo',
    name: 'Intesa Sanpaolo',
    category: 'Banca',
    color: '#006643',
    textColor: '#FFFFFF',
    iconText: 'ISP',
    scheme: 'intesasanpaolo://',
    webUrl: 'intesasanpaolo://',
    description: 'Mobile Banking Intesa'
  },
  {
    id: 'isybank',
    name: 'Isybank',
    category: 'Banca',
    color: '#00A3E0',
    textColor: '#FFFFFF',
    iconText: 'ISY',
    scheme: 'isybank://',
    webUrl: 'isybank://',
    description: 'Banca 100% digitale'
  },
  {
    id: 'unicredit',
    name: 'UniCredit',
    category: 'Banca',
    color: '#E2001A',
    textColor: '#FFFFFF',
    iconText: 'UC',
    scheme: 'unicredit://',
    webUrl: 'unicredit://',
    description: 'App Mobile Banking UniCredit'
  },
  {
    id: 'fineco',
    name: 'Fineco',
    category: 'Banca',
    color: '#002E6D',
    textColor: '#FFFFFF',
    iconText: 'F',
    scheme: 'fineco://',
    webUrl: 'fineco://',
    description: 'Conto & Trading'
  },
  {
    id: 'postepay',
    name: 'PostePay',
    category: 'Banca',
    color: '#FFCC00',
    textColor: '#002B49',
    iconText: 'PT',
    scheme: 'postepay://',
    webUrl: 'postepay://',
    description: 'Postepay Mobile'
  },
  {
    id: 'bancoposta',
    name: 'BancoPosta',
    category: 'Banca',
    color: '#002B49',
    textColor: '#FFCC00',
    iconText: 'BP',
    scheme: 'bancoposta://',
    webUrl: 'bancoposta://',
    description: 'BancoPosta Mobile'
  },
  {
    id: 'bbva',
    name: 'BBVA',
    category: 'Banca',
    color: '#004481',
    textColor: '#FFFFFF',
    iconText: 'BBVA',
    scheme: 'bbva://',
    webUrl: 'bbva://',
    description: 'Conto zero spese & cashback'
  },
  {
    id: 'n26',
    name: 'N26',
    category: 'Banca',
    color: '#36A18B',
    textColor: '#FFFFFF',
    iconText: 'N26',
    scheme: 'n26://',
    webUrl: 'n26://',
    description: 'Conto mobile 100%'
  },
  {
    id: 'hype',
    name: 'Hype',
    category: 'Banca',
    color: '#00B4D8',
    textColor: '#FFFFFF',
    iconText: 'H',
    scheme: 'hype://',
    webUrl: 'hype://',
    description: 'Conto smart e prepagata'
  },
  {
    id: 'traderepublic',
    name: 'Trade Republic',
    category: 'Trading',
    color: '#111111',
    textColor: '#FFFFFF',
    iconText: 'TR',
    scheme: 'traderepublic://',
    webUrl: 'traderepublic://',
    description: 'Broker & Conto'
  }
];

export const useLinkedFinancialApps = () => {
  const { user } = useAuth();
  const getStorageKey = () => `flow_bank_shortcuts_v4_${user?.id || 'guest'}`;

  // Sanitizza l'elenco garantendo schema URL nativo
  const sanitizeApps = (appsList) => {
    if (!Array.isArray(appsList)) return [];
    return appsList.map(app => {
      const validUrl = resolveBankUrl(app.name, app.scheme || app.webUrl);
      return {
        ...app,
        scheme: validUrl,
        webUrl: validUrl,
        resolvedUrl: validUrl
      };
    });
  };

  const [linkedApps, setLinkedApps] = useState(() => {
    try {
      const key = `flow_bank_shortcuts_v4_${user?.id || 'guest'}`;
      const local = localStorage.getItem(key) || localStorage.getItem('flow_bank_shortcuts_v4');
      if (local) {
        const parsed = JSON.parse(local);
        return sanitizeApps(parsed);
      }
      // Se non presente, popola con i preset più diffusi
      return [
        PRESET_APPS[0], // ING
        PRESET_APPS[1], // Satispay
        PRESET_APPS[2], // PayPal
        PRESET_APPS[3]  // Revolut
      ];
    } catch (e) {
      console.warn("Parsing flow_bank_shortcuts_v4 fallito:", e);
      return [];
    }
  });

  useEffect(() => {
    if (!user) return;
    try {
      const key = `flow_bank_shortcuts_v4_${user.id}`;
      const local = localStorage.getItem(key) || localStorage.getItem('flow_bank_shortcuts_v4');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          const sanitized = sanitizeApps(parsed);
          setLinkedApps(sanitized);
        }
      }
    } catch (e) {
      console.warn("Caricamento app collegate:", e);
    }
  }, [user]);

  const saveApps = (apps) => {
    const sanitized = sanitizeApps(apps);
    setLinkedApps(sanitized);
    try {
      const key = getStorageKey();
      const serialized = JSON.stringify(sanitized);
      localStorage.setItem(key, serialized);
      localStorage.setItem('flow_bank_shortcuts_v4', serialized);
    } catch (e) {
      console.error(e);
    }
  };

  const addApp = (app) => {
    if (linkedApps.some(a => (a.id && a.id === app.id) || a.name.toLowerCase() === app.name.toLowerCase())) {
      message.warning(`${app.name} è già tra le tue app collegate.`);
      return;
    }
    const resolved = resolveBankUrl(app.name, app.scheme || app.webUrl);
    const completeApp = {
      ...app,
      scheme: resolved,
      webUrl: resolved,
      resolvedUrl: resolved
    };
    const updated = [...linkedApps, completeApp];
    saveApps(updated);
    message.success(`${app.name} collegata con successo!`);
  };

  const removeAppByIndex = (idx) => {
    const updated = linkedApps.filter((_, i) => i !== idx);
    saveApps(updated);
    message.info("App rimossa.");
  };

  const removeApp = (appId) => {
    const updated = linkedApps.filter(a => a.id !== appId);
    saveApps(updated);
    message.info("App rimossa.");
  };

  return {
    linkedApps,
    setLinkedApps: saveApps,
    addApp,
    removeApp,
    removeAppByIndex
  };
};

export const LinkedFinancialAppsProfileCard = () => {
  const { linkedApps, setLinkedApps, addApp, removeAppByIndex } = useLinkedFinancialApps();

  const [modalOpen, setModalOpen] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [customName, setCustomName] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customColor, setCustomColor] = useState('#007AFF');
  const [isCustomMode, setIsCustomMode] = useState(false);

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setCustomName(preset.name);
    setCustomUrl(preset.webUrl);
    setCustomColor(preset.color);
    setIsCustomMode(false);
  };

  const handleConfirmAdd = () => {
    if (!customName.trim()) {
      message.error("Inserisci o seleziona il nome dell'app.");
      return;
    }

    const resolved = resolveBankUrl(customName.trim(), customUrl);

    addApp({
      id: `app_${Date.now()}`,
      name: customName.trim(),
      category: 'Finanza',
      color: customColor,
      textColor: '#FFFFFF',
      iconText: customName.trim().slice(0, 3).toUpperCase(),
      webUrl: resolved,
      resolvedUrl: resolved,
      description: 'Lancio rapido'
    });

    setModalOpen(false);
    setCustomName('');
    setCustomUrl('');
    setSelectedPresetId('');
  };

  const handleOpenBank = (schemeUrl) => {
    if (!schemeUrl) return;
    try {
      window.location.href = schemeUrl;
    } catch {
      window.open(schemeUrl, '_self');
    }
  };

  return (
    <div className="apple-card rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#007AFF] dark:text-sky-400 flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F] dark:text-white block">
              Lancio Rapido Servizi Bancari
            </span>
            <p className="text-xs text-[#86868B] dark:text-gray-400">
              Apri istantaneamente la tua Banca o app di pagamento con un tocco.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {linkedApps.length > 0 && (
            <button
              type="button"
              onClick={() => setIsEditingMode(!isEditingMode)}
              className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition cursor-pointer border ${
                isEditingMode
                  ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 shadow-2xs'
                  : 'bg-gray-100 hover:bg-gray-200/80 dark:bg-white/10 dark:hover:bg-white/20 text-[#1D1D1F] dark:text-white border-transparent'
              }`}
            >
              {isEditingMode ? 'Fine Gestione' : 'Gestisci'}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setIsCustomMode(false);
              setSelectedPresetId(PRESET_APPS[0].id);
              handleSelectPreset(PRESET_APPS[0]);
              setModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-2xl bg-[#007AFF] hover:bg-blue-600 active:scale-95 text-white font-bold text-xs shadow-sm transition cursor-pointer"
          >
            <span>Collega Servizio Bancario</span>
          </button>
        </div>
      </div>

      {/* Griglia Icone in Stile App iOS con deep link native via window.location.href */}
      <div className="pt-2">
        {linkedApps.length === 0 ? (
          <div className="p-8 text-center bg-gray-50/70 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 text-xs text-[#86868B]">
            Nessun servizio bancario collegato. Tocca <strong>"Collega Servizio Bancario"</strong> per aggiungere le tue banche.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
            {linkedApps.map((app, idx) => {
              const targetUrl = resolveBankUrl(app.name, app.scheme || app.webUrl || app.resolvedUrl);

              return (
                <div key={app.id || idx} className="relative flex flex-col items-center group">
                  {isEditingMode ? (
                    <div
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-black text-base sm:text-lg shadow-sm border border-black/5 dark:border-white/10 ring-2 ring-amber-400 opacity-90 cursor-default select-none"
                      style={{ backgroundColor: app.color || '#0071E3', color: app.textColor || '#FFFFFF' }}
                    >
                      {app.iconText || app.name?.substring(0, 3).toUpperCase() || 'BK'}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenBank(targetUrl)}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-black text-base sm:text-lg shadow-sm border border-black/5 dark:border-white/10 transition-all hover:shadow-md hover:scale-105 active:scale-95 cursor-pointer select-none"
                      style={{ backgroundColor: app.color || '#0071E3', color: app.textColor || '#FFFFFF' }}
                      title={`Apri ${app.name}`}
                    >
                      {app.iconText || app.name?.substring(0, 3).toUpperCase() || 'BK'}
                    </button>
                  )}

                  <span className="text-[11px] mt-1 font-semibold text-[#1D1D1F] dark:text-white truncate max-w-[76px] text-center">
                    {app.name}
                  </span>

                  {/* Pulsante per eliminare (visibile in modalità Gestisci) */}
                  {isEditingMode && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const updated = linkedApps.filter((_, i) => i !== idx);
                        setLinkedApps(updated);
                        if (updated.length === 0) setIsEditingMode(false);
                        message.info(`${app.name} rimossa.`);
                      }}
                      className="mt-1 px-2.5 py-0.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold shadow-xs active:scale-95 cursor-pointer transition animate-fade-in"
                    >
                      Elimina
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modale Aggiungi App Finanziaria */}
      <Modal
        title="Collega App Finanziaria o Banca"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleConfirmAdd}
        okText="Aggiungi App"
        cancelText="Annulla"
        centered
      >
        <div className="space-y-4 pt-2">
          {/* Switch Segmented: Preset Rapidi | Inserimento Libero */}
          <div className="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-[#2C2C2E] p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setIsCustomMode(false)}
              className={`py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                !isCustomMode ? 'bg-white dark:bg-[#3A3A3C] text-[#1D1D1F] dark:text-white shadow-xs' : 'text-[#86868B]'
              }`}
            >
              Preset Ufficiali ({PRESET_APPS.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCustomMode(true);
                setSelectedPresetId('');
              }}
              className={`py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                isCustomMode ? 'bg-white dark:bg-[#3A3A3C] text-[#1D1D1F] dark:text-white shadow-xs' : 'text-[#86868B]'
              }`}
            >
              Inserimento Libero
            </button>
          </div>

          {!isCustomMode ? (
            <div>
              <label className="text-xs font-semibold text-[#1D1D1F] dark:text-gray-200 block mb-2">
                Seleziona la tua banca o app:
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {PRESET_APPS.map(p => {
                  const isSel = selectedPresetId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className={`p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                        isSel
                          ? 'border-[#007AFF] bg-blue-50/50 dark:bg-blue-950/30'
                          : 'border-gray-200 dark:border-white/10 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
                        style={{ backgroundColor: p.color, color: p.textColor }}
                      >
                        {p.iconText}
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-xs block text-[#1D1D1F] dark:text-white truncate">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-[#86868B] block truncate">
                          {p.category}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#1D1D1F] dark:text-gray-200 block mb-1">
                  Nome Banca o Servizio
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomName(val);
                    // Risolve automaticamente l'Universal Link mentre scrive
                    const autoUrl = resolveBankUrl(val, '');
                    if (autoUrl && !autoUrl.includes('google.com/search')) {
                      setCustomUrl(autoUrl);
                    }
                  }}
                  placeholder="es. ING, Fineco, BPER, Intesa, Revolut..."
                  className="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200/80 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-[#007AFF] dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1D1D1F] dark:text-gray-200 block mb-1">
                  Sito Web o Link (Opzionale, viene assegnato in automatico)
                </label>
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200/80 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-[#007AFF] dark:text-white"
                />
                <span className="text-[10px] text-[#86868B] dark:text-gray-400 mt-1 block">
                  Se inserisci solo il nome, FLOW assegna automaticamente l'Universal Link ufficiale HTTPS.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1D1D1F] dark:text-gray-200 block mb-1">
                  Colore Icona
                </label>
                <div className="flex gap-2 flex-wrap">
                  {['#007AFF', '#FF6200', '#F9423A', '#0070BA', '#006643', '#E2001A', '#004481', '#FFCC00', '#36A18B', '#AF52DE'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCustomColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition cursor-pointer ${
                        customColor === c ? 'border-neutral-900 dark:border-white scale-110 shadow-xs' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
