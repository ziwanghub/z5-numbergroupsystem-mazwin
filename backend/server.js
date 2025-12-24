require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
  console.log(`\n🚀 Z-MOS Engine Initialized...`);
  console.log(`📡 Server running on: http://localhost:${PORT}\n`);
  console.log(` Mode: ${process.env.NODE_ENV}\n`);
});