import React, { useState, useEffect } from 'react';
import { Mail, Inbox, Plus, Trash2, Smartphone, ExternalLink, X } from 'lucide-react';
import { Modal, message } from 'antd';

export const EMAIL_PRESETS = [
  { id: 'apple-mail', name: 'Apple Mail', scheme: 'message://', color: '#007AFF', iconText: 'Mail' },
  { id: 'gmail', name: 'Gmail', scheme: 'googlegmail://', color: '#EA4335', iconText: 'GM' },
  { id: 'outlook', name: 'Outlook', scheme: 'ms-outlook://', color: '#0078D4', iconText: 'OL' },
  { id: 'spark', name: 'Spark', scheme: 'readdle-spark://', color: '#3273DC', iconText: 'SPK' },
  { id: 'yahoo', name: 'Yahoo Mail', scheme: 'ymail://', color: '#6001D2', iconText: 'Y!' },
  { id: 'proton', name: 'ProtonMail', scheme: 'protonmail://', color: '#6D4AFF', iconText: 'PM' },
  { id: 'libero', name: 'Libero Mail', scheme: 'liberomail://', color: '#002B49', iconText: 'LIB' }
];

export const EmailQuickAccessCard = () => {
  const [shortcuts, setShortcuts] = useState(() => {
    try {
      const raw = localStorage.getItem('flow_email_shortcuts_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    // Default con Apple Mail e Gmail
    return [
      { id: 'apple-mail', name: 'Apple Mail', scheme: 'message://', color: '#007AFF', iconText: 'Mail' },
      { id: 'gmail', name: 'Gmail', scheme: 'googlegmail://', color: '#EA4335', iconText: 'GM' }
    ];
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState(EMAIL_PRESETS[0].id);
  const [customName, setCustomName] = useState('');
  const [customScheme, setCustomScheme] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('flow_email_shortcuts_v1', JSON.stringify(shortcuts));
    } catch {}
  }, [shortcuts]);

  const handleOpenApp = (scheme) => {
    if (!scheme) return;
    try {
      window.location.href = scheme;
    } catch (e) {
      console.warn("Impossibile aprire il deep link email:", e);
      window.open(scheme, '_self');
    }
  };

  const handleAddEmail = () => {
    const preset = EMAIL_PRESETS.find(p => p.id === selectedPresetId);
    const finalName = customName.trim() || (preset ? preset.name : 'Email');
    const finalScheme = customScheme.trim() || (preset ? preset.scheme : 'message://');

    if (shortcuts.some(s => s.name.toLowerCase() === finalName.toLowerCase())) {
      message.warning(`${finalName} è già presente nei tuoi accessi rapidi.`);
      return;
    }

    const newShortcut = {
      id: `email_${Date.now()}`,
      name: finalName,
      scheme: finalScheme,
      color: preset?.color || '#007AFF',
      iconText: finalName.slice(0, 3).toUpperCase()
    };

    setShortcuts(prev => [...prev, newShortcut]);
    setModalOpen(false);
    setCustomName('');
    setCustomScheme('');
    message.success(`${finalName} aggiunta!`);
  };

  const handleRemove = (idx, name) => {
    const updated = shortcuts.filter((_, i) => i !== idx);
    setShortcuts(updated);
    if (updated.length === 0) setIsEditingMode(false);
    message.info(`${name} rimossa.`);
  };

  return (
    <div className="apple-card rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Mail className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F] dark:text-white block">
              Accesso Rapido Email
            </span>
            <p className="text-xs text-[#86868B] dark:text-gray-400">
              Apri istantaneamente l'app email del tuo smartphone con un tocco.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {shortcuts.length > 0 && (
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
              setSelectedPresetId(EMAIL_PRESETS[0].id);
              setCustomName('');
              setCustomScheme('');
              setModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-2xl bg-[#007AFF] hover:bg-blue-600 active:scale-95 text-white font-bold text-xs shadow-sm transition cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Aggiungi Email</span>
          </button>
        </div>
      </div>

      {/* Griglia Icone Native App Email */}
      <div className="pt-2">
        {shortcuts.length === 0 ? (
          <div className="p-8 text-center bg-gray-50/70 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 text-xs text-[#86868B]">
            Nessuna app email configurata. Tocca <strong>"Aggiungi Email"</strong> per configurarla.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
            {shortcuts.map((app, idx) => (
              <div key={app.id || idx} className="relative flex flex-col items-center group">
                <button
                  type="button"
                  onClick={() => !isEditingMode && handleOpenApp(app.scheme)}
                  disabled={isEditingMode}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center font-bold text-white shadow-sm border border-black/5 dark:border-white/10 transition-all select-none ${
                    isEditingMode
                      ? 'ring-2 ring-amber-400 opacity-90 cursor-default'
                      : 'hover:shadow-md hover:scale-105 active:scale-95 cursor-pointer'
                  }`}
                  style={{ backgroundColor: app.color || '#007AFF' }}
                  title={`Apri ${app.name}`}
                >
                  <Inbox className="w-5 h-5 mb-0.5" strokeWidth={1.75} />
                  <span className="text-[10px] tracking-tight">{app.iconText || 'MAIL'}</span>
                </button>

                <span className="text-[11px] mt-1.5 font-semibold text-[#1D1D1F] dark:text-white truncate max-w-[80px] text-center">
                  {app.name}
                </span>

                {isEditingMode && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(idx, app.name);
                    }}
                    className="mt-1 px-2.5 py-0.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold shadow-xs active:scale-95 cursor-pointer transition animate-fade-in"
                  >
                    Elimina
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Aggiungi App Email */}
      <Modal
        title="Aggiungi App Email"
        open={modalOpen}
        onOk={handleAddEmail}
        onCancel={() => setModalOpen(false)}
        okText="Aggiungi"
        cancelText="Annulla"
        centered
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block mb-1.5">
              Scegli App Email o Client
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EMAIL_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedPresetId(p.id);
                    setCustomName(p.name);
                    setCustomScheme(p.scheme);
                  }}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                    selectedPresetId === p.id
                      ? 'border-[#007AFF] bg-blue-50 dark:bg-blue-950/40 text-[#007AFF]'
                      : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="text-xs font-bold truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
              Nome Visualizzato
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="es. Gmail Lavoro"
              className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
              Schema URL Nativo (Deep Link)
            </label>
            <input
              type="text"
              value={customScheme}
              onChange={(e) => setCustomScheme(e.target.value)}
              placeholder="es. googlegmail://"
              className="w-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

