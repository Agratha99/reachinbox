'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleOAuthProvider, GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { loginWithGoogle } from '@/lib/api/auth';
import { AlertCircle } from 'lucide-react';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '160156035669-dqgggnb33uongpp7raa8jfam4rrm0c56.apps.googleusercontent.com';

function LoginContent() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Official Google OAuth Popup with Account Chooser ('select_account')
    const triggerGooglePopup = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            setErrorMsg('');
            try {
                // Fetch real user info from Google's OAuth API
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const googleUser = await userInfoRes.json();

                if (!googleUser.email) {
                    throw new Error('Could not retrieve email from Google account.');
                }

                await loginWithGoogle({
                    email: googleUser.email,
                    name: googleUser.name || googleUser.given_name || googleUser.email.split('@')[0],
                    avatar: googleUser.picture,
                    idToken: tokenResponse.access_token,
                });

                router.push('/dashboard/scheduled');
            } catch (err: any) {
                console.error('Google OAuth error:', err);
                setErrorMsg('Google login failed. Please try selecting your account again.');
            } finally {
                setLoading(false);
            }
        },
        onError: () => {
            setErrorMsg('Google Sign-In was cancelled or failed.');
            setLoading(false);
        },
        prompt: 'select_account',
    });

    return (
        <div className="min-h-screen ios-bg-mesh flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
            {/* Animated Background Spheres */}
            <div className="ios-light-orb-1" />
            <div className="ios-light-orb-2" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 text-white font-extrabold text-3xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30 mb-4 tracking-tight">
                    R
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                    Sign in to ReachInbox
                </h2>
                <p className="text-xs text-gray-500 mt-1">Official Google OAuth Authentication</p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
                <div className="ios-glass py-8 px-6 shadow-2xl rounded-3xl sm:px-10 space-y-6 border border-white/80">
                    {errorMsg && (
                        <div className="bg-red-500/10 text-red-700 p-3 rounded-2xl border border-red-500/20 text-xs flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Official Google Sign-In Button Component */}
                        <div className="w-full flex justify-center">
                            <GoogleLogin
                                onSuccess={async (credentialResponse) => {
                                    if (credentialResponse.credential) {
                                        setLoading(true);
                                        try {
                                            // Decode Google JWT ID token payload
                                            const base64Url = credentialResponse.credential.split('.')[1];
                                            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                                            const jsonPayload = decodeURIComponent(
                                                atob(base64)
                                                    .split('')
                                                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                                                    .join('')
                                            );
                                            const googleUser = JSON.parse(jsonPayload);

                                            await loginWithGoogle({
                                                email: googleUser.email,
                                                name: googleUser.name,
                                                avatar: googleUser.picture,
                                                idToken: credentialResponse.credential,
                                            });

                                            router.push('/dashboard/scheduled');
                                        } catch (e) {
                                            setErrorMsg('Failed to process Google login.');
                                        } finally {
                                            setLoading(false);
                                        }
                                    }
                                }}
                                onError={() => setErrorMsg('Google Sign-In failed.')}
                                size="large"
                                shape="pill"
                                theme="outline"
                                text="continue_with"
                                width="340"
                                useOneTap
                            />
                        </div>

                        <div className="relative my-2">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200/80" /></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white/80 px-2 text-gray-400 font-semibold text-[10px]">or</span></div>
                        </div>

                        {/* Trigger Google Official Account Chooser Popup */}
                        <button
                            onClick={() => triggerGooglePopup()}
                            disabled={loading}
                            className="w-full flex items-center justify-center space-x-3 py-3.5 px-4 rounded-2xl border border-white/80 bg-white/90 text-gray-900 font-bold text-sm hover:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 transition-all shadow-sm disabled:opacity-50 group"
                        >
                            <svg className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                />
                            </svg>
                            <span>{loading ? 'Opening Google...' : 'Select Google Account'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <LoginContent />
        </GoogleOAuthProvider>
    );
}
