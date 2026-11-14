import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const MONTH_NAMES = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const formatCurrency = (val) => {
  return Number(val || 0).toLocaleString('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' €';
};

/**
 * Genera ed esporta il Report Mensile FLOW in formato PDF (Stile Apple Cupertino)
 */
export const exportMonthlyReportPdf = ({
  currentMonth, // Data / stringa / Date object per il mese
  monthlyTransactions = [],
  totals = { income: 0, expense: 0, netSavings: 0 },
  categories = [],
  savingsGoals = [],
  fixedExpenses = [],
  dailyBudget = null,
  userName = 'Utente'
}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const dateObj = currentMonth ? new Date(currentMonth) : new Date();
  const monthName = MONTH_NAMES[dateObj.getMonth()] || 'Mese';
  const year = dateObj.getFullYear();
  const titlePeriod = `${monthName} ${year}`;

  const income = totals.income || 0;
  const expense = totals.expense || 0;
  const cashflow = income - expense;
  const netSavings = totals.netSavings || cashflow;
  const savingsRate = income > 0 ? ((netSavings / income) * 100).toFixed(1) : '0.0';

  // --- HEADER UFFICIALE FLOW ---
  // Logo circolare vettoriale (simmetrico con i colori ufficiali)
  const logoCenterX = margin + 7;
  const logoCenterY = margin + 7;
  const logoRadius = 6;

  // Arco Rosso Uscite (sinistra)
  doc.setDrawColor(242, 84, 73); // #F25449
  doc.setLineWidth(1.2);
  doc.circle(logoCenterX, logoCenterY, logoRadius, 'S');

  // Decorazione arco interno / accento
  doc.setDrawColor(50, 184, 122); // #32B87A
  doc.setLineWidth(1.4);
  // disegniamo un arco/punto verde
  doc.circle(logoCenterX + 2, logoCenterY - 2, 2.5, 'S');

  // Testo FLOW
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(29, 29, 31); // #1D1D1F
  doc.text('F L O W', margin + 17, margin + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(134, 134, 139); // #86868B
  doc.text('Personal Finance & Wealth Report', margin + 17, margin + 11.5);

  // Dettagli a destra (Periodo, Profilo, Data)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(29, 29, 31);
  doc.text(titlePeriod, pageWidth - margin, margin + 5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(134, 134, 139);
  const nowStr = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  doc.text(`Profilo: ${userName}  •  Generato il: ${nowStr}`, pageWidth - margin, margin + 10.5, { align: 'right' });

  // Linea divisoria elegante
  doc.setDrawColor(229, 229, 234); // #E5E5EA
  doc.setLineWidth(0.4);
  doc.line(margin, margin + 15, pageWidth - margin, margin + 15);

  // --- 4 KPI CARDS AFFIANCATE ---
  const kpiY = margin + 18;
  const kpiGap = 3.5;
  const kpiWidth = (pageWidth - (margin * 2) - (kpiGap * 3)) / 4;
  const kpiHeight = 22;

  const kpis = [
    {
      label: 'TOTALE ENTRATE',
      value: `+ ${formatCurrency(income)}`,
      sub: `${monthlyTransactions.filter(t => t.type === 'income').length} accrediti`,
      valColor: [50, 184, 122], // Verde
      bg: [248, 252, 249]
    },
    {
      label: 'TOTALE USCITE',
      value: `- ${formatCurrency(expense)}`,
      sub: `${monthlyTransactions.filter(t => t.type === 'expense').length} addebiti`,
      valColor: [242, 84, 73], // Rosso
      bg: [253, 248, 248]
    },
    {
      label: 'CASHFLOW NETTO',
      value: `${cashflow >= 0 ? '+' : ''}${formatCurrency(cashflow)}`,
      sub: cashflow >= 0 ? 'Flusso positivo' : 'Disavanzo del mese',
      valColor: cashflow >= 0 ? [50, 184, 122] : [242, 84, 73],
      bg: cashflow >= 0 ? [245, 251, 247] : [254, 246, 246]
    },
    {
      label: 'TASSO RISPARMIO',
      value: `${savingsRate}%`,
      sub: dailyBudget ? `Bussola: ${formatCurrency(dailyBudget)}/g` : `Saldo: ${formatCurrency(netSavings)}`,
      valColor: [0, 122, 255], // Apple Blue
      bg: [246, 250, 255]
    }
  ];

  kpis.forEach((kpi, idx) => {
    const x = margin + idx * (kpiWidth + kpiGap);
    // Background card arrotondata
    doc.setFillColor(kpi.bg[0], kpi.bg[1], kpi.bg[2]);
    doc.setDrawColor(229, 229, 234);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, kpiY, kpiWidth, kpiHeight, 2.5, 2.5, 'FD');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(134, 134, 139);
    doc.text(kpi.label, x + 3.5, kpiY + 5.5);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(kpi.valColor[0], kpi.valColor[1], kpi.valColor[2]);
    doc.text(kpi.value, x + 3.5, kpiY + 12.5);

    // Subtext
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(110, 110, 115);
    doc.text(kpi.sub, x + 3.5, kpiY + 18);
  });

  let currentY = kpiY + kpiHeight + 6;

  // --- SEZIONE 1: RIPARTIZIONE SPESE PER CATEGORIA & FISSI MENSILI ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(29, 29, 31);
  doc.text('1. Ripartizione Spese e Fissi Mensili', margin, currentY);
  currentY += 2;

  // Calcolo totale per categoria
  const categoryTotals = {};
  monthlyTransactions.forEach(t => {
    if (t.type === 'expense') {
      const catName = t.category || 'Altro';
      categoryTotals[catName] = (categoryTotals[catName] || 0) + Number(t.amount || 0);
    }
  });

  const catRows = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([catName, sum]) => {
      const pct = expense > 0 ? ((sum / expense) * 100).toFixed(1) + '%' : '0%';
      // Controlla se fissa
      const isFixedCat = categories.some(c => c.name?.toLowerCase() === catName.toLowerCase() && c.is_fixed);
      const isFixedItem = fixedExpenses.some(f => f.name?.toLowerCase() === catName.toLowerCase());
      const fixedTag = (isFixedCat || isFixedItem) ? '📌 Fissa' : 'Variabile';
      return [catName, fixedTag, formatCurrency(sum), pct];
    });

  if (catRows.length === 0) {
    catRows.push(['Nessuna uscita registrata per questo mese', '-', '0,00 €', '0%']);
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Categoria', 'Tipo Spesa', 'Totale Speso', '% su Uscite']],
    body: catRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      font: 'helvetica',
      textColor: [29, 29, 31],
      lineColor: [235, 235, 240],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [245, 245, 247],
      textColor: [110, 110, 115],
      fontStyle: 'bold',
      lineColor: [225, 225, 230]
    },
    columnStyles: {
      0: { cellWidth: 'auto', fontStyle: 'bold' },
      1: { cellWidth: 32 },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 28, halign: 'right' }
    }
  });

  currentY = doc.lastAutoTable.finalY + 7;

  // --- SEZIONE 2: SALVADANAI OBIETTIVO (se presenti) ---
  if (savingsGoals && savingsGoals.length > 0) {
    // Controlla se c'è spazio sulla pagina
    if (currentY > pageHeight - 55) {
      doc.addPage();
      currentY = margin + 5;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(29, 29, 31);
    doc.text('2. Stato Salvadanai e Obiettivi di Risparmio', margin, currentY);
    currentY += 2;

    const goalRows = savingsGoals.map(g => {
      const current = Number(g.current_amount || g.currentAmount || 0);
      const target = Number(g.target_amount || g.targetAmount || 0);
      const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
      const remaining = Math.max(0, target - current);
      return [
        g.name || 'Salvadanaio',
        formatCurrency(current),
        formatCurrency(target),
        `${pct}%`,
        formatCurrency(remaining)
      ];
    });

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [['Obiettivo', 'Accantonato', 'Target', 'Completato', 'Rimanente']],
      body: goalRows,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2.2,
        font: 'helvetica',
        textColor: [29, 29, 31],
        lineColor: [235, 235, 240],
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: [245, 245, 247],
        textColor: [110, 110, 115],
        fontStyle: 'bold',
        lineColor: [225, 225, 230]
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'center' },
        4: { halign: 'right' }
      }
    });

    currentY = doc.lastAutoTable.finalY + 7;
  }

  // --- SEZIONE 3: ELENCO DETTAGLIATO DEI MOVIMENTI ---
  if (currentY > pageHeight - 50) {
    doc.addPage();
    currentY = margin + 5;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(29, 29, 31);
  doc.text(`3. Elenco Completo Movimenti (${monthlyTransactions.length})`, margin, currentY);
  currentY += 2;

  // Ordina per data decrescente
  const sortedTx = [...monthlyTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  const txRows = sortedTx.map(t => {
    const isInc = t.type === 'income';
    const d = t.date ? new Date(t.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
    const formattedAmt = `${isInc ? '+ ' : '- '}${formatCurrency(t.amount)}`;
    return [
      d,
      t.description || t.title || 'Movimento',
      t.category || '-',
      isInc ? 'Entrata' : 'Uscita',
      formattedAmt
    ];
  });

  if (txRows.length === 0) {
    txRows.push(['-', 'Nessun movimento registrato in questo mese', '-', '-', '0,00 €']);
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin, bottom: 15 },
    head: [['Data', 'Descrizione', 'Categoria', 'Tipo', 'Importo']],
    body: txRows,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      font: 'helvetica',
      textColor: [29, 29, 31],
      lineColor: [240, 240, 245],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [245, 245, 247],
      textColor: [110, 110, 115],
      fontStyle: 'bold',
      lineColor: [225, 225, 230]
    },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 'auto', fontStyle: 'medium' },
      2: { cellWidth: 32 },
      3: { cellWidth: 22 },
      4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      // Evidenzia colori per importi
      if (data.section === 'body' && data.column.index === 4) {
        const text = String(data.cell.raw || '');
        if (text.startsWith('+')) {
          data.cell.styles.textColor = [50, 184, 122]; // Verde smeraldo FLOW
        } else if (text.startsWith('-')) {
          data.cell.styles.textColor = [242, 84, 73]; // Rosso corallo FLOW
        }
      }
    },
    foot: [
      ['TOTALE MESE', `${monthlyTransactions.length} operazioni`, '', 'Cashflow Netto:', `${cashflow >= 0 ? '+' : ''}${formatCurrency(cashflow)}`]
    ],
    footStyles: {
      fillColor: [245, 245, 247],
      textColor: [29, 29, 31],
      fontStyle: 'bold',
      lineColor: [220, 220, 225]
    }
  });

  // --- FOOTER SU TUTTE LE PAGINE ---
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(160, 160, 165);

    // Linea sopra footer
    doc.setDrawColor(235, 235, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.text('FLOW • Gestione Finanze Personali ad Alta Precisione', margin, pageHeight - 6);
    doc.text(`Pagina ${i} di ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  // Download automatico del file PDF
  const filename = `FLOW_Report_${monthName}_${year}.pdf`;
  doc.save(filename);
};

