import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { updateProfile } from '@/api/users';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { showApiError } from '@/utils/errorHandler';

type WizardStep = 1 | 2 | 3;

interface Step1Data {
  displayName: string;
  company: string;
  jobRole: string;
  industry: string;
}

interface Step2Data {
  skills: string[];
  interests: string[];
  lookingFor: string[];
  offering: string[];
}

interface Step3Data {
  bio: string;
  whatsapp: string;
  portfolioUrl: string;
  socialLinks: { label: string; url: string }[];
}

const totalSteps = 3;

// Reusable chip input
interface ChipInputProps {
  label: string;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
}

const ChipInput: React.FC<ChipInputProps> = ({ label, items, onAdd, onRemove }) => {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const val = input.trim();
    if (val && !items.includes(val)) {
      onAdd(val);
    }
    setInput('');
  };

  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {items.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 px-2.5 py-1 text-xs font-medium text-neon-cyan"
            >
              {item}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-white/10 transition-colors"
                aria-label={`Remove ${item}`}
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={`Add ${label.toLowerCase()}...`}
          className="flex-1 rounded-xl border border-border-subtle bg-surface-2 px-3.5 py-2 text-sm text-text-primary placeholder-text-tertiary transition-colors duration-200 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/50"
        />
        <Button type="button" variant="secondary" size="sm" onClick={handleAdd}>
          Add
        </Button>
      </div>
    </div>
  );
};

const ProfileSetupPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<WizardStep>(1);

  // Step 1
  const [step1, setStep1] = useState<Step1Data>({
    displayName: user?.displayName || '',
    company: user?.company || '',
    jobRole: user?.jobRole || '',
    industry: user?.industry || '',
  });

  // Step 2
  const [step2, setStep2] = useState<Step2Data>({
    skills: user?.skills || [],
    interests: user?.interests || [],
    lookingFor: user?.lookingFor || [],
    offering: user?.offering || [],
  });

  // Step 3
  const [step3, setStep3] = useState<Step3Data>({
    bio: user?.bio || '',
    whatsapp: user?.whatsapp || '',
    portfolioUrl: user?.portfolioUrl || '',
    socialLinks: user?.socialLinks || [],
  });
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const [saving, setSaving] = useState(false);

  const addSocialLink = () => {
    if (newLinkLabel.trim() && newLinkUrl.trim()) {
      setStep3((prev) => ({
        ...prev,
        socialLinks: [
          ...prev.socialLinks,
          { label: newLinkLabel.trim(), url: newLinkUrl.trim() },
        ],
      }));
      setNewLinkLabel('');
      setNewLinkUrl('');
    }
  };

  const removeSocialLink = (index: number) => {
    setStep3((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await updateProfile({
        ...step1,
        ...step2,
        ...step3,
        profileComplete: true,
      });
      toast.success('Profile complete!');
      navigate('/dashboard');
    } catch (err: any) {
      showApiError(err, 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const canProceedStep1 = step1.displayName.trim().length > 0;

  const progressPercent = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-background p-6 space-y-8 max-w-xl mx-auto">
      {/* Header */}
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-gradient-gold text-center">
        Complete Your Profile
      </h1>
      <p className="text-center text-sm text-text-secondary -mt-4">
        Step {step} of {totalSteps}
      </p>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full bg-surface-2 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold to-gold-strong transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="card-magical rounded-2xl border border-border-subtle p-6 space-y-5">
          <h2 className="font-display text-lg font-bold text-gradient-gold">Basic Information</h2>
          <Input
            label="Display Name *"
            placeholder="Your full name"
            value={step1.displayName}
            onChange={(e) => setStep1((p) => ({ ...p, displayName: e.target.value }))}
          />
          <Input
            label="Company"
            placeholder="Company name"
            value={step1.company}
            onChange={(e) => setStep1((p) => ({ ...p, company: e.target.value }))}
          />
          <Input
            label="Job Role"
            placeholder="e.g. Software Engineer"
            value={step1.jobRole}
            onChange={(e) => setStep1((p) => ({ ...p, jobRole: e.target.value }))}
          />
          <Input
            label="Industry"
            placeholder="e.g. Technology"
            value={step1.industry}
            onChange={(e) => setStep1((p) => ({ ...p, industry: e.target.value }))}
          />

          <div className="flex justify-between pt-2">
            <div />
            <Button
              variant="primary"
              size="md"
              disabled={!canProceedStep1}
              onClick={() => setStep(2)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Professional */}
      {step === 2 && (
        <div className="card-magical rounded-2xl border border-border-subtle p-6 space-y-5">
          <h2 className="font-display text-lg font-bold text-gradient-gold">Professional Details</h2>

          <ChipInput
            label="Skills"
            items={step2.skills}
            onAdd={(v) => setStep2((p) => ({ ...p, skills: [...p.skills, v] }))}
            onRemove={(i) => setStep2((p) => ({ ...p, skills: p.skills.filter((_, idx) => idx !== i) }))}
          />

          <ChipInput
            label="Interests"
            items={step2.interests}
            onAdd={(v) => setStep2((p) => ({ ...p, interests: [...p.interests, v] }))}
            onRemove={(i) => setStep2((p) => ({ ...p, interests: p.interests.filter((_, idx) => idx !== i) }))}
          />

          <ChipInput
            label="Looking For"
            items={step2.lookingFor}
            onAdd={(v) => setStep2((p) => ({ ...p, lookingFor: [...p.lookingFor, v] }))}
            onRemove={(i) => setStep2((p) => ({ ...p, lookingFor: p.lookingFor.filter((_, idx) => idx !== i) }))}
          />

          <ChipInput
            label="Offering"
            items={step2.offering}
            onAdd={(v) => setStep2((p) => ({ ...p, offering: [...p.offering, v] }))}
            onRemove={(i) => setStep2((p) => ({ ...p, offering: p.offering.filter((_, idx) => idx !== i) }))}
          />

          <div className="flex justify-between pt-2">
            <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setStep(3)}>
                Skip
              </Button>
              <Button variant="primary" size="md" onClick={() => setStep(3)}>
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Contact */}
      {step === 3 && (
        <div className="card-magical rounded-2xl border border-border-subtle p-6 space-y-5">
          <h2 className="font-display text-lg font-bold text-gradient-gold">Contact & Social</h2>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Bio</label>
            <textarea
              value={step3.bio}
              onChange={(e) => setStep3((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Tell others about yourself..."
              rows={3}
              className="w-full rounded-xl border border-border-subtle bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary placeholder-text-tertiary transition-colors duration-200 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/50"
            />
          </div>

          <Input
            label="WhatsApp"
            placeholder="+1 234 567 8900"
            value={step3.whatsapp}
            onChange={(e) => setStep3((p) => ({ ...p, whatsapp: e.target.value }))}
          />

          <Input
            label="Portfolio URL"
            type="url"
            placeholder="https://yourportfolio.com"
            value={step3.portfolioUrl}
            onChange={(e) => setStep3((p) => ({ ...p, portfolioUrl: e.target.value }))}
          />

          {/* Social Links */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Social Links</label>
            {step3.socialLinks.length > 0 && (
              <div className="space-y-2 mb-3">
                {step3.socialLinks.map((link, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm">
                    <span className="font-medium text-text-primary min-w-[80px]">{link.label}</span>
                    <span className="text-text-tertiary truncate flex-1">{link.url}</span>
                    <button
                      type="button"
                      onClick={() => removeSocialLink(i)}
                      className="text-text-tertiary hover:text-danger transition-colors"
                      aria-label={`Remove ${link.label}`}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newLinkLabel}
                onChange={(e) => setNewLinkLabel(e.target.value)}
                placeholder="Label (e.g. LinkedIn)"
                className="flex-1 rounded-xl border border-border-subtle bg-surface-2 px-3.5 py-2 text-sm text-text-primary placeholder-text-tertiary transition-colors duration-200 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/50"
              />
              <input
                type="url"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                placeholder="URL"
                className="flex-1 rounded-xl border border-border-subtle bg-surface-2 px-3.5 py-2 text-sm text-text-primary placeholder-text-tertiary transition-colors duration-200 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/50"
              />
              <Button type="button" variant="secondary" size="sm" onClick={addSocialLink}>
                Add
              </Button>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button variant="primary" size="md" loading={saving} onClick={handleSubmit}>
              Complete Profile
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSetupPage;
