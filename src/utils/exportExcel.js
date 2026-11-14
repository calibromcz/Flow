import * as XLSX from 'xlsx';

/**
 * Esporta il resoconto mensile completo in formato Microsoft Excel (.xlsx)
 * con 3 fogli di lavoro formattati:
 * 1. Riepilogo Mese (KPI e Salvadanai)
 * 2. Dettaglio Movimenti (con importi numerici e totali)
 * 3. Spese per Categoria (con percentuali e risparmio potenziale 15%)
 */
export const exportMonthlyReportExcel = ({
  monthLabel,
  currentDate,
  userName = 'Utente FLOW',
  monthlyTransactions = [],
  monthlyMetrics = {},
  savingTargetPercent = 30,
  savingsGoals = []
}) => {
  const wb = XLSX.utils.book_new();

  // =========================================================================
  // FOGLIO 1: Riepilogo Mese
  // =========================================================================
  const income = Number(monthlyMetrics.income || 0);
  const expense = Number(monthlyMetrics.expense || 0);
  const netSavings = Number(monthlyMetrics.netSavings || 0);
  const savingsRate = Number(monthlyMetrics.savingsRate || 0);
  const targetAmount = Number(monthlyMetrics.targetAmount || 0);
  const dailySpendable = Number(monthlyMetrics.dailySpendable || 0);
  const remainingDays = monthlyMetrics.remainingDays || 0;
  const isTargetAchieved = savingsRate >= savingTargetPercent;

  const exportDateStr = new Date().toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const sheet1Data = [
    ['FLOW - FINANZA PERSONALE', ''],
    ['Resoconto Mensile Ufficiale', ''],
    ['Mese di riferimento:', monthLabel],
    ['Utente:', userName],
    ['Data di esportazione:', exportDateStr],
    ['', ''],
    ['INDICATORI CHIAVE (KPI)', 'VALORE'],
    ['Totale Entrate (€)', income],
    ['Totale Uscite (€)', expense],
    ['Risparmio Netto (€)', netSavings],
    ['% Risparmio Raggiunta', `${savingsRate.toFixed(1)}%`],
    ['% Target Risparmio Obiettivo', `${savingTargetPercent}%`],
    ['Importo Target Obiettivo (€)', targetAmount],
    ['Stato Obiettivo Risparmio', isTargetAchieved ? 'Raggiunto' : 'Sotto il target'],
    ['Bussola Giornaliera (€ / giorno rimasto)', dailySpendable > 0 ? dailySpendable : 0],
    ['Giorni Rimasti nel Mese', remainingDays],
    ['', ''],
    ['SALVADANAI OBIETTIVO ATTIVI', 'STATO AVANZAMENTO']
  ];

  if (savingsGoals && savingsGoals.length > 0) {
    sheet1Data.push(['Titolo Obiettivo', 'Importo Attuale (€)', 'Target (€)', '% Completata', 'Mancano (€)']);
    savingsGoals.forEach(g => {
      const cur = Number(g.current_amount || 0);
      const tar = Number(g.target_amount || 1);
      const pct = Math.min(100, Math.round((cur / tar) * 100));
      const rem = Math.max(0, tar - cur);
      sheet1Data.push([g.title, cur, tar, `${pct}%`, rem]);
    });
  } else {
    sheet1Data.push(['Nessun salvadanaio attivo', '']);
  }

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  ws1['!cols'] = [
    { wch: 35 },
    { wch: 25 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 }
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Riepilogo Mese');

  // =========================================================================
  // FOGLIO 2: Dettaglio Movimenti
  // =========================================================================
  // Ordina per data crescente per visualizzazione contabile pulita
  const sortedTx = [...monthlyTransactions].sort((a, b) => new Date(a.date) - new Date(b.date));

  const sheet2Header = [
    'Data',
    'Tipo',
    'Categoria',
    'Descrizione / Nota',
    'Ricorrente Mensile',
    'Importo (€)'
  ];

  const sheet2Rows = sortedTx.map(t => {
    let formattedDate = t.date;
    try {
      const d = new Date(t.date);
      formattedDate = d.toLocaleDateString('it-IT');
    } catch {}

    const isIncome = t.type === 'income';
    // Importi numerici reali: positivi per entrate, negativi per uscite
    const signedAmount = isIncome ? Number(t.amount) : -Number(t.amount);

    return [
      formattedDate,
      isIncome ? 'Entrata' : 'Uscita',
      t.category,
      t.note || '-',
      t.is_recurring ? 'Sì' : 'No',
      signedAmount
    ];
  });

  // Riga finale con totale netto del mese
  const totalNet = sheet2Rows.reduce((acc, row) => acc + Number(row[5] || 0), 0);
  const sheet2Data = [
    sheet2Header,
    ...sheet2Rows,
    ['', '', '', '', 'TOTALE NETTO MESE (€):', totalNet]
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  ws2['!cols'] = [
    { wch: 15 },
    { wch: 12 },
    { wch: 28 },
    { wch: 35 },
    { wch: 20 },
    { wch: 18 }
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Dettaglio Movimenti');

  // =========================================================================
  // FOGLIO 3: Spese per Categoria
  // =========================================================================
  const categoryStats = {};
  monthlyTransactions.forEach(t => {
    if (t.type === 'expense') {
      const cat = t.category || 'Altro';
      if (!categoryStats[cat]) {
        categoryStats[cat] = {
          count: 0,
          total: 0
        };
      }
      categoryStats[cat].count += 1;
      categoryStats[cat].total += Number(t.amount || 0);
    }
  });

  const sortedCatList = Object.entries(categoryStats)
    .map(([category, data]) => ({
      category,
      count: data.count,
      total: data.total,
      percent: expense > 0 ? (data.total / expense) * 100 : 0,
      saving15: data.total * 0.15
    }))
    .sort((a, b) => b.total - a.total);

  const sheet3Header = [
    'Categoria',
    'Numero Operazioni',
    'Totale Speso (€)',
    '% sul Totale Uscite',
    'Risparmio Potenziale (-15%) (€)'
  ];

  const sheet3Rows = sortedCatList.map(c => [
    c.category,
    c.count,
    c.total,
    `${c.percent.toFixed(1)}%`,
    Number(c.saving15.toFixed(2))
  ]);

  const sheet3Data = [
    sheet3Header,
    ...sheet3Rows,
    ['', '', '', '', ''],
    ['TOTALE USCITE:', monthlyTransactions.filter(t => t.type === 'expense').length, expense, '100%', Number((expense * 0.15).toFixed(2))]
  ];

  const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
  ws3['!cols'] = [
    { wch: 30 },
    { wch: 20 },
    { wch: 18 },
    { wch: 22 },
    { wch: 32 }
  ];
  XLSX.utils.book_append_sheet(wb, ws3, 'Spese per Categoria');

  // =========================================================================
  // Generazione e Download del File .xlsx
  // =========================================================================
  const sanitizedMonth = monthLabel.replace(/\s+/g, '_');
  const filename = `FLOW_Resoconto_${sanitizedMonth}.xlsx`;
  XLSX.writeFile(wb, filename);

  return filename;
};

