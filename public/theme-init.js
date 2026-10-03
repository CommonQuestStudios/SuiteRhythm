(function(){
  // Applies saved appearance before first paint. Also migrates the retired
  // look preset / 16 palette settings onto the three accents.
  try {
    var root = document.documentElement;
    var theme = localStorage.getItem('SuiteRhythm_theme') || 'dark';
    var accent = localStorage.getItem('SuiteRhythm_accent');
    if (accent === null) {
      var legacy = localStorage.getItem('SuiteRhythm_palette') || '';
      if (/crimson|sunset|amber|rose|neon-arcade/.test(legacy)) accent = 'copper';
      else if (/toxic|neon-pink|deep-space|vaporwave|cobalt/.test(legacy)) accent = 'violet';
      else accent = '';
      localStorage.setItem('SuiteRhythm_accent', accent);
      localStorage.removeItem('SuiteRhythm_palette');
      localStorage.removeItem('SuiteRhythm_look');
    }
    var themeOverride = null;
    try { themeOverride = new URLSearchParams(location.search).get('theme'); } catch (e) {}
    if (themeOverride === 'light' || themeOverride === 'dark') theme = themeOverride;
    root.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark');
    if (accent) root.setAttribute('data-accent', accent);
    else root.removeAttribute('data-accent');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}());
