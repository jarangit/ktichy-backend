/**
 * Format Date to Bangkok time (Asia/Bangkok, +07:00)
 * Returns ISO-like string with +07:00 offset so FE can display directly
 * Example: 2026-08-29T04:09:43.303+07:00
 */
export const toBangkokISOString = (input: Date | string | null | undefined): string | null => {
  if (!input) return null;
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return null;

  // Convert UTC instant to Bangkok wall time by formatting with timeZone
  // Use Intl to get parts in Asia/Bangkok and rebuild ISO
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  const year = get('year');
  const month = get('month');
  const day = get('day');
  const hour = get('hour');
  const minute = get('minute');
  const second = get('second');

  const ms = String(d.getMilliseconds()).padStart(3, '0');
  // Keep milliseconds for precision, append +07:00
  return `${year}-${month}-${day}T${hour}:${minute}:${second}.${ms}+07:00`;
};

export const formatBangkok = toBangkokISOString;
