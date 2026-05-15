// ============================================================
// HMS – Shared App State, API Layer & Utilities
// ============================================================

const HMS = {

  API_BASE: 'http://localhost:3000/api',

  // ── TOKEN / SESSION ──────────────────────────────────────
  getToken() { return localStorage.getItem('hms_token'); },
  setToken(t) { localStorage.setItem('hms_token', t); },
  clearToken() { localStorage.removeItem('hms_token'); },

  getUser() {
    try { return JSON.parse(localStorage.getItem('hms_user')); } catch { return null; }
  },
  setUser(u) { localStorage.setItem('hms_user', JSON.stringify(u)); },

  logout() {
    localStorage.removeItem('hms_user');
    localStorage.removeItem('hms_token');
    window.location.href = 'index.html';
  },

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

  // ── API HELPER ───────────────────────────────────────────
  async api(method, path, body) {
    const token = this.getToken();
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(this.API_BASE + path, opts);
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) { this.logout(); return; }
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  },

  // ── DATA NORMALIZERS ─────────────────────────────────────
  normalizeRoom(r) {
    const amenities = r.roomType?.Amenities_Description
      ? r.roomType.Amenities_Description.split(',').map(a => a.trim())
      : [];
    const typeNames = { Single: 'Standard Single', Double: 'Deluxe Double', Suite: 'Executive Suite' };
    const cat = r.roomType?.Category_Name || '';
    return {
      id:        r.Room_ID,
      number:    r.Room_Number,
      type:      cat,
      typeId:    r.Type_ID,
      name:      typeNames[cat] || cat + ' Room',
      price:     parseFloat(r.price || r.roomType?.Base_Price || 0),
      capacity:  r.roomType?.Capacity || 2,
      status:    (r.Status || 'available').toLowerCase(),
      floor:     r.Floor,
      amenities,
      desc:      r.roomType?.Amenities_Description || '',
      img:       null,
    };
  },

  normalizeReservation(r) {
    const guestName = r.guest
      ? `${r.guest.First_Name} ${r.guest.Last_Name}`
      : 'Guest';
    return {
      id:          r.Reservation_ID,
      guestId:     r.GuestID,
      guestName,
      roomId:      r.Room_ID,
      roomNumber:  r.room?.Room_Number || '',
      roomType:    r.room?.roomType?.Category_Name || '',
      checkIn:     r.Check_In_Date,
      checkOut:    r.Check_Out_Date,
      status:      r.Status,
      totalPrice:  parseFloat(r.Total_Price || 0),
      createdAt:   r.Check_In_Date,
      notes:       r.notes || '',
    };
  },

  // ── UI HELPERS ───────────────────────────────────────────
  getStatusBadge(status) {
    const map = {
      'confirmed':   '<span class="badge badge-blue">Confirmed</span>',
      'checked-in':  '<span class="badge badge-green">Checked In</span>',
      'completed':   '<span class="badge badge-gray">Completed</span>',
      'cancelled':   '<span class="badge badge-red">Cancelled</span>',
      'pending':     '<span class="badge badge-yellow">Pending</span>',
      'available':   '<span class="room-tag">Available</span>',
      'occupied':    '<span class="room-tag occupied">Occupied</span>',
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
    const isRec   = user.role === 'receptionist';

    let navLinks = '';
    if (isAdmin) {
      navLinks = `<a href="admin.html" class="${activeKey === 'dashboard' ? 'active' : ''}">${ico('grid')} Admin Dashboard</a>`;
    } else if (isRec) {
      navLinks = `<a href="receptionist.html" class="${activeKey === 'dashboard' ? 'active' : ''}">${ico('grid')} Receptionist Dashboard</a>`;
    } else {
      navLinks = `
        <a href="rooms.html" class="${activeKey === 'rooms' ? 'active' : ''}">${ico('door')} Browse Rooms</a>
        <a href="my-reservations.html" class="${activeKey === 'reservations' ? 'active' : ''}">${ico('calendar')} My Reservations</a>
        <a href="profile.html" class="${activeKey === 'profile' ? 'active' : ''}">${ico('user')} My Profile</a>`;
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
        <a onclick="HMS.logout()">${ico('logout')} Sign Out</a>
      </div>
    `);
  },
};

// ── SVG ICONS ────────────────────────────────────────────────
function ico(name) {
  const icons = {
    grid:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
    door:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="13" height="18" rx="1"/><path d="M16 6h4v15h-4"/><circle cx="13.5" cy="12" r="1" fill="currentColor"/></svg>`,
    calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="17" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    users:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    tag:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
    chart:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    user:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    logout:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
    check:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
    plus:     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    close:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  };
  return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">${icons[name]?.match(/<[^>]+>[\s\S]*/)?.[0] || ''}</svg>`;
}

// ── CALENDAR WIDGETS (unchanged) ─────────────────────────────
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
          <select id="cal-month-${containerId}">${months.map((m,i)=>`<option value="${i}"${i===month?' selected':''}>${m}</option>`).join('')}</select>
          <select id="cal-year-${containerId}">${Array.from({length:10},(_,i)=>2025+i).map(y=>`<option${y===year?' selected':''}>${y}</option>`).join('')}</select>
        </div>
        <button class="cal-nav" id="cal-next-${containerId}">&#8250;</button>
      </div>
      <div class="cal-grid">
        ${['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=>`<div class="cal-day-label">${d}</div>`).join('')}
        ${Array(first).fill('<div></div>').join('')}
        ${Array.from({length:days},(_,i)=>{
          const d=i+1, currentDate=new Date(year,month,d);
          const isToday=today.getFullYear()===year&&today.getMonth()===month&&today.getDate()===d;
          const isSel=selectedDate&&new Date(selectedDate).getFullYear()===year&&new Date(selectedDate).getMonth()===month&&new Date(selectedDate).getDate()===d;
          let inRange=false, isCheckIn=false, isCheckOut=false, statusClass='';
          if(checkIn&&checkOut){
            const ci=new Date(checkIn),co=new Date(checkOut);
            ci.setHours(0,0,0,0);co.setHours(0,0,0,0);currentDate.setHours(0,0,0,0);
            inRange=currentDate>=ci&&currentDate<=co;
            isCheckIn=currentDate.getTime()===ci.getTime();
            isCheckOut=currentDate.getTime()===co.getTime();
            if(inRange){
              if(status==='confirmed')statusClass='cal-confirmed';
              else if(status==='checked-in')statusClass='cal-checked-in';
              else if(status==='completed')statusClass='cal-completed';
              else if(status==='cancelled')statusClass='cal-cancelled';
            }
          }
          return `<div class="cal-day${isToday?' today':''}${isSel?' selected':''}${statusClass?' '+statusClass:''}${isCheckIn?' check-in':''}${isCheckOut?' check-out':''}" data-date="${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}">${d}</div>`;
        }).join('')}
      </div></div>`;

    $c.html(html);
    $c.find('.cal-day[data-date]').on('click',function(){selectedDate=$(this).data('date');if(onChange)onChange(selectedDate);render();});
    $c.find('#cal-prev-'+containerId).on('click',()=>{current.setMonth(current.getMonth()-1);render();});
    $c.find('#cal-next-'+containerId).on('click',()=>{current.setMonth(current.getMonth()+1);render();});
    $c.find('#cal-month-'+containerId).on('change',function(){current.setMonth(parseInt($(this).val()));render();});
    $c.find('#cal-year-'+containerId).on('change',function(){current.setFullYear(parseInt($(this).val()));render();});
  }
  render();
}

function buildMultiReservationCalendar(containerId, reservations) {
  const $c = $('#' + containerId);
  let current = new Date();

  function render() {
    const year=current.getFullYear(), month=current.getMonth();
    const first=new Date(year,month,1).getDay();
    const days=new Date(year,month+1,0).getDate();
    const today=new Date();
    const months=['January','February','March','April','May','June','July','August','September','October','November','December'];

    let html=`<div class="multi-cal" style="max-width:600px;width:100%;">
      <div class="cal-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <button class="cal-nav" id="cal-prev-${containerId}" style="background:transparent;border:1px solid #ddd;padding:8px 12px;cursor:pointer;border-radius:6px;font-size:18px;">&#8249;</button>
        <div style="font-size:20px;font-weight:700;">${months[month]} ${year}</div>
        <button class="cal-nav" id="cal-next-${containerId}" style="background:transparent;border:1px solid #ddd;padding:8px 12px;cursor:pointer;border-radius:6px;font-size:18px;">&#8250;</button>
      </div>
      <div class="cal-grid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;">
        ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<div style="text-align:center;font-weight:600;font-size:13px;color:#888;padding:8px 0;">${d}</div>`).join('')}
        ${Array(first).fill('<div></div>').join('')}
        ${Array.from({length:days},(_,i)=>{
          const d=i+1, currentDate=new Date(year,month,d);
          const isToday=today.getFullYear()===year&&today.getMonth()===month&&today.getDate()===d;
          let statusClass='', resInfo='';
          for(const r of reservations){
            const ci=new Date(r.checkIn),co=new Date(r.checkOut);
            ci.setHours(0,0,0,0);co.setHours(0,0,0,0);currentDate.setHours(0,0,0,0);
            if(currentDate>=ci&&currentDate<=co){
              if(r.status==='confirmed')statusClass='cal-confirmed';
              else if(r.status==='checked-in')statusClass='cal-checked-in';
              else if(r.status==='completed')statusClass='cal-completed';
              else if(r.status==='cancelled')statusClass='cal-cancelled';
              resInfo=`Room ${r.roomNumber}`;break;
            }
          }
          return `<div class="cal-day${isToday?' today':''}${statusClass?' '+statusClass:''}" title="${resInfo}" style="aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:8px;cursor:${resInfo?'pointer':'default'};font-size:14px;">${d}</div>`;
        }).join('')}
      </div></div>`;

    $c.html(html);
    $c.find('#cal-prev-'+containerId).on('click',()=>{current.setMonth(current.getMonth()-1);render();});
    $c.find('#cal-next-'+containerId).on('click',()=>{current.setMonth(current.getMonth()+1);render();});
  }
  render();
}
