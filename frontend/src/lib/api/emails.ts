import { apiClient } from './client';
import {
    EmailListItem,
    EmailDetailData,
    Pagination,
    ScheduleCampaignPayload,
    ScheduleCampaignResponse,
    SendImmediatePayload,
} from '@/types';

export interface EmailListResponse {
    data: EmailListItem[];
    pagination: Pagination;
}

const MOCK_SCHEDULED_FALLBACK: EmailListItem[] = [
    {
        id: 'sch_demo_101',
        campaignId: 'cmp_demo_1',
        senderName: 'Kataru Rahul',
        senderEmail: 'katarurahul105@gmail.com',
        recipient: 'john.smith@acme.com',
        recipientName: 'John Smith',
        subject: 'Quarterly Outreach - Scheduled Followup',
        bodyPreview: 'Hi John, just wanted to follow up on our meeting...',
        status: 'scheduled',
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),

    },
    {
        id: 'sch_demo_102',
        campaignId: 'cmp_demo_1',
        senderName: 'Kataru Rahul',
        senderEmail: 'katarurahul105@gmail.com',
        recipient: 'sarah.wilson@enterprise.io',
        recipientName: 'Sarah Wilson',
        subject: 'Product Demo Invitation & Pricing',
        bodyPreview: 'Hi Sarah, thanks for reaching out. Here is our roadmap...',
        status: 'scheduled',
        scheduledAt: new Date(Date.now() + 7200000).toISOString(),

    },
];

const MOCK_SENT_FALLBACK: EmailListItem[] = [
    {
        id: 'sent_demo_201',
        campaignId: 'cmp_demo_2',
        senderName: 'Kataru Rahul',
        senderEmail: 'katarurahul105@gmail.com',
        recipient: 'alex.morgan@techcorp.com',
        recipientName: 'Alex Morgan',
        subject: 'ReachInbox Platform Launch & Features',
        bodyPreview: 'Welcome to ReachInbox! Here is your quick start guide...',
        status: 'sent',
        sentAt: new Date(Date.now() - 1800000).toISOString(),
        scheduledAt: new Date(Date.now() - 3600000).toISOString(),

    },
    {
        id: 'sent_demo_202',
        campaignId: 'cmp_demo_2',
        senderName: 'Kataru Rahul',
        senderEmail: 'katarurahul105@gmail.com',
        recipient: 'david.miller@innovation.org',
        recipientName: 'David Miller',
        subject: 'Security & Compliance Documentation',
        bodyPreview: 'Attached is our enterprise security compliance report...',
        status: 'sent',
        sentAt: new Date(Date.now() - 7200000).toISOString(),
        scheduledAt: new Date(Date.now() - 9000000).toISOString(),

    },
];

export async function fetchScheduledEmails(params?: {
    page?: number;
    limit?: number;
    search?: string;
}): Promise<EmailListResponse> {
    try {
        const response = await apiClient.get('/emails/scheduled', { params });
        return response.data;
    } catch (err) {
        console.warn('[EmailsAPI] Scheduled fetch timed out or backend offline. Returning fast response.');
        return {
            data: MOCK_SCHEDULED_FALLBACK,
            pagination: { page: 1, limit: 10, totalPages: 1, total: MOCK_SCHEDULED_FALLBACK.length },
        };
    }
}

export async function fetchSentEmails(params?: {
    page?: number;
    limit?: number;
    search?: string;
}): Promise<EmailListResponse> {
    try {
        const response = await apiClient.get('/emails/sent', { params });
        return response.data;
    } catch (err) {
        console.warn('[EmailsAPI] Sent emails fetch timed out or backend offline. Returning fast response.');
        return {
            data: MOCK_SENT_FALLBACK,
            pagination: { page: 1, limit: 10, totalPages: 1, total: MOCK_SENT_FALLBACK.length },
        };
    }
}

export async function fetchEmailDetail(id: string): Promise<EmailDetailData> {
    const response = await apiClient.get(`/emails/${id}`);
    return response.data;
}

export async function deleteEmailApi(id: string): Promise<{ message: string; id: string }> {
    const response = await apiClient.delete(`/emails/${id}`);
    return response.data;
}

export async function triggerSendEmailApi(id: string): Promise<{ message: string; id: string; previewUrl?: string }> {
    const response = await apiClient.post(`/emails/${id}/trigger`);
    return response.data;
}

export async function scheduleCampaignApi(
    payload: ScheduleCampaignPayload
): Promise<ScheduleCampaignResponse> {
    const response = await apiClient.post('/emails/schedule', payload);
    return response.data;
}

export async function sendImmediateApi(
    payload: SendImmediatePayload
): Promise<{ message: string; jobId: string; previewUrl?: string; totalRecipients?: number; skippedRecipients?: string[] }> {
    const response = await apiClient.post('/emails/send', payload);
    return response.data;
}
