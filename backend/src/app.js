const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health Check Route
app.get('/', (req, res) => {
  res.status(200).json({
    system: 'Z-MOS v5.0 Kernel',
    status: 'ONLINE',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;