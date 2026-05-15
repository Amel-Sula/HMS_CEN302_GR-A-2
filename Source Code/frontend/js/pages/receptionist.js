$(function () {
  const user = HMS.requireAuth('receptionist');
  if (!user) return;

  HMS.buildSidebar('dashboard');
  $('#topbar-user').html(`<span>${user.name}</span><div class="topbar-avatar">👤</div><button class="logout-btn" onclick="HMS.logout()">⎋</button>`);

  const today = new Date().toISOString().split('T')[0];
  $('#today-date').text(new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));

  let allReservations = [];
  let availableRooms  = [];

  function updateStats() {
    const checkedIn  = allReservations.filter(r => r.status === 'checked-in').length;
    const arriving   = allReservations.filter(r => r.status === 'confirmed' && r.checkIn === today).length;
    const departing  = allReservations.filter(r => r.status === 'checked-in' && r.checkOut === today).length;
    $('#stat-checkin').text(checkedIn);
    $('#stat-arriving').text(arriving);
    $('#stat-departing').text(departing);
    $('#stat-available').text(availableRooms.length);
  }

  function renderTable() {
    let res = allReservations;
    const search  = $('#search-guest').val().toLowerCase();
    const statusF = $('#status-filter').val();
    if (search)   res = res.filter(r => r.guestName.toLowerCase().includes(search) || String(r.id).includes(search));
    if (statusF)  res = res.filter(r => r.status === statusF);

    $('#res-tbody').html(res.map(r => `
      <tr>
        <td><strong>#${r.id}</strong></td>
        <td>${r.guestName}</td>
        <td>Room ${r.roomNumber}</td>
        <td>${HMS.formatDate(r.checkIn)}</td>
        <td>${HMS.formatDate(r.checkOut)}</td>
        <td>${HMS.getStatusBadge(r.status)}</td>
        <td>$${r.totalPrice.toFixed(2)}</td>
        <td><button class="btn btn-sm btn-outline edit-res" data-id="${r.id}">Edit</button></td>
      </tr>`).join(''));

    $('.edit-res').on('click', function () {
      const id  = $(this).data('id');
      const res = allReservations.find(r => r.id == id);
      if (!res) return;
      $('#update-res-id').val(id);
      $('#update-ci').val(res.checkIn);
      $('#update-co').val(res.checkOut);
      $('#update-notes').val(res.notes || '');
      $('#update-modal').removeClass('hidden');
    });
  }

  // Tabs
  $('.tab-btn').on('click', function () {
    $('.tab-btn').removeClass('active');
    $(this).addClass('active');
    const tab = $(this).data('tab');
    $('#tab-reservations, #tab-checkin, #tab-walkin').addClass('hidden');
    $('#tab-' + tab).removeClass('hidden');
  });

  $('#search-guest, #status-filter').on('input change', renderTable);

  // ── Check-in ─────────────────────────────────────────────
  $('#ci-res-id').on('input', function () {
    const val = $(this).val().trim();
    const res = allReservations.find(r =>
      String(r.id) === val && r.status === 'confirmed'
    );
    if (res) {
      $('#ci-preview').show().html(`<strong>${res.guestName}</strong> · Room ${res.roomNumber}<br>Check-in: ${HMS.formatDate(res.checkIn)} → Check-out: ${HMS.formatDate(res.checkOut)}`);
    } else {
      $('#ci-preview').hide();
    }
  });

  $('#do-checkin').on('click', async function () {
    const id = $('#ci-res-id').val().trim();
    if (!id) { $('#ci-msg').html('<div class="alert alert-danger">Enter a reservation ID.</div>'); return; }
    $(this).prop('disabled', true);
    try {
      await HMS.api('POST', `/reservations/${id}/checkin`);
      HMS.toast('Guest checked in!', 'success');
      $('#ci-res-id').val(''); $('#ci-preview').hide(); $('#ci-msg').html('');
      await reload();
    } catch (err) {
      $('#ci-msg').html(`<div class="alert alert-danger">${err.message}</div>`);
    } finally {
      $(this).prop('disabled', false);
    }
  });

  // ── Check-out ─────────────────────────────────────────────
  $('#co-res-id').on('input', function () {
    const val = $(this).val().trim();
    const res = allReservations.find(r =>
      String(r.id) === val && r.status === 'checked-in'
    );
    if (res) {
      $('#co-preview').show().html(`<strong>${res.guestName}</strong> · Room ${res.roomNumber}<br>Check-out: ${HMS.formatDate(res.checkOut)}`);
    } else {
      $('#co-preview').hide();
    }
  });

  $('#do-checkout').on('click', async function () {
    const id = $('#co-res-id').val().trim();
    if (!id) { $('#co-msg').html('<div class="alert alert-danger">Enter a reservation ID.</div>'); return; }
    $(this).prop('disabled', true);
    try {
      await HMS.api('POST', `/reservations/${id}/checkout`);
      HMS.toast('Guest checked out!', 'success');
      $('#co-res-id').val(''); $('#co-preview').hide(); $('#co-msg').html('');
      await reload();
    } catch (err) {
      $('#co-msg').html(`<div class="alert alert-danger">${err.message}</div>`);
    } finally {
      $(this).prop('disabled', false);
    }
  });

  // ── Walk-in ───────────────────────────────────────────────
  function populateWalkInRooms() {
    $('#wi-room').html(availableRooms.map(r =>
      `<option value="${r.id}">Room ${r.number} – ${r.name} ($${r.price}/night)</option>`
    ).join(''));
  }

  $('#wi-ci, #wi-co, #wi-room').on('change', function () {
    const ci = $('#wi-ci').val(), co = $('#wi-co').val();
    const rid = parseInt($('#wi-room').val());
    if (ci && co && rid) {
      const room = availableRooms.find(r => r.id === rid);
      if (room) {
        const n = HMS.nights(ci, co);
        $('#wi-price').text(`Total: $${(room.price * n).toFixed(2)} (${n} night${n > 1 ? 's' : ''})`);
      }
    }
  });

  $('#wi-submit').on('click', async function () {
    const name  = $('#wi-name').val().trim();
    const email = $('#wi-email').val().trim();
    const roomId = parseInt($('#wi-room').val());
    const ci = $('#wi-ci').val(), co = $('#wi-co').val();

    if (!name || !roomId || !ci || !co) {
      $('#wi-msg').html('<div class="alert alert-danger">Fill in all required fields.</div>'); return;
    }
    if (new Date(co) <= new Date(ci)) {
      $('#wi-msg').html('<div class="alert alert-danger">Invalid dates.</div>'); return;
    }

    $(this).prop('disabled', true);
    try {
      await HMS.api('POST', '/reservations/walk-in', {
        guest: { name, email: email || undefined },
        roomId, checkIn: ci, checkOut: co,
      });
      HMS.toast(`Walk-in for ${name} created & checked in!`, 'success');
      $('#wi-name, #wi-email, #wi-ci, #wi-co').val('');
      $('#wi-price').text(''); $('#wi-msg').html('');
      await reload();
    } catch (err) {
      $('#wi-msg').html(`<div class="alert alert-danger">${err.message}</div>`);
    } finally {
      $(this).prop('disabled', false);
    }
  });

  // ── Edit modal ────────────────────────────────────────────
  $('#update-close, #update-cancel').on('click', () => $('#update-modal').addClass('hidden'));

  $('#save-update').on('click', async function () {
    const id = $('#update-res-id').val();
    const ci = $('#update-ci').val(), co = $('#update-co').val();
    if (!ci || !co || new Date(co) <= new Date(ci)) {
      $('#update-error').html('<div class="alert alert-danger">Invalid dates.</div>'); return;
    }
    $(this).prop('disabled', true).text('Saving…');
    try {
      await HMS.api('PUT', `/reservations/${id}`, { checkIn: ci, checkOut: co, notes: $('#update-notes').val() });
      $('#update-modal').addClass('hidden');
      HMS.toast('Reservation updated!', 'success');
      await reload();
    } catch (err) {
      $('#update-error').html(`<div class="alert alert-danger">${err.message}</div>`);
    } finally {
      $(this).prop('disabled', false).text('Save Changes');
    }
  });

  async function reload() {
    const [resData, roomData] = await Promise.all([
      HMS.api('GET', '/reservations'),
      HMS.api('GET', '/rooms'),
    ]);
    allReservations = resData.map(r => HMS.normalizeReservation(r));
    availableRooms  = roomData.map(r => HMS.normalizeRoom(r)).filter(r => r.status === 'available');
    updateStats();
    renderTable();
    populateWalkInRooms();
  }

  reload();
});
