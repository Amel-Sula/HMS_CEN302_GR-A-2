require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { sequelize, Guest, Receptionist, Administrator, RoomType, Room, Payment, Reservation, MaintenanceRequest } = require('../models');

const hash = (p) => bcrypt.hash(p, 10);

async function seed() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  console.log('DB connected and synced');

  // ── Administrators ────────────────────────────────────────────────────────────
  const [admin] = await Administrator.findOrCreate({
    where: { Email: 'admin@hotel.com' },
    defaults: { Name: 'Admin User', Password: await hash('password123') },
  });
  console.log('Admin seeded');

  // ── Receptionists ─────────────────────────────────────────────────────────────
  const [receptionist] = await Receptionist.findOrCreate({
    where: { Email: 'receptionist@hotel.com' },
    defaults: { Name: 'Jane Smith', Password: await hash('password123'), Shift_Type: 'morning' },
  });
  console.log('Receptionist seeded');

  // ── Guests ────────────────────────────────────────────────────────────────────
  const guestData = [
    { First_Name: 'John',  Last_Name: 'Doe',     email: 'john@example.com',  Phone: '555-1001' },
    { First_Name: 'Alice', Last_Name: 'Johnson',  email: 'alice@example.com', Phone: '555-1002' },
    { First_Name: 'Bob',   Last_Name: 'Williams', email: 'bob@example.com',   Phone: '555-1003' },
    { First_Name: 'Maria', Last_Name: 'Garcia',   email: 'maria@example.com', Phone: '555-1004' },
    { First_Name: 'Wei',   Last_Name: 'Chen',     email: 'wei@example.com',   Phone: '555-1005' },
    { First_Name: 'Sara',  Last_Name: 'Ahmed',    email: 'sara@example.com',  Phone: '555-1006' },
  ];

  const guests = [];
  for (const g of guestData) {
    const [guest] = await Guest.findOrCreate({
      where: { email: g.email },
      defaults: { ...g, password: await hash('password123'), Registration_Date: new Date() },
    });
    guests.push(guest);
  }
  console.log('Guests seeded');

  // ── Room Types ────────────────────────────────────────────────────────────────
  const [single] = await RoomType.findOrCreate({
    where: { Category_Name: 'Single' },
    defaults: { Base_Price: 59, Amenities_Description: 'WiFi, TV, AC, Single Bed', Capacity: 1 },
  });
  const [double] = await RoomType.findOrCreate({
    where: { Category_Name: 'Double' },
    defaults: { Base_Price: 99, Amenities_Description: 'WiFi, TV, AC, Double Bed, Mini Fridge', Capacity: 2 },
  });
  const [suite] = await RoomType.findOrCreate({
    where: { Category_Name: 'Suite' },
    defaults: { Base_Price: 199, Amenities_Description: 'WiFi, TV, AC, King Bed, Jacuzzi, Lounge Area, Mini Bar', Capacity: 4 },
  });
  console.log('Room types seeded');

  // ── Rooms ─────────────────────────────────────────────────────────────────────
  const roomsData = [
    { Room_Number: '101', Floor: 1, Type_ID: single.Type_ID, price: 59,  Status: 'available' },
    { Room_Number: '102', Floor: 1, Type_ID: single.Type_ID, price: 59,  Status: 'occupied' },
    { Room_Number: '103', Floor: 1, Type_ID: single.Type_ID, price: 45,  Status: 'available' },
    { Room_Number: '201', Floor: 2, Type_ID: double.Type_ID, price: 99,  Status: 'available' },
    { Room_Number: '202', Floor: 2, Type_ID: double.Type_ID, price: 99,  Status: 'available' },
    { Room_Number: '203', Floor: 2, Type_ID: double.Type_ID, price: 119, Status: 'occupied' },
    { Room_Number: '204', Floor: 2, Type_ID: double.Type_ID, price: 89,  Status: 'available' },
    { Room_Number: '301', Floor: 3, Type_ID: suite.Type_ID,  price: 189, Status: 'available' },
    { Room_Number: '302', Floor: 3, Type_ID: suite.Type_ID,  price: 249, Status: 'maintenance' },
  ];

  const rooms = {};
  for (const r of roomsData) {
    const [room] = await Room.findOrCreate({ where: { Room_Number: r.Room_Number }, defaults: r });
    // Ensure status is correct even if it was already created
    await room.update({ Status: r.Status, price: r.price });
    rooms[r.Room_Number] = room;
  }
  console.log('Rooms seeded');

  // ── Reservations ──────────────────────────────────────────────────────────────
  const today = new Date();
  const d = (offset) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + offset);
    return dt.toISOString().split('T')[0];
  };

  const reservationsData = [
    // Completed past reservation
    { Check_In_Date: d(-10), Check_Out_Date: d(-7),  Status: 'completed',  GuestID: guests[0].GuestID, Room_ID: rooms['101'].Room_ID, Total_Price: 59 * 3,  Receptionist_ID: receptionist.Receptionist_ID },
    // Active checked-in — room 102
    { Check_In_Date: d(-2),  Check_Out_Date: d(3),   Status: 'checked-in', GuestID: guests[1].GuestID, Room_ID: rooms['102'].Room_ID, Total_Price: 59 * 5,  Receptionist_ID: receptionist.Receptionist_ID },
    // Confirmed future
    { Check_In_Date: d(5),   Check_Out_Date: d(8),   Status: 'confirmed',  GuestID: guests[2].GuestID, Room_ID: rooms['201'].Room_ID, Total_Price: 99 * 3 },
    // Active checked-in — room 203
    { Check_In_Date: d(-1),  Check_Out_Date: d(2),   Status: 'checked-in', GuestID: guests[3].GuestID, Room_ID: rooms['203'].Room_ID, Total_Price: 119 * 3, Receptionist_ID: receptionist.Receptionist_ID },
    // Cancelled
    { Check_In_Date: d(2),   Check_Out_Date: d(5),   Status: 'cancelled',  GuestID: guests[4].GuestID, Room_ID: rooms['204'].Room_ID, Total_Price: 89 * 3 },
    // Completed
    { Check_In_Date: d(-15), Check_Out_Date: d(-12), Status: 'completed',  GuestID: guests[5].GuestID, Room_ID: rooms['301'].Room_ID, Total_Price: 189 * 3, Receptionist_ID: receptionist.Receptionist_ID },
    // Upcoming confirmed
    { Check_In_Date: d(10),  Check_Out_Date: d(14),  Status: 'confirmed',  GuestID: guests[0].GuestID, Room_ID: rooms['202'].Room_ID, Total_Price: 99 * 4 },
  ];

  for (const res of reservationsData) {
    await Reservation.findOrCreate({
      where: {
        GuestID: res.GuestID,
        Room_ID: res.Room_ID,
        Check_In_Date: res.Check_In_Date,
      },
      defaults: res,
    });
  }
  console.log('Reservations seeded');

  // ── Maintenance Request ───────────────────────────────────────────────────────
  await MaintenanceRequest.findOrCreate({
    where: { Room_ID: rooms['302'].Room_ID, Status: 'pending' },
    defaults: {
      Issue_Description: 'Jacuzzi pump failure and water leak in bathroom',
      Priority_Level: 'high',
      Status: 'pending',
      Date_Reported: new Date(),
      Cost_Estimate: 450.00,
      Room_ID: rooms['302'].Room_ID,
      Administrator_ID: admin.Administrator_ID,
    },
  });
  console.log('Maintenance request seeded');

  console.log('\nSeed complete!');
  console.log('  Admin:         admin@hotel.com        / password123');
  console.log('  Receptionist:  receptionist@hotel.com / password123');
  console.log('  Guests:        john@example.com, alice@example.com, bob@example.com,');
  console.log('                 maria@example.com, wei@example.com, sara@example.com / password123');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
