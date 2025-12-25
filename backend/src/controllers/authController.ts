import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { logEvent } from '../services/auditService';

// Registration Controller
export const register = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            res.status(400).json({
                success: false,
                error: 'AUTH_INVALID_INPUT',
                message: 'Username and password are required',
            });
            return;
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            res.status(400).json({
                success: false,
                error: 'AUTH_USER_ALREADY_EXISTS',
                message: 'Invalid registration data',
            });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            password: hashedPassword,
        });

        await newUser.save();

        await logEvent(req, {
            event: 'AUTH_REGISTER_SUCCESS',
            level: 'INFO',
            userId: newUser._id
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
        });
    } catch (err: any) {
        await logEvent(req, {
            event: 'SYSTEM_ERROR',
            level: 'CRITICAL',
            metadata: { error: err.message, stack: err.stack }
        });
        res.status(500).json({
            success: false,
            error: 'AUTH_INTERNAL_ERROR',
            message: 'Authentication failed',
        });
    }
};


// Login Controller
export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            res.status(400).json({
                success: false,
                error: 'AUTH_INVALID_INPUT',
                message: 'Username and password are required',
            });
            return;
        }

        const user = await User.findOne({ username });
        if (!user) {
            await logEvent(req, {
                event: 'AUTH_LOGIN_FAIL',
                level: 'WARNING',
                metadata: { reason: 'User not found', username }
            });
            res.status(400).json({
                success: false,
                error: 'AUTH_INVALID_CREDENTIALS',
                message: 'Invalid login credentials',
            });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password as string);
        if (!isMatch) {
            await logEvent(req, {
                event: 'AUTH_LOGIN_FAIL',
                level: 'WARNING',
                userId: user._id,
                metadata: { reason: 'Invalid password' }
            });
            res.status(400).json({
                success: false,
                error: 'AUTH_INVALID_CREDENTIALS',
                message: 'Invalid login credentials',
            });
            return;
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: '24h' }
        );

        res.cookie('auth_token', token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: false, // Set to true in production
            maxAge: 24 * 60 * 60 * 1000,
        });

        await logEvent(req, {
            event: 'AUTH_LOGIN_SUCCESS',
            level: 'INFO',
            userId: user._id
        });

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
            },
        });

    } catch (err: any) {
        console.error('LOGIN ERROR:', err);
        await logEvent(req, {
            event: 'SYSTEM_ERROR',
            level: 'CRITICAL',
            metadata: { error: err.message, stack: err.stack }
        });
        res.status(500).json({
            success: false,
            error: 'AUTH_INTERNAL_ERROR',
            message: 'Authentication failed',
        });
    }
};

// Get Current User (สำหรับ /me endpoint)
export const getMe = async (req: Request, res: Response) => {
    try {
        // req.user มาจาก authMiddleware (assumed valid if middleware passes)
        const userId = (req.user as any).id;
        const user = await User.findById(userId).select('-password');

        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (err) {
        console.error('GET_ME ERROR:', err);
        res.status(500).json({ success: false, error: 'SERVER_ERROR' });
    }
};

// Logout (สำหรับ /logout endpoint)
export const logout = async (req: Request, res: Response) => {
    try {
        // Audit Log: บันทึกว่ามีการ Logout
        await logEvent(req, { event: 'AUTH_LOGOUT' });
    } catch (e) {
        console.error('Logout Audit Error:', e);
    }

    // Clear Cookie: ตั้งเวลาให้หมดอายุทันที
    res.cookie('auth_token', '', {
        httpOnly: true,
        expires: new Date(0)
    });

    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
};
