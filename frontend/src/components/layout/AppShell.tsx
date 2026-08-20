'use client';

import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { User } from '@/types';
import { getCurrentUser } from '@/lib/api/auth';
import { useQuery } from '@tanstack/react-query';
import { fetchScheduledEmails, fetchSentEmails } from '@/lib/api/emails';

interface AppShellProps {
    children: React.ReactNode;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
}

export default function AppShell({ children, searchQuery, onSearchChange }: AppShellProps) {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const urlToken = urlParams.get('token');
            if (urlToken) {
                localStorage.setItem('reachinbox_auth_token', urlToken);
                window.history.replaceState({}, document.title, window.location.pathname);
            }

            const storedUser = localStorage.getItem('reachinbox_user');
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (e) { }
            }
        }

        getCurrentUser().then((u) => {
            if (u) {
                setUser(u);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('reachinbox_user', JSON.stringify(u));
                }
            }
        });
    }, []);

    const { data: scheduledRes } = useQuery({
        queryKey: ['scheduled-emails', 1, ''],
        queryFn: () => fetchScheduledEmails({ page: 1, limit: 10 }),
    });

    const { data: sentRes } = useQuery({
        queryKey: ['sent-emails', 1, ''],
        queryFn: () => fetchSentEmails({ page: 1, limit: 10 }),
    });

    return (
        <div className="min-h-screen ios-bg-mesh flex flex-col font-sans antialiased text-gray-900 selection:bg-emerald-500 selection:text-white relative overflow-hidden">
            {/* Animated iOS Background Light Spheres */}
            <div className="ios-light-orb-1" />
            <div className="ios-light-orb-2" />
            <div className="ios-light-orb-3" />

            <Header user={user} searchQuery={searchQuery} onSearchChange={onSearchChange} />
            <div className="flex flex-1 overflow-hidden z-10">
                <Sidebar
                    user={user}
                    scheduledCount={scheduledRes?.pagination.total || 0}
                    sentCount={sentRes?.pagination.total || 0}
                />
                <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">{children}</main>
            </div>
        </div>
    );
}
