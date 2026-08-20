'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EmailDetailData } from '@/types';
import {
    ArrowLeft,
    Star,
    Trash2,
    MoreVertical,
    CheckCircle2,
    Clock,
    AlertCircle,
    ExternalLink,
    Play,
    Copy,
    Check,
    Sparkles,
    Loader2,
} from 'lucide-react';
import { deleteEmailApi, triggerSendEmailApi } from '@/lib/api/emails';

interface EmailDetailProps {
    email: EmailDetailData;
}

export default function EmailDetail({ email }: EmailDetailProps) {
    const router = useRouter();
    const [isStarred, setIsStarred] = useState(false);
    const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [copiedText, setCopiedText] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const isScheduled = email.status === 'scheduled';
    const isSent = email.status === 'sent';
    const isFailed = email.status === 'failed';

    const formattedDate = new Date(email.sentAt || email.scheduledAt).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata',
        hour12: true,
    });

    const delaySeconds = email.delayMs
        ? Math.round(email.delayMs / 1000)
        : email.delayBetweenSeconds || 2;

    const attemptsCount = email.attempts ?? email.attemptCount ?? 1;

    // Handle Start / Trigger Immediate Send
    const handleTriggerSend = async () => {
        setIsSending(true);
        setActionMessage(null);
        try {
            const res = await triggerSendEmailApi(email.id);
            setActionMessage({ type: 'success', text: 'Email dispatched immediately via Ethereal SMTP!' });
            setTimeout(() => {
                router.refresh();
            }, 1200);
        } catch (err: any) {
            console.error('Trigger send error:', err);
            const detailedError = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to dispatch email.';
            setActionMessage({
                type: 'error',
                text: detailedError,
            });
        } finally {
            setIsSending(false);
            setShowOptionsDropdown(false);
        }
    };

    // Handle Delete Email
    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this email job? This cannot be undone.')) {
            return;
        }
        setIsDeleting(true);
        setActionMessage(null);
        try {
            await deleteEmailApi(email.id);
            setActionMessage({ type: 'success', text: 'Email deleted successfully.' });
            setTimeout(() => {
                router.push(isScheduled ? '/dashboard/scheduled' : '/dashboard/sent');
            }, 800);
        } catch (err: any) {
            console.error('Delete error:', err);
            setActionMessage({
                type: 'error',
                text: err.response?.data?.error || 'Failed to delete email.',
            });
            setIsDeleting(false);
        }
    };

    // Handle Copy helper
    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedText(label);
        setTimeout(() => setCopiedText(null), 2000);
    };

    return (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-lg max-w-4xl mx-auto overflow-hidden font-sans">
            {/* Top Header Bar */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
                <div className="flex items-center space-x-4 min-w-0">
                    <Link
                        href={isScheduled ? '/dashboard/scheduled' : '/dashboard/sent'}
                        className="p-2 rounded-2xl text-gray-500 hover:text-gray-900 hover:bg-white border border-gray-200/60 transition-all flex items-center space-x-1.5 text-xs font-bold shadow-2xs"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </Link>
                    <h1 className="text-base font-bold text-gray-900 truncate">
                        {email.subject}
                    </h1>
                </div>

                {/* Action icons on right */}
                <div className="flex items-center space-x-2 relative">
                    {/* Start / Send Now Button (Visible for Scheduled emails) */}
                    {isScheduled && (
                        <button
                            onClick={handleTriggerSend}
                            disabled={isSending || isDeleting}
                            className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
                            title="Start / Dispatch Email Immediately"
                        >
                            {isSending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Play className="w-3.5 h-3.5 fill-current" />
                            )}
                            <span>{isSending ? 'Sending...' : 'Start / Send Now'}</span>
                        </button>
                    )}

                    {/* Star Favorite Button */}
                    <button
                        onClick={() => setIsStarred(!isStarred)}
                        className={`p-2 rounded-2xl border transition-all ${isStarred
                            ? 'bg-amber-50 text-amber-500 border-amber-200'
                            : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50/50 border-gray-200/60'
                            }`}
                        title={isStarred ? 'Unstar Email' : 'Star Email'}
                    >
                        <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400' : ''}`} />
                    </button>

                    {/* Delete Button */}
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50/80 rounded-2xl border border-gray-200/60 transition-all disabled:opacity-50"
                        title="Delete Email Job"
                    >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4" />}
                    </button>

                    {/* Three-Dot Options Popover Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
                            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100/80 rounded-2xl border border-gray-200/60 transition-all"
                            title="More Options"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>

                        {showOptionsDropdown && (
                            <div className="absolute right-0 mt-2 w-56 ios-glass rounded-2xl shadow-2xl p-1.5 z-50 text-xs animate-fadeIn border border-white/80">
                                {isScheduled && (
                                    <button
                                        onClick={handleTriggerSend}
                                        disabled={isSending}
                                        className="w-full text-left px-3 py-2 text-emerald-800 hover:bg-emerald-50 rounded-xl flex items-center space-x-2 font-bold transition-colors"
                                    >
                                        <Play className="w-3.5 h-3.5 fill-current text-emerald-600" />
                                        <span>Start / Dispatch Now</span>
                                    </button>
                                )}

                                <button
                                    onClick={() => handleCopy(email.recipient, 'Recipient Email')}
                                    className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100/70 rounded-xl flex items-center justify-between font-medium transition-colors"
                                >
                                    <div className="flex items-center space-x-2">
                                        <Copy className="w-3.5 h-3.5 text-gray-400" />
                                        <span>Copy Recipient Email</span>
                                    </div>
                                    {copiedText === 'Recipient Email' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                                </button>

                                {email.messageId && (
                                    <button
                                        onClick={() => handleCopy(email.messageId || '', 'Message ID')}
                                        className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100/70 rounded-xl flex items-center justify-between font-medium transition-colors"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <Copy className="w-3.5 h-3.5 text-gray-400" />
                                            <span>Copy Message ID</span>
                                        </div>
                                        {copiedText === 'Message ID' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                                    </button>
                                )}

                                {email.previewUrl && (
                                    <a
                                        href={email.previewUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full text-left px-3 py-2 text-indigo-700 hover:bg-indigo-50 rounded-xl flex items-center space-x-2 font-medium transition-colors"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                                        <span>Open Ethereal Preview</span>
                                    </a>
                                )}

                                <div className="my-1 border-t border-gray-200/60" />

                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl flex items-center space-x-2 font-bold transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                    <span>Delete Email Job</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Notification Toast Banner */}
            {actionMessage && (
                <div
                    className={`px-6 py-3 border-b flex items-center space-x-2 text-xs font-bold ${actionMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                        }`}
                >
                    {actionMessage.type === 'success' ? (
                        <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    )}
                    <span>{actionMessage.text}</span>
                </div>
            )}

            {/* Email Sender & Recipient Information */}
            <div className="p-6">
                <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-100">
                    <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold flex items-center justify-center text-sm shadow-md flex-shrink-0">
                            {email.senderName ? email.senderName.substring(0, 2).toUpperCase() : 'OB'}
                        </div>
                        <div>
                            <div className="flex items-center space-x-2">
                                <p className="font-bold text-gray-900 text-sm">{email.senderName}</p>
                                <span className="text-xs text-gray-400">&lt;{email.senderEmail}&gt;</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                                To: <span className="text-gray-800 font-bold">{email.recipientName || email.recipient}</span>{' '}
                                <span className="text-gray-400">({email.recipient})</span>
                            </p>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-xs text-gray-400 font-medium">{formattedDate}</p>
                        <div className="mt-1.5 flex items-center justify-end space-x-2">
                            {isScheduled && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs">
                                    <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" /> Scheduled
                                </span>
                            )}
                            {isSent && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Sent
                                </span>
                            )}
                            {isFailed && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-200/80 shadow-2xs">
                                    <AlertCircle className="w-3.5 h-3.5 mr-1 text-red-600" /> Failed
                                </span>
                            )}

                            {email.previewUrl && (
                                <a
                                    href={email.previewUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors shadow-2xs"
                                >
                                    <ExternalLink className="w-3.5 h-3.5 mr-1" /> Ethereal Preview
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Email HTML Body Render */}
                <div className="prose max-w-none text-gray-800 text-sm leading-relaxed mb-8">
                    <div dangerouslySetInnerHTML={{ __html: email.body }} />
                </div>

                {/* Campaign & Technical Metadata Footer */}
                <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 text-xs text-gray-500 space-y-2">
                    <div className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                        Delivery Metadata & Parameters
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                        <div>
                            <span className="block text-gray-400">Campaign</span>
                            <span className="font-bold text-gray-800">{email.campaignName}</span>
                        </div>
                        <div>
                            <span className="block text-gray-400">Inter-Email Delay</span>
                            <span className="font-bold text-gray-800">{delaySeconds} seconds</span>
                        </div>
                        <div>
                            <span className="block text-gray-400">Hourly Rate Limit</span>
                            <span className="font-bold text-gray-800">{email.hourlyLimit} / hour</span>
                        </div>
                        <div>
                            <span className="block text-gray-400">Attempts</span>
                            <span className="font-bold text-gray-800">{attemptsCount}</span>
                        </div>
                    </div>
                    {email.messageId && (
                        <div className="pt-2 border-t border-gray-200/60 font-mono text-[11px] text-gray-400 truncate">
                            Message-ID: {email.messageId}
                        </div>
                    )}
                    {email.errorMessage && (
                        <div className="p-2 rounded-xl bg-red-50 text-red-700 text-xs font-mono border border-red-200">
                            Error: {email.errorMessage}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
