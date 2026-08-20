'use client';

import React from 'react';
import AppShell from '@/components/layout/AppShell';
import ComposeForm from '@/components/compose/ComposeForm';

export default function ComposePage() {
    return (
        <AppShell>
            <div className="py-2">
                <ComposeForm />
            </div>
        </AppShell>
    );
}
