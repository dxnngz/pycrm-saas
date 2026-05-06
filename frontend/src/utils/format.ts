export const DEFAULT_LOCALE = 'es-ES';
export const DEFAULT_CURRENCY = 'EUR';

export const formatMoney = (
  value: number,
  opts?: {
    currency?: string;
    maximumFractionDigits?: number;
    minimumFractionDigits?: number;
  }
) => {
  const currency = opts?.currency ?? DEFAULT_CURRENCY;
  const v = Number(value);
  const safe = Number.isFinite(v) ? v : 0;
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency,
    maximumFractionDigits: opts?.maximumFractionDigits,
    minimumFractionDigits: opts?.minimumFractionDigits,
  }).format(safe);
};

export const formatMoneyCompact = (value: number, opts?: { currency?: string }) => {
  const currency = opts?.currency ?? DEFAULT_CURRENCY;
  const v = Number(value);
  const safe = Number.isFinite(v) ? v : 0;
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(safe);
};

export const formatDate = (value: Date | string | number) => {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(DEFAULT_LOCALE).format(d);
};

export const formatTime = (value: Date | string | number) => {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, { hour: '2-digit', minute: '2-digit' }).format(d);
};

export const formatDateTime = (value: Date | string | number) => {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, { dateStyle: 'short', timeStyle: 'short' }).format(d);
};

export const formatMonthDay = (value: Date | string | number) => {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, { month: 'short', day: 'numeric' }).format(d);
};
