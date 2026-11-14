/**
 * Utility per la generazione di promemoria su Calendario
 * Supporta:
 * 1. File universale iCalendar (.ics) nativo per iOS (Apple Calendar), macOS e Android
 *    con ripetizione mensile automatica (RRULE) o data singola e notifiche push (VALARM).
 * 2. Link diretto per l'apertura su Google Calendar Web / App.
 */

const pad = (n) => String(n).padStart(2, '0');

export const formatUtcDate = (date) => {
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
};

export const getNextOccurrenceDate = (recurringDay = 1) => {
  const now = new Date();
  const day = Math.min(Math.max(1, parseInt(recurringDay, 10) || 1), 31);
  let target = new Date(now.getFullYear(), now.getMonth(), day, 9, 0, 0);

  if (target < now) {
    target = new Date(now.getFullYear(), now.getMonth() + 1, day, 9, 0, 0);
  }
  return target;
};

/**
 * Esporta un evento sul calendario del telefono (.ics standard per iPhone/Mac Apple Calendar & Android)
 * @param {Object} params
 * @param {string} params.title - Titolo dell'evento o nota
 * @param {number|string} [params.amount] - Importo in € (opzionale)
 * @param {string} [params.dateStr] - Data specifica YYYY-MM-DD
 * @param {number} [params.recurringDay] - Giorno del mese (1-31) se ricorrente
 * @param {boolean} [params.isRecurringMonthly] - Se ripetere ogni mese
 */
export const exportToPhoneCalendar = ({ 
  title = 'Promemoria FLOW', 
  amount, 
  dateStr, 
  timeStr = '09:00',
  recurringDay,
  isRecurringMonthly = false,
  note = ''
}) => {
  const nowUtc = formatUtcDate(new Date());

  let startDate;
  let recurrenceRule = '';

  const [hours, minutes] = (timeStr || '09:00').split(':').map(n => parseInt(n, 10) || 0);

  if (dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    startDate = new Date(y, m - 1, d, hours, minutes, 0);
  } else if (recurringDay) {
    startDate = getNextOccurrenceDate(recurringDay);
    startDate.setHours(hours, minutes, 0);
  } else {
    startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
  }

  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 min durata
  const dtStart = formatUtcDate(startDate);
  const dtEnd = formatUtcDate(endDate);

  const dayNumber = recurringDay || startDate.getDate();
  if (isRecurringMonthly) {
    recurrenceRule = `\r\nRRULE:FREQ=MONTHLY;BYMONTHDAY=${dayNumber}`;
  }

  const amountText = amount !== undefined && amount !== null && amount !== '' 
    ? ` (${Number(amount).toFixed(2)} €)` 
    : '';
  const fullSummary = `${title}${amountText}`;
  const uid = `flow-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@flow.app`;

  const description = `Promemoria registrato su FLOW - Finanza Personale.${amount ? `\\nImporto: ${Number(amount).toFixed(2)} €` : ''}${note ? `\\nNota: ${note}` : ''}`;

  const vEvent = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowUtc}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${fullSummary}`,
    `DESCRIPTION:${description}${recurrenceRule}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    `DESCRIPTION:Promemoria: ${fullSummary}`,
    'END:VALARM',
    'END:VEVENT'
  ].join('\r\n');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FLOW//FLOW Finanza Personale//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:FLOW Scadenze',
    'X-WR-TIMEZONE:Europe/Rome',
    vEvent,
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const safeFilename = `${title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30)}_Promemoria.ics`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', safeFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);

  return safeFilename;
};

/**
 * Crea una singola componente VEVENT per un movimento ricorrente
 */
const buildVEvent = (item, nowUtc) => {
  const isIncome = item.type === 'income';
  const prefix = isIncome ? '💰 Entrata' : '💸 Scadenza Spesa';
  const label = item.note ? `${item.category} - ${item.note}` : item.category;
  const amountStr = Number(item.amount || 0).toFixed(2);
  const title = `${prefix}: ${label} (${amountStr} €)`;

  const day = Math.min(Math.max(1, parseInt(item.recurring_day, 10) || 1), 31);
  const startDate = getNextOccurrenceDate(day);
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 min durata

  const uid = `flusso-${item.id || Date.now()}-${day}@flusso.app`;
  const dtStart = formatUtcDate(startDate);
  const dtEnd = formatUtcDate(endDate);

  const description = `Promemoria ricorrente generato da Flusso - Finanza Personale.\\nTipo: ${isIncome ? 'Entrata' : 'Uscita'}\\nImporto: ${amountStr} €\\nCategoria: ${item.category}${item.note ? `\\nNota: ${item.note}` : ''}\\nGiorno del mese: ${day}`;

  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowUtc}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `RRULE:FREQ=MONTHLY;BYMONTHDAY=${day}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT12H',
    'ACTION:DISPLAY',
    `DESCRIPTION:Promemoria: domani ${title}`,
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    `DESCRIPTION:Scadenza imminente: ${title}`,
    'END:VALARM',
    'END:VEVENT'
  ].join('\r\n');
};

/**
 * Genera e scarica/apre un file .ics per un singolo movimento ricorrente
 */
export const downloadIcsReminder = (item) => {
  const isIncome = item.type === 'income';
  const prefix = isIncome ? 'Entrata' : 'Scadenza';
  const label = item.note ? `${item.category} - ${item.note}` : item.category;
  const day = Number(item.recurring_day || 1);

  return exportToPhoneCalendar({
    title: `${prefix}: ${label}`,
    amount: item.amount,
    recurringDay: day,
    isRecurringMonthly: true,
    note: item.note || ''
  });
};

/**
 * Genera e scarica un file .ics cumulativo contenente tutte le spese fisse
 */
export const downloadAllRecurringIcs = (items = []) => {
  if (!items || items.length === 0) return null;

  const nowUtc = formatUtcDate(new Date());
  const vEvents = items.map(item => buildVEvent(item, nowUtc)).join('\r\n');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FLOW//FLOW Finanza Personale//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:FLOW - Tutte le Scadenze Fisse',
    'X-WR-TIMEZONE:Europe/Rome',
    vEvents,
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const filename = `FLOW_Tutte_Le_Scadenze_Fisse_${items.length}_promemoria.ics`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);

  return filename;
};

/**
 * Genera l'URL diretto per creare l'evento ricorrente su Google Calendar
 */
export const getGoogleCalendarUrl = (item) => {
  const isIncome = item.type === 'income';
  const prefix = isIncome ? '💰 Entrata' : '💸 Scadenza Spesa';
  const label = item.note ? `${item.category} - ${item.note}` : item.category;
  const amountStr = Number(item.amount || 0).toFixed(2);
  const title = encodeURIComponent(`${prefix}: ${label} (${amountStr} €)`);

  const day = Math.min(Math.max(1, parseInt(item.recurring_day, 10) || 1), 31);
  const startDate = getNextOccurrenceDate(day);
  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

  const startUtc = formatUtcDate(startDate);
  const endUtc = formatUtcDate(endDate);

  const details = encodeURIComponent(
    `Promemoria ricorrente generato da FLOW - Finanza Personale.\nTipo: ${isIncome ? 'Entrata' : 'Uscita'}\nImporto: ${amountStr} €\nCategoria: ${item.category}${item.note ? `\nNota: ${item.note}` : ''}\nGiorno del mese: ${day}`
  );

  const recur = encodeURIComponent(`RRULE:FREQ=MONTHLY;BYMONTHDAY=${day}`);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startUtc}/${endUtc}&details=${details}&recur=${recur}`;
};

/**
 * Apre Google Calendar in un nuovo tab
 */
export const openGoogleCalendarReminder = (item) => {
  const url = getGoogleCalendarUrl(item);
  window.open(url, '_blank', 'noopener,noreferrer');
};
