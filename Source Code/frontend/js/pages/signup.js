// Sign Up Page Logic
$(function() {
  $('#signup-btn').on('click', function() {
    const name = $('#name').val().trim();
    const email = $('#email').val().trim();
    const pw = $('#password').val();
    const confirm = $('#confirm').val();

    if (!name || !email || !pw || !confirm) {
      $('#error-msg').html('<div class="alert alert-danger">Please fill in all fields.</div>'); return;
    }
    if (pw !== confirm) {
      $('#error-msg').html('<div class="alert alert-danger">Passwords do not match.</div>'); return;
    }
    if (HMS.users.find(u => u.email === email)) {
      $('#error-msg').html('<div class="alert alert-danger">An account with this email already exists.</div>'); return;
    }
    const newUser = { id: HMS.users.length + 1, name, email, password: pw, role: 'guest' };
    HMS.users.push(newUser);
    HMS.saveUsers();
    HMS.setUser(newUser);
    HMS.redirectByRole('guest');
  });

  $('input').on('keypress', function(e) { if (e.which === 13) $('#signup-btn').click(); });
});
