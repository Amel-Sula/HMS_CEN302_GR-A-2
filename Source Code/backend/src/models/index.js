const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// ── Guest ──────────────────────────────────────────────────────────────────────
const Guest = sequelize.define('Guest', {
  GuestID:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  First_Name:        { type: DataTypes.STRING, allowNull: false },
  Last_Name:         { type: DataTypes.STRING, allowNull: false },
  Phone:             { type: DataTypes.STRING },
  Address:           { type: DataTypes.STRING },
  Registration_Date: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  email:             { type: DataTypes.STRING, allowNull: false, unique: true },
  password:          { type: DataTypes.STRING, allowNull: false },
}, { tableName: 'Guests', timestamps: false });

// ── Receptionist ───────────────────────────────────────────────────────────────
const Receptionist = sequelize.define('Receptionist', {
  Receptionist_ID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Name:            { type: DataTypes.STRING, allowNull: false },
  Email:           { type: DataTypes.STRING, allowNull: false, unique: true },
  Password:        { type: DataTypes.STRING, allowNull: false },
  Shift_Type:      { type: DataTypes.ENUM('morning', 'evening', 'night'), defaultValue: 'morning' },
}, { tableName: 'Receptionists', timestamps: false });

// ── Administrator ──────────────────────────────────────────────────────────────
const Administrator = sequelize.define('Administrator', {
  Administrator_ID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Email:            { type: DataTypes.STRING, allowNull: false, unique: true },
  Name:             { type: DataTypes.STRING, allowNull: false },
  Password:         { type: DataTypes.STRING, allowNull: false },
}, { tableName: 'Administrators', timestamps: false });

// ── RoomType ───────────────────────────────────────────────────────────────────
const RoomType = sequelize.define('RoomType', {
  Type_ID:                 { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Category_Name:           { type: DataTypes.STRING, allowNull: false },
  Base_Price:              { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  Amenities_Description:   { type: DataTypes.TEXT },
  Capacity:                { type: DataTypes.INTEGER, defaultValue: 2 },
}, { tableName: 'RoomTypes', timestamps: false });

// ── Room ───────────────────────────────────────────────────────────────────────
const Room = sequelize.define('Room', {
  Room_ID:     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Room_Number: { type: DataTypes.STRING, allowNull: false, unique: true },
  Floor:       { type: DataTypes.INTEGER },
  Status:      { type: DataTypes.ENUM('available', 'occupied', 'maintenance'), defaultValue: 'available' },
  Type_ID:     { type: DataTypes.INTEGER, allowNull: false, references: { model: 'RoomTypes', key: 'Type_ID' } },
  price:       { type: DataTypes.DECIMAL(10, 2) },
}, { tableName: 'Rooms', timestamps: false });

// ── Payment ────────────────────────────────────────────────────────────────────
const Payment = sequelize.define('Payment', {
  Payment_ID:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Amount:          { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  Payment_Date:    { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  Payment_Method:  { type: DataTypes.ENUM('cash', 'credit_card', 'debit_card', 'bank_transfer'), defaultValue: 'cash' },
  Status:          { type: DataTypes.ENUM('pending', 'completed', 'refunded'), defaultValue: 'pending' },
  Receptionist_ID: { type: DataTypes.INTEGER, references: { model: 'Receptionists', key: 'Receptionist_ID' } },
}, { tableName: 'Payments', timestamps: false });

// ── Reservation ────────────────────────────────────────────────────────────────
const Reservation = sequelize.define('Reservation', {
  Reservation_ID:  { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Check_In_Date:   { type: DataTypes.DATEONLY, allowNull: false },
  Check_Out_Date:  { type: DataTypes.DATEONLY, allowNull: false },
  Total_Price:     { type: DataTypes.DECIMAL(10, 2) },
  Status:          { type: DataTypes.ENUM('confirmed', 'checked-in', 'completed', 'cancelled'), defaultValue: 'confirmed' },
  notes:           { type: DataTypes.TEXT },
  GuestID:         { type: DataTypes.INTEGER, references: { model: 'Guests', key: 'GuestID' } },
  Room_ID:         { type: DataTypes.INTEGER, references: { model: 'Rooms', key: 'Room_ID' } },
  Payment_ID:      { type: DataTypes.INTEGER, references: { model: 'Payments', key: 'Payment_ID' } },
  Receptionist_ID: { type: DataTypes.INTEGER, references: { model: 'Receptionists', key: 'Receptionist_ID' } },
}, { tableName: 'Reservations', timestamps: false });

// ── MaintenanceRequest ─────────────────────────────────────────────────────────
const MaintenanceRequest = sequelize.define('MaintenanceRequest', {
  Request_ID:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Issue_Description: { type: DataTypes.TEXT, allowNull: false },
  Priority_Level:    { type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'), defaultValue: 'medium' },
  Status:            { type: DataTypes.ENUM('pending', 'in_progress', 'resolved'), defaultValue: 'pending' },
  Date_Reported:     { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  Cost_Estimate:     { type: DataTypes.DECIMAL(10, 2) },
  Room_ID:           { type: DataTypes.INTEGER, references: { model: 'Rooms', key: 'Room_ID' } },
  Receptionist_ID:   { type: DataTypes.INTEGER, references: { model: 'Receptionists', key: 'Receptionist_ID' } },
  Administrator_ID:  { type: DataTypes.INTEGER, references: { model: 'Administrators', key: 'Administrator_ID' } },
}, { tableName: 'MaintenanceRequests', timestamps: false });

// ── SystemLog ──────────────────────────────────────────────────────────────────
const SystemLog = sequelize.define('SystemLog', {
  Log_ID:               { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Activity_Description: { type: DataTypes.TEXT, allowNull: false },
  Timestamp:            { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  Administrator_ID:     { type: DataTypes.INTEGER, references: { model: 'Administrators', key: 'Administrator_ID' } },
  user_id:              { type: DataTypes.INTEGER },
  user_role:            { type: DataTypes.STRING },
}, { tableName: 'SystemLogs', timestamps: false });

// ── Report ─────────────────────────────────────────────────────────────────────
const Report = sequelize.define('Report', {
  Report_ID:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Report_Type:      { type: DataTypes.STRING, allowNull: false },
  Generated_Date:   { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  Time_Period:      { type: DataTypes.STRING },
  Data_Content:     { type: DataTypes.JSONB },
  Administrator_ID: { type: DataTypes.INTEGER, references: { model: 'Administrators', key: 'Administrator_ID' } },
}, { tableName: 'Reports', timestamps: false });

// ── Associations ───────────────────────────────────────────────────────────────
Room.belongsTo(RoomType,       { foreignKey: 'Type_ID',          as: 'roomType' });
RoomType.hasMany(Room,         { foreignKey: 'Type_ID' });

Reservation.belongsTo(Guest,        { foreignKey: 'GuestID',         as: 'guest' });
Reservation.belongsTo(Room,         { foreignKey: 'Room_ID',          as: 'room' });
Reservation.belongsTo(Payment,      { foreignKey: 'Payment_ID',       as: 'payment' });
Reservation.belongsTo(Receptionist, { foreignKey: 'Receptionist_ID',  as: 'receptionist' });

Guest.hasMany(Reservation,          { foreignKey: 'GuestID' });
Room.hasMany(Reservation,           { foreignKey: 'Room_ID' });
Payment.hasOne(Reservation,         { foreignKey: 'Payment_ID' });
Receptionist.hasMany(Reservation,   { foreignKey: 'Receptionist_ID' });

Payment.belongsTo(Receptionist,     { foreignKey: 'Receptionist_ID',  as: 'receptionist' });

MaintenanceRequest.belongsTo(Room,           { foreignKey: 'Room_ID',          as: 'room' });
MaintenanceRequest.belongsTo(Receptionist,   { foreignKey: 'Receptionist_ID',  as: 'receptionist' });
MaintenanceRequest.belongsTo(Administrator,  { foreignKey: 'Administrator_ID', as: 'administrator' });

SystemLog.belongsTo(Administrator,  { foreignKey: 'Administrator_ID', as: 'administrator' });
Report.belongsTo(Administrator,     { foreignKey: 'Administrator_ID', as: 'administrator' });

module.exports = {
  sequelize,
  Guest,
  Receptionist,
  Administrator,
  RoomType,
  Room,
  Payment,
  Reservation,
  MaintenanceRequest,
  SystemLog,
  Report,
};
