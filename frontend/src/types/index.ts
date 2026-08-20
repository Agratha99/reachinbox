export type EmailStatus = 'scheduled' | 'processing' | 'sent' | 'failed' | 'cancelled';

export interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    avatar?: string;
    senders?: Sender[];
}

export interface Sender {
    id: string;
    userId: string;
    email: string;
    displayName: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    isDefault: boolean;
}

export interface EmailListItem {
    id: string;
    campaignId: string;
    senderEmail: string;
    senderName: string;
    recipient: string;
    recipientName?: string;
    subject: string;
    bodyPreview: string;
    scheduledAt: string;
    sentAt?: string;
    status: EmailStatus;
    errorMessage?: string;
    messageId?: string;
    previewUrl?: string;
    delayMs?: number;
    delayBetweenSeconds?: number;
    hourlyLimit?: number;
}

export interface EmailDetailData {
    id: string;
    campaignId: string;
    campaignName: string;
    senderEmail: string;
    senderName: string;
    recipient: string;
    recipientName?: string;
    subject: string;
    body: string;
    scheduledAt: string;
    sentAt?: string;
    status: EmailStatus;
    errorMessage?: string;
    messageId?: string;
    previewUrl?: string;
    attempts: number;
    attemptCount?: number;
    delayMs?: number;
    delayBetweenSeconds?: number;
    hourlyLimit: number;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface ScheduleCampaignPayload {
    senderId?: string;
    recipients: string[] | { email: string; name?: string }[];
    subject: string;
    body: string;
    scheduledAt?: string;
    delayMs?: number;
    delayBetweenSeconds?: number;
    hourlyLimit?: number;
}

export interface ScheduleCampaignResponse {
    message: string;
    campaignId: string;
    totalRecipients: number;
    scheduledAt: string;
    estimatedDurationMinutes: number;
}

export interface SendImmediatePayload {
    senderId?: string;
    recipient?: string;
    recipients?: string[] | { email: string; name?: string }[];
    subject: string;
    body: string;
}
