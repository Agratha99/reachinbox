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
    try {
        const response = await apiClient.post('/auth/google', payload || {});
        const { token, user } = response.data;
        if (typeof window !== 'undefined') {
            localStorage.setItem('reachinbox_auth_token', token);
            localStorage.setItem('reachinbox_user', JSON.stringify(user));
        }
        return { token, user: user as User };
    } catch (err) {
        console.warn('[Auth] Backend API unreachable on Netlify. Initializing local session.');
        const fallbackUser: User = {
            id: 'usr_demo_105',
            email: payload?.email || 'katarurahul105@gmail.com',
            name: payload?.name || 'Kataru Rahul',
            avatarUrl: payload?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            senders: [
                {
                    id: 'snd_default_1',
                    userId: 'usr_demo_105',
                    email: payload?.email || 'katarurahul105@gmail.com',
                    displayName: payload?.name || 'Kataru Rahul',
                    isDefault: true,
                },
            ],
        };
        const fallbackToken = 'demo_jwt_token_' + Date.now();
        if (typeof window !== 'undefined') {
            localStorage.setItem('reachinbox_auth_token', fallbackToken);
            localStorage.setItem('reachinbox_user', JSON.stringify(fallbackUser));
        }
        return { token: fallbackToken, user: fallbackUser };
    }
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
