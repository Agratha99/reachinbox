import axios from 'axios';

const normalizeApiBaseUrl = (baseUrl: string) => {
    const trimmed = baseUrl.replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const getApiBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) {
        return normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
    }
    if (typeof window !== 'undefined') {
        const { protocol, hostname } = window.location;
        return `${protocol}//${hostname}:5000/api`;
    }
    return 'http://localhost:5000/api';
};

export const apiClient = axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

apiClient.interceptors.request.use((config) => {
    if (!process.env.NEXT_PUBLIC_API_URL && typeof window !== 'undefined') {
        const { protocol, hostname } = window.location;
        config.baseURL = `${protocol}//${hostname}:5000/api`;
    }
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('reachinbox_auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('reachinbox_auth_token');
            localStorage.removeItem('reachinbox_user');
            if (!window.location.pathname.startsWith('/login')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);
