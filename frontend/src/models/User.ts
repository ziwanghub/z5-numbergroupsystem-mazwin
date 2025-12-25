const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['Super Admin', 'Admin', 'Operator', 'User', 'Viewer'],
        default: 'Viewer'
    },
    lastLogin: {
        type: Date,
        default: null
    }
    }, {
        timestamps: true
});
module.exports = mongoose.model('User', userSchema);