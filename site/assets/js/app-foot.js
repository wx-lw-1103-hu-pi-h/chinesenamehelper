/* Shared footer behaviour for the secondary pages. */
(function () {
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();
})();
