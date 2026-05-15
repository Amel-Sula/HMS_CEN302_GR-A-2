$(function () {
  const user = HMS.requireAuth('guest');
  if (!user) return;

  HMS.buildSidebar('profile');
  $('#topbar-user').html(`<span>${user.name}</span><div class="topbar-avatar">👤</div><button class="logout-btn" onclick="HMS.logout()">⎋</button>`);

  // Load fresh profile from API
  (async () => {
    try {
      const profile = await HMS.api('GET', '/auth/me');
      $('#p-name').val(profile.name);
      $('#p-email').val(profile.email);
      if (profile.phone) $('#p-phone').val(profile.phone);
      $('#profile-name-display').text(profile.name);
      $('#profile-role-display').text('Guest Account');
    } catch (err) {
      $('#p-name').val(user.name);
      $('#p-email').val(user.email);
      $('#profile-name-display').text(user.name);
      $('#profile-role-display').text('Guest Account');
    }
  })();

  $('#save-profile').on('click', async function () {
    const name    = $('#p-name').val().trim();
    const email   = $('#p-email').val().trim();
    const newPw   = $('#p-new-pw').val();
    const phone   = $('#p-phone').val().trim();

    if (!name || !email) {
      $('#profile-msg').html('<div class="alert alert-danger">Name and email are required.</div>'); return;
    }

    $(this).prop('disabled', true).text('Saving…');
    try {
      const body = { name, email };
      if (phone) body.phone = phone;
      if (newPw) body.password = newPw;

      const updated = await HMS.api('PUT', '/auth/profile', body);
      HMS.setUser({ ...HMS.getUser(), name: updated.name, email: updated.email });
      $('#profile-name-display').text(updated.name);
      $('#profile-msg').html('<div class="alert alert-success">Profile updated successfully.</div>');
      setTimeout(() => $('#profile-msg').html(''), 3000);
    } catch (err) {
      $('#profile-msg').html(`<div class="alert alert-danger">${err.message}</div>`);
    } finally {
      $(this).prop('disabled', false).text('Save Changes');
    }
  });
});
