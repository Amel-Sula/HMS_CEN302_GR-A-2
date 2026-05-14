const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { sequelize, Administrator, Receptionist, Guest, Room, Reservation, SystemLog } = require('../models');
const { logAction } = require('../middleware/logger');

const getDashboard = async () => {
  const [totalRooms, occupiedRooms, availableRooms, maintenanceRooms] = await Promise.all([
    Room.count(),
    Room.count({ where: { Status: 'occupied' } }),
    Room.count({ where: { Status: 'available' } }),
    Room.count({ where: { Status: 'maintenance' } }),
  ]);

  const today = new Date().toISOString().split('T')[0];
  const [totalBookings, todayArrivals, todayDepartures, activeGuests] = await Promise.all([
    Reservation.count(),
    Reservation.count({ where: { Check_In_Date: today } }),
    Reservation.count({ where: { Check_Out_Date: today } }),
    Reservation.count({ where: { Status: 'checked-in' } }),
  ]);

  const monthStart = new Date();
  monthStart.setDate(1);
  const revenueResult = await Reservation.findOne({
    where: { Status: { [Op.in]: ['completed', 'checked-in'] }, Check_In_Date: { [Op.gte]: monthStart } },
    attributes: [[sequelize.fn('SUM', sequelize.col('Total_Price')), 'total']],
    raw: true,
  });

  const statusCounts = await Reservation.findAll({
    attributes: ['Status', [sequelize.fn('COUNT', sequelize.col('Reservation_ID')), 'count']],
    group: ['Status'],
    raw: true,
  });

  return {
    totalRooms, occupiedRooms, availableRooms, maintenanceRooms,
    occupancyRate: totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0,
    totalBookings, todayArrivals, todayDepartures, activeGuests,
    monthRevenue: parseFloat(revenueResult?.total || 0).toFixed(2),
    statusCounts: statusCounts.reduce((acc, s) => ({ ...acc, [s.Status]: parseInt(s.count) }), {}),
  };
};

const getStaff = async () => {
  const [admins, receptionists] = await Promise.all([
    Administrator.findAll({ attributes: ['Administrator_ID', 'Name', 'Email'] }),
    Receptionist.findAll({ attributes: ['Receptionist_ID', 'Name', 'Email', 'Shift_Type'] }),
  ]);
  return [
    ...admins.map((a) => ({ id: a.Administrator_ID, name: a.Name, email: a.Email, role: 'admin' })),
    ...receptionists.map((r) => ({ id: r.Receptionist_ID, name: r.Name, email: r.Email, shift: r.Shift_Type, role: 'receptionist' })),
  ];
};

const createStaff = async ({ name, email, password, role }, adminId) => {
  const hashed = await bcrypt.hash(password, 10);

  if (role === 'admin') {
    const a = await Administrator.create({ Name: name, Email: email, Password: hashed });
    await logAction(`Admin created new admin: ${email}`, adminId, 'admin');
    return { id: a.Administrator_ID, name: a.Name, email: a.Email, role: 'admin' };
  }
  if (role === 'receptionist') {
    const r = await Receptionist.create({ Name: name, Email: email, Password: hashed });
    await logAction(`Admin created new receptionist: ${email}`, adminId, 'admin');
    return { id: r.Receptionist_ID, name: r.Name, email: r.Email, role: 'receptionist' };
  }
  throw new Error('Invalid role. Must be admin or receptionist');
};

const deleteStaff = async (role, id, adminId) => {
  if (role === 'admin') {
    const a = await Administrator.findByPk(id);
    if (!a) throw new Error('Staff not found');
    await a.destroy();
    await logAction(`Admin deleted admin ${id}`, adminId, 'admin');
    return;
  }
  if (role === 'receptionist') {
    const r = await Receptionist.findByPk(id);
    if (!r) throw new Error('Staff not found');
    await r.destroy();
    await logAction(`Admin deleted receptionist ${id}`, adminId, 'admin');
    return;
  }
  throw new Error('Invalid role');
};

const getGuests = () =>
  Guest.findAll({ attributes: { exclude: ['password'] }, order: [['Registration_Date', 'DESC']] });

const getLogs = (limit = 30) =>
  SystemLog.findAll({ order: [['Timestamp', 'DESC']], limit: parseInt(limit) });

module.exports = { getDashboard, getStaff, createStaff, deleteStaff, getGuests, getLogs };
