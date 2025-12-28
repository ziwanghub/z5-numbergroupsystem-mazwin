import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db';
import { seedFormulas } from '../utils/seedFormulas';

dotenv.config({
    path: process.env.NODE_ENV === 'production'
        ? '.env'
        : '.env.local'
});

const run = async () => {
    try {
        await connectDB();
        await seedFormulas();
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Seeder failed:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
};

void run();
