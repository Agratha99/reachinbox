'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { FileText, Plus, Smartphone, Monitor, Trash2, Tag, Copy, Sparkles } from 'lucide-react';
import { getTemplatesApi, createTemplateApi, deleteTemplateApi } from '@/lib/api/enterprise';

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');

    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        body: '<p>Hi {{firstName}},</p>\n<p>Thanks for connecting! I wanted to share our latest product updates with {{company}}.</p>\n<p>Best,<br/>Oliver</p>',
        category: 'Sales Outreach',
    });

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await getTemplatesApi();
            setTemplates(res.templates || []);
        } catch (e) {
            console.error('Failed to load templates', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleInsertTag = (tag: string) => {
        setFormData((prev) => ({
            ...prev,
            body: prev.body + ` ${tag}`,
        }));
    };

    const handleCreateTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createTemplateApi(formData);
            setShowAddModal(false);
            setFormData({
                name: '',
                subject: '',
                body: '<p>Hi {{firstName}},</p>\n<p>Thanks for connecting! I wanted to share our latest product updates with {{company}}.</p>\n<p>Best,<br/>Oliver</p>',
                category: 'Sales Outreach',
            });
            fetchTemplates();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to save template');
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        if (confirm('Delete this template?')) {
            try {
                await deleteTemplateApi(id);
                fetchTemplates();
            } catch (e) {
                console.error('Delete template error', e);
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
                                <FileText className="w-7 h-7 text-emerald-400" />
                                <span>Reusable Email Template Engine</span>
                            </h1>
                            <p className="text-xs text-slate-400 mt-1">Design email templates with dynamic tags and live viewport preview</p>
                        </div>

                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 text-white text-xs font-extrabold transition-all shadow-lg active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Create Template</span>
                        </button>
                    </div>

                    {/* Templates Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {templates.map((t: any) => (
                            <div key={t.id} className="p-6 rounded-2xl bg-slate-800/80 border border-white/10 shadow-xl space-y-4 relative flex flex-col justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                                            {t.category || 'General'}
                                        </span>
                                        <button
                                            onClick={() => handleDeleteTemplate(t.id)}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <h3 className="text-base font-bold text-white">{t.name}</h3>
                                    <p className="text-xs text-emerald-400 font-semibold truncate">Subject: {t.subject}</p>
                                </div>

                                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-300 font-mono max-h-32 overflow-hidden text-ellipsis">
                                    <div dangerouslySetInnerHTML={{ __html: t.body }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Template Modal */}
                    {showAddModal && (
                        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-slate-900 border border-white/20 rounded-3xl p-6 w-full max-w-4xl shadow-2xl space-y-5">
                                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-emerald-400" /> Create Email Template
                                    </h3>

                                    {/* Desktop / Mobile Preview Toggle */}
                                    <div className="flex items-center space-x-2 bg-slate-800 p-1 rounded-xl border border-white/10">
                                        <button
                                            onClick={() => setViewportMode('desktop')}
                                            className={`p-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 ${viewportMode === 'desktop' ? 'bg-emerald-500 text-white' : 'text-slate-400'
                                                }`}
                                        >
                                            <Monitor className="w-4 h-4" /> <span>Desktop</span>
                                        </button>
                                        <button
                                            onClick={() => setViewportMode('mobile')}
                                            className={`p-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 ${viewportMode === 'mobile' ? 'bg-emerald-500 text-white' : 'text-slate-400'
                                                }`}
                                        >
                                            <Smartphone className="w-4 h-4" /> <span>Mobile</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <form onSubmit={handleCreateTemplate} className="space-y-4 text-xs">
                                        <div>
                                            <label className="block text-slate-300 font-semibold mb-1">Template Name *</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Sales Intro Template"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-slate-300 font-semibold mb-1">Subject Line *</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Quick question for {{firstName}}"
                                                value={formData.subject}
                                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-400"
                                            />
                                        </div>

                                        {/* Dynamic Variable Chips */}
                                        <div>
                                            <label className="block text-slate-300 font-semibold mb-1">Insert Dynamic Variable</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['{{firstName}}', '{{lastName}}', '{{company}}', '{{role}}'].map((tag) => (
                                                    <button
                                                        type="button"
                                                        key={tag}
                                                        onClick={() => handleInsertTag(tag)}
                                                        className="px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[11px] font-mono hover:bg-teal-500/30"
                                                    >
                                                        + {tag}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-slate-300 font-semibold mb-1">Email Body (HTML/Text) *</label>
                                            <textarea
                                                rows={6}
                                                required
                                                value={formData.body}
                                                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                                className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-emerald-400"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs transition-all shadow-lg active:scale-95"
                                        >
                                            Save Template
                                        </button>
                                    </form>

                                    {/* Live Viewport Preview Panel */}
                                    <div className="flex flex-col items-center justify-center p-4 bg-slate-950/60 border border-white/10 rounded-2xl">
                                        <span className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                                            Live {viewportMode} Viewport Preview
                                        </span>
                                        <div
                                            className={`bg-white text-slate-900 rounded-2xl p-4 shadow-2xl transition-all overflow-y-auto ${viewportMode === 'mobile' ? 'w-[280px] h-[360px]' : 'w-full h-[360px]'
                                                }`}
                                        >
                                            <div className="border-b border-slate-200 pb-2 mb-3">
                                                <p className="text-[11px] font-bold text-slate-500">Subject:</p>
                                                <p className="text-xs font-extrabold text-slate-800">{formData.subject || '(Empty Subject)'}</p>
                                            </div>
                                            <div
                                                className="text-xs text-slate-700 font-sans leading-relaxed"
                                                dangerouslySetInnerHTML={{ __html: formData.body }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
}
