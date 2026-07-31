import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyOrganizations, createOrganization } from '@/api/organizations';
import type { Organization } from '@/types/organization';
import OrganizationCard from '@/components/organizations/OrganizationCard';
import OrganizationForm from '@/components/organizations/OrganizationForm';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { showApiError } from '@/utils/errorHandler';
import toast from 'react-hot-toast';

const OrganizationsPage: React.FC = () => {
  const navigate = useNavigate();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const data = await getMyOrganizations();
        setOrganizations(data);
      } catch (err: any) {
        showApiError(err, 'Failed to load organizations.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrgs();
  }, []);

  const handleCreate = async (data: { name: string; description?: string; website?: string }) => {
    setCreating(true);
    try {
      const org = await createOrganization(data);
      setOrganizations((prev) => [org, ...prev]);
      toast.success('Organization created!');
      setCreateModalOpen(false);
    } catch (err: any) {
      showApiError(err, 'Failed to create organization.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-gradient-gold">
          My Organizations
        </h1>
        <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Organization
        </Button>
      </div>

      {/* List */}
      {organizations.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          }
          title="No organizations yet"
          description="Create one to get started!"
          action={{ label: 'Create Organization', onClick: () => setCreateModalOpen(true) }}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <OrganizationCard
              key={org.id}
              organization={org}
              onClick={() => navigate(`/organizations/${org.id}`)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Organization"
        size="lg"
      >
        <OrganizationForm onSubmit={handleCreate} loading={creating} />
      </Modal>
    </div>
  );
};

export default OrganizationsPage;
