// path: z5-numbergroupsystem-mazwin-v1/z5-nbg-zw-v1.0/backend/server.js
require('dotenv').config();

// FAIL-FAST CONFIG GUARD (MANDATORY)
if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET is not defined');
    process.exit(1);
}

const app = require('./src/app');
const connectDB = require('./src/config/db');
const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
  console.log(`\n🚀 Z-MOS Engine Initialized...`);
  console.log(`📡 Server running on: http://localhost:${PORT}\n`);
  console.log(` Mode: ${process.env.NODE_ENV}\n`);
});