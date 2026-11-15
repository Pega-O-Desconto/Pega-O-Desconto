// Pega O Desconto — movimento editorial
// Fundo em parallax de camadas + letras/palavras inseridas conforme a rolagem.
// Tudo local (CSS/JS): nenhum vídeo ou request externo.
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const html = document.documentElement;

  // ------------------------------------------- fundo em camadas (parallax)
  // Velocidades diferentes por camada: quanto maior, mais "perto" ela parece.
  const aurora = document.createElement('div');
  aurora.className = 'aurora';
  aurora.setAttribute('aria-hidden', 'true');
  // Da camada mais distante para a mais próxima. "data-speed" desloca em
  // proporção direta à rolagem (fumaça); "data-depth" percorre a página;
  // a grade usa "data-scroll" e repete em loop para nunca descobrir a tela.
  aurora.innerHTML = [
    '<div class="aurora__layer" data-speed="0.24" data-drift="46"><span class="aurora__photo b"></span></div>',
    '<div class="aurora__layer" data-speed="0.42" data-drift="70"><span class="aurora__photo a"></span></div>',
    '<div class="aurora__layer" data-scroll="0.22" data-drift="30"><span class="aurora__grid"></span></div>',
    '<div class="aurora__layer" data-depth="120"><span class="aurora__blob a"></span></div>',
    '<div class="aurora__layer" data-depth="170"><span class="aurora__blob b"></span></div>',
    '<div class="aurora__layer" data-depth="230"><span class="aurora__blob c"></span></div>',
    '<div class="aurora__layer" data-depth="280" data-drift="-120"><span class="aurora__sweep"></span></div>'
  ].join('');
  document.body.prepend(aurora);

  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);

  if (reduce) return;

  // Roda depois do i18n montar o texto: assim o original em PT é cacheado
  // antes de qualquer span de letra entrar no DOM.
  function init() {
    html.classList.add('motion');

    // ------------------------------------------------- divisão tipográfica
    const CHARS = '.hero h1, h2[data-i18n], h3[data-i18n], .kicker > span[data-i18n], .scene-word[data-i18n]';
    const WORDS = '.hero-lead[data-i18n], .chapter-side p[data-i18n], .steps-lead[data-i18n], .points-note[data-i18n], .page-lead[data-i18n], .cta-inner > p[data-i18n]';

    function splitWords(el) {
      const text = el.textContent;
      if (!text.trim() || text.length > 320) return;
      const parts = text.split(/(\s+)/);
      if (parts.length > 90) return;
      const frag = document.createDocumentFragment();
      let i = 0;
      for (const part of parts) {
        if (!part) continue;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); continue; }
        const w = document.createElement('span');
        w.className = 'w';
        const wi = document.createElement('span');
        wi.className = 'wi';
        wi.style.setProperty('--i', Math.min(i, 14));
        wi.textContent = part;
        w.appendChild(wi);
        frag.appendChild(w);
        i++;
      }
      el.textContent = '';
      el.appendChild(frag);
      el.classList.add('split');
      el.dataset.motionSplit = 'words';
    }

    function splitChars(el) {
      let word = 0;
      const walk = (node) => {
        [...node.childNodes].forEach((child) => {
          if (child.nodeType === Node.TEXT_NODE) {
            const value = child.nodeValue;
            if (!value || !value.trim()) return;
            const frag = document.createDocumentFragment();
            for (const part of value.split(/(\s+)/)) {
              if (!part) continue;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); continue; }
              const w = document.createElement('span');
              w.className = 'w';
              w.style.setProperty('--i', Math.min(word, 6));
              word++;
              let j = 0;
              for (const ch of part) {
                const c = document.createElement('span');
                c.className = 'ch';
                c.style.setProperty('--j', Math.min(j, 9));
                c.textContent = ch;
                w.appendChild(c);
                j++;
              }
              frag.appendChild(w);
            }
            child.replaceWith(frag);
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            walk(child);
          }
        });
      };
      walk(el);
      el.classList.add('split', 'split-chars');
      el.dataset.motionSplit = 'chars';
    }

    const targets = [];
    document.querySelectorAll(CHARS).forEach((el) => {
      splitChars(el);
      if (el.dataset.motionSplit) targets.push(el);
    });
    document.querySelectorAll(WORDS).forEach((el) => {
      splitWords(el);
      if (el.dataset.motionSplit) targets.push(el);
    });

    // Revela quando entra na tela (roleta a inserção das letras)
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
    targets.forEach((el) => io.observe(el));

    // Troca de idioma reescreve o texto: redivide e reanima.
    document.addEventListener('pod:langchange', () => {
      targets.forEach((el) => {
        // O h1 da marca vem por data-i18n-html: o i18n já trocou o HTML
        // (com o span do gradiente) antes de disparar este evento.
        const htmlMode = el.hasAttribute('data-i18n-html');
        if (!htmlMode && !el.hasAttribute('data-i18n')) return;
        const chars = htmlMode || el.dataset.motionSplit === 'chars';
        el.classList.remove('in', 'split', 'split-chars');
        if (!htmlMode) {
          const text = el.textContent;
          if (!text.trim()) return;
          el.textContent = text;
        }
        if (chars) splitChars(el);
        else splitWords(el);
        io.observe(el);
      });
    });

    // --------------------------------------------------- rolagem/parallax
    const scrubEls = [...document.querySelectorAll([
      '.hero-inner', '.chapter-head', '.features', '.points-layout',
      '.steps-layout', '.tags', '.faq-layout', '.cta-inner',
      '.page-head .shell', '.legal-head', '.scene-inner'
    ].join(','))];
    scrubEls.forEach((el) => el.classList.add('scrub'));

    const parallaxImgs = [...document.querySelectorAll('.hero-media img, .scene-band img, section.cta img')];
    const layers = [...aurora.querySelectorAll('.aurora__layer')];
    const photos = [...aurora.querySelectorAll('.aurora__photo')];
    const gridEl = aurora.querySelector('.aurora__grid');
    let gridTile = 104;
    const readGrid = () => {
      gridTile = parseFloat(getComputedStyle(gridEl).backgroundSize) || 104;
    };
    readGrid();

    // A fotografia é alta o bastante para o percurso inteiro da rolagem:
    // altura = deslocamento + 1,5 tela, então nunca descobre o fundo.
    let lastDocHeight = 0;
    const fitPhotos = () => {
      const vh = window.innerHeight;
      const max = Math.max(0, document.documentElement.scrollHeight - vh);
      lastDocHeight = document.documentElement.scrollHeight;
      for (const el of photos) {
        const speed = parseFloat(el.parentElement.dataset.speed) || 0;
        el.style.height = Math.ceil(max * speed + vh * 1.5) + 'px';
        el.style.top = (-vh * 0.2) + 'px';
      }
    };
    fitPhotos();
    const onResize = () => { readGrid(); fitPhotos(); };
    window.addEventListener('resize', onResize);
    window.addEventListener('load', fitPhotos);

    let ticking = false;
    const render = () => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      const doc = document.documentElement;
      const max = doc.scrollHeight - vh;
      const p = max > 0 ? Math.min(1, y / max) : 0;

      // Fontes/imagens podem mudar a altura da página depois do load.
      if (doc.scrollHeight !== lastDocHeight) fitPhotos();

      progress.style.setProperty('--scroll', p.toFixed(4));
      // dolly: o fundo avança e ganha corpo conforme a página desce
      aurora.style.setProperty('--az', (1 + p * 0.1).toFixed(4));

      // Cada camada percorre uma distância própria: as fotografias ficam
      // atrás, os glows à frente. A grade repete em loop (nunca descobre).
      for (const l of layers) {
        const depth = parseFloat(l.dataset.depth) || 0;
        const speed = parseFloat(l.dataset.speed) || 0;
        const loop = parseFloat(l.dataset.scroll) || 0;
        const drift = parseFloat(l.dataset.drift) || 0;
        let ty;
        if (loop) ty = -((y * loop) % gridTile);
        else if (speed) ty = -y * speed;
        else ty = (0.5 - p) * depth * vh / 100;
        const tx = (p - 0.5) * drift;
        l.style.transform = 'translate3d(' + tx.toFixed(1) + 'px, ' + ty.toFixed(1) + 'px, 0)';
      }

      for (const el of scrubEls) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -220 || r.top > vh + 220) continue;
        const off = (r.top + r.height / 2 - vh / 2) * 0.14;
        el.style.setProperty('--sp', Math.max(-72, Math.min(72, off)).toFixed(1) + 'px');
      }

      for (const img of parallaxImgs) {
        const r = img.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) continue;
        const off = Math.max(-58, Math.min(58, (r.top + r.height / 2 - vh / 2) * -0.1));
        img.style.transform = 'scale(1.16) translate3d(0, ' + off.toFixed(1) + 'px, 0)';
      }
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(render); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
