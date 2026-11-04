import { icon } from './icons.js';
import { esc, $, $$, uid, fmtLong, ymd, parseYmd, today, now, pad, toMin, fromMin, dueLabel } from './utils.js';
import { PEOPLE, APPS, NOTIFICATIONS, CAL_TYPES, PRIORITY, USER } from './data.js';
import { state, update, allTasks, itemsForRange } from './store.js';

/* ---------- small builders ---------- */
export const avatar = (code, size = 26) => {
  const p = PEOPLE[code] || { name: code, color: '#7D8CA3' };
  return `<span class="av" style="--av:${p.color};--s:${size}px" title="${esc(p.name)}">${esc(code)}</span>`;
};
export const avatars = (codes = [], size = 26) => `<span class="avs">${codes.map((c) => avatar(c, size)).join('')}</span>`;

export function duePill(dateStr, time) {
  const d = dueLabel(dateStr, time);
  return `<span class="pill pill-${d.tone}">${icon(d.late ? 'calendar' : 'clock', 12, 2.2)}${esc(d.text)}</span>`;
}
export const prioTag = (p) => p ? `<span class="prio" style="--c:${PRIORITY[p].color}"><i></i>${PRIORITY[p].label}</span>` : '';

/* ---------- toast ---------- */
export function toast(message, action) {
  const wrap = $('#toasts');
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.innerHTML = `${icon('checkCircle', 17, 2)}<span>${esc(message)}</span>${action ? `<button type="button" class="toast-act">${esc(action.label)}</button>` : ''}<button type="button" class="toast-x" aria-label="Tutup">${icon('x', 14, 2.2)}</button>`;
  wrap.appendChild(el);
  const close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 220); };
  el.querySelector('.toast-x').onclick = close;
  if (action) el.querySelector('.toast-act').onclick = () => { action.run(); close(); };
  setTimeout(close, 5200);
}

/* ---------- popovers ---------- */
let openPop = null;
export function togglePop(pop, anchor) {
  if (openPop && openPop !== pop) closePop();
  const willOpen = pop.hidden;
  pop.hidden = !willOpen;
  anchor?.setAttribute('aria-expanded', String(willOpen));
  openPop = willOpen ? pop : null;
}
export function closePop() {
  if (!openPop) return;
  openPop.hidden = true;
  openPop = null;
  $$('[aria-expanded="true"]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
}
document.addEventListener('click', (e) => {
  if (openPop && !openPop.contains(e.target) && !e.target.closest('[aria-haspopup]') && !e.target.closest('#search')) closePop();
});

export function renderNotifPop() {
  $('#notifPop').innerHTML = `<div class="pop-head"><b>Notifikasi</b><span>${NOTIFICATIONS.length} baru</span></div>
    ${NOTIFICATIONS.map((n) => `<div class="pop-item">${avatar(n.who, 30)}<div><p>${esc(n.text)}</p><small>${esc(n.meta)} · ${esc(n.ago)}</small></div></div>`).join('')}
    <a class="pop-foot" href="#/task">Buka semua di Task ${icon('arrowR', 13, 2)}</a>`;
}
export function renderProfilePop() {
  $('#profilePop').innerHTML = `<div class="pop-profile">${avatar(USER.initials, 40)}<div><b>${esc(USER.name)}</b><small>${esc(USER.role)} · ${esc(USER.division)}</small><small>${esc(USER.office)}</small></div></div>
    <button type="button" class="pop-link" data-action="todo" data-msg="Halaman profil belum dihubungkan">${icon('user', 16)}Profil saya</button>
    <button type="button" class="pop-link" data-action="todo" data-msg="Pengaturan belum dihubungkan">${icon('settings', 16)}Pengaturan</button>
    <button type="button" class="pop-link" data-action="todo" data-msg="Keluar belum dihubungkan ke SSO">${icon('logout', 16)}Keluar</button>`;
}

/* ---------- global search ---------- */
export function initSearch(go) {
  const input = $('#searchInput');
  const box = $('#searchResults');
  const run = () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { box.hidden = true; return; }
    const apps = APPS.filter((a) => (a.name + a.desc).toLowerCase().includes(q)).slice(0, 4);
    const tasks = allTasks().filter((t) => (t.title + t.app).toLowerCase().includes(q)).slice(0, 4);
    const t0 = today();
    const evs = itemsForRange(new Date(t0.getFullYear(), t0.getMonth() - 1, 1), new Date(t0.getFullYear(), t0.getMonth() + 2, 0), { all: true })
      .filter((e) => e.type !== 'task' && e.title.toLowerCase().includes(q)).slice(0, 4);
    const people = Object.entries(PEOPLE).filter(([, p]) => p.name.toLowerCase().includes(q)).slice(0, 3);
    const sec = (title, rows) => rows.length ? `<div class="sr-sec"><small>${title}</small>${rows.join('')}</div>` : '';
    box.innerHTML = sec('Aplikasi', apps.map((a) => `<button type="button" class="sr-row" data-go="app" data-id="${a.id}">${icon(a.icon, 16)}<span>${esc(a.name)}</span><em>${esc(a.desc)}</em></button>`))
      + sec('Task', tasks.map((t) => `<button type="button" class="sr-row" data-go="task" data-id="${t.id}">${icon('task', 16)}<span>${esc(t.title)}</span><em>${esc(t.app)}</em></button>`))
      + sec('Agenda', evs.map((e) => `<button type="button" class="sr-row" data-go="event" data-date="${e.date}" data-id="${e.id}">${icon('calendar', 16)}<span>${esc(e.title)}</span><em>${esc(fmtShortSafe(e.date))}</em></button>`))
      + sec('Rekan kerja', people.map(([code, p]) => `<div class="sr-row">${avatar(code, 22)}<span>${esc(p.name)}</span></div>`))
      || `<p class="sr-empty">Tidak ada hasil untuk “${esc(input.value)}”. Coba nama aplikasi, task, atau agenda.</p>`;
    box.hidden = false;
  };
  input.addEventListener('input', run);
  input.addEventListener('focus', run);
  input.addEventListener('keydown', (e) => { if (e.key === 'Escape') { input.blur(); box.hidden = true; } });
  box.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (!b) return;
    box.hidden = true; input.value = '';
    if (b.dataset.go === 'app') { const a = APPS.find((x) => x.id === b.dataset.id); openApp(a); }
    if (b.dataset.go === 'task') go('task');
    if (b.dataset.go === 'event') { update((s) => { s.ui.calView = 'hari'; s.ui.calDate = parseYmd(b.dataset.date); s.ui.selectedEvent = b.dataset.id; }, { persist: false }); go('kalender'); }
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('#search')) box.hidden = true; });
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); input.focus(); input.select(); }
  });
}
const fmtShortSafe = (s) => { const d = parseYmd(s); return `${d.getDate()}/${d.getMonth() + 1}`; };

export function openApp(a) {
  if (!a) return;
  if (a.url && a.url !== '#') window.open(a.url, '_blank', 'noopener');
  else toast(`Tautan ${a.name} belum diatur — isi url di js/data.js`);
}

/* ---------- Buat agenda modal ---------- */
const TIME_OPTS = Array.from({ length: 30 }, (_, i) => fromMin(7 * 60 + i * 30));

export function openAgendaModal({ mode = 'event', date = today(), start, onSaved } = {}) {
  const root = $('#modalRoot');
  const t = now();
  const nextSlot = start || fromMin(Math.min(17 * 60, Math.max(8 * 60, Math.ceil((t.getHours() * 60 + t.getMinutes()) / 30) * 30)));
  const st = { mode, date: ymd(date), start: nextSlot, end: fromMin(toMin(nextSlot) + 60), guests: [], type: 'rapat', app: 'Pervorms', priority: 'sedang', allDay: false };
  const lastFocus = document.activeElement;

  const timeSelect = (name, val) => `<select name="${name}" class="fld-time" aria-label="${name === 'end' ? 'Jam selesai' : 'Jam'}">${TIME_OPTS.map((x) => `<option ${x === val ? 'selected' : ''}>${x}</option>`).join('')}</select>`;
  const dateField = (label) => `<label class="fld-date"><span>${fmtLong(parseYmd(st.date))}</span><input type="date" name="date" value="${st.date}" aria-label="${label}"></label>`;

  const body = () => st.mode === 'event' ? `
      <div class="row">${icon('clock', 18)}<div class="row-main">
        <div class="inline">${dateField('Tanggal')}${st.allDay ? '' : `${timeSelect('start', st.start)}<span class="dash">–</span>${timeSelect('end', st.end)}`}</div>
        <div class="inline sub"><span>Tidak berulang · WIB (GMT+7)</span><label class="switch"><input type="checkbox" name="allDay" ${st.allDay ? 'checked' : ''}><i></i>Sepanjang hari</label></div>
      </div></div>
      <div class="row">${icon('users', 18)}<div class="row-main chips-in">${st.guests.map((g, i) => `<span class="chip">${avatar(g.code, 20)}${esc(g.name)}<button type="button" data-rm-guest="${i}" aria-label="Hapus ${esc(g.name)}">${icon('x', 12, 2.4)}</button></span>`).join('')}<input name="guest" placeholder="Tambah tamu (nama lalu Enter)" list="peopleList"></div></div>
      <datalist id="peopleList">${Object.values(PEOPLE).map((p) => `<option value="${esc(p.name)}">`).join('')}</datalist>
      <div class="row">${icon('video', 18)}<div class="row-main"><input name="link" placeholder="Tambahkan link Google Meet / Zoom" class="fld-plain link"></div></div>
      <div class="row">${icon('pin', 18)}<div class="row-main"><input name="loc" placeholder="Tambah lokasi" value="Ruang Rapat Lt. 5 · ${esc(USER.office)}" class="fld-plain"></div></div>
      <div class="row">${icon('bell', 18)}<div class="row-main"><select name="remind" class="fld-plain"><option>Ingatkan 15 menit sebelumnya</option><option>Ingatkan 30 menit sebelumnya</option><option>Ingatkan 1 jam sebelumnya</option><option>Tanpa pengingat</option></select></div></div>
      <div class="row">${icon('align', 18)}<div class="row-main"><textarea name="desc" rows="1" placeholder="Tambah deskripsi atau lampiran" class="fld-plain"></textarea></div></div>
      <div class="row">${icon('calendar', 18)}<div class="row-main chips">${['rapat', 'event', 'cuti'].map((k) => `<button type="button" class="opt ${st.type === k ? 'on' : ''}" data-type="${k}" style="--c:${CAL_TYPES[k].color}"><i></i>${k === 'rapat' ? 'Rapat' : k === 'event' ? 'Event kantor' : 'Cuti & hari besar'}${st.type === k ? icon('check', 13, 2.4) : ''}</button>`).join('')}</div></div>
      <p class="note">${esc(USER.name)} · Sibuk · Visibilitas default · Undangan dikirim lewat email & notifikasi MySAU</p>`
    : `
      <div class="row">${icon('clock', 18)}<div class="row-main">
        <div class="inline"><span class="lbl">Tenggat</span>${dateField('Tanggal tenggat')}${timeSelect('start', st.start)}</div>
        <div class="inline sub"><span>Tidak berulang · WIB (GMT+7)</span></div>
      </div></div>
      <div class="row">${icon('grid', 18)}<div class="row-main"><small class="cap">Aplikasi terkait</small><div class="chips">${['Pervorms', 'HRIS', 'Talent', 'Assessment', 'InOffice'].map((a) => `<button type="button" class="opt ${st.app === a ? 'on' : ''}" data-app="${a}" style="--c:#2F6FD0"><i></i>${a}${st.app === a ? icon('check', 13, 2.4) : ''}</button>`).join('')}</div></div></div>
      <div class="row">${icon('user', 18)}<div class="row-main chips-in"><span class="chip">${avatar('SY', 20)}Saya (${esc(USER.name)})</span><button type="button" class="link-btn" data-action="todo" data-msg="Delegasi akan tersedia setelah terhubung ke HRIS">+ Delegasikan</button></div></div>
      <div class="row">${icon('flag', 18)}<div class="row-main"><small class="cap">Prioritas</small><div class="chips">${Object.entries(PRIORITY).filter(([k]) => k).reverse().map(([k, p]) => `<button type="button" class="opt ${st.priority === k ? 'on' : ''}" data-prio="${k}" style="--c:${p.color}"><i></i>${p.label}${st.priority === k ? icon('check', 13, 2.4) : ''}</button>`).join('')}</div></div></div>
      <div class="row">${icon('bell', 18)}<div class="row-main"><select name="remind" class="fld-plain"><option>Ingatkan 1 jam sebelum tenggat</option><option>Ingatkan 1 hari sebelum tenggat</option><option>Tanpa pengingat</option></select></div></div>
      <div class="row">${icon('align', 18)}<div class="row-main"><textarea name="desc" rows="1" placeholder="Tambah deskripsi atau checklist" class="fld-plain"></textarea></div></div>
      <p class="note">Task otomatis tersinkron ke tab Task dan muncul di ringkasan “Task yang menunggu Anda”.</p>`;

  const render = () => {
    const title = root.querySelector('[name=title]')?.value || '';
    root.innerHTML = `<div class="scrim" data-close></div>
      <form class="modal glass-strong" role="dialog" aria-modal="true" aria-labelledby="mTitle" novalidate>
        <div class="md-head"><div class="md-title"><small id="mTitle">${st.mode === 'event' ? 'Agenda baru' : 'Task baru'}</small>
          <input name="title" class="m-title" placeholder="${st.mode === 'event' ? 'Judul agenda, mis. Rapat sinkronisasi vendor' : 'Judul task, mis. Kirim laporan KPI Q4'}" value="${esc(title)}" required autocomplete="off" aria-labelledby="mTitle"></div>
          <button type="button" class="icon-btn sm" data-close aria-label="Tutup">${icon('x', 16, 2)}</button></div>
        <div class="seg sm" role="tablist"><button type="button" role="tab" aria-selected="${st.mode === 'event'}" data-mode="event" class="${st.mode === 'event' ? 'on' : ''}">${icon('calendar', 14)}Event</button><button type="button" role="tab" aria-selected="${st.mode === 'task'}" data-mode="task" class="${st.mode === 'task' ? 'on' : ''}">${icon('task', 14)}Task</button></div>
        <div class="m-body">${body()}</div>
        <p class="m-error" hidden>Isi judul dulu sebelum menyimpan.</p>
        <div class="m-foot"><button type="button" class="link-btn" data-action="todo" data-msg="Opsi lanjutan akan tersedia di versi berikutnya">Opsi lainnya</button><span class="flex"></span>
          <button type="button" class="btn ghost" data-close>Batal</button>
          <button type="submit" class="btn primary">${icon('check', 15, 2.4)}${st.mode === 'event' ? 'Simpan' : 'Simpan task'}</button></div>
      </form>`;
    root.classList.add('open');
    root.querySelector('[name=title]').focus();
  };

  const field = (name) => root.querySelector(`[name="${name}"]`);
  const val = (name) => field(name)?.value ?? '';
  const readFields = () => {
    if (!root.querySelector('form')) return;
    st.date = val('date') || st.date;
    if (field('start')) st.start = val('start');
    if (field('end')) st.end = val('end');
  };

  const close = () => { root.classList.remove('open'); root.innerHTML = ''; document.removeEventListener('keydown', onKey); lastFocus?.focus?.(); };
  const onKey = (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') { // focus trap
      const els = $$('button, input, select, textarea', root).filter((x) => !x.disabled);
      if (!els.length) return;
      if (e.shiftKey && document.activeElement === els[0]) { e.preventDefault(); els.at(-1).focus(); }
      else if (!e.shiftKey && document.activeElement === els.at(-1)) { e.preventDefault(); els[0].focus(); }
    }
  };
  document.addEventListener('keydown', onKey);

  root.onclick = (e) => {
    if (e.target.matches?.('.fld-date input')) { try { e.target.showPicker(); } catch { /* browser lama: input tetap bisa diketik */ } return; }
    const el = e.target.closest('button, .scrim');
    if (!el) return;
    if (el.hasAttribute('data-close')) return close();
    readFields();
    if (el.dataset.mode) { st.mode = el.dataset.mode; render(); }
    if (el.dataset.type) { st.type = el.dataset.type; render(); }
    if (el.dataset.app) { st.app = el.dataset.app; render(); }
    if (el.dataset.prio) { st.priority = el.dataset.prio; render(); }
    if (el.dataset.rmGuest) { st.guests.splice(Number(el.dataset.rmGuest), 1); render(); }
    if (el.dataset.action === 'todo') toast(el.dataset.msg);
  };
  root.onchange = (e) => {
    if (e.target.name === 'date' && e.target.value) { st.date = e.target.value; e.target.previousElementSibling.textContent = fmtLong(parseYmd(st.date)); }
    if (e.target.name === 'allDay') { readFields(); st.allDay = e.target.checked; render(); }
    if (e.target.name === 'start' && st.mode === 'event') { st.start = e.target.value; if (toMin(st.end) <= toMin(st.start)) { st.end = fromMin(Math.min(toMin(st.start) + 60, 22 * 60)); render(); } }
  };
  root.onkeydown = (e) => {
    if (e.target.name === 'guest' && e.key === 'Enter') {
      e.preventDefault();
      const v = e.target.value.trim();
      if (!v) return;
      readFields();
      const code = Object.entries(PEOPLE).find(([, p]) => p.name.toLowerCase() === v.toLowerCase())?.[0] || v.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
      st.guests.push({ code, name: v });
      render();
      root.querySelector('[name=guest]').focus();
    }
  };
  root.onsubmit = (e) => {
    e.preventDefault();
    const f = e.target;
    const titleEl = f.querySelector('[name=title]');
    const title = titleEl.value.trim();
    if (!title) { root.querySelector('.m-error').hidden = false; titleEl.focus(); return; }
    readFields();
    if (st.mode === 'event') {
      const ev = { id: uid('ev'), type: st.type, date: st.date, title, allDay: st.allDay, start: st.allDay ? '' : st.start, end: st.allDay ? '' : st.end, loc: val('loc'), link: val('link'), desc: val('desc'), people: ['SY', ...st.guests.map((g) => g.code)], remind: val('remind'), mine: true };
      update((s) => { s.userEvents.push(ev); s.ui.selectedEvent = ev.id; });
      close();
      toast(st.guests.length ? `Agenda disimpan · undangan terkirim ke ${st.guests.length} tamu` : 'Agenda disimpan', { label: 'Lihat di Kalender', run: () => { update((s) => { s.ui.calView = 'hari'; s.ui.calDate = parseYmd(ev.date); s.ui.selectedEvent = ev.id; }, { persist: false }); location.hash = '#/kalender'; } });
      onSaved?.(ev, true);
    } else {
      const tk = { id: uid('tk'), title, app: st.app, code: `${st.app.slice(0, 2).toUpperCase()}/${parseYmd(st.date).getFullYear()}/${pad(Math.floor(Math.random() * 900) + 100)}`, due: st.date, time: st.start, priority: st.priority, kind: 'Untuk saya', loc: 'Jakarta', sub: [0, 1], comments: 0, files: 0, people: ['SY'], desc: val('desc'), mine: true };
      update((s) => { s.userTasks.unshift(tk); });
      close();
      toast('Task disimpan · tersinkron ke tab Task', { label: 'Lihat di Task', run: () => { location.hash = '#/task'; } });
      onSaved?.(tk, true);
    }
  };
  render();
}

export { fmtLong, dueLabel };
