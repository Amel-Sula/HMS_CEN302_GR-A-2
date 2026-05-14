$(function() {
  const user = HMS.requireAuth('receptionist');
  if (!user) return;
  HMS.buildSidebar('dashboard');
  $('#topbar-user').html(`<span>${user.name}</span><div class="topbar-avatar">👤</div><button class="logout-btn" onclick="HMS.logout()">⎋</button>`);

  const today = new Date().toISOString().split('T')[0];
  $('#today-date').text(new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' }));

  function updateStats() {
    const checkedIn = HMS.reservations.filter(r => r.status === 'checked-in').length;
    const arriving = HMS.reservations.filter(r => r.status === 'confirmed' && r.checkIn === today).length;
    const departing = HMS.reservations.filter(r => r.status === 'checked-in' && r.checkOut === today).length;
    const available = HMS.rooms.filter(r => r.status === 'available').length;
    $('#stat-checkin').text(checkedIn);
    $('#stat-arriving').text(arriving);
    $('#stat-departing').text(departing);
    $('#stat-available').text(available);
  }

  function renderTable() {
    let res = HMS.reservations;
    const search = $('#search-guest').val().toLowerCase();
    const statusF = $('#status-filter').val();
    if (search) res = res.filter(r => r.guestName.toLowerCase().includes(search));
    if (statusF) res = res.filter(r => r.status === statusF);

    $('#res-tbody').html(res.map(r => `
      <tr>
        <td><strong>${r.id}</strong></td>
        <td>${r.guestName}</td>
        <td>Room ${r.roomNumber}</td>
        <td>${HMS.formatDate(r.checkIn)}</td>
        <td>${HMS.formatDate(r.checkOut)}</td>
        <td>${HMS.getStatusBadge(r.status)}</td>
        <td>$${r.totalPrice}</td>
        <td>
          <button class="btn btn-sm btn-outline edit-res" data-id="${r.id}">Edit</button>
        </td>
      </tr>`).join(''));

    $('.edit-res').on('click', function() {
      const id = $(this).data('id');
      const res = HMS.reservations.find(r => r.id === id);
      if (!res) return;
      $('#update-res-id').val(id);
      $('#update-ci').val(res.checkIn);
      $('#update-co').val(res.checkOut);
      $('#update-notes').val(res.notes || '');
      $('#update-modal').removeClass('hidden');
    });
  }

  // Tabs
  $('.tab-btn').on('click', function() {
    $('.tab-btn').removeClass('active');
    $(this).addClass('active');
    const tab = $(this).data('tab');
    $('#tab-reservations, #tab-checkin, #tab-walkin').addClass('hidden');
    $('#tab-' + tab).removeClass('hidden');
  });

  $('#search-guest, #status-filter').on('input change', renderTable);

  // Check-in
  $('#ci-res-id').on('input', function() {
    const id = $(this).val().trim().toUpperCase();
    const res = HMS.reservations.find(r => r.id === id && r.status === 'confirmed');
    if (res) {
      $('#ci-preview').show().html(`<strong>${res.guestName}</strong> · Room ${res.roomNumber}<br>Check-in: ${HMS.formatDate(res.checkIn)} → Check-out: ${HMS.formatDate(res.checkOut)}`);
    } else { $('#ci-preview').hide(); }
  });

  $('#do-checkin').on('click', function() {
    const id = $('#ci-res-id').val().trim().toUpperCase();
    const res = HMS.reservations.find(r => r.id === id);
    if (!res) { $('#ci-msg').html('<div class="alert alert-danger">Reservation not found.</div>'); return; }
    if (res.status !== 'confirmed') { $('#ci-msg').html('<div class="alert alert-danger">Reservation is not in confirmed status.</div>'); return; }
    res.status = 'checked-in';
    const room = HMS.getRoom(res.roomId);
    if (room) room.status = 'occupied';
    HMS.saveReservations();
    HMS.toast('Guest checked in!', 'success');
    $('#ci-res-id').val(''); $('#ci-preview').hide(); $('#ci-msg').html('');
    updateStats(); renderTable();
  });

  // Check-out
  $('#co-res-id').on('input', function() {
    const id = $(this).val().trim().toUpperCase();
    const res = HMS.reservations.find(r => r.id === id && r.status === 'checked-in');
    if (res) {
      $('#co-preview').show().html(`<strong>${res.guestName}</strong> · Room ${res.roomNumber}<br>Check-out: ${HMS.formatDate(res.checkOut)}`);
    } else { $('#co-preview').hide(); }
  });

  $('#do-checkout').on('click', function() {
    const id = $('#co-res-id').val().trim().toUpperCase();
    const res = HMS.reservations.find(r => r.id === id);
    if (!res) { $('#co-msg').html('<div class="alert alert-danger">Reservation not found.</div>'); return; }
    if (res.status !== 'checked-in') { $('#co-msg').html('<div class="alert alert-danger">Guest is not currently checked in.</div>'); return; }
    res.status = 'completed';
    const room = HMS.getRoom(res.roomId);
    if (room) room.status = 'available';
    HMS.saveReservations();
    HMS.toast('Guest checked out!', 'success');
    $('#co-res-id').val(''); $('#co-preview').hide(); $('#co-msg').html('');
    updateStats(); renderTable();
  });

  // Walk-in
  $('#wi-room').html(HMS.rooms.filter(r => r.status === 'available').map(r =>
    `<option value="${r.id}">Room ${r.number} – ${r.name} ($${r.price}/night)</option>`
  ).join(''));

  $('#wi-ci, #wi-co, #wi-room').on('change', function() {
    const ci = $('#wi-ci').val(), co = $('#wi-co').val(), rid = $('#wi-room').val();
    if (ci && co && rid) {
      const room = HMS.getRoom(rid);
      const n = HMS.nights(ci, co);
      $('#wi-price').text(`Total: $${room.price * n} (${n} night${n > 1 ? 's' : ''})`);
    }
  });

  $('#wi-submit').on('click', function() {
    const name = $('#wi-name').val().trim();
    const email = $('#wi-email').val().trim();
    const roomId = parseInt($('#wi-room').val());
    const ci = $('#wi-ci').val(), co = $('#wi-co').val();
    if (!name || !roomId || !ci || !co) { $('#wi-msg').html('<div class="alert alert-danger">Fill in all required fields.</div>'); return; }
    if (new Date(co) <= new Date(ci)) { $('#wi-msg').html('<div class="alert alert-danger">Invalid dates.</div>'); return; }
    const room = HMS.getRoom(roomId);
    const nights = HMS.nights(ci, co);
    // Generate random password for walk-in guest (in production, send via email)
    const tempPassword = 'temp' + Math.random().toString(36).substr(2, 9);
    const newUser = { id: HMS.users.length + 1, name, email, password: tempPassword, role: 'guest' };
    HMS.users.push(newUser);
    HMS.saveUsers();
    console.log(`Walk-in guest created. Email: ${email}, Temp password: ${tempPassword}`);
    const newRes = {
      id: 'R' + String(HMS.reservations.length + 1).padStart(3, '0'),
      guestId: newUser.id, guestName: name,
      roomId, roomNumber: room.number,
      checkIn: ci, checkOut: co, status: 'checked-in',
      totalPrice: room.price * nights,
      createdAt: today, notes: 'Walk-in'
    };
    HMS.reservations.push(newRes);
    HMS.saveReservations();
    room.status = 'occupied';
    HMS.toast(`Walk-in for ${name} created & checked in!`, 'success');
    $('#wi-name, #wi-email, #wi-ci, #wi-co').val('');
    $('#wi-price').text(''); $('#wi-msg').html('');
    updateStats(); renderTable();
  });

  // Update modal
  $('#update-close, #update-cancel').on('click', () => $('#update-modal').addClass('hidden'));
  $('#save-update').on('click', function() {
    const id = $('#update-res-id').val();
    const ci = $('#update-ci').val(), co = $('#update-co').val();
    if (!ci || !co || new Date(co) <= new Date(ci)) {
      $('#update-error').html('<div class="alert alert-danger">Invalid dates.</div>'); return;
    }
    const res = HMS.reservations.find(r => r.id === id);
    if (res) {
      const room = HMS.getRoom(res.roomId);
      res.checkIn = ci; res.checkOut = co;
      res.notes = $('#update-notes').val();
      if (room) res.totalPrice = room.price * HMS.nights(ci, co);
      HMS.saveReservations();
    }
    $('#update-modal').addClass('hidden');
    HMS.toast('Reservation updated!', 'success');
    renderTable();
  });

  updateStats();
  renderTable();
});
