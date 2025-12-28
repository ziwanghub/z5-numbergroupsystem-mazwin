import axios from "axios";

const API_URL = "/api/v1/formulas";

export interface Formula {
    formulaId: string;
    displayName: string;
    description: string;
    tags: string[];
    versions: any[];
    updatedAt: string;
}

export const formulaService = {
    getAll: async (): Promise<Formula[]> => {
        const response = await axios.get(API_URL);
        return response.data.data;
    },

    create: async (data: { formulaId: string; displayName: string; description: string; tags: string[] }) => {
        const response = await axios.post(API_URL, data);
        return response.data;
    },

    updateStatus: async (formulaId: string, version: string, status: 'active' | 'draft' | 'deprecated') => {
        const response = await axios.patch(`${API_URL}/${formulaId}/versions/${version}/status`, { status });
        return response.data;
    }
};
