'use client';

import React from 'react';
import EmailRow from './EmailRow';
import { EmailListItem, Pagination } from '@/types';
import { ChevronLeft, ChevronRight, Inbox, Mail } from 'lucide-react';
import Link from 'next/link';

interface EmailListProps {
    emails: EmailListItem[];
    pagination?: Pagination;
    isLoading?: boolean;
    onPageChange?: (newPage: number) => void;
    emptyTitle?: string;
    emptyDescription?: string;
    showComposeButton?: boolean;
}

export default function EmailList({
    emails,
    pagination,
    isLoading,
    onPageChange,
    emptyTitle = 'No emails found',
    emptyDescription = 'Emails will appear here once scheduled or sent.',
    showComposeButton = true,
}: EmailListProps) {
    if (isLoading) {
        return (
            <div className="divide-y divide-gray-100 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="px-4 py-3.5 flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                            <div className="w-36 h-4 bg-gray-200 rounded" />
                            <div className="w-16 h-4 bg-gray-200 rounded" />
                            <div className="w-64 h-4 bg-gray-200 rounded" />
                        </div>
                        <div className="w-20 h-4 bg-gray-200 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    if (!emails || emails.length === 0) {
        return (
            <div className="py-16 px-4 text-center border border-dashed border-gray-200 rounded-xl my-4 bg-gray-50/50 max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">{emptyTitle}</h3>
                <p className="text-xs text-gray-500 mb-4 max-w-xs mx-auto">{emptyDescription}</p>
                {showComposeButton && (
                    <Link
                        href="/dashboard/compose"
                        className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                        <span>+ Compose Email</span>
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-100">
                {emails.map((email) => (
                    <EmailRow key={email.id} email={email} />
                ))}
            </div>

            {/* Pagination Footer */}
            {pagination && pagination.totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-gray-500">
                    <div>
                        Showing <span className="font-semibold text-gray-700">{(pagination.page - 1) * pagination.limit + 1}</span>–
                        <span className="font-semibold text-gray-700">
                            {Math.min(pagination.page * pagination.limit, pagination.total)}
                        </span>{' '}
                        of <span className="font-semibold text-gray-700">{pagination.total}</span> emails
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => onPageChange?.(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            className="p-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-medium text-gray-700">
                            {pagination.page} / {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => onPageChange?.(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                            className="p-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
