const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { Reservation, Guest, Room, RoomType, Payment, Receptionist } = require('../models');
const { logAction } = require('../middleware/logger');

const fullInclude = [
  { model: Guest, as: 'guest' },
  { model: Room, as: 'room', include: [{ model: RoomType, as: 'roomType' }] },
  { model: Payment, as: 'payment' },
  { model: Receptionist, as: 'receptionist' },
];

const checkOverlap = async (roomId, checkIn, checkOut, excludeId = null) => {
  const where = {
    Room_ID: roomId,
    Status: { [Op.in]: ['confirmed', 'checked-in'] },
    Check_In_Date:  { [Op.lt]: checkOut },
    Check_Out_Date: { [Op.gt]: checkIn },
  };
  if (excludeId) where.Reservation_ID = { [Op.ne]: excludeId };
  return Reservation.count({ where });
};

const nightsBetween = (checkIn, checkOut) => {
  const ms = new Date(checkOut) - new Date(checkIn);
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
};

const getAll = (userId, role) => {
  if (role === 'guest')
    return Reservation.findAll({ where: { GuestID: userId }, include: fullInclude, order: [['Reservation_ID', 'DESC']] });
  return Reservation.findAll({ include: fullInclude, order: [['Reservation_ID', 'DESC']] });
};

const getById = async (id) => {
  const r = await Reservation.findByPk(id, { include: fullInclude });
  if (!r) throw new Error('Reservation not found');
  return r;
};

const create = async ({ roomId, checkIn, checkOut, notes }, userId) => {
  const room = await Room.findByPk(roomId, { include: [{ model: RoomType, as: 'roomType' }] });
  if (!room) throw new Error('Room not found');
  if (room.Status === 'maintenance') throw new Error('Room is under maintenance');

  const overlap = await checkOverlap(roomId, checkIn, checkOut);
  if (overlap > 0) throw new Error('Room is not available for selected dates');

  const nights = nightsBetween(checkIn, checkOut);
  const price = parseFloat(room.price || room.roomType?.Base_Price || 0);
  const totalPrice = price * nights;

  const reservation = await Reservation.create({
    Check_In_Date: checkIn,
    Check_Out_Date: checkOut,
    Total_Price: totalPrice,
    Status: 'confirmed',
    notes,
    GuestID: userId,
    Room_ID: roomId,
  });

  await logAction(`Guest ${userId} created reservation ${reservation.Reservation_ID} for room ${room.Room_Number}`, userId, 'guest');
  return getById(reservation.Reservation_ID);
};

const update = async (id, { checkIn, checkOut, notes }, userId, role) => {
  const reservation = await getById(id);
  if (role === 'guest' && reservation.GuestID !== userId) throw new Error('Access denied');
  if (['completed', 'cancelled'].includes(reservation.Status)) throw new Error('Cannot modify this reservation');

  const overlap = await checkOverlap(reservation.Room_ID, checkIn || reservation.Check_In_Date, checkOut || reservation.Check_Out_Date, id);
  if (overlap > 0) throw new Error('Room is not available for selected dates');

  await reservation.update({ Check_In_Date: checkIn || reservation.Check_In_Date, Check_Out_Date: checkOut || reservation.Check_Out_Date, notes: notes ?? reservation.notes });
  return getById(id);
};

const cancel = async (id, userId, role) => {
  const reservation = await getById(id);
  if (role === 'guest' && reservation.GuestID !== userId) throw new Error('Access denied');
  if (reservation.Status === 'completed') throw new Error('Cannot cancel a completed reservation');

  const wasCheckedIn = reservation.Status === 'checked-in';
  await reservation.update({ Status: 'cancelled' });

  if (wasCheckedIn) await Room.update({ Status: 'available' }, { where: { Room_ID: reservation.Room_ID } });
  await logAction(`Reservation ${id} cancelled`, userId, role);
  return getById(id);
};

const checkIn = async (id, userId, role) => {
  const reservation = await getById(id);
  if (reservation.Status !== 'confirmed') throw new Error('Reservation must be confirmed to check in');

  await reservation.update({ Status: 'checked-in' });
  await Room.update({ Status: 'occupied' }, { where: { Room_ID: reservation.Room_ID } });
  await logAction(`Checked in reservation ${id}, room ${reservation.Room_ID}`, userId, role);
  return getById(id);
};

const checkOut = async (id, userId, role) => {
  const reservation = await getById(id);
  if (reservation.Status !== 'checked-in') throw new Error('Reservation must be checked-in to check out');

  await reservation.update({ Status: 'completed' });
  await Room.update({ Status: 'available' }, { where: { Room_ID: reservation.Room_ID } });
  await logAction(`Checked out reservation ${id}, room ${reservation.Room_ID}`, userId, role);
  return getById(id);
};

const walkIn = async ({ guest: guestData, roomId, checkIn: ci, checkOut: co }, staffId, role) => {
  const room = await Room.findByPk(roomId, { include: [{ model: RoomType, as: 'roomType' }] });
  if (!room) throw new Error('Room not found');

  const email = guestData.email || `walkin_${Date.now()}@hotel.local`;
  let guest = await Guest.findOne({ where: { email } });
  if (!guest) {
    const parts = (guestData.name || 'Walk In Guest').trim().split(' ');
    guest = await Guest.create({
      First_Name: parts[0],
      Last_Name: parts.slice(1).join(' ') || parts[0],
      email,
      password: await bcrypt.hash('walkin' + Date.now(), 10),
      Registration_Date: new Date(),
    });
  }

  const nights = nightsBetween(ci, co);
  const price = parseFloat(room.price || room.roomType?.Base_Price || 0);

  const reservation = await Reservation.create({
    Check_In_Date: ci,
    Check_Out_Date: co,
    Total_Price: price * nights,
    Status: 'checked-in',
    GuestID: guest.GuestID,
    Room_ID: roomId,
    Receptionist_ID: role === 'receptionist' ? staffId : null,
  });

  await Room.update({ Status: 'occupied' }, { where: { Room_ID: roomId } });
  await logAction(`Walk-in check-in for guest ${guest.GuestID}, room ${room.Room_Number}`, staffId, role);
  return getById(reservation.Reservation_ID);
};

module.exports = { getAll, getById, create, update, cancel, checkIn, checkOut, walkIn };
