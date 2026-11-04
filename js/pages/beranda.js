import { icon } from '../icons.js';
import { esc, now, today, fmtLong, fmtMonth, monthMatrix, ymd, sameDay, toMin, fmtTime, greeting, DAYS_MINI, addMonths, pad } from '../utils.js';
import { USER, APPS } from '../data.js';
import { state, update, activeTasks, sortByDue, itemsForRange, counts, allTasks } from '../store.js';
import { duePill, toast, openAgendaModal, openApp, togglePop, renderNotifPop } from '../ui.js';

let calMonth = null;

function attendance() {
  const n = now();
  const nm = n.getHours() * 60 + n.getMinutes();
  const s = toMin(USER.shift.start), e = toMin(USER.shift.end);
  const a = state.attendance;
  let hint, hintTone = 'amber';
  if (a.out) { hint = `Pulang pukul ${a.out}`; hintTone = 'blue'; }
  else if (a.in) { hint = `Masuk pukul ${a.in}`; hintTone = 'green'; }
  else if (nm < s) hint = `Jam masuk: ${s - nm} menit lagi`;
  else if (nm < e) { const late = nm - s; hint = `Terlambat ${late >= 60 ? `${Math.floor(late / 60)} jam ${late % 60} mnt` : `${late} menit`}`; hintTone = 'red'; }
  else hint = 'Shift hari ini sudah selesai';
  const pct = Math.max(0, Math.min(1, (nm - s) / (e - s))) * 100;
  const status = a.out ? ['Selesai', 'blue'] : a.in ? ['Sudah masuk', 'green'] : ['Belum absen', 'amber'];
  const btn = a.out ? `<button class="btn primary clock" type="button" disabled>Selesai hari ini ${icon('check', 15, 2.4)}</button>`
    : `<button class="btn primary clock" type="button" data-action="clock">${a.in ? 'Clock Out' : 'Clock In'}<span class="btn-circ">${icon('arrowR', 16, 2.2)}</span></button>`;
  return `<article class="card glass att" aria-labelledby="attT">
    <div class="att-top">
      <div><small id="attT" class="muted">Absensi hari ini</small>
        <p class="clock-big"><span data-live="clock">${fmtTime(n).replace('.', ':')}</span><small>WIB</small></p></div>
      ${btn}
    </div>
    <div class="track" style="--p:${pct}%"><i class="track-fill"></i><i class="track-now"></i><i class="track-end"></i></div>
    <div class="att-times">
      <div><small>Masuk</small><b>${a.in || '--.--'}</b></div>
      <span class="hint hint-${hintTone}">${esc(hint)}</span>
      <div class="r"><small>Pulang</small><b>${a.out || '--.--'}</b></div>
    </div>
    <div class="att-foot">${icon('pin', 14, 2)}<span>${esc(USER.office)} · dalam radius</span><i class="ok-dot"></i><span class="flex"></span><span class="pill pill-${status[1]}"><i class="d"></i>${status[0]}</span></div>
  </article>`;
}

function taskCard() {
  const tab = state.ui.berandaTab;
  let list = sortByDue(activeTasks());
  if (tab === 'saya') list = list.filter((t) => t.kind === 'Untuk saya');
  const shown = list.slice(0, 5);
  const c = counts();
  return `<article class="card glass tasks" aria-labelledby="tsT">
    <div class="card-head"><h2 id="tsT">Task Saya</h2><span class="badge">${c.active}</span><span class="flex"></span><a class="link" href="#/task">Semua ${icon('arrowUR', 13, 2)}</a></div>
    <div class="tabs-line" role="tablist">
      <button type="button" role="tab" class="${tab === 'semua' ? 'on' : ''}" aria-selected="${tab === 'semua'}" data-btab="semua">Semua</button>
      <button type="button" class="" data-action="addTask">Tambah Task</button>
      <button type="button" role="tab" class="${tab === 'saya' ? 'on' : ''}" aria-selected="${tab === 'saya'}" data-btab="saya">Untuk saya</button>
    </div>
    <ul class="task-list scroll">
      ${shown.map((t) => `<li class="task-row">
        <button type="button" class="check" data-done="${t.id}" aria-label="Tandai selesai: ${esc(t.title)}"></button>
        <div class="tr-main"><p class="tr-title">${esc(t.title)}</p>
          <div class="tr-sub">${duePill(t.due, t.time)}<span class="muted">${esc(t.app)} · ${esc(t.kind)}</span></div></div>
      </li>`).join('') || '<li class="empty">Semua task beres. Tambah task baru bila perlu.</li>'}
    </ul>
    <a class="link foot-link" href="#/task">Lihat semua task ${icon('arrowR', 13, 2)}</a>
  </article>`;
}

function stage() {
  const n = now();
  const c = counts();
  const waiting = activeTasks().filter((t) => t.due <= ymd(today())).length;
  const newest = allTasks()[0];
  return `<section class="col col-center stage-col" aria-label="Sapaan">
    <div class="greet">
      <span class="date-pill">${icon('sun', 15, 2)}<span>${fmtLong(today())}</span></span>
      <h1>${greeting(n.getHours())}, <span class="accent">${esc(USER.name)}</span></h1>
    </div>
    <div class="stage">
      <div class="orbit o1"></div><div class="orbit o2"></div><div class="glow"></div>
      <i class="spark s1">✦</i><i class="spark s2">✦</i><i class="spark s3">✦</i>
      <i class="odot d1"></i><i class="odot d2"></i>
      <div class="platform"></div>
      <img class="mascot" src="assets/mascot.webp" alt="Maskot MySAU melambaikan tangan" width="520" height="577" onerror="this.onerror=null;this.src='assets/mascot.png'">
      <button type="button" class="float-chip fc-left glass" data-action="notif">
        <span class="fc-ic">${icon('bell', 19)}</span><span class="fc-txt"><small>Notifikasi</small><b>03<em>Notifikasi baru</em></b></span>
      </button>
      <a class="float-chip fc-right glass" href="#/task">
        <span class="fc-ic">${icon('arrowUR', 19)}</span><span class="fc-txt"><small>Task terbaru · ${esc(newest.app)}</small><b>${pad(waiting)}<em>Task menunggu Anda</em></b></span>
      </a>
    </div>
  </section>`;
}

function miniCal() {
  const t = today();
  const m = calMonth || new Date(t.getFullYear(), t.getMonth(), 1);
  const days = monthMatrix(m.getFullYear(), m.getMonth());
  const items = itemsForRange(days[0], days[41], { all: true });
  const by = {};
  items.forEach((e) => { (by[e.date] ||= []).push(e); });
  const cells = days.map((d) => {
    const k = ymd(d), list = by[k] || [];
    const out = d.getMonth() !== m.getMonth();
    const bday = list.find((e) => e.type === 'ultah');
    const note = list.find((e) => e.type === 'catatan');
    const agenda = list.some((e) => e.type === 'rapat' || e.type === 'event');
    const obs = list.some((e) => e.national);
    const sun = d.getDay() === 0;
    const tip = [bday && `🎂 ${bday.person} · ${bday.unit}`, note && `📝 ${note.title}`].filter(Boolean).join('  ');
    return `<div class="mc-cell${out ? ' out' : ''}${sameDay(d, t) ? ' today' : ''}${sun ? ' sun' : ''}${obs ? ' obs' : ''}" ${tip ? `data-tip="${esc(tip)}" tabindex="0"` : ''}>
      <span class="n">${d.getDate()}</span>${agenda && !out ? '<i class="dot"></i>' : obs && !out ? '<i class="dot obs"></i>' : '<i class="dot none"></i>'}
      ${bday && !out ? '<span class="sticker s-bday" aria-label="Ulang tahun">🎂</span>' : ''}${note && !out ? `<span class="sticker s-note${bday ? ' stack' : ''}" aria-label="Catatan">📝</span>` : ''}
    </div>`;
  }).join('');
  const nowMin = now().getHours() * 60 + now().getMinutes();
  const todays = (by[ymd(t)] || []).filter((e) => (e.type === 'rapat' || e.type === 'event') && !e.allDay);
  const upcoming = todays.filter((e) => toMin(e.end) > nowMin);
  const past = todays.filter((e) => toMin(e.end) <= nowMin).reverse();
  const show = [...upcoming, ...past].slice(0, 2);
  return `<article class="card glass minical" aria-labelledby="mcT">
    <div class="card-head"><div><small class="muted">Kalender</small><h2 id="mcT">${fmtMonth(m)}</h2></div><span class="flex"></span>
      <button type="button" class="icon-btn sm" data-mc="-1" aria-label="Bulan sebelumnya">${icon('chevL', 15, 2)}</button>
      <button type="button" class="icon-btn sm" data-mc="1" aria-label="Bulan berikutnya">${icon('chevR', 15, 2)}</button></div>
    <div class="mc-grid">${DAYS_MINI.map((x, i) => `<span class="mc-h${i === 6 ? ' sun' : ''}">${x}</span>`).join('')}${cells}</div>
    <div class="legend"><span><i class="dot"></i>Agenda</span><span><b class="mini-st">🎂</b>Ulang tahun</span><span><b class="mini-st note">📝</b>Catatan</span><span><i class="dot obs"></i>Peringatan</span></div>
    <div class="mc-today"><div class="card-head"><h3>Hari ini</h3><span class="flex"></span><small class="muted">${todays.length} agenda</small></div>
      ${show.map((e) => `<a class="agenda-row${toMin(e.end) <= nowMin ? ' past' : ''}" href="#/kalender" data-open-event="${e.id}" style="--c:${e.type === 'event' ? '#E39A2D' : '#4FA3E0'}"><span class="t">${e.start}</span><span><b>${esc(e.title)}</b><small>${esc(e.loc || '')} · ${toMin(e.end) - toMin(e.start)} mnt</small></span></a>`).join('') || '<p class="empty">Tidak ada agenda hari ini.</p>'}
    </div>
  </article>`;
}

function appsCard() {
  return `<article class="card glass apps" aria-labelledby="apT">
    <div class="card-head"><h2 id="apT">Pintasan Aplikasi</h2><span class="flex"></span><button type="button" class="link" data-action="allApps">Semua ${icon('arrowR', 13, 2)}</button></div>
    <div class="app-grid">${APPS.map((a) => `<button type="button" class="app-tile" data-app="${a.id}"><span class="app-ic">${icon(a.icon, 18)}</span><span><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></span></button>`).join('')}</div>
  </article>`;
}

export function render() {
  return `<div class="page page-beranda">
    <section class="col col-left">${attendance()}${taskCard()}</section>
    ${stage()}
    <section class="col col-right">${miniCal()}${appsCard()}</section>
  </div>`;
}

export function bind(root, rerender) {
  root.onclick = (e) => {
    const b = e.target.closest('[data-action],[data-done],[data-btab],[data-mc],[data-app],[data-open-event]');
    if (!b) return;
    if (b.dataset.action === 'clock') {
      const t = fmtTime(now());
      const wasIn = !!state.attendance.in;
      update((s) => { if (!s.attendance.in) s.attendance.in = t; else s.attendance.out = t; });
      toast(wasIn ? `Clock out tercatat pukul ${t}` : `Clock in tercatat pukul ${t} · ${USER.office}`);
    }
    if (b.dataset.action === 'addTask') openAgendaModal({ mode: 'task' });
    if (b.dataset.action === 'notif') { renderNotifPop(); togglePop(document.getElementById('notifPop'), document.getElementById('bellBtn')); e.stopPropagation(); }
    if (b.dataset.action === 'allApps') toast('Daftar lengkap aplikasi akan dihubungkan ke portal SAU');
    if (b.dataset.done) {
      const id = b.dataset.done;
      update((s) => { s.doneIds.push(id); });
      toast('Task ditandai selesai', { label: 'Urungkan', run: () => update((s) => { s.doneIds = s.doneIds.filter((x) => x !== id); }) });
    }
    if (b.dataset.btab) update((s) => { s.ui.berandaTab = b.dataset.btab; }, { persist: false });
    if (b.dataset.mc) { const base = calMonth || new Date(today().getFullYear(), today().getMonth(), 1); calMonth = addMonths(base, Number(b.dataset.mc)); rerender(); }
    if (b.dataset.app) openApp(APPS.find((a) => a.id === b.dataset.app));
    if (b.dataset.openEvent) update((s) => { s.ui.calView = 'hari'; s.ui.calDate = today(); s.ui.selectedEvent = b.dataset.openEvent; }, { persist: false });
  };
}

export function tick(root) {
  const el = root.querySelector('[data-live="clock"]');
  if (el) el.textContent = fmtTime(now()).replace('.', ':');
}
