import { cn } from '@/lib/utils/utils';

type SkeletonShape = 'block' | 'text' | 'circle' | 'avatar' | 'icon';

interface LoadingSkeletonProps {
  shape?: SkeletonShape;
  count?: number;
  width?: string;
  height?: string;
  className?: string;
  gap?: string;
  animated?: boolean;
}

const shapeClasses: Record<SkeletonShape, string> = {
  block: 'rounded-lg',
  text: 'rounded h-4 w-full',
  circle: 'rounded-full',
  avatar: 'rounded-full w-10 h-10',
  icon: 'rounded w-5 h-5',
};

export function LoadingSkeleton({
  shape = 'block',
  count = 1,
  width,
  height,
  className,
  gap = 'gap-2',
  animated = true,
}: LoadingSkeletonProps) {
  const items = Array.from({ length: count });
  const shapeClass = shapeClasses[shape];

  return (
    <div className={cn(gap, 'flex flex-col')}>
      {items.map((_, idx) => (
        <div
          key={idx}
          className={cn(
            'bg-zinc-200 dark:bg-zinc-700',
            animated && 'animate-pulse',
            shapeClass,
            width,
            height,
            className,
          )}
        />
      ))}
    </div>
  );
}
