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
function renderAll() {
    initMarquee(); renderCatIndex(); renderStats(); renderMyNoms();
    renderChips(); renderCandOptions();
    renderVoteUI(); renderWinners(); syncNomClosed();
}

document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initCountdown(); initHeroFx(); initFaq();
    initNominasi(); initVoting(); initPemenang();
    renderIdentityBars();
    renderStats(false); renderMyNoms(); renderVoteUI(); renderWinners(); renderCatIndex();

    if (typeof Cloud !== 'undefined') {
        Cloud.onChange(renderAll);
        Cloud.listenPub();
    }
    route();

    setInterval(renderAll, 30000); // buka/tutup otomatis berganti sendiri di layar anggota
});