require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { sequelize } = require('./models');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth',         require('./routes/auth'));
app.use('/api/rooms',        require('./routes/rooms'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/admin',        require('./routes/admin'));

app.get('/api', (req, res) =>
  res.json({
    name: 'HMS API',
    version: '1.0.0',
    status: 'running',
    endpoints: ['/api/auth', '/api/rooms', '/api/reservations', '/api/admin'],
  })
);

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Tables synced');
    }

    app.listen(PORT, () => console.log(`HMS API running on http://localhost:${PORT}/api`));
  } catch (err) {
    console.error('Startup failed:', err.message);
    process.exit(1);
  }
};

start();
