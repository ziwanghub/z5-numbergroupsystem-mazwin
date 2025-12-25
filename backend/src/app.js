// path: z5-numbergroupsystem-mazwin-v1/z5-nbg-zw-v1.0/backend/src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');

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

const cookieParser = require('cookie-parser');
app.use(cookieParser());

// Routes
app.use('/api/v1/auth', authRoutes);

module.exports = app;