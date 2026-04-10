import clsx from 'clsx';
import type { TimeCategory } from '../types';
import { CATEGORY_BG } from '../types';

interface Props {
  category: TimeCategory;
  size?: 'sm' | 'md';
}

export function CategoryBadge({ category, size = 'sm' }: Props) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        CATEGORY_BG[category],
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      {category}
    </span>
  );
}
