import { apiClient as api } from './client';

// Analytics
export async function getAnalyticsSummaryApi() {
    const response = await api.get('/api/analytics/summary');
    return response.data;
}

// Senders
export async function getSendersApi() {
    const response = await api.get('/api/senders');
    return response.data;
}

export async function createSenderApi(data: any) {
    const response = await api.post('/api/senders', data);
    return response.data;
}

export async function testSenderSmtpApi(data: any) {
    const response = await api.post('/api/senders/test', data);
    return response.data;
}

export async function deleteSenderApi(id: string) {
    const response = await api.delete(`/api/senders/${id}`);
    return response.data;
}

// Calendar
export async function getCalendarEventsApi() {
    const response = await api.get('/api/emails/calendar');
    return response.data;
}

// Leads
export async function getLeadListsApi() {
    const response = await api.get('/api/leads');
    return response.data;
}

export async function createLeadListApi(data: any) {
    const response = await api.post('/api/leads', data);
    return response.data;
}

export async function deleteLeadListApi(id: string) {
    const response = await api.delete(`/api/leads/${id}`);
    return response.data;
}

// Templates
export async function getTemplatesApi() {
    const response = await api.get('/api/templates');
    return response.data;
}

export async function createTemplateApi(data: any) {
    const response = await api.post('/api/templates', data);
    return response.data;
}

export async function deleteTemplateApi(id: string) {
    const response = await api.delete(`/api/templates/${id}`);
    return response.data;
}
