import { apiClient } from './client';
import { User } from '@/types';

export async function getGoogleOAuthUrl(): Promise<{ authUrl?: string; configured?: boolean } | null> {
    try {
        const response = await apiClient.get('/auth/google/url');
        return response.data;
    } catch (err) {
        return null;
    }
}

export async function loginWithGoogle(payload?: { email?: string; name?: string; avatar?: string; idToken?: string }) {
    const response = await apiClient.post('/auth/google', payload || {});
    const { token, user } = response.data;
    if (typeof window !== 'undefined') {
        localStorage.setItem('reachinbox_auth_token', token);
        localStorage.setItem('reachinbox_user', JSON.stringify(user));
    }
    return { token, user: user as User };
}

export async function getCurrentUser(): Promise<User | null> {
    try {
        const response = await apiClient.get('/auth/me');
        return response.data.user;
    } catch (err) {
        return null;
    }
}

export async function logoutUser() {
    try {
        await apiClient.post('/auth/logout');
    } catch (err) {
        // Ignore error on logout
    } finally {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('reachinbox_auth_token');
            localStorage.removeItem('reachinbox_user');
            window.location.href = '/login';
        }
    }
}
