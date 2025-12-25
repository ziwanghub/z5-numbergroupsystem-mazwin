// path: z5-numbergroupsystem-mazwin-v1/z5-nbg-zw-v1.0/backend/src/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            default: 'user',
        },
    },
    {
        versionKey: false,
        timestamps: true,
        strict: true,
    }
);

module.exports = mongoose.model('User', UserSchema);