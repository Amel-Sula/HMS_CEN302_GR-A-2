$(function () {
  const existing = HMS.getUser();
  if (existing) HMS.redirectByRole(existing.role);

  async function doLogin(email, password) {
    $('#signin-btn').prop('disabled', true).text('Signing in…');
    try {
      const result = await HMS.api('POST', '/auth/login', { email, password });
      HMS.setUser(result.user);
      HMS.setToken(result.token);
      HMS.redirectByRole(result.user.role);
    } catch (err) {
      $('#error-msg').html(`<div class="alert alert-danger">${err.message}</div>`);
      $('#signin-btn').prop('disabled', false).text('Sign In');
    }
  }

  $('#signin-btn').on('click', function () {
    const email = $('#email').val().trim();
    const pw = $('#password').val();
    if (!email || !pw) {
      $('#error-msg').html('<div class="alert alert-danger">Please fill in all fields.</div>');
      return;
    }
    doLogin(email, pw);
  });

  $('input').on('keypress', function (e) {
    if (e.which === 13) $('#signin-btn').click();
  });

  $('.quick-login').on('click', function () {
    doLogin($(this).data('email'), $(this).data('pw'));
  });
});
