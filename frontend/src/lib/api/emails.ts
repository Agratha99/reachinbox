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

export async function fetchScheduledEmails(params?: {
    page?: number;
    limit?: number;
    search?: string;
}): Promise<EmailListResponse> {
    const response = await apiClient.get('/emails/scheduled', { params });
    return response.data;
}

export async function fetchSentEmails(params?: {
    page?: number;
    limit?: number;
    search?: string;
}): Promise<EmailListResponse> {
    const response = await apiClient.get('/emails/sent', { params });
    return response.data;
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
