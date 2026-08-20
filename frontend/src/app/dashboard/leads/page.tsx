'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Users, Upload, CheckCircle2, AlertTriangle, FileText, Trash2, Plus, Filter } from 'lucide-react';
import { getLeadListsApi, createLeadListApi, deleteLeadListApi } from '@/lib/api/enterprise';

export default function LeadsPage() {
    const [lists, setLists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);

    const [listName, setListName] = useState('');
    const [description, setDescription] = useState('');
    const [rawCsvText, setRawCsvText] = useState('');
    const [parsedLeads, setParsedLeads] = useState<any[]>([]);
    const [invalidEmailsCount, setInvalidEmailsCount] = useState(0);

    const fetchLeadLists = async () => {
        setLoading(true);
        try {
            const res = await getLeadListsApi();
            setLists(res.lists || []);
        } catch (e) {
            console.error('Failed to load lead lists', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeadLists();
    }, []);

    const handleParseCsv = (text: string) => {
        setRawCsvText(text);
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        const valid: any[] = [];
        let invalid = 0;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        lines.forEach((line) => {
            const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
            const emailCandidate = parts.find((p) => emailRegex.test(p));

            if (emailCandidate) {
                const nameCandidate = parts.find((p) => p !== emailCandidate && !p.includes('@'));
                valid.push({
                    email: emailCandidate,
                    name: nameCandidate || undefined,
                });
            } else {
                invalid++;
            }
        });

        setParsedLeads(valid);
        setInvalidEmailsCount(invalid);
    };

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!listName || parsedLeads.length === 0) {
            alert('Please provide a list name and at least one valid lead.');
            return;
        }

        try {
            await createLeadListApi({
                name: listName,
                description,
                leads: parsedLeads,
            });
            setShowUploadModal(false);
            setListName('');
            setDescription('');
            setRawCsvText('');
            setParsedLeads([]);
            fetchLeadLists();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to create lead list');
        }
    };

    const handleDeleteList = async (id: string) => {
        if (confirm('Delete this lead list directory?')) {
            try {
                await deleteLeadListApi(id);
                fetchLeadLists();
            } catch (e) {
                console.error('Delete lead list error', e);
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
                                <Users className="w-7 h-7 text-emerald-400" />
                                <span>Saved Lead Lists & CSV Cleaner</span>
                            </h1>
                            <p className="text-xs text-slate-400 mt-1">Upload CSV files, pre-validate emails, and store segment directory</p>
                        </div>

                        <button
                            onClick={() => setShowUploadModal(true)}
                            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 text-white text-xs font-extrabold transition-all shadow-lg active:scale-95"
                        >
                            <Upload className="w-4 h-4" />
                            <span>Import Lead List (CSV)</span>
                        </button>
                    </div>

                    {/* Lead Lists Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {lists.map((l: any) => (
                            <div key={l.id} className="p-6 rounded-2xl bg-slate-800/80 border border-white/10 shadow-xl space-y-4 relative">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-base font-bold text-white">{l.name}</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">{l.description || 'No description'}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteList(l.id)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                                    <span className="text-slate-400">Total Valid Leads:</span>
                                    <span className="font-extrabold text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-500/20">
                                        {l._count?.leads || l.leadsCount || 0} leads
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Upload Modal */}
                    {showUploadModal && (
                        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-slate-900 border border-white/20 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5">
                                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Upload className="w-5 h-5 text-emerald-400" /> Import & Pre-Validate Lead CSV
                                    </h3>
                                    <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">
                                        ✕
                                    </button>
                                </div>

                                <form onSubmit={handleCreateList} className="space-y-4 text-xs">
                                    <div>
                                        <label className="block text-slate-300 font-semibold mb-1">List Name *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Q3 Tech Founders"
                                            value={listName}
                                            onChange={(e) => setListName(e.target.value)}
                                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-slate-300 font-semibold mb-1">Paste CSV / Email Rows *</label>
                                        <textarea
                                            rows={5}
                                            placeholder={`john@company.com, John Smith\nsarah@startup.io, Sarah Wilson`}
                                            value={rawCsvText}
                                            onChange={(e) => handleParseCsv(e.target.value)}
                                            className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-emerald-400"
                                        />
                                    </div>

                                    {parsedLeads.length > 0 && (
                                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-1">
                                            <div className="flex items-center justify-between font-bold">
                                                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Pre-Validated Clean Leads</span>
                                                <span>{parsedLeads.length} leads</span>
                                            </div>
                                            {invalidEmailsCount > 0 && (
                                                <p className="text-[11px] text-amber-400 font-medium">
                                                    ⚠️ Filtered out {invalidEmailsCount} invalid/malformed email rows automatically.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex justify-end pt-4 border-t border-white/10">
                                        <button
                                            type="submit"
                                            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs transition-all shadow-lg active:scale-95"
                                        >
                                            Save Lead List Directory
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
