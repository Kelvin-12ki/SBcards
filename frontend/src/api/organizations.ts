import apiClient from './client';
import type { Organization, OrganizationMembership } from '@/types/organization';

export async function createOrganization(data: { name: string; description?: string; website?: string }): Promise<Organization> {
  const { data: result } = await apiClient.post<Organization>('/organizations', data);
  return result;
}

export async function getMyOrganizations(): Promise<Organization[]> {
  const { data } = await apiClient.get<Organization[]>('/organizations');
  return data;
}

export async function getOrganization(id: string): Promise<Organization> {
  const { data } = await apiClient.get<Organization>(`/organizations/${id}`);
  return data;
}

export async function updateOrganization(id: string, data: Partial<Organization>): Promise<Organization> {
  const { data: result } = await apiClient.patch<Organization>(`/organizations/${id}`, data);
  return result;
}

export async function getOrganizationMembers(id: string): Promise<OrganizationMembership[]> {
  const { data } = await apiClient.get<OrganizationMembership[]>(`/organizations/${id}/members`);
  return data;
}

export async function addOrganizationMember(id: string, data: { userId: string; role: string }): Promise<OrganizationMembership> {
  const { data: result } = await apiClient.post<OrganizationMembership>(`/organizations/${id}/members`, data);
  return result;
}

export async function updateMemberRole(orgId: string, userId: string, role: string): Promise<OrganizationMembership> {
  const { data } = await apiClient.patch<OrganizationMembership>(`/organizations/${orgId}/members/${userId}`, { role });
  return data;
}

export async function removeMember(orgId: string, userId: string): Promise<void> {
  await apiClient.delete(`/organizations/${orgId}/members/${userId}`);
}
