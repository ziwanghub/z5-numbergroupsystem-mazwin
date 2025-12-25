// path: z5-numbergroupsystem-mazwin-v1/z5-nbg-zw-v1.0/backend/src/routes/authRoutes.js
const express = require('express');
const routes = express.Router();

const {
    register,
    login,
} = require('../controllers/authController');

const authMiddleware = require('../middleware/authMiddleware');

// Public auth actions
routes.post('/register', register);
routes.post('/login', login);

// Session authority endpoint
routes.get('/me', authMiddleware, (req, res) => {
    return res.status(200).json({
        success: true,
        user: req.user,
    });
});


module.exports = routes;