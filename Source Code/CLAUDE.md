# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Grand HMS is a **frontend-only** Hotel Management System built with vanilla HTML, CSS, and jQuery. No backend, no build tools — just open [index.html](index.html) directly in a browser.

## Running the Application

No setup required. Simply open any HTML file in a browser.

**Test Credentials**:
- Guest: john@example.com / guest123
- Receptionist: receptionist@hotel.com / rec123
- Admin: admin@hotel.com / admin123

## File Structure

```
hms-frontend/
├── index.html              # Sign In page
├── signup.html             # Sign Up page
├── rooms.html              # Guest: browse rooms
├── room-details.html       # Guest: room detail + booking
├── my-reservations.html    # Guest: view/modify bookings
├── profile.html            # Guest: update profile
├── receptionist.html       # Receptionist: dashboard (tabs: reservations, check-in/out, walk-in)
├── admin.html              # Admin: dashboard (tabs: overview, rooms, staff, pricing, reports)
├── css/
│   └── style.css           # All styles
└── js/
    ├── app.js              # HMS global object with mock data & utilities
    └── pages/              # Page-specific JavaScript files
        ├── signin.js       # Sign in page logic
        ├── signup.js       # Sign up page logic
        ├── rooms.js        # Room browsing logic
        ├── room-details.js # Room details & booking logic
        ├── my-reservations.js # Guest reservations management
        ├── profile.js      # Profile management
        ├── admin.js        # Admin dashboard logic
        └── receptionist.js # Receptionist dashboard logic
```

## Tech Stack

- **HTML5 + CSS3**: No frameworks
- **jQuery 3.7.1**: Loaded via CDN
- **No build process**: Pure static files
- **All data is mock**: Stored in `HMS` object in [js/app.js](js/app.js), resets on page refresh

## Architecture

### HMS Global Object

All state, data, and utilities live in the `HMS` object ([js/app.js](js/app.js)):

```javascript
HMS = {
  rooms: [...],           // 9 mock rooms
  reservations: [...],    // 7 mock reservations
  users: [...],           // 8 mock users

  // Auth
  getUser(), setUser(), logout(), requireAuth(role), redirectByRole(role),

  // Data helpers
  getRoom(id), getReservationsForUser(userId),

  // UI utilities
  getStatusBadge(status), roomIcon(type), nights(checkIn, checkOut),
  formatDate(d), toast(msg, type), ico(name), buildSidebar(activeKey)
}
```

**Important**: All data is in-memory only. Changes reset on page refresh.

### User Roles & Pages

**Guest** (default role):
- [rooms.html](rooms.html) - Browse/search rooms
- [room-details.html](room-details.html) - View details, make reservation
- [my-reservations.html](my-reservations.html) - Manage bookings (modify/cancel)
- [profile.html](profile.html) - Update account

**Receptionist**:
- [receptionist.html](receptionist.html) - Tabbed dashboard:
  - Reservations tab: View/search/edit all bookings
  - Check-In/Out tab: Process arrivals/departures
  - Walk-In tab: Create new reservations on-the-fly

**Admin**:
- [admin.html](admin.html) - Tabbed dashboard:
  - Overview: Stats, charts, room status grid
  - Room Inventory: Add/edit rooms, toggle status
  - Staff Accounts: Create/remove staff
  - Pricing: Update room prices
  - Reports: Revenue & guest analytics

### Authentication Flow

1. User signs in via [index.html](index.html) or signs up via [signup.html](signup.html)
2. `HMS.setUser(user)` stores user in `sessionStorage.hms_user`
3. `HMS.redirectByRole(user.role)` redirects to appropriate dashboard
4. Each protected page calls `HMS.requireAuth(role)` at page load to verify access

**Auth Guards**: Each page has inline script that checks:
```javascript
const user = HMS.requireAuth('admin'); // or 'receptionist' or 'guest'
if (!user) return; // redirects to index.html if unauthorized
```

### Key UI Patterns

- **Tabs**: Dashboard pages use `.tab-btn` + `data-tab` attributes for tab switching
- **Modals**: `.modal-backdrop` + `.modal` with jQuery `.addClass('hidden')` / `.removeClass('hidden')`
- **Badges**: Status badges via `HMS.getStatusBadge(status)` with color classes
- **Sidebar**: Built dynamically via `HMS.buildSidebar(activeKey)` per user role
- **Toast Notifications**: `HMS.toast(msg, type)` shows temporary alerts

### Data Models

```javascript
// Room
{ id, number, type, name, price, capacity, status, floor, amenities[], desc, img }
// status: 'available' | 'occupied' | 'maintenance'

// Reservation
{ id, guestId, guestName, roomId, roomNumber, checkIn, checkOut, status, totalPrice, createdAt, notes }
// status: 'confirmed' | 'checked-in' | 'completed' | 'cancelled' | 'pending'

// User
{ id, name, email, password, role }
// role: 'guest' | 'admin' | 'receptionist'
```

## Design System

[css/style.css](css/style.css) contains all styles.

- **Theme**: Dark bg (#1a1a1a) with white cards
- **Fonts**: DM Serif Display (headings), DM Sans (body) from Google Fonts
- **Spacing**: 8px base unit (.mt-1 = 8px, .mt-2 = 16px, .mt-3 = 24px, etc.)
- **CSS Variables**: `--bg`, `--text`, `--accent-green`, `--radius` (10px)
- **Sidebar**: Fixed 240px width on left
- **Grid Layouts**: `grid-template-columns: repeat(auto-fill, minmax(...))`

**Status Colors**:
- Blue: Confirmed
- Green: Checked-in, Available
- Yellow: Pending
- Red: Cancelled
- Orange: Maintenance
- Gray: Completed, Occupied

## Key Conventions

- **Separation of concerns**: HTML files contain only markup; JavaScript is in separate files under [js/pages/](js/pages/)
- **No form tags**: Use `<button>` with jQuery event handlers instead
- **Script loading order**: jQuery → app.js → page-specific JS file
- **Auth at top**: Each protected page's JS file calls `HMS.requireAuth(role)` first thing in `$(function() {...})`
- **CSS classes**: Utility classes (.mt-1, .mb-2, .hidden, .flex, etc.)
- **sessionStorage**: Used for `hms_user` and `hms_favs` (favorited rooms)

## Known Limitations

- **No backend**: All data is client-side mock data
- **No persistence**: Changes reset on refresh
- **Client-side auth only**: sessionStorage can be manipulated via browser console
- **Plaintext passwords**: For demo purposes only
- **No real payment processing**
- **No email notifications**

## Future Production Considerations

To make this production-ready, you would need:
- Backend API (Node.js/Python/etc.) with database (PostgreSQL/MySQL)
- Real authentication (JWT, OAuth, session tokens)
- Server-side validation and role enforcement
- Password hashing (bcrypt)
- Payment gateway integration
- Email service (SendGrid, AWS SES)
- Image uploads for rooms
- Build tooling + modern framework (React/Vue)
