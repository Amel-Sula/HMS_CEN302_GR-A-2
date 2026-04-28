$(function() {
  const user = HMS.requireAuth('admin');
  if (!user) return;
  HMS.buildSidebar('dashboard');
  $('#topbar-user').html(`<span>${user.name}</span><div class="topbar-avatar">👤</div><button class="logout-btn" onclick="HMS.logout()">⎋</button>`);

  function updateStats() {
    const total = HMS.rooms.length;
    const occupied = HMS.rooms.filter(r => r.status === 'occupied').length;
    const bookings = HMS.reservations.length;
    const revenue = HMS.reservations.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.totalPrice, 0);
    $('#stat-total-rooms').text(total);
    $('#stat-occupancy').text(Math.round(occupied / total * 100) + '%');
    $('#stat-bookings').text(bookings);
    $('#stat-revenue').text('$' + revenue.toLocaleString());
  }

  function renderOverview() {
    // Status chart
    const statuses = ['confirmed','checked-in','completed','cancelled'];
    const counts = statuses.map(s => HMS.reservations.filter(r => r.status === s).length);
    const max = Math.max(...counts) || 1;
    const colors = { confirmed: '#3b82f6', 'checked-in': '#22c55e', completed: '#6b7280', cancelled: '#ef4444' };
    $('#status-chart').html(statuses.map((s, i) => `
      <div class="chart-bar-row">
        <div class="chart-label">${s}</div>
        <div class="chart-bar-wrap">
          <div class="chart-bar" style="width:${counts[i]/max*100}%;background:${colors[s]||'#111'};"></div>
        </div>
        <div class="chart-value">${counts[i]}</div>
      </div>`).join(''));

    // Recent reservations
    $('#recent-res-tbody').html(HMS.reservations.slice(-5).reverse().map(r => `
      <tr><td><strong>${r.id}</strong></td><td>${r.guestName}</td><td>Room ${r.roomNumber}</td><td>${HMS.getStatusBadge(r.status)}</td></tr>`).join(''));

    // Room status grid
    $('#room-status-grid').html(HMS.rooms.map(r => {
      const bg = r.status === 'available' ? '#d4f5d4' : r.status === 'occupied' ? '#ffe0e0' : '#fef3c7';
      const fg = r.status === 'available' ? '#1a7a1a' : r.status === 'occupied' ? '#c53030' : '#92400e';
      return `<div style="background:${bg};color:${fg};border-radius:8px;padding:10px 14px;font-size:13px;min-width:90px;text-align:center;">
        <div style="font-weight:700;">Room ${r.number}</div>
        <div style="font-size:11px;margin-top:2px;text-transform:uppercase;letter-spacing:0.04em;">${r.status}</div>
      </div>`;
    }).join(''));
  }

  function renderRooms() {
    let rooms = HMS.rooms;
    const tf = $('#room-type-filter').val(), sf = $('#room-status-filter').val();
    if (tf) rooms = rooms.filter(r => r.type === tf);
    if (sf) rooms = rooms.filter(r => r.status === sf);
    $('#rooms-tbody').html(rooms.map(r => `
      <tr>
        <td><strong>${r.number}</strong></td><td>${r.name}</td><td>${r.type}</td><td>${r.floor}</td>
        <td>${r.capacity}</td><td>$${r.price}</td><td>${HMS.getStatusBadge(r.status)}</td>
        <td><button class="btn btn-sm btn-outline edit-room" data-id="${r.id}">Edit</button>
        <button class="btn btn-sm btn-outline toggle-status" data-id="${r.id}" style="margin-left:4px;">Toggle</button></td>
      </tr>`).join(''));

    $('.edit-room').on('click', function() {
      const r = HMS.getRoom($(this).data('id'));
      if (!r) return;
      $('#room-modal-title').text('Edit Room');
      $('#edit-room-id').val(r.id);
      $('#room-num').val(r.number); $('#room-floor').val(r.floor);
      $('#room-type').val(r.type); $('#room-cap').val(r.capacity);
      $('#room-name').val(r.name); $('#room-price').val(r.price);
      $('#room-desc').val(r.desc); $('#room-status').val(r.status);
      $('#add-room-modal').removeClass('hidden');
    });
    $('.toggle-status').on('click', function() {
      const r = HMS.getRoom($(this).data('id'));
      if (!r) return;
      if (r.status === 'available') r.status = 'maintenance';
      else if (r.status === 'maintenance') r.status = 'available';
      else { HMS.toast('Cannot toggle occupied room.', 'error'); return; }
      HMS.toast(`Room ${r.number} set to ${r.status}.`);
      renderRooms(); updateStats();
    });
  }

  function renderStaff() {
    const staff = HMS.users.filter(u => u.role !== 'guest');
    $('#staff-tbody').html(staff.map(u => `
      <tr>
        <td>${u.name}</td><td>${u.email}</td>
        <td><span class="badge ${u.role === 'admin' ? 'badge-blue' : 'badge-gray'}">${u.role}</span></td>
        <td><button class="btn btn-sm btn-danger remove-staff" data-id="${u.id}">Remove</button></td>
      </tr>`).join(''));
    $('.remove-staff').on('click', function() {
      const id = parseInt($(this).data('id'));
      if (id === user.id) { HMS.toast('Cannot remove yourself.', 'error'); return; }
      const idx = HMS.users.findIndex(u => u.id === id);
      if (idx !== -1) HMS.users.splice(idx, 1);
      renderStaff();
      HMS.toast('Staff account removed.');
    });
  }

  function renderPricing() {
    $('#pricing-tbody').html(HMS.rooms.map(r => `
      <tr>
        <td>Room ${r.number}</td><td>${r.type}</td><td>$${r.price}</td>
        <td><input type="number" class="form-control price-input" data-id="${r.id}" value="${r.price}" style="width:90px;" /></td>
        <td><button class="btn btn-sm btn-dark apply-price" data-id="${r.id}">Apply</button></td>
      </tr>`).join(''));

    $('.apply-price').on('click', function() {
      const id = parseInt($(this).data('id'));
      const newPrice = parseInt($(`.price-input[data-id="${id}"]`).val());
      if (!newPrice || newPrice < 1) { HMS.toast('Invalid price.', 'error'); return; }
      const r = HMS.getRoom(id);
      if (r) r.price = newPrice;
      HMS.toast('Price updated!', 'success');
      renderPricing();
    });

    // Demand suggestions
    const avgOccupancy = HMS.rooms.filter(r => r.status === 'occupied').length / HMS.rooms.length;
    const suggestions = avgOccupancy > 0.7
      ? [{ type: 'Suite', action: 'Increase', pct: 15, reason: 'High demand — occupancy above 70%' }]
      : [{ type: 'Double', action: 'Decrease', pct: 10, reason: 'Low occupancy — attract more bookings' }];
    $('#pricing-suggestions').html(suggestions.map(s => `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:#f9f9f9;border-radius:6px;font-size:13.5px;">
        <span class="badge ${s.action === 'Increase' ? 'badge-green' : 'badge-yellow'}">${s.action} ${s.pct}%</span>
        <span>${s.type} rooms — ${s.reason}</span>
      </div>`).join(''));
  }

  function renderReports() {
    const types = ['Single','Double','Suite'];
    const revenue = types.map(t => {
      const roomIds = HMS.rooms.filter(r => r.type === t).map(r => r.id);
      return HMS.reservations.filter(r => roomIds.includes(r.roomId) && r.status === 'completed').reduce((s, r) => s + r.totalPrice, 0);
    });
    const maxRev = Math.max(...revenue) || 1;
    $('#revenue-chart').html(types.map((t, i) => `
      <div class="chart-bar-row">
        <div class="chart-label">${t}</div>
        <div class="chart-bar-wrap"><div class="chart-bar" style="width:${revenue[i]/maxRev*100}%"></div></div>
        <div class="chart-value">$${revenue[i]}</div>
      </div>`).join(''));

    const guests = HMS.users.filter(u => u.role === 'guest');
    const topGuests = guests.map(g => ({
      name: g.name,
      bookings: HMS.reservations.filter(r => r.guestId === g.id).length,
      spent: HMS.reservations.filter(r => r.guestId === g.id && r.status !== 'cancelled').reduce((s, r) => s + r.totalPrice, 0)
    })).sort((a, b) => b.spent - a.spent).slice(0, 5);
    $('#guest-analytics').html(`
      <p class="text-sm text-muted mb-2">Top guests by spend</p>
      ${topGuests.map(g => `
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f0f0;font-size:13.5px;">
          <span>${g.name}</span>
          <span style="color:#888;">${g.bookings} booking${g.bookings !== 1 ? 's' : ''} · <strong>$${g.spent}</strong></span>
        </div>`).join('')}
    `);

    $('#report-tbody').html(HMS.reservations.map(r => `
      <tr>
        <td><strong>${r.id}</strong></td><td>${r.guestName}</td><td>Room ${r.roomNumber}</td>
        <td>${HMS.formatDate(r.checkIn)}</td><td>${HMS.formatDate(r.checkOut)}</td>
        <td>${HMS.getStatusBadge(r.status)}</td>
        <td>${r.status !== 'cancelled' ? '$' + r.totalPrice : '—'}</td>
      </tr>`).join(''));
  }

  // Tabs
  $('.tab-btn').on('click', function() {
    $('.tab-btn').removeClass('active');
    $(this).addClass('active');
    const tab = $(this).data('tab');
    $('#tab-overview, #tab-rooms, #tab-staff, #tab-pricing, #tab-reports').addClass('hidden');
    $('#tab-' + tab).removeClass('hidden');
    if (tab === 'rooms') renderRooms();
    if (tab === 'staff') renderStaff();
    if (tab === 'pricing') renderPricing();
    if (tab === 'reports') renderReports();
  });

  $('#room-type-filter, #room-status-filter').on('change', renderRooms);

  // Add/Edit Room modal
  $('#add-room-btn').on('click', () => {
    $('#room-modal-title').text('Add Room'); $('#edit-room-id').val('');
    $('#room-num, #room-name, #room-desc').val(''); $('#room-floor, #room-cap, #room-price').val('');
    $('#add-room-modal').removeClass('hidden');
  });
  $('#room-modal-close, #room-modal-cancel').on('click', () => $('#add-room-modal').addClass('hidden'));
  $('#save-room').on('click', function() {
    const num = $('#room-num').val().trim(), name = $('#room-name').val().trim(), price = parseInt($('#room-price').val());
    if (!num || !name || !price) { $('#room-modal-err').html('<div class="alert alert-danger">Fill required fields.</div>'); return; }
    const existingId = parseInt($('#edit-room-id').val());
    if (existingId) {
      const r = HMS.getRoom(existingId);
      if (r) { r.number = num; r.name = name; r.type = $('#room-type').val(); r.floor = parseInt($('#room-floor').val()) || 1; r.capacity = parseInt($('#room-cap').val()) || 1; r.price = price; r.desc = $('#room-desc').val(); r.status = $('#room-status').val(); }
    } else {
      HMS.rooms.push({ id: HMS.rooms.length + 1, number: num, name, type: $('#room-type').val(), floor: parseInt($('#room-floor').val()) || 1, capacity: parseInt($('#room-cap').val()) || 1, price, status: $('#room-status').val() || 'available', desc: $('#room-desc').val(), amenities: [] });
    }
    $('#add-room-modal').addClass('hidden');
    HMS.toast('Room saved!', 'success');
    renderRooms(); updateStats();
  });

  // Add Staff modal
  $('#add-staff-btn').on('click', () => $('#add-staff-modal').removeClass('hidden'));
  $('#staff-modal-close, #staff-modal-cancel').on('click', () => $('#add-staff-modal').addClass('hidden'));
  $('#save-staff').on('click', function() {
    const name = $('#staff-name').val().trim(), email = $('#staff-email').val().trim(), pw = $('#staff-pw').val(), role = $('#staff-role').val();
    if (!name || !email || !pw) { $('#staff-modal-err').html('<div class="alert alert-danger">Fill all fields.</div>'); return; }
    if (HMS.users.find(u => u.email === email)) { $('#staff-modal-err').html('<div class="alert alert-danger">Email already in use.</div>'); return; }
    HMS.users.push({ id: HMS.users.length + 1, name, email, password: pw, role });
    HMS.saveUsers();
    $('#add-staff-modal').addClass('hidden');
    HMS.toast('Staff account created!', 'success');
    renderStaff();
  });

  updateStats();
  renderOverview();
});
