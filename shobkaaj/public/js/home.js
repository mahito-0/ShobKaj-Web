// Interactive homepage + Aurora WAVE (green palette)
(() => {
  /* Smooth anchor scroll */
  const initSmoothScroll = () => {
    document.querySelectorAll('.topbar .links a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const id = a.getAttribute('href').slice(1);
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  };

  /* Topbar shadow on scroll */
  const initTopbarScroll = () => {
    const topbar = document.getElementById('topbar');
    if (!topbar) return;
    const onScroll = () => topbar.classList.toggle('scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  };

  /* Reveal on scroll */
  const initScrollReveal = () => {
    const ro = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          ro.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => ro.observe(el));
  };

  /* Tilt for service cards */
  const initServiceCardTilt = () => {
    const maxTilt = 8;
    document.querySelectorAll('.svc.tilt').forEach(card => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `rotateX(${(-py * maxTilt).toFixed(2)}deg) rotateY(${(px * maxTilt).toFixed(2)}deg) translateY(-4px)`;
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = 'translateY(0) rotateX(0) rotateY(0)';
      });
    });
  };

  /* Parallax tilt for phone mock */
  const initPhoneParallax = () => {
    const phone = document.getElementById('phone');
    const hero = document.querySelector('[data-parallax]');
    if (phone && hero) {
      const maxR = 6;
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        phone.style.transform = `rotateX(${(-py * maxR).toFixed(2)}deg) rotateY(${(px * maxR).toFixed(2)}deg)`;
      });
      hero.addEventListener('pointerleave', () => {
        phone.style.transform = 'rotateX(0) rotateY(0)';
      });
    }
  };

  /* Aurora WAVE — layered sine ribbons in brand greens */
  const initAuroraWave = () => {
    const canvas = document.getElementById('aurora');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    const DPR = Math.min(2, window.devicePixelRatio || 1);
    const css = getComputedStyle(document.documentElement);

    const hex = (v, fb) => (v && v.trim() && v.trim() !== 'initial') ? v.trim() : fb;
    const ACCENT = hex(css.getPropertyValue('--accent'), '#335733');
    const MINT = hex(css.getPropertyValue('--accent-weak-2'), '#b7e4cd');
    const DEEP = hex(css.getPropertyValue('--accent-dark'), '#27462d');

    const hexToRgb = h => {
      let s = h.replace('#', '');
      if (s.length === 3) s = s.split('').map(x => x + x).join('');
      const n = parseInt(s, 16);
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    };
    const rgba = (c, a) => `rgba(${c.r},${c.g},${c.b},${a})`;

    const c1 = hexToRgb(ACCENT);
    const c2 = hexToRgb(MINT);
    const c3 = hexToRgb(DEEP);

    const layers = [
      { amp: 28, wl: 280, speed: 0.60, y: 140, color: c1, alpha: 0.55 },
      { amp: 22, wl: 360, speed: 0.42, y: 160, color: c2, alpha: 0.42 },
      { amp: 16, wl: 440, speed: 0.28, y: 178, color: c3, alpha: 0.28 }
    ];

    let W = 0, H = 0, raf = 0;
    const TWO_PI = Math.PI * 2;

    function size() {
      const host = document.querySelector('.hero-grid');
      const rect = host.getBoundingClientRect();
      W = Math.max(300, Math.floor(rect.width));
      H = Math.floor(parseInt(getComputedStyle(canvas).height) || 360);
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function waveY(layer, x, t) {
      const base = layer.y;
      const k = TWO_PI / layer.wl;
      return base
        + Math.sin(x * k + t * layer.speed) * layer.amp
        + Math.sin(x * k * 0.5 + t * (layer.speed * 0.6) + 1.5) * (layer.amp * 0.35);
    }

    function draw(ts) {
      const t = (ts || 0) / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      ctx.filter = 'blur(18px)';

      layers.forEach((L) => {
        ctx.beginPath();
        const step = 6;
        let x = -20, y = waveY(L, x, t);
        ctx.moveTo(x, y);
        for (x = -20; x <= W + 20; x += step) {
          y = waveY(L, x, t);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(W + 20, H + 40);
        ctx.lineTo(-20, H + 40);
        ctx.closePath();

        const g = ctx.createLinearGradient(0, L.y - L.amp - 40, 0, H + 60);
        g.addColorStop(0.00, rgba(L.color, L.alpha));
        g.addColorStop(0.65, rgba(L.color, L.alpha * 0.16));
        g.addColorStop(1.00, rgba(L.color, 0.0));
        ctx.fillStyle = g;
        ctx.fill();
      });

      ctx.filter = 'none';
      raf = requestAnimationFrame(draw);
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const onResize = () => {
      size();
      if (reduce) {
        cancelAnimationFrame(raf);
        draw(0);
      }
    };
    window.addEventListener('resize', onResize);
    size();
    if (!reduce) raf = requestAnimationFrame(draw);
  };

  /* CTA sparkles using the same green palette */
  const initCtaSparkles = () => {
    const btn = document.getElementById('getNow');
    if (!btn) return;

    const css = getComputedStyle(document.documentElement);
    const accent = (css.getPropertyValue('--accent') || '#335733').trim();
    const mint = (css.getPropertyValue('--accent-weak-2') || '#b7e4cd').trim();
    const deep = (css.getPropertyValue('--accent-dark') || '#27462d').trim();
    const colors = [accent, mint, deep, accent];

    btn.style.position = 'relative';
    btn.addEventListener('click', (e) => {
      for (let i = 0; i < 12; i++) {
        const sp = document.createElement('span');
        sp.className = 'sparkle';
        const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 40;
        const tx = Math.cos(a) * d, ty = Math.sin(a) * d;
        sp.style.setProperty('--tx', `${tx}px`);
        sp.style.setProperty('--ty', `${ty}px`);
        sp.style.left = (e.offsetX ?? btn.clientWidth / 2) + 'px';
        sp.style.top = (e.offsetY ?? btn.clientHeight / 2) + 'px';
        sp.style.background = colors[i % colors.length];
        sp.style.animation = 'burst 700ms ease-out forwards';
        btn.appendChild(sp);
        sp.addEventListener('animationend', () => sp.remove());
      }
    });
  };

  /* Reduced motion: disable tilts/parallax too */
  const initReducedMotion = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.svc.tilt, #phone').forEach(el => {
        el.onpointermove = null;
        el.onpointerleave = null;
        el.style.transform = '';
      });
    }
  };

  const init = () => {
    initSmoothScroll();
    initTopbarScroll();
    initScrollReveal();
    initServiceCardTilt();
    initPhoneParallax();
    initAuroraWave();
    initCtaSparkles();
    initReducedMotion();
  };

  init();
})();