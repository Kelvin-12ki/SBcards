import React, { useState } from 'react';
import type { Exhibitor } from '@/types/exhibitor';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export interface ExhibitorFormProps {
  onSubmit: (data: Partial<Exhibitor>) => void;
  initialData?: Partial<Exhibitor>;
  loading?: boolean;
}

const ExhibitorForm: React.FC<ExhibitorFormProps> = ({ onSubmit, initialData, loading = false }) => {
  const [companyName, setCompanyName] = useState(initialData?.companyName || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [website, setWebsite] = useState(initialData?.website || '');
  const [productsInput, setProductsInput] = useState(initialData?.products?.join(', ') || '');
  const [servicesInput, setServicesInput] = useState(initialData?.services?.join(', ') || '');
  const [boothNumber, setBoothNumber] = useState(initialData?.boothNumber || '');
  const [boothLocation, setBoothLocation] = useState(initialData?.boothLocation || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;

    const products = productsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const services = servicesInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const data: Partial<Exhibitor> = {
      companyName: companyName.trim(),
      description: description.trim() || undefined,
      website: website.trim() || undefined,
      products,
      services,
      boothNumber: boothNumber.trim() || undefined,
      boothLocation: boothLocation.trim() || undefined,
    };

    onSubmit(data);
  };

  const isValid = companyName.trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Company Name *"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        placeholder="Company name"
        required
      />

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of the company"
          rows={3}
          className="w-full rounded-xl border border-border-subtle bg-surface-2 px-3.5 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold resize-none"
        />
      </div>

      <Input
        label="Website"
        type="url"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        placeholder="https://example.com"
      />

      <Input
        label="Products"
        value={productsInput}
        onChange={(e) => setProductsInput(e.target.value)}
        placeholder="comma, separated, products"
      />

      <Input
        label="Services"
        value={servicesInput}
        onChange={(e) => setServicesInput(e.target.value)}
        placeholder="comma, separated, services"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Booth Number"
          value={boothNumber}
          onChange={(e) => setBoothNumber(e.target.value)}
          placeholder="e.g. A12"
        />
        <Input
          label="Booth Location"
          value={boothLocation}
          onChange={(e) => setBoothLocation(e.target.value)}
          placeholder="e.g. Main Hall"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="submit" loading={loading} disabled={!isValid}>
          {initialData ? 'Update Exhibitor' : 'Add Exhibitor'}
        </Button>
      </div>
    </form>
  );
};

export default ExhibitorForm;
