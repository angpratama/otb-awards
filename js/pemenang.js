/* ===== MESIN DRUM ROLL v3 — keras di speaker HP + getaran ===== */
const DrumRoll = (() => {
    let ctx = null, noiseBuf = null;
    const ensure = () => {
        if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } }
        if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => { });
        return ctx;
    };
    /* izin audio dicoba dibuka di SETIAP sentuhan (sampai benar-benar running) */
    const unlock = () => { const c = ensure(); if (c && c.state === 'suspended') c.resume().catch(() => { }); };
    ['pointerdown', 'touchstart', 'keydown', 'click'].forEach(ev =>
        document.addEventListener(ev, unlock, { passive: true }));

    const getNoise = c => {
        if (noiseBuf) return noiseBuf;
        const len = Math.floor(c.sampleRate * .07);
        noiseBuf = c.createBuffer(1, len, c.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
        return noiseBuf;
    };
    function thump(t, vol, freq) {
        const c = ctx;
        /* 1) badan drum (nada rendah) */
        const o = c.createOscillator(), g = c.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(freq, t);
        o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * .4), t + .18);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(.001, t + .22);
        o.connect(g).connect(c.destination); o.start(t); o.stop(t + .25);
        /* 2) KLIK TINGGI — inilah yang terdengar jelas di speaker HP kecil */
        const o2 = c.createOscillator(), g2 = c.createGain();
        o2.type = 'square'; o2.frequency.setValueAtTime(freq * 8, t);
        o2.frequency.exponentialRampToValueAtTime(freq * 3, t + .05);
        g2.gain.setValueAtTime(vol * .8, t);
        g2.gain.exponentialRampToValueAtTime(.001, t + .08);
        o2.connect(g2).connect(c.destination); o2.start(t); o2.stop(t + .1);
        /* 3) desis (tekstur kulit drum) */
        const n = c.createBufferSource(); n.buffer = getNoise(c);
        const g3 = c.createGain(); g3.gain.setValueAtTime(vol * .7, t);
        n.connect(g3).connect(c.destination); n.start(t);
    }
    function roll(onStop, dur = 3800) {
        const c = ensure();
        /* GETARAN — Android pasti merasakan walau speaker mati */
        try {
            if (navigator.vibrate) {
                const p = [];
                for (let i = 0; i < Math.ceil(dur / 260); i++) p.push(140, 120);
                p.push(450);
                navigator.vibrate(p);
            }
        } catch (e) { }
        if (!c) { onStop && setTimeout(onStop, dur); return; }
        if (c.state === 'suspended') c.resume().catch(() => { });
        const t0 = c.currentTime + .05, beats = Math.floor(dur / 190);
        for (let i = 0; i < beats; i++) {
            const t = t0 + i * .19, last = i >= beats - 4;
            thump(t, i > beats - 12 ? .8 : .6, last ? 170 : 120);
        }
        const big = t0 + beats * .19 + .1;
        thump(big, 1.2, 100); thump(big + .03, 1.0, 65);
        onStop && setTimeout(onStop, dur + 320);
    }
    /* tes manual dari Console: DrumRoll.test() */
    function test() {
        const c = ensure();
        if (!c) { console.log('❌ AudioContext gagal dibuat'); return; }
        console.log('AudioContext state:', c.state);
        if (c.state === 'suspended') { console.log('⚠️ MASIH SUSPENDED — klik dulu di mana pun di halaman, lalu jalankan lagi'); return; }
        roll(null, 1500);
        console.log('🥁 drum 1.5 detik diputar… kalau gak kedengaran: cek volume MEDIA / speaker tab');
    }
    return { roll, ensure, test };
})();

/* ===== PEMUTAR EFEK DRUM ROLL (sekali per status preroll) ===== */
let prePlayed = {};
function playPrerollIfAny() {
    const pre = PUB.pre || {};
    const key = Object.keys(pre)[0];
    if (!key) return;
    if (prePlayed[key]) return;
    prePlayed[key] = true;
    document.body.classList.add('drummode');
    DrumRoll.roll(() => document.body.classList.remove('drummode'), 3800);
}

/* ===== KREDIT PENYELENGGARA — isi foto: '' dengan URL foto, kosong = avatar inisial ===== */
const CREDITS = {
    owner: { name: 'Angga', foto: '' },
    withText: 'berserta para panitia',
    crew: [
        { name: 'Adam',  foto: '' },
        { name: 'Hades', foto: '' },
        { name: 'Kala',  foto: '' },
        { name: 'Aan',   foto: '' },
        { name: 'Ali',   foto: '' },
        { name: 'Prass', foto: '' },
        { name: 'Luci',  foto: '' },
        { name: 'Xenon', foto: '' },
        { name: 'Amar',  foto: '' },
    ]
};
const creditPhoto = p => p.foto || ava(p.name).replace('size=150', 'size=400');

function renderCredits() {
    const el = document.getElementById('credits'); if (!el) return;
    el.innerHTML = `
      <p class="credits-label">DISELENGGARAKAN OLEH</p>
      <div class="owner-card">
        <img class="owner-foto" src="${creditPhoto(CREDITS.owner)}" alt="${esc(CREDITS.owner.name)}" onerror="this.style.visibility='hidden'">
        <div>
          <p class="owner-name"><span style="font-size:.5em;vertical-align:middle;opacity:.7">✦</span> ${esc(CREDITS.owner.name)} <span style="font-size:.5em;vertical-align:middle;opacity:.7">✦</span></p>
          <p class="owner-role">OWNER — OTB AWARDS</p>
        </div>
      </div>
      <p class="credits-with">${esc(CREDITS.withText)}</p>
      <div class="crew-grid">
        ${CREDITS.crew.map(p => `
          <div class="crew-item">
            <img class="crew-foto" src="${creditPhoto(p)}" alt="${esc(p.name)}" loading="lazy" onerror="this.style.visibility='hidden'">
            <span class="crew-name">${esc(p.name)}</span>
          </div>`).join('')}
      </div>`;
}

/* ===== PEMENANG ===== */
function renderWinners() {
  const grid = document.getElementById('winGrid'), note = document.getElementById('winNote');
  if (!PUB.categories.length) { grid.innerHTML = ''; note.innerHTML = ''; return; }

  const pre = PUB.pre || {};
  const preKey = Object.keys(pre)[0] || null;
  const rev = PUB.revealed || {};
  const revCount = Object.keys(rev).length;

  if (revCount === 0 && !preKey) {
    note.innerHTML = `${ic('lock')} Semua piala masih tersegel. Hasil diumumkan panitia di malam penganugerahan.`;
    grid.innerHTML = PUB.categories.map((c, i) => `
      <article class="wcard${i % 2 ? ' even' : ''}" data-cat="${c.id}">
        <div class="wc-top"><span>${ic(c.icon)}</span><span class="badge badge-pend">TERSEGEL</span></div>
        <h3>${esc(c.name)}</h3><p class="wc-sub">${esc(c.desc)}</p>
        <div class="wc-sealed"><div class="seal">${ic('lock')}</div><p class="wc-hint">DIUMUMKAN OLEH PANITIA — SABAR YA</p></div>
      </article>`).join('');
    return;
  }

  const catByIdX = id => PUB.categories.find(c => c.id === id);
  if (preKey && catByIdX(preKey)) {
    const c = catByIdX(preKey);
    note.innerHTML = `${ic('eye')} SEDANG BERLANGSUNG — pengumuman untuk ${esc(c.name).toUpperCase()}! 🥁`;
    grid.innerHTML = PUB.categories.map((x, i) => {
      const isNow = x.id === preKey;
      return `<article class="wcard${i % 2 ? ' even' : ''}${isNow ? ' preroll' : ''}" data-cat="${x.id}">
        <div class="wc-top"><span>${ic(x.icon)}</span><span class="badge ${isNow ? 'badge-ok' : 'badge-pend'}">${isNow ? '🥁 LIVE' : 'TERSEGEL'}</span></div>
        <h3>${esc(x.name)}</h3><p class="wc-sub">${esc(x.desc)}</p>
        <div class="wc-sealed"><div class="seal">${ic('lock')}</div>
          ${isNow ? `<p class="wc-prerolltxt">memutar roda nasib…</p>` : `<p class="wc-hint">DIUMUMKAN OLEH PANITIA — SABAR YA</p>`}
        </div>
      </article>`;
    }).join('');
    playPrerollIfAny();
    return;
  }

  note.innerHTML = `${ic('eye')} ${revCount} dari ${PUB.categories.length} piala telah dibuka panitia.${revCount < PUB.categories.length ? ' Sisanya menyusul!' : ' Selamat kepada para pemenang!'}`;
  grid.innerHTML = PUB.categories.map((c, i) => {
    if (!PUB.revealed[c.id]) {
      return `<article class="wcard${i % 2 ? ' even' : ''}" data-cat="${c.id}">
        <div class="wc-top"><span>${ic(c.icon)}</span><span class="badge badge-pend">TERSEGEL</span></div>
        <h3>${esc(c.name)}</h3><p class="wc-sub">${esc(c.desc)}</p>
        <div class="wc-sealed"><div class="seal">${ic('lock')}</div><p class="wc-hint">SEGERA DIUMUMKAN</p></div>
      </article>`;
    }
    const w = (PUB.winners || {})[c.id];
    if (!w) {
      return `<article class="wcard${i % 2 ? ' even' : ''}" data-cat="${c.id}">
        <div class="wc-top"><span>${ic(c.icon)}</span><span class="badge badge-off">KOSONG</span></div>
        <h3>${esc(c.name)}</h3><p class="wc-sub">${esc(c.desc)}</p>
        <div class="wc-sealed"><p class="wc-hint">TIDAK ADA PEMENANG UNTUK KATEGORI INI</p></div>
      </article>`;
    }
    return `<article class="wcard${i % 2 ? ' even' : ''}" data-cat="${c.id}" data-cert="${c.id}">
      <div class="wc-top"><span>${ic(c.icon)}</span><span class="badge badge-ok">RESMI</span></div>
      <h3>${esc(c.name)}</h3><p class="wc-sub">${esc(c.desc)}</p>
      <div class="wc-win">
        <span class="wc-crown">${ic('crown')}</span>
        <h4>${esc(memberName(w.usn))}</h4>
        <p>${w.unanimous ? 'ditetapkan panitia' : w.votes + ' suara'}</p>
        <span class="wc-reopen">Buka Sertifikat →</span>
      </div>
    </article>`;
  }).join('');
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
    const w = card ? (PUB.winners || {})[card.dataset.cert] : null;
    if (!w) { b.classList.remove('on'); return; }
    const nm = memberName(w.usn);
    const m = ROSTER.find(r => r.name === nm || r.usn === w.usn);
    const src = (m && typeof FOTO_ANGGOTA !== 'undefined' && FOTO_ANGGOTA[m.usn])
      || ava(nm).replace('size=150', 'size=400');
    const img = b.querySelector('img');
    if (img.dataset.src !== src) { img.src = src; img.dataset.src = src; }
    const x = Math.min(Math.max(8, e.clientX + 26), innerWidth - 216);
    const y = Math.min(Math.max(8, e.clientY - 130), innerHeight - 276);
    b.style.transform = `translate(${x}px,${y}px)`;
    b.classList.add('on');
  });
  grid.addEventListener('pointerleave', () => { if (box) box.classList.remove('on'); });
}

function openCert(catId) {
  const c = catById(catId), w = (PUB.winners || {})[catId];
  if (!c || !w) return;
  const nm = memberName(w.usn);
  const name = nm.split('').map((ch, i) => `<span style="animation-delay:${(.35 + i * .03).toFixed(2)}s">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join('');
  document.getElementById('certBody').innerHTML = `
    <p class="cert-kicker">Dengan bangga mempersembahkan penerima penghargaan malam ini</p>
    <p class="cert-cat">${esc(c.name)}</p>
    <div class="trophy">${ic('trophy')}</div>
    <h3 class="cert-name">${name}</h3>
    <p class="cert-votes">Mengumpulkan <b>${w.unanimous ? 'persetujuan bulat panitia' : w.votes + ' suara'}</b> dari rekan-rekan yang sangat serius.</p>
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

function initPemenang() {
  initFloatWin();
  renderCredits();
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