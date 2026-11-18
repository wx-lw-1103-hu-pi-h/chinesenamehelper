/**
 * The enquiry form on a carrier page.
 *
 * There is no backend, so the form does not submit anywhere. It assembles the
 * fields into a mailto: URL and lets the visitor's own mail client send it —
 * which means the page stays a static file, no third-party form service holds
 * the address, and the visitor can read and edit the message before it leaves.
 *
 * The trade-off is honest and the page says so: a visitor with no configured
 * mail app gets nothing when they press the button. That is why the page also
 * prints the address as a plain mailto link underneath, so the fallback does
 * not depend on this script running at all.
 */
(function () {
  var form = document.getElementById('gift-form');
  if (!form) return;

  /* The workshop panel writes its choices into the message field before this
     form is submitted. Reading the whole field — rather than rebuilding the
     request here — is what keeps the two in step: a single source for the
     request body, edited by the visitor if they want to. */
  var to = form.getAttribute('data-contact') || '';
  if (!to) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var carrier = form.getAttribute('data-carrier') || '';
    var lang = form.getAttribute('data-lang') || '';
    var name = (form.querySelector('#gf-name') || {}).value || '';
    var email = (form.querySelector('#gf-email') || {}).value || '';
    var chinese = (form.querySelector('#gf-cn') || {}).value || '';
    var message = (form.querySelector('#gf-msg') || {}).value || '';

    /* Subject carries the carrier name so a shared inbox can file by object
       without opening the body. */
    var subject = '[Chinese Name Helper] ' + carrier + (name ? ' — ' + name : '');

    var lines = [
      'Carrier: ' + carrier,
      'Name: ' + name,
      'Email: ' + email,
      'Chinese name: ' + (chinese || '(none yet)'),
      'Page language: ' + lang,
      '',
      message
    ];

    var url = 'mailto:' + encodeURIComponent(to) +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(lines.join('\n'));

    /* Assigning location would navigate the page itself in some browsers. An
       anchor click hands the URL to the OS handler instead, which is what a
       mailto is for. */
    var a = document.createElement('a');
    a.href = url;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
})();
