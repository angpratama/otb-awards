/* =====================================================
   KONFIG — EDIT DI SINI
   ===================================================== */
const EVENT_DATE_STR = '2026-02-14T19:00:00+07:00'; // tanggal malam penganugerahan
const LS_KEY = 'boysAwards_me_v3'; // data pribadi perangkat ini

/* ====== ANGGOTA OTB — GANTI NAMA + USERNAME KALIAN ====== */
const ROSTER = [
    { name: 'Nama Satu', usn: 'user01' },
    { name: 'Nama Dua', usn: 'user02' },
    { name: 'Nama Tiga', usn: 'user03' },
    { name: 'Nama Empat', usn: 'user04' },
    { name: 'Nama Lima', usn: 'user05' },
    { name: 'Nama Enam', usn: 'user06' },
    { name: 'Nama Tujuh', usn: 'user07' },
    { name: 'Nama Delapan', usn: 'user08' },
];

const FOTO_ANGGOTA = {
    user01: 'https://i.imgur.com/abc.jpg',
    user02: 'https://i.imgur.com/def.jpg',
    user03: 'https://i.imgur.com/ghi.jpg',
    user04: 'https://i.imgur.com/jkl.jpg',
    user05: 'https://i.imgur.com/mno.jpg',
    user06: 'https://i.imgur.com/pqr.jpg',
    user07: 'https://i.imgur.com/stu.jpg',
    user08: 'https://i.imgur.com/vwx.jpg'
};

/* ====== DATA PRIBADI perangkat ini (identitas, catatan usulan & pilihanmu) ====== */
function defaultMe() { return { myUsn: null, myNoms: [], myVotes: {} }; }
function loadMe() {
    try { const s = JSON.parse(localStorage.getItem(LS_KEY)); if (s) return Object.assign(defaultMe(), s); } catch (e) { }
    return defaultMe();
}
let state = loadMe();
function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { } }

/* ====== HELPER ====== */
const memberByUsn = usn => ROSTER.find(m => m.usn === usn);
const memberName = usn => (memberByUsn(usn) || {}).name || usn || 'Anonim';
const catById = id => PUB.categories.find(c => c.id === id);
const candsIn = cat => Object.entries(PUB.candidates[cat] || {}).map(([id, n]) => ({ id, ...n }));
const allCands = () => PUB.categories.flatMap(c => candsIn(c.id));

/* ====== JADWAL TAHAPAN ====== */
const fmtDT = ts => ts ? new Date(ts).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const phaseOpen = (s, e) => !!s && Date.now() >= s && (!e || Date.now() <= e);
const nomOpenNow = () => phaseOpen(PUB.nomStart, PUB.nomEnd);
const votingOpenNow = () => phaseOpen(PUB.voteStart, PUB.voteEnd);
const ts2input = ts => { if (!ts) return ''; const d = new Date(ts), p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };