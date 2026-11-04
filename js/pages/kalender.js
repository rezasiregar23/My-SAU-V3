import { icon } from '../icons.js';
import { esc, now, today, fmtLong, fmtMonth, monthMatrix, ymd, parseYmd, sameDay, toMin, fromMin, fmtTime, addDays, addMonths, weekStart, DAYS, DAYS_SHORT, DAYS_MINI, MONTHS, MONTHS_SHORT } from '../utils.js';
import { CAL_TYPES, PRIORITY } from '../data.js';
import { state, update, itemsForRange, itemsOn, findEvent, activeTasks, sortByDue } from '../store.js';
import { avatars, duePill, prioTag, toast, openAgendaModal } from '../ui.js';

const H0 = 6, H1 = 21, PX = 46; // timeline hours & px per hour
let miniMonth = null;
let menuOpen = false;

const typeColor = (t) => (CAL_TYPES[t] || { color: '#7D8CA3' }).color;
const dur = (a, b) => { const m = toMin(b) - toMin(a); const h = Math.floor(m / 60), r = m % 60; return [h && `${h} jam`, r && `${r} menit`].filter(Boolean).join(' '); };

function rangeOf(view, d) {
  if (view === 'bulan') { const m = monthMatrix(d.getFullYear(), d.getMonth()); return [m[0], m[41]]; }
  if (view === 'minggu') { const s = weekStart(d); return [s, addDays(s, 6)]; }
  return [d, d];
}

/* ---------------- left column ---------------- */
function left() {
  const { calView: v, calDate: d } = state.ui;
  const t = today();
  const isToday = sameDay(d, t);
  const title = v === 'bulan' ? ['Agenda', 'bulan ini.'] : v === 'minggu' ? ['Agenda', 'minggu ini.'] : isToday ? ['Jadwal', 'hari ini.'] : ['Jadwal', 'harian.'];
  const dayItems = itemsOn(d);
  const sub = v === 'hari'
    ? `${fmtLong(d)} · ${dayItems.filter((e) => e.type === 'rapat' || e.type === 'event').length} agenda, ${dayItems.filter((e) => e.type === 'task').length} task`
    : `${fmtLong(t)} · WIB (GMT+7)`;
  const mm = miniMonth || new Date(d.getFullYear(), d.getMonth(), 1);
  const days = monthMatrix(mm.getFullYear(), mm.getMonth());
  const items = itemsForRange(days[0], days[41]);
  const has = new Set(items.filter((e) => e.type !== 'catatan').map((e) => e.date));
  const monthItems = itemsForRange(new Date(mm.getFullYear(), mm.getMonth(), 1), new Date(mm.getFullYear(), mm.getMonth() + 1, 0), { all: true });
  const cnt = (k) => monthItems.filter((e) => e.type === k).length;
  return `<section class="col col-left">
    <div class="page-title"><small class="eyebrow">Kalender · ${v === 'hari' ? 'detail hari' : v === 'minggu' ? 'minggu' : fmtMonth(d).toLowerCase()}</small><h1>${title[0]} <span class="accent">${title[1]}</span></h1><p class="muted">${esc(sub)}</p></div>
    <div class="split">
      <button type="button" class="btn primary grow" data-action="new" data-mode="event">${icon('plus', 17, 2.4)}Buat agenda</button>
      <button type="button" class="btn primary caret" data-action="menu" aria-haspopup="true" aria-expanded="${menuOpen}" aria-label="Pilih jenis">${icon('chevDown', 16, 2.2)}</button>
      ${menuOpen ? `<div class="menu glass-strong"><button type="button" data-action="new" data-mode="event">${icon('calendar', 15)}Event / rapat</button><button type="button" data-action="new" data-mode="task">${icon('task', 15)}Task dengan tenggat</button></div>` : ''}
    </div>
    <article class="card glass mini">
      <div class="card-head"><h3>${fmtMonth(mm)}</h3><span class="flex"></span>
        <button type="button" class="icon-btn sm" data-mini="-1" aria-label="Bulan sebelumnya">${icon('chevL', 14, 2)}</button>
        <button type="button" class="icon-btn sm" data-mini="1" aria-label="Bulan berikutnya">${icon('chevR', 14, 2)}</button></div>
      <div class="mini-grid">${DAYS_MINI.map((x, i) => `<span class="h${i === 6 ? ' sun' : ''}">${x}</span>`).join('')}
        ${days.map((x) => `<button type="button" class="${x.getMonth() !== mm.getMonth() ? 'out ' : ''}${sameDay(x, d) ? 'sel ' : ''}${sameDay(x, t) ? 'is-now ' : ''}${x.getDay() === 0 ? 'sun' : ''}" data-day="${ymd(x)}" aria-label="${fmtLong(x)}">${x.getDate()}${has.has(ymd(x)) && x.getMonth() === mm.getMonth() ? '<i></i>' : ''}</button>`).join('')}
      </div>
    </article>
    <article class="card glass mycal">
      <div class="card-head"><h3>Kalender saya</h3><span class="flex"></span><button type="button" class="link" data-action="todo" data-msg="Pengaturan kalender akan tersedia setelah sinkron Google/Outlook">Kelola</button></div>
      ${Object.entries(CAL_TYPES).map(([k, c]) => `<label class="cb" style="--c:${c.color}"><input type="checkbox" data-filter="${k}" ${state.calFilters[k] !== false ? 'checked' : ''}><i>${icon('check', 12, 3)}</i><span>${c.label}</span><small>${cnt(k)}</small></label>`).join('')}
    </article>
  </section>`;
}

/* ---------------- toolbar ---------------- */
function toolbar() {
  const { calView: v, calDate: d } = state.ui;
  const [a, b] = rangeOf(v, d);
  const [ra, rb] = v === 'bulan' ? [new Date(d.getFullYear(), d.getMonth(), 1), new Date(d.getFullYear(), d.getMonth() + 1, 0)] : [a, b];
  const items = itemsForRange(ra, rb);
  const nAg = items.filter((e) => e.type === 'rapat' || e.type === 'event').length;
  const nTk = items.filter((e) => e.type === 'task').length;
  let title;
  if (v === 'bulan') title = `${MONTHS[d.getMonth()]} <span class="accent">${d.getFullYear()}</span>`;
  else if (v === 'minggu') title = `${a.getDate()}${a.getMonth() !== b.getMonth() ? ' ' + MONTHS_SHORT[a.getMonth()] : ''} – ${b.getDate()} ${MONTHS[b.getMonth()]} <span class="accent">${b.getFullYear()}</span>`;
  else title = `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} <span class="accent">${d.getFullYear()}</span>`;
  return `<div class="cal-toolbar cal-bar">
    <button type="button" class="btn glass sm" data-action="today">Hari ini</button>
    <button type="button" class="icon-btn glass" data-nav="-1" aria-label="Sebelumnya">${icon('chevL', 16, 2)}</button>
    <button type="button" class="icon-btn glass" data-nav="1" aria-label="Berikutnya">${icon('chevR', 16, 2)}</button>
    <h2 class="cal-title">${title}</h2><span class="flex"></span>
    <span class="sum-pill glass"><b>${nAg} agenda</b> · ${nTk} task</span>
    <div class="seg glass" role="tablist">${['hari', 'minggu', 'bulan'].map((x) => `<button type="button" role="tab" class="${v === x ? 'on' : ''}" aria-selected="${v === x}" data-view="${x}">${x[0].toUpperCase() + x.slice(1)}</button>`).join('')}</div>
  </div>`;
}

/* ---------------- month ---------------- */
function chip(e) {
  const c = typeColor(e.type);
  if (e.type === 'task') return `<button type="button" class="mchip tint" style="--c:${c}" data-item="${e.id}" data-date="${e.date}">${esc(e.title)}</button>`;
  if (e.allDay || e.type === 'cuti' || e.type === 'ultah') return `<button type="button" class="mchip tint" style="--c:${c}" data-item="${e.id}" data-date="${e.date}">${esc(e.title.replace('Ulang tahun ', 'Ultah '))}</button>`;
  return `<button type="button" class="mchip timed" style="--c:${c}" data-item="${e.id}" data-date="${e.date}"><i></i>${e.start} ${esc(e.title)}</button>`;
}
function month() {
  const d = state.ui.calDate;
  const days = monthMatrix(d.getFullYear(), d.getMonth());
  const items = itemsForRange(days[0], days[41]).filter((e) => e.type !== 'catatan');
  const by = {};
  items.forEach((e) => (by[e.date] ||= []).push(e));
  const t = today();
  return `<div class="month glass">
    <div class="m-head">${['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((x, i) => `<span class="${i === 6 ? 'sun' : ''}">${x}</span>`).join('')}</div>
    <div class="m-grid">${days.map((x) => {
      const k = ymd(x);
      const list = (by[k] || []).sort((a, b) => (a.type === 'task' ? -1 : 0) - (b.type === 'task' ? -1 : 0) || (a.allDay ? -1 : 0) - (b.allDay ? -1 : 0) || toMin(a.start || '0') - toMin(b.start || '0'));
      const out = x.getMonth() !== d.getMonth();
      const label = x.getDate() === 1 ? `${x.getDate()} ${MONTHS_SHORT[x.getMonth()]}` : x.getDate();
      return `<div class="m-cell${out ? ' out' : ''}${sameDay(x, t) ? ' today' : ''}${x.getDay() === 0 ? ' sun' : ''}" data-day="${k}" role="button" tabindex="0" aria-label="${fmtLong(x)}, ${list.length} item">
        <div class="m-date"><span>${label}</span>${list.length > 2 ? `<small>+${list.length - 2} lainnya</small>` : ''}</div>
        ${list.slice(0, 2).map(chip).join('')}
      </div>`;
    }).join('')}</div>
  </div>`;
}

/* ---------------- timeline (day & week) ---------------- */
function lanes(evs) {
  const sorted = [...evs].sort((a, b) => toMin(a.start) - toMin(b.start));
  const ends = [];
  sorted.forEach((e) => {
    let lane = ends.findIndex((end) => end <= toMin(e.start));
    if (lane === -1) { lane = ends.length; ends.push(0); }
    ends[lane] = toMin(e.end || fromMin(toMin(e.start) + 30));
    e._lane = lane;
  });
  sorted.forEach((e) => { e._lanes = ends.length; });
  return sorted;
}

function timeline(dates, { compact = false } = {}) {
  const n = now();
  const nm = n.getHours() * 60 + n.getMinutes();
  const sel = state.ui.selectedEvent;
  const hours = Array.from({ length: H1 - H0 + 1 }, (_, i) => H0 + i);
  const cols = dates.map((d) => {
    const all = itemsOn(d).filter((e) => e.type !== 'catatan');
    const timed = lanes(all.filter((e) => !e.allDay && e.start).map((e) => ({ ...e, end: e.end || fromMin(toMin(e.start) + 30) })));
    const blocks = timed.map((e) => {
      const top = ((toMin(e.start) - H0 * 60) / 60) * PX;
      const h = Math.max(22, ((toMin(e.end) - toMin(e.start)) / 60) * PX - 4);
      const w = 100 / e._lanes;
      const c = typeColor(e.type);
      const isTask = e.type === 'task';
      const short = h < 34;
      return `<button type="button" class="blk ${isTask ? 'blk-task' : ''}${e.id === sel ? ' sel' : ''}${short ? ' short' : ''}" style="--c:${c};top:${top}px;height:${h}px;left:calc(${e._lane * w}% + 6px);width:calc(${w}% - 10px)" data-item="${e.id}" data-date="${e.date}">
        ${isTask ? `${icon('task', 13, 2)}<b>${esc(e.title)}${compact ? '' : ` · tenggat ${e.start}`}</b>${!compact && e.priority ? `<span class="pill pill-${e.priority === 'tinggi' ? 'red' : e.priority === 'sedang' ? 'amber' : 'gray'} xs">${PRIORITY[e.priority].label}</span>` : ''}`
          : short ? `<b>${esc(e.title)}${compact ? '' : ` · ${e.start} – ${e.end}`}</b>` : `<b>${esc(e.title)}</b><small>${e.start} – ${e.end}${e.loc && !compact ? ` · ${esc(e.loc)}` : ''}</small>`}
      </button>`;
    }).join('');
    const isT = sameDay(d, today());
    const nowLine = isT && nm >= H0 * 60 && nm <= H1 * 60 ? `<div class="now" style="top:${((nm - H0 * 60) / 60) * PX}px">${dates.length === 1 ? `<span>${fmtTime(n)}</span>` : ''}</div>` : '';
    // free-slot suggestion (day view only)
    let ghost = '';
    if (dates.length === 1) {
      const busy = timed.map((e) => [toMin(e.start), toMin(e.end)]);
      const startFrom = isT ? Math.max(12 * 60, Math.ceil(nm / 60) * 60) : 13 * 60;
      for (let s = startFrom; s <= 19 * 60; s += 60) {
        if (!busy.some(([a, b]) => s < b && s + 60 > a)) { ghost = `<button type="button" class="ghost-slot" style="top:${((s - H0 * 60) / 60) * PX + 4}px;height:${PX - 8}px" data-slot="${fromMin(s)}">${icon('plus', 14, 2.2)}Klik untuk menambah agenda · ${fromMin(s)} – ${fromMin(s + 60)}</button>`; break; }
      }
    }
    return `<div class="tl-col${isT ? ' is-today' : ''}" data-col="${ymd(d)}">${hours.map(() => '<i class="hl"></i>').join('')}${ghost}${blocks}${nowLine}</div>`;
  }).join('');
  return `<div class="tl" style="--px:${PX}px">
    <div class="tl-hours">${hours.map((h) => `<span>${String(h).padStart(2, '0')}.00</span>`).join('')}</div>
    <div class="tl-cols" style="--n:${dates.length}">${cols}</div>
  </div>`;
}

function dayView() {
  const d = state.ui.calDate;
  const items = itemsOn(d);
  const allDay = items.filter((e) => e.allDay && e.type !== 'catatan');
  const ag = items.filter((e) => e.type === 'rapat' || e.type === 'event').length;
  const tk = items.filter((e) => e.type === 'task').length;
  return `<div class="day glass">
    <div class="day-head"><small class="tz">GMT+7</small><div class="dbadge"><small>${DAYS_SHORT[d.getDay()]}</small><b>${d.getDate()}</b></div>
      <div><h3>${fmtLong(d)}</h3><small class="muted">${sameDay(d, today()) ? 'Hari ini · ' : ''}${ag} agenda · ${tk} task tenggat</small></div></div>
    ${allDay.length ? `<div class="allday"><small>${allDay.every((e) => e.type === 'task') ? 'Tenggat' : 'Sepanjang hari'}</small><div>${allDay.map((e) => `<button type="button" class="mchip tint" style="--c:${typeColor(e.type)}" data-item="${e.id}" data-date="${e.date}">${esc(e.title)}${e.type === 'task' && e.start ? ` · ${e.start}` : ''}</button>`).join('')}</div></div>` : ''}
    <div class="tl-scroll scroll">${timeline([d])}</div>
  </div>`;
}

function weekView() {
  const s = weekStart(state.ui.calDate);
  const dates = Array.from({ length: 7 }, (_, i) => addDays(s, i));
  const t = today();
  return `<div class="week glass">
    <div class="wk-head"><span></span>${dates.map((x) => {
      const allDay = itemsOn(x).filter((e) => e.allDay && e.type !== 'catatan');
      return `<button type="button" class="wk-day${sameDay(x, t) ? ' today' : ''}${x.getDay() === 0 ? ' sun' : ''}" data-day="${ymd(x)}"><small>${DAYS_SHORT[x.getDay()]}</small><b>${x.getDate()}</b>${allDay.slice(0, 1).map((e) => `<em style="--c:${typeColor(e.type)}">${esc(e.title)}</em>`).join('')}${allDay.length > 1 ? `<small class="more">+${allDay.length - 1}</small>` : ''}</button>`;
    }).join('')}</div>
    <div class="tl-scroll scroll">${timeline(dates, { compact: true })}</div>
  </div>`;
}

/* ---------------- right panel (day view) ---------------- */
function detail() {
  const d = state.ui.calDate;
  const items = itemsOn(d);
  let ev = findEvent(state.ui.selectedEvent);
  if (!ev || ev.date !== ymd(d) || ev.type === 'ultah' || ev.type === 'catatan') ev = items.find((e) => (e.type === 'rapat' || e.type === 'event') && !e.allDay) || null;
  const tasks = sortByDue(activeTasks().filter((t) => t.due === ymd(d)));
  let card;
  if (!ev) {
    card = `<article class="card glass ev-card empty-card"><p class="muted">Belum ada agenda di tanggal ini.</p><button type="button" class="btn primary" data-action="new" data-mode="event">${icon('plus', 16, 2.4)}Buat agenda</button></article>`;
  } else {
    const n = now();
    const nm = n.getHours() * 60 + n.getMinutes();
    const isT = ev.date === ymd(today());
    const status = ev.allDay ? ['Sepanjang hari', 'gray'] : isT && nm >= toMin(ev.start) && nm < toMin(ev.end) ? ['Berlangsung', 'green'] : (ev.date < ymd(today()) || (isT && nm >= toMin(ev.end))) ? ['Selesai', 'gray'] : ['Akan datang', 'blue'];
    const isRapat = ev.type === 'rapat';
    card = `<article class="card glass ev-card">
      <div class="ev-top"><span class="ev-ic" style="--c:${typeColor(ev.type)}">${icon(isRapat ? 'users' : 'calendar', 18)}</span><div><b>${isRapat ? 'Rapat' : CAL_TYPES[ev.type].label}</b><small class="muted">${esc(ev.loc || 'Tanpa lokasi')}</small></div><span class="flex"></span>
        <button type="button" class="icon-btn sm" data-action="todo" data-msg="Edit agenda akan tersedia setelah sinkron kalender" aria-label="Edit">${icon('edit', 14, 2)}</button>
        <button type="button" class="icon-btn sm" data-action="todo" data-msg="Opsi lain: duplikat, hapus, salin tautan" aria-label="Opsi lain">${icon('more', 16, 2.4)}</button></div>
      <div class="ev-meta"><small class="eyebrow">${isRapat ? 'Meeting' : 'Agenda'}${ev.code ? ` · ${ev.code}` : ''}</small><span class="pill pill-${status[1]}"><i class="d"></i>${status[0]}</span></div>
      <h3 class="ev-title">${esc(ev.title)}</h3>
      <ul class="ev-rows">
        <li>${icon('clock', 15)}${ev.allDay ? fmtLong(parseYmd(ev.date)) : `${ev.start} – ${ev.end} WIB · ${dur(ev.start, ev.end)}`}</li>
        ${ev.repeat ? `<li>${icon('repeat', 15)}${esc(ev.repeat)}</li>` : ''}
        ${ev.link ? `<li>${icon('video', 15)}<a href="https://${esc(ev.link.replace(/^https?:\/\//, ''))}" target="_blank" rel="noopener">${esc(ev.link)}</a></li>` : ''}
        ${ev.people ? `<li>${icon('users', 15)}${ev.people.length + (ev.extra || 0)} peserta${ev.attend ? ` · ${esc(ev.attend)}` : ''}</li>` : ''}
      </ul>
      ${ev.people ? `<div class="ev-people">${avatars(ev.people, 28)}${ev.extra ? `<span class="av more">+${ev.extra}</span>` : ''}</div>` : ''}
      ${ev.desc ? `<p class="ev-desc">${esc(ev.desc)}</p>` : ''}
      <div class="ev-actions"><button type="button" class="btn ghost" data-action="todo" data-msg="Edit agenda akan tersedia setelah sinkron kalender">${icon('edit', 14, 2)}Edit</button>
        ${ev.link ? `<a class="btn primary" href="https://${esc(ev.link.replace(/^https?:\/\//, ''))}" target="_blank" rel="noopener">${icon('video', 15, 2)}Gabung rapat</a>` : `<button type="button" class="btn primary" data-action="todo" data-msg="Petunjuk arah ke ${esc(ev.loc || 'lokasi')}">${icon('pin', 15, 2)}Lihat lokasi</button>`}</div>
    </article>`;
  }
  return `<section class="col col-right">${card}
    <article class="card glass day-tasks"><div class="card-head"><h3>Task ${sameDay(d, today()) ? 'hari ini' : 'di tanggal ini'}</h3><span class="flex"></span><a class="link" href="#/task">Semua ${icon('arrowR', 13, 2)}</a></div>
      <ul>${tasks.map((t) => `<li class="task-row${t.mine ? ' fresh' : ''}"><button type="button" class="check" data-done="${t.id}" aria-label="Tandai selesai: ${esc(t.title)}"></button><div class="tr-main"><p class="tr-title">${esc(t.title)}</p><div class="tr-sub">${duePill(t.due, t.time)}<span class="muted">${esc(t.app)} · ${t.mine ? `Prioritas ${PRIORITY[t.priority].label.toLowerCase()}` : esc(t.kind)}</span></div></div></li>`).join('') || '<li class="empty">Tidak ada task dengan tenggat di tanggal ini.</li>'}</ul>
    </article>
  </section>`;
}

export function render() {
  const v = state.ui.calView;
  return `<div class="page page-kalender view-${v}">
    ${left()}
    ${toolbar()}
    <section class="col col-center cal-col">${v === 'bulan' ? month() : v === 'minggu' ? weekView() : dayView()}</section>
    ${v === 'hari' ? detail() : ''}
  </div>`;
}

export function bind(root, rerender) {
  const go = (fn) => update(fn, { persist: false });
  root.onclick = (e) => {
    const b = e.target.closest('[data-action],[data-view],[data-nav],[data-day],[data-mini],[data-item],[data-slot],[data-done]');
    if (!b) { if (menuOpen) { menuOpen = false; rerender(); } return; }
    if (b.dataset.item) {
      e.stopPropagation();
      const id = b.dataset.item;
      if (id.startsWith('task-')) { location.hash = '#/task'; return; }
      return go((s) => { s.ui.calView = 'hari'; s.ui.calDate = parseYmd(b.dataset.date); s.ui.selectedEvent = id; });
    }
    const a = b.dataset.action;
    if (a === 'menu') { menuOpen = !menuOpen; return rerender(); }
    if (a === 'new') { menuOpen = false; rerender(); return openAgendaModal({ mode: b.dataset.mode, date: state.ui.calDate, onSaved: (it) => go((s) => { s.ui.calView = 'hari'; s.ui.calDate = parseYmd(it.due || it.date); }) }); }
    if (a === 'today') { miniMonth = null; return go((s) => { s.ui.calDate = today(); }); }
    if (a === 'todo') return toast(b.dataset.msg);
    if (b.dataset.view) return go((s) => { s.ui.calView = b.dataset.view; });
    if (b.dataset.nav) {
      const n = Number(b.dataset.nav);
      miniMonth = null;
      return go((s) => { const v = s.ui.calView; s.ui.calDate = v === 'bulan' ? addMonths(s.ui.calDate, n) : addDays(s.ui.calDate, v === 'minggu' ? 7 * n : n); });
    }
    if (b.dataset.mini) { const base = miniMonth || new Date(state.ui.calDate.getFullYear(), state.ui.calDate.getMonth(), 1); miniMonth = addMonths(base, Number(b.dataset.mini)); return rerender(); }
    if (b.dataset.slot) return openAgendaModal({ mode: 'event', date: state.ui.calDate, start: b.dataset.slot, onSaved: (it) => go((s) => { s.ui.calDate = parseYmd(it.date); }) });
    if (b.dataset.done) {
      const id = b.dataset.done;
      update((s) => { s.doneIds.push(id); });
      return toast('Task ditandai selesai', { label: 'Urungkan', run: () => update((s) => { s.doneIds = s.doneIds.filter((x) => x !== id); }) });
    }
    if (b.dataset.day) { miniMonth = null; return go((s) => { s.ui.calDate = parseYmd(b.dataset.day); s.ui.calView = 'hari'; }); }
  };
  root.onkeydown = (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.m-cell')) { e.preventDefault(); e.target.click(); } };
  root.onchange = (e) => {
    if (e.target.dataset.filter) update((s) => { s.calFilters[e.target.dataset.filter] = e.target.checked; });
  };
  // click on empty timeline space -> new agenda at that time
  root.querySelectorAll('.tl-col').forEach((col) => {
    col.addEventListener('dblclick', (e) => {
      if (e.target.closest('.blk,.ghost-slot')) return;
      const y = e.offsetY;
      const m = Math.round(((y / PX) * 60 + H0 * 60) / 30) * 30;
      openAgendaModal({ mode: 'event', date: parseYmd(col.dataset.col), start: fromMin(Math.min(Math.max(m, 7 * 60), 20 * 60)) });
    });
  });
  // scroll timeline near "now" / first event
  const sc = root.querySelector('.tl-scroll');
  if (sc) {
    const n = now();
    const target = sameDay(state.ui.calDate, today()) || state.ui.calView === 'minggu' ? Math.max(H0, Math.min(n.getHours() - 2, H1 - 8)) : 7;
    sc.scrollTop = (target - H0) * PX;
  }
}
