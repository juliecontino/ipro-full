/**
 * String utility functions.
 * @namespace stringUtilsVF
 * 
 * HACK: Used ONLY by Setup VF page to prevent infinite loading in DocuSign Setup (DFS-13436)
 */
window.stringUtilsVF = (function () {
  /**
   * Unescapes an HTML string, i.e. '&amp;' will be replaced with '&', '&lt;' with '<', and '&gt;' with '>'.
   * @param s {string} The HTML to unescape.
   * @returns {string} The unescaped HTML.
   */
  var unescapeHtml = function (s) {
    if (!s) {
      return '';
    }
    return s.replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, '\'');
  };

  return Object.freeze({
    unescapeHtml: unescapeHtml
  });
}());
