const { SystemLog } = require('../models');

const logAction = async (description, userId, userRole, adminId = null) => {
  try {
    await SystemLog.create({
      Activity_Description: description,
      Timestamp: new Date(),
      user_id: userId,
      user_role: userRole,
      Administrator_ID: userRole === 'admin' ? adminId || userId : null,
    });
  } catch (err) {
    console.error('Log write failed:', err.message);
  }
};

module.exports = { logAction };
