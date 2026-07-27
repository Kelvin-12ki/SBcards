export interface CardTemplateField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'color' | 'image';
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

export interface CardTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  fields: CardTemplateField[];
  defaultTheme?: string;
}

export const PLACEHOLDER_TEMPLATES: CardTemplate[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'A timeless business card layout with a clean, professional look.',
    fields: [
      { key: 'fullName', label: 'Full Name', type: 'text', required: true, placeholder: 'John Doe' },
      { key: 'headline', label: 'Headline', type: 'text', placeholder: 'Software Engineer' },
      { key: 'company', label: 'Company', type: 'text', placeholder: 'Acme Corp' },
      { key: 'email', label: 'Email', type: 'text', placeholder: 'john@example.com' },
      { key: 'phone', label: 'Phone', type: 'text', placeholder: '+1 234 567 890' },
      { key: 'bio', label: 'Bio', type: 'textarea', placeholder: 'Tell people about yourself...' },
    ],
    defaultTheme: 'classic',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'A sleek, contemporary design with bold colors and gradients.',
    fields: [
      { key: 'fullName', label: 'Full Name', type: 'text', required: true, placeholder: 'Jane Smith' },
      { key: 'headline', label: 'Headline', type: 'text', placeholder: 'Product Designer' },
      { key: 'company', label: 'Company', type: 'text', placeholder: 'Design Studio' },
      { key: 'email', label: 'Email', type: 'text', placeholder: 'jane@example.com' },
      { key: 'website', label: 'Website', type: 'text', placeholder: 'https://janesmith.dev' },
      { key: 'skills', label: 'Skills', type: 'text', placeholder: 'UX, UI, Prototyping' },
    ],
    defaultTheme: 'modern',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'A clean, minimal design focused on essential contact information.',
    fields: [
      { key: 'fullName', label: 'Full Name', type: 'text', required: true, placeholder: 'Alex Johnson' },
      { key: 'company', label: 'Company', type: 'text', placeholder: 'Startup Inc.' },
      { key: 'email', label: 'Email', type: 'text', placeholder: 'alex@example.com' },
      { key: 'phone', label: 'Phone', type: 'text', placeholder: '+1 987 654 321' },
    ],
    defaultTheme: 'minimal',
  },
];
