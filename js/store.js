import { buildSeed, nationalDays, CAL_TYPES } from './data.js';
import { today, ymd, parseYmd, toMin } from './utils.js';

const KEY = 'mysau.v3';
const listeners = new Set();

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function save() {
  try {
    const { attendance, doneIds, userEvents, userTasks, calFilters } = state;
    localStorage.setItem(KEY, JSON.stringify({ attendance, doneIds, userEvents, userTasks, calFilters }));
  } catch { /* storage unavailable: keep in memory */ }
}

const persisted = load();
const seed = buildSeed(today());

export const state = {
  seed,
  attendance: persisted.attendance && persisted.attendance.date === ymd(today()) ? persisted.attendance : { date: ymd(today()), in: null, out: null },
  doneIds: persisted.doneIds || [],
  userEvents: persisted.userEvents || [],
  userTasks: persisted.userTasks || [],
  calFilters: persisted.calFilters || Object.fromEntries(Object.keys(CAL_TYPES).map((k) => [k, k !== 'ultah'])),
  ui: { calView: 'bulan', calDate: today(), selectedEvent: 'e2', taskTab: 'tugas', taskFilter: 'semua', berandaTab: 'semua' },
};

export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function update(mutator, { persist = true } = {}) {
  mutator(state);
  if (persist) save();
  listeners.forEach((fn) => fn(state));
}

/* ---------- selectors ---------- */
export const allTasks = () => [...state.userTasks, ...state.seed.tasks];
export const activeTasks = () => allTasks().filter((t) => !state.doneIds.includes(t.id));
export const isDone = (id) => state.doneIds.includes(id);

export function sortByDue(list) {
  return [...list].sort((a, b) => (a.due === b.due ? toMin(a.time || '23.59') - toMin(b.time || '23.59') : a.due < b.due ? -1 : 1));
}

export function history() {
  const doneNow = allTasks().filter((t) => state.doneIds.includes(t.id)).map((t) => ({ id: t.id, title: t.title, app: t.app, doneAt: ymd(today()), time: '' }));
  return [...doneNow, ...state.seed.history];
}

/** All calendar items for a given month (events + national days + task deadlines) */
export function itemsForRange(from, to, { all = false } = {}) {
  const f = ymd(from), t = ymd(to);
  const months = new Set();
  for (let d = new Date(from); d <= to; d.setMonth(d.getMonth() + 1, 1)) months.add(`${d.getFullYear()}-${d.getMonth()}`);
  months.add(`${to.getFullYear()}-${to.getMonth()}`);
  const nat = [...months].flatMap((k) => { const [y, m] = k.split('-').map(Number); return nationalDays(y, m); });
  const taskItems = activeTasks().map((x) => ({ id: `task-${x.id}`, taskId: x.id, type: 'task', date: x.due, start: x.time || '', title: x.title, app: x.app, priority: x.priority, allDay: !x.time }));
  return [...state.userEvents, ...state.seed.events, ...nat, ...taskItems]
    .filter((e) => e.date >= f && e.date <= t)
    .filter((e) => all || e.type === 'catatan' || state.calFilters[e.type] !== false);
}

export function itemsOn(date, opts) {
  const k = ymd(date);
  return itemsForRange(date, date, opts).filter((e) => e.date === k).sort((a, b) => {
    if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
    return toMin(a.start || '00.00') - toMin(b.start || '00.00');
  });
}

export function findEvent(id) {
  return [...state.userEvents, ...state.seed.events].find((e) => e.id === id);
}

export function counts() {
  const t = today();
  const k = ymd(t);
  const act = activeTasks();
  const dueToday = act.filter((x) => x.due === k).length;
  const late = act.filter((x) => x.due < k).length;
  const doneToday = history().filter((h) => h.doneAt === k).length;
  const agendaToday = itemsOn(t, { all: true }).filter((e) => e.type === 'rapat' || e.type === 'event').length;
  return { active: act.length, dueToday, late, doneToday, agendaToday, apps: new Set(act.map((x) => x.app)).size };
}

export const dateKey = ymd;
export const fromKey = parseYmd;
