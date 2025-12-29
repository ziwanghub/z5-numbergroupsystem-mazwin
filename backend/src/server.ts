import dotenv from 'dotenv';
const envPath = process.env.NODE_ENV === 'production'
    ? '.env'
    : (require('fs').existsSync('.env.local') ? '.env.local' : '.env');

dotenv.config({ path: envPath });

import app from './app';
import connectDB from './config/db';

// ✅ FAIL-FAST CONFIG GUARD
if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET is not defined in .env');
    process.exit(1);
}

// ============================================
// ERROR HANDLER
// ============================================
app.use((err: any, req: any, res: any, next: any) => {
    console.error('SERVER ERROR:', err.stack);
    res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: err.message || 'Something went wrong'
    });
});

// ============================================
// SERVER INIT (Restore DB & Listen)
// ============================================
const PORT = process.env.PORT || 5001;

// Connect to DB first, then start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`\n🚀 Z-MOS Engine Initialized...`);
        console.log(`📡 Server running on: http://localhost:${PORT}`);
        console.log(`🔗 CORS Origin: http://localhost:5173\n`);
    });
}).catch(err => {
    console.error('FATAL: Database Connection Failed', err);
    process.exit(1);
});
