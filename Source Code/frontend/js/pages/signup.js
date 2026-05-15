$(function () {
  $('#signup-btn').on('click', async function () {
    const name    = $('#name').val().trim();
    const email   = $('#email').val().trim();
    const pw      = $('#password').val();
    const confirm = $('#confirm').val();

    if (!name || !email || !pw || !confirm) {
      $('#error-msg').html('<div class="alert alert-danger">Please fill in all fields.</div>'); return;
    }
    if (pw !== confirm) {
      $('#error-msg').html('<div class="alert alert-danger">Passwords do not match.</div>'); return;
    }

    $(this).prop('disabled', true).text('Creating account…');
    try {
      const result = await HMS.api('POST', '/auth/register', { name, email, password: pw });
      HMS.setUser(result.user);
      HMS.setToken(result.token);
      HMS.redirectByRole('guest');
    } catch (err) {
      $('#error-msg').html(`<div class="alert alert-danger">${err.message}</div>`);
      $(this).prop('disabled', false).text('Sign Up');
    }
  });

  $('input').on('keypress', function (e) { if (e.which === 13) $('#signup-btn').click(); });
});
