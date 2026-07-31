import React from 'react';
import { Download } from 'lucide-react';
import type { Card } from '@/types/card';
import { downloadVCard } from '@/utils/vcard';
import Button from './Button';
import { cn } from '@/utils/helpers';

interface SaveContactButtonProps {
  card: Card;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SaveContactButton: React.FC<SaveContactButtonProps> = ({
  card,
  className,
  size = 'md',
}) => (
  <Button
    variant="secondary"
    size={size}
    className={cn('flex items-center justify-center gap-2', className)}
    onClick={() => downloadVCard(card)}
  >
    <Download className="h-4 w-4" />
    Save Contact
  </Button>
);

export default SaveContactButton;
