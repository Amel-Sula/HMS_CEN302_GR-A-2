const router = require('express').Router();
const ReservationService = require('../services/ReservationService');
const PaymentService = require('../services/PaymentService');
const { authenticate, authorize } = require('../middleware/auth');

const staffRoles = ['admin', 'receptionist'];

// GET /api/reservations
router.get('/', authenticate, async (req, res) => {
  try {
    res.json(await ReservationService.getAll(req.user.id, req.user.role));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reservations/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const r = await ReservationService.getById(req.params.id);
    if (req.user.role === 'guest' && r.GuestID !== req.user.id)
      return res.status(403).json({ message: 'Access denied' });
    res.json(r);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

// POST /api/reservations
router.post('/', authenticate, async (req, res) => {
  try {
    const { roomId, checkIn, checkOut, notes } = req.body;
    const guestId = req.user.role === 'guest' ? req.user.id : req.body.guestId;
    if (!roomId || !checkIn || !checkOut) return res.status(400).json({ message: 'roomId, checkIn, and checkOut required' });
    res.status(201).json(await ReservationService.create({ roomId, checkIn, checkOut, notes }, guestId));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/reservations/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    res.json(await ReservationService.update(req.params.id, req.body, req.user.id, req.user.role));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/reservations/:id/cancel
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    res.json(await ReservationService.cancel(req.params.id, req.user.id, req.user.role));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/reservations/:id/checkin  (staff)
router.post('/:id/checkin', authenticate, authorize(...staffRoles), async (req, res) => {
  try {
    res.json(await ReservationService.checkIn(req.params.id, req.user.id, req.user.role));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/reservations/:id/checkout  (staff)
router.post('/:id/checkout', authenticate, authorize(...staffRoles), async (req, res) => {
  try {
    res.json(await ReservationService.checkOut(req.params.id, req.user.id, req.user.role));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/reservations/walk-in  (staff)
router.post('/walk-in', authenticate, authorize(...staffRoles), async (req, res) => {
  try {
    const { guest, roomId, checkIn, checkOut } = req.body;
    if (!roomId || !checkIn || !checkOut) return res.status(400).json({ message: 'roomId, checkIn, checkOut required' });
    res.status(201).json(await ReservationService.walkIn({ guest: guest || {}, roomId, checkIn, checkOut }, req.user.id, req.user.role));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/reservations/:id/payments
router.get('/:id/payments', authenticate, async (req, res) => {
  try {
    res.json(await PaymentService.getByReservation(req.params.id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/reservations/:id/payments  (staff)
router.post('/:id/payments', authenticate, authorize(...staffRoles), async (req, res) => {
  try {
    const receptionistId = req.user.role === 'receptionist' ? req.user.id : null;
    res.status(201).json(await PaymentService.createForReservation(req.params.id, req.body, receptionistId));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
