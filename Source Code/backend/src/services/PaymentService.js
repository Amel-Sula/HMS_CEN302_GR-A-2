const { Payment, Reservation } = require('../models');

const getByReservation = (reservationId) =>
  Payment.findAll({ where: { '$reservation.Reservation_ID$': reservationId }, include: [{ model: Reservation, as: 'reservation' }] }).catch(() =>
    // fallback: get payment linked from reservation
    Reservation.findByPk(reservationId).then((r) =>
      r && r.Payment_ID ? Payment.findAll({ where: { Payment_ID: r.Payment_ID } }) : []
    )
  );

const createForReservation = async (reservationId, data, receptionistId) => {
  const payment = await Payment.create({
    Amount: data.amount,
    Payment_Date: data.date || new Date(),
    Payment_Method: data.method || 'cash',
    Status: 'completed',
    Receptionist_ID: receptionistId,
  });

  await Reservation.update({ Payment_ID: payment.Payment_ID }, { where: { Reservation_ID: reservationId } });
  return payment;
};

module.exports = { getByReservation, createForReservation };
