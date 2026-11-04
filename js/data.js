// Contoh data. Ganti dengan respons API HRIS / Pervorms / InOffice saat integrasi.
import { addDays, ymd, DAYS } from './utils.js';

export const USER = {
  name: 'Siyono',
  initials: 'SY',
  role: 'Dept. Head',
  division: 'Divisi Teknologi Informasi',
  office: 'Kantor Pusat SAU',
  shift: { start: '08.00', end: '17.00' },
};

// Ganti url dengan alamat aplikasi masing-masing.
export const APPS = [
  { id: 'hris', name: 'HRIS', desc: 'Kepegawaian', icon: 'users', url: '#' },
  { id: 'assessment', name: 'Assessment', desc: 'Kompetensi', icon: 'award', url: '#' },
  { id: 'pervorms', name: 'Pervorms', desc: 'Kinerja & KPI', icon: 'trend', url: '#' },
  { id: 'recruitment', name: 'Recruitment', desc: 'Rekrutmen', icon: 'brief', url: '#' },
  { id: 'talent', name: 'Talent', desc: 'Talenta', icon: 'star', url: '#' },
  { id: 'inoffice', name: 'InOffice', desc: 'Persuratan', icon: 'mail', url: '#' },
];

export const PEOPLE = {
  SY: { name: 'Siyono', color: '#2F6FD0' },
  AN: { name: 'Andi N.', color: '#5B8FDD' },
  RK: { name: 'Rina Kartika', color: '#8C7BE0' },
  DP: { name: 'Dimas Pratama', color: '#3DAFA3' },
  SR: { name: 'Siti R.', color: '#E8A23C' },
  BS: { name: 'Budi Santoso', color: '#D9577A' },
  AR: { name: 'A. Rahman', color: '#E08A3C' },
};

export const CAL_TYPES = {
  task: { label: 'Task & tenggat', color: '#2F6FD0' },
  rapat: { label: 'Rapat', color: '#2BAE9E' },
  event: { label: 'Event kantor', color: '#E39A2D' },
  cuti: { label: 'Cuti & hari besar', color: '#D9577A' },
  ultah: { label: 'Ulang tahun rekan', color: '#9C8BE8' },
};

export const PRIORITY = {
  tinggi: { label: 'Tinggi', color: '#D9577A' },
  sedang: { label: 'Sedang', color: '#E39A2D' },
  rendah: { label: 'Rendah', color: '#3DAFA3' },
};

// Hari peringatan/libur nasional berulang (bulan-tanggal)
const NATIONAL = {
  '01-01': ['Tahun Baru', true], '05-01': ['Hari Buruh', true], '06-01': ['Hari Lahir Pancasila', true],
  '08-17': ['HUT Kemerdekaan RI', true], '10-01': ['Hari Kesaktian Pancasila', false], '10-28': ['Sumpah Pemuda', false],
  '11-10': ['Hari Pahlawan', false], '11-25': ['Hari Guru Nasional', false], '12-24': ['Cuti bersama Natal', true],
  '12-25': ['Hari Raya Natal', true],
};

export function buildSeed(t) {
  const D = (n) => ymd(addDays(t, n));
  const tasks = [
    { id: 't1', focus: 3, title: 'Selesaikan SO pelanggan PT ABC', app: 'Sales Order', code: 'SO/2026/00125', due: D(0), time: '17.00', priority: 'tinggi', kind: 'Untuk saya', loc: 'Jakarta', sub: [3, 5], comments: 3, files: 4, people: ['AN', 'RK', 'DP'] },
    { id: 't2', focus: 2, title: 'Review proposal penawaran', app: 'SAUMail', code: 'SM/2026/0042', due: D(0), time: '15.00', priority: 'sedang', kind: 'Approval', loc: 'Jakarta', sub: [2, 4], comments: 2, files: 1, people: ['RK', 'BS'] },
    { id: 't3', focus: 1, title: 'Tindak lanjut temuan APAR', app: 'Digital Patrol', code: 'DP/2026/0087', due: D(-1), time: '', priority: 'tinggi', kind: 'Untuk saya', loc: 'Medan', sub: [1, 3], comments: 1, files: 2, people: ['DP', 'SR'] },
    { id: 't4', focus: 4, title: 'Susun Performance Planning', app: 'Pervorms', code: 'PV/2026/0036', due: D(1), time: '12.00', priority: 'sedang', kind: 'Untuk saya', loc: 'Jakarta', sub: [1, 6], comments: 2, files: 0, people: ['SR', 'AN', 'RK'] },
    { id: 't5', title: 'Review Performance Planning tim IT', app: 'Pervorms', code: 'PV/2026/0031', due: D(0), time: '17.00', priority: 'tinggi', kind: 'Approval', loc: 'Jakarta', sub: [0, 2], comments: 1, files: 1, people: ['SY'] },
    { id: 't6', title: 'Persetujuan cuti — A. Rahman', app: 'HRIS', code: 'CT/2026/0412', due: D(0), time: '', priority: 'tinggi', kind: 'Approval', loc: 'Medan', sub: [0, 1], comments: 0, files: 1, people: ['AR'] },
    { id: 't7', title: 'Approve lembur — Tim Infrastruktur', app: 'HRIS', code: 'LB/2026/0198', due: D(1), time: '', priority: 'sedang', kind: 'Approval', loc: 'Surabaya', sub: [0, 1], comments: 0, files: 0, people: ['DP'] },
    { id: 't8', title: 'Lengkapi Self Assessment', app: 'Assessment', code: 'AS/2026/0077', due: D(2), time: '', priority: 'sedang', kind: 'Untuk saya', loc: 'Jakarta', sub: [2, 5], comments: 0, files: 0, people: ['SY'] },
    { id: 't9', title: 'Isi timesheet Oktober', app: 'HRIS', code: 'TS/2026/1031', due: D(3), time: '', priority: 'rendah', kind: 'Untuk saya', loc: 'Jakarta', sub: [0, 1], comments: 0, files: 0, people: ['SY'] },
    { id: 't10', title: 'Kirim penawaran revisi ke PT Delta', app: 'SAUMail', code: 'SM/2026/0049', due: D(2), time: '10.00', priority: 'sedang', kind: 'Untuk saya', loc: 'Surabaya', sub: [1, 3], comments: 4, files: 2, people: ['BS', 'RK'] },
    { id: 't11', title: 'Audit APAR gedung B', app: 'Digital Patrol', code: 'DP/2026/0091', due: D(5), time: '', priority: 'rendah', kind: 'Untuk saya', loc: 'Balikpapan', sub: [0, 4], comments: 0, files: 0, people: ['DP'] },
    { id: 't12', title: 'Follow-up SO PT Nusantara', app: 'Sales Order', code: 'SO/2026/00131', due: D(6), time: '', priority: 'sedang', kind: 'Untuk saya', loc: 'Makassar', sub: [0, 2], comments: 1, files: 0, people: ['AN'] },
    { id: 't13', title: 'Verifikasi klaim reimbursement', app: 'HRIS', code: 'RB/2026/0233', due: D(2), time: '', priority: 'tinggi', kind: 'Approval', loc: 'Jayapura', sub: [0, 1], comments: 0, files: 3, people: ['SR'] },
    { id: 't14', title: 'Rekap KPI bulanan', app: 'Pervorms', code: 'PV/2026/0040', due: D(8), time: '', priority: 'rendah', kind: 'Untuk saya', loc: 'Jakarta', sub: [0, 3], comments: 0, files: 0, people: ['SY'] },
  ];

  const history = [
    { id: 'h1', title: 'Konfirmasi peserta pelatihan Q4', app: 'Talent', doneAt: D(0), time: '08.40' },
    { id: 'h2', title: 'Validasi data aset TI', app: 'Assessment', doneAt: D(0), time: '09.05' },
    { id: 'h3', title: 'Rekap absensi Oktober', app: 'HRIS', doneAt: D(-1), time: '16.20' },
    { id: 'h4', title: 'Approve PO perangkat jaringan', app: 'Procurement', doneAt: D(-1), time: '11.10' },
    { id: 'h5', title: 'Update SOP backup server', app: 'InOffice', doneAt: D(-2), time: '14.00' },
  ];

  const dayName = DAYS[t.getDay()];
  // Jadwal hari ini (dipakai di Beranda, Kalender Hari & Minggu)
  const events = [
    { id: 'e1', type: 'rapat', date: D(0), start: '08.00', end: '08.30', title: 'Stand-up Tim Infra', loc: 'Ruang Tim Infra' },
    {
      id: 'e2', type: 'rapat', date: D(0), start: '09.00', end: '10.30', title: 'Review sistem cuti baru', loc: 'Ruang Rapat Lt. 5', code: 'RPT-2031',
      repeat: `Setiap ${dayName}`, link: 'meet.mysau.id/hr-cuti', people: ['SY', 'SR', 'AR', 'DP'], extra: 2, attend: '4 hadir, 2 belum konfirmasi',
      desc: 'Bahas alur pengajuan cuti di HRIS v2 dan integrasi approval atasan ke MySAU.',
    },
    { id: 'e3', type: 'rapat', date: D(0), start: '11.00', end: '12.00', title: '1:1 dengan Siti R. — HRIS', loc: 'Google Meet', people: ['SY', 'SR'] },
    { id: 'e4', type: 'event', date: D(0), start: '14.30', end: '15.30', title: 'Demo dashboard Pervorms', loc: 'Ruang Inovasi' },
    { id: 'e5', type: 'rapat', date: D(0), start: '16.00', end: '16.30', title: 'Rekap harian tim Infra', loc: 'Ruang Tim Infra' },
    // Minggu ini & bulan ini
    { id: 'e6', type: 'rapat', date: D(1), start: '10.00', end: '11.00', title: 'Rapat anggaran TI', loc: 'Ruang Rapat Lt. 3' },
    { id: 'e7', type: 'event', date: D(2), start: '14.00', end: '15.30', title: 'Townhall Q4', loc: 'Auditorium' },
    { id: 'e8', type: 'rapat', date: D(3), start: '15.00', end: '16.00', title: 'Retro sprint', loc: 'Google Meet' },
    { id: 'e9', type: 'event', date: D(6), allDay: true, title: 'Pelatihan Q4 · Hari 1', loc: 'Learning Center' },
    { id: 'e10', type: 'event', date: D(7), allDay: true, title: 'Pelatihan Q4 · Hari 2', loc: 'Learning Center' },
    { id: 'e11', type: 'rapat', date: D(8), start: '09.30', end: '10.00', title: '1:1 dengan Siti R.', loc: 'Google Meet' },
    { id: 'e12', type: 'rapat', date: D(9), start: '13.00', end: '14.30', title: 'Steering committee', loc: 'Ruang Direksi' },
    { id: 'e13', type: 'event', date: D(10), start: '16.00', end: '17.00', title: 'Sharing session keamanan siber', loc: 'Ruang Inovasi' },
    { id: 'e14', type: 'rapat', date: D(13), start: '09.00', end: '10.00', title: 'Kickoff audit internal', loc: 'Ruang Rapat Lt. 5' },
    { id: 'e15', type: 'cuti', date: D(15), allDay: true, title: 'Cuti — A. Rahman' },
    { id: 'e16', type: 'rapat', date: D(16), start: '10.00', end: '11.00', title: 'Review vendor HRIS', loc: 'Ruang Rapat Lt. 3' },
    { id: 'e17', type: 'event', date: D(17), allDay: true, title: 'Townhall Medan', loc: 'Kantor Medan' },
    { id: 'e18', type: 'rapat', date: D(20), start: '09.00', end: '10.30', title: 'Sprint planning', loc: 'Ruang Tim Infra' },
    { id: 'e19', type: 'rapat', date: D(22), start: '14.00', end: '15.00', title: 'Demo HRIS v2', loc: 'Auditorium' },
    { id: 'e20', type: 'event', date: D(23), allDay: true, title: 'Outing divisi TI', loc: 'Bogor' },
    { id: 'e21', type: 'rapat', date: D(-1), start: '09.00', end: '10.00', title: 'Weekly sync', loc: 'Ruang Rapat Lt. 5' },
    { id: 'e22', type: 'rapat', date: D(-7), start: '10.00', end: '11.00', title: 'Retro Q3', loc: 'Google Meet' },
    // Ulang tahun & catatan (stiker di kalender Beranda)
    { id: 'b1', type: 'ultah', date: D(0), allDay: true, title: 'Ulang tahun Rina Kartika', person: 'Rina Kartika', unit: 'Finance' },
    { id: 'b2', type: 'ultah', date: D(2), allDay: true, title: 'Ulang tahun Dimas Pratama', person: 'Dimas Pratama', unit: 'IT Infrastruktur' },
    { id: 'b3', type: 'ultah', date: D(4), allDay: true, title: 'Ulang tahun Ayu Lestari', person: 'Ayu Lestari', unit: 'Human Capital' },
    { id: 'b4', type: 'ultah', date: D(15), allDay: true, title: 'Ulang tahun Siti R.', person: 'Siti R.', unit: 'HRIS' },
    { id: 'b5', type: 'ultah', date: D(24), allDay: true, title: 'Ulang tahun Maya Putri', person: 'Maya Putri', unit: 'Legal' },
    { id: 'n1', type: 'catatan', date: D(1), allDay: true, title: 'Siapkan bahan Self Assessment' },
    { id: 'n2', type: 'catatan', date: D(10), allDay: true, title: 'Perpanjang lisensi antivirus' },
  ];

  return { tasks, history, events };
}

export function nationalDays(year, month) {
  const out = [];
  Object.entries(NATIONAL).forEach(([md, [title, libur]]) => {
    const [m, d] = md.split('-').map(Number);
    if (m - 1 === month) out.push({ id: `nat-${year}-${md}`, type: 'cuti', national: true, libur, date: `${year}-${md}`, allDay: true, title });
  });
  return out;
}

export const NOTIFICATIONS = [
  { who: 'AR', text: 'A. Rahman mengajukan cuti 3 hari', meta: 'HRIS · butuh approval Anda', ago: '5 mnt' },
  { who: 'RK', text: 'Rina berkomentar di "Review proposal penawaran"', meta: 'SAUMail', ago: '30 mnt' },
  { who: 'DP', text: 'Dimas menyelesaikan "Validasi data aset TI"', meta: 'Assessment', ago: '1 jam' },
];

export const ACTIVITY = [
  { who: 'AN', text: 'Andi mengundang Anda', ref: 'Review proposal penawaran', icon: 'file', ago: '10 mnt lalu' },
  { who: 'RK', text: 'Rina berkomentar', quote: '“Data pesanan sudah dilengkapi.”', ago: '30 mnt lalu' },
  { who: 'DP', text: 'Dimas menyelesaikan task', ref: 'Validasi data aset TI', icon: 'checkCircle', ago: '1 jam lalu' },
  { who: 'BS', text: 'Budi menugaskan Anda', ref: 'Susun Performance Planning', icon: 'file', ago: '2 jam lalu' },
];
