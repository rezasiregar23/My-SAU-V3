export const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
export const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
export const DAYS_MINI = ['S', 'S', 'R', 'K', 'J', 'S', 'M']; // Monday-first
export const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export const pad = (n) => String(n).padStart(2, '0');

/** Wall-clock time in Asia/Jakarta, returned as a local Date with the same fields. */
export function now() {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date());
    const get = (t) => Number(parts.find((p) => p.type === t).value);
    return new Date(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  } catch {
    return new Date();
  }
}

export const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const today = () => startOfDay(now());
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const sameDay = (a, b) => ymd(a) === ymd(b);
export const dayDiff = (a, b) => Math.round((startOfDay(a) - startOfDay(b)) / 86400000);

export const fmtLong = (d) => `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
export const fmtDayMonth = (d) => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
export const fmtShort = (d) => `${DAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
export const fmtMonth = (d) => `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
export const fmtTime = (d) => `${pad(d.getHours())}.${pad(d.getMinutes())}`;

/** "09.30" | "09:30" -> minutes since midnight */
export const toMin = (t) => { const [h, m] = String(t).split(/[.:]/).map(Number); return h * 60 + (m || 0); };
export const fromMin = (m) => `${pad(Math.floor(m / 60))}.${pad(m % 60)}`;

/** Monday-first 6×7 matrix for a month */
export function monthMatrix(y, m) {
  const first = new Date(y, m, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}
export const weekStart = (d) => addDays(startOfDay(d), -((d.getDay() + 6) % 7));

/** Relative deadline label used across the app */
export function dueLabel(dateStr, time) {
  const t = today();
  const d = parseYmd(dateStr);
  const diff = dayDiff(d, t);
  if (diff < 0) return { text: `Terlambat ${-diff} hari`, tone: 'red', late: true };
  if (diff === 0) return { text: time ? `Hari ini, ${time}` : 'Hari ini', tone: 'red' };
  if (diff === 1) return { text: time ? `Besok, ${time}` : 'Besok', tone: 'amber' };
  return { text: fmtShort(d) + (time ? `, ${time}` : ''), tone: 'gray' };
}

export function greeting(h) {
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 18) return 'Selamat sore';
  return 'Selamat malam';
}

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const uid = (p = 'id') => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
