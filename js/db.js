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
    categories: [], candidates: {},
    nomStart: null, nomEnd: null, voteStart: null, voteEnd: null, ceremonyAt: null,
    revealed: false, winners: {}
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
    const parsePub = v => ({
        categories: v?.categories || [], candidates: v?.candidates || {},
        nomStart: v?.nomStart || null, nomEnd: v?.nomEnd || null,
        voteStart: v?.voteStart || null, voteEnd: v?.voteEnd || null,
        ceremonyAt: v?.ceremonyAt || null,
        revealed: v?.revealed ?? false, winners: v?.winners || {}
    });

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
                    refs.pub.set({ categories: DEFAULT_CATEGORIES, candidates: {}, revealed: false, winners: {} })
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
        const q = QUEUE[key]; if (!q || !refs) return;
        const exists = Object.values(PUB.candidates[q.cat] || {}).some(c => c.usn === q.usn);
        if (exists) { toast('Kandidat itu sudah resmi', 'Usulan kembar dibersihkan.'); refs.queue.child(key).remove(); return; }
        const id = 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
        refs.pub.child('candidates/' + q.cat + '/' + id).set({ usn: q.usn, by: q.by, note: q.note || '', ts: q.ts || Date.now() });
        refs.queue.child(key).remove();
    };
    const rejectNom = key => { if (refs) refs.queue.child(key).remove(); };
    const tally = cat => {
        const out = {}, m = BALLOT[cat] || {};
        Object.values(m).forEach(id => out[id] = (out[id] || 0) + 1);
        return out;
    };
    const reveal = () => {
        if (!refs) return;
        const winners = {};
        PUB.categories.forEach(c => {
            const t = tally(c.id);
            const best = Object.entries(t).sort((a, b) => b[1] - a[1])[0];
            if (best) {
                const cand = (PUB.candidates[c.id] || {})[best[0]];
                if (cand) winners[c.id] = { usn: cand.usn, by: cand.by, note: cand.note || '', votes: best[1] };
            }
        });
        refs.pub.update({ winners, revealed: true });
    };
    const reseal = () => setPub({ revealed: false, winners: null });
    const resetVotes = () => { if (refs) { refs.ballot.remove(); refs.pub.update({ revealed: false, winners: null }); } };
    const delCandidate = (cat, nomId, voters) => {
        if (!refs) return;
        refs.pub.child('candidates/' + cat + '/' + nomId).remove();
        (voters || []).forEach(usn => refs.ballot.child(cat + '/' + usn).remove());
    };

    return {
        boot, listenPub, submitNom, saveVote, adminLogin, adminLogout, listenAdmin,
        setPub, approveNom, rejectNom, tally, reveal, reseal, resetVotes, delCandidate,
        onChange: cb => cbs.push(cb)
    };
})();