const bcrypt = require('bcryptjs');
const { Guest, Receptionist, Administrator } = require('../models');
const { generateToken } = require('../middleware/auth');

const findUserByEmail = async (email) => {
  let user = await Guest.findOne({ where: { email } });
  if (user) return { user, role: 'guest', id: user.GuestID, name: `${user.First_Name} ${user.Last_Name}`, password: user.password };

  user = await Receptionist.findOne({ where: { Email: email } });
  if (user) return { user, role: 'receptionist', id: user.Receptionist_ID, name: user.Name, password: user.Password };

  user = await Administrator.findOne({ where: { Email: email } });
  if (user) return { user, role: 'admin', id: user.Administrator_ID, name: user.Name, password: user.Password };

  return null;
};

const login = async (email, password) => {
  const found = await findUserByEmail(email);
  if (!found) throw new Error('Invalid email or password');

  const match = await bcrypt.compare(password, found.password);
  if (!match) throw new Error('Invalid email or password');

  const token = generateToken({ id: found.id, email, role: found.role });
  return { token, user: { id: found.id, name: found.name, email, role: found.role } };
};

const register = async ({ name, email, password }) => {
  const exists = await findUserByEmail(email);
  if (exists) throw new Error('Email already in use');

  const hashed = await bcrypt.hash(password, 10);
  const parts = name.trim().split(' ');
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ') || parts[0];

  const guest = await Guest.create({
    First_Name: firstName,
    Last_Name: lastName,
    email,
    password: hashed,
    Registration_Date: new Date(),
  });

  const token = generateToken({ id: guest.GuestID, email, role: 'guest' });
  return { token, user: { id: guest.GuestID, name: `${guest.First_Name} ${guest.Last_Name}`, email, role: 'guest' } };
};

const getProfile = async (id, role) => {
  if (role === 'guest') {
    const u = await Guest.findByPk(id);
    if (!u) throw new Error('User not found');
    return { id: u.GuestID, name: `${u.First_Name} ${u.Last_Name}`, email: u.email, phone: u.Phone, address: u.Address, role: 'guest' };
  }
  if (role === 'receptionist') {
    const u = await Receptionist.findByPk(id);
    if (!u) throw new Error('User not found');
    return { id: u.Receptionist_ID, name: u.Name, email: u.Email, shift: u.Shift_Type, role: 'receptionist' };
  }
  if (role === 'admin') {
    const u = await Administrator.findByPk(id);
    if (!u) throw new Error('User not found');
    return { id: u.Administrator_ID, name: u.Name, email: u.Email, role: 'admin' };
  }
  throw new Error('Unknown role');
};

const updateProfile = async (id, role, data) => {
  const { name, email, phone, password } = data;
  const updates = {};

  if (role === 'guest') {
    const u = await Guest.findByPk(id);
    if (!u) throw new Error('User not found');
    if (name) { const p = name.trim().split(' '); u.First_Name = p[0]; u.Last_Name = p.slice(1).join(' ') || p[0]; }
    if (email) u.email = email;
    if (phone) u.Phone = phone;
    if (password) u.password = await bcrypt.hash(password, 10);
    await u.save();
    return { id: u.GuestID, name: `${u.First_Name} ${u.Last_Name}`, email: u.email, phone: u.Phone, role: 'guest' };
  }
  if (role === 'receptionist') {
    const u = await Receptionist.findByPk(id);
    if (!u) throw new Error('User not found');
    if (name) u.Name = name;
    if (email) u.Email = email;
    if (password) u.Password = await bcrypt.hash(password, 10);
    await u.save();
    return { id: u.Receptionist_ID, name: u.Name, email: u.Email, role: 'receptionist' };
  }
  if (role === 'admin') {
    const u = await Administrator.findByPk(id);
    if (!u) throw new Error('User not found');
    if (name) u.Name = name;
    if (email) u.Email = email;
    if (password) u.Password = await bcrypt.hash(password, 10);
    await u.save();
    return { id: u.Administrator_ID, name: u.Name, email: u.Email, role: 'admin' };
  }
  throw new Error('Unknown role');
};

module.exports = { login, register, getProfile, updateProfile };
