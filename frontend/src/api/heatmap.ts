import apiClient from './client';
import type { HeatmapData, PeakTime, LocationDensity } from '@/types/heatmap';

export async function getHeatmap(eventId: string): Promise<HeatmapData[]> {
  const { data } = await apiClient.get(`/events/${eventId}/heatmap`);
  return data;
}

export async function getPeakTimes(eventId: string): Promise<PeakTime[]> {
  const { data } = await apiClient.get(`/events/${eventId}/heatmap/peak`);
  return data;
}

export async function getLocationDensity(eventId: string): Promise<LocationDensity[]> {
  const { data } = await apiClient.get(`/events/${eventId}/heatmap/locations`);
  return data;
}

export async function generateHeatmap(eventId: string): Promise<void> {
  await apiClient.post(`/events/${eventId}/heatmap/generate`);
}
