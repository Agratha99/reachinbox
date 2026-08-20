import { apiClient as api } from './client';

// Analytics
export async function getAnalyticsSummaryApi() {
    const response = await api.get('/analytics/summary');
    return response.data;
}

// Senders
export async function getSendersApi() {
    const response = await api.get('/senders');
    return response.data;
}

export async function createSenderApi(data: any) {
    const response = await api.post('/senders', data);
    return response.data;
}

export async function testSenderSmtpApi(data: any) {
    const response = await api.post('/senders/test', data);
    return response.data;
}

export async function deleteSenderApi(id: string) {
    const response = await api.delete(`/senders/${id}`);
    return response.data;
}

// Calendar
export async function getCalendarEventsApi() {
    const response = await api.get('/emails/calendar');
    return response.data;
}

// Leads
export async function getLeadListsApi() {
    const response = await api.get('/leads');
    return response.data;
}

export async function createLeadListApi(data: any) {
    const response = await api.post('/leads', data);
    return response.data;
}

export async function deleteLeadListApi(id: string) {
    const response = await api.delete(`/leads/${id}`);
    return response.data;
}

// Templates
export async function getTemplatesApi() {
    const response = await api.get('/templates');
    return response.data;
}

export async function createTemplateApi(data: any) {
    const response = await api.post('/templates', data);
    return response.data;
}

export async function deleteTemplateApi(id: string) {
    const response = await api.delete(`/templates/${id}`);
    return response.data;
}
