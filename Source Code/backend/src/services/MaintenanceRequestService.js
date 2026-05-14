const { MaintenanceRequest, Room, Receptionist, Administrator } = require('../models');
const { logAction } = require('../middleware/logger');

const fullInclude = [
  { model: Room, as: 'room' },
  { model: Receptionist, as: 'receptionist' },
  { model: Administrator, as: 'administrator' },
];

const getAll = () =>
  MaintenanceRequest.findAll({ include: fullInclude, order: [['Date_Reported', 'DESC']] });

const create = async (data, adminId) => {
  const req = await MaintenanceRequest.create({
    Issue_Description: data.description || data.Issue_Description,
    Priority_Level: data.priority || data.Priority_Level || 'medium',
    Status: 'pending',
    Date_Reported: new Date(),
    Cost_Estimate: data.costEstimate || data.Cost_Estimate,
    Room_ID: data.roomId || data.Room_ID,
    Administrator_ID: adminId,
  });

  if (data.roomId || data.Room_ID)
    await Room.update({ Status: 'maintenance' }, { where: { Room_ID: data.roomId || data.Room_ID } });

  await logAction(`Maintenance request ${req.Request_ID} created for room ${data.roomId || data.Room_ID}`, adminId, 'admin');
  return MaintenanceRequest.findByPk(req.Request_ID, { include: fullInclude });
};

const resolve = async (id, adminId) => {
  const req = await MaintenanceRequest.findByPk(id, { include: fullInclude });
  if (!req) throw new Error('Maintenance request not found');

  await req.update({ Status: 'resolved' });

  if (req.Room_ID)
    await Room.update({ Status: 'available' }, { where: { Room_ID: req.Room_ID } });

  await logAction(`Maintenance request ${id} resolved`, adminId, 'admin');
  return MaintenanceRequest.findByPk(id, { include: fullInclude });
};

module.exports = { getAll, create, resolve };
