import { icon, hydrateIcons } from './icons.js';
import { $, esc } from './utils.js';
import { USER } from './data.js';
import { subscribe, counts } from './store.js';
import { toast, togglePop, closePop, renderNotifPop, renderProfilePop, initSearch } from './ui.js';
import * as beranda from './pages/beranda.js';
import * as task from './pages/task.js';
import * as kalender from './pages/kalender.js';

const PAGES = { beranda, task, kalender };
const TITLES = { beranda: 'Beranda', task: 'Task', kalender: 'Kalender' };
const app = $('#app');
let current = null;

const route = () => {
  const r = (location.hash.replace(/^#\/?/, '') || 'beranda').split('?')[0];
  return PAGES[r] ? r : 'beranda';
};

function renderShell(r) {
  const c = counts();
  const navItems = [
    ['beranda', 'home', 'Beranda'], ['task', 'task', 'Task'], ['kalender', 'calendar', 'Kalender'],
  ];
  $('#sideNav').innerHTML = navItems.map(([k, ic, label]) => `<a class="side-btn${r === k ? ' on' : ''}" href="#/${k}" aria-label="${label}" ${r === k ? 'aria-current="page"' : ''}>${icon(ic, 21)}</a>`).join('')
    + `<span class="side-div"></span>
       <button type="button" class="side-btn" data-action="todo" data-msg="Semua aplikasi SAU tersedia di Pintasan Aplikasi (Beranda)" aria-label="Semua aplikasi">${icon('grid', 21)}</button>
       <button type="button" class="side-btn" data-action="todo" data-msg="InOffice belum dihubungkan" aria-label="InOffice">${icon('mail', 21)}</button>`;
  $('.side-help').innerHTML = icon('help', 21);
  const badges = { task: c.active, kalender: c.agendaToday };
  // 3 tab di desktop; di HP tab bar memuat 5 menu sidebar dalam bentuk ikon saja
  $('#tabbar').innerHTML = navItems.map(([k, ic, label]) => `<a class="tab${r === k ? ' on' : ''}" href="#/${k}" aria-label="${label}" ${r === k ? 'aria-current="page"' : ''}>${icon(ic, 18, 1.9)}<span>${label}</span>${badges[k] ? `<b class="tb-badge">${badges[k]}</b>` : ''}</a>`).join('')
    + `<button type="button" class="tab tab-extra" data-action="todo" data-msg="Semua aplikasi SAU tersedia di Pintasan Aplikasi (Beranda)" aria-label="Semua aplikasi">${icon('grid', 18, 1.9)}</button>
       <button type="button" class="tab tab-extra" data-action="todo" data-msg="InOffice belum dihubungkan" aria-label="InOffice">${icon('mail', 18, 1.9)}</button>`;
  $('#profileName').textContent = USER.name;
  $('#profileRole').textContent = `${USER.role} · ${USER.division}`;
}

function render({ focus = false } = {}) {
  const r = route();
  const page = PAGES[r];
  const scrolls = [...app.querySelectorAll('.scroll')].map((el) => el.scrollTop);
  renderShell(r);
  // animasi Beranda = satu timeline 12 detik; offset ini menjaga fasenya tetap jalan saat render ulang
  app.style.setProperty('--tl', `${(-(performance.now() % 12000) / 1000).toFixed(3)}s`);
  app.innerHTML = page.render();
  app.dataset.page = r;
  page.bind(app, () => render());
  if (r === current) app.querySelectorAll('.scroll').forEach((el, i) => { if (scrolls[i] != null && !el.classList.contains('tl-scroll')) el.scrollTop = scrolls[i]; });
  if (r !== current) {
    document.title = `${TITLES[r]} — MySAU`;
    if (focus) app.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  current = r;
}

/* global UI */
hydrateIcons();
initSearch((r) => { location.hash = `#/${r}`; });
$('#bellBtn').addEventListener('click', (e) => { e.stopPropagation(); renderNotifPop(); togglePop($('#notifPop'), e.currentTarget); });
$('#profileBtn').addEventListener('click', (e) => { e.stopPropagation(); renderProfilePop(); togglePop($('#profilePop'), e.currentTarget); });
document.addEventListener('click', (e) => {
  const t = e.target.closest('.sidebar [data-action="todo"], .tabbar [data-action="todo"], .popover [data-action="todo"], .side-help');
  if (!t) return;
  closePop();
  toast(t.dataset.msg || 'Pusat bantuan: hubungi IT Service Desk');
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePop(); });

window.addEventListener('hashchange', () => { closePop(); render({ focus: true }); });
subscribe(() => render());
render();

// live clock + minute refresh (attendance hint, now-line)
let lastMin = new Date().getMinutes();
setInterval(() => {
  if (current === 'beranda') beranda.tick(app);
  const m = new Date().getMinutes();
  if (m !== lastMin) { lastMin = m; if (!document.querySelector('.modal-root.open') && !app.contains(document.activeElement)) render(); }
}, 1000);

export { esc };
