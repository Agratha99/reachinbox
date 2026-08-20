'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, Clock, CheckCircle2, BarChart3, Server, Calendar, Users, FileText } from 'lucide-react';
import { User } from '@/types';

interface SidebarProps {
    user: User | null;
    scheduledCount?: number;
    sentCount?: number;
}

export default function Sidebar({ user, scheduledCount = 0, sentCount = 0 }: SidebarProps) {
    const pathname = usePathname();

    const isScheduledActive = pathname.includes('/scheduled');
    const isSentActive = pathname.includes('/sent');
    const isAnalyticsActive = pathname.includes('/analytics');
    const isCalendarActive = pathname.includes('/calendar');
    const isLeadsActive = pathname.includes('/leads');
    const isTemplatesActive = pathname.includes('/templates');

    return (
        <aside className="w-64 ios-glass border-r border-white/60 flex flex-col h-[calc(100vh-4rem)] flex-shrink-0 font-sans shadow-[6px_0_30px_rgba(0,0,0,0.03)] z-20">
            {/* Glossy iOS Floating Compose Button */}
            <div className="p-4 pt-5">
                <Link
                    href="/dashboard/compose"
                    className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-teal-700 hover:from-emerald-600 hover:to-teal-800 text-white font-extrabold text-xs transition-all shadow-[0_6px_25px_-4px_rgba(16,185,129,0.45)] hover:shadow-[0_8px_30px_-4px_rgba(16,185,129,0.55)] group active:scale-95"
                >
                    <Plus className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-300" />
                    <span>Compose Campaign</span>
                </Link>
            </div>

            {/* Navigation List */}
            <nav className="flex-1 px-3.5 py-2 space-y-1.5 overflow-y-auto">
                <div className="px-3 pt-1 pb-1 text-[10px] font-black uppercase tracking-wider text-gray-400">Campaigns</div>

                <Link
                    href="/dashboard/scheduled"
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${isScheduledActive
                        ? 'bg-emerald-500/15 text-emerald-900 border border-emerald-500/30 shadow-2xs'
                        : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
                        }`}
                >
                    <div className="flex items-center space-x-3">
                        <Clock className={`w-4 h-4 ${isScheduledActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                        <span>Scheduled</span>
                    </div>
                    {scheduledCount > 0 && (
                        <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${isScheduledActive ? 'bg-emerald-500 text-white' : 'bg-gray-200/70 text-gray-700'
                                }`}
                        >
                            {scheduledCount}
                        </span>
                    )}
                </Link>

                <Link
                    href="/dashboard/sent"
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${isSentActive
                        ? 'bg-emerald-500/15 text-emerald-900 border border-emerald-500/30 shadow-2xs'
                        : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
                        }`}
                >
                    <div className="flex items-center space-x-3">
                        <CheckCircle2 className={`w-4 h-4 ${isSentActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                        <span>Sent Emails</span>
                    </div>
                    {sentCount > 0 && (
                        <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${isSentActive ? 'bg-emerald-500 text-white' : 'bg-gray-200/70 text-gray-700'
                                }`}
                        >
                            {sentCount}
                        </span>
                    )}
                </Link>

                <div className="px-3 pt-3 pb-1 text-[10px] font-black uppercase tracking-wider text-gray-400">Enterprise SaaS</div>

                <Link
                    href="/dashboard/analytics"
                    className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${isAnalyticsActive
                        ? 'bg-emerald-500/15 text-emerald-900 border border-emerald-500/30 shadow-2xs'
                        : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
                        }`}
                >
                    <BarChart3 className={`w-4 h-4 ${isAnalyticsActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <span>Analytics Dashboard</span>
                </Link>



                <Link
                    href="/dashboard/calendar"
                    className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${isCalendarActive
                        ? 'bg-emerald-500/15 text-emerald-900 border border-emerald-500/30 shadow-2xs'
                        : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
                        }`}
                >
                    <Calendar className={`w-4 h-4 ${isCalendarActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <span>Campaign Calendar</span>
                </Link>

                <Link
                    href="/dashboard/leads"
                    className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${isLeadsActive
                        ? 'bg-emerald-500/15 text-emerald-900 border border-emerald-500/30 shadow-2xs'
                        : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
                        }`}
                >
                    <Users className={`w-4 h-4 ${isLeadsActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <span>Lead Lists & CSV</span>
                </Link>

                <Link
                    href="/dashboard/templates"
                    className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${isTemplatesActive
                        ? 'bg-emerald-500/15 text-emerald-900 border border-emerald-500/30 shadow-2xs'
                        : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
                        }`}
                >
                    <FileText className={`w-4 h-4 ${isTemplatesActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <span>Email Templates</span>
                </Link>
            </nav>
        </aside>
    );
}
