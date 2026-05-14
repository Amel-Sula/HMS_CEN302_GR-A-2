const router = require('express').Router();
const RoomService = require('../services/RoomService');
const RoomTypeService = require('../services/RoomTypeService');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/rooms/types/all  — must be before /:id
router.get('/types/all', async (req, res) => {
  try {
    res.json(await RoomTypeService.getAll());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/rooms/available
router.get('/available', async (req, res) => {
  try {
    const { checkIn, checkOut, type } = req.query;
    res.json(await RoomService.getAvailable(checkIn, checkOut, type));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/rooms
router.get('/', async (req, res) => {
  try {
    res.json(await RoomService.getAll());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/rooms/:id
router.get('/:id', async (req, res) => {
  try {
    res.json(await RoomService.getById(req.params.id));
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

// POST /api/rooms  (admin)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    res.status(201).json(await RoomService.create(req.body));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/rooms/:id  (admin)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    res.json(await RoomService.update(req.params.id, req.body));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/rooms/:id  (admin)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    await RoomService.remove(req.params.id);
    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/rooms/:id/status  (admin)
router.patch('/:id/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    res.json(await RoomService.updateStatus(req.params.id, req.body.status));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
