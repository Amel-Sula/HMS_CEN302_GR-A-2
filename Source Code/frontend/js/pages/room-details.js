$(function () {
  const user = HMS.requireAuth('guest');
  if (!user) return;

  HMS.buildSidebar('rooms');
  $('#topbar-user').html(`<span>${user.name}</span><div class="topbar-avatar">👤</div><button class="logout-btn" onclick="HMS.logout()">⎋</button>`);

  const params  = new URLSearchParams(location.search);
  const roomId  = params.get('id');
  const ciParam = params.get('ci') || '';
  const coParam = params.get('co') || '';

  let room = null;
  let favs = JSON.parse(localStorage.getItem('hms_favs') || '[]');

  function render() {
    const isFav = favs.includes(room.id);
    $('#room-detail-content').html(`
      <div class="room-detail-layout">
        <div>
          <div class="room-detail-img">
            🏨
            <button class="fav-btn ${isFav ? 'active' : ''}" id="fav-btn">♥</button>
          </div>
        </div>
        <div class="room-detail-info">
          <div>${HMS.getStatusBadge(room.status)}</div>
          <h2>Room ${room.number} – ${room.name}</h2>
          <div class="room-detail-price">$${room.price}<span>/night</span></div>
          <p class="detail-desc">${room.desc}</p>
          <div class="amenities-list">
            ${room.amenities.map(a => `<span class="amenity-pill">✓ ${a}</span>`).join('')}
          </div>
          <div class="mb-3">
            <div style="display:flex;gap:20px;font-size:13px;color:#555;margin-bottom:12px;">
              <span><strong>Type:</strong> ${room.type}</span>
              <span><strong>Floor:</strong> ${room.floor}</span>
              <span><strong>Capacity:</strong> ${room.capacity} guest${room.capacity > 1 ? 's' : ''}</span>
            </div>
          </div>
          <div style="display:flex;gap:16px;margin-bottom:16px;align-items:flex-end;">
            <div>
              <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">Check-In</label>
              <input type="date" id="ci-input" class="form-control" style="width:160px;" value="${ciParam}" />
            </div>
            <div>
              <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">Check-Out</label>
              <input type="date" id="co-input" class="form-control" style="width:160px;" value="${coParam}" />
            </div>
          </div>
          <button class="btn btn-dark btn-full" id="book-btn" ${room.status !== 'available' ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
            ${room.status === 'available' ? 'Book This Room' : 'Room Unavailable'}
          </button>
          <div class="mt-4">
            <div class="accordion-item">
              <div class="accordion-header">Room Policies <span>∧</span></div>
              <div class="accordion-body">Check-in from 14:00, Check-out by 12:00. No smoking. Pets not allowed. Free cancellation up to 48 hours before check-in.</div>
            </div>
            <div class="accordion-item">
              <div class="accordion-header">What's Included <span>∨</span></div>
              <div class="accordion-body">Breakfast included. Free WiFi. Daily housekeeping. 24/7 front desk. Complimentary toiletries.</div>
            </div>
          </div>
        </div>
      </div>`);

    $('#fav-btn').on('click', function (e) {
      e.stopPropagation();
      if (favs.includes(room.id)) favs = favs.filter(f => f !== room.id);
      else favs.push(room.id);
      localStorage.setItem('hms_favs', JSON.stringify(favs));
      $(this).toggleClass('active');
    });

    $('.accordion-header').on('click', function () {
      $(this).next('.accordion-body').slideToggle(150);
    });

    $('#book-btn').on('click', function () {
      const ci = $('#ci-input').val(), co = $('#co-input').val();
      $('#book-ci').val(ci); $('#book-co').val(co);
      $('#book-summary').html(`<strong>Room ${room.number}</strong> – ${room.name}<br>$${room.price}/night`);
      updateBookPrice();
      $('#book-modal').removeClass('hidden');
    });
  }

  function updateBookPrice() {
    const ci = $('#book-ci').val(), co = $('#book-co').val();
    if (ci && co && new Date(co) > new Date(ci)) {
      const n = HMS.nights(ci, co);
      $('#book-price-preview').text(`Total: $${(room.price * n).toFixed(2)} (${n} night${n > 1 ? 's' : ''})`);
    } else {
      $('#book-price-preview').text('');
    }
  }

  $(document).on('change', '#book-ci, #book-co', updateBookPrice);

  $('#modal-close, #modal-cancel').on('click', () => $('#book-modal').addClass('hidden'));

  $('#confirm-book').on('click', async function () {
    const ci = $('#book-ci').val(), co = $('#book-co').val();
    if (!ci || !co) {
      $('#book-error').html('<div class="alert alert-danger">Please select check-in and check-out dates.</div>'); return;
    }
    if (new Date(co) <= new Date(ci)) {
      $('#book-error').html('<div class="alert alert-danger">Check-out must be after check-in.</div>'); return;
    }
    $(this).prop('disabled', true).text('Booking…');
    try {
      await HMS.api('POST', '/reservations', {
        roomId: room.id,
        checkIn: ci,
        checkOut: co,
        notes: $('#book-notes').val(),
      });
      $('#book-modal').addClass('hidden');
      HMS.toast('Booking confirmed! ✓', 'success');
      setTimeout(() => window.location.href = 'my-reservations.html', 1200);
    } catch (err) {
      $('#book-error').html(`<div class="alert alert-danger">${err.message}</div>`);
      $(this).prop('disabled', false).text('Confirm Booking');
    }
  });

  // Load room from API
  (async () => {
    if (!roomId) { $('#room-detail-content').html('<p>Room not found.</p>'); return; }
    try {
      const data = await HMS.api('GET', `/rooms/${roomId}`);
      room = HMS.normalizeRoom(data);
      render();
    } catch (err) {
      $('#room-detail-content').html(`<p>Could not load room: ${err.message}</p>`);
    }
  })();
});
