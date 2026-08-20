'use client';

import React, { useState, KeyboardEvent } from 'react';
import { X, UserPlus } from 'lucide-react';

interface RecipientInputProps {
    recipients: string[];
    onRecipientsChange: (newList: string[]) => void;
}

export default function RecipientInput({ recipients, onRecipientsChange }: RecipientInputProps) {
    const [inputValue, setInputValue] = useState('');

    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    };

    const addRecipient = (emailStr: string) => {
        const email = emailStr.trim();
        if (email && isValidEmail(email) && !recipients.includes(email)) {
            onRecipientsChange([...recipients, email]);
            setInputValue('');
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addRecipient(inputValue);
        } else if (e.key === 'Backspace' && !inputValue && recipients.length > 0) {
            onRecipientsChange(recipients.slice(0, -1));
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text');
        const emails = pastedData.split(/[\s,;]+/).filter(isValidEmail);
        if (emails.length > 0) {
            const combined = Array.from(new Set([...recipients, ...emails]));
            onRecipientsChange(combined);
            setInputValue('');
        }
    };

    const removeRecipient = (indexToRemove: number) => {
        onRecipientsChange(recipients.filter((_, idx) => idx !== indexToRemove));
    };

    // Truncate display for 1000+ recipients matching requirement #44
    const displayLimit = 4;
    const visibleRecipients = recipients.slice(0, displayLimit);
    const remainingCount = recipients.length - displayLimit;

    return (
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white border border-gray-200 rounded-lg min-h-[42px] focus-within:ring-1 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
            {visibleRecipients.map((email, idx) => (
                <span
                    key={idx}
                    className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium"
                >
                    <span>{email}</span>
                    <button
                        type="button"
                        onClick={() => removeRecipient(idx)}
                        className="hover:text-emerald-950 focus:outline-none"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </span>
            ))}

            {remainingCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                    +{remainingCount} more
                </span>
            )}

            <input
                type="email"
                placeholder={recipients.length === 0 ? 'recipient@example.com (Press Enter or Comma)' : ''}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onBlur={() => inputValue && addRecipient(inputValue)}
                className="flex-1 min-w-[200px] border-none outline-none text-xs text-gray-800 placeholder-gray-400 bg-transparent px-1 py-0.5"
            />
        </div>
    );
}
