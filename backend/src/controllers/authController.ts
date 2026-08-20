import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../db/prisma';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

const JWT_SECRET = process.env.JWT_SECRET || 'reachinbox_super_secret_jwt_key_2026';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const oAuth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL);

/**
 * Returns Google OAuth 2.0 Authorization URL if Client ID exists
 */
export async function getGoogleOAuthUrl(req: Request, res: Response) {
    if (!GOOGLE_CLIENT_ID) {
        return res.json({
            authUrl: null,
            configured: false,
            message: 'Google Client ID not configured. Use interactive Google account sign in.',
        });
    }

    const url = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: [
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
        ],
    });

    return res.json({ authUrl: url, configured: true });
}

/**
 * Google OAuth 2.0 Callback Handler
 */
export async function googleOAuthCallback(req: Request, res: Response) {
    try {
        const code = req.query.code as string;
        if (!code) {
            return res.redirect(`${FRONTEND_URL}/login?error=no_code`);
        }

        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);

        if (!tokens.id_token) {
            return res.redirect(`${FRONTEND_URL}/login?error=no_id_token`);
        }

        const ticket = await oAuth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res.redirect(`${FRONTEND_URL}/login?error=invalid_payload`);
        }

        const userEmail = payload.email;
        const userName = payload.name || userEmail.split('@')[0];
        const userAvatar = payload.picture || undefined;
        const googleId = payload.sub;

        let user = await prisma.user.findUnique({
            where: { email: userEmail },
            include: { senders: true },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: userEmail,
                    name: userName,
                    avatarUrl: userAvatar,
                    googleId,
                    senders: {
                        create: [
                            {
                                email: userEmail,
                                displayName: userName,
                                isDefault: true,
                            },
                        ],
                    },
                },
                include: { senders: true },
            });
        } else if (userAvatar && user.avatarUrl !== userAvatar) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: { avatarUrl: userAvatar, name: userName },
                include: { senders: true },
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                name: user.name,
                avatarUrl: user.avatarUrl,
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.redirect(`${FRONTEND_URL}/dashboard/scheduled?token=${token}`);
    } catch (err: any) {
        console.error('[Google OAuth Callback Error]:', err.message);
        return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    }
}

/**
 * Direct ID Token / Google Account Authentication Endpoint
 */
export async function googleAuth(req: Request, res: Response) {
    try {
        const { idToken, email, name, avatarUrl, avatar, googleId } = req.body;

        let userEmail = email;
        let userName = name;
        let userAvatar = avatarUrl || avatar;
        let userGoogleId = googleId;

        if (idToken && GOOGLE_CLIENT_ID) {
            const ticket = await oAuth2Client.verifyIdToken({
                idToken,
                audience: GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            if (payload) {
                userEmail = payload.email || userEmail;
                userName = payload.name || userName;
                userAvatar = payload.picture || userAvatar;
                userGoogleId = payload.sub || userGoogleId;
            }
        }

        userEmail = userEmail || 'oliver.brown@domain.io';
        userName = userName || 'Oliver Brown';

        if (!userAvatar) {
            userAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0D9488&color=fff&bold=true`;
        }

        let user = await prisma.user.findUnique({
            where: { email: userEmail },
            include: { senders: true },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: userEmail,
                    name: userName,
                    avatarUrl: userAvatar,
                    googleId: userGoogleId || `google_${Date.now()}`,
                    senders: {
                        create: [
                            {
                                email: userEmail,
                                displayName: userName,
                                isDefault: true,
                            },
                        ],
                    },
                },
                include: { senders: true },
            });
        } else {
            // Update existing user's name & avatar if customized
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    name: userName,
                    avatarUrl: userAvatar,
                },
                include: { senders: true },
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                name: user.name,
                avatarUrl: user.avatarUrl,
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatarUrl: user.avatarUrl,
                avatar: user.avatarUrl,
                senders: user.senders,
            },
        });
    } catch (err: any) {
        console.error('Google Auth Error:', err);
        return res.status(500).json({ error: 'Failed to authenticate user.' });
    }
}

export async function getCurrentUser(req: AuthenticatedRequest, res: Response) {
    try {
        if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { senders: true },
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        return res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                avatarUrl: user.avatarUrl,
                avatar: user.avatarUrl,
                senders: user.senders,
            },
        });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to get user profile' });
    }
}

export async function logout(req: Request, res: Response) {
    res.clearCookie('token');
    return res.json({ message: 'Successfully logged out.' });
}
