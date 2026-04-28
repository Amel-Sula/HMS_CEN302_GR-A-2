// Sign In Page Logic
$(function() {
  // Redirect if already logged in
  const existing = HMS.getUser();
  if (existing) HMS.redirectByRole(existing.role);

  function doLogin(email, password) {
    const user = HMS.users.find(u => u.email === email && u.password === password);
    if (!user) {
      $('#error-msg').html('<div class="alert alert-danger">Invalid email or password.</div>');
      return;
    }
    HMS.setUser(user);
    HMS.redirectByRole(user.role);
  }

  $('#signin-btn').on('click', function() {
    const email = $('#email').val().trim();
    const pw = $('#password').val();
    if (!email || !pw) {
      $('#error-msg').html('<div class="alert alert-danger">Please fill in all fields.</div>');
      return;
    }
    doLogin(email, pw);
  });

  $('input').on('keypress', function(e) {
    if (e.which === 13) $('#signin-btn').click();
  });

  $('.quick-login').on('click', function() {
    doLogin($(this).data('email'), $(this).data('pw'));
  });
});
