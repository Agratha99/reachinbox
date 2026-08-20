'use client';

import React, { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import EmailList from '@/components/email/EmailList';
import { useQuery } from '@tanstack/react-query';
import { fetchSentEmails } from '@/lib/api/emails';

export default function SentEmailsPage() {
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['sent-emails', page, searchQuery],
        queryFn: () => fetchSentEmails({ page, limit: 10, search: searchQuery }),
        staleTime: 1000,
        refetchInterval: 2000,
        gcTime: 300000,
    });

    return (
        <AppShell searchQuery={searchQuery} onSearchChange={setSearchQuery}>
            <div className="space-y-4 max-w-5xl mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Sent Emails</h1>
                        <p className="text-xs text-gray-500 mt-0.5">
                            History of emails successfully dispatched via SMTP transport.
                        </p>
                    </div>
                </div>

                <EmailList
                    emails={data?.data || []}
                    pagination={data?.pagination}
                    isLoading={isLoading}
                    onPageChange={setPage}
                    emptyTitle="No sent emails yet"
                    emptyDescription="Emails that have been successfully delivered will appear in this log."
                />
            </div>
        </AppShell>
    );
}
