$(function () {
  const user = HMS.requireAuth('admin');
  if (!user) return;

  HMS.buildSidebar('dashboard');
  $('#topbar-user').html(`<span>${user.name}</span><div class="topbar-avatar">👤</div><button class="logout-btn" onclick="HMS.logout()">⎋</button>`);

  let allRooms        = [];
  let allReservations = [];
  let roomTypes       = [];
  let dashboard       = {};

  // ── STATS ─────────────────────────────────────────────────
  function updateStats() {
    $('#stat-total-rooms').text(dashboard.totalRooms || 0);
    const occ = dashboard.totalRooms > 0
      ? Math.round((dashboard.occupiedRooms / dashboard.totalRooms) * 100) : 0;
    $('#stat-occupancy').text(occ + '%');
    $('#stat-bookings').text(dashboard.totalBookings || 0);
    $('#stat-revenue').text('$' + parseFloat(dashboard.monthRevenue || 0).toLocaleString());
  }

  // ── OVERVIEW TAB ─────────────────────────────────────────
  function renderOverview() {
    const counts   = dashboard.statusCounts || {};
    const statuses = ['confirmed', 'checked-in', 'completed', 'cancelled'];
    const vals     = statuses.map(s => counts[s] || 0);
    const max      = Math.max(...vals) || 1;
    const colors   = { confirmed: '#3b82f6', 'checked-in': '#22c55e', completed: '#6b7280', cancelled: '#ef4444' };

    $('#status-chart').html(statuses.map((s, i) => `
      <div class="chart-bar-row">
        <div class="chart-label">${s}</div>
        <div class="chart-bar-wrap">
          <div class="chart-bar" style="width:${vals[i]/max*100}%;background:${colors[s]};"></div>
        </div>
        <div class="chart-value">${vals[i]}</div>
      </div>`).join(''));

    $('#recent-res-tbody').html(allReservations.slice(0, 5).map(r => `
      <tr>
        <td><strong>#${r.id}</strong></td>
        <td>${r.guestName}</td>
        <td>Room ${r.roomNumber}</td>
        <td>${HMS.getStatusBadge(r.status)}</td>
      </tr>`).join(''));

    $('#room-status-grid').html(allRooms.map(r => {
      const bg = r.status === 'available' ? '#d4f5d4' : r.status === 'occupied' ? '#ffe0e0' : '#fef3c7';
      const fg = r.status === 'available' ? '#1a7a1a' : r.status === 'occupied' ? '#c53030' : '#92400e';
      return `<div style="background:${bg};color:${fg};border-radius:8px;padding:10px 14px;font-size:13px;min-width:90px;text-align:center;">
        <div style="font-weight:700;">Room ${r.number}</div>
        <div style="font-size:11px;margin-top:2px;text-transform:uppercase;letter-spacing:0.04em;">${r.status}</div>
      </div>`;
    }).join(''));
  }

  // ── ROOMS TAB ─────────────────────────────────────────────
  function renderRooms() {
    let rooms = allRooms;
    const tf = $('#room-type-filter').val(), sf = $('#room-status-filter').val();
    if (tf) rooms = rooms.filter(r => r.type === tf);
    if (sf) rooms = rooms.filter(r => r.status === sf);

    $('#rooms-tbody').html(rooms.map(r => `
      <tr>
        <td><strong>${r.number}</strong></td>
        <td>${r.name}</td>
        <td>${r.type}</td>
        <td>${r.floor}</td>
        <td>${r.capacity}</td>
        <td>$${r.price}</td>
        <td>${HMS.getStatusBadge(r.status)}</td>
        <td>
          <button class="btn btn-sm btn-outline edit-room" data-id="${r.id}">Edit</button>
          <button class="btn btn-sm btn-outline toggle-status" data-id="${r.id}" style="margin-left:4px;">Toggle</button>
        </td>
      </tr>`).join(''));

    $('.edit-room').on('click', function () {
      const r = allRooms.find(x => x.id == $(this).data('id'));
      if (!r) return;
      $('#room-modal-title').text('Edit Room');
      $('#edit-room-id').val(r.id);
      $('#room-num').val(r.number);
      $('#room-floor').val(r.floor);
      $('#room-cap').val(r.capacity);
      $('#room-name').val(r.name);
      $('#room-price').val(r.price);
      $('#room-desc').val(r.desc);
      $('#room-status').val(r.status);
      // Set type dropdown to matching type
      $('#room-type option').filter(function() { return $(this).text() === r.type || $(this).val() == r.typeId; }).prop('selected', true);
      $('#add-room-modal').removeClass('hidden');
    });

    $('.toggle-status').on('click', async function () {
      const r = allRooms.find(x => x.id == $(this).data('id'));
      if (!r) return;
      if (r.status === 'occupied') { HMS.toast('Cannot toggle occupied room.', 'error'); return; }
      const newStatus = r.status === 'available' ? 'maintenance' : 'available';
      try {
        await HMS.api('PATCH', `/rooms/${r.id}/status`, { status: newStatus });
        HMS.toast(`Room ${r.number} set to ${newStatus}.`);
        await reloadRooms();
        renderRooms();
        updateStats();
      } catch (err) {
        HMS.toast(err.message, 'error');
      }
    });
  }

  // ── STAFF TAB ─────────────────────────────────────────────
  async function renderStaff() {
    try {
      const staff = await HMS.api('GET', '/admin/staff');
      $('#staff-tbody').html(staff.map(u => `
        <tr>
          <td>${u.name}</td>
          <td>${u.email}</td>
          <td><span class="badge ${u.role === 'admin' ? 'badge-blue' : 'badge-gray'}">${u.role}</span></td>
          <td><button class="btn btn-sm btn-danger remove-staff" data-id="${u.id}" data-role="${u.role}">Remove</button></td>
        </tr>`).join(''));

      $('.remove-staff').on('click', async function () {
        const id   = $(this).data('id');
        const role = $(this).data('role');
        if (id == user.id) { HMS.toast('Cannot remove yourself.', 'error'); return; }
        try {
          await HMS.api('DELETE', `/admin/staff/${role}/${id}`);
          HMS.toast('Staff account removed.');
          renderStaff();
        } catch (err) {
          HMS.toast(err.message, 'error');
        }
      });
    } catch (err) {
      HMS.toast('Failed to load staff: ' + err.message, 'error');
    }
  }

  // ── PRICING TAB ──────────────────────────────────────────
  function renderPricing() {
    $('#pricing-tbody').html(allRooms.map(r => `
      <tr>
        <td>Room ${r.number}</td>
        <td>${r.type}</td>
        <td>$${r.price}</td>
        <td><input type="number" class="form-control price-input" data-id="${r.id}" value="${r.price}" style="width:90px;" /></td>
        <td><button class="btn btn-sm btn-dark apply-price" data-id="${r.id}">Apply</button></td>
      </tr>`).join(''));

    $('.apply-price').on('click', async function () {
      const id       = $(this).data('id');
      const newPrice = parseFloat($(`.price-input[data-id="${id}"]`).val());
      if (!newPrice || newPrice < 1) { HMS.toast('Invalid price.', 'error'); return; }
      try {
        await HMS.api('PUT', `/rooms/${id}`, { price: newPrice });
        HMS.toast('Price updated!', 'success');
        await reloadRooms();
        renderPricing();
      } catch (err) {
        HMS.toast(err.message, 'error');
      }
    });

    const occ = allRooms.filter(r => r.status === 'occupied').length / (allRooms.length || 1);
    const suggestions = occ > 0.7
      ? [{ type: 'Suite',  action: 'Increase', pct: 15, reason: 'High demand — occupancy above 70%' }]
      : [{ type: 'Double', action: 'Decrease', pct: 10, reason: 'Low occupancy — attract more bookings' }];
    $('#pricing-suggestions').html(suggestions.map(s => `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:#f9f9f9;border-radius:6px;font-size:13.5px;">
        <span class="badge ${s.action === 'Increase' ? 'badge-green' : 'badge-yellow'}">${s.action} ${s.pct}%</span>
        <span>${s.type} rooms — ${s.reason}</span>
      </div>`).join(''));
  }

  // ── REPORTS TAB ──────────────────────────────────────────
  async function renderReports() {
    try {
      const [revenueData, guestsData] = await Promise.all([
        HMS.api('GET', '/admin/reports/revenue'),
        HMS.api('GET', '/admin/reports/guests'),
      ]);

      // Revenue bar chart
      const types   = Object.keys(revenueData);
      const values  = types.map(t => parseFloat(revenueData[t].revenue));
      const maxRev  = Math.max(...values) || 1;
      $('#revenue-chart').html(types.map((t, i) => `
        <div class="chart-bar-row">
          <div class="chart-label">${t}</div>
          <div class="chart-bar-wrap"><div class="chart-bar" style="width:${values[i]/maxRev*100}%"></div></div>
          <div class="chart-value">$${values[i].toFixed(0)} (${revenueData[t].bookings} bookings)</div>
        </div>`).join(''));

      // Top guests
      const top5 = guestsData.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
      $('#guest-analytics').html(`
        <p class="text-sm text-muted mb-2">Top guests by spend</p>
        ${top5.map(g => `
          <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f0f0;font-size:13.5px;">
            <span>${g.name}</span>
            <span style="color:#888;">${g.totalReservations} booking${g.totalReservations !== 1 ? 's' : ''} · <strong>$${parseFloat(g.totalSpent).toFixed(2)}</strong></span>
          </div>`).join('')}`);

      // Full reservation table
      $('#report-tbody').html(allReservations.map(r => `
        <tr>
          <td><strong>#${r.id}</strong></td>
          <td>${r.guestName}</td>
          <td>Room ${r.roomNumber}</td>
          <td>${HMS.formatDate(r.checkIn)}</td>
          <td>${HMS.formatDate(r.checkOut)}</td>
          <td>${HMS.getStatusBadge(r.status)}</td>
          <td>${r.status !== 'cancelled' ? '$' + r.totalPrice.toFixed(2) : '—'}</td>
        </tr>`).join(''));
    } catch (err) {
      HMS.toast('Failed to load reports: ' + err.message, 'error');
    }
  }

  // ── TABS ──────────────────────────────────────────────────
  $('.tab-btn').on('click', function () {
    $('.tab-btn').removeClass('active');
    $(this).addClass('active');
    const tab = $(this).data('tab');
    $('#tab-overview, #tab-rooms, #tab-staff, #tab-pricing, #tab-reports').addClass('hidden');
    $('#tab-' + tab).removeClass('hidden');
    if (tab === 'rooms')    renderRooms();
    if (tab === 'staff')    renderStaff();
    if (tab === 'pricing')  renderPricing();
    if (tab === 'reports')  renderReports();
  });

  $('#room-type-filter, #room-status-filter').on('change', renderRooms);

  // ── ADD/EDIT ROOM MODAL ───────────────────────────────────
  function populateRoomTypeDropdown() {
    $('#room-type').html(roomTypes.map(rt =>
      `<option value="${rt.Type_ID}">${rt.Category_Name}</option>`
    ).join(''));
  }

  $('#add-room-btn').on('click', () => {
    $('#room-modal-title').text('Add Room');
    $('#edit-room-id').val('');
    $('#room-num, #room-name, #room-desc').val('');
    $('#room-floor, #room-cap, #room-price').val('');
    $('#room-status').val('available');
    populateRoomTypeDropdown();
    $('#add-room-modal').removeClass('hidden');
  });

  $('#room-modal-close, #room-modal-cancel').on('click', () => $('#add-room-modal').addClass('hidden'));

  $('#save-room').on('click', async function () {
    const num    = $('#room-num').val().trim();
    const price  = parseFloat($('#room-price').val());
    const typeId = parseInt($('#room-type').val());
    if (!num || !price || !typeId) {
      $('#room-modal-err').html('<div class="alert alert-danger">Fill required fields.</div>'); return;
    }
    const body = {
      Room_Number: num,
      Floor:  parseInt($('#room-floor').val()) || 1,
      Status: $('#room-status').val() || 'available',
      Type_ID: typeId,
      price,
    };
    const existingId = $('#edit-room-id').val();
    $(this).prop('disabled', true).text('Saving…');
    try {
      if (existingId) {
        await HMS.api('PUT', `/rooms/${existingId}`, body);
      } else {
        await HMS.api('POST', '/rooms', body);
      }
      $('#add-room-modal').addClass('hidden');
      HMS.toast('Room saved!', 'success');
      await reloadRooms();
      renderRooms();
      updateStats();
    } catch (err) {
      $('#room-modal-err').html(`<div class="alert alert-danger">${err.message}</div>`);
    } finally {
      $(this).prop('disabled', false).text('Save Room');
    }
  });

  // ── ADD STAFF MODAL ───────────────────────────────────────
  $('#add-staff-btn').on('click', () => {
    $('#staff-name, #staff-email, #staff-pw').val('');
    $('#staff-modal-err').html('');
    $('#add-staff-modal').removeClass('hidden');
  });
  $('#staff-modal-close, #staff-modal-cancel').on('click', () => $('#add-staff-modal').addClass('hidden'));

  $('#save-staff').on('click', async function () {
    const name  = $('#staff-name').val().trim();
    const email = $('#staff-email').val().trim();
    const pw    = $('#staff-pw').val();
    const role  = $('#staff-role').val();
    if (!name || !email || !pw) {
      $('#staff-modal-err').html('<div class="alert alert-danger">Fill all fields.</div>'); return;
    }
    $(this).prop('disabled', true).text('Saving…');
    try {
      await HMS.api('POST', '/admin/staff', { name, email, password: pw, role });
      $('#add-staff-modal').addClass('hidden');
      HMS.toast('Staff account created!', 'success');
      renderStaff();
    } catch (err) {
      $('#staff-modal-err').html(`<div class="alert alert-danger">${err.message}</div>`);
    } finally {
      $(this).prop('disabled', false).text('Create Account');
    }
  });

  // ── LOAD HELPERS ─────────────────────────────────────────
  async function reloadRooms() {
    const data = await HMS.api('GET', '/rooms');
    allRooms = data.map(r => HMS.normalizeRoom(r));
  }

  async function init() {
    try {
      const [dash, resData, roomData, rtData] = await Promise.all([
        HMS.api('GET', '/admin/dashboard'),
        HMS.api('GET', '/reservations'),
        HMS.api('GET', '/rooms'),
        HMS.api('GET', '/rooms/types/all'),
      ]);
      dashboard       = dash;
      allReservations = resData.map(r => HMS.normalizeReservation(r));
      allRooms        = roomData.map(r => HMS.normalizeRoom(r));
      roomTypes       = rtData;
      updateStats();
      renderOverview();
    } catch (err) {
      HMS.toast('Failed to load dashboard: ' + err.message, 'error');
    }
  }

  init();
});
