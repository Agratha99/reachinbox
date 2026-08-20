'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { loginWithGoogle, getGoogleOAuthUrl } from '@/lib/api/auth';
import { AlertCircle, UserCheck, X } from 'lucide-react';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

function LoginContent() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [customEmail, setCustomEmail] = useState('');
    const [customName, setCustomName] = useState('');

    // Trigger Google OAuth Account Chooser popup with prompt: 'select_account'
    const googleLoginPopup = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            setErrorMsg('');
            try {
                // Fetch selected user details from Google UserInfo API
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const googleUser = await userInfoRes.json();

                await loginWithGoogle({
                    email: googleUser.email,
                    name: googleUser.name || googleUser.given_name || googleUser.email.split('@')[0],
                    avatar: googleUser.picture,
                    idToken: tokenResponse.access_token,
                });

                router.push('/dashboard/scheduled');
            } catch (err: any) {
                console.error('Google OAuth error:', err);
                setErrorMsg('Failed to log in with selected Google account.');
            } finally {
                setLoading(false);
            }
        },
        onError: () => {
            setErrorMsg('Google account selection was cancelled.');
            setLoading(false);
        },
        prompt: 'select_account',
    });

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setErrorMsg('');

        // 1. If Google Client ID is configured, trigger Google's real Account Picker popup
        if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'dummy-client-id.apps.googleusercontent.com') {
            googleLoginPopup();
            return;
        }

        // 2. Try Backend Google OAuth URL if configured
        try {
            const oauthRes = await getGoogleOAuthUrl();
            if (oauthRes?.authUrl && oauthRes?.configured) {
                window.location.href = oauthRes.authUrl;
                return;
            }
        } catch (e) {
            // Ignore backend offline error
        } finally {
            setLoading(false);
        }

        // 3. If no Client ID configured, show Account Selector modal so user can pick/enter their account
        setShowAccountModal(true);
    };

    const handleCustomAccountLogin = async (emailToUse: string, nameToUse: string) => {
        setLoading(true);
        setErrorMsg('');
        try {
            await loginWithGoogle({
                email: emailToUse,
                name: nameToUse,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(emailToUse)}`,
            });
            setShowAccountModal(false);
            router.push('/dashboard/scheduled');
        } catch (err: any) {
            setErrorMsg('Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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
                <p className="text-xs text-gray-500 mt-1">Select your Google account to proceed</p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
                <div className="ios-glass py-8 px-6 shadow-2xl rounded-3xl sm:px-10 space-y-6 border border-white/80">
                    {errorMsg && (
                        <div className="bg-red-500/10 text-red-700 p-3 rounded-2xl border border-red-500/20 text-xs flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            onClick={handleGoogleSignIn}
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
                            <span>{loading ? 'Opening Account Chooser...' : 'Sign in with Google'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Account Selector Modal (When choosing Google Account) */}
            {showAccountModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white/95 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-white/80 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                                    G
                                </div>
                                <h3 className="text-base font-bold text-gray-900">Choose Google Account</h3>
                            </div>
                            <button
                                onClick={() => setShowAccountModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="py-4 space-y-3">
                            <p className="text-xs text-gray-500 font-medium">Select an account to log in with:</p>

                            {/* Preset Accounts Selection */}
                            <div className="space-y-2">
                                <button
                                    onClick={() => handleCustomAccountLogin('katarurahul105@gmail.com', 'Kataru Rahul')}
                                    className="w-full flex items-center justify-between p-3 rounded-2xl border border-gray-200/80 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left group"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                                            KR
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-700">Kataru Rahul</p>
                                            <p className="text-xs text-gray-500">katarurahul105@gmail.com</p>
                                        </div>
                                    </div>
                                    <UserCheck className="w-4 h-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>

                                <button
                                    onClick={() => handleCustomAccountLogin('oliver.brown@domain.io', 'Oliver Brown')}
                                    className="w-full flex items-center justify-between p-3 rounded-2xl border border-gray-200/80 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-left group"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                                            OB
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-900 group-hover:text-indigo-700">Oliver Brown</p>
                                            <p className="text-xs text-gray-500">oliver.brown@domain.io</p>
                                        </div>
                                    </div>
                                    <UserCheck className="w-4 h-4 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            </div>

                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400 font-semibold text-[10px]">Or enter custom Google email</span></div>
                            </div>

                            {/* Custom Email Input */}
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (customEmail) {
                                        const name = customName || customEmail.split('@')[0];
                                        handleCustomAccountLogin(customEmail, name);
                                    }
                                }}
                                className="space-y-3"
                            >
                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Google Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="yourname@gmail.com"
                                        value={customEmail}
                                        onChange={(e) => setCustomEmail(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Display Name (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Alex Morgan"
                                        value={customName}
                                        onChange={(e) => setCustomName(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={!customEmail || loading}
                                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
                                >
                                    Continue with this Account
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function LoginPage() {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID || 'dummy-client-id.apps.googleusercontent.com'}>
            <LoginContent />
        </GoogleOAuthProvider>
    );
}

