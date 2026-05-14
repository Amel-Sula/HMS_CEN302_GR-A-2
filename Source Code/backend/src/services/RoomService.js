const { Op } = require('sequelize');
const { Room, RoomType, Reservation } = require('../models');

const roomWithType = { include: [{ model: RoomType, as: 'roomType' }] };

const getAll = () => Room.findAll({ ...roomWithType, order: [['Room_Number', 'ASC']] });

const getById = async (id) => {
  const room = await Room.findByPk(id, roomWithType);
  if (!room) throw new Error('Room not found');
  return room;
};

const getAvailable = async (checkIn, checkOut, type) => {
  // Find room IDs that have overlapping active reservations
  const occupied = await Reservation.findAll({
    where: {
      Status: { [Op.in]: ['confirmed', 'checked-in'] },
      Check_In_Date:  { [Op.lt]: checkOut },
      Check_Out_Date: { [Op.gt]: checkIn },
    },
    attributes: ['Room_ID'],
  });
  const occupiedIds = occupied.map((r) => r.Room_ID);

  const where = {
    Status: 'available',
    ...(occupiedIds.length > 0 && { Room_ID: { [Op.notIn]: occupiedIds } }),
  };

  const include = [{ model: RoomType, as: 'roomType', ...(type && { where: { Category_Name: type } }) }];

  return Room.findAll({ where, include, order: [['Room_Number', 'ASC']] });
};

const create = async (data) => {
  const room = await Room.create(data);
  return getById(room.Room_ID);
};

const update = async (id, data) => {
  const room = await getById(id);
  await room.update(data);
  return getById(id);
};

const remove = async (id) => {
  const room = await getById(id);
  await room.destroy();
};

const updateStatus = async (id, status) => {
  const room = await getById(id);
  await room.update({ Status: status });
  return getById(id);
};

module.exports = { getAll, getById, getAvailable, create, update, remove, updateStatus };
