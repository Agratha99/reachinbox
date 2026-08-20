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
            <div className="py-20 px-6 text-center ios-glass-card border border-white/80 rounded-[28px] my-6 max-w-lg mx-auto shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Mail className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{emptyTitle}</h3>
                <p className="text-xs text-gray-500 mb-5 max-w-xs mx-auto leading-relaxed">{emptyDescription}</p>
                {showComposeButton && (
                    <Link
                        href="/dashboard/compose"
                        className="inline-flex items-center space-x-2 px-5 py-2.5 ios-btn-primary text-white rounded-xl text-xs font-bold transition-all"
                    >
                        <span>+ Compose Campaign</span>
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className="ios-glass-card border border-white/90 rounded-[28px] overflow-hidden shadow-xl">
            <div className="divide-y divide-gray-100/80">
                {emails.map((email) => (
                    <EmailRow key={email.id} email={email} />
                ))}
            </div>

            {/* Pagination Footer */}
            {pagination && pagination.totalPages > 1 && (
                <div className="px-5 py-3.5 border-t border-gray-100/80 bg-white/40 backdrop-blur-md flex items-center justify-between text-xs text-gray-500">
                    <div>
                        Showing <span className="font-bold text-gray-800">{(pagination.page - 1) * pagination.limit + 1}</span>–
                        <span className="font-bold text-gray-800">
                            {Math.min(pagination.page * pagination.limit, pagination.total)}
                        </span>{' '}
                        of <span className="font-bold text-gray-800">{pagination.total}</span> emails
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => onPageChange?.(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            className="p-1.5 rounded-xl border border-gray-200/80 bg-white/80 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs active:scale-95"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-semibold text-gray-800 px-2">
                            {pagination.page} / {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => onPageChange?.(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                            className="p-1.5 rounded-xl border border-gray-200/80 bg-white/80 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs active:scale-95"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
