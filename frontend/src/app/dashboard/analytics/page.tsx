'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { BarChart3, TrendingUp, CheckCircle2, Clock, AlertTriangle, Zap, Server, ShieldCheck, RefreshCw } from 'lucide-react';
import { getAnalyticsSummaryApi } from '@/lib/api/enterprise';

export default function AnalyticsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await getAnalyticsSummaryApi();
            setData(res);
        } catch (e) {
            console.error('Failed to load analytics', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const metrics = data?.metrics || {
        totalDispatches: 0,
        totalScheduled: 0,
        totalSent: 0,
        totalFailed: 0,
        totalCampaigns: 0,
        totalSenders: 1,
        successRate: 100,
        sentInLastHour: 0,
        maxHourlyLimit: 200,
        throughputPercentage: 0,
    };

    const weeklyTrend = data?.weeklyTrend || [];

    return (
        <div className="min-h-screen bg-slate-900/90 text-slate-100 flex flex-col font-sans relative overflow-hidden">
            <Header />
            <div className="flex flex-1 relative z-10">
                <Sidebar user={null} />
                <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto space-y-8">

                    {/* Header Bar */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
                                <BarChart3 className="w-7 h-7 text-emerald-400" />
                                <span>Enterprise Analytics & Throughput</span>
                            </h1>
                            <p className="text-xs text-slate-400 mt-1">Real-time dispatch telemetry, sender health, and delivery metrics</p>
                        </div>
                        <button
                            onClick={fetchAnalytics}
                            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 active:scale-95"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            <span>Refresh Metrics</span>
                        </button>
                    </div>

                    {/* Metric Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                        <div className="p-5 rounded-2xl bg-slate-800/80 border border-white/10 shadow-lg">
                            <div className="flex items-center justify-between text-slate-400 mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider">Total Dispatches</span>
                                <Zap className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div className="text-3xl font-black text-white">{metrics.totalDispatches}</div>
                            <div className="text-[11px] text-emerald-400 font-semibold mt-2 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" /> Across {metrics.totalCampaigns} Campaigns
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-800/80 border border-white/10 shadow-lg">
                            <div className="flex items-center justify-between text-slate-400 mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider">Success Rate</span>
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div className="text-3xl font-black text-emerald-400">{metrics.successRate}%</div>
                            <div className="text-[11px] text-slate-400 font-medium mt-2">
                                {metrics.totalSent} Sent / {metrics.totalFailed} Failed
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-800/80 border border-white/10 shadow-lg">
                            <div className="flex items-center justify-between text-slate-400 mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider">Currently Scheduled</span>
                                <Clock className="w-4 h-4 text-amber-400" />
                            </div>
                            <div className="text-3xl font-black text-amber-400">{metrics.totalScheduled}</div>
                            <div className="text-[11px] text-slate-400 font-medium mt-2">Pending BullMQ dispatch</div>
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-800/80 border border-white/10 shadow-lg">
                            <div className="flex items-center justify-between text-slate-400 mb-2">
                                <span className="text-xs font-bold uppercase tracking-wider">Active Senders</span>
                                <Server className="w-4 h-4 text-teal-400" />
                            </div>
                            <div className="text-3xl font-black text-teal-300">{metrics.totalSenders}</div>
                            <div className="text-[11px] text-teal-400 font-medium mt-2 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Smart Rotation Ready
                            </div>
                        </div>
                    </div>

                    {/* Throughput Speed Gauge & Hourly Meter */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl bg-slate-800/80 border border-white/10 shadow-xl space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                        <Zap className="w-4 h-4 text-emerald-400" /> Hourly Sending Rate Limit Meter
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">Monitoring anti-spam rate limits (Max {metrics.maxHourlyLimit}/hr)</p>
                                </div>
                                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    {metrics.sentInLastHour} / {metrics.maxHourlyLimit} sent
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-slate-700/60 rounded-full h-4 p-0.5 overflow-hidden border border-white/5">
                                <div
                                    className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.max(5, metrics.throughputPercentage)}%` }}
                                />
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                                <span>0 emails/hr</span>
                                <span className="font-bold text-white">{metrics.throughputPercentage}% Capacity</span>
                                <span>{metrics.maxHourlyLimit} emails/hr limit</span>
                            </div>
                        </div>

                        {/* Delivery Ratio */}
                        <div className="p-6 rounded-2xl bg-slate-800/80 border border-white/10 shadow-xl space-y-4">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-teal-400" /> Delivery Status Ratios
                            </h3>

                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                                        <span>Sent Successfully</span>
                                        <span className="text-emerald-400">{metrics.totalSent} jobs</span>
                                    </div>
                                    <div className="w-full bg-slate-700/60 rounded-full h-2">
                                        <div
                                            className="bg-emerald-500 h-2 rounded-full"
                                            style={{ width: `${metrics.totalDispatches > 0 ? (metrics.totalSent / metrics.totalDispatches) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                                        <span>Pending Queue</span>
                                        <span className="text-amber-400">{metrics.totalScheduled} jobs</span>
                                    </div>
                                    <div className="w-full bg-slate-700/60 rounded-full h-2">
                                        <div
                                            className="bg-amber-400 h-2 rounded-full"
                                            style={{ width: `${metrics.totalDispatches > 0 ? (metrics.totalScheduled / metrics.totalDispatches) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                                        <span>Bounced / Failed</span>
                                        <span className="text-rose-400">{metrics.totalFailed} jobs</span>
                                    </div>
                                    <div className="w-full bg-slate-700/60 rounded-full h-2">
                                        <div
                                            className="bg-rose-500 h-2 rounded-full"
                                            style={{ width: `${metrics.totalDispatches > 0 ? (metrics.totalFailed / metrics.totalDispatches) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 7-Day Volume Visual Bar Chart */}
                    <div className="p-6 rounded-2xl bg-slate-800/80 border border-white/10 shadow-xl space-y-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-400" /> 7-Day Dispatch Volume Breakdown
                        </h3>

                        <div className="h-44 flex items-end justify-between gap-4 pt-6 pb-2 px-4 border-b border-white/10">
                            {weeklyTrend.map((item: any, idx: number) => {
                                const max = Math.max(...weeklyTrend.map((t: any) => t.count), 5);
                                const heightPct = Math.round((item.count / max) * 100);
                                return (
                                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                                        <span className="text-[10px] font-bold text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {item.count}
                                        </span>
                                        <div
                                            className="w-full max-w-[40px] bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-lg transition-all group-hover:brightness-125"
                                            style={{ height: `${Math.max(12, heightPct)}%` }}
                                        />
                                        <span className="text-[11px] font-semibold text-slate-400">{item.day}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
}
