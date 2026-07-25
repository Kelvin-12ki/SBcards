import React, { useState, useEffect, useCallback, useRef, type FormEvent } from 'react';
import { cn } from '@/utils/helpers';
import type { Card } from '@/types/card';
import { useAuth } from '@/auth/useAuth';
import { uploadCardPhoto } from '@/api/cards';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import CardPreview from './CardPreview';
import toast from 'react-hot-toast';

export interface CardFormProps {
  initialData?: Card;
  onSubmit: (data: Partial<Card>) => void;
  loading?: boolean;
  className?: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
}

const CardForm: React.FC<CardFormProps> = ({
  initialData,
  onSubmit,
  loading = false,
  className,
}) => {
  const [fullName, setFullName] = useState(initialData?.fullName || '');
  const [headline, setHeadline] = useState(initialData?.headline || '');
  const [company, setCompany] = useState(initialData?.company || '');
  const [role, setRole] = useState(initialData?.role || '');
  const [bio, setBio] = useState(initialData?.bio || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [website, setWebsite] = useState(initialData?.website || '');
  const [linkedinUrl, setLinkedinUrl] = useState(initialData?.linkedinUrl || '');
  const [twitterUrl, setTwitterUrl] = useState(initialData?.twitterUrl || '');
  const [skills, setSkills] = useState<{ name: string }[]>(
    initialData?.skills?.map((s) => ({ name: s.name })) || [],
  );
  const [skillInput, setSkillInput] = useState('');
  const [interests, setInterests] = useState<{ name: string }[]>(
    initialData?.interests?.map((i) => ({ name: i.name })) || [],
  );
  const [interestInput, setInterestInput] = useState('');
  const [isDefault, setIsDefault] = useState(initialData?.isDefault || false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [avatarUrl, setAvatarUrl] = useState(initialData?.avatarUrl || '');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFullName(initialData.fullName || '');
      setHeadline(initialData.headline || '');
      setCompany(initialData.company || '');
      setRole(initialData.role || '');
      setBio(initialData.bio || '');
      setEmail(initialData.email || '');
      setPhone(initialData.phone || '');
      setWebsite(initialData.website || '');
      setLinkedinUrl(initialData.linkedinUrl || '');
      setTwitterUrl(initialData.twitterUrl || '');
      setSkills(initialData.skills?.map((s) => ({ name: s.name })) || []);
      setInterests(initialData.interests?.map((i) => ({ name: i.name })) || []);
      setIsDefault(initialData.isDefault || false);
      setAvatarUrl(initialData.avatarUrl || '');
      setPhotoError('');
    }
  }, [initialData]);

  const addSkill = useCallback(() => {
    const trimmed = skillInput.trim();
    if (
      trimmed &&
      !skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      setSkills((prev) => [...prev, { name: trimmed }]);
    }
    setSkillInput('');
  }, [skillInput, skills]);

  const removeSkill = useCallback((index: number) => {
    setSkills((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addInterest = useCallback(() => {
    const trimmed = interestInput.trim();
    if (
      trimmed &&
      !interests.some((i) => i.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      setInterests((prev) => [...prev, { name: trimmed }]);
    }
    setInterestInput('');
  }, [interestInput, interests]);

  const removeInterest = useCallback((index: number) => {
    setInterests((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handlePhotoSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError('');
    setPhotoUploading(true);

    try {
      const url = await uploadCardPhoto(file, user?.id || 'anonymous');
      if (url) {
        setAvatarUrl(url);
        toast.success('Photo uploaded successfully!');
      } else {
        throw new Error('Upload returned no URL.');
      }
    } catch (err: any) {
      const message = err?.message || 'Failed to upload photo. Please try again.';
      setPhotoError(message);
      toast.error(message);
    } finally {
      setPhotoUploading(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [user]);

  const handleRemovePhoto = useCallback(() => {
    setAvatarUrl('');
    setPhotoError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      fullName: fullName.trim(),
      headline: headline.trim(),
      company: company.trim(),
      role: role.trim(),
      bio: bio.trim(),
      email: email.trim(),
      phone: phone.trim(),
      website: website.trim(),
      linkedinUrl: linkedinUrl.trim(),
      twitterUrl: twitterUrl.trim(),
      skills,
      interests,
      isDefault,
      avatarUrl: avatarUrl || undefined,
    });
  };

  // Build preview card object
  const previewCard: Partial<Card> = {
    fullName,
    headline,
    company,
    role,
    bio,
    email,
    phone,
    website,
    linkedinUrl,
    avatarUrl: avatarUrl || undefined,
    skills: skills.map((s, i) => ({ id: `preview-${i}`, name: s.name })),
    interests: interests.map((i, idx) => ({ id: `preview-int-${idx}`, name: i.name })),
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const handleInterestKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addInterest();
    }
  };

  return (
    <div className={cn('grid gap-8 lg:grid-cols-2', className)}>
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Profile Photo Upload */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
              className={cn(
                'group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed transition-all duration-200',
                avatarUrl
                  ? 'border-transparent'
                  : 'border-border-subtle hover:border-neon-cyan',
                photoUploading && 'cursor-wait opacity-60',
              )}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center text-text-tertiary group-hover:text-neon-cyan">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                </div>
              )}

              {/* Upload overlay on hover */}
              {avatarUrl && !photoUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                </div>
              )}

              {/* Loading spinner */}
              {photoUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-neon-cyan border-t-transparent" />
                </div>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text-secondary">Profile Photo</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoUploading}
                className="text-xs text-neon-cyan hover:text-neon-cyan/80 transition-colors disabled:opacity-50"
              >
                {avatarUrl ? 'Change' : 'Upload'}
              </button>
              {avatarUrl && (
                <>
                  <span className="text-border-subtle">|</span>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={photoUploading}
                    className="text-xs text-danger hover:text-danger/80 transition-colors disabled:opacity-50"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
            <span className="text-xs text-text-tertiary">JPG, PNG, WebP or GIF. Max 5MB.</span>
            {photoError && (
              <span className="text-xs text-danger">{photoError}</span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="Full Name *"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={errors.fullName}
          />
          <Input
            label="Headline"
            placeholder="Full-stack Developer & Designer"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Company"
              placeholder="Acme Inc."
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
            <Input
              label="Role"
              placeholder="Software Engineer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people about yourself..."
              rows={3}
              style={{ color: '#F5F5F7', WebkitTextFillColor: '#F5F5F7', caretColor: '#F5F5F7' }}
              className="w-full rounded-xl border border-border-subtle bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary placeholder-text-tertiary transition-colors duration-200 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/50"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-text-secondary">Contact Info</h3>
          <Input
            label="Email *"
            type="email"
            placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <Input
            label="Phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            label="Website"
            type="url"
            placeholder="https://johndoe.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
          <Input
            label="LinkedIn URL"
            type="url"
            placeholder="https://linkedin.com/in/johndoe"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
          />
          <Input
            label="Twitter URL"
            type="url"
            placeholder="https://twitter.com/johndoe"
            value={twitterUrl}
            onChange={(e) => setTwitterUrl(e.target.value)}
          />
        </div>

        {/* Skills tag input */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Skills
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {skills.map((skill, i) => (
              <Badge key={i} variant="primary" onRemove={() => removeSkill(i)}>
                {skill.name}
              </Badge>
            ))}
          </div>
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={handleSkillKeyDown}
            placeholder="Type a skill and press Enter"
            style={{ color: '#F5F5F7', WebkitTextFillColor: '#F5F5F7', caretColor: '#F5F5F7' }}
            className="w-full rounded-xl border border-border-subtle bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary placeholder-text-tertiary transition-colors duration-200 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/50"
          />
        </div>

        {/* Interests tag input */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Interests
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {interests.map((interest, i) => (
              <Badge key={i} variant="success" onRemove={() => removeInterest(i)}>
                {interest.name}
              </Badge>
            ))}
          </div>
          <input
            type="text"
            value={interestInput}
            onChange={(e) => setInterestInput(e.target.value)}
            onKeyDown={handleInterestKeyDown}
            placeholder="Type an interest and press Enter"
            style={{ color: '#F5F5F7', WebkitTextFillColor: '#F5F5F7', caretColor: '#F5F5F7' }}
            className="w-full rounded-xl border border-border-subtle bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary placeholder-text-tertiary transition-colors duration-200 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/50"
          />
        </div>

        {/* Default toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="sr-only"
            />
            <div
              className={cn(
                'h-5 w-9 rounded-full transition-colors',
                isDefault ? 'bg-gradient-to-r from-neon-cyan to-neon-purple' : 'bg-surface-3',
              )}
            >
              <div
                className={cn(
                  'h-4 w-4 rounded-full bg-white transition-transform duration-200',
                  isDefault ? 'translate-x-4' : 'translate-x-0.5',
                )}
                style={{ marginTop: '2px' }}
              />
            </div>
          </div>
          <span className="text-sm text-text-secondary">Set as default card</span>
        </label>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" loading={loading} size="lg">
            {initialData ? 'Update Card' : 'Create Card'}
          </Button>
        </div>
      </form>

      {/* Preview */}
      <div className="hidden lg:block">
        <div className="sticky top-6">
          <h3 className="mb-4 text-sm font-semibold text-text-secondary uppercase tracking-wider">
            Preview
          </h3>
          <CardPreview card={previewCard} />
        </div>
      </div>
    </div>
  );
};

export default CardForm;
