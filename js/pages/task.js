import { icon } from '../icons.js';
import { esc, today, fmtLong, ymd, weekStart, addDays, DAYS_MINI, sameDay } from '../utils.js';
import { PRIORITY, ACTIVITY } from '../data.js';
import { state, update, activeTasks, sortByDue, history, counts } from '../store.js';
import { duePill, prioTag, avatars, avatar, toast, openAgendaModal } from '../ui.js';

let expanded = false;
let sortMode = 'due';

const prioRank = { tinggi: 0, sedang: 1, rendah: 2 };

function focusTasks() {
  const act = activeTasks();
  const picked = act.filter((t) => t.focus).sort((a, b) => a.focus - b.focus);
  const rest = sortByDue(act.filter((t) => !t.focus)).sort((a, b) => prioRank[a.priority] - prioRank[b.priority]);
  return [...picked, ...rest].slice(0, 4);
}

function left() {
  const c = counts();
  const act = activeTasks();
  const by = { tinggi: 0, sedang: 0, rendah: 0 };
  act.forEach((t) => { by[t.priority] = (by[t.priority] || 0) + 1; });
  const max = Math.max(1, ...Object.values(by));
  const k = ymd(today());
  const urgent = sortByDue(act.filter((t) => t.due <= k && t.priority === 'tinggi')).sort((a, b) => (a.due < k ? -1 : 0) - (b.due < k ? -1 : 0)).slice(0, 2);
  const urgentAll = act.filter((t) => t.due <= k && t.priority === 'tinggi').length;
  // weekly progress
  const ws = weekStart(today());
  const hist = history();
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(ws, i), dk = ymd(d);
    return { d, done: hist.filter((h) => h.doneAt === dk).length, planned: act.filter((t) => t.due === dk).length };
  });
  const doneWeek = week.reduce((a, w) => a + w.done, 0);
  const plannedWeek = week.reduce((a, w) => a + w.planned, 0) + doneWeek;
  const wmax = Math.max(3, ...week.map((w) => w.done + w.planned));
  return `<section class="col col-left">
    <div class="page-title"><small class="eyebrow">Task saya · semua lokasi</small><h1>Task <span class="accent">Saya.</span></h1><p class="muted">Kelola pekerjaan dan kolaborasi Anda</p></div>
    <div class="stat-row">
      <div class="stat glass sel"><small>Task aktif</small><b>${c.active}</b><small>dari ${c.apps} aplikasi</small></div>
      <div class="stat glass"><small>Jatuh tempo hari ini</small><b>${c.dueToday}</b><small class="${c.late ? 'red' : ''}">${c.late ? `<i class="d red"></i>${c.late} terlambat` : 'tidak ada yang terlambat'}</small></div>
    </div>
    <article class="card glass prio-card"><div class="card-head"><h3>Task berdasarkan prioritas</h3><span class="flex"></span><small class="muted">${c.active} total</small></div>
      ${Object.entries(PRIORITY).map(([key, p]) => `<div class="pbar"><span>${p.label}</span><i style="--w:${(by[key] / max) * 100}%;--c:${p.color}"></i><b>${by[key]}</b></div>`).join('')}
    </article>
    <article class="card glass urgent"><div class="card-head"><h3>Segera diselesaikan</h3><span class="flex"></span><small class="red">${urgentAll} mendesak</small></div>
      <ul>${urgent.map((t) => `<li class="task-row"><button type="button" class="check" data-done="${t.id}" aria-label="Tandai selesai: ${esc(t.title)}"></button><div class="tr-main"><p class="tr-title">${esc(t.title)}</p><div class="tr-sub">${duePill(t.due, t.time)}<span class="muted">${esc(t.app)}</span></div></div></li>`).join('') || '<li class="empty">Tidak ada task mendesak.</li>'}</ul>
    </article>
    <article class="card glass weekly"><div class="card-head"><h3>Progres minggu ini</h3><span class="flex"></span><small><b class="blue">${doneWeek}/${plannedWeek}</b> selesai</small></div>
      <div class="bars">${week.map((w, i) => {
        const isT = sameDay(w.d, today());
        const h = (v) => Math.max(v ? 10 : 0, (v / wmax) * 100);
        return `<div class="bcol${isT ? ' today' : ''}${i === 6 ? ' sun' : ''}" title="${w.done} selesai, ${w.planned} terjadwal">
          <div class="bstack">${w.planned ? `<i class="b plan" style="--h:${h(w.planned)}%"></i>` : ''}${w.done ? `<i class="b done" style="--h:${h(w.done)}%"></i>` : ''}${!w.done && !w.planned ? '<i class="b zero"></i>' : ''}</div><small>${DAYS_MINI[i]}</small></div>`;
      }).join('')}</div>
      <div class="legend"><span><i class="dot teal"></i>Selesai</span><span><i class="dot navy"></i>Hari ini</span><span><i class="dot ring"></i>Terjadwal</span></div>
    </article>
  </section>`;
}

function focusCard(t, i) {
  const [d, total] = t.sub || [0, 1];
  return `<article class="focus-card glass f${i + 1}">
    <span class="fnum">${i + 1}</span>
    <div class="fc-head"><button type="button" class="check" data-done="${t.id}" aria-label="Tandai selesai: ${esc(t.title)}"></button><div><h3>${esc(t.title)}</h3><small class="muted">${esc(t.app)} · ${esc(t.code)}</small></div></div>
    <div class="fc-meta">${duePill(t.due, t.time)}${prioTag(t.priority)}</div>
    <div class="fc-prog"><i style="--w:${(d / total) * 100}%"></i><small>${d}/${total} subtask</small></div>
    <div class="fc-foot">${avatars(t.people, 24)}<span class="flex"></span><span class="cnt">${icon('message', 14)}${t.comments}</span><span class="cnt">${icon('clip', 14)}${t.files}</span></div>
  </article>`;
}

function center() {
  const c = counts();
  const f = focusTasks();
  const total = c.dueToday + c.doneToday;
  const pct = total ? c.doneToday / total : 0;
  const R = 46, C = 2 * Math.PI * R;
  return `<section class="col col-center focus-col">
    <div class="focus-head">
      <div><small class="eyebrow">Fokus · ${fmtLong(today())}</small><h2 class="h1">Fokus <span class="accent">hari ini.</span></h2><p class="muted">Selesaikan yang paling penting dulu · ${f.length} prioritas</p></div>
      <button type="button" class="btn primary" data-action="addTask">${icon('plus', 16, 2.4)}Tambah Task</button>
    </div>
    <div class="focus-board">
      <svg class="links" viewBox="0 0 600 420" preserveAspectRatio="none" aria-hidden="true">
        <ellipse cx="300" cy="210" rx="170" ry="118" class="ring-dash"/>
        <path d="M168 110 C 210 150, 240 190, 262 205"/><path d="M432 110 C 390 150, 360 190, 338 205"/>
        <path d="M168 310 C 210 270, 240 230, 262 215"/><path d="M432 310 C 390 270, 360 230, 338 215"/>
      </svg>
      <div class="hub glass"><svg viewBox="0 0 110 110" aria-hidden="true"><circle cx="55" cy="55" r="${R}" class="hub-track"/><circle cx="55" cy="55" r="${R}" class="hub-val" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}"/></svg>
        <p><b>${c.doneToday}</b><span>/${total}</span></p><small>selesai hari ini</small></div>
      ${f.map(focusCard).join('')}
    </div>
  </section>`;
}

function right() {
  const tab = state.ui.taskTab;
  let list = activeTasks();
  list = sortMode === 'due' ? sortByDue(list) : [...sortByDue(list)].sort((a, b) => prioRank[a.priority] - prioRank[b.priority]);
  const shown = expanded ? list : list.slice(0, 4);
  const hist = history();
  return `<section class="col col-right">
    <article class="card glass all-tasks">
      <div class="card-head"><h2>Semua task</h2><span class="badge">${list.length}</span><span class="flex"></span>
        <button type="button" class="icon-btn sm" data-action="sort" aria-label="Urutkan" title="Urutkan: ${sortMode === 'due' ? 'tenggat' : 'prioritas'}">${icon('filter', 16, 2)}</button></div>
      <div class="seg full" role="tablist"><button type="button" role="tab" class="${tab === 'tugas' ? 'on' : ''}" aria-selected="${tab === 'tugas'}" data-ttab="tugas">Tugas</button><button type="button" role="tab" class="${tab === 'riwayat' ? 'on' : ''}" aria-selected="${tab === 'riwayat'}" data-ttab="riwayat">Riwayat</button></div>
      <ul class="at-list scroll">
      ${tab === 'tugas' ? shown.map((t) => `<li class="at-row">
          <button type="button" class="check" data-done="${t.id}" aria-label="Tandai selesai: ${esc(t.title)}"></button>
          <div class="tr-main"><p class="tr-title">${esc(t.title)}</p><small class="muted app">${icon('layers', 13)}${esc(t.app)} · ${esc(t.code)}</small>
            <div class="tr-sub plain">${duePill(t.due, t.time)}${prioTag(t.priority)}<span class="flex"></span>${avatars(t.people, 22)}</div></div></li>`).join('')
        : hist.map((h) => `<li class="at-row done"><span class="check on">${icon('check', 12, 3)}</span><div class="tr-main"><p class="tr-title">${esc(h.title)}</p><small class="muted">${esc(h.app)} · selesai ${h.doneAt === ymd(today()) ? 'hari ini' : h.doneAt}${h.time ? `, ${h.time}` : ''}</small></div>${state.doneIds.includes(h.id) ? `<button type="button" class="link" data-undo="${h.id}">Urungkan</button>` : ''}</li>`).join('')}
      </ul>
      ${tab === 'tugas' && list.length > 4 ? `<button type="button" class="link center" data-action="expand">${expanded ? 'Tampilkan lebih sedikit' : `Lihat semua ${list.length} task`} ${icon('arrowR', 13, 2)}</button>` : ''}
    </article>
    <article class="card glass activity"><div class="card-head"><span class="ic-chip">${icon('message', 16)}</span><h2>Aktivitas kolaborasi</h2><span class="flex"></span><span class="live"><i></i>Live</span></div>
      <ul>${ACTIVITY.map((a) => `<li>${avatar(a.who, 30)}<div><p>${esc(a.text)}<small>${esc(a.ago)}</small></p>${a.quote ? `<q>${esc(a.quote.replace(/[“”]/g, ''))}</q>` : `<small class="muted ref">${icon(a.icon, 13)}${esc(a.ref)}</small>`}</div></li>`).join('')}</ul>
    </article>
  </section>`;
}

export function render() {
  return `<div class="page page-task">${left()}${center()}${right()}</div>`;
}

export function bind(root, rerender) {
  root.onclick = (e) => {
    const b = e.target.closest('[data-action],[data-done],[data-ttab],[data-undo]');
    if (!b) return;
    if (b.dataset.action === 'addTask') openAgendaModal({ mode: 'task' });
    if (b.dataset.action === 'expand') { expanded = !expanded; rerender(); }
    if (b.dataset.action === 'sort') { sortMode = sortMode === 'due' ? 'prio' : 'due'; rerender(); toast(`Diurutkan berdasarkan ${sortMode === 'due' ? 'tenggat' : 'prioritas'}`); }
    if (b.dataset.ttab) update((s) => { s.ui.taskTab = b.dataset.ttab; }, { persist: false });
    if (b.dataset.done) {
      const id = b.dataset.done;
      update((s) => { s.doneIds.push(id); });
      toast('Task ditandai selesai', { label: 'Urungkan', run: () => update((s) => { s.doneIds = s.doneIds.filter((x) => x !== id); }) });
    }
    if (b.dataset.undo) update((s) => { s.doneIds = s.doneIds.filter((x) => x !== b.dataset.undo); });
  };
}
