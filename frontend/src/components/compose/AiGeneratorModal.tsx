'use client';

import React, { useState } from 'react';
import { Sparkles, X, Wand2, Check, Copy } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface AiGeneratorModalProps {
    onSelectTemplate: (subject: string, body: string) => void;
    onClose: () => void;
}

export default function AiGeneratorModal({ onSelectTemplate, onClose }: AiGeneratorModalProps) {
    const [prompt, setPrompt] = useState('Outreach to tech founders offering AI email automation & spintax');
    const [tone, setTone] = useState('Professional');
    const [isGenerating, setIsGenerating] = useState(false);
    const [templates, setTemplates] = useState<Array<{ id: string; title: string; subject: string; body: string }>>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsGenerating(true);
        try {
            const res = await apiClient.post('/ai/generate-email', { prompt, tone });
            if (res.data?.templates) {
                setTemplates(res.data.templates);
                if (res.data.templates.length > 0) {
                    setSelectedId(res.data.templates[0].id);
                }
            }
        } catch (err) {
            console.error('AI generation error:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleApply = () => {
        const chosen = templates.find((t) => t.id === selectedId);
        if (chosen) {
            onSelectTemplate(chosen.subject, chosen.body);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-emerald-200 animate-pulse" />
                        <h2 className="text-base font-bold">AI Cold Email Generator</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 text-white/80 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-5 flex-1">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Describe your offer or campaign goal
                        </label>
                        <textarea
                            rows={2}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g. Outreach to SaaS founders offering email queue optimization"
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <label className="text-xs font-semibold text-gray-600">Tone:</label>
                            {['Professional', 'Casual', 'Persuasive', 'Urgent'].map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setTone(t)}
                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${tone === t
                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={isGenerating || !prompt.trim()}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 disabled:opacity-50 transition-all"
                        >
                            <Wand2 className="w-4 h-4" />
                            <span>{isGenerating ? 'Generating...' : 'Generate AI Templates'}</span>
                        </button>
                    </div>

                    {/* Generated Templates Options */}
                    {templates.length > 0 && (
                        <div className="space-y-3 pt-2">
                            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Select Generated Variation
                            </h3>
                            <div className="space-y-3">
                                {templates.map((tpl) => (
                                    <div
                                        key={tpl.id}
                                        onClick={() => setSelectedId(tpl.id)}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedId === tpl.id
                                                ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-emerald-900 bg-emerald-100/80 px-2.5 py-0.5 rounded-md">
                                                {tpl.title}
                                            </span>
                                            {selectedId === tpl.id && <Check className="w-4 h-4 text-emerald-600 font-bold" />}
                                        </div>

                                        <div className="text-xs font-semibold text-gray-900 mb-1">
                                            Subject: <span className="font-normal text-gray-700">{tpl.subject}</span>
                                        </div>

                                        <div
                                            className="text-xs text-gray-600 border-t border-gray-100 pt-2 font-mono text-[11px] leading-relaxed line-clamp-4"
                                            dangerouslySetInnerHTML={{ __html: tpl.body }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-200/60 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={!selectedId}
                        className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-colors"
                    >
                        Use Selected Template
                    </button>
                </div>
            </div>
        </div>
    );
}
