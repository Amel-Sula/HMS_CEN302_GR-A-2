const { Op } = require('sequelize');
const { sequelize, Reservation, Room, RoomType, Guest } = require('../models');

const getRevenue = async (start, end) => {
  const where = { Status: { [Op.in]: ['completed', 'checked-in'] } };
  if (start) where.Check_In_Date = { [Op.gte]: start };
  if (end) where.Check_Out_Date = { ...(where.Check_Out_Date || {}), [Op.lte]: end };

  const reservations = await Reservation.findAll({
    where,
    include: [{ model: Room, as: 'room', include: [{ model: RoomType, as: 'roomType' }] }],
  });

  const result = {};
  for (const r of reservations) {
    const type = r.room?.roomType?.Category_Name || 'Unknown';
    if (!result[type]) result[type] = { revenue: 0, bookings: 0 };
    result[type].revenue += parseFloat(r.Total_Price || 0);
    result[type].bookings += 1;
  }
  Object.keys(result).forEach((k) => (result[k].revenue = result[k].revenue.toFixed(2)));
  return result;
};

const getGuestAnalytics = async () => {
  const guests = await Guest.findAll({
    attributes: { exclude: ['password'] },
    include: [{
      model: Reservation,
      attributes: ['Reservation_ID', 'Total_Price', 'Status', 'Check_In_Date'],
    }],
  });

  return guests.map((g) => ({
    id: g.GuestID,
    name: `${g.First_Name} ${g.Last_Name}`,
    email: g.email,
    phone: g.Phone,
    registrationDate: g.Registration_Date,
    totalReservations: g.Reservations?.length || 0,
    totalSpent: (g.Reservations || []).reduce((s, r) => s + parseFloat(r.Total_Price || 0), 0).toFixed(2),
  }));
};

const getOccupancy = async () => {
  const roomTypes = await RoomType.findAll({ include: [{ model: Room }] });

  return roomTypes.map((rt) => {
    const rooms = rt.Rooms || [];
    const occupied = rooms.filter((r) => r.Status === 'occupied').length;
    return {
      typeId: rt.Type_ID,
      typeName: rt.Category_Name,
      totalRooms: rooms.length,
      occupiedRooms: occupied,
      availableRooms: rooms.filter((r) => r.Status === 'available').length,
      maintenanceRooms: rooms.filter((r) => r.Status === 'maintenance').length,
      occupancyRate: rooms.length > 0 ? ((occupied / rooms.length) * 100).toFixed(1) : '0.0',
    };
  });
};

module.exports = { getRevenue, getGuestAnalytics, getOccupancy };
