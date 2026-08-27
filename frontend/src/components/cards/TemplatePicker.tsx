import React from 'react';
import { cn } from '@/utils/helpers';
import type { TemplateId } from '@/types/cardTemplate';
import { TEMPLATES } from '@/types/cardTemplate';

export interface TemplatePickerProps {
  selected: TemplateId;
  onSelect: (id: TemplateId) => void;
}

const TemplatePicker: React.FC<TemplatePickerProps> = ({ selected, onSelect }) => {
  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-gradient-gold uppercase tracking-wider">
        Choose Your Template
      </h3>

      {/* Horizontal scroll on mobile, grid on desktop */}
      <div
        className={cn(
          'flex gap-3 overflow-x-auto pb-2',
          'template-picker-scroll',
          'lg:grid lg:grid-cols-5 lg:overflow-x-visible',
        )}
      >
        {TEMPLATES.map((template) => {
          const isSelected = selected === template.id;

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template.id)}
              className={cn(
                'relative flex-shrink-0 w-40 lg:w-auto rounded-xl overflow-hidden transition-all duration-300',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                isSelected && 'scale-[1.03] border-glow-gold',
                !isSelected && 'opacity-70 hover:opacity-90',
              )}
              style={{ border: isSelected ? '2px solid #2563EB' : '2px solid transparent' }}
            >
              {/* Thumbnail gradient */}
              <div
                className="w-full h-20 rounded-t-xl"
                style={{ background: template.thumbnail }}
              />

              {/* Bottom info */}
              <div className="bg-surface-1 px-3 py-2.5 rounded-b-xl">
                <p className="text-xs font-semibold text-text-primary text-left truncate">
                  {template.name}
                </p>
                <p className="text-[10px] text-text-tertiary text-left leading-tight mt-0.5 truncate">
                  {template.description}
                </p>

                {/* Accent color dots */}
                <div className="flex gap-1 mt-1.5">
                  {template.accentColors.map((color, i) => (
                    <span
                      key={i}
                      className="inline-block h-2.5 w-2.5 rounded-full border border-white/10"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TemplatePicker;
