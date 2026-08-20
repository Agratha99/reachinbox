'use client';

import React from 'react';
import Link from 'next/link';
import { EmailListItem } from '@/types';
import { Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface EmailRowProps {
    email: EmailListItem;
}

export default function EmailRow({ email }: EmailRowProps) {
    const isScheduled = email.status === 'scheduled';
    const isProcessing = email.status === 'processing';
    const isSent = email.status === 'sent';
    const isFailed = email.status === 'failed';

    const formattedTime = new Date(email.sentAt || email.scheduledAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });

    const formattedDate = new Date(email.sentAt || email.scheduledAt).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
    });

    return (
        <Link
            href={`/dashboard/email/${email.id}`}
            className="group flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50/80 transition-colors cursor-pointer text-sm"
        >
            <div className="flex items-center space-x-4 min-w-0 flex-1 pr-4">
                {/* Status Indicator Dot */}
                <div className="flex-shrink-0">
                    {isScheduled && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm" />}
                    {isProcessing && <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />}
                    {isSent && <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />}
                    {isFailed && <AlertCircle className="w-4 h-4 text-red-500" />}
                </div>

                {/* Recipient Info matching reference */}
                <div className="w-44 flex-shrink-0">
                    <p className="font-semibold text-gray-900 truncate">
                        To: {email.recipientName || email.recipient}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{email.recipient}</p>
                </div>

                {/* Status Badge Tag matching reference UI badges */}
                <div className="flex-shrink-0 mr-2">
                    {isScheduled && (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-800 border border-amber-500/20 shadow-2xs">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                            <span>Scheduled</span>
                        </span>
                    )}
                    {isProcessing && (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-800 border border-blue-500/20 shadow-2xs">
                            <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />
                            <span>Sending...</span>
                        </span>
                    )}
                    {isSent && (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 shadow-2xs">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span>Sent</span>
                        </span>
                    )}
                    {isFailed && (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-800 border border-rose-500/20 shadow-2xs">
                            <span className="h-2 w-2 rounded-full bg-rose-500 inline-block"></span>
                            <span>Failed</span>
                        </span>
                    )}
                </div>

                {/* Subject & Preview */}
                <div className="min-w-0 flex-1">
                    <span className="font-medium text-gray-900 mr-2 group-hover:text-emerald-700 transition-colors">
                        {email.subject}
                    </span>
                    <span className="text-gray-400 truncate hidden md:inline">
                        — {email.bodyPreview}
                    </span>
                </div>
            </div>

            {/* Date & Time on right */}
            <div className="flex-shrink-0 text-right text-xs text-gray-400 font-medium whitespace-nowrap pl-2">
                <span>{formattedDate}</span> <span className="ml-1 text-gray-500">{formattedTime}</span>
            </div>
        </Link>
    );
}
