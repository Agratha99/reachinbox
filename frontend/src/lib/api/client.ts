import axios from 'axios';

const normalizeApiBaseUrl = (baseUrl: string) => {
    const trimmed = baseUrl.replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const isLanOrLocalhost = (hostname: string) => {
    if (!hostname) return false;
    return (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.endsWith('.local') ||
        /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
        /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)
    );
};

const getApiBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) {
        return normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
    }
    if (typeof window !== 'undefined') {
        const { protocol, hostname } = window.location;
        // On LAN IPs or localhost, hit port 5000
        if (isLanOrLocalhost(hostname)) {
            return `${protocol}//${hostname}:5000/api`;
        }
        // On hosted platforms (Netlify/Vercel), use relative '/api' endpoint to prevent HTTPS mixed-content network errors
        return '/api';
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
    if (!config.baseURL || config.baseURL === '/' || config.baseURL.includes('undefined')) {
        config.baseURL = getApiBaseUrl();
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
