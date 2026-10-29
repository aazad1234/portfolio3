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

  var theme = stored === 'light' || stored === 'dark' ? stored : 'light';

  root.setAttribute('data-theme', theme);

  var themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) {
    themeColor.setAttribute('content', '#FCF0DA');
  }
})();
