export type TemplateId = 'classic' | 'bold-wave' | 'corporate' | 'creative' | 'neon';

export interface CardTemplateDef {
  id: TemplateId;
  name: string;
  description: string;
  accentColors: string[];
  thumbnail: string; // CSS gradient for picker thumbnail
}

export const TEMPLATES: CardTemplateDef[] = [
  { id: 'classic', name: 'Classic', description: 'Clean geometric design', accentColors: ['#D4A853', '#0A0A0B'], thumbnail: 'linear-gradient(135deg, #0A0A0B 60%, #D4A853 60%)' },
  { id: 'bold-wave', name: 'Bold Wave', description: 'Dynamic red waves on dark', accentColors: ['#E63946', '#1A1A2E', '#FFFFFF'], thumbnail: 'linear-gradient(135deg, #1A1A2E 50%, #E63946 50%, #FFFFFF 80%)' },
  { id: 'corporate', name: 'Corporate', description: 'Professional gray with blue accents', accentColors: ['#2D3436', '#0984E3'], thumbnail: 'linear-gradient(135deg, #2D3436 60%, #0984E3 60%)' },
  { id: 'creative', name: 'Creative', description: 'Bold split-panel with orange accents', accentColors: ['#000000', '#F39C12', '#FFFFFF'], thumbnail: 'linear-gradient(135deg, #000000 50%, #FFFFFF 50%)' },
  { id: 'neon', name: 'Neon', description: 'Vibrant gradient streaks on dark', accentColors: ['#0D1B2A', '#FF6EC7', '#3B82F6', '#00F5FF'], thumbnail: 'linear-gradient(135deg, #0D1B2A 40%, #FF6EC7 60%, #00F5FF 80%)' },
];

export function getTemplateById(id: string): CardTemplateDef {
  return TEMPLATES.find(t => t.id === id) || TEMPLATES[0];
}
