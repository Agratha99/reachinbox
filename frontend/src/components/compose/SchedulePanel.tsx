'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, ShieldAlert, Sparkles, X } from 'lucide-react';

interface SchedulePanelProps {
    scheduledAt: string;
    delayBetweenSeconds: number;
    hourlyLimit: number;
    onScheduleChange: (scheduledAt: string, delay: number, limit: number) => void;
    onClose: () => void;
    onConfirmSchedule: () => void;
}

export default function SchedulePanel({
    scheduledAt,
    delayBetweenSeconds,
    hourlyLimit,
    onScheduleChange,
    onClose,
    onConfirmSchedule,
}: SchedulePanelProps) {
    // Helper: build a local Date from date + time strings
    const buildLocalDate = (date: string, time: string): Date => {
        const [year, month, day] = date.split('-').map(Number);
        const [hours, minutes] = time.split(':').map(Number);
        return new Date(year, month - 1, day, hours, minutes);
    };

    // Helper: format a Date to YYYY-MM-DD in local timezone
    const toLocalDateStr = (d: Date): string => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dd}`;
    };

    // Helper: format a Date to HH:MM in local timezone
    const toLocalTimeStr = (d: Date): string => {
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
    };

    const [dateStr, setDateStr] = useState<string>(() => {
        const d = scheduledAt ? new Date(scheduledAt) : new Date(Date.now() + 2 * 60 * 60 * 1000);
        return toLocalDateStr(d);
    });

    const [timeStr, setTimeStr] = useState<string>(() => {
        const d = scheduledAt ? new Date(scheduledAt) : new Date(Date.now() + 2 * 60 * 60 * 1000);
        return toLocalTimeStr(d);
    });

    const [delay, setDelay] = useState<number>(delayBetweenSeconds || 2);
    const [limit, setLimit] = useState<number>(hourlyLimit || 200);

    const applyPreset = (hoursFromNow: number) => {
        const d = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
        const dateFormatted = toLocalDateStr(d);
        const timeFormatted = toLocalTimeStr(d);
        setDateStr(dateFormatted);
        setTimeStr(timeFormatted);
        const localDate = buildLocalDate(dateFormatted, timeFormatted);
        onScheduleChange(localDate.toISOString(), delay, limit);
    };

    const handleSave = () => {
        const localDate = buildLocalDate(dateStr, timeStr);
        onScheduleChange(localDate.toISOString(), delay, limit);
        onConfirmSchedule();
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                    <div className="flex items-center space-x-2 text-gray-900 font-semibold text-base">
                        <Clock className="w-5 h-5 text-emerald-600" />
                        <span>Schedule Campaign & Rate Limits</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Date & Time Selectors */}
                <div className="space-y-4 mb-5">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Date
                            </label>
                            <div className="relative">
                                <input
                                    type="date"
                                    value={dateStr}
                                    min={toLocalDateStr(new Date())}
                                    onChange={(e) => setDateStr(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-800 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                Time
                            </label>
                            <input
                                type="time"
                                value={timeStr}
                                onChange={(e) => setTimeStr(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-800 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Quick Presets matching reference UI */}
                    <div>
                        <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Quick Schedule Presets
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => applyPreset(2)}
                                className="p-2 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left text-xs font-medium text-gray-700 transition-all flex items-center justify-between"
                            >
                                <span>In 2 hours</span>
                                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset(24)}
                                className="p-2 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left text-xs font-medium text-gray-700 transition-all"
                            >
                                Tomorrow, 10:00 AM
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset(48)}
                                className="p-2 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left text-xs font-medium text-gray-700 transition-all"
                            >
                                In 2 Days
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset(168)}
                                className="p-2 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left text-xs font-medium text-gray-700 transition-all"
                            >
                                Next Week
                            </button>
                        </div>
                    </div>
                </div>

                {/* Rate Limiting Controls (Requirement #2, #5) */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6 space-y-3">
                    <div className="flex items-center space-x-1.5 text-xs font-semibold text-gray-800">
                        <ShieldAlert className="w-4 h-4 text-emerald-600" />
                        <span>Anti-Spam & Delivery Safeguards</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                            <label className="block text-gray-600 text-[11px] font-medium mb-1">
                                Delay Between Emails (sec)
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="300"
                                value={delay}
                                onChange={(e) => setDelay(parseInt(e.target.value) || 2)}
                                className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-md font-semibold text-gray-900"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 text-[11px] font-medium mb-1">
                                Hourly Limit (emails / hr)
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="5000"
                                value={limit}
                                onChange={(e) => setLimit(parseInt(e.target.value) || 200)}
                                className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-md font-semibold text-gray-900"
                            />
                        </div>
                    </div>
                    <p className="text-[11px] text-gray-500">
                        ReachInbox automatically throttles emails according to these rules to maintain high domain reputation.
                    </p>
                </div>

                {/* Modal Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
                    >
                        Confirm & Schedule
                    </button>
                </div>
            </div>
        </div>
    );
}
