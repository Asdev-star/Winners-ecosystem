const API_URL = 'https://winners-empire.up.railway.app/api';

export const api = {
  get: async (endpoint: string, token?: string) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
    return response.json();
  },
  post: async (endpoint: string, data: any, token?: string) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};