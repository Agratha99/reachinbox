'use client';

import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';

interface CsvUploaderProps {
    onRecipientsUploaded: (validEmails: string[]) => void;
    onClearList?: () => void;
    currentCount?: number;
}

export default function CsvUploader({
    onRecipientsUploaded,
    onClearList,
    currentCount = 0,
}: CsvUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [validCount, setValidCount] = useState<number>(0);
    const [invalidList, setInvalidList] = useState<string[]>([]);
    const [showInvalidModal, setShowInvalidModal] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        setFileName(file.name);

        Papa.parse(file, {
            complete: (results) => {
                const rawStrings: string[] = [];

                results.data.forEach((row: any) => {
                    if (typeof row === 'string') {
                        rawStrings.push(row);
                    } else if (Array.isArray(row)) {
                        row.forEach((cell) => typeof cell === 'string' && rawStrings.push(cell));
                    } else if (typeof row === 'object' && row !== null) {
                        Object.values(row).forEach((val) => typeof val === 'string' && rawStrings.push(val));
                    }
                });

                const extracted = rawStrings
                    .flatMap((str) => str.split(/[\s,;]+/))
                    .map((s) => s.trim())
                    .filter(Boolean);

                const valid: string[] = [];
                const invalid: string[] = [];

                extracted.forEach((item) => {
                    if (emailRegex.test(item)) {
                        valid.push(item);
                    } else if (item.length > 3 && item.includes('@')) {
                        invalid.push(item);
                    }
                });

                const uniqueValid = Array.from(new Set(valid));
                setValidCount(uniqueValid.length);
                setInvalidList(invalid);
                setIsProcessing(false);

                if (uniqueValid.length > 0) {
                    onRecipientsUploaded(uniqueValid);
                }
            },
            error: (err) => {
                console.error('CSV Parsing Error:', err);
                setIsProcessing(false);
            },
        });
    };

    return (
        <div className="inline-block">
            <input
                type="file"
                ref={fileInputRef}
                accept=".csv,.txt"
                onChange={handleFileSelect}
                className="hidden"
            />

            {fileName ? (
                <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>
                        {fileName} ({validCount.toLocaleString()} Recipients)
                    </span>
                    {invalidList.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setShowInvalidModal(true)}
                            className="text-amber-700 underline hover:text-amber-900 ml-1"
                        >
                            {invalidList.length} invalid
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            setFileName(null);
                            setValidCount(0);
                            setInvalidList([]);
                            onClearList?.();
                            if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-gray-400 hover:text-red-600 ml-2"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-xs font-medium transition-colors shadow-sm"
                >
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isProcessing ? 'Processing...' : 'Upload List (.csv)'}</span>
                </button>
            )}

            {/* Invalid addresses dialog */}
            {showInvalidModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-gray-200 text-sm">
                        <div className="flex items-center space-x-2 text-amber-600 font-semibold mb-2">
                            <AlertTriangle className="w-5 h-5" />
                            <span>Invalid Email Addresses Removed ({invalidList.length})</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">
                            The following rows did not match valid email syntax and were automatically excluded from your recipient list:
                        </p>
                        <div className="max-h-40 overflow-y-auto bg-gray-50 p-3 rounded-lg border border-gray-200 font-mono text-xs text-gray-700 space-y-1 mb-4">
                            {invalidList.map((inv, idx) => (
                                <div key={idx} className="truncate">
                                    • {inv}
                                </div>
                            ))}
                        </div>
                        <div className="text-right">
                            <button
                                type="button"
                                onClick={() => setShowInvalidModal(false)}
                                className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-medium text-xs hover:bg-emerald-700"
                            >
                                Got It
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
