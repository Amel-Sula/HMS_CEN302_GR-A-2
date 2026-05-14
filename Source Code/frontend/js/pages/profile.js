$(function() {
  const user = HMS.requireAuth('guest');
  if (!user) return;
  HMS.buildSidebar('profile');
  $('#topbar-user').html(`<span>${user.name}</span><div class="topbar-avatar">👤</div><button class="logout-btn" onclick="HMS.logout()">⎋</button>`);
  $('#p-name').val(user.name);
  $('#p-email').val(user.email);
  $('#profile-name-display').text(user.name);
  $('#profile-role-display').text('Guest Account');

  $('#save-profile').on('click', function() {
    const name = $('#p-name').val().trim();
    const email = $('#p-email').val().trim();
    const currPw = $('#p-current-pw').val();
    const newPw = $('#p-new-pw').val();

    if (!name || !email) {
      $('#profile-msg').html('<div class="alert alert-danger">Name and email are required.</div>'); return;
    }
    if (currPw && currPw !== user.password) {
      $('#profile-msg').html('<div class="alert alert-danger">Current password is incorrect.</div>'); return;
    }

    const u = HMS.users.find(u => u.id === user.id);
    if (u) {
      u.name = name; u.email = email;
      if (newPw) u.password = newPw;
      user.name = name; user.email = email;
      HMS.setUser(user);
    }
    $('#profile-name-display').text(name);
    $('#profile-msg').html('<div class="alert alert-success">Profile updated successfully.</div>');
    setTimeout(() => $('#profile-msg').html(''), 3000);
  });
});
