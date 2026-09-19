const PAGES = ['home', 'nominasi', 'voting', 'pemenang', 'info'];
let rvObs = null;
function observeRv() {
    if (!rvObs) rvObs = new IntersectionObserver(es => es.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); rvObs.unobserve(en.target); }
    }), { threshold: .12 });
    $$('.page.active .rv:not(.in)').forEach(el => rvObs.observe(el));
}
function closeMenu() {
    document.getElementById('mnav').classList.remove('open');
    document.getElementById('burger').classList.remove('open');
    document.body.classList.remove('locked');
}
function route() {
    let h = (location.hash || '#home').slice(1);
    if (!PAGES.includes(h)) h = 'home';
    $$('.page').forEach(p => p.classList.toggle('active', p.dataset.page === h));
    $$('.nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + h));
    closeMenu(); scrollTo(0, 0); observeRv();
}
function initNav() {
    document.getElementById('burger').addEventListener('click', () => {
        const open = document.getElementById('mnav').classList.toggle('open');
        document.getElementById('burger').classList.toggle('open', open);
        document.getElementById('burger').setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
        document.body.classList.toggle('locked', open);
    });
    document.addEventListener('change', e => {
        if (e.target.matches('[data-idbar]') && typeof setIdentity === 'function') setIdentity(e.target.value);
    });
    addEventListener('hashchange', route);
}
function initIntro() {
    const intro = document.getElementById('intro'); if (!intro) return;
    if (sessionStorage.getItem('ba_intro')) { intro.remove(); return; }
    const finish = () => {
        if (typeof DrumRoll !== 'undefined') DrumRoll.ensure(); // buka izin audio sejak interaksi pertama
        if (intro.classList.contains('done')) return;
        intro.classList.add('done');
        sessionStorage.setItem('ba_intro', '1');
        setTimeout(() => intro.remove(), 1000);
    };
    intro.addEventListener('click', finish);
    setTimeout(finish, 3000);
}
function renderAll() {
    initMarquee(); renderCatIndex(); renderStats(); renderMyNoms();
    renderChips(); renderCandOptions();
    renderVoteUI(); renderWinners(); syncNomClosed();
}

document.addEventListener('DOMContentLoaded', () => {
    initIntro();
    initNav();
    route(); // tampilkan halaman DULU — sekalipun ada error di bawah, beranda tetap muncul

    initCountdown(); initHeroFx(); initFaq();
    try { initNominasi(); initVoting(); initPemenang(); } catch (e) { console.error(e); }
    renderStats(false); renderCatIndex();
    try { renderMyNoms(); renderVoteUI(); renderWinners(); } catch (e) { console.error(e); }

    if (typeof Cloud !== 'undefined') {
        Cloud.onChange(renderAll);
        Cloud.listenPub();
    }
    setInterval(renderAll, 30000); // buka/tutup otomatis berganti sendiri di layar anggota
});