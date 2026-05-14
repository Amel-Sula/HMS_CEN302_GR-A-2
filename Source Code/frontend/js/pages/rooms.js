$(function() {
  const user = HMS.requireAuth('guest');
  if (!user) return;

  HMS.buildSidebar('rooms');
  $('#welcome-msg').text('Welcome ' + user.name);
  $('#topbar-user').html(`<span>${user.name}</span><div class="topbar-avatar">👤</div><button class="logout-btn" onclick="HMS.logout()">⎋</button>`);

  let checkIn = '', checkOut = '', typeFilter = '';

  function renderRooms() {
    let rooms = HMS.rooms;
    if (typeFilter) rooms = rooms.filter(r => r.type === typeFilter);

    // If dates set, only show available
    if (checkIn && checkOut) {
      const ci = new Date(checkIn), co = new Date(checkOut);
      rooms = rooms.filter(r => {
        if (r.status !== 'available') return false;
        // Check no confirmed/checked-in reservation overlaps
        const booked = HMS.reservations.some(res => {
          if (res.roomId !== r.id) return false;
          if (['cancelled','completed'].includes(res.status)) return false;
          return new Date(res.checkIn) < co && new Date(res.checkOut) > ci;
        });
        return !booked;
      });
    }

    if (!rooms.length) {
      $('#rooms-grid').html('<div class="empty-state"><div class="empty-icon">🏨</div><h4>No rooms found</h4><p>Try adjusting your search criteria.</p></div>');
      return;
    }

    $('#rooms-grid').html(rooms.map(r => `
      <div class="room-card" data-id="${r.id}">
        <div class="room-img">${r.img ? `<img src="${r.img}">` : '🏨'}</div>
        <div class="room-info">
          ${HMS.getStatusBadge(r.status)}
          <div class="room-name">Room ${r.number} – ${r.name}</div>
          <div class="room-desc">${r.desc}</div>
          <div class="room-price">$${r.price} / night · ${r.type} · Up to ${r.capacity} guest${r.capacity > 1 ? 's' : ''}</div>
        </div>
      </div>
    `).join(''));

    $('.room-card').on('click', function() {
      const id = $(this).data('id');
      const ci = getCI(), co = getCO();
      let url = `room-details.html?id=${id}`;
      if (ci) url += `&ci=${ci}`;
      if (co) url += `&co=${co}`;
      window.location.href = url;
    });
  }

  function getCI() {
    const dd = $('#ci-dd').val(), mm = $('#ci-mm').val(), yyyy = $('#ci-yyyy').val();
    if (dd && mm && yyyy && yyyy.length === 4) return `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
    return '';
  }
  function getCO() {
    const dd = $('#co-dd').val(), mm = $('#co-mm').val(), yyyy = $('#co-yyyy').val();
    if (dd && mm && yyyy && yyyy.length === 4) return `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
    return '';
  }

  $('#search-btn').on('click', function() {
    checkIn = getCI(); checkOut = getCO();
    typeFilter = $('#filter-type').val();
    renderRooms();
  });

  renderRooms();
});
