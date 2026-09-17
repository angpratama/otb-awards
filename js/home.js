function initMarquee() {
    const items = (pubCats().length ? pubCats() : [{ name: 'SEGERA HADIR' }])
        .map(c => `<span>${esc(c.name.toUpperCase())}</span><span class="mq-s">✦</span>`).join('');
    document.getElementById('mqTrack').innerHTML = `<div class="mq-g">${items}</div><div class="mq-g" aria-hidden="true">${items}</div>`;
}
function initCountdown() {
    const el = document.getElementById('countdown');
    const target = new Date(PUB.ceremonyAt || EVENT_DATE_STR).getTime();
    const u = [['HARI', 864e5], ['JAM', 36e5], ['MENIT', 6e4], ['DETIK', 1e3]];
    el.innerHTML = u.map(x => `<div class="cd-unit"><b>00</b><span>${x[0]}</span></div>`).join('');
    const bs = el.querySelectorAll('b');
    let done = false;
    const tick = () => {
        if (done) return;
        const d = Math.max(0, target - Date.now());
        if (d === 0) {
            done = true;
            el.innerHTML = '<div class="cd-unit" style="border-left:0;padding-left:0"><b>✦</b><span>MALAM PENGANUGERAHAN TELAH TIBA</span></div>';
            return;
        }
        const v = [
            Math.floor(d / 864e5),
            Math.floor(d / 36e5) % 24,
            Math.floor(d / 6e4) % 60,
            Math.floor(d / 1e3) % 60
        ];
        v.forEach((n, i) => bs[i].textContent = String(n).padStart(2, '0'));
    };
    tick(); setInterval(tick, 1000);
    const dt = new Date(target).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    $$('.ev-date').forEach(e => e.textContent = dt.toUpperCase());
    $('#fYear').textContent = new Date().getFullYear();
}
function renderStats(animate = true) {
    const pubCands = pubCats().flatMap(c => candsIn(c.id)).length; // rahasia tidak dihitung
    const vals = { stCat: pubCats().length, stCand: pubCands, stV: ROSTER.length };
    for (const id in vals) {
        const b = document.getElementById(id), to = vals[id];
        if (!animate) { b.textContent = to; b.dataset.t = to; continue; }
        const from = +b.dataset.t || 0; b.dataset.t = to;
        const t0 = performance.now();
        (function f(t) { const p = Math.min(1, (t - t0) / 700); b.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); })(t0);
    }
}
function renderCatIndex() {
    const ol = document.getElementById('catIndex');
    if (!pubCats().length) {
        ol.innerHTML = `<li class="empty">${ic('trophy')}<h3>Piala belum diumumkan.</h3><p>Panitia sedang menyusun kategori. Pantengin terus halaman ini.</p></li>`;
        return;
    }
    ol.innerHTML = pubCats().map((c, i) => `
    <li class="cat-row" data-go="${c.id}" role="button" tabindex="0">
      <span class="num">${String(i + 1).padStart(2, '0')}</span>
      <div><h3>${esc(c.name)}</h3><p class="cr-tag">${esc(c.desc)}</p></div>
      <span class="go">LIHAT KANDIDAT ${ic('arrow')}</span>
    </li>`).join('');
}
function bindCatIndex() {
    const ol = document.getElementById('catIndex');
    const open = id => { if (typeof setCat === 'function') setCat(id); location.hash = '#voting'; };
    ol.addEventListener('click', e => { const r = e.target.closest('[data-go]'); if (r) open(r.dataset.go); });
    ol.addEventListener('keydown', e => { if (e.key === 'Enter') { const r = e.target.closest('[data-go]'); if (r) open(r.dataset.go); } });
}
function initHeroFx() {
    const ht = document.getElementById('heroTitle'); if (!ht) return;
    const set = (x, y) => { const r = ht.getBoundingClientRect(); ht.style.setProperty('--sx', (x - r.left) + 'px'); ht.style.setProperty('--sy', (y - r.top) + 'px'); };
    ht.addEventListener('pointermove', e => set(e.clientX, e.clientY));
    let t = 0;
    setInterval(() => {
        if (!ht.closest('.page').classList.contains('active')) return;
        if (ht.matches(':hover')) return;
        const r = ht.getBoundingClientRect(); if (r.bottom < 0) return;
        t += .045; set(r.left + r.width * (.5 + .38 * Math.sin(t * 1.3)), r.top + r.height * (.42 + .3 * Math.cos(t)));
    }, 40);
}
function initFaq() {
    $$('.faq .q').forEach(q => q.addEventListener('click', () => {
        const item = q.parentElement, a = item.querySelector('.a'), open = item.classList.toggle('open');
        a.style.maxHeight = open ? a.scrollHeight + 'px' : 0;
    }));
}