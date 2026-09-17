/* ====== PANEL PANITIA — satu-satunya pembaca kotak usulan & kotak suara ====== */
let adminOk = false, aTab = 'beranda';
const ICON_KEYS = ['star', 'crown', 'moon', 'search', 'smile', 'zap', 'heart', 'users', 'trophy', 'spark', 'shot', 'eye'];

/* ====== TAMPILAN JADWAL ====== */
function phaseBadge(s, e) {
    const now = Date.now();
    if (!s && !e) return `<span class="badge badge-off">BELUM DIJADWALKAN</span>`;
    if (s && now < s) return `<span class="badge badge-pend">AKAN DIBUKA ${esc(fmtDT(s))}</span>`;
    if (phaseOpen(s, e)) return `<span class="badge badge-ok">TERBUKA${e ? ' — TUTUP ' + esc(fmtDT(e)) : ' (TANPA BATAS)'}</span>`;
    return `<span class="badge badge-off">DITUTUP</span>`;
}
const schedTxt = (s, e) => {
    if (!s && !e) return 'Belum dijadwalkan — atur di tab Kontrol Acara';
    const a = s ? 'mulai ' + fmtDT(s) : 'mulai: belum ditentukan';
    return `${a} — ${e ? 'selesai ' + fmtDT(e) : 'tanpa batas'}`;
};
const sealInfo = () => {
    const n = Object.keys(PUB.revealed || {}).length;
    return { n, total: PUB.categories.length };
};

function renderAdmin() {
    document.getElementById('gate').hidden = adminOk;
    document.getElementById('panel').hidden = !adminOk;
    if (adminOk) renderTab();
}

function renderTab() {
    const tabs = [['beranda', 'Beranda'], ['kategori', 'Kategori'], ['sidang', 'Sidang Usulan'], ['kandidat', 'Kandidat & Suara (Rahasia)'], ['kontrol', 'Kontrol Acara']];
    document.getElementById('aTabs').innerHTML = tabs.map(([k, l]) =>
        `<button type="button" class="tab${aTab === k ? ' on' : ''}" data-atab="${k}">${l}</button>`).join('');
    const body = document.getElementById('aBody');

    /* ---------- BERANDA (pantauan saja) ---------- */
    if (aTab === 'beranda') {
        const voters = new Set();
        Object.values(BALLOT).forEach(m => Object.keys(m).forEach(u => voters.add(u)));
        const seal = sealInfo();
        body.innerHTML = `
      <div class="kv-grid">
        <div class="kv"><b>${PUB.categories.length}</b><span>KATEGORI</span></div>
        <div class="kv"><b>${allCands().length}</b><span>KANDIDAT RESMI</span></div>
        <div class="kv"><b>${Object.keys(QUEUE).length}</b><span>MENUNGGU SIDANG</span></div>
        <div class="kv"><b>${voters.size}/${ROSTER.length}</b><span>SUDAH VOTE</span></div>
      </div>
      <div class="apanel">
        <div class="apanel-head"><div><h3>Jadwal & Status</h3>
          <p class="amuted">Hanya pantauan — untuk mengubah, buka tab Kontrol Acara.</p></div></div>
        <div class="arow"><div><b>Meja Nominasi</b><p class="amuted">${schedTxt(PUB.nomStart, PUB.nomEnd)}</p></div>
          ${phaseBadge(PUB.nomStart, PUB.nomEnd)}</div>
        <div class="arow"><div><b>Ruang Suara</b><p class="amuted">${schedTxt(PUB.voteStart, PUB.voteEnd)}</p></div>
          ${phaseBadge(PUB.voteStart, PUB.voteEnd)}</div>
        <div class="arow"><div><b>Malam Penganugerahan</b><p class="amuted">${PUB.ceremonyAt ? fmtDT(PUB.ceremonyAt) : 'Belum diatur'}</p></div>
          <span class="badge ${seal.n ? 'badge-ok' : 'badge-pend'}">${seal.n}/${seal.total} DIBUKA</span></div>
      </div>
      <div class="apanel">
        <div class="apanel-head"><div><h3>Pintasan</h3></div></div>
        <div class="btnrow">
          <button type="button" class="btn btn-gold sm" data-go="sidang">Sidang Usulan (${Object.keys(QUEUE).length})</button>
          <button type="button" class="btn btn-ghost sm" data-go="kandidat">Lihat Hitungan Suara</button>
          <button type="button" class="btn btn-ghost sm" data-go="kontrol">Kontrol Acara</button>
        </div>
      </div>`;
        return;
    }

    /* ---------- KATEGORI ---------- */
    if (aTab === 'kategori') {
        body.innerHTML = `
      <div class="apanel">
        <div class="apanel-head"><div><h3>Buat Kategori Baru</h3>
          <p class="amuted">Begitu disimpan, langsung muncul di HP anggota.</p></div></div>
        <div class="two-col">
          <div class="field"><label class="flabel" for="aCatName">Nama Kategori</label>
            <input id="aCatName" placeholder="cth: Sosok Paling Misterius" maxlength="48"></div>
          <div class="field"><label class="flabel" for="aCatIcon">Ikon</label>
            <select id="aCatIcon">${ICON_KEYS.map(k => `<option value="${k}">${k}</option>`).join('')}</select></div>
        </div>
        <div class="field"><label class="flabel" for="aCatDesc">Deskripsi Singkat <span style="text-transform:none;letter-spacing:0;color:var(--cream-faint)">(opsional)</span></label>
          <input id="aCatDesc" placeholder="cth: Jarang muncul, begitu muncul jadi topik serius." maxlength="120"></div>
        <label class="agree" style="margin:0 0 16px">
          <input type="checkbox" id="aCatSecret">
          <span class="box"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L19 7"/></svg></span>
          <p><b style="color:var(--gold)">🔒 KATEGORI RAHASIA</b> — disembunyikan dari semua halaman anggota. Cuma muncul saat segelnya dibuka di pengumuman.</p>
        </label>
        <button type="button" class="btn btn-gold sm" data-act="addCat">+ Tambah Kategori</button>
      </div>
      <div class="apanel">
        <div class="apanel-head"><div><h3>Daftar Kategori (${PUB.categories.length})</h3></div></div>
        ${PUB.categories.map(c => `<div class="arow">
          <div class="arow-main"><span class="bh-icon sm">${ic(c.icon)}</span>
            <div><b>${esc(c.name)}</b>${(PUB.secret || {})[c.id] ? ' <span class="badge badge-pend">🔒 RAHASIA</span>' : ''}
              <p class="amuted">${candsIn(c.id).length} kandidat resmi</p></div></div>
          <div class="arow-acts"><button type="button" class="btn btn-danger sm" data-act="delCat" data-id="${c.id}">Hapus</button></div>
        </div>`).join('') || `<div class="feed-empty">Belum ada kategori.</div>`}
      </div>`;
        return;
    }

    /* ---------- SIDANG USULAN ---------- */
    if (aTab === 'sidang') {
        const rows = Object.entries(QUEUE).sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0));
        body.innerHTML = `
      <div class="apanel">
        <div class="apanel-head"><div><h3>Kotak Usulan</h3>
          <p class="amuted">Isinya gak bisa dilihat anggota — cuma kamu. Setujui yang cocok, tolak sisanya.</p></div>
          <span class="badge badge-pend">${rows.length} MENUNGGU</span></div>
        ${rows.map(([key, q]) => `<div class="arow">
          <div class="arow-main"><img class="acd-img" src="${ava(memberName(q.candUsn))}" alt="">
            <div><b>${esc(memberName(q.candUsn))} <span class="usn">@${esc(q.candUsn)}</span></b>
            <p class="amuted">${esc(catById(q.cat)?.name || '?')} · diusulkan @${esc(q.by)}${q.note ? ` — “${esc(q.note)}”` : ''}</p></div></div>
          <div class="arow-acts">
            <button type="button" class="btn btn-gold sm" data-act="approve" data-id="${key}">Setujui</button>
            <button type="button" class="btn btn-danger sm" data-act="reject" data-id="${key}">Tolak</button>
          </div></div>`).join('') || `<div class="feed-empty">Kotaknya kosong. Anggota masih mikir, mungkin.</div>`}
      </div>`;
        return;
    }

    /* ---------- KANDIDAT & SUARA (live tally — cuma di sini!) ---------- */
    if (aTab === 'kandidat') {
        body.innerHTML = PUB.categories.map(c => {
            const t = Cloud.tally(c.id);
            const max = Math.max(0, ...Object.values(t));
            return `<div class="apanel">
        <div class="apanel-head"><div><h3>${esc(c.name)}</h3>${(PUB.secret || {})[c.id] ? ' <span class="badge badge-pend">🔒 RAHASIA</span>' : ''}
          <p class="amuted">${Object.values(t).reduce((a, b) => a + b, 0)} suara masuk di kategori ini</p></div>
          ${phaseBadge(PUB.voteStart, PUB.voteEnd)}</div>
        ${candsIn(c.id).map(n => {
            const v = t[n.id] || 0;
            return `<div class="arow">
            <div class="arow-main"><img class="acd-img" src="${ava(memberName(n.usn))}" alt="">
              <div><b>${esc(memberName(n.usn))} <span class="usn">@${esc(n.usn)}</span></b>
              <p class="amuted">diusulkan @${esc(n.by)}</p></div></div>
            <div class="arow-acts">
              <span class="avotes">${v}<i>SUARA</i></span>
              ${v > 0 && v === max ? `<span class="badge badge-ok">UNGGUL</span>` : ''}
              <button type="button" class="btn btn-danger sm" data-act="delCand" data-cat="${c.id}" data-id="${n.id}">Hapus</button>
            </div></div>`;
        }).join('') || `<div class="feed-empty">Belum ada kandidat resmi di kategori ini.</div>`}
      </div>`;
        }).join('') || `<div class="feed-empty">Belum ada kategori.</div>`;
        return;
    }

    /* ---------- KONTROL: jadwal + segel per kategori ---------- */
    body.innerHTML = `
    <div class="apanel">
      <div class="apanel-head"><div><h3>Jadwal Tahapan</h3>
        <p class="amuted">Kapan tiap tahap terbuka & tertutup — otomatis berlaku di semua perangkat. Yang dikosongkan berarti tutup.</p></div></div>

      <div class="arow" style="align-items:flex-start;gap:20px">
        <div style="flex:1;min-width:240px">
          <b>Fase 1 — Meja Nominasi</b>
          <p class="amuted">Anggota boleh mengusulkan kandidat.</p>
          <div class="two-col" style="margin-top:10px">
            <div class="field" style="margin-bottom:8px"><label class="flabel">Mulai</label><input type="datetime-local" id="nomStart" value="${ts2input(PUB.nomStart)}"></div>
            <div class="field" style="margin-bottom:8px"><label class="flabel">Selesai</label><input type="datetime-local" id="nomEnd" value="${ts2input(PUB.nomEnd)}"></div>
          </div>
          <div class="btnrow">
            <button type="button" class="btn btn-ghost sm" data-act="nomNow-open">Buka Sekarang</button>
            <button type="button" class="btn btn-danger sm" data-act="nomNow-close">Tutup Sekarang</button>
          </div>
        </div>
        ${phaseBadge(PUB.nomStart, PUB.nomEnd)}
      </div>

      <div class="arow" style="align-items:flex-start;gap:20px">
        <div style="flex:1;min-width:240px">
          <b>Fase 2 — Ruang Suara</b>
          <p class="amuted">Anggota boleh memberi & mengubah suara.</p>
          <div class="two-col" style="margin-top:10px">
            <div class="field" style="margin-bottom:8px"><label class="flabel">Mulai</label><input type="datetime-local" id="voteStart" value="${ts2input(PUB.voteStart)}"></div>
            <div class="field" style="margin-bottom:8px"><label class="flabel">Selesai</label><input type="datetime-local" id="voteEnd" value="${ts2input(PUB.voteEnd)}"></div>
          </div>
          <div class="btnrow">
            <button type="button" class="btn btn-ghost sm" data-act="voteNow-open">Buka Sekarang</button>
            <button type="button" class="btn btn-danger sm" data-act="voteNow-close">Tutup Sekarang</button>
          </div>
        </div>
        ${phaseBadge(PUB.voteStart, PUB.voteEnd)}
      </div>

      <div class="arow" style="align-items:flex-start;gap:20px">
        <div style="flex:1;min-width:240px">
          <b>Malam Penganugerahan</b>
          <p class="amuted">Dipakai hitung mundur di beranda anggota. Segel tetap dibuka manual dari panel di bawah.</p>
          <div class="field" style="margin-top:10px;margin-bottom:8px;max-width:280px"><label class="flabel">Tanggal & Jam</label><input type="datetime-local" id="ceremonyAt" value="${ts2input(PUB.ceremonyAt)}"></div>
        </div>
      </div>

      <div class="btnrow">
        <button type="button" class="btn btn-gold" data-act="saveSched">Simpan Jadwal</button>
      </div>
    </div>
    <div class="apanel">
      <div class="apanel-head"><div><h3>Segel Pemenang</h3>
        <p class="amuted">Buka satu-satu biar dramatis — atau semua sekaligus di malam H.</p></div></div>
      ${PUB.categories.map(c => {
        const isRev = !!(PUB.revealed && PUB.revealed[c.id]);
        const w = isRev ? (PUB.winners || {})[c.id] : null;
        return `<div class="arow">
          <div><b>${esc(c.name)}</b>${(PUB.secret || {})[c.id] ? ' <span class="badge badge-pend">🔒 RAHASIA</span>' : ''}
            <p class="amuted">${isRev && w ? 'Pemenang: ' + esc(memberName(w.usn)) + ' (' + w.votes + ' suara)' : 'Masih tersegel'}</p></div>
          <div class="arow-acts">
            <span class="badge ${isRev ? 'badge-ok' : 'badge-pend'}">${isRev ? 'DIBUKA' : 'TERSEGEL'}</span>
            <button type="button" class="btn ${isRev ? 'btn-danger' : 'btn-gold'} sm" data-act="${isRev ? 'resealCat' : 'revealCat'}" data-id="${c.id}">${isRev ? 'Segel Ulang' : 'Buka Segel'}</button>
          </div></div>`;
    }).join('') || `<div class="feed-empty">Belum ada kategori.</div>`}
      <div class="btnrow" style="margin-top:16px">
        <button type="button" class="btn btn-gold sm" data-act="revealAll">Buka Semua</button>
        <button type="button" class="btn btn-danger sm" data-act="resealAll">Segel Ulang Semua</button>
        <button type="button" class="btn btn-danger sm" data-act="resetVotes">Reset Semua Suara</button>
      </div>
    </div>`;
}

function initAdminPage() {
    /* sesi dijaga Firebase — refresh browser tetap login */
    firebase.auth().onAuthStateChanged(user => {
        adminOk = !!user;
        renderAdmin();
        if (adminOk) {
            Cloud.listenAdmin();
            Cloud.onChange(() => {
                if (aTab === 'kontrol' && document.activeElement?.tagName === 'INPUT') return; // jangan reset yang lagi diisi
                renderTab();
            });
            toast('Selamat datang, Panitia ✦', 'Kotak usulan & kotak suara terbuka untukmu.');
        }
    });

    document.getElementById('loginForm').addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('lEmail').value.trim();
        const pass = document.getElementById('lPass').value;
        const err = document.querySelector('#loginForm .err');
        Cloud.adminLogin(email, pass).catch(ex => {
            const map = { 'auth/invalid-email': 'Email tidak valid.', 'auth/user-not-found': 'Akun panitia tidak ditemukan.', 'auth/wrong-password': 'Sandi salah.', 'auth/invalid-credential': 'Email atau sandi salah.', 'auth/too-many-requests': 'Terlalu banyak percobaan. Tunggu sebentar.', 'auth/unauthorized-domain': 'Buka halaman ini lewat localhost/hosting, bukan langsung dari file.' };
            err.textContent = map[ex.code] || ex.message;
            err.style.display = 'block';
            const card = document.querySelector('.login-card');
            card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
        });
    });

    document.getElementById('aLogout').addEventListener('click', () => {
        Cloud.adminLogout().then(() => { adminOk = false; renderAdmin(); toast('Sampai jumpa', 'Panel dikunci kembali.'); });
    });

    document.getElementById('aTabs').addEventListener('click', e => {
        const b = e.target.closest('[data-atab]'); if (b) { aTab = b.dataset.atab; renderTab(); }
    });

    /* auto-save jadwal: begitu kolom diubah, langsung tersimpan ke cloud */
    const SCHED_FIELDS = ['nomStart', 'nomEnd', 'voteStart', 'voteEnd', 'ceremonyAt'];
    document.getElementById('aBody').addEventListener('change', e => {
        if (SCHED_FIELDS.includes(e.target.id)) {
            const v = e.target.value;
            Cloud.setPub({ [e.target.id]: v ? new Date(v).getTime() : null });
            toast('Jadwal tersimpan ✦', 'Langsung berlaku di semua perangkat.');
        }
    });

    document.getElementById('aBody').addEventListener('click', e => {
        const go = e.target.closest('[data-go]');
        if (go) { aTab = go.dataset.go; renderTab(); return; }

        const el = e.target.closest('[data-act]'); if (!el) return;
        const act = el.dataset.act, id = el.dataset.id;

        if (act === 'addCat') {
            const name = document.getElementById('aCatName').value.trim();
            const desc = document.getElementById('aCatDesc').value.trim();
            const icon = document.getElementById('aCatIcon').value;
            const secret = document.getElementById('aCatSecret')?.checked;
            if (name.length < 3) { toast('Nama kategori terlalu pendek', 'Minimal 3 huruf ya.'); return; }
            const cat = { id: 'c' + Date.now().toString(36), name, desc: desc || '—', icon };
            const patch = { categories: [...PUB.categories, cat] };
            if (secret) patch['secret/' + cat.id] = true;
            Cloud.setPub(patch);
            document.getElementById('aCatName').value = '';
            document.getElementById('aCatDesc').value = '';
            document.getElementById('aCatSecret').checked = false;
            toast(secret ? 'Kategori rahasia dibuat 🔒' : 'Kategori ditambahkan ✦',
                secret ? `"${name}" tersembunyi dari anggota — muncul saat pengumuman.` : `"${name}" sudah tampil di HP anggota.`);
        }
        else if (act === 'delCat') {
            const c = catById(id); if (!c) return;
            if (confirm(`Hapus kategori "${c.name}"? Kandidat & suaranya ikut hilang.`)) {
                Cloud.setPub({ categories: PUB.categories.filter(x => x.id !== id) });
                firebase.database().ref('boysAwards/pub/candidates/' + id).remove();
                firebase.database().ref('boysAwards/ballot/' + id).remove();
                firebase.database().ref('boysAwards/pub/secret/' + id).remove();
                Object.entries(QUEUE).forEach(([k, q]) => { if (q.cat === id) Cloud.rejectNom(k); });
                toast('Kategori dihapus', 'Pialanya dipensiunkan dengan hormat.');
            }
        }
        else if (act === 'approve') { Cloud.approveNom(id); }
        else if (act === 'reject') { Cloud.rejectNom(id); toast('Usulan ditolak', 'Semoga ada hikmahnya.'); }
        else if (act === 'delCand') {
            const cat = el.dataset.cat;
            const voters = Object.entries(BALLOT[cat] || {}).filter(([, v]) => v === id).map(([u]) => u);
            Cloud.delCandidate(cat, id, voters);
            toast('Kandidat dihapus', 'Suara atas namanya juga dibersihkan.');
        }
        else if (act === 'saveSched') {
            const g = x => { const v = document.getElementById(x)?.value; return v ? new Date(v).getTime() : null; };
            Cloud.setPub({ nomStart: g('nomStart'), nomEnd: g('nomEnd'), voteStart: g('voteStart'), voteEnd: g('voteEnd'), ceremonyAt: g('ceremonyAt') });
            toast('Jadwal tersimpan ✦', 'Semua perangkat langsung mengikuti jadwal baru.');
        }
        else if (act === 'nomNow-open') { Cloud.setPub({ nomStart: Date.now(), nomEnd: (PUB.nomEnd && PUB.nomEnd > Date.now()) ? PUB.nomEnd : Date.now() + 7 * 864e5 }); toast('Meja nominasi dibuka sekarang', 'Selesai otomatis diisi 7 hari ke depan.'); }
        else if (act === 'nomNow-close') { Cloud.setPub({ nomEnd: Date.now() }); toast('Meja nominasi ditutup', 'Bisa dibuka lagi kapan saja.'); }
        else if (act === 'voteNow-open') { Cloud.setPub({ voteStart: Date.now(), voteEnd: (PUB.voteEnd && PUB.voteEnd > Date.now()) ? PUB.voteEnd : Date.now() + 7 * 864e5 }); toast('Ruang suara dibuka sekarang', 'Anggota langsung bisa memilih.'); }
        else if (act === 'voteNow-close') { Cloud.setPub({ voteEnd: Date.now() }); toast('Ruang suara ditutup', 'Suara tidak bisa diubah lagi.'); }
        else if (act === 'revealCat') { Cloud.revealCat(id); }
        else if (act === 'resealCat') {
            if (confirm('Segel ulang kategori ini? Pemenangnya menghilang lagi dari halaman anggota.')) Cloud.resealCat(id);
        }
        else if (act === 'revealAll') {
            if (confirm('Buka segel SEMUA kategori sekarang?')) { Cloud.revealAll(); Confetti.burst(180); toast('Semua segel dibuka ✦', 'Selamat kepada para pemenang!'); }
        }
        else if (act === 'resealAll') {
            if (confirm('Segel ulang SEMUA kategori?')) Cloud.resealAll();
        }
        else if (act === 'resetVotes') {
            if (confirm('Reset semua suara? Tindakan ini tidak bisa dibatalkan.')) {
                Cloud.resetVotes(); toast('Semua suara direset', 'Sejarah dibuat ulang dari nol.');
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', initAdminPage);

/* status di Beranda ikut menyegarkan sendiri tiap 30 detik */
setInterval(() => { if (adminOk && aTab === 'beranda') renderTab(); }, 30000);