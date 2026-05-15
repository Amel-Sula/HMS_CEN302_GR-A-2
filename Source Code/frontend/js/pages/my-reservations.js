$(function () {
  const user = HMS.requireAuth('guest');
  if (!user) return;

  HMS.buildSidebar('reservations');
  $('#topbar-user').html(`<span>${user.name}</span><div class="topbar-avatar">👤</div><button class="logout-btn" onclick="HMS.logout()">⎋</button>`);

  let allReservations = [];

  function getFiltered() {
    const filter = $('#status-filter').val();
    return filter ? allReservations.filter(r => r.status === filter) : allReservations;
  }

  function render() {
    const res    = getFiltered();
    const filter = $('#status-filter').val();
    $('#show-label').text('Show: ' + (filter ? filter.charAt(0).toUpperCase() + filter.slice(1) : 'All reservations'));

    const active = allReservations.filter(r => r.status !== 'cancelled');
    buildMultiReservationCalendar('main-calendar', active);

    if (!res.length) {
      $('#reservations-list').html(`
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h4>No reservations found</h4>
          <p>You don't have any ${filter || ''} reservations yet.</p>
          <a href="rooms.html" class="btn btn-dark mt-3">Browse Rooms</a>
        </div>`);
      return;
    }

    $('#reservations-list').html(res.map(r => {
      const nights    = HMS.nights(r.checkIn, r.checkOut);
      const canModify = r.status === 'confirmed';
      const canCancel = r.status === 'confirmed';
      return `
      <div class="card mb-3">
        <div class="card-body">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;">
            <div>
              <div style="font-size:20px;font-weight:700;margin-bottom:4px;">Room ${r.roomNumber}</div>
              <div style="font-size:14px;color:#888;">Booking #${r.id}</div>
            </div>
            ${HMS.getStatusBadge(r.status)}
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:16px;">
            <div><div style="font-size:12px;color:#888;margin-bottom:4px;">CHECK-IN</div><div style="font-size:16px;font-weight:600;">${HMS.formatDate(r.checkIn)}</div></div>
            <div><div style="font-size:12px;color:#888;margin-bottom:4px;">CHECK-OUT</div><div style="font-size:16px;font-weight:600;">${HMS.formatDate(r.checkOut)}</div></div>
            <div><div style="font-size:12px;color:#888;margin-bottom:4px;">DURATION</div><div style="font-size:16px;font-weight:600;">${nights} night${nights > 1 ? 's' : ''}</div></div>
            <div><div style="font-size:12px;color:#888;margin-bottom:4px;">TOTAL PRICE</div><div style="font-size:16px;font-weight:600;">$${r.totalPrice.toFixed(2)}</div></div>
          </div>
          ${r.roomType ? `<div style="padding:12px;background:#f9f9f9;border-radius:8px;margin-bottom:16px;"><div style="font-size:13px;color:#666;">${r.roomType} Room</div></div>` : ''}
          ${r.notes ? `<div style="padding:12px;background:#fffbeb;border-left:3px solid #f59e0b;border-radius:4px;margin-bottom:16px;"><div style="font-size:12px;color:#92400e;font-weight:600;margin-bottom:4px;">NOTE</div><div style="font-size:13px;color:#78350f;">${r.notes}</div></div>` : ''}
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${canModify ? `<button class="btn btn-dark modify-btn" data-id="${r.id}">Modify Dates</button>` : ''}
            ${canCancel ? `<button class="btn btn-outline cancel-btn" data-id="${r.id}" style="border-color:#111;">Cancel Booking</button>` : ''}
          </div>
          <div style="font-size:12px;color:#999;margin-top:12px;padding-top:12px;border-top:1px solid #eee;">Booking #${r.id}</div>
        </div>
      </div>`;
    }).join(''));

    $('.modify-btn').on('click', function () {
      const id  = $(this).data('id');
      const res = allReservations.find(r => r.id == id);
      if (!res) return;
      $('#modify-res-id').val(id);
      $('#modify-ci').val(res.checkIn);
      $('#modify-co').val(res.checkOut);
      $('#modify-notes').val(res.notes || '');
      updateModifyPrice(res);
      $('#modify-modal').removeClass('hidden');
    });

    $('.cancel-btn').on('click', function () {
      $('#cancel-res-id').val($(this).data('id'));
      $('#cancel-modal').removeClass('hidden');
    });
  }

  function updateModifyPrice(res) {
    const ci = $('#modify-ci').val() || res?.checkIn;
    const co = $('#modify-co').val() || res?.checkOut;
    if (ci && co && res) {
      const n = HMS.nights(ci, co);
      const pricePerNight = res.totalPrice / HMS.nights(res.checkIn, res.checkOut);
      $('#modify-price').text(`Total: $${(pricePerNight * n).toFixed(2)} (${n} night${n > 1 ? 's' : ''})`);
    }
  }

  $('#status-filter').on('change', render);

  $('#modify-close, #modify-cancel').on('click', () => $('#modify-modal').addClass('hidden'));

  $('#save-modify').on('click', async function () {
    const id = $('#modify-res-id').val();
    const ci = $('#modify-ci').val(), co = $('#modify-co').val();
    if (!ci || !co || new Date(co) <= new Date(ci)) {
      $('#modify-error').html('<div class="alert alert-danger">Invalid dates.</div>'); return;
    }
    $(this).prop('disabled', true).text('Saving…');
    try {
      await HMS.api('PUT', `/reservations/${id}`, { checkIn: ci, checkOut: co, notes: $('#modify-notes').val() });
      $('#modify-modal').addClass('hidden');
      HMS.toast('Reservation updated!', 'success');
      await loadReservations();
    } catch (err) {
      $('#modify-error').html(`<div class="alert alert-danger">${err.message}</div>`);
    } finally {
      $(this).prop('disabled', false).text('Save Changes');
    }
  });

  $('#cancel-close, #cancel-no').on('click', () => $('#cancel-modal').addClass('hidden'));

  $('#cancel-yes').on('click', async function () {
    const id = $('#cancel-res-id').val();
    $(this).prop('disabled', true);
    try {
      await HMS.api('POST', `/reservations/${id}/cancel`);
      $('#cancel-modal').addClass('hidden');
      HMS.toast('Reservation cancelled.', 'error');
      await loadReservations();
    } catch (err) {
      HMS.toast(err.message, 'error');
    } finally {
      $(this).prop('disabled', false);
    }
  });

  async function loadReservations() {
    try {
      const data = await HMS.api('GET', '/reservations');
      allReservations = data.map(r => HMS.normalizeReservation(r));
      render();
    } catch (err) {
      HMS.toast('Failed to load reservations: ' + err.message, 'error');
    }
  }

  loadReservations();
});
