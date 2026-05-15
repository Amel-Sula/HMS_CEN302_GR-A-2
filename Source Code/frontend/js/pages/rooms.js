$(function () {
  const user = HMS.requireAuth('guest');
  if (!user) return;

  HMS.buildSidebar('rooms');
  $('#welcome-msg').text('Welcome ' + user.name);
  $('#topbar-user').html(`<span>${user.name}</span><div class="topbar-avatar">👤</div><button class="logout-btn" onclick="HMS.logout()">⎋</button>`);

  let allRooms = [];
  let checkIn = '', checkOut = '', typeFilter = '';

  function getCI() {
    const dd=$('#ci-dd').val(), mm=$('#ci-mm').val(), yyyy=$('#ci-yyyy').val();
    if (dd && mm && yyyy && yyyy.length === 4) return `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
    return '';
  }
  function getCO() {
    const dd=$('#co-dd').val(), mm=$('#co-mm').val(), yyyy=$('#co-yyyy').val();
    if (dd && mm && yyyy && yyyy.length === 4) return `${yyyy}-${mm.padStart(2,'0')}-${dd.padStart(2,'0')}`;
    return '';
  }

  function renderRooms(rooms) {
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
      </div>`).join(''));

    $('.room-card').on('click', function () {
      const id = $(this).data('id');
      let url = `room-details.html?id=${id}`;
      if (checkIn) url += `&ci=${checkIn}`;
      if (checkOut) url += `&co=${checkOut}`;
      window.location.href = url;
    });
  }

  async function loadRooms() {
    $('#rooms-grid').html('<div class="empty-state"><p>Loading rooms…</p></div>');
    try {
      if (checkIn && checkOut) {
        let path = `/rooms/available?checkIn=${checkIn}&checkOut=${checkOut}`;
        if (typeFilter) path += `&type=${encodeURIComponent(typeFilter)}`;
        const data = await HMS.api('GET', path);
        renderRooms(data.map(r => HMS.normalizeRoom(r)));
      } else {
        if (!allRooms.length) {
          const data = await HMS.api('GET', '/rooms');
          allRooms = data.map(r => HMS.normalizeRoom(r));
        }
        let rooms = allRooms;
        if (typeFilter) rooms = rooms.filter(r => r.type === typeFilter);
        renderRooms(rooms);
      }
    } catch (err) {
      HMS.toast('Failed to load rooms: ' + err.message, 'error');
    }
  }

  $('#search-btn').on('click', function () {
    checkIn = getCI(); checkOut = getCO();
    typeFilter = $('#filter-type').val();
    loadRooms();
  });

  loadRooms();
});
