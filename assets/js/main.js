
(function() {
  const root = document.documentElement;
  const saved = localStorage.getItem('color-scheme');
  if (saved === 'light') root.classList.add('light');

  function closeAll() {
    document.querySelectorAll('.menu-item.open').forEach(i => i.classList.remove('open'));
  }

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-menu]');
    if (trigger) {
      const item = trigger.closest('.menu-item');
      const already = item.classList.contains('open');
      closeAll();
      if (!already) item.classList.add('open');
      e.preventDefault();
      return;
    }
    // click outside closes menus
    if (!e.target.closest('.menu-dropdown')) closeAll();
  });

  // View -> Mode switching
  document.querySelectorAll('[data-mode]').forEach(btn => {
    btn.addEventListener('click', e => {
      const mode = btn.getAttribute('data-mode');
      if (mode === 'dark') root.classList.remove('light');
      if (mode === 'light') root.classList.add('light');
      localStorage.setItem('color-scheme', mode);
      document.getElementById('modeIndicator').textContent = mode === 'light' ? 'Light' : 'Dark';
      closeAll();
    });
  });
})();
