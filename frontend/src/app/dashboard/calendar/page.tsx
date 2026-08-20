'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCalendarEventsApi } from '@/lib/api/enterprise';

export default function CalendarPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await getCalendarEventsApi();
            setEvents(res.events || []);
        } catch (e) {
            console.error('Failed to fetch calendar events', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    // Generate days for current month
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const daysGrid = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        daysGrid.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        daysGrid.push({ day: d, dateStr });
    }

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    return (
        <div className="min-h-screen bg-slate-900/90 text-slate-100 flex flex-col font-sans relative overflow-hidden">
            <Header />
            <div className="flex flex-1 relative z-10">
                <Sidebar user={null} />
                <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto space-y-6">

                    {/* Header Bar */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
                                <CalendarIcon className="w-7 h-7 text-emerald-400" />
                                <span>Interactive Campaign Calendar</span>
                            </h1>
                            <p className="text-xs text-slate-400 mt-1">Visual monthly grid showcasing scheduled & dispatched email batches</p>
                        </div>

                        <div className="flex items-center space-x-3 bg-slate-800 border border-white/10 rounded-2xl p-1.5 px-3">
                            <button onClick={prevMonth} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-extrabold text-white w-36 text-center">
                                {monthName} {year}
                            </span>
                            <button onClick={nextMonth} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Days of Week Header */}
                    <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-wider text-slate-400 py-2 border-b border-white/10">
                        <div>Sun</div>
                        <div>Mon</div>
                        <div>Tue</div>
                        <div>Wed</div>
                        <div>Thu</div>
                        <div>Fri</div>
                        <div>Sat</div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2.5">
                        {daysGrid.map((item, idx) => {
                            if (!item) {
                                return <div key={idx} className="h-32 rounded-2xl bg-slate-800/20 border border-white/5 opacity-30" />;
                            }

                            const dayEvents = events.filter((e) => e.dateStr === item.dateStr);

                            return (
                                <div key={idx} className="h-32 rounded-2xl bg-slate-800/80 border border-white/10 p-2.5 flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-300">{item.day}</span>
                                        {dayEvents.length > 0 && (
                                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                                                {dayEvents.length}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex-1 overflow-y-auto space-y-1 my-1 pr-1 text-[10px]">
                                        {dayEvents.map((e) => (
                                            <div
                                                key={e.id}
                                                className={`p-1.5 rounded-lg border flex items-center justify-between font-medium truncate ${e.status === 'sent'
                                                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                                    }`}
                                            >
                                                <span className="truncate">{e.title}</span>
                                                {e.status === 'sent' ? (
                                                    <CheckCircle2 className="w-3 h-3 flex-shrink-0 text-emerald-400" />
                                                ) : (
                                                    <Clock className="w-3 h-3 flex-shrink-0 text-amber-400" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </main>
            </div>
        </div>
    );
}
