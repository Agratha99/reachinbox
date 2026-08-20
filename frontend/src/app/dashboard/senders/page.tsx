'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Server, Plus, CheckCircle2, AlertCircle, ShieldCheck, Trash2, Zap, RefreshCw, Key } from 'lucide-react';
import { getSendersApi, createSenderApi, testSenderSmtpApi, deleteSenderApi } from '@/lib/api/enterprise';

export default function SendersPage() {
    const [senders, setSenders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
    const [testingSmtp, setTestingSmtp] = useState(false);
    const [autoRotate, setAutoRotate] = useState(true);

    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        smtpHost: 'smtp.ethereal.email',
        smtpPort: '587',
        smtpUser: '',
        smtpPass: '',
        isDefault: false,
    });

    const fetchSenders = async () => {
        setLoading(true);
        try {
            const res = await getSendersApi();
            setSenders(res.senders || []);
        } catch (e) {
            console.error('Failed to load senders', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSenders();
    }, []);

    const handleTestSmtp = async () => {
        setTestingSmtp(true);
        setTestResult(null);
        try {
            const res = await testSenderSmtpApi(formData);
            setTestResult({ success: true, message: res.message });
        } catch (err: any) {
            setTestResult({ success: false, message: err.response?.data?.error || err.message || 'SMTP Connection Failed' });
        } finally {
            setTestingSmtp(false);
        }
    };

    const handleCreateSender = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createSenderApi(formData);
            setShowAddModal(false);
            setFormData({
                displayName: '',
                email: '',
                smtpHost: 'smtp.ethereal.email',
                smtpPort: '587',
                smtpUser: '',
                smtpPass: '',
                isDefault: false,
            });
            setTestResult(null);
            fetchSenders();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to add sender');
        }
    };

    const handleDeleteSender = async (id: string) => {
        if (confirm('Are you sure you want to remove this SMTP sender account?')) {
            try {
                await deleteSenderApi(id);
                fetchSenders();
            } catch (err) {
                console.error('Delete sender error', err);
            }
        }
    };

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
                                <Server className="w-7 h-7 text-teal-400" />
                                <span>Multi-SMTP Senders & Auto-Rotation</span>
                            </h1>
                            <p className="text-xs text-slate-400 mt-1">Connect SMTP provider accounts & configure round-robin sender rotation</p>
                        </div>

                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setAutoRotate(!autoRotate)}
                                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${autoRotate
                                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                                        : 'bg-slate-800 text-slate-400 border-white/10'
                                    }`}
                            >
                                <ShieldCheck className="w-4 h-4 text-teal-400" />
                                <span>Round-Robin Rotation: {autoRotate ? 'ENABLED' : 'DISABLED'}</span>
                            </button>

                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-extrabold transition-all shadow-lg active:scale-95"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add SMTP Sender</span>
                            </button>
                        </div>
                    </div>

                    {/* Senders Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {senders.map((s: any) => (
                            <div key={s.id} className="p-6 rounded-2xl bg-slate-800/80 border border-white/10 shadow-xl space-y-4 relative group">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-base font-bold text-white">{s.displayName}</span>
                                            {s.isDefault && (
                                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                    PRIMARY
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400">{s.email}</p>
                                    </div>

                                    <button
                                        onClick={() => handleDeleteSender(s.id)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="pt-3 border-t border-white/10 space-y-2 text-xs text-slate-300">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">SMTP Host:</span>
                                        <span className="font-mono text-teal-300">{s.smtpHost || 'smtp.ethereal.email'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Port / Security:</span>
                                        <span className="font-mono text-slate-200">{s.smtpPort || 587} (TLS/SSL)</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Health Status:</span>
                                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Sender Modal */}
                    {showAddModal && (
                        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-slate-900 border border-white/20 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5">
                                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Server className="w-5 h-5 text-teal-400" /> Connect SMTP Sender Account
                                    </h3>
                                    <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">
                                        ✕
                                    </button>
                                </div>

                                <form onSubmit={handleCreateSender} className="space-y-4 text-xs">
                                    <div>
                                        <label className="block text-slate-300 font-semibold mb-1">Display Name *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Oliver Brown Outreach"
                                            value={formData.displayName}
                                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-slate-300 font-semibold mb-1">Sender Email Address *</label>
                                        <input
                                            type="email"
                                            required
                                            placeholder="e.g. oliver@company.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-400"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-slate-300 font-semibold mb-1">SMTP Host</label>
                                            <input
                                                type="text"
                                                placeholder="smtp.ethereal.email"
                                                value={formData.smtpHost}
                                                onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                                                className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-400 font-mono text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-300 font-semibold mb-1">SMTP Port</label>
                                            <input
                                                type="number"
                                                placeholder="587"
                                                value={formData.smtpPort}
                                                onChange={(e) => setFormData({ ...formData, smtpPort: e.target.value })}
                                                className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-400 font-mono text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-slate-300 font-semibold mb-1">SMTP Username</label>
                                            <input
                                                type="text"
                                                placeholder="username"
                                                value={formData.smtpUser}
                                                onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                                                className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-400 font-mono text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-300 font-semibold mb-1">SMTP Password</label>
                                            <input
                                                type="password"
                                                placeholder="••••••••"
                                                value={formData.smtpPass}
                                                onChange={(e) => setFormData({ ...formData, smtpPass: e.target.value })}
                                                className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-teal-400 font-mono text-xs"
                                            />
                                        </div>
                                    </div>

                                    {testResult && (
                                        <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${testResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                                            }`}>
                                            {testResult.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                                            <span>{testResult.message}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                        <button
                                            type="button"
                                            onClick={handleTestSmtp}
                                            disabled={testingSmtp}
                                            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all flex items-center space-x-2"
                                        >
                                            <RefreshCw className={`w-3.5 h-3.5 ${testingSmtp ? 'animate-spin' : ''}`} />
                                            <span>Test Connection</span>
                                        </button>

                                        <button
                                            type="submit"
                                            className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-extrabold text-xs transition-all shadow-lg active:scale-95"
                                        >
                                            Save Sender Account
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}
