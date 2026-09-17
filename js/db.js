/* =====================================================
   FIREBASE — mode "KOTAK SUARA TERTUTUP"
   pub    = papan pengumuman : semua baca, cuma admin tulis
   queue  = kotak usulan     : semua masukin, cuma admin baca
   ballot = kotak suara      : semua masukin, cuma admin baca
   ===================================================== */
const firebaseConfig = {
    apiKey: "AIzaSyBAt9byzOk7B3A2nKBmlFwfZkqaSMfxYFA",
    authDomain: "otb-event.firebaseapp.com",
    databaseURL: "https://otb-event-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "otb-event",
};

const CLOUD_READY = !!(firebaseConfig.apiKey && firebaseConfig.databaseURL);
if (CLOUD_READY) {
    try { firebase.initializeApp(firebaseConfig); }
    catch (e) { if (e.code !== 'app/duplicate-app') console.error(e); }
}

let PUB = {
    categories: [], candidates: {}, secret: {},
    nomStart: null, nomEnd: null, voteStart: null, voteEnd: null, ceremonyAt: null,
    revealed: {}, winners: {}
};
let BALLOT = {};  /* terisi cuma di perangkat admin */
let QUEUE = {};   /* idem */

const Cloud = (() => {
    const BASE = 'boysAwards';
    let refs = null, cbs = [];

    function boot() {
        if (refs || !CLOUD_READY) return;
        refs = {
            pub: firebase.database().ref(BASE + '/pub'),
            ballot: firebase.database().ref(BASE + '/ballot'),
            queue: firebase.database().ref(BASE + '/queue')
        };
    }

    const fire = () => cbs.forEach(cb => { try { cb() } catch (e) { console.error(e) } });

    /* PENERJEMAH: data mentah Firebase → bentuk yang dipahami halaman */
    const parsePub = v => {
        const cats = v?.categories || [];
        const raw = v?.revealed;
        /* revealed bisa: true (versi lama, semua terbuka), object per-kategori, atau tidak ada */
        const revealed = raw === true
            ? Object.fromEntries(cats.map(c => [c.id, true]))
            : (raw || {});
        return {
            categories: cats, candidates: v?.candidates || {}, secret: v?.secret || {},
            nomStart: v?.nomStart || null, nomEnd: v?.nomEnd || null,
            voteStart: v?.voteStart || null, voteEnd: v?.voteEnd || null,
            ceremonyAt: v?.ceremonyAt || null,
            revealed, winners: v?.winners || {}
        };
    };

    /* ---------- SISI ANGGOTA ---------- */
    function listenPub() {
        boot(); if (!refs) return;
        refs.pub.on('value', snap => {
            PUB = parsePub(snap.val());
            fire();
        }, err => toast('Koneksi database bermasalah', err.message));
    }
    function submitNom(nom) { if (CLOUD_READY) { boot(); refs.queue.push(nom); } }
    function saveVote(cat, usn, nomId) { if (CLOUD_READY) { boot(); refs.ballot.child(cat + '/' + usn).set(nomId); } }

    /* ---------- SISI ADMIN ---------- */
    function adminLogin(email, pass) { return firebase.auth().signInWithEmailAndPassword(email, pass); }
    function adminLogout() { return firebase.auth().signOut(); }

    function listenAdmin() {
        boot(); if (!refs) return;
        refs.pub.on('value', snap => {
            const v = snap.val();
            const stale = v && !v.categories && v.data; /* sisa data versi lama? anggap kosong */
            if (!v || stale) {
                if (firebase.auth().currentUser) {
                    refs.pub.set({ categories: DEFAULT_CATEGORIES, candidates: {}, secret: {}, revealed: null, winners: {} })
                        .then(() => toast('Papan pengumuman disiapkan ✦', 'Kategori awal terpasang.'))
                        .catch(e => toast('Gagal menulis ke database', e.message));
                }
                PUB = parsePub(null); fire(); return;
            }
            PUB = parsePub(v); fire();
        }, err => toast('Koneksi database bermasalah', err.message));
        refs.ballot.on('value', snap => { BALLOT = snap.val() || {}; fire(); }, err => console.error(err));
        refs.queue.on('value', snap => { QUEUE = snap.val() || {}; fire(); }, err => console.error(err));
    }

    const setPub = patch => { if (refs) refs.pub.update(patch).catch(e => toast('Gagal menyimpan ke database', e.message)); };
    const approveNom = key => {
        const q = QUEUE[key];
        if (!q) {
            toast('Usulan sudah tidak ada', 'Mungkin sudah pernah diproses — daftar akan menyegarkan sendiri.');
            if (refs) refs.queue.child(key).remove();
            return;
        }
        if (!refs) return;
        const cat = q.cat, usn = q.candUsn;
        if (!cat || !usn) {
            toast('Data usulan tidak lengkap', 'Formatnya rusak/usang — sebaiknya usulan ini ditolak saja.');
            return;
        }
        const exists = Object.values(PUB.candidates[cat] || {}).some(c => c.usn === usn);
        if (exists) {
            toast('Kandidat itu sudah resmi', 'Usulan kembar dibersihkan.');
            refs.queue.child(key).remove();
            return;
        }
        const id = 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
        refs.pub.child('candidates/' + cat + '/' + id)
            .set({ usn, by: q.by || 'anonim', note: q.note || '', ts: q.ts || Date.now() })
            .then(() => {
                refs.queue.child(key).remove();
                toast('Usulan disetujui ✦', memberName(usn) + ' resmi jadi kandidat.');
            })
            .catch(e => toast('Gagal menyetujui', e.message));
    };
    const rejectNom = key => { if (refs) refs.queue.child(key).remove(); };
    const tally = cat => {
        const out = {}, m = BALLOT[cat] || {};
        Object.values(m).forEach(id => out[id] = (out[id] || 0) + 1);
        return out;
    };

    /* ---------- SEGEL: per kategori & semua ---------- */
    const computeWinner = cat => {
        const t = tally(cat);
        const best = Object.entries(t).sort((a, b) => b[1] - a[1])[0];
        if (!best) return null;
        const cand = (PUB.candidates[cat] || {})[best[0]];
        return cand ? { usn: cand.usn, by: cand.by, note: cand.note || '', votes: best[1] } : null;
    };
    const revealCat = cat => {
        if (!refs) return;
        const w = computeWinner(cat);
        if (!w) { toast('Belum bisa dibuka', 'Kategori ini belum punya kandidat atau suara.'); return; }
        refs.pub.child('winners/' + cat).set(w)
            .then(() => refs.pub.child('revealed/' + cat).set(true))
            .then(() => toast('Segel dibuka ✦', 'Pemenangnya sudah terlihat di HP anggota.'))
            .catch(e => toast('Gagal membuka segel', e.message));
    };
    const resealCat = cat => {
        if (!refs) return;
        refs.pub.child('revealed/' + cat).remove();
        refs.pub.child('winners/' + cat).remove();
    };
    const revealAll = () => {
        if (!refs) return;
        const winners = {}, revealed = {};
        PUB.categories.forEach(c => { const w = computeWinner(c.id); if (w) { winners[c.id] = w; revealed[c.id] = true; } });
        refs.pub.update({ winners, revealed });
    };
    const resealAll = () => setPub({ revealed: null, winners: null });
    const resetVotes = () => { if (refs) { refs.ballot.remove(); refs.pub.update({ revealed: null, winners: null }); } };
    const delCandidate = (cat, nomId, voters) => {
        if (!refs) return;
        refs.pub.child('candidates/' + cat + '/' + nomId).remove();
        (voters || []).forEach(usn => refs.ballot.child(cat + '/' + usn).remove());
    };

    return {
        boot, listenPub, submitNom, saveVote, adminLogin, adminLogout, listenAdmin,
        setPub, approveNom, rejectNom, tally, revealCat, resealCat, revealAll, resealAll, resetVotes, delCandidate,
        onChange: cb => cbs.push(cb)
    };
})();