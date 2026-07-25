import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getOrganization, getOrganizationMembers, updateOrganization, addOrganizationMember, removeMember, updateMemberRole } from '@/api/organizations';
import type { Organization, OrganizationMembership, OrgRole } from '@/types/organization';
import OrganizationForm from '@/components/organizations/OrganizationForm';
import MemberList from '@/components/organizations/MemberList';
import InviteMemberModal from '@/components/organizations/InviteMemberModal';
import RoleGate from '@/components/auth/RoleGate';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

type Tab = 'overview' | 'members' | 'settings';

const OrganizationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [orgData, membersData] = await Promise.all([
        getOrganization(id),
        getOrganizationMembers(id),
      ]);
      setOrg(orgData);
      setMembers(membersData);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load organization.');
      navigate('/organizations');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateOrg = async (data: { name: string; description?: string; website?: string }) => {
    if (!org) return;
    setSaving(true);
    try {
      const updated = await updateOrganization(org.id, data);
      setOrg(updated);
      toast.success('Organization updated!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update organization.');
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async (data: { userId: string; role: OrgRole }) => {
    if (!org) return;
    try {
      const membership = await addOrganizationMember(org.id, data);
      setMembers((prev) => [...prev, membership]);
      toast.success('Member invited!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to invite member.');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!org) return;
    try {
      await removeMember(org.id, userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      toast.success('Member removed.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove member.');
    }
  };

  const handleRoleChange = async (userId: string, role: OrgRole) => {
    if (!org) return;
    try {
      const updated = await updateMemberRole(org.id, userId, role);
      setMembers((prev) => prev.map((m) => (m.userId === userId ? updated : m)));
      toast.success('Role updated!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update role.');
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'members', label: 'Members' },
    { key: 'settings', label: 'Settings' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!org) return null;

  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      {/* Back link */}
      <Link
        to="/organizations"
        className="inline-flex items-center gap-1.5 text-sm text-neon-cyan hover:text-neon-cyan/80 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Organizations
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        {org.logoUrl ? (
          <img src={org.logoUrl} alt={org.name} className="h-16 w-16 rounded-xl object-cover" />
        ) : (
          <div className="gradient-magical flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold text-white">
            {org.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
        )}
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-gradient-gold">
            {org.name}
          </h1>
          <p className="text-sm text-text-secondary mt-1">{org.slug}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border-subtle">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-gold text-gold'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="card-magical rounded-2xl border border-border-subtle p-6 space-y-5 max-w-2xl">
          <div>
            <h3 className="text-sm font-medium text-text-secondary">Description</h3>
            <p className="text-text-primary mt-1">{org.description || 'No description provided.'}</p>
          </div>
          {org.website && (
            <div>
              <h3 className="text-sm font-medium text-text-secondary">Website</h3>
              <a
                href={org.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neon-cyan hover:text-neon-cyan/80 mt-1 inline-block"
              >
                {org.website}
              </a>
            </div>
          )}
          {org.primaryColor && (
            <div>
              <h3 className="text-sm font-medium text-text-secondary">Primary Color</h3>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="h-6 w-6 rounded-full border border-border-subtle"
                  style={{ backgroundColor: org.primaryColor }}
                />
                <span className="text-sm text-text-primary">{org.primaryColor}</span>
              </div>
            </div>
          )}
          {org.secondaryColor && (
            <div>
              <h3 className="text-sm font-medium text-text-secondary">Secondary Color</h3>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="h-6 w-6 rounded-full border border-border-subtle"
                  style={{ backgroundColor: org.secondaryColor }}
                />
                <span className="text-sm text-text-primary">{org.secondaryColor}</span>
              </div>
            </div>
          )}
          <div>
            <h3 className="text-sm font-medium text-text-secondary">Created</h3>
            <p className="text-text-primary mt-1">{new Date(org.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="pt-2 text-xs text-text-tertiary">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-5 max-w-2xl">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-gradient-gold">
              Members ({members.length})
            </h2>
            <RoleGate role="org_admin">
              <Button variant="primary" size="sm" onClick={() => setInviteModalOpen(true)}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Invite Member
              </Button>
            </RoleGate>
          </div>
          <MemberList
            members={members}
            onRemove={handleRemoveMember}
            onRoleChange={handleRoleChange}
            isOrgAdmin={true}
          />
          <InviteMemberModal
            isOpen={inviteModalOpen}
            onClose={() => setInviteModalOpen(false)}
            onSubmit={handleInvite}
          />
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-2xl">
          <RoleGate
            role="org_admin"
            fallback={
              <div className="card-magical rounded-2xl border border-border-subtle p-6 text-center">
                <p className="text-sm text-text-secondary">
                  You need admin privileges to edit organization settings.
                </p>
              </div>
            }
          >
            <OrganizationForm
              initialData={{
                name: org.name,
                description: org.description,
                website: org.website,
              }}
              onSubmit={handleUpdateOrg}
              loading={saving}
            />
          </RoleGate>
        </div>
      )}
    </div>
  );
};

export default OrganizationDetailPage;
