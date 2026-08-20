'use client';

import React, { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import EmailList from '@/components/email/EmailList';
import { useQuery } from '@tanstack/react-query';
import { fetchScheduledEmails } from '@/lib/api/emails';

export default function ScheduledEmailsPage() {
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['scheduled-emails', page, searchQuery],
        queryFn: () => fetchScheduledEmails({ page, limit: 10, search: searchQuery }),
        staleTime: 1000,
        refetchInterval: 2000,
        gcTime: 300000,
    });

    return (
        <AppShell searchQuery={searchQuery} onSearchChange={setSearchQuery}>
            <div className="space-y-4 max-w-5xl mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Scheduled Emails</h1>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Active campaigns waiting in the queue for rate-limited background dispatch.
                        </p>
                    </div>
                </div>

                <EmailList
                    emails={data?.data || []}
                    pagination={data?.pagination}
                    isLoading={isLoading}
                    onPageChange={setPage}
                    emptyTitle="No scheduled emails"
                    emptyDescription="You don't have any emails currently waiting in the schedule queue."
                />
            </div>
        </AppShell>
    );
}
