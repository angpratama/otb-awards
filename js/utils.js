const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const ava = name => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=17120b&color=E4BE5C&bold=true&size=150`;

const ICONS = {
    star: '<path d="M12 2l2.6 6 6.4.6-4.9 4.3 1.5 6.3L12 15.8 6.4 19.2l1.5-6.3L3 8.6 9.4 8 12 2z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    check: '<path d="M5 12l5 5L19 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="1.6"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>',
    crown: '<path d="M3 17l1.5-8L9 12l3-7 3 7 4.5-3L21 17H3z"/><path d="M5 21h14"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14a4.5 4.5 0 0 0 7 0"/><path d="M9 9.5h.01M15 9.5h.01"/>',
    zap: '<path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/>',
    heart: '<path d="M12 21s-7.5-4.6-9.7-9A5.6 5.6 0 0 1 12 6a5.6 5.6 0 0 1 9.7 6c-2.2 4.4-9.7 9-9.7 9z"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M21 21v-2a4 4 0 0 0-3-3.9"/><path d="M15 3.1a4 4 0 0 1 0 7.8"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    spark: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
    shot: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M8 6l1.5-2h5L16 6"/><circle cx="12" cy="13" r="3.5"/>',
};
function ic(n, c = 'ic') { return `<svg class="${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ''}</svg>`; }

function toast(title, msg = '') {
    const wrap = document.getElementById('toasts'); if (!wrap) return;
    const t = document.createElement('div'); t.className = 'toast';
    t.innerHTML = `<span class="t-ic">${ic('spark')}</span><div><b>${esc(title)}</b>${msg ? `<p>${esc(msg)}</p>` : ''}</div>`;
    wrap.appendChild(t);
    requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 350) }, 4200);
}

const Confetti = (() => {
    const cv = document.getElementById('confetti'); if (!cv) return { burst() { } };
    const cx = cv.getContext('2d'); let ps = [], raf = null;
    function size() { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; cx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); }
    addEventListener('resize', size); size();
    const COLORS = ['#E4BE5C', '#F0EAD8', '#E4572E', '#A9802B', '#fff8e7'];
    function burst(n = 140) {
        for (let i = 0; i < n; i++) ps.push({
            x: innerWidth / 2 + (Math.random() - .5) * 160, y: innerHeight * .38,
            vx: (Math.random() - .5) * 14, vy: -Math.random() * 13 - 4, g: .32 + Math.random() * .12,
            s: 4 + Math.random() * 6, r: Math.random() * Math.PI, vr: (Math.random() - .5) * .3,
            c: COLORS[(Math.random() * COLORS.length) | 0], life: 110 + Math.random() * 40
        });
        if (!raf) raf = requestAnimationFrame(tick);
    }
    function tick() {
        cx.clearRect(0, 0, innerWidth, innerHeight);
        ps = ps.filter(p => p.life-- > 0 && p.y < innerHeight + 40);
        ps.forEach(p => {
            p.vy += p.g; p.x += p.vx; p.vx *= .985; p.y += p.vy; p.r += p.vr;
            cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.globalAlpha = Math.min(1, p.life / 40); cx.fillStyle = p.c;
            cx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .62); cx.restore();
        });
        raf = ps.length ? requestAnimationFrame(tick) : (cx.clearRect(0, 0, innerWidth, innerHeight), null);
    }
    return { burst };
})();