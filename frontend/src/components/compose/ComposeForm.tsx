'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RecipientInput from './RecipientInput';
import CsvUploader from './CsvUploader';
import RichTextEditor from './RichTextEditor';
import SchedulePanel from './SchedulePanel';
import CampaignSummaryModal from './CampaignSummaryModal';
import { scheduleCampaignApi, sendImmediateApi } from '@/lib/api/emails';
import { getCurrentUser } from '@/lib/api/auth';
import { User } from '@/types';
import { checkSpamScore, SpamCheckResult } from '@/lib/spamChecker';
import { Send, Clock, AlertCircle, CheckCircle2, Tag, HelpCircle, UserCheck, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function ComposeForm() {
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [recipients, setRecipients] = useState<string[]>([]);
    const [subject, setSubject] = useState('');
    const [bodyHtml, setBodyHtml] = useState('');

    const [scheduledAt, setScheduledAt] = useState<string>('');
    const [delayBetweenSeconds, setDelayBetweenSeconds] = useState<number>(2);
    const [hourlyLimit, setHourlyLimit] = useState<number>(200);

    const [showSchedulePanel, setShowSchedulePanel] = useState<boolean>(false);
    const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('reachinbox_user');
            if (stored) {
                try {
                    setUser(JSON.parse(stored));
                } catch (e) { }
            }
        }
        getCurrentUser().then((u) => {
            if (u) setUser(u);
        });
    }, []);

    const displayName = user?.name || 'Rahul Reddy';
    const displayEmail = user?.senders?.[0]?.email || user?.email || 'kataru.rahul@gmail.com';

    const insertVariable = (tag: string) => {
        setBodyHtml((prev) => prev + ` ${tag} `);
    };

    const handleSendImmediate = async () => {
        if (recipients.length === 0) {
            setErrorMsg('Please specify at least one recipient.');
            return;
        }
        if (!subject.trim()) {
            setErrorMsg('Please enter a subject line.');
            return;
        }
        if (!bodyHtml.trim()) {
            setErrorMsg('Email body cannot be empty.');
            return;
        }

        if (recipients.length > 50) {
            setShowSummaryModal(true);
        } else {
            executeImmediateSend();
        }
    };

    const executeImmediateSend = async () => {
        setIsSubmitting(true);
        setErrorMsg(null);

        try {
            const res = await sendImmediateApi({
                recipients,
                subject,
                body: bodyHtml,
            });

            if (res.skippedRecipients && res.skippedRecipients.length > 0) {
                setSuccessMsg(
                    `Campaign dispatched! (${res.totalRecipients} sent, ${res.skippedRecipients.length} unsubscribed skipped). Redirecting...`
                );
            } else {
                setSuccessMsg(`Campaign created for ${res.totalRecipients} recipients! Redirecting...`);
            }
            setTimeout(() => router.push('/dashboard/sent'), 1200);
        } catch (err: any) {
            setErrorMsg(err.response?.data?.error || 'Failed to dispatch email.');
        } finally {
            setIsSubmitting(false);
            setShowSummaryModal(false);
        }
    };

    const handleConfirmSchedule = async () => {
        if (recipients.length === 0) {
            setErrorMsg('Please specify at least one recipient.');
            return;
        }
        if (!subject.trim()) {
            setErrorMsg('Please enter a subject line.');
            return;
        }
        if (!bodyHtml.trim()) {
            setErrorMsg('Email body cannot be empty.');
            return;
        }

        executeSchedule();
    };

    const executeSchedule = async () => {
        setIsSubmitting(true);
        setErrorMsg(null);

        try {
            const targetTime = scheduledAt || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
            const res = await scheduleCampaignApi({
                recipients,
                subject,
                body: bodyHtml,
                scheduledAt: targetTime,
                delayBetweenSeconds,
                hourlyLimit,
            });

            setSuccessMsg(`Campaign scheduled for ${res.totalRecipients} recipients! Redirecting...`);
            setTimeout(() => router.push('/dashboard/scheduled'), 1200);
        } catch (err: any) {
            setErrorMsg(err.response?.data?.error || 'Failed to schedule campaign.');
        } finally {
            setIsSubmitting(false);
            setShowSummaryModal(false);
        }
    };

    return (
        <div className="ios-glass rounded-[32px] border border-white/80 shadow-[0_25px_60px_rgba(0,0,0,0.06)] max-w-4xl mx-auto overflow-hidden font-sans backdrop-blur-3xl">
            {/* Top Glass Header */}
            <div className="px-7 py-5 border-b border-white/60 bg-gradient-to-r from-white/90 via-emerald-50/50 to-white/90 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-base font-extrabold text-gray-900 flex items-center space-x-2">
                        <span>Compose Cold Campaign</span>
                        <span className="text-[10px] bg-emerald-500/15 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                            Pro Spintax Engine
                        </span>
                    </h1>
                    <p className="text-xs text-gray-500 font-medium">Design personalized outreach with dynamic variables and tracking</p>
                </div>

                <div className="flex items-center space-x-2.5">
                    <CsvUploader
                        onRecipientsUploaded={(newList) => {
                            setRecipients(newList);
                            setErrorMsg(null);
                        }}
                        onClearList={() => setRecipients([])}
                        currentCount={recipients.length}
                    />
                </div>
            </div>

            {/* Alerts */}
            {errorMsg && (
                <div className="mx-7 mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-800 text-xs rounded-2xl flex items-center space-x-2.5 shadow-2xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                    <span className="font-semibold">{errorMsg}</span>
                </div>
            )}

            {successMsg && (
                <div className="mx-7 mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 text-xs rounded-2xl flex items-center space-x-2.5 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-semibold">{successMsg}</span>
                </div>
            )}

            {/* Main Form Fields */}
            <div className="p-7 space-y-5">
                {/* From Account Field */}
                <div className="flex items-center space-x-3 text-xs">
                    <label className="w-16 font-bold text-gray-500">From:</label>
                    <div className="flex-1 bg-white/70 border border-white/80 rounded-2xl px-4 py-3 text-gray-900 font-semibold flex items-center justify-between shadow-2xs">
                        <div className="flex items-center space-x-2.5 truncate">
                            <UserCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span className="truncate">
                                {displayName} &lt;{displayEmail}&gt;
                            </span>
                        </div>
                        <span className="text-[10px] bg-emerald-500/15 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                            Verified Sender
                        </span>
                    </div>
                </div>

                {/* To Recipients Field */}
                <div className="flex items-start space-x-3 text-xs">
                    <label className="w-16 pt-3 font-bold text-gray-500">To:</label>
                    <div className="flex-1">
                        <RecipientInput
                            recipients={recipients}
                            onRecipientsChange={(newList) => {
                                setRecipients(newList);
                                setErrorMsg(null);
                            }}
                        />
                    </div>
                </div>

                {/* Subject Line Field */}
                <div className="flex items-center space-x-3 text-xs">
                    <label className="w-16 font-bold text-gray-500">Subject:</label>
                    <input
                        type="text"
                        placeholder="Enter subject line (supports Spintax: {Hi|Hey} and {{firstName}})..."
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="flex-1 px-4 py-3 ios-input rounded-2xl text-xs text-gray-900 font-semibold placeholder-gray-400"
                    />
                </div>

                {/* Spam Score Heuristic Scanner Pill */}
                {(() => {
                    const spamResult = checkSpamScore(subject, bodyHtml);
                    return (
                        <div className="flex items-center justify-between px-4 py-2 bg-white/60 rounded-xl border border-white/80 text-xs">
                            <div className="flex items-center space-x-2">
                                {spamResult.level === 'LOW' ? (
                                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                ) : (
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                )}
                                <span className="font-bold text-gray-700">Deliverability Spam Score:</span>
                                <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[11px] ${spamResult.level === 'LOW'
                                        ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30'
                                        : spamResult.level === 'MEDIUM'
                                            ? 'bg-amber-500/15 text-amber-800 border border-amber-500/30'
                                            : 'bg-rose-500/15 text-rose-800 border border-rose-500/30'
                                    }`}>
                                    {spamResult.score}% ({spamResult.level} RISK)
                                </span>
                            </div>

                            {spamResult.foundWords.length > 0 && (
                                <span className="text-[10px] text-amber-700 font-medium">
                                    Trigger phrases detected: <code className="font-bold">{spamResult.foundWords.join(', ')}</code>
                                </span>
                            )}
                        </div>
                    );
                })()}

                {/* Dynamic Variable & Spintax Shortcut Bar */}
                <div className="flex flex-wrap items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 rounded-2xl px-4 py-3 text-xs gap-2">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <Tag className="w-4 h-4 text-emerald-700" />
                        <span className="font-bold text-emerald-950">Insert Tags:</span>
                        <button
                            type="button"
                            onClick={() => insertVariable('{{firstName}}')}
                            className="px-3 py-1.5 bg-white/90 border border-emerald-400/60 hover:border-emerald-600 text-emerald-900 font-mono text-[11px] font-bold rounded-xl shadow-2xs transition-all hover:scale-105"
                        >
                            &#123;&#123;firstName&#125;&#125;
                        </button>
                        <button
                            type="button"
                            onClick={() => insertVariable('{{companyName}}')}
                            className="px-3 py-1.5 bg-white/90 border border-emerald-400/60 hover:border-emerald-600 text-emerald-900 font-mono text-[11px] font-bold rounded-xl shadow-2xs transition-all hover:scale-105"
                        >
                            &#123;&#123;companyName&#125;&#125;
                        </button>
                        <button
                            type="button"
                            onClick={() => insertVariable('{Hi|Hey|Hello}')}
                            className="px-3 py-1.5 bg-white/90 border border-emerald-400/60 hover:border-emerald-600 text-emerald-900 font-mono text-[11px] font-bold rounded-xl shadow-2xs transition-all hover:scale-105"
                        >
                            &#123;Hi|Hey|Hello&#125;
                        </button>
                    </div>

                    <div className="flex items-center space-x-1.5 text-emerald-800 font-semibold text-[11px]">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Spintax Randomized Per Send</span>
                    </div>
                </div>

                {/* Body Text Editor */}
                <div className="pt-1">
                    <RichTextEditor content={bodyHtml} onChange={setBodyHtml} />
                </div>

                {/* Action Controls */}
                <div className="flex items-center justify-between pt-5 border-t border-white/60">
                    <div className="flex items-center space-x-3">
                        <button
                            type="button"
                            onClick={handleSendImmediate}
                            disabled={isSubmitting}
                            className="px-7 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-teal-700 hover:from-emerald-600 hover:to-teal-800 text-white font-extrabold text-xs transition-all shadow-[0_6px_25px_-4px_rgba(16,185,129,0.45)] hover:shadow-[0_8px_30px_-4px_rgba(16,185,129,0.55)] flex items-center space-x-2 disabled:opacity-50 active:scale-95"
                        >
                            <Send className="w-4 h-4" />
                            <span>Send Now</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowSchedulePanel(true)}
                            disabled={isSubmitting}
                            className="px-6 py-3 rounded-2xl border border-white/80 bg-white/80 hover:bg-white text-gray-800 font-bold text-xs transition-all flex items-center space-x-2 disabled:opacity-50 shadow-2xs active:scale-95"
                        >
                            <Clock className="w-4 h-4 text-emerald-600" />
                            <span>Schedule Campaign...</span>
                        </button>
                    </div>

                    {scheduledAt && (
                        <div className="text-xs text-emerald-800 font-bold bg-emerald-500/15 px-4 py-2.5 rounded-2xl border border-emerald-500/30 shadow-2xs">
                            Scheduled for: {new Date(scheduledAt).toLocaleString()}
                        </div>
                    )}
                </div>
            </div>

            {/* Schedule Settings Panel Modal */}
            {showSchedulePanel && (
                <SchedulePanel
                    scheduledAt={scheduledAt}
                    delayBetweenSeconds={delayBetweenSeconds}
                    hourlyLimit={hourlyLimit}
                    onScheduleChange={(newTime, newDelay, newLimit) => {
                        setScheduledAt(newTime);
                        setDelayBetweenSeconds(newDelay);
                        setHourlyLimit(newLimit);
                    }}
                    onClose={() => setShowSchedulePanel(false)}
                    onConfirmSchedule={() => {
                        setShowSchedulePanel(false);
                        if (recipients.length > 50) {
                            setShowSummaryModal(true);
                        } else {
                            handleConfirmSchedule();
                        }
                    }}
                />
            )}

            {/* High-recipient Summary Modal */}
            {showSummaryModal && (
                <CampaignSummaryModal
                    totalRecipients={recipients.length}
                    subject={subject}
                    scheduledAt={scheduledAt}
                    delayBetweenSeconds={delayBetweenSeconds}
                    hourlyLimit={hourlyLimit}
                    onConfirm={scheduledAt ? executeSchedule : executeImmediateSend}
                    onCancel={() => setShowSummaryModal(false)}
                    isSubmitting={isSubmitting}
                />
            )}
        </div>
    );
}
