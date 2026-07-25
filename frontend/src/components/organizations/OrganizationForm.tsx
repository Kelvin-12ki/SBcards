import React, { useState, type FormEvent } from 'react';
import { cn } from '@/utils/helpers';
import type { Organization } from '@/types/organization';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export interface OrganizationFormProps {
  onSubmit: (data: { name: string; description?: string; website?: string }) => void;
  initialData?: Partial<Organization>;
  loading?: boolean;
  className?: string;
}

const OrganizationForm: React.FC<OrganizationFormProps> = ({
  onSubmit,
  initialData,
  loading = false,
  className,
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [website, setWebsite] = useState(initialData?.website || '');
  const [nameError, setNameError] = useState('');

  const validate = (): boolean => {
    if (!name.trim()) {
      setNameError('Organization name is required');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      website: website.trim() || undefined,
    });
  };

  return (
    <div className={cn('card-magical rounded-2xl p-6', className)}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Organization Name *"
          placeholder="My Organization"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={nameError}
        />

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A short description of your organization..."
            rows={3}
            className="w-full rounded-xl border border-border-subtle bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary placeholder-text-tertiary transition-colors duration-200 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/50"
          />
        </div>

        <Input
          label="Website"
          type="url"
          placeholder="https://example.com"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="submit" loading={loading} size="lg">
            {initialData ? 'Update Organization' : 'Create Organization'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default OrganizationForm;
