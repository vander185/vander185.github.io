/* Claire : affichage téléphone — clavier et conversation */
(() => {
  const b = document.body, vv = window.visualViewport, log = document.getElementById('log'), cxi = document.getElementById('cxi');
  let full = Math.max(innerHeight, vv ? vv.height : 0);
  function fit() {
    const h = vv ? vv.height : innerHeight;
    if (h > full) full = h;
    // la hauteur visible suit le clavier : rien ne passe dessous
    b.style.setProperty('--vvh', Math.round(h) + 'px');
    const kbd = document.activeElement === cxi && h < full * 0.8;
    b.classList.toggle('kbd', kbd);
    if (kbd) { window.scrollTo(0, 0); if (log) log.scrollTop = log.scrollHeight; }
  }
  function talk() {
    b.classList.toggle('talk', !!(log && log.children.length));
    if (log) log.scrollTop = log.scrollHeight;
  }
  if (vv) { vv.addEventListener('resize', fit); vv.addEventListener('scroll', () => window.scrollTo(0, 0)); }
  addEventListener('resize', fit);
  addEventListener('orientationchange', () => { full = 0; setTimeout(fit, 300); });
  if (cxi) { cxi.addEventListener('focus', () => setTimeout(fit, 250)); cxi.addEventListener('blur', () => setTimeout(fit, 250)); }
  if (log) new MutationObserver(talk).observe(log, { childList: true });
  fit(); talk();
})();
