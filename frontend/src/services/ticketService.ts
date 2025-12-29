
import axios from 'axios';

const API_URL = '/api/tickets';

// Reusing the same axios/header logic as adminService/authService
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface TicketData {
    title: string;
    description: string;
    category: string;
    severity?: string;
    snapshot?: any;
}

export const ticketService = {
    createTicket: async (data: TicketData) => {
        try {
            const response = await api.post('/', data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { message: 'Network Error' };
        }
    },

    getMyTickets: async () => {
        try {
            const response = await api.get('/');
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { message: 'Network Error' };
        }
    },

    replyTicket: async (id: string, message: string, isInternal: boolean = false) => {
        try {
            const response = await api.post(`/${id}/reply`, { content: message, isInternal });
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { message: 'Network Error' };
        }
    }
};
