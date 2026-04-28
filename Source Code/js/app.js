// ============================================================
// HMS – Shared App State, Mock Data & Utilities
// ============================================================

// ── MOCK DATA ────────────────────────────────────────────────
// Default mock data (used only on first load)
const MOCK_RESERVATIONS = [
  { id: 'R001', guestId: 2, guestName: 'John Doe', roomId: 3, roomNumber: '201', checkIn: '2026-04-28', checkOut: '2026-05-02', status: 'confirmed', totalPrice: 396, createdAt: '2026-04-20', notes: '' },
  { id: 'R002', guestId: 2, guestName: 'John Doe', roomId: 1, roomNumber: '101', checkIn: '2026-03-10', checkOut: '2026-03-12', status: 'completed', totalPrice: 118, createdAt: '2026-03-05', notes: 'Early check-in requested.' },
  { id: 'R003', guestId: 3, guestName: 'Alice Smith', roomId: 6, roomNumber: '301', checkIn: '2026-05-01', checkOut: '2026-05-05', status: 'confirmed', totalPrice: 756, createdAt: '2026-04-22', notes: '' },
  { id: 'R004', guestId: 4, guestName: 'Bob Johnson', roomId: 2, roomNumber: '102', checkIn: '2026-04-27', checkOut: '2026-04-29', status: 'checked-in', totalPrice: 118, createdAt: '2026-04-25', notes: '' },
  { id: 'R005', guestId: 5, guestName: 'Maria Garcia', roomId: 5, roomNumber: '203', checkIn: '2026-04-25', checkOut: '2026-04-30', status: 'checked-in', totalPrice: 595, createdAt: '2026-04-20', notes: 'Sea view preference.' },
  { id: 'R006', guestId: 6, guestName: 'Wei Chen', roomId: 4, roomNumber: '202', checkIn: '2026-03-20', checkOut: '2026-03-22', status: 'cancelled', totalPrice: 198, createdAt: '2026-03-18', notes: '' },
  { id: 'R007', guestId: 7, guestName: 'Sara Lee', roomId: 9, roomNumber: '204', checkIn: '2026-05-10', checkOut: '2026-05-14', status: 'confirmed', totalPrice: 356, createdAt: '2026-04-26', notes: '' },
];

// Initialize data from localStorage or defaults
function loadData() {
  let reservations, users;

  try {
    reservations = JSON.parse(localStorage.getItem('hms_reservations'));
  } catch (e) {}
  if (!reservations) {
    reservations = MOCK_RESERVATIONS.slice();
    localStorage.setItem('hms_reservations', JSON.stringify(reservations));
  }

  try {
    users = JSON.parse(localStorage.getItem('hms_users'));
  } catch (e) {}
  if (!users) {
    users = [
      { id: 1, name: 'Admin User', email: 'admin@hotel.com', password: 'admin123', role: 'admin' },
      { id: 2, name: 'John Doe', email: 'john@example.com', password: 'guest123', role: 'guest' },
      { id: 3, name: 'Alice Smith', email: 'alice@example.com', password: 'guest123', role: 'guest' },
      { id: 4, name: 'Bob Johnson', email: 'bob@example.com', password: 'guest123', role: 'guest' },
      { id: 5, name: 'Maria Garcia', email: 'maria@example.com', password: 'guest123', role: 'guest' },
      { id: 6, name: 'Wei Chen', email: 'wei@example.com', password: 'guest123', role: 'guest' },
      { id: 7, name: 'Sara Lee', email: 'sara@example.com', password: 'guest123', role: 'guest' },
      { id: 8, name: 'Jane Receptionist', email: 'receptionist@hotel.com', password: 'rec123', role: 'receptionist' },
    ];
    localStorage.setItem('hms_users', JSON.stringify(users));
  }

  return { reservations, users };
}

const DATA = loadData();

const HMS = {

  rooms: [
    { id: 1, number: '101', type: 'Single', name: 'Standard Single', price: 59, capacity: 1, status: 'available', floor: 1, amenities: ['WiFi', 'TV', 'AC', 'Mini Bar'], desc: 'A cozy single room with all the essentials for a comfortable stay. Perfect for solo travellers.', img: null },
    { id: 2, number: '102', type: 'Single', name: 'Standard Single', price: 59, capacity: 1, status: 'occupied', floor: 1, amenities: ['WiFi', 'TV', 'AC'], desc: 'Comfortable single room on the first floor with garden view.', img: null },
    { id: 3, number: '201', type: 'Double', name: 'Deluxe Double', price: 99, capacity: 2, status: 'available', floor: 2, amenities: ['WiFi', 'TV', 'AC', 'Balcony', 'Mini Bar'], desc: 'Spacious double room with a private balcony and stunning city views.', img: null },
    { id: 4, number: '202', type: 'Double', name: 'Deluxe Double', price: 99, capacity: 2, status: 'available', floor: 2, amenities: ['WiFi', 'TV', 'AC', 'Balcony'], desc: 'Elegant room for couples with premium bedding and modern furnishings.', img: null },
    { id: 5, number: '203', type: 'Double', name: 'Double Sea View', price: 119, capacity: 2, status: 'occupied', floor: 2, amenities: ['WiFi', 'TV', 'AC', 'Sea View', 'Balcony'], desc: 'Beautiful sea view double room. Wake up to stunning ocean panoramas.', img: null },
    { id: 6, number: '301', type: 'Suite', name: 'Junior Suite', price: 189, capacity: 3, status: 'available', floor: 3, amenities: ['WiFi', 'TV', 'AC', 'Jacuzzi', 'Balcony', 'Living Room'], desc: 'Luxurious junior suite with separate living area, jacuzzi, and panoramic city views.', img: null },
    { id: 7, number: '302', type: 'Suite', name: 'Executive Suite', price: 249, capacity: 4, status: 'maintenance', floor: 3, amenities: ['WiFi', 'TV', 'AC', 'Jacuzzi', 'Balcony', 'Kitchen', 'Living Room'], desc: 'The pinnacle of luxury. A full executive suite with kitchen and premium appointments.', img: null },
    { id: 8, number: '103', type: 'Single', name: 'Economy Single', price: 45, capacity: 1, status: 'available', floor: 1, amenities: ['WiFi', 'TV'], desc: 'Budget-friendly single room — everything you need, nothing you don\'t.', img: null },
    { id: 9, number: '204', type: 'Double', name: 'Twin Room', price: 89, capacity: 2, status: 'available', floor: 2, amenities: ['WiFi', 'TV', 'AC', 'Twin Beds'], desc: 'Twin room with two single beds. Ideal for friends or colleagues travelling together.', img: null },
  ],

  reservations: DATA.reservations,
  users: DATA.users,

  // ── AUTH ─────────────────────────────────────────────────
  getUser() {
    try { return JSON.parse(localStorage.getItem('hms_user')); } catch { return null; }
  },
  setUser(u) { localStorage.setItem('hms_user', JSON.stringify(u)); },
  logout() { localStorage.removeItem('hms_user'); window.location.href = 'index.html'; },

  requireAuth(role) {
    const u = this.getUser();
    if (!u) { window.location.href = 'index.html'; return null; }
    if (role && u.role !== role && !(Array.isArray(role) && role.includes(u.role))) {
      window.location.href = 'index.html'; return null;
    }
    return u;
  },

  redirectByRole(role) {
    if (role === 'admin') window.location.href = 'admin.html';
    else if (role === 'receptionist') window.location.href = 'receptionist.html';
    else window.location.href = 'rooms.html';
  },

  // ── HELPERS ──────────────────────────────────────────────
  getRoom(id) { return this.rooms.find(r => r.id == id); },
  getReservationsForUser(userId) { return this.reservations.filter(r => r.guestId == userId); },

  saveReservations() {
    localStorage.setItem('hms_reservations', JSON.stringify(this.reservations));
  },

  saveUsers() {
    localStorage.setItem('hms_users', JSON.stringify(this.users));
  },

  getStatusBadge(status) {
    const map = {
      'confirmed': '<span class="badge badge-blue">Confirmed</span>',
      'checked-in': '<span class="badge badge-green">Checked In</span>',
      'completed': '<span class="badge badge-gray">Completed</span>',
      'cancelled': '<span class="badge badge-red">Cancelled</span>',
      'pending': '<span class="badge badge-yellow">Pending</span>',
      'available': '<span class="room-tag">Available</span>',
      'occupied': '<span class="room-tag occupied">Occupied</span>',
      'maintenance': '<span class="room-tag maintenance">Maintenance</span>',
    };
    return map[status] || `<span class="badge badge-gray">${status}</span>`;
  },

  roomIcon(type) {
    const map = { Single: '🛏', Double: '🛏', Suite: '🏰' };
    return map[type] || '🏨';
  },

  nights(checkIn, checkOut) {
    const d1 = new Date(checkIn), d2 = new Date(checkOut);
    return Math.max(1, Math.round((d2 - d1) / 86400000));
  },

  formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  toast(msg, type = '') {
    const $t = $('<div class="toast"></div>').text(msg);
    if (type) $t.addClass(type);
    if (!$('.toast-container').length) $('body').append('<div class="toast-container"></div>');
    $('.toast-container').append($t);
    setTimeout(() => $t.fadeOut(300, () => $t.remove()), 3000);
  },

  buildSidebar(activeKey) {
    const user = this.getUser();
    if (!user) return;
    const isAdmin = user.role === 'admin';
    const isRec = user.role === 'receptionist';

    let navLinks = '';
    if (isAdmin) {
      navLinks = `
        <a href="admin.html" class="${activeKey === 'dashboard' ? 'active' : ''}">
          ${ico('grid')} Admin Dashboard
        </a>`;
    } else if (isRec) {
      navLinks = `
        <a href="receptionist.html" class="${activeKey === 'dashboard' ? 'active' : ''}">
          ${ico('grid')} Receptionist Dashboard
        </a>`;
    } else {
      navLinks = `
        <a href="rooms.html" class="${activeKey === 'rooms' ? 'active' : ''}">
          ${ico('door')} Browse Rooms
        </a>
        <a href="my-reservations.html" class="${activeKey === 'reservations' ? 'active' : ''}">
          ${ico('calendar')} My Reservations
        </a>
        <a href="profile.html" class="${activeKey === 'profile' ? 'active' : ''}">
          ${ico('user')} My Profile
        </a>`;
    }

    const roleLabel = isAdmin ? 'Administrator' : isRec ? 'Receptionist' : 'Guest';

    $('#sidebar').html(`
      <div class="sidebar-brand">Grand HMS<span>${roleLabel} Portal</span></div>
      <div class="sidebar-user">
        <div class="sidebar-avatar">👤</div>
        <div>
          <div class="sidebar-username">${user.name}</div>
          <div class="sidebar-role">${roleLabel}</div>
        </div>
      </div>
      <nav class="sidebar-nav">${navLinks}</nav>
      <div class="sidebar-footer">
        <a onclick="HMS.logout()">
          ${ico('logout')} Sign Out
        </a>
      </div>
    `);
  }
};

// ── SVG ICONS ────────────────────────────────────────────────
function ico(name) {
  const icons = {
    grid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
    door: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="13" height="18" rx="1"/><path d="M16 6h4v15h-4"/><circle cx="13.5" cy="12" r="1" fill="currentColor"/></svg>`,
    calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    tag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
    chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  };
  return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">${icons[name]?.match(/<[^>]+>[\s\S]*/)?.[0] || ''}</svg>`;
}

// Mini calendar widget with reservation highlighting
function buildCalendar(containerId, selectedDate, onChange, checkIn, checkOut, status) {
  const $c = $('#' + containerId);
  let current = selectedDate ? new Date(selectedDate) : new Date();

  function render() {
    const year = current.getFullYear(), month = current.getMonth();
    const first = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    let html = `<div class="mini-cal">
      <div class="cal-header">
        <button class="cal-nav" id="cal-prev-${containerId}">&#8249;</button>
        <div style="display:flex;gap:6px;">
          <select id="cal-month-${containerId}">
            ${months.map((m, i) => `<option value="${i}" ${i === month ? 'selected' : ''}>${m}</option>`).join('')}
          </select>
          <select id="cal-year-${containerId}">
            ${Array.from({length: 10}, (_, i) => 2025 + i).map(y => `<option ${y === year ? 'selected' : ''}>${y}</option>`).join('')}
          </select>
        </div>
        <button class="cal-nav" id="cal-next-${containerId}">&#8250;</button>
      </div>
      <div class="cal-grid">
        ${['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => `<div class="cal-day-label">${d}</div>`).join('')}
        ${Array(first).fill('<div></div>').join('')}
        ${Array.from({length: days}, (_, i) => {
          const d = i + 1;
          const currentDate = new Date(year, month, d);
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
          const isSel = selectedDate && new Date(selectedDate).getFullYear() === year && new Date(selectedDate).getMonth() === month && new Date(selectedDate).getDate() === d;

          // Check if date is in reservation range
          let inRange = false, isCheckIn = false, isCheckOut = false, statusClass = '';
          if (checkIn && checkOut) {
            const ci = new Date(checkIn), co = new Date(checkOut);
            ci.setHours(0,0,0,0); co.setHours(0,0,0,0); currentDate.setHours(0,0,0,0);
            inRange = currentDate >= ci && currentDate <= co;
            isCheckIn = currentDate.getTime() === ci.getTime();
            isCheckOut = currentDate.getTime() === co.getTime();
            if (inRange) {
              if (status === 'confirmed') statusClass = 'cal-confirmed';
              else if (status === 'checked-in') statusClass = 'cal-checked-in';
              else if (status === 'completed') statusClass = 'cal-completed';
              else if (status === 'cancelled') statusClass = 'cal-cancelled';
            }
          }

          return `<div class="cal-day ${isToday ? 'today' : ''} ${isSel ? 'selected' : ''} ${statusClass} ${isCheckIn ? 'check-in' : ''} ${isCheckOut ? 'check-out' : ''}" data-date="${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}">${d}</div>`;
        }).join('')}
      </div>
    </div>`;

    $c.html(html);

    $c.find('.cal-day[data-date]').on('click', function() {
      selectedDate = $(this).data('date');
      if (onChange) onChange(selectedDate);
      render();
    });
    $c.find('#cal-prev-' + containerId).on('click', () => { current.setMonth(current.getMonth() - 1); render(); });
    $c.find('#cal-next-' + containerId).on('click', () => { current.setMonth(current.getMonth() + 1); render(); });
    $c.find('#cal-month-' + containerId).on('change', function() { current.setMonth(parseInt($(this).val())); render(); });
    $c.find('#cal-year-' + containerId).on('change', function() { current.setFullYear(parseInt($(this).val())); render(); });
  }
  render();
}

// Multi-reservation calendar - shows all reservations on one calendar
function buildMultiReservationCalendar(containerId, reservations) {
  const $c = $('#' + containerId);
  let current = new Date();

  function render() {
    const year = current.getFullYear(), month = current.getMonth();
    const first = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    let html = `<div class="multi-cal" style="max-width:600px;width:100%;">
      <div class="cal-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <button class="cal-nav" id="cal-prev-${containerId}" style="background:transparent;border:1px solid #ddd;padding:8px 12px;cursor:pointer;border-radius:6px;font-size:18px;">&#8249;</button>
        <div style="font-size:20px;font-weight:700;">${months[month]} ${year}</div>
        <button class="cal-nav" id="cal-next-${containerId}" style="background:transparent;border:1px solid #ddd;padding:8px 12px;cursor:pointer;border-radius:6px;font-size:18px;">&#8250;</button>
      </div>
      <div class="cal-grid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;">
        ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div style="text-align:center;font-weight:600;font-size:13px;color:#888;padding:8px 0;">${d}</div>`).join('')}
        ${Array(first).fill('<div></div>').join('')}
        ${Array.from({length: days}, (_, i) => {
          const d = i + 1;
          const currentDate = new Date(year, month, d);
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

          // Check all reservations for this date
          let statusClass = '', resInfo = '';
          for (const r of reservations) {
            const ci = new Date(r.checkIn), co = new Date(r.checkOut);
            ci.setHours(0,0,0,0); co.setHours(0,0,0,0); currentDate.setHours(0,0,0,0);
            const inRange = currentDate >= ci && currentDate <= co;

            if (inRange) {
              if (r.status === 'confirmed') statusClass = 'cal-confirmed';
              else if (r.status === 'checked-in') statusClass = 'cal-checked-in';
              else if (r.status === 'completed') statusClass = 'cal-completed';
              else if (r.status === 'cancelled') statusClass = 'cal-cancelled';
              resInfo = `Room ${r.roomNumber}`;
              break; // Show first matching reservation
            }
          }

          return `<div class="cal-day ${isToday ? 'today' : ''} ${statusClass}" title="${resInfo}" style="aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:8px;cursor:${resInfo ? 'pointer' : 'default'};font-size:14px;">${d}</div>`;
        }).join('')}
      </div>
    </div>`;

    $c.html(html);

    $c.find('#cal-prev-' + containerId).on('click', () => { current.setMonth(current.getMonth() - 1); render(); });
    $c.find('#cal-next-' + containerId).on('click', () => { current.setMonth(current.getMonth() + 1); render(); });
  }
  render();
}
