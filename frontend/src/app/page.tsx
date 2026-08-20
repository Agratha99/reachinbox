'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('reachinbox_auth_token');
        if (token) {
            router.push('/dashboard/scheduled');
        } else {
            router.push('/login');
        }
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white text-gray-500 text-sm">
            Loading ReachInbox...
        </div>
    );
}
