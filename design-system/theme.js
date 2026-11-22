/* ==========================================================================
   å­¦ä¹ ç«™è®¾è®¡ç³»ç»Ÿ Â· ä¸»é¢˜å¼•å¯¼
   --------------------------------------------------------------------------
   æ”¾åœ¨ <head> é‡Œã€CSS ä¹‹å‰åŒæ­¥åŠ è½½ï¼šå…ˆå®šä¸»é¢˜å†ç»˜åˆ¶ï¼Œé¿å…æ·±è‰²æ¨¡å¼é—ªç™½ã€‚
   ========================================================================== */
(function () {
  var d = document.documentElement;
  var key = 'ds:theme';
  var saved = null;
  try { saved = localStorage.getItem(key); } catch (e) {}
  var theme = saved;
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark' : 'light';
  }
  d.setAttribute('data-theme', theme);
})();


