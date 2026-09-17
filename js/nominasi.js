/* ====== IDENTITAS PERANGKAT (satu device = satu pemilih) ====== */
function deviceId() {
    if (!state.deviceId) {
        state.deviceId = 'dev_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        save();
    }
    return state.deviceId;
}
function renderIdentityBars() { /* tidak dipakai lagi — identitas kini per perangkat */ }

/* ====== FORM NOMINASI ====== */
let nomSel = { cat: null, cand: null };

function renderChips() {
    const w = document.getElementById('nomChipsWrap');
    if (!pubCats().length) {
        w.innerHTML = `<p class="chips-note">Belum ada kategori. Panitia sedang menyiapkan piala — tunggu pengumumannya.</p>`; return;
    }
    w.innerHTML = `<div class="chips">${pubCats().map(c => `<button type="button" class="chip${nomSel.cat === c.id ? ' on' : ''}" data-cat="${c.id}">${ic(c.icon)}${esc(c.name)}</button>`).join('')}</div>`;
    w.querySelectorAll('.chip').forEach(ch => ch.addEventListener('click', () => {
        nomSel.cat = ch.dataset.cat; nomSel.cand = null;
        renderChips(); renderCandOptions();
        document.getElementById('fCatField').classList.remove('bad');
    }));
}
function renderCandOptions() {
    const sel = document.getElementById('fCand'); if (!sel) return;
    if (!nomSel.cat || !pubCats().length) { sel.disabled = true; sel.innerHTML = '<option value="">— pilih kategori dulu —</option>'; return; }
    sel.disabled = false;
    const taken = new Set(candsIn(nomSel.cat).map(n => n.usn)); // yang sudah resmi gak bisa diusul dobel
    const opts = ROSTER.filter(m => !taken.has(m.usn));
    sel.innerHTML = `<option value="">— pilih kandidat —</option>` +
        opts.map(m => `<option value="${esc(m.usn)}">${esc(m.name)} (@${esc(m.usn)})</option>`).join('') +
        (opts.length ? '' : '<option value="">Semua anggota sudah jadi kandidat di kategori ini 😅</option>');
    sel.value = '';
}

/* Anggota cuma lihat USULANNYA SENDIRI — bukan meja panitia */
function renderMyNoms() {
    const countEl = document.getElementById('nomCount');
    if (countEl) countEl.textContent = state.myNoms.length;
    const list = document.getElementById('feedList'); if (!list) return;
    const mine = state.myNoms.map((n, i) => ({ n, i })).sort((a, b) => b.n.ts - a.n.ts);
    list.innerHTML = mine.length ? mine.map(({ n, i }) => {
        const ok = candsIn(n.cat).some(c => c.usn === n.candUsn);
        return `<article class="feed-item${ok ? '' : ' pend'}">
      <div class="fi-top">
        <span class="fi-cat">${esc(catById(n.cat)?.name || '?')}</span>
        <span class="badge ${ok ? 'badge-ok' : 'badge-pend'}">${ok ? 'DISETUJUI ✦' : 'DIPROSES PANITIA'}</span>
      </div>
      <h4>${esc(memberName(n.candUsn))} <span class="usn">@${esc(n.candUsn)}</span></h4>
      ${n.note ? `<p>${esc(n.note)}</p>` : ''}
      <span class="fi-by">Diusulkan dari perangkat ini</span>
      <button type="button" class="nom-del" data-del="${i}" title="Hapus catatan ini">✕</button>
    </article>`;
    }).join('')
        : `<div class="feed-empty">Belum ada usulan darimu. Jadi yang pertama.</div>`;
}

function syncNomClosed() {
    const open = nomOpenNow();
    const note = document.getElementById('nomClosed'); if (note) note.hidden = open;
    const btn = document.querySelector('#nomForm button[type=submit]');
    if (btn) btn.disabled = !open;
    if (!open && note) {
        note.innerHTML = (PUB.nomStart && Date.now() < PUB.nomStart)
            ? `${ic('lock')} MEJA NOMINASI AKAN DIBUKA ${fmtDT(PUB.nomStart).toUpperCase()} — TUNGGU YA`
            : `${ic('lock')} MEJA NOMINASI SEDANG DITUTUP PANITIA — TUNGGU PENGUMUMAN BERIKUTNYA`;
    }
}

function initNominasi() {
    document.getElementById('feedList').addEventListener('click', e => {
        const b = e.target.closest('[data-del]'); if (!b) return;
        const i = +b.dataset.del;
        if (i >= 0 && i < state.myNoms.length) {
            state.myNoms.splice(i, 1);
            save(); renderMyNoms();
            toast('Catatan dihapus', 'Cuma catatan lokal di perangkat ini — kotak panitia tidak terpengaruh.');
        }
    });
    renderChips(); renderCandOptions(); syncNomClosed();
    bindCatIndex();
    document.getElementById('fNote').addEventListener('input', e => e.target.closest('.field').classList.remove('bad'));
    document.getElementById('fAgree').addEventListener('change', e => {
        document.getElementById('fAgreeErr').style.display = e.target.checked ? 'none' : 'block';
    });

    document.getElementById('nomForm').addEventListener('submit', e => {
        e.preventDefault();
        if (!nomOpenNow()) { toast('Meja nominasi ditutup', 'Panitia sedang tidak menerima usulan.'); return; }
        const me = deviceId();   // perangkat ini sebagai pengirim
        const cand = document.getElementById('fCand').value;
        const note = document.getElementById('fNote').value.trim();
        let ok = true;
        if (!nomSel.cat) { document.getElementById('fCatField').classList.add('bad'); ok = false; }
        if (!cand) { document.getElementById('fCandField').classList.add('bad'); ok = false; }
        const errEl = document.getElementById('fAgreeErr');
        if (!document.getElementById('fAgree').checked) { errEl.style.display = 'block'; ok = false; } else errEl.style.display = 'none';
        if (!ok) { toast('Formulir belum lengkap', 'Cek bagian yang bertanda merah ya.'); return; }

        if (state.myNoms.some(n => n.cat === nomSel.cat)) {
            toast('Perangkat ini sudah mengusulkan di kategori ini', 'Satu perangkat satu kandidat per kategori ya.'); return;
        }

        const nom = { cat: nomSel.cat, candUsn: cand, by: me, note, status: 'pending', ts: Date.now() };
        Cloud.submitNom(nom);                  // 📮 masuk kotak usulan — cuma admin yang bisa buka
        state.myNoms.push({ cat: nomSel.cat, candUsn: cand, by: me, note, ts: nom.ts });
        save(); renderMyNoms();
        document.getElementById('fNote').value = '';
        document.getElementById('fAgree').checked = false; errEl.style.display = 'none';
        nomSel.cand = null; renderCandOptions();
        toast('Nominasi terkirim ✦', 'Usulanmu masuk kotak panitia. Hasil sidang diumumkan panitia.');
        Confetti.burst(60);
    });
}