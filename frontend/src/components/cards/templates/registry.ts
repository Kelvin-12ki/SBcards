import React from 'react';
import type { TemplateId } from '@/types/cardTemplate';

const templates: Record<TemplateId, React.LazyExoticComponent<any>> = {
  classic: React.lazy(() => import('./ClassicTemplate')),
  'bold-wave': React.lazy(() => import('./BoldWaveTemplate')),
  corporate: React.lazy(() => import('./CorporateTemplate')),
  creative: React.lazy(() => import('./CreativeTemplate')),
  neon: React.lazy(() => import('./NeonTemplate')),
};

export function getTemplateComponent(id: TemplateId) {
  return templates[id] || templates.classic;
}
