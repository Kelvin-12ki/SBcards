import React, { Suspense } from 'react';
import { cn } from '@/utils/helpers';
import type { Card } from '@/types/card';
import type { TemplateId } from '@/types/cardTemplate';
import { getTemplateComponent } from './templates/registry';
import ClassicTemplate from './templates/ClassicTemplate';

export interface CardPreviewProps {
  card: Partial<Card>;
  className?: string;
}

const CardPreview: React.FC<CardPreviewProps> = ({ card, className }) => {
  const themeId: TemplateId = (card.theme as TemplateId) || 'classic';
  const TemplateComponent = getTemplateComponent(themeId);

  return (
    <Suspense
      fallback={
        <div className={cn('w-full aspect-[1.75/1]', className)}>
          <ClassicTemplate card={card} />
        </div>
      }
    >
      <TemplateComponent card={card} className={className} />
    </Suspense>
  );
};

export default CardPreview;
