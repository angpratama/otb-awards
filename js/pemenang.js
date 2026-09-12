/* ====== PEMENANG: kartu tersegel, buka segel, sertifikat ====== */
function renderWinners() {
  const grid = document.getElementById('winGrid'), note = document.getElementById('winNote');
  if (!PUB.categories.length) { grid.innerHTML = ''; note.innerHTML = ''; return; }

  if (!PUB.revealed) {
    note.innerHTML = `${ic('lock')} Semua piala masih tersegel. Hasil dihitung & diumumkan panitia di malam penganugerahan.`;
    grid.innerHTML = PUB.categories.map((c, i) => `
      <article class="wcard${i % 2 ? ' even' : ''}">
        <div class="wc-top"><span>${ic(c.icon)}</span><span class="badge badge-pend">TERSEGEL</span></div>
        <h3>${esc(c.name)}</h3><p class="wc-sub">${esc(c.desc)}</p>
        <div class="wc-sealed"><div class="seal">${ic('lock')}</div><p class="wc-hint">DIUMUMKAN OLEH PANITIA — SABAR YA</p></div>
      </article>`).join('');
    return;
  }

  note.innerHTML = `${ic('eye')} Segel telah dibuka panitia. Selamat kepada para pemenang!`;
  grid.innerHTML = PUB.categories.map((c, i) => {
    const w = PUB.winners[c.id];
    if (!w) {
      return `<article class="wcard${i % 2 ? ' even' : ''}">
        <div class="wc-top"><span>${ic(c.icon)}</span><span class="badge badge-off">KOSONG</span></div>
        <h3>${esc(c.name)}</h3><p class="wc-sub">${esc(c.desc)}</p>
        <div class="wc-sealed"><p class="wc-hint">TIDAK ADA PEMENANG UNTUK KATEGORI INI</p></div>
      </article>`;
    }
    return `<article class="wcard${i % 2 ? ' even' : ''}" data-cert="${c.id}">
      <div class="wc-top"><span>${ic(c.icon)}</span><span class="badge badge-ok">RESMI</span></div>
      <h3>${esc(c.name)}</h3><p class="wc-sub">${esc(c.desc)}</p>
      <div class="wc-win">
        <span class="wc-crown">${ic('crown')}</span>
        <h4>${esc(memberName(w.usn))}</h4>
        <p>${w.votes} suara</p>
        <span class="wc-reopen">Buka Sertifikat →</span>
      </div>
    </article>`;
  }).join('');
}

function openCert(catId) {
  const c = catById(catId), w = PUB.winners[catId];
  if (!c || !w) return;
  const nm = memberName(w.usn);
  const name = nm.split('').map((ch, i) => `<span style="animation-delay:${(.35 + i * .03).toFixed(2)}s">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join('');
  document.getElementById('certBody').innerHTML = `
    <p class="cert-kicker">Dengan bangga mempersembahkan penerima penghargaan malam ini</p>
    <p class="cert-cat">${esc(c.name)}</p>
    <div class="trophy">${ic('trophy')}</div>
    <h3 class="cert-name">${name}</h3>
    <p class="cert-votes">Mengumpulkan <b>${w.votes}</b> suara dari rekan-rekan yang sangat serius.</p>
    <div class="stamp">RESMI<br>TERSEGEL<br>VOL.01</div>
    <div class="cert-actions">
      <button type="button" class="btn btn-ink sm" data-shot>${ic('shot')} Simpan Screenshot</button>
      <button type="button" class="btn btn-ink sm" data-close>Tutup</button>
    </div>`;
  document.getElementById('certModal').classList.add('open');
  document.body.classList.add('locked');
  Confetti.burst(160);
}
function closeCert() {
  document.getElementById('certModal').classList.remove('open');
  document.body.classList.remove('locked');
}

/* ===== FOTO PEMENANG MENGIKUTI KURSOR ===== */
function initFloatWin() {
  const grid = document.getElementById('winGrid'); if (!grid) return;
  let box = null;
  const ensure = () => {
    if (box) return box;
    box = document.createElement('div'); box.id = 'floatWin';
    box.innerHTML = '<img alt="Sang Pemenang">';
    document.body.appendChild(box); return box;
  };
  grid.addEventListener('pointermove', e => {
    const b = ensure();
    const card = e.target.closest('[data-cert]');
    const w = card ? PUB.winners[card.dataset.cert] : null;
    if (!w) { b.classList.remove('on'); return; }
    const m = ROSTER.find(r => r.name === memberName(w.usn));
    const src = (m && FOTO_ANGGOTA[m.usn]) || ava(memberName(w.usn)).replace('size=150', 'size=400');
    const img = b.querySelector('img');
    if (img.dataset.src !== src) { img.src = src; img.dataset.src = src; }
    const x = Math.min(Math.max(8, e.clientX + 26), innerWidth - 216);
    const y = Math.min(Math.max(8, e.clientY - 130), innerHeight - 276);
    b.style.transform = `translate(${x}px,${y}px)`;
    b.classList.add('on');
  });
  grid.addEventListener('pointerleave', () => { if (box) box.classList.remove('on'); });
}

function initPemenang() {
  initFloatWin();
  document.getElementById('winGrid').addEventListener('click', e => {
    const card = e.target.closest('[data-cert]');
    if (card) openCert(card.dataset.cert);
  });
  const modal = document.getElementById('certModal');
  modal.addEventListener('click', e => {
    if (e.target.classList.contains('modal-back') || e.target.closest('[data-close]')) closeCert();
    if (e.target.closest('[data-shot]')) toast('Screenshot manual ya 📸', 'Panitia belum mampu beli API screenshot.');
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeCert(); });
}
