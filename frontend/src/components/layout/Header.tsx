'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, LogOut, HelpCircle, Bell, ChevronDown, Sparkles, CheckCircle2, ShieldCheck, Menu, X, Plus, Clock, Send } from 'lucide-react';
import { User } from '@/types';
import { logoutUser } from '@/lib/api/auth';

interface HeaderProps {
    user?: User | null;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
}

export default function Header({ user, searchQuery = '', onSearchChange }: HeaderProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [showHelpPopover, setShowHelpPopover] = useState(false);
    const [showNotifPopover, setShowNotifPopover] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const displayName = user?.name || 'Rahul Reddy';
    const displayEmail = user?.email || 'kataru.rahul@gmail.com';
    const avatarUrl = user?.avatarUrl || user?.avatar;

    const initials = displayName
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .join('')
        .substring(0, 2)
        .toUpperCase();

    return (
        <header className="h-16 border-b border-white/60 bg-white/70 backdrop-blur-2xl px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_4px_30px_rgba(0,0,0,0.03)] font-sans">
            {/* Brand Logo & Mobile Menu Toggle */}
            <div className="flex items-center space-x-3">
                <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="md:hidden text-gray-700 hover:text-gray-900 p-2 rounded-xl bg-white/60 border border-white/80"
                    aria-label="Toggle Navigation Menu"
                >
                    {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                <Link href="/dashboard/scheduled" className="flex items-center space-x-2 group">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-[0_4px_16px_rgba(16,185,129,0.4)] group-hover:scale-105 transition-all">
                        R
                    </div>
                    <span className="font-bold text-gray-900 text-lg tracking-tight group-hover:text-emerald-700 transition-colors">
                        ReachInbox
                    </span>
                </Link>
            </div>

            {/* Center Search Bar (Responsive) */}
            <div className="hidden sm:flex flex-1 max-w-xl mx-4">
                <div className="relative w-full">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search emails, recipients, or subjects..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 ios-input rounded-2xl text-xs text-gray-900 placeholder-gray-400 font-medium"
                    />
                </div>
            </div>

            {/* Right Utility Icons & Logged-In User Profile */}
            <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Help Popover Button */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setShowHelpPopover(!showHelpPopover);
                            setShowNotifPopover(false);
                            setShowDropdown(false);
                        }}
                        className="text-gray-500 hover:text-gray-900 p-2 sm:p-2.5 rounded-2xl bg-white/50 hover:bg-white/90 border border-white/60 transition-all shadow-2xs"
                        title="Help & Documentation"
                    >
                        <HelpCircle className="w-4 h-4" />
                    </button>

                    {showHelpPopover && (
                        <div className="absolute right-0 mt-2.5 w-72 ios-glass rounded-3xl p-4.5 z-50 text-xs font-sans shadow-2xl animate-fadeIn">
                            <h4 className="font-bold text-gray-900 mb-2 flex items-center space-x-1.5 text-xs">
                                <HelpCircle className="w-4 h-4 text-emerald-600" />
                                <span>Help & Platform Docs</span>
                            </h4>
                            <div className="space-y-2 text-gray-600">
                                <div className="p-2.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                    <p className="font-bold text-emerald-950 text-[11px] mb-0.5">BullMQ Email Scheduler Engine</p>
                                    <p className="text-[10px] text-emerald-800 leading-normal">
                                        Emails are queued using BullMQ + Redis with configurable delays and rate limits.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Notifications Popover Button */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setShowNotifPopover(!showNotifPopover);
                            setShowHelpPopover(false);
                            setShowDropdown(false);
                        }}
                        className="text-gray-500 hover:text-gray-900 p-2 sm:p-2.5 rounded-2xl bg-white/50 hover:bg-white/90 border border-white/60 transition-all shadow-2xs relative"
                        title="Engine Notifications"
                    >
                        <Bell className="w-4 h-4" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute top-2 right-2 ring-2 ring-white animate-pulse" />
                    </button>

                    {showNotifPopover && (
                        <div className="absolute right-0 mt-2.5 w-72 sm:w-80 ios-glass rounded-3xl p-4.5 z-50 text-xs font-sans shadow-2xl animate-fadeIn">
                            <div className="flex items-center justify-between border-b border-gray-200/60 pb-2.5 mb-2.5">
                                <h4 className="font-bold text-gray-900 flex items-center space-x-1.5 text-xs">
                                    <Bell className="w-4 h-4 text-emerald-600" />
                                    <span>Engine Notifications</span>
                                </h4>
                                <span className="text-[10px] bg-emerald-500/15 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                                    Live
                                </span>
                            </div>
                            <div className="space-y-2">
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start space-x-2.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-emerald-950 text-[11px]">Worker Engine Active</p>
                                        <p className="text-[10px] text-emerald-800">BullMQ worker running with concurrency.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Header User Profile & Avatar */}
                <div className="relative">
                    <button
                        onClick={() => {
                            setShowDropdown(!showDropdown);
                            setShowHelpPopover(false);
                            setShowNotifPopover(false);
                        }}
                        className="flex items-center space-x-2 py-1 px-2.5 sm:px-3 rounded-full border border-white/70 bg-white/70 hover:bg-white/90 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/30 shadow-2xs group"
                    >
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt={displayName}
                                className="w-7 h-7 rounded-full object-cover border border-emerald-400/40 flex-shrink-0 group-hover:scale-105 transition-transform"
                            />
                        ) : (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold flex items-center justify-center text-xs shadow-xs flex-shrink-0">
                                {initials}
                            </div>
                        )}
                        <div className="hidden sm:flex flex-col text-left pr-1">
                            <span className="text-xs font-bold text-gray-900 leading-tight truncate max-w-[120px] group-hover:text-emerald-700 transition-colors">
                                {displayName}
                            </span>
                            <span className="text-[10px] text-gray-500 leading-tight truncate max-w-[130px] font-medium">
                                {displayEmail}
                            </span>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </button>

                    {showDropdown && (
                        <div className="absolute right-0 mt-2.5 w-64 ios-glass rounded-3xl shadow-2xl py-1 z-50 text-xs animate-fadeIn font-sans border border-white/80">
                            <div className="px-4 py-3.5 border-b border-gray-200/60 flex items-center space-x-3">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={displayName}
                                        className="w-9 h-9 rounded-full object-cover border border-emerald-400/30 shadow-sm"
                                    />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                                        {initials}
                                    </div>
                                )}
                                <div className="overflow-hidden">
                                    <p className="font-bold text-gray-900 truncate">{displayName}</p>
                                    <p className="text-[11px] text-gray-500 truncate">{displayEmail}</p>
                                </div>
                            </div>

                            <div className="p-1.5">
                                <button
                                    onClick={() => logoutUser()}
                                    className="w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50/80 rounded-2xl flex items-center space-x-2 transition-colors font-bold text-xs"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {showMobileMenu && (
                <div className="md:hidden fixed inset-x-0 top-16 bg-white/95 backdrop-blur-2xl border-b border-gray-200 shadow-2xl p-4 space-y-3 z-50 animate-fadeIn">
                    <Link
                        href="/dashboard/compose"
                        onClick={() => setShowMobileMenu(false)}
                        className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-md"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Compose Campaign</span>
                    </Link>

                    <div className="space-y-2 pt-2">
                        <Link
                            href="/dashboard/scheduled"
                            onClick={() => setShowMobileMenu(false)}
                            className="flex items-center space-x-3 p-3 rounded-2xl bg-emerald-50 text-emerald-900 font-bold text-xs border border-emerald-200"
                        >
                            <Clock className="w-4 h-4 text-emerald-600" />
                            <span>Scheduled Emails</span>
                        </Link>

                        <Link
                            href="/dashboard/sent"
                            onClick={() => setShowMobileMenu(false)}
                            className="flex items-center space-x-3 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold text-xs border border-gray-200"
                        >
                            <Send className="w-4 h-4 text-gray-600" />
                            <span>Sent Emails</span>
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}
