let curCat = null;

function setCat(id) { if (catById(id)) { curCat = id; renderVoteUI(); } }
function renderVoteUI() { renderTabs(); renderBallot(); }

function renderTabs() {
    const w = document.getElementById('catTabs');
    if (!PUB.categories.length) { w.innerHTML = ''; return; }
    if (!curCat || !catById(curCat)) curCat = PUB.categories[0].id;
    w.innerHTML = PUB.categories.map((c, i) => `<button type="button" class="tab${curCat === c.id ? ' on' : ''}" data-cat="${c.id}"><span>${String(i + 1).padStart(2, '0')}</span>${esc(c.name)}</button>`).join('');
    w.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => setCat(t.dataset.cat)));
}

function renderBallot() {
    const body = document.getElementById('ballotBody');
    body.classList.remove('anim'); void body.offsetWidth; body.classList.add('anim');

    if (!PUB.categories.length) {
        body.innerHTML = `<div class="empty" style="margin-top:8px">${ic('trophy')}<h3>Belum ada kategori.</h3><p>Panitia belum mengumumkan piala. Sabar, sedang dijahit.</p></div>`; return;
    }
    const c = catById(curCat);
    const list = candsIn(curCat);
    const mine = state.myUsn ? (state.myVotes[curCat] || null) : null;

    body.innerHTML = `
    <div class="ballot-head">
      <div class="bh-icon">${ic(c.icon)}</div>
      <div><h3>${esc(c.name)}</h3><p class="bh-desc">${esc(c.desc)}</p></div>
    </div>
    ${votingOpenNow() ? '' : `<div class="closed-note">${ic('lock')} RUANG SUARA MASIH DITUTUP PANITIA — TUNGGU PENGUMUMAN</div>`}
    ${list.length ? list.map(n => {
        const isMine = mine === n.id;
        return `<div class="cand${isMine ? ' mine' : ''}">
        <img src="${ava(memberName(n.usn))}" alt="${esc(memberName(n.usn))}" loading="lazy" onerror="this.style.visibility='hidden'">
        <div class="cand-info">
          <h4>${esc(memberName(n.usn))} <span class="usn">@${esc(n.usn)}</span></h4>
          ${n.note ? `<p>“${esc(n.note)}”</p>` : ''}
        </div>
        <div></div>
        <button type="button" class="vote-btn${isMine ? ' on' : ''}" data-vote="${n.id}" ${votingOpenNow() ? '' : 'disabled'}>
          ${isMine ? ic('check') + 'PILIHANMU' : ic('plus') + 'PILIH'}
        </button>
      </div>`;
    }).join('')
            : `<div class="empty" style="margin-top:22px">${ic('users')}<h3>Belum ada kandidat resmi.</h3><p>Usulan anggota sedang disidang panitia. Hasilnya akan muncul di sini.</p></div>`}
    <div class="ballot-foot">
      <p>${ic('lock')} Suaramu masuk kotak tertutup. Jumlah suara & hasil hanya diketahui panitia.</p>
    </div>`;
}

function castVote(catId, nomId) {
    if (!votingOpenNow()) { toast('Ruang suara masih ditutup', 'Panitia akan membuka voting setelah kandidat final.'); return; }
    if (!state.myUsn) {
        toast('Pilih identitasmu dulu', 'Satu akun satu anggota — pilih namamu di daftar di atas.');
        const bar = document.querySelector('#voteIdentity .idbar');
        if (bar) { bar.classList.add('bad'); bar.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => bar.classList.remove('bad'), 1600); }
        return;
    }
    const prev = state.myVotes[catId];
    if (prev === nomId) { toast('Ini sudah pilihanmu', 'Klik kandidat lain kalau mau pindah kubu.'); return; }
    state.myVotes[catId] = nomId;
    save();                                   // catatan pribadi (biar tombol "PILIHANMU" nyala)
    Cloud.saveVote(catId, state.myUsn, nomId);  // 🗳️ masuk kotak suara — cuma admin bisa hitung
    renderBallot();
    toast(prev ? 'Suara dipindah ✦' : 'Suara tercatat ✦', 'Pilihanmu sudah masuk kotak tertutup.');
    Confetti.burst(50);
}

function initVoting() {
    document.getElementById('ballotBody').addEventListener('click', e => {
        const b = e.target.closest('[data-vote]'); if (b) castVote(curCat, b.dataset.vote);
    });
}