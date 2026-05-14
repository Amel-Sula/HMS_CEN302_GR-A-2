const { RoomType } = require('../models');

const getAll = () => RoomType.findAll({ order: [['Type_ID', 'ASC']] });

const getById = async (id) => {
  const rt = await RoomType.findByPk(id);
  if (!rt) throw new Error('Room type not found');
  return rt;
};

module.exports = { getAll, getById };
