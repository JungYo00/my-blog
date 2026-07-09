(function () {
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');

  function currentTheme() {
    return root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  function updateLabel(theme) {
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    btn.setAttribute('aria-pressed', String(theme === 'dark'));
  }

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {}
    updateLabel(theme);
  }

  updateLabel(currentTheme());

  btn.addEventListener('click', () => {
    setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  });

  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    let stored;
    try {
      stored = localStorage.getItem('theme');
    } catch (err) {}
    if (!stored) setTheme(e.matches ? 'dark' : 'light');
  });
})();
