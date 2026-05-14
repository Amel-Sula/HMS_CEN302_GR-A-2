const router = require('express').Router();
const AdministratorService = require('../services/AdministratorService');
const ReportService = require('../services/ReportService');
const MaintenanceRequestService = require('../services/MaintenanceRequestService');
const { authenticate, authorize } = require('../middleware/auth');

const admin = [authenticate, authorize('admin')];

// GET /api/admin/dashboard
router.get('/dashboard', ...admin, async (req, res) => {
  try {
    res.json(await AdministratorService.getDashboard());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/staff
router.get('/staff', ...admin, async (req, res) => {
  try {
    res.json(await AdministratorService.getStaff());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/staff
router.post('/staff', ...admin, async (req, res) => {
  try {
    res.status(201).json(await AdministratorService.createStaff(req.body, req.user.id));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/admin/staff/:role/:id
router.delete('/staff/:role/:id', ...admin, async (req, res) => {
  try {
    await AdministratorService.deleteStaff(req.params.role, req.params.id, req.user.id);
    res.json({ message: 'Staff member deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/admin/guests
router.get('/guests', ...admin, async (req, res) => {
  try {
    res.json(await AdministratorService.getGuests());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/reports/revenue
router.get('/reports/revenue', ...admin, async (req, res) => {
  try {
    const { start, end } = req.query;
    res.json(await ReportService.getRevenue(start, end));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/reports/guests
router.get('/reports/guests', ...admin, async (req, res) => {
  try {
    res.json(await ReportService.getGuestAnalytics());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/reports/occupancy
router.get('/reports/occupancy', ...admin, async (req, res) => {
  try {
    res.json(await ReportService.getOccupancy());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/logs
router.get('/logs', ...admin, async (req, res) => {
  try {
    res.json(await AdministratorService.getLogs(req.query.limit));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/maintenance
router.get('/maintenance', ...admin, async (req, res) => {
  try {
    res.json(await MaintenanceRequestService.getAll());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/maintenance
router.post('/maintenance', ...admin, async (req, res) => {
  try {
    res.status(201).json(await MaintenanceRequestService.create(req.body, req.user.id));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/admin/maintenance/:id/resolve
router.post('/maintenance/:id/resolve', ...admin, async (req, res) => {
  try {
    res.json(await MaintenanceRequestService.resolve(req.params.id, req.user.id));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
