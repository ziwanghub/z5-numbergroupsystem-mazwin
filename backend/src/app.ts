import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes';
import formulaRoutes from './routes/formulaRoutes';
import recipeRoutes from './routes/recipeRoutes';
import adminRoutes from './routes/adminRoutes';
import ticketRoutes from './routes/ticketRoutes';
import reviewRoutes from './routes/reviewRoutes'; // [NEW]

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev'));
app.use(cookieParser());

// Health Check Route
app.get('/', (req, res) => {
    res.status(200).json({
        system: 'Z-MOS v5.0 Kernel',
        status: 'ONLINE',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/formulas', formulaRoutes);
app.use('/api/recipes', recipeRoutes);

export default app;
