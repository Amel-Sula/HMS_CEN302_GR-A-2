require('dotenv').config();
const { sequelize } = require('./models');

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    console.log('All tables created (force sync)');
    process.exit(0);
  } catch (err) {
    console.error('Sync failed:', err.message);
    process.exit(1);
  }
})();
