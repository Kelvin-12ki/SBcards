import apiClient from './client';
import type { Insight } from '@/types/insight';

export async function generateInsights(): Promise<Insight[]> {
  const { data } = await apiClient.post('/insights/generate');
  return data;
}

export async function getInsights(type?: string): Promise<Insight[]> {
  const { data } = await apiClient.get('/insights', { params: { type } });
  return data;
}

export async function dismissInsight(id: string): Promise<void> {
  await apiClient.patch(`/insights/${id}/dismiss`);
}
