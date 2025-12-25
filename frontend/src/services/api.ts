// src/services/api.js
import axios from 'axios';

// Base URL for the API
const api = axios.create({
    baseURL: 'http://localhost:5001',
    headers: {
        'Content-Type': 'application/json'
    },
});

export default api;