(function () {
  var root = document.documentElement;
  root.classList.add('js');

  var storageKey = 'am-theme';
  var stored = null;

  try {
    stored = window.localStorage.getItem(storageKey);
  } catch (error) {
    stored = null;
  }

  var systemDark =
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  var theme = stored === 'light' || stored === 'dark' ? stored : systemDark ? 'dark' : 'light';

  root.setAttribute('data-theme', theme);

  var themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) {
    themeColor.setAttribute('content', theme === 'dark' ? '#0c0e15' : '#4f46e5');
  }
})();
