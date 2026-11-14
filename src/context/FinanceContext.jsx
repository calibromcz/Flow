import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../supabaseClient';
import { message } from 'antd';
import { parseAmount } from '../utils/numberUtils';

const FinanceContext = createContext();

export const DEFAULT_FALLBACK_CATEGORIES = {
  expense: [
    { id: 'exp_food', name: 'Alimentari & Spesa', icon: 'Utensils', color: '#FF9500', monthly_limit: null },
    { id: 'exp_home', name: 'Casa & Affitto', icon: 'Home', color: '#007AFF', monthly_limit: null },
    { id: 'exp_transport', name: 'Trasporti & Auto', icon: 'Car', color: '#5856D6', monthly_limit: null },
    { id: 'exp_shopping', name: 'Shopping', icon: 'ShoppingBag', color: '#AF52DE', monthly_limit: null },
    { id: 'exp_leisure', name: 'Svago & Ristoranti', icon: 'Sparkles', color: '#FF2D55', monthly_limit: null },
    { id: 'exp_bills', name: 'Bollette & Utenze', icon: 'Zap', color: '#FF3B30', monthly_limit: null },
    { id: 'exp_health', name: 'Salute & Benessere', icon: 'HeartPulse', color: '#30B0C7', monthly_limit: null },
    { id: 'exp_tech', name: 'Tecnologia & Servizi', icon: 'Smartphone', color: '#5AC8FA', monthly_limit: null },
  ],
  income: [
    { id: 'inc_salary', name: 'Stipendio', icon: 'Briefcase', color: '#32B87A' },
    { id: 'inc_extra', name: 'Extra & Freelance', icon: 'Laptop', color: '#007AFF' },
    { id: 'inc_investments', name: 'Investimenti & Dividendi', icon: 'TrendingUp', color: '#5856D6' },
    { id: 'inc_gift', name: 'Regali & Rimborsi', icon: 'Gift', color: '#FF9500' },
  ]
};

export const DEFAULT_WALLETS = [
  { id: 'main', name: 'Principale', type: 'personal', icon: 'Wallet', color: '#007AFF' }
];

// PRODUZIONE PULITA: nessun dato mock/finto iniziale
const SEED_DEMO_TRANSACTIONS = [];
const SEED_DEMO_GOALS = [];

export const FinanceProvider = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_FALLBACK_CATEGORIES);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [amortizations, setAmortizations] = useState([]);
  
  // 1. STATO MULTI-PORTAFOGLIO / MULTI-CONTO (Personal, Shared, Savings)
  const [wallets, setWallets] = useState(() => {
    try {
      const raw = localStorage.getItem('flow_wallets_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_WALLETS;
  });

  const [activeWalletId, setActiveWalletId] = useState('all'); // 'all' oppure specifico wallet.id

  const [savingTargetPercent, setSavingTargetPercent] = useState(() => {
    try {
      const saved = localStorage.getItem('flow_savings_target_pct');
      return saved !== null && !isNaN(Number(saved)) ? Number(saved) : 20;
    } catch {
      return 20;
    }
  });
  const [currentDate, setCurrentDate] = useState(new Date()); // Data reale corrente
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setProfile(null);
      setCategories(DEFAULT_FALLBACK_CATEGORIES);
      setSavingsGoals([]);
      setLoading(false);
      return;
    }

    const loadUserData = async () => {
      setLoading(true);

      try {
        const [profileRes, categoriesRes, transactionsRes, goalsRes] = await Promise.allSettled([
          supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
          supabase.from('categories').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
          supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }),
          supabase.from('savings_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: true })
        ]);

        if (profileRes.status === 'fulfilled' && profileRes.value.data) {
          setProfile(profileRes.value.data);
          const localSavedPct = localStorage.getItem('flow_savings_target_pct');
          if (localSavedPct !== null && !isNaN(Number(localSavedPct))) {
            setSavingTargetPercent(Number(localSavedPct));
          } else if (profileRes.value.data.savings_target_percent) {
            setSavingTargetPercent(profileRes.value.data.savings_target_percent);
            try { localStorage.setItem('flow_savings_target_pct', String(profileRes.value.data.savings_target_percent)); } catch {}
          }
        } else {
          const localSavedPct = localStorage.getItem('flow_savings_target_pct');
          const currentPct = localSavedPct !== null && !isNaN(Number(localSavedPct)) ? Number(localSavedPct) : 20;
          setProfile({ id: user.id, full_name: user.name, savings_target_percent: currentPct });
        }

        if (categoriesRes.status === 'fulfilled' && categoriesRes.value.data && categoriesRes.value.data.length > 0) {
          const grouped = { expense: [], income: [] };
          categoriesRes.value.data.forEach(cat => {
            if (cat.type === 'income' || cat.type === 'expense') grouped[cat.type].push(cat);
          });
          setCategories(grouped);
        } else {
          const localCats = localStorage.getItem(`flusso_prod_v1_categories_${user.id}`);
          setCategories(localCats ? JSON.parse(localCats) : DEFAULT_FALLBACK_CATEGORIES);
        }

        if (transactionsRes.status === 'fulfilled' && transactionsRes.value.data && transactionsRes.value.data.length > 0) {
          setTransactions(transactionsRes.value.data);
        } else {
          const localTx = localStorage.getItem(`flusso_prod_v1_tx_${user.id}`);
          setTransactions(localTx ? JSON.parse(localTx) : []);
        }

        if (goalsRes.status === 'fulfilled' && goalsRes.value.data && goalsRes.value.data.length > 0) {
          setSavingsGoals(goalsRes.value.data);
        } else {
          const localGoals = localStorage.getItem(`flusso_prod_v1_goals_${user.id}`);
          setSavingsGoals(localGoals ? JSON.parse(localGoals) : []);
        }

        // Ammortamenti spesa (Finanziaria personale)
        try {
          const localAmort = localStorage.getItem(`flow_amortizations_${user.id}`);
          setAmortizations(localAmort ? JSON.parse(localAmort) : []);
        } catch {
          setAmortizations([]);
        }
      } catch (err) {
        console.warn("Fallback dati locali:", err);
        setProfile({ id: user.id, full_name: user.name, savings_target_percent: 30 });
        const localCats = localStorage.getItem(`flusso_prod_v1_categories_${user.id}`);
        setCategories(localCats ? JSON.parse(localCats) : DEFAULT_FALLBACK_CATEGORIES);
        const localTx = localStorage.getItem(`flusso_prod_v1_tx_${user.id}`);
        setTransactions(localTx ? JSON.parse(localTx) : []);
        const localGoals = localStorage.getItem(`flusso_prod_v1_goals_${user.id}`);
        setSavingsGoals(localGoals ? JSON.parse(localGoals) : []);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  const persistLocalTx = (txList) => {
    if (user) localStorage.setItem(`flusso_prod_v1_tx_${user.id}`, JSON.stringify(txList));
  };

  const persistLocalGoals = (goalList) => {
    if (user) localStorage.setItem(`flusso_prod_v1_goals_${user.id}`, JSON.stringify(goalList));
  };

  const persistLocalAmortizations = (amortList) => {
    if (user) localStorage.setItem(`flow_amortizations_${user.id}`, JSON.stringify(amortList));
  };

  const persistLocalCategories = (catObj) => {
    if (user) localStorage.setItem(`flusso_prod_v1_categories_${user.id}`, JSON.stringify(catObj));
  };

  // Funzione per azzerare e pulire tutti i movimenti (Reset Totale)
  const resetAllUserData = async () => {
    if (!user) return;
    try {
      // 1. Pulizia Supabase
      await Promise.allSettled([
        supabase.from('transactions').delete().eq('user_id', user.id),
        supabase.from('savings_goals').delete().eq('user_id', user.id)
      ]);

      // 2. Pulizia LocalStorage
      localStorage.removeItem(`flusso_prod_v1_tx_${user.id}`);
      localStorage.removeItem(`flusso_prod_v1_goals_${user.id}`);

      // 3. Reset Stati React a 0
      setTransactions([]);
      setSavingsGoals([]);
      message.success("Tutti i movimenti e salvadanai sono stati azzerati con successo!");
    } catch (err) {
      console.error(err);
      message.error("Errore durante l'azzeramento dei dati.");
    }
  };

  // Funzionalità #3: Aggiorna Tetto Massimo Mensile (monthly_limit) su Supabase
  const updateCategoryMonthlyLimit = async (categoryName, limit) => {
    const numericLimit = limit === null || limit === '' ? null : Number(limit);

    const updated = {
      ...categories,
      expense: categories.expense.map(c => 
        c.name === categoryName ? { ...c, monthly_limit: numericLimit } : c
      )
    };
    setCategories(updated);
    persistLocalCategories(updated);

    if (user?.isCloud) {
      try {
        await supabase
          .from('categories')
          .update({ monthly_limit: numericLimit })
          .eq('user_id', user.id)
          .eq('name', categoryName);
      } catch (err) {
        console.warn("Errore aggiornamento limite categoria su Supabase:", err);
      }
    }

    message.success(
      numericLimit !== null
        ? `Tetto massimo per "${categoryName}" impostato a ${numericLimit} €`
        : `Tetto rimosso per "${categoryName}"`
    );
  };

  // Gestione persistenza portafogli
  const persistWallets = (updatedWallets) => {
    setWallets(updatedWallets);
    try {
      localStorage.setItem('flow_wallets_v1', JSON.stringify(updatedWallets));
    } catch (e) {
      console.warn("Errore salvataggio portafogli:", e);
    }
  };

  const addWallet = (walletData) => {
    const newWallet = {
      id: 'wallet_' + Date.now(),
      name: walletData.name.trim(),
      type: walletData.type || 'personal', // 'personal' | 'shared'
      icon: walletData.icon || 'Wallet',
      color: walletData.color || (walletData.type === 'shared' ? '#AF52DE' : '#007AFF'),
      createdAt: new Date().toISOString()
    };
    const updated = [...wallets, newWallet];
    persistWallets(updated);
    setActiveWalletId(newWallet.id);
    message.success(`Conto "${newWallet.name}" creato!`);
    return newWallet;
  };

  const deleteWallet = (walletId) => {
    if (walletId === 'main') {
      message.error("Non puoi eliminare il Conto Principale.");
      return;
    }
    const updated = wallets.filter(w => w.id !== walletId);
    persistWallets(updated);
    if (activeWalletId === walletId) {
      setActiveWalletId('all');
    }
    message.info("Conto rimosso.");
  };

  const addTransaction = async (txData) => {
    const parsedAmt = parseAmount(txData.amount);
    const assignedWalletId = txData.walletId || (activeWalletId !== 'all' ? activeWalletId : 'main');

    const newTx = {
      id: 'tx_' + Date.now(),
      user_id: user?.id,
      walletId: assignedWalletId,
      isSplit50: Boolean(txData.isSplit50),
      rawAmount: txData.rawAmount !== undefined ? parseAmount(txData.rawAmount) : parsedAmt,
      type: txData.type,
      amount: parsedAmt,
      category: txData.category,
      note: txData.note || '',
      date: txData.date || new Date().toISOString().split('T')[0],
      is_recurring: Boolean(txData.is_recurring),
      recurring_day: txData.recurring_day || (txData.date ? new Date(txData.date).getDate() : new Date().getDate()),
      created_at: new Date().toISOString()
    };

    const updated = [newTx, ...transactions];
    setTransactions(updated);
    persistLocalTx(updated);

    if (user?.isCloud) {
      try {
        const { data } = await supabase.from('transactions').insert([{
          user_id: user.id,
          type: newTx.type,
          amount: newTx.amount,
          category: newTx.category,
          note: newTx.note,
          date: newTx.date,
          is_recurring: newTx.is_recurring,
          recurring_day: newTx.recurring_day
        }]).select().single();

        if (data) {
          setTransactions(prev => prev.map(t => t.id === newTx.id ? data : t));
        }
      } catch (err) {
        console.warn("Errore inserimento Supabase:", err);
      }
    }

    return newTx;
  };

  const deleteTransaction = async (id) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    persistLocalTx(updated);

    if (user?.isCloud) {
      try {
        await supabase.from('transactions').delete().eq('id', id);
      } catch {}
    }
  };

  const toggleRecurring = async (id, currentVal) => {
    const newVal = !currentVal;
    const updated = transactions.map(t => t.id === id ? { ...t, is_recurring: newVal } : t);
    setTransactions(updated);
    persistLocalTx(updated);

    if (user?.isCloud) {
      try {
        await supabase.from('transactions').update({ is_recurring: newVal }).eq('id', id);
      } catch {}
    }
    message.success(newVal ? "Ricorrenza attivata" : "Ricorrenza disattivata");
  };

  const updateSavingTarget = async (newTarget) => {
    const val = Math.max(1, Math.min(99, Number(newTarget)));
    setSavingTargetPercent(val);
    try {
      localStorage.setItem('flow_savings_target_pct', String(val));
      if (user?.id) {
        localStorage.setItem(`flow_savings_target_pct_${user.id}`, String(val));
      }
    } catch (e) {
      console.warn("Errore salvataggio flow_savings_target_pct:", e);
    }

    if (user?.isCloud) {
      try {
        await supabase.from('profiles').update({ savings_target_percent: val }).eq('id', user.id);
      } catch {}
    }
  };

  const addCategory = async (type, catData) => {
    const newCat = {
      id: 'cat_' + Date.now(),
      name: catData.name,
      icon: catData.icon || 'Tag',
      color: catData.color || '#007AFF',
      monthly_limit: catData.monthly_limit || null,
      is_fixed: Boolean(catData.is_fixed),
      fixed_amount: catData.fixed_amount !== null && catData.fixed_amount !== undefined && catData.fixed_amount !== '' ? Number(catData.fixed_amount) : null,
      fixed_day: catData.fixed_day ? Number(catData.fixed_day) : 1,
      type
    };

    const updated = {
      ...categories,
      [type]: [...(categories[type] || []), newCat]
    };
    setCategories(updated);
    persistLocalCategories(updated);

    if (user?.isCloud) {
      try {
        await supabase.from('categories').insert([{
          user_id: user.id,
          type,
          name: newCat.name,
          icon: newCat.icon,
          color: newCat.color,
          monthly_limit: newCat.monthly_limit,
          is_fixed: newCat.is_fixed,
          fixed_amount: newCat.fixed_amount,
          fixed_day: newCat.fixed_day
        }]);
      } catch (err) {
        console.warn("Errore salvataggio categoria su Supabase:", err);
      }
    }

    return newCat;
  };

  const updateCategory = async (categoryName, catData) => {
    let targetType = catData.type;
    if (!targetType) {
      targetType = categories.expense?.some(c => c.name === categoryName) ? 'expense' : 'income';
    }

    const updated = {
      ...categories,
      [targetType]: (categories[targetType] || []).map(c => {
        if (c.name === categoryName) {
          return {
            ...c,
            ...catData,
            name: catData.name || c.name,
            icon: catData.icon || c.icon,
            color: catData.color || c.color,
            is_fixed: catData.is_fixed !== undefined ? Boolean(catData.is_fixed) : c.is_fixed,
            fixed_amount: catData.fixed_amount !== undefined ? (catData.fixed_amount ? Number(catData.fixed_amount) : null) : c.fixed_amount,
            fixed_day: catData.fixed_day !== undefined ? Number(catData.fixed_day) : c.fixed_day
          };
        }
        return c;
      })
    };

    setCategories(updated);
    persistLocalCategories(updated);

    if (user?.isCloud) {
      try {
        await supabase.from('categories').update({
          icon: catData.icon,
          color: catData.color,
          is_fixed: Boolean(catData.is_fixed),
          fixed_amount: catData.fixed_amount ? Number(catData.fixed_amount) : null,
          fixed_day: catData.fixed_day ? Number(catData.fixed_day) : 1
        }).eq('user_id', user.id).eq('name', categoryName);
      } catch (err) {
        console.warn("Errore aggiornamento categoria su Supabase:", err);
      }
    }
  };

  const addSavingsGoal = async (goalData) => {
    const newGoal = {
      id: 'goal_' + Date.now(),
      user_id: user?.id,
      title: goalData.title,
      target_amount: Number(goalData.target_amount),
      current_amount: Number(goalData.current_amount || 0),
      color: goalData.color || '#007AFF',
      icon: goalData.icon || 'Target'
    };

    const updated = [...savingsGoals, newGoal];
    setSavingsGoals(updated);
    persistLocalGoals(updated);

    if (user?.isCloud) {
      try {
        const { data } = await supabase.from('savings_goals').insert([newGoal]).select().single();
        if (data) {
          setSavingsGoals(prev => prev.map(g => g.id === newGoal.id ? data : g));
        }
      } catch {}
    }

    return newGoal;
  };

  const depositToSavingsGoal = async (goalId, deltaAmount) => {
    const updated = savingsGoals.map(g => {
      if (g.id === goalId) {
        return {
          ...g,
          current_amount: Math.max(0, Number(g.current_amount || 0) + Number(deltaAmount))
        };
      }
      return g;
    });

    setSavingsGoals(updated);
    persistLocalGoals(updated);

    if (user?.isCloud) {
      const g = updated.find(x => x.id === goalId);
      if (g) {
        try {
          await supabase.from('savings_goals').update({ current_amount: g.current_amount }).eq('id', goalId);
        } catch {}
      }
    }
  };

  const deleteSavingsGoal = async (goalId) => {
    const updated = savingsGoals.filter(g => g.id !== goalId);
    setSavingsGoals(updated);
    persistLocalGoals(updated);

    if (user?.isCloud) {
      try {
        await supabase.from('savings_goals').delete().eq('id', goalId);
      } catch {}
    }
  };

  // --- AMMORTAMENTI SPESA (FINANZIARIA PERSONALE) ---
  const addAmortization = (data) => {
    const newAmort = {
      id: 'amort_' + Date.now(),
      title: data.title.trim(),
      totalAmount: Number(data.totalAmount),
      installments: Number(data.installments || 1), // numero di rate
      paidInstallments: Number(data.paidInstallments || 0),
      startMonth: data.startMonth || new Date().toISOString().slice(0, 7), // YYYY-MM
      category: data.category || 'Spesa Straordinaria',
      note: data.note || '',
      createdAt: new Date().toISOString()
    };
    const updated = [newAmort, ...amortizations];
    setAmortizations(updated);
    persistLocalAmortizations(updated);
    message.success(`Ammortamento per "${newAmort.title}" attivato!`);
    return newAmort;
  };

  const updateAmortizationProgress = (id, deltaInstallments) => {
    const updated = amortizations.map(a => {
      if (a.id === id) {
        const nextPaid = Math.max(0, Math.min(a.installments, a.paidInstallments + deltaInstallments));
        return { ...a, paidInstallments: nextPaid };
      }
      return a;
    });
    setAmortizations(updated);
    persistLocalAmortizations(updated);
  };

  const deleteAmortization = (id) => {
    const updated = amortizations.filter(a => a.id !== id);
    setAmortizations(updated);
    persistLocalAmortizations(updated);
    message.info("Ammortamento rimosso.");
  };

  const prevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthLabel = useMemo(() => {
    const months = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }, [currentDate]);

  const categoryMetaMap = useMemo(() => {
    const map = {};
    const all = [...(categories.expense || []), ...(categories.income || [])];
    all.forEach(c => {
      map[c.name] = { 
        id: c.id,
        name: c.name,
        type: c.type || (categories.expense?.some(e => e.name === c.name) ? 'expense' : 'income'),
        icon: c.icon, 
        color: c.color, 
        monthly_limit: c.monthly_limit,
        is_fixed: Boolean(c.is_fixed),
        fixed_amount: c.fixed_amount !== null && c.fixed_amount !== undefined ? Number(c.fixed_amount) : null,
        fixed_day: c.fixed_day ? Number(c.fixed_day) : 1
      };
    });
    return map;
  }, [categories]);

  // Helper per filtrare le transazioni in base al wallet selezionato
  // Retrocompatibilità totale: se tx.walletId manca, appartiene a 'main'
  const filterByActiveWallet = (txList) => {
    if (activeWalletId === 'all') return txList;
    return txList.filter(t => (t.walletId || 'main') === activeWalletId);
  };

  // Transazioni mese selezionato (filtrate per il wallet attivo)
  const monthlyTransactions = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthList = transactions.filter(t => {
      if (!t.date) return false;
      const [y, m] = t.date.split('-').map(Number);
      return y === year && (m - 1) === month;
    });

    return filterByActiveWallet(monthList);
  }, [transactions, currentDate, activeWalletId]);

  // Transazioni globali filtrate per il wallet attivo (per liste, recenti, etc.)
  const filteredTransactions = useMemo(() => {
    return filterByActiveWallet(transactions);
  }, [transactions, activeWalletId]);

  // Funzionalità #2: Calcolo Confronto Colpo d'Occhio (vs Mese Precedente a pari giorni)
  const previousMonthComparison = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Mese precedente
    const prevDate = new Date(year, month - 1, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonthIdx = prevDate.getMonth();

    // Massimo giorno registrato nel mese corrente fino a oggi
    const today = new Date();
    const isCurrentCalendarMonth = 
      today.getFullYear() === year && today.getMonth() === month;

    const maxDayToCheck = isCurrentCalendarMonth ? today.getDate() : 31;

    let currentPeriodExpense = 0;
    monthlyTransactions.forEach(t => {
      if (t.type === 'expense' && t.date) {
        const d = Number(t.date.split('-')[2]);
        if (d <= maxDayToCheck) {
          currentPeriodExpense += Number(t.amount || 0);
        }
      }
    });

    let prevPeriodExpense = 0;
    let prevPeriodHasData = false;
    transactions.forEach(t => {
      if (t.type === 'expense' && t.date) {
        const [y, m, d] = t.date.split('-').map(Number);
        if (y === prevYear && (m - 1) === prevMonthIdx && d <= maxDayToCheck) {
          prevPeriodExpense += Number(t.amount || 0);
          prevPeriodHasData = true;
        }
      }
    });

    if (!prevPeriodHasData || prevPeriodExpense === 0) {
      return null;
    }

    const diffPercent = ((currentPeriodExpense - prevPeriodExpense) / prevPeriodExpense) * 100;
    return {
      currentPeriodExpense,
      prevPeriodExpense,
      diffPercent,
      isLower: diffPercent < 0,
      daysChecked: maxDayToCheck
    };
  }, [monthlyTransactions, transactions, currentDate]);

  // Calcolo Chiusura Mese Precedente per Rollover Intelligente
  const previousMonthSummary = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const prevDate = new Date(year, month - 1, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonthIdx = prevDate.getMonth();

    let prevIncome = 0;
    let prevExpense = 0;

    transactions.forEach(t => {
      if (!t.date) return;
      const [y, m] = t.date.split('-').map(Number);
      if (y === prevYear && (m - 1) === prevMonthIdx) {
        const amt = Number(t.amount) || 0;
        if (t.type === 'income') prevIncome += amt;
        else prevExpense += amt;
      }
    });

    const netCashflow = prevIncome - prevExpense;
    const key = `${prevYear}_${String(prevMonthIdx + 1).padStart(2, '0')}`;
    const monthName = prevDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

    return {
      year: prevYear,
      monthIndex: prevMonthIdx,
      key,
      monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      income: prevIncome,
      expense: prevExpense,
      netCashflow: Math.round(netCashflow * 100) / 100
    };
  }, [transactions, currentDate]);

  // Metriche mensili
  const monthlyMetrics = useMemo(() => {
    let income = 0;
    let expense = 0;
    const categoryTotals = {};

    monthlyTransactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        income += amt;
      } else {
        expense += amt;
        const meta = categoryMetaMap[t.category] || { icon: 'Tag', color: '#007AFF', monthly_limit: null };
        if (!categoryTotals[t.category]) {
          categoryTotals[t.category] = {
            total: 0,
            icon: meta.icon,
            color: meta.color,
            monthly_limit: meta.monthly_limit || null
          };
        }
        categoryTotals[t.category].total += amt;
      }
    });

    const safeIncome = Number(income) || 0;
    const safeExpenses = Number(expense) || 0;
    const safeCashflow = safeIncome - safeExpenses;
    const netSavings = safeCashflow;
    const savingsRate = safeIncome > 0 ? Math.max(0, (netSavings / safeIncome) * 100) : 0;
    const targetAmount = (safeIncome * (Number(savingTargetPercent) || 0)) / 100;
    const progressToTarget = targetAmount > 0 ? Math.min(100, Math.max(0, (netSavings / targetAmount) * 100)) : 0;

    // Totale fondi congelati nei Salvadanai / Freezer (tracciato per il widget Salvadanai)
    const totalLockedInGoals = (savingsGoals || []).reduce((sum, g) => sum + (Number(g?.current_amount) || 0), 0);

    // 1. LA BUSSOLA DEVE CALCOLARE SOLO ED ESCLUSIVAMENTE IL CASHFLOW (Entrate - Uscite)
    // Ignora completamente il Salvadanaio, il Freezer e il Target di Risparmio
    const now = new Date();
    const isCurrentCalendarMonth = 
      now.getFullYear() === currentDate.getFullYear() && 
      now.getMonth() === currentDate.getMonth();

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    let remainingDays = Math.max(1, Number(daysInMonth) || 30);

    if (isCurrentCalendarMonth) {
      remainingDays = Math.max(1, (Number(daysInMonth) || 30) - (Number(now.getDate()) || 1) + 1);
    }

    const dailySpendable = safeCashflow > 0 && remainingDays > 0 ? Math.round((safeCashflow / remainingDays) * 100) / 100 : 0;
    const remainingMonthlyBudget = Math.max(0, safeCashflow);

    const sortedCategories = Object.entries(categoryTotals)
      .map(([name, data]) => ({
        name,
        total: data.total,
        icon: data.icon,
        color: data.color,
        monthly_limit: data.monthly_limit,
        percentage: expense > 0 ? (data.total / expense) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);

    const topCategory = sortedCategories[0] || null;
    const potentialSaving15 = topCategory ? topCategory.total * 0.15 : 0;

    // Fissi Mensili Unificati: Categorie Fisse + Movimenti Ricorrenti
    const fixedCategoriesList = [
      ...(categories.expense || []).filter(c => c.is_fixed).map(c => ({
        id: `fixed_cat_${c.name}`,
        category: c.name,
        type: 'expense',
        amount: c.fixed_amount || 0,
        recurring_day: c.fixed_day || 1,
        is_category_fixed: true,
        icon: c.icon,
        color: c.color,
        note: `Fisso Mensile (${c.name})`
      })),
      ...(categories.income || []).filter(c => c.is_fixed).map(c => ({
        id: `fixed_cat_${c.name}`,
        category: c.name,
        type: 'income',
        amount: c.fixed_amount || 0,
        recurring_day: c.fixed_day || 1,
        is_category_fixed: true,
        icon: c.icon,
        color: c.color,
        note: `Fisso Mensile (${c.name})`
      }))
    ];

    const recurringTxList = transactions.filter(t => t.is_recurring).map(t => ({
      ...t,
      is_category_fixed: false
    }));

    // Combina senza duplicati basati su categoria e tipo
    const combinedRecurringList = [...fixedCategoriesList];
    recurringTxList.forEach(tx => {
      const alreadyInFixed = combinedRecurringList.some(
        f => f.category.toLowerCase() === tx.category.toLowerCase() && f.type === tx.type
      );
      if (!alreadyInFixed) {
        combinedRecurringList.push(tx);
      }
    });

    return {
      income,
      expense,
      netSavings,
      savingsRate,
      targetAmount,
      progressToTarget,
      remainingMonthlyBudget,
      remainingDays,
      dailySpendable,
      categoryTotals: sortedCategories,
      topCategory,
      potentialSaving15,
      recurringList: combinedRecurringList,
      fixedCategories: fixedCategoriesList,
      totalLockedInGoals
    };
  }, [monthlyTransactions, savingTargetPercent, categoryMetaMap, currentDate, transactions, savingsGoals]);

  return (
    <FinanceContext.Provider
      value={{
        profile,
        transactions,
        monthlyTransactions,
        monthlyMetrics,
        categories,
        categoryMetaMap,
        previousMonthComparison,
        previousMonthSummary,
        savingTargetPercent,
        savingsGoals,
        currentDate,
        monthLabel,
        loading,
        prevMonth,
        nextMonth,
        addTransaction,
        deleteTransaction,
        toggleRecurring,
        addCategory,
        updateCategory,
        updateSavingTarget,
        updateCategoryMonthlyLimit,
        addSavingsGoal,
        depositToSavingsGoal,
        deleteSavingsGoal,
        amortizations,
        addAmortization,
        updateAmortizationProgress,
        deleteAmortization,
        resetAllUserData,
        // Multi-portafoglio / Multi-conto
        wallets,
        activeWalletId,
        setActiveWalletId,
        addWallet,
        deleteWallet,
        filteredTransactions
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => useContext(FinanceContext);
