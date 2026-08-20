'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Clock, Users, Mail } from 'lucide-react';

interface CampaignSummaryModalProps {
    totalRecipients: number;
    subject: string;
    scheduledAt?: string;
    delayBetweenSeconds: number;
    hourlyLimit: number;
    onConfirm: () => void;
    onCancel: () => void;
    isSubmitting?: boolean;
}

export default function CampaignSummaryModal({
    totalRecipients,
    subject,
    scheduledAt,
    delayBetweenSeconds,
    hourlyLimit,
    onConfirm,
    onCancel,
    isSubmitting,
}: CampaignSummaryModalProps) {
    const isImmediate = !scheduledAt;

    // Calculate estimated total dispatch duration
    const batchIntervalSeconds = (3600 / hourlyLimit);
    const effectiveDelaySeconds = Math.max(delayBetweenSeconds, batchIntervalSeconds);
    const totalSeconds = totalRecipients * effectiveDelaySeconds;
    const estimatedHours = (totalSeconds / 3600).toFixed(1);

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center space-x-3 text-emerald-600 mb-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Mail className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900">Confirm Bulk Email Dispatch</h3>
                        <p className="text-xs text-gray-500">ReachInbox Safe Queue Safeguard</p>
                    </div>
                </div>

                <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6 text-xs text-gray-700">
                    <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                        <span className="text-gray-500">Total Recipients</span>
                        <span className="font-bold text-gray-900 text-sm">{totalRecipients.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                        <span className="text-gray-500">Subject</span>
                        <span className="font-semibold text-gray-900 truncate max-w-[200px]">{subject}</span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                        <span className="text-gray-500">Execution Mode</span>
                        <span className="font-semibold text-emerald-700">
                            {isImmediate ? 'Immediate Dispatch' : 'Scheduled Delivery'}
                        </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                        <span className="text-gray-500">Rate Limit Settings</span>
                        <span className="font-mono text-gray-900">
                            {hourlyLimit}/hr • {delayBetweenSeconds}s delay
                        </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                        <span className="text-gray-500">Estimated Duration</span>
                        <span className="font-bold text-emerald-700">{estimatedHours} Hours</span>
                    </div>
                </div>

                {totalRecipients > 50 && (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-xs mb-6 flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p>
                            You are queueing over 50 emails. BullMQ background queue will automatically regulate dispatch speed to prevent domain throttling.
                        </p>
                    </div>
                )}

                <div className="flex items-center justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        Review Details
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1.5"
                    >
                        {isSubmitting ? (
                            <span>Scheduling Jobs...</span>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Confirm & Queue</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
