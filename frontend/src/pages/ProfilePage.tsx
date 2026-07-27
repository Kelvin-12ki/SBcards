import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/auth/useAuth';
import { getCards } from '@/api/cards';
import { updateProfile, uploadProfilePhoto } from '@/api/users';
import type { Card } from '@/types/card';
import CardPreview from '@/components/cards/CardPreview';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import CardForm from '@/components/cards/CardForm';
import { updateCard } from '@/api/cards';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [editCardModalOpen, setEditCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [saving, setSaving] = useState(false);

  // Profile edit state
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    company: '',
    jobRole: '',
    industry: '',
    bio: '',
    whatsapp: '',
    portfolioUrl: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // Photo upload state
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultCard = cards.find((c) => c.isDefault) || cards[0];

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const data = await getCards();
        setCards(data);
      } catch (err) {
        console.error('Failed to load cards:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, []);

  const handleEditCard = () => {
    if (defaultCard) {
      setEditingCard(defaultCard);
      setEditCardModalOpen(true);
    } else {
      navigate('/cards/new');
    }
  };

  const handleSaveCard = async (data: Partial<Card>) => {
    if (!editingCard) return;
    setSaving(true);
    try {
      const updated = await updateCard(editingCard.id, data);
      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toast.success('Card updated!');
      setEditCardModalOpen(false);
      setEditingCard(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update card.');
    } finally {
      setSaving(false);
    }
  };

  const openEditProfile = () => {
    setProfileForm({
      displayName: user?.displayName || '',
      company: user?.company || '',
      jobRole: user?.jobRole || '',
      industry: user?.industry || '',
      bio: user?.bio || '',
      whatsapp: user?.whatsapp || '',
      portfolioUrl: user?.portfolioUrl || '',
    });
    setAvatarUrl(user?.avatarUrl || '');
    setEditProfileModalOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setPhotoUploading(true);
    try {
      const url = await uploadProfilePhoto(file, user.id);
      setAvatarUrl(url);
      toast.success('Photo uploaded! Save your profile to confirm.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload photo.');
    } finally {
      setPhotoUploading(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      await updateProfile({ ...profileForm, avatarUrl: avatarUrl || undefined });
      await refreshUser();
      toast.success('Profile updated!');
      setEditProfileModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() || '?';

  return (
    <div className="max-w-2xl space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="relative">
            <Avatar size="xl" src={user?.avatarUrl} fallbackInitials={initials} className="shadow-lg shadow-neon-purple/30" />
            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-surface-1 bg-success animate-glow-pulse" />
          </div>
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-gradient-gold">
              {user?.displayName || 'Your Profile'}
            </h1>
            <p className="text-base text-text-secondary">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              {user?.company && <span className="text-sm text-text-tertiary">{user.company}</span>}
              {user?.jobRole && (
                <>
                  <span className="text-text-tertiary">·</span>
                  <span className="text-sm text-text-tertiary">{user.jobRole}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Link
            to="/qr"
            className="inline-flex items-center gap-1.5 text-sm text-neon-cyan hover:text-neon-cyan/80 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" />
            </svg>
            My QR Code
          </Link>
          <Button variant="secondary" size="sm" onClick={openEditProfile}>
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Card Section */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-gradient-gold">
            {defaultCard ? 'Default Card' : 'No Card'}
          </h2>
          <Button variant="primary" size="sm" onClick={handleEditCard}>
            {defaultCard ? 'Edit Card' : 'Create Card'}
          </Button>
        </div>

        {defaultCard ? (
          <CardPreview card={defaultCard} className="max-w-md" />
        ) : (
          <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6 text-center">
            <p className="text-sm text-text-secondary">
              You haven&apos;t created any cards yet.
            </p>
          </div>
        )}
      </section>

      {/* Rich Profile Fields */}
      {user?.industry && (
        <section className="card-magical rounded-2xl border border-border-subtle p-5">
          <h3 className="text-sm font-medium text-text-secondary">Industry</h3>
          <p className="text-text-primary mt-1">{user.industry}</p>
        </section>
      )}

      {(user?.skills && user.skills.length > 0) && (
        <section className="card-magical rounded-2xl border border-border-subtle p-5 space-y-3">
          <h3 className="text-sm font-medium text-text-secondary">Skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {user.skills.map((skill) => (
              <Badge key={skill} variant="primary">{skill}</Badge>
            ))}
          </div>
        </section>
      )}

      {(user?.interests && user.interests.length > 0) && (
        <section className="card-magical rounded-2xl border border-border-subtle p-5 space-y-3">
          <h3 className="text-sm font-medium text-text-secondary">Interests</h3>
          <div className="flex flex-wrap gap-1.5">
            {user.interests.map((interest) => (
              <Badge key={interest} variant="default">{interest}</Badge>
            ))}
          </div>
        </section>
      )}

      {(user?.lookingFor && user.lookingFor.length > 0) && (
        <section className="card-magical rounded-2xl border border-border-subtle p-5 space-y-3">
          <h3 className="text-sm font-medium text-text-secondary">Looking For</h3>
          <div className="flex flex-wrap gap-1.5">
            {user.lookingFor.map((item) => (
              <Badge key={item} variant="warning">{item}</Badge>
            ))}
          </div>
        </section>
      )}

      {(user?.offering && user.offering.length > 0) && (
        <section className="card-magical rounded-2xl border border-border-subtle p-5 space-y-3">
          <h3 className="text-sm font-medium text-text-secondary">Offering</h3>
          <div className="flex flex-wrap gap-1.5">
            {user.offering.map((item) => (
              <Badge key={item} variant="success">{item}</Badge>
            ))}
          </div>
        </section>
      )}

      {user?.bio && (
        <section className="card-magical rounded-2xl border border-border-subtle p-5">
          <h3 className="text-sm font-medium text-text-secondary">Bio</h3>
          <p className="text-text-primary mt-1 text-sm">{user.bio}</p>
        </section>
      )}

      {(user?.whatsapp || user?.portfolioUrl || (user?.socialLinks && user.socialLinks.length > 0)) && (
        <section className="card-magical rounded-2xl border border-border-subtle p-5 space-y-3">
          <h3 className="text-sm font-medium text-text-secondary">Contact & Links</h3>
          {user.whatsapp && (
            <div className="flex items-center gap-2 text-sm">
              <svg className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              <a href={`https://wa.me/${user.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:text-neon-cyan/80">
                {user.whatsapp}
              </a>
            </div>
          )}
          {user.portfolioUrl && (
            <div className="flex items-center gap-2 text-sm">
              <svg className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.25a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
              <a href={user.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:text-neon-cyan/80 truncate">
                {user.portfolioUrl}
              </a>
            </div>
          )}
          {user.socialLinks?.map((link, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <svg className="h-4 w-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.25a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:text-neon-cyan/80 truncate">
                {link.label}
              </a>
            </div>
          ))}
        </section>
      )}

      {/* Edit Card Modal */}
      <Modal
        isOpen={editCardModalOpen}
        onClose={() => { setEditCardModalOpen(false); setEditingCard(null); }}
        title="Edit Card"
        size="xl"
      >
        {editingCard && (
          <CardForm initialData={editingCard} onSubmit={handleSaveCard} loading={saving} />
        )}
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={editProfileModalOpen}
        onClose={() => setEditProfileModalOpen(false)}
        title="Edit Profile"
        size="lg"
      >
        <div className="space-y-4">
          {/* Photo Upload */}
          <div className="flex flex-col items-center gap-3 pb-4 border-b border-border-subtle">
            <div className="relative">
              <Avatar
                size="xl"
                src={avatarUrl || undefined}
                fallbackInitials={
                  user?.displayName
                    ? user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                    : user?.email?.charAt(0).toUpperCase() || '?'
                }
                className="shadow-lg shadow-neon-purple/30 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              />
              {photoUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                  <Spinner size="sm" />
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={photoUploading}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoUploading}
              >
                {avatarUrl ? 'Change Photo' : 'Upload Photo'}
              </Button>
              {avatarUrl && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleRemovePhoto}
                  disabled={photoUploading}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>

          <Input
            label="Display Name"
            value={profileForm.displayName}
            onChange={(e) => setProfileForm((p) => ({ ...p, displayName: e.target.value }))}
          />
          <Input
            label="Company"
            value={profileForm.company}
            onChange={(e) => setProfileForm((p) => ({ ...p, company: e.target.value }))}
          />
          <Input
            label="Job Role"
            value={profileForm.jobRole}
            onChange={(e) => setProfileForm((p) => ({ ...p, jobRole: e.target.value }))}
          />
          <Input
            label="Industry"
            value={profileForm.industry}
            onChange={(e) => setProfileForm((p) => ({ ...p, industry: e.target.value }))}
          />
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Bio</label>
            <textarea
              value={profileForm.bio}
              onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-border-subtle bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary placeholder-text-tertiary transition-colors duration-200 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/50"
            />
          </div>
          <Input
            label="WhatsApp"
            value={profileForm.whatsapp}
            onChange={(e) => setProfileForm((p) => ({ ...p, whatsapp: e.target.value }))}
          />
          <Input
            label="Portfolio URL"
            value={profileForm.portfolioUrl}
            onChange={(e) => setProfileForm((p) => ({ ...p, portfolioUrl: e.target.value }))}
          />
          <div className="flex justify-end pt-2">
            <Button variant="primary" size="md" loading={profileSaving} onClick={handleSaveProfile}>
              Save Profile
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProfilePage;
